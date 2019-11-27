/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DateTime } from 'luxon';

import { AccountOperation } from '@dydxprotocol/solo/dist/src/modules/operate/AccountOperation';

import SoloLiquidator from '../../src/lib/solo-liquidator';
import AccountStore from '../../src/lib/account-store';
import MarketStore from '../../src/lib/market-store';
import LiquidationStore from '../../src/lib/liquidation-store';
import * as blockHelper from '../../src/helpers/block-helper';

import { getTestLiquidatableAccounts } from '../../__fixtures__/liquidtable-accounts';
import { getTestExpiredAccounts } from '../../__fixtures__/expired-accounts';
import { getTestMarkets } from '../../__fixtures__/markets';
import { BigNumber } from '@dydxprotocol/solo';
import { solo } from '../../src/helpers/solo';

import { FullyLiquidateExpiredAccount, LiquidateAccount } from '../../src/@types/liquidate';

jest.mock('@dydxprotocol/solo/dist/src/modules/operate/AccountOperation');
jest.mock('../../src/helpers/block-helper');

describe('solo-liquidator', () => {
    let accountStore: AccountStore;
    let marketStore: MarketStore;
    let liquidationStore;
    let soloLiquidator: SoloLiquidator;

    beforeEach(() => {
        jest.clearAllMocks();
        accountStore = new AccountStore();
        marketStore = new MarketStore();
        liquidationStore = new LiquidationStore();
        soloLiquidator = new SoloLiquidator(accountStore, marketStore, liquidationStore);

        const spy = jest.spyOn(blockHelper, 'getLatestBlockDateTime');
        spy.mockImplementation(() => Promise.resolve(DateTime.local()));
    });

    describe('#_liquidateAccounts', () => {
        it('Successfully liquidates accounts', async () => {
            process.env.ENABLE_EXPIRATIONS = 'true';

            const liquidatableAccounts = getTestLiquidatableAccounts();
            const expiredAccounts = getTestExpiredAccounts();
            const markets = getTestMarkets();
            accountStore.getLiquidatableAccounts = jest
                .fn()
                .mockImplementation(() => liquidatableAccounts);
            accountStore.getExpiredAccounts = jest.fn().mockImplementation(() => expiredAccounts);
            marketStore.getMarkets = jest.fn().mockImplementation(() => markets);
            solo.getters.isAccountLiquidatable = jest.fn().mockImplementation(() => true);

            let commitCount = 0;
            const liquidations: any[] = [];
            const liquidateExpiredV1s: FullyLiquidateExpiredAccount[] = [];
            const liquidateExpiredV2s: FullyLiquidateExpiredAccount[] = [];

            const AccountOperationMock = AccountOperation as jest.Mock;
            AccountOperationMock.mockImplementation(() => ({
                fullyLiquidateExpiredAccount: (...args: any) => {
                    liquidateExpiredV1s.push(args);
                },
                fullyLiquidateExpiredAccountV2: (...args: any) => {
                    const expiredArgs: FullyLiquidateExpiredAccount = {
                        primaryAccountOwner: args[0],
                        primaryAccountNumber: args[1],
                        expiredAccountOwner: args[2],
                        expiredAccountNumber: args[3],
                        expiredMarket: args[4],
                        expiryTimestamp: args[5],
                        blockTimestamp: args[6],
                        weis: args[7],
                        prices: args[8],
                        spreadPremiums: args[9],
                        collateralPreferences: args[10],
                    };
                    liquidateExpiredV2s.push(expiredArgs);
                },
                commit: () => {
                    commitCount += 1;
                    return true;
                },
            }));
            solo.liquidatorProxy.liquidate = jest.fn().mockImplementation((...args) => {
                const liquidArgs: LiquidateAccount = {
                    accountOwner: args[0],
                    accountNumber: args[1],
                    liquidOwner: args[2],
                    liquidNumber: args[3],
                    minLiquidatorRatio: args[4],
                    minValueLiquidated: args[5],
                    owedPreferences: args[6],
                    heldPreferences: args[7],
                    options: args[8],
                };
                liquidations.push(liquidArgs);
                return {
                    gas: 1,
                };
            });

            await soloLiquidator.liquidateAccounts();

            expect(liquidations.length).toBe(liquidatableAccounts.length);
            expect(commitCount).toBe(liquidateExpiredV2s.length);
            expect(liquidateExpiredV1s.length).toBe(0);
            expect(liquidateExpiredV2s.length).toBe(1);

            const sortedLiquidations: LiquidateAccount[] = liquidatableAccounts.map(account =>
                liquidations.find(
                    l =>
                        l.liquidOwner === account.owner &&
                        Number(l.liquidNumber) === Number(account.number),
                ),
            );

            expect(sortedLiquidations[0].accountOwner).toBe(process.env.LIQUIDATOR_ACCOUNT_OWNER);
            expect(sortedLiquidations[0].accountNumber.toFixed()).toBe(
                process.env.LIQUIDATOR_ACCOUNT_NUMBER,
            );
            expect(sortedLiquidations[0].minLiquidatorRatio.toFixed()).toBe(
                process.env.MIN_LIQUIDATOR_ACCOUNT_COLLATERALIZATION,
            );
            expect(sortedLiquidations[0].minValueLiquidated.toFixed()).toBe(
                new BigNumber(Number(process.env.MIN_VALUE_LIQUIDATED)).toFixed(),
            );
            expect(sortedLiquidations[0].owedPreferences).toEqual(
                process.env.LIQUIDATION_OWED_PREFERENCES?.split(',').map(p => new BigNumber(p)),
            );
            expect(sortedLiquidations[0].heldPreferences).toEqual(
                process.env.LIQUIDATION_COLLATERAL_PREFERENCES?.split(',').map(
                    p => new BigNumber(p),
                ),
            );

            expect(sortedLiquidations[1].accountOwner).toBe(process.env.LIQUIDATOR_ACCOUNT_OWNER);
            expect(sortedLiquidations[1].accountNumber.toFixed()).toBe(
                process.env.LIQUIDATOR_ACCOUNT_NUMBER,
            );
            expect(sortedLiquidations[1].minLiquidatorRatio.toFixed()).toBe(
                process.env.MIN_LIQUIDATOR_ACCOUNT_COLLATERALIZATION,
            );
            expect(sortedLiquidations[1].minValueLiquidated.toFixed()).toBe(
                new BigNumber(Number(process.env.MIN_VALUE_LIQUIDATED)).toFixed(),
            );
            expect(sortedLiquidations[1].owedPreferences).toEqual(
                process.env.LIQUIDATION_OWED_PREFERENCES?.split(',').map(p => new BigNumber(p)),
            );
            expect(sortedLiquidations[1].heldPreferences).toEqual(
                process.env.LIQUIDATION_COLLATERAL_PREFERENCES?.split(',').map(
                    p => new BigNumber(p),
                ),
            );

            expect(liquidateExpiredV2s[0].expiredMarket.eq(new BigNumber(2))).toBe(true);
            expect(liquidateExpiredV2s[0].primaryAccountOwner).toBe(
                process.env.LIQUIDATOR_ACCOUNT_OWNER,
            );
            expect(liquidateExpiredV2s[0].primaryAccountNumber).toEqual(
                new BigNumber(Number(process.env.LIQUIDATOR_ACCOUNT_NUMBER)),
            );
            expect(liquidateExpiredV2s[0].expiredAccountNumber).toEqual(new BigNumber(22));
        });
    });
});

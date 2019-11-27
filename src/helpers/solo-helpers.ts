import { DateTime } from 'luxon';
import { solo } from './solo';
import { getLatestBlockDateTime } from './block-helper';
import { getGasPrice } from '../lib/gas-price';
import Logger from '../lib/logger';
import { ApiAccount, BigNumber, ConfirmationType, TxResult, ApiMarket } from '@dydxprotocol/solo';
import { AccountOperation } from '@dydxprotocol/solo/dist/src/modules/operate/AccountOperation';

const EXPIRATION_DELAY = Number(process.env.EXPIRED_ACCOUNT_LIQUIDATION_DELAY_SECONDS);
const collateralPreferences = process.env
    .LIQUIDATION_COLLATERAL_PREFERENCES!.split(',')
    .map(pref => pref.trim());
const owedPreferences = process.env
    .LIQUIDATION_OWED_PREFERENCES!.split(',')
    .map(pref => pref.trim());

async function commitLiquidation(
    account: ApiAccount,
    operation: AccountOperation,
    sender: string,
): Promise<TxResult> {
    const gasPrice = getGasPrice();

    Logger.info({
        at: 'solo-helpers#commitLiquidation',
        message: 'Sending account liquidation transaction',
        accountOwner: account.owner,
        accountNumber: account.number,
        accountUuid: account.uuid,
        gasPrice,
        from: sender,
    });

    const response = await operation.commit({
        gasPrice,
        from: sender,
        confirmationType: ConfirmationType.Hash,
    });

    if (!response) {
        Logger.info({
            at: 'solo-helpers#commitLiquidation',
            message: 'Liquidation transaction has already been received',
            accountOwner: account.owner,
            accountNumber: account.number,
            accountUuid: account.uuid,
        });

        return Promise.reject();
    }

    Logger.info({
        at: 'solo-helpers#commitLiquidation',
        message: 'Successfully submitted liquidation transaction',
        accountOwner: account.owner,
        accountNumber: account.number,
        accountUuid: account.uuid,
        response,
    });

    return response;
}

export async function liquidateAccount(account: ApiAccount): Promise<TxResult> {
    Logger.info({
        at: 'solo-helpers#liquidateAccount',
        message: 'Starting account liquidation',
        accountOwner: account.owner,
        accountNumber: account.number,
        accountUuid: account.uuid,
    });

    const liquidatable = await solo.getters.isAccountLiquidatable(
        account.owner,
        new BigNumber(account.number),
    );

    if (!liquidatable) {
        Logger.info({
            at: 'solo-helpers#liquidateAccount',
            message: 'Account is not liquidatable',
            accountOwner: account.owner,
            accountNumber: account.number,
            accountUuid: account.uuid,
        });

        return Promise.reject();
    }

    const sender = process.env.LIQUIDATOR_ACCOUNT_OWNER;
    const borrowMarkets: string[] = [];
    const supplyMarkets: string[] = [];

    Object.keys(account.balances).forEach(marketId => {
        const par = new BigNumber(account.balances[marketId].par);

        if (par.lt(new BigNumber(0))) {
            borrowMarkets.push(marketId);
        } else if (par.gt(new BigNumber(0))) {
            supplyMarkets.push(marketId);
        }
    });

    if (borrowMarkets.length === 0) {
        throw new Error('Supposedly liquidatable account has no borrows');
    }

    if (supplyMarkets.length === 0) {
        throw new Error('Supposedly liquidatable account has no collateral');
    }

    const gasPrice = getGasPrice();

    return solo.liquidatorProxy.liquidate(
        process.env.LIQUIDATOR_ACCOUNT_OWNER!,
        new BigNumber(process.env.LIQUIDATOR_ACCOUNT_NUMBER!),
        account.owner,
        new BigNumber(account.number),
        new BigNumber(process.env.MIN_LIQUIDATOR_ACCOUNT_COLLATERALIZATION!),
        new BigNumber(process.env.MIN_VALUE_LIQUIDATED!),
        owedPreferences.map(p => new BigNumber(p)),
        collateralPreferences.map(p => new BigNumber(p)),
        {
            gasPrice,
            from: sender,
            confirmationType: ConfirmationType.Hash,
        },
    );
}

export async function liquidateExpiredAccount(
    account: ApiAccount,
    markets: ApiMarket[],
): Promise<TxResult> {
    if (process.env.ENABLE_EXPIRATIONS !== 'true') {
        return Promise.reject(new Error('Liquidating expired accounts is not enabled in settings'));
    }

    Logger.info({
        at: 'solo-helpers#liquidateExpiredAccount',
        message: 'Starting account expiry liquidation',
        accountOwner: account.owner,
        accountNumber: account.number,
        accountUuid: account.uuid,
    });

    const sender = process.env.LIQUIDATOR_ACCOUNT_OWNER!;
    const lastBlockDatetime = await getLatestBlockDateTime();

    const expiredMarkets: string[] = [];
    const operation = solo.operation.initiate();

    const weis: BigNumber[] = [];
    const prices: BigNumber[] = [];
    const spreadPremiums: BigNumber[] = [];
    const collateralPreferencesBN = collateralPreferences.map(p => new BigNumber(p));

    for (let i = 0; i < collateralPreferences.length; i += 1) {
        const balance = account.balances[i];

        if (!balance) {
            weis.push(new BigNumber(0));
        } else {
            weis.push(new BigNumber(balance.wei));
        }

        const market = markets.find(m => m.id === i);

        if (market === undefined) throw Error(`market undefined for id: ${i}`);

        prices.push(new BigNumber(market.oraclePrice));
        spreadPremiums.push(new BigNumber(market.spreadPremium));
    }

    Object.keys(account.balances).forEach(marketId => {
        const balance = account.balances[marketId];

        // 0 indicates the balance never expires
        if (!balance.expiresAt || new BigNumber(balance.expiresAt).eq(0)) {
            return;
        }

        // Can't expire positive balances
        if (!new BigNumber(balance.par).isNegative()) {
            return;
        }

        const isV2Expiry =
            balance.expiryAddress &&
            balance.expiryAddress.toLowerCase() ===
                solo.contracts.expiryV2.options.address.toLowerCase();

        const expiryDateTime = DateTime.fromISO(balance.expiresAt);
        const expiryTimeStamp = expiryDateTime.toMillis() / 1000;
        const expiryTimestampBN = new BigNumber(Math.floor(expiryTimeStamp));

        const lastBlockTimestamp = lastBlockDatetime.toMillis() / 1000;
        const lastBlockTimestampBN = new BigNumber(Math.floor(lastBlockTimestamp));

        const delayHasPassed = expiryTimeStamp + EXPIRATION_DELAY <= lastBlockTimestamp;

        if (isV2Expiry && delayHasPassed) {
            expiredMarkets.push(marketId);
            operation.fullyLiquidateExpiredAccountV2(
                process.env.LIQUIDATOR_ACCOUNT_OWNER!,
                new BigNumber(process.env.LIQUIDATOR_ACCOUNT_NUMBER!),
                account.owner,
                new BigNumber(account.number),
                new BigNumber(marketId),
                expiryTimestampBN,
                lastBlockTimestampBN,
                weis,
                prices,
                spreadPremiums,
                collateralPreferencesBN,
            );
        }
    });

    if (expiredMarkets.length === 0) {
        return Promise.reject(new Error('Supposedly expirable account has no expirable balances'));
    }

    return commitLiquidation(account, operation, sender);
}

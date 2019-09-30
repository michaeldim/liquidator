import { liquidateAccount, liquidateExpiredAccount } from '../helpers/solo-helpers';
import Logger from './logger';
import { delay } from './delay';
import AccountStore from './account-store';
import MarketStore from './market-store';
import LiquidationStore from './liquidation-store';

export default class SoloLiquidator {
    accountStore: AccountStore;
    marketStore: MarketStore;
    liquidationStore: LiquidationStore;

    constructor(
        accountStore: AccountStore,
        marketStore: MarketStore,
        liquidationStore: LiquidationStore,
    ) {
        this.accountStore = accountStore;
        this.marketStore = marketStore;
        this.liquidationStore = liquidationStore;
    }

    public start = (): void => {
        Logger.info({
            at: 'SoloLiquidator#start',
            message: 'Starting solo liquidator',
        });
        this._poll();
    };

    private _poll = async (): Promise<void> => {
        for (;;) {
            await this.liquidateAccounts();

            await delay(Number(process.env.SOLO_LIQUIDATE_POLL_INTERVAL_MS));
        }
    };

    public liquidateAccounts = async (): Promise<void> => {
        const liquidatableAccounts = this.accountStore
            .getLiquidatableAccounts()
            .filter(a => !this.liquidationStore.contains(a));
        const expiredAccounts = this.accountStore
            .getExpiredAccounts()
            .filter(a => !this.liquidationStore.contains(a));
        const markets = this.marketStore.getMarkets();

        if (liquidatableAccounts.length === 0 && expiredAccounts.length === 0) {
            Logger.info({
                at: 'SoloLiquidator#_liquidateAccounts',
                mesage: 'No accounts to liquidate',
            });
            return;
        }

        liquidatableAccounts.forEach(a => this.liquidationStore.add(a));
        expiredAccounts.forEach(a => this.liquidationStore.add(a));

        await Promise.all([
            Promise.all(
                liquidatableAccounts.map(async account => {
                    try {
                        await liquidateAccount(account);
                    } catch (error) {
                        Logger.error({
                            ...error.trace,
                            at: 'SoloLiquidator#_liquidateAccounts',
                            message: `Failed to liquidate account: ${error.message}`,
                            accountUuid: account.uuid,
                            accountOwner: account.owner,
                            accountNumber: account.number,
                            error,
                        });
                    }
                }),
            ),
            Promise.all(
                expiredAccounts.map(async account => {
                    try {
                        await liquidateExpiredAccount(account, markets);
                    } catch (error) {
                        Logger.error({
                            ...error.trace,
                            at: 'SoloLiquidator#_liquidateAccounts',
                            message: `Failed to liquidate expired account: ${error.message}`,
                            accountUuid: account.uuid,
                            accountOwner: account.owner,
                            accountNumber: account.number,
                        });
                    }
                }),
            ),
        ]);
    };
}

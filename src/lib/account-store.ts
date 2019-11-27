import Logger from './logger';
import { delay } from './delay';
import { ApiAccount } from '@dydxprotocol/solo';
import { getLiquidatableAccounts, getExpiredAccounts } from '../clients/dydx';
import { Uuid } from '../@types/uuid';

export default class AccountStore {
    liquidatableAccounts: ApiAccount[];
    expiredAccounts: ApiAccount[];

    constructor() {
        this.liquidatableAccounts = [];
        this.expiredAccounts = [];
    }

    public getLiquidatableAccounts = (): ApiAccount[] => this.liquidatableAccounts;

    public getExpiredAccounts = (): ApiAccount[] => this.expiredAccounts;

    public start = (): void => {
        Logger.info({
            at: 'AccountStore#start',
            message: 'Starting account store',
        });
        this._poll();
    };

    private _poll = async (): Promise<void> => {
        for (;;) {
            try {
                await this._update();
            } catch (error) {
                Logger.error({
                    at: 'AccountStore#_poll',
                    message: error.message,
                    error,
                });
            }

            await delay(Number(process.env.ACCOUNT_POLL_INTERVAL_MS));
        }
    };

    private _update = async (): Promise<void> => {
        Logger.info({
            at: 'AccountStore#_update',
            message: 'Updating accounts...',
        });

        const [nextLiquidatableAccounts, nextExpiredAccounts] = await Promise.all([
            getLiquidatableAccounts(),
            getExpiredAccounts(),
        ]);

        const allAccountUuids: Uuid = {};

        nextLiquidatableAccounts.forEach(next => {
            allAccountUuids[next.uuid] = true;

            if (!this.liquidatableAccounts.find(e => next.uuid === e.uuid)) {
                Logger.info({
                    at: 'AccountStore#_update',
                    message: 'Adding new liquidatable account',
                    uuid: next.uuid,
                    owner: next.owner,
                    number: next.number,
                });
            }
        });

        // Do not put an account in both liquidatable and expired
        const filteredNextExpiredAccounts = nextExpiredAccounts.filter(
            a => !allAccountUuids[a.uuid],
        );

        filteredNextExpiredAccounts.forEach(next => {
            if (!this.expiredAccounts.find(e => next.uuid === e.uuid)) {
                Logger.info({
                    at: 'AccountStore#_update',
                    message: 'Adding new expired account',
                    uuid: next.uuid,
                    owner: next.owner,
                    number: next.number,
                });
            }
        });

        this.liquidatableAccounts.forEach(next => {
            if (!nextLiquidatableAccounts.find(e => next.uuid === e.uuid)) {
                Logger.info({
                    at: 'AccountStore#_update',
                    message: 'Removing liquidatable account',
                    uuid: next.uuid,
                    owner: next.owner,
                    number: next.number,
                });
            }
        });

        this.expiredAccounts.forEach(next => {
            if (!filteredNextExpiredAccounts.find(e => next.uuid === e.uuid)) {
                Logger.info({
                    at: 'AccountStore#_update',
                    message: 'Removing expired account',
                    uuid: next.uuid,
                    owner: next.owner,
                    number: next.number,
                });
            }
        });

        this.liquidatableAccounts = nextLiquidatableAccounts;
        this.expiredAccounts = filteredNextExpiredAccounts;

        Logger.info({
            at: 'AccountStore#_update',
            message: 'Finished updating accounts',
        });
    };
}

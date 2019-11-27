import LRU from 'lru-cache';
import { ApiAccount } from '@dydxprotocol/solo';

export default class LiquidationStore {
    store: LRU<string, boolean>;

    constructor() {
        this.store = new LRU({
            maxAge: Number(process.env.LIQUIDATION_KEY_EXPIRATION_SEC) * 1000,
        });
    }

    public async add(account: ApiAccount): Promise<void> {
        if (!account) {
            throw new Error('Must specify account');
        }

        const key = this._getKey(account);

        this.store.set(key, true);
    }

    public contains(account: ApiAccount): boolean | undefined {
        const key = this._getKey(account);

        return this.store.get(key);
    }

    private _getKey(account: ApiAccount): string {
        return `${account.owner.toLowerCase()}-${account.number}`;
    }
}

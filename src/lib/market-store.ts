import { getMarkets } from '../clients/dydx';
import { delay } from './delay';
import Logger from './logger';
import { ApiMarket } from '@dydxprotocol/solo';

export default class MarketStore {
    markets: ApiMarket[];

    constructor() {
        this.markets = [];
    }

    getMarkets = (): ApiMarket[] => this.markets;

    public start = (): void => {
        Logger.info({
            at: 'MarketStore#start',
            message: 'Starting market store',
        });
        this._poll();
    };

    private _poll = async (): Promise<void> => {
        for (;;) {
            try {
                await this._update();
            } catch (error) {
                Logger.error({
                    at: 'MarketStore#_poll',
                    message: error.message,
                    error,
                });
            }

            await delay(Number(process.env.MARKET_POLL_INTERVAL_MS));
        }
    };

    private _update = async (): Promise<void> => {
        Logger.info({
            at: 'MarketStore#_update',
            message: 'Updating markets...',
        });

        this.markets = await getMarkets();

        Logger.info({
            at: 'MarketStore#_update',
            message: 'Finished updating markets',
        });
    };
}

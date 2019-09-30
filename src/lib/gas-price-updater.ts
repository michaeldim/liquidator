import { delay } from './delay';
import { updateGasPrice } from './gas-price';
import Logger from './logger';

const UPDATE_FREQUENCY_SEC = Number(process.env.GAS_PRICE_UPDATE_FREQUENCY_SEC);

export default class GasPriceUpdater {
    public start = (): void => {
        Logger.info({
            at: 'GasPriceUpdater#start',
            message: 'Starting gas price updater',
        });
        this._updateGasPrices();
    };

    private _updateGasPrices = async (): Promise<void> => {
        for (;;) {
            try {
                await updateGasPrice();
            } catch (error) {
                Logger.error({
                    at: 'GasPriceUpdater#_updateGasPrices',
                    message: 'Failed to update gas price',
                    error,
                });
            }

            await delay(UPDATE_FREQUENCY_SEC * 1000);
        }
    };
}

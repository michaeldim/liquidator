import { DateTime } from 'luxon';
import { solo } from './solo';
import Logger from '../lib/logger';

let lastBlockDateTime: DateTime;

export async function getLatestBlockDateTime(): Promise<DateTime> {
    try {
        const block = await solo.web3.eth.getBlock('latest');
        lastBlockDateTime = DateTime.fromMillis(block.timestamp * 1000);
    } catch (error) {
        Logger.error({
            at: 'block-helper#getLatestBlockTimestamp',
            message: error.message,
            error,
        });
    }

    return lastBlockDateTime;
}

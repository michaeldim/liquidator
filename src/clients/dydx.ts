import request from 'request-promise-native';
import { ApiAccount, ApiMarket } from '@dydxprotocol/solo';

export async function getLiquidatableAccounts(): Promise<ApiAccount[]> {
    const { accounts } = await request({
        method: 'GET',
        uri: `${process.env.DYDX_URL}/v1/accounts`,
        json: true,
        qs: {
            isLiquidatable: true,
        },
    });

    return accounts;
}

export async function getExpiredAccounts(): Promise<ApiAccount[]> {
    const { accounts } = await request({
        method: 'GET',
        uri: `${process.env.DYDX_URL}/v1/accounts`,
        json: true,
        qs: {
            isExpired: true,
        },
    });

    return accounts;
}

export async function getMarkets(): Promise<ApiMarket[]> {
    const { markets } = await request({
        method: 'GET',
        uri: `${process.env.DYDX_URL}/v1/markets`,
        json: true,
    });

    return markets;
}

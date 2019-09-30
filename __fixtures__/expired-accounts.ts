import { DateTime } from 'luxon';
import { ApiAccount } from '@dydxprotocol/solo';
import { solo } from '../src/helpers/solo';

export const getTestExpiredAccounts = (): ApiAccount[] => {
    return [
        {
            uuid: '111',
            owner: '0x78F4529554137A9015dC653758aB600aBC2ffD48',
            number: '11',
            balances: {
                0: {
                    par: '-1010101010101010010101010010101010101001010',
                    wei: '-2010101010101010010101010010101010101001010',
                    expiresAt: DateTime.utc(1982, 5, 25).toISO(),
                    expiryAddress: undefined,
                },
                1: {
                    par: '1010101010101010010101010010101010101001010',
                    wei: '2010101010101010010101010010101010101001010',
                    expiresAt: undefined,
                    expiryAddress: undefined,
                },
                2: {
                    par: '-1010101010101010010101010010101010101001010',
                    wei: '-2010101010101010010101010010101010101001010',
                    expiresAt: DateTime.utc(2050, 5, 25).toISO(),
                    expiryAddress: solo.contracts.expiry.options.address,
                },
                3: {
                    par: '-1010101010101010010101010010101010101001010',
                    wei: '-2010101010101010010101010010101010101001010',
                },
            },
            createdAt: '',
            updatedAt: '',
        },
        {
            uuid: '222',
            owner: '0x78F4529554137A9015dC653758aB600aBC2ffD48',
            number: '22',
            balances: {
                0: {
                    par: '-1010101010101010010101010010101010101001010',
                    wei: '-2010101010101010010101010010101010101001010',
                    expiresAt: DateTime.utc(2050, 5, 25).toISO(),
                    expiryAddress: solo.contracts.expiryV2.options.address,
                },
                1: {
                    par: '1010101010101010010101010010101010101001010',
                    wei: '2010101010101010010101010010101010101001010',
                    expiresAt: undefined,
                    expiryAddress: solo.contracts.expiryV2.options.address,
                },
                2: {
                    par: '-1010101010101010010101010010101010101001010',
                    wei: '-2010101010101010010101010010101010101001010',
                    expiresAt: DateTime.utc(1982, 5, 25).toISO(),
                    expiryAddress: solo.contracts.expiryV2.options.address,
                },
                3: {
                    par: '-1010101010101010010101010010101010101001010',
                    wei: '-2010101010101010010101010010101010101001010',
                },
            },
            createdAt: '',
            updatedAt: '',
        },
    ];
};

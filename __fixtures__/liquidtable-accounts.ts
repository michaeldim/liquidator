import { ApiAccount } from '@dydxprotocol/solo';

export const getTestLiquidatableAccounts = (): ApiAccount[] => {
    return [
        {
            uuid: 'abc',
            owner: '0x78F4529554137A9015dC653758aB600aBC2ffD48',
            number: '0',
            balances: {
                0: {
                    par: '100',
                    wei: '200',
                },
                1: {
                    par: '-100',
                    wei: '-200',
                },
            },
            createdAt: '',
            updatedAt: '',
        },
        {
            uuid: 'def',
            owner: '0x78F4529554137A9015dC653758aB600aBC2ffD48',
            number: '1',
            balances: {
                0: {
                    par: '-1010101010101010010101010010101010101001010',
                    wei: '-2010101010101010010101010010101010101001010',
                },
                1: {
                    par: '1010101010101010010101010010101010101001010',
                    wei: '2010101010101010010101010010101010101001010',
                },
            },
            createdAt: '',
            updatedAt: '',
        },
    ];
};

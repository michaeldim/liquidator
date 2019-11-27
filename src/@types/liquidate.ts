import { address, Integer, Decimal, ContractCallOptions } from '@dydxprotocol/solo';

export interface LiquidateAccount {
    accountOwner: address;
    accountNumber: Integer;
    liquidOwner: address;
    liquidNumber: Integer;
    minLiquidatorRatio: Decimal;
    minValueLiquidated: Integer;
    owedPreferences: Integer[];
    heldPreferences: Integer[];
    options: ContractCallOptions;
}

export interface FullyLiquidateExpiredAccount {
    primaryAccountOwner: address;
    primaryAccountNumber: Integer;
    expiredAccountOwner: address;
    expiredAccountNumber: Integer;
    expiredMarket: Integer;
    expiryTimestamp: Integer;
    blockTimestamp: Integer;
    weis: Integer[];
    prices: Integer[];
    spreadPremiums: Integer[];
    collateralPreferences: Integer[];
}

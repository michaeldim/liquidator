export interface EthGasStationResponse {
    fast: number;
    fastest: number;
    safeLow: number;
    average: number;
    block_time: number;
    blockNum: number;
    speed: number;
    safeLowWait: number;
    avgWait: number;
    fastWait: number;
    fastestWait: number;
    [gasPriceRange: string]: number;
}

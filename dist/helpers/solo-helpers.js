"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var luxon_1 = require("luxon");
var solo_1 = require("./solo");
var block_helper_1 = require("./block-helper");
var gas_price_1 = require("../lib/gas-price");
var logger_1 = __importDefault(require("../lib/logger"));
var solo_2 = require("@dydxprotocol/solo");
var EXPIRATION_DELAY = Number(process.env.EXPIRED_ACCOUNT_LIQUIDATION_DELAY_SECONDS);
var collateralPreferences = process.env
    .LIQUIDATION_COLLATERAL_PREFERENCES.split(',')
    .map(function (pref) { return pref.trim(); });
var owedPreferences = process.env
    .LIQUIDATION_OWED_PREFERENCES.split(',')
    .map(function (pref) { return pref.trim(); });
function commitLiquidation(account, operation, sender) {
    return __awaiter(this, void 0, void 0, function () {
        var gasPrice, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    gasPrice = gas_price_1.getGasPrice();
                    logger_1.default.info({
                        at: 'solo-helpers#commitLiquidation',
                        message: 'Sending account liquidation transaction',
                        accountOwner: account.owner,
                        accountNumber: account.number,
                        accountUuid: account.uuid,
                        gasPrice: gasPrice,
                        from: sender,
                    });
                    return [4 /*yield*/, operation.commit({
                            gasPrice: gasPrice,
                            from: sender,
                            confirmationType: solo_2.ConfirmationType.Hash,
                        })];
                case 1:
                    response = _a.sent();
                    if (!response) {
                        logger_1.default.info({
                            at: 'solo-helpers#commitLiquidation',
                            message: 'Liquidation transaction has already been received',
                            accountOwner: account.owner,
                            accountNumber: account.number,
                            accountUuid: account.uuid,
                        });
                        return [2 /*return*/, Promise.reject()];
                    }
                    logger_1.default.info({
                        at: 'solo-helpers#commitLiquidation',
                        message: 'Successfully submitted liquidation transaction',
                        accountOwner: account.owner,
                        accountNumber: account.number,
                        accountUuid: account.uuid,
                        response: response,
                    });
                    return [2 /*return*/, response];
            }
        });
    });
}
function liquidateAccount(account) {
    return __awaiter(this, void 0, void 0, function () {
        var liquidatable, sender, borrowMarkets, supplyMarkets, gasPrice;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger_1.default.info({
                        at: 'solo-helpers#liquidateAccount',
                        message: 'Starting account liquidation',
                        accountOwner: account.owner,
                        accountNumber: account.number,
                        accountUuid: account.uuid,
                    });
                    return [4 /*yield*/, solo_1.solo.getters.isAccountLiquidatable(account.owner, new solo_2.BigNumber(account.number))];
                case 1:
                    liquidatable = _a.sent();
                    if (!liquidatable) {
                        logger_1.default.info({
                            at: 'solo-helpers#liquidateAccount',
                            message: 'Account is not liquidatable',
                            accountOwner: account.owner,
                            accountNumber: account.number,
                            accountUuid: account.uuid,
                        });
                        return [2 /*return*/, Promise.reject()];
                    }
                    sender = process.env.LIQUIDATOR_ACCOUNT_OWNER;
                    borrowMarkets = [];
                    supplyMarkets = [];
                    Object.keys(account.balances).forEach(function (marketId) {
                        var par = new solo_2.BigNumber(account.balances[marketId].par);
                        if (par.lt(new solo_2.BigNumber(0))) {
                            borrowMarkets.push(marketId);
                        }
                        else if (par.gt(new solo_2.BigNumber(0))) {
                            supplyMarkets.push(marketId);
                        }
                    });
                    if (borrowMarkets.length === 0) {
                        throw new Error('Supposedly liquidatable account has no borrows');
                    }
                    if (supplyMarkets.length === 0) {
                        throw new Error('Supposedly liquidatable account has no collateral');
                    }
                    gasPrice = gas_price_1.getGasPrice();
                    return [2 /*return*/, solo_1.solo.liquidatorProxy.liquidate(process.env.LIQUIDATOR_ACCOUNT_OWNER, new solo_2.BigNumber(process.env.LIQUIDATOR_ACCOUNT_NUMBER), account.owner, new solo_2.BigNumber(account.number), new solo_2.BigNumber(process.env.MIN_LIQUIDATOR_ACCOUNT_COLLATERALIZATION), new solo_2.BigNumber(process.env.MIN_VALUE_LIQUIDATED), owedPreferences.map(function (p) { return new solo_2.BigNumber(p); }), collateralPreferences.map(function (p) { return new solo_2.BigNumber(p); }), {
                            gasPrice: gasPrice,
                            from: sender,
                            confirmationType: solo_2.ConfirmationType.Hash,
                        })];
            }
        });
    });
}
exports.liquidateAccount = liquidateAccount;
function liquidateExpiredAccount(account, markets) {
    return __awaiter(this, void 0, void 0, function () {
        var sender, lastBlockDatetime, expiredMarkets, operation, weis, prices, spreadPremiums, collateralPreferencesBN, _loop_1, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.ENABLE_EXPIRATIONS !== 'true') {
                        return [2 /*return*/, Promise.reject(new Error('Liquidating expired accounts is not enabled in settings'))];
                    }
                    logger_1.default.info({
                        at: 'solo-helpers#liquidateExpiredAccount',
                        message: 'Starting account expiry liquidation',
                        accountOwner: account.owner,
                        accountNumber: account.number,
                        accountUuid: account.uuid,
                    });
                    sender = process.env.LIQUIDATOR_ACCOUNT_OWNER;
                    return [4 /*yield*/, block_helper_1.getLatestBlockDateTime()];
                case 1:
                    lastBlockDatetime = _a.sent();
                    expiredMarkets = [];
                    operation = solo_1.solo.operation.initiate();
                    weis = [];
                    prices = [];
                    spreadPremiums = [];
                    collateralPreferencesBN = collateralPreferences.map(function (p) { return new solo_2.BigNumber(p); });
                    _loop_1 = function (i) {
                        var balance = account.balances[i];
                        if (!balance) {
                            weis.push(new solo_2.BigNumber(0));
                        }
                        else {
                            weis.push(new solo_2.BigNumber(balance.wei));
                        }
                        var market = markets.find(function (m) { return m.id === i; });
                        if (market === undefined)
                            throw Error("market undefined for id: " + i);
                        prices.push(new solo_2.BigNumber(market.oraclePrice));
                        spreadPremiums.push(new solo_2.BigNumber(market.spreadPremium));
                    };
                    for (i = 0; i < collateralPreferences.length; i += 1) {
                        _loop_1(i);
                    }
                    Object.keys(account.balances).forEach(function (marketId) {
                        var balance = account.balances[marketId];
                        // 0 indicates the balance never expires
                        if (!balance.expiresAt || new solo_2.BigNumber(balance.expiresAt).eq(0)) {
                            return;
                        }
                        // Can't expire positive balances
                        if (!new solo_2.BigNumber(balance.par).isNegative()) {
                            return;
                        }
                        var isV2Expiry = balance.expiryAddress &&
                            balance.expiryAddress.toLowerCase() ===
                                solo_1.solo.contracts.expiryV2.options.address.toLowerCase();
                        var expiryDateTime = luxon_1.DateTime.fromISO(balance.expiresAt);
                        var expiryTimeStamp = expiryDateTime.toMillis() / 1000;
                        var expiryTimestampBN = new solo_2.BigNumber(Math.floor(expiryTimeStamp));
                        var lastBlockTimestamp = lastBlockDatetime.toMillis() / 1000;
                        var lastBlockTimestampBN = new solo_2.BigNumber(Math.floor(lastBlockTimestamp));
                        var delayHasPassed = expiryTimeStamp + EXPIRATION_DELAY <= lastBlockTimestamp;
                        if (isV2Expiry && delayHasPassed) {
                            expiredMarkets.push(marketId);
                            operation.fullyLiquidateExpiredAccountV2(process.env.LIQUIDATOR_ACCOUNT_OWNER, new solo_2.BigNumber(process.env.LIQUIDATOR_ACCOUNT_NUMBER), account.owner, new solo_2.BigNumber(account.number), new solo_2.BigNumber(marketId), expiryTimestampBN, lastBlockTimestampBN, weis, prices, spreadPremiums, collateralPreferencesBN);
                        }
                    });
                    if (expiredMarkets.length === 0) {
                        return [2 /*return*/, Promise.reject(new Error('Supposedly expirable account has no expirable balances'))];
                    }
                    return [2 /*return*/, commitLiquidation(account, operation, sender)];
            }
        });
    });
}
exports.liquidateExpiredAccount = liquidateExpiredAccount;

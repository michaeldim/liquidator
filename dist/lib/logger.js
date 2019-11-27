"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = __importDefault(require("winston"));
var test = process.env.NODE_ENV === 'test';
var alignedWithColorsAndTime = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }), winston_1.default.format.printf(function (info) {
    var timestamp = info.timestamp, level = info.level, args = __rest(info, ["timestamp", "level"]);
    var ts = timestamp.slice(0, 19).replace('T', ' ');
    return ts + " [" + level + "]: " + (Object.keys(args).length ? JSON.stringify(args, null, 2) : '');
}));
var consoleTransport = new winston_1.default.transports.Console({
    level: 'debug',
    handleExceptions: true,
    format: alignedWithColorsAndTime,
});
var stackTransport = new winston_1.default.transports.Console({
    level: 'error',
    handleExceptions: true,
    log: function (info, callback) {
        setImmediate(function () {
            if (info && info.error) {
                console.error(info.error.stack);
            }
        });
        if (callback) {
            callback();
        }
    },
});
var transports = [stackTransport];
if (!test || process.env.LOGS) {
    transports.push(consoleTransport);
}
var Logger = winston_1.default.createLogger({
    format: winston_1.default.format.combine(winston_1.default.format(function (info) { return info; })(), winston_1.default.format.json()),
    transports: transports,
    exitOnError: false,
});
exports.default = Logger;

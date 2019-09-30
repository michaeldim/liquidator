import winston from 'winston';
import { ConsoleTransportInstance } from 'winston/lib/winston/transports';

const test: boolean = process.env.NODE_ENV === 'test';

const alignedWithColorsAndTime = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    winston.format.printf(info => {
        const { timestamp, level, ...args } = info;
        const ts = timestamp.slice(0, 19).replace('T', ' ');

        return `${ts} [${level}]: ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
    }),
);

const consoleTransport: ConsoleTransportInstance = new winston.transports.Console({
    level: 'debug',
    handleExceptions: true,
    format: alignedWithColorsAndTime,
});

const stackTransport = new winston.transports.Console({
    level: 'error',
    handleExceptions: true,
    log(info, callback): void {
        setImmediate(() => {
            if (info && info.error) {
                console.error(info.error.stack);
            }
        });
        if (callback) {
            callback();
        }
    },
});

const transports = [stackTransport];

if (!test || process.env.LOGS) {
    transports.push(consoleTransport);
}

const Logger = winston.createLogger({
    format: winston.format.combine(winston.format(info => info)(), winston.format.json()),
    transports,
    exitOnError: false,
});

export default Logger;

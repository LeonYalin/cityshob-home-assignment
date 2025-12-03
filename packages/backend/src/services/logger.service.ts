
import winston from 'winston';
import appConfig from '../config/app.config';

const logFormat = winston.format.printf(({ timestamp, level, message, ...meta }: any) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  }`;
});

export class Logger {
  private logger: winston.Logger;

  constructor(context?: string) {
    this.logger = winston.createLogger({
      level: appConfig.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        logFormat
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            logFormat
          ),
        }),
        ...(appConfig.nodeEnv === 'production'
          ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
              }),
            ]
          : []),
      ],
    });

    if (appConfig.nodeEnv !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.simple(),
        })
      );
    }
    if (context) {
      this.logger.defaultMeta = { context };
    }
  }

  info(message: string, ...meta: any[]) {
    this.logger.info(message, ...meta);
  }
  warn(message: string, ...meta: any[]) {
    this.logger.warn(message, ...meta);
  }
  error(message: string, ...meta: any[]) {
    this.logger.error(message, ...meta);
  }
  debug(message: string, ...meta: any[]) {
    this.logger.debug(message, ...meta);
  }
}
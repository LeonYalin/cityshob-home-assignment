import morgan from 'morgan';
import { Logger } from '../services/logger.service';

// Create a shared logger instance for HTTP middleware
const logger = new Logger('HTTP');

// Create a stream that writes to our winston logger
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Create morgan middleware with custom format
export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);
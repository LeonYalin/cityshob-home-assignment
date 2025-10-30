// Winston mock - automatically used by Jest
// Based on our current winston usage patterns

const mockLoggerInstance = {
  add: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  level: 'info',
  format: {},
  transports: [],
  _events: {},
  _eventsCount: 0,
  _maxListeners: undefined,
};

export const format = {
  combine: jest.fn(() => jest.fn()),
  timestamp: jest.fn(() => jest.fn()),
  errors: jest.fn(() => jest.fn()),
  json: jest.fn(() => jest.fn()),
  simple: jest.fn(() => jest.fn()),
  colorize: jest.fn(() => jest.fn()),
  printf: jest.fn(() => jest.fn()),
  label: jest.fn(() => jest.fn()),
};

export const transports = {
  Console: jest.fn().mockImplementation(() => ({
    format: {},
    level: 'info',
  })),
  File: jest.fn().mockImplementation(() => ({
    format: {},
    level: 'info',
  })),
};

export const createLogger = jest.fn(() => mockLoggerInstance);

// Default export for winston
const winston = {
  createLogger,
  format,
  transports,
  Logger: mockLoggerInstance,
};

export default winston;

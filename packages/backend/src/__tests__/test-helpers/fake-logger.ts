import { Logger } from '../../services/logger.service';

/**
 * Simple logger test double - better than mocking for most cases
 * Captures log calls for test assertions without external dependencies
 */
export class FakeLogger {
  public logs: Array<{ level: string; message: string; meta?: any }> = [];

  info(message: string, meta?: any): void {
    this.logs.push({ level: 'info', message, meta });
  }

  warn(message: string, meta?: any): void {
    this.logs.push({ level: 'warn', message, meta });
  }

  error(message: string, meta?: any): void {
    this.logs.push({ level: 'error', message, meta });
  }

  debug(message: string, meta?: any): void {
    this.logs.push({ level: 'debug', message, meta });
  }

  // Test utilities
  clear(): void {
    this.logs = [];
  }

  getLogCount(): number {
    return this.logs.length;
  }

  getLogsByLevel(level: string): Array<{ level: string; message: string; meta?: any }> {
    return this.logs.filter(log => log.level === level);
  }

  hasLogWithMessage(message: string): boolean {
    return this.logs.some(log => log.message.includes(message));
  }

  getLastLog(): { level: string; message: string; meta?: any } | undefined {
    return this.logs[this.logs.length - 1];
  }

  // Factory method to create instances easily
  static create(): FakeLogger {
    return new FakeLogger();
  }

  // Method to convert to Logger interface for dependency injection
  asLogger(): Logger {
    return this as any;
  }
}
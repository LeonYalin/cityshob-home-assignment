/**
 * Enhanced logger test double - better than mocking for most cases
 * Captures log calls for test assertions without external dependencies
 * Provides rich testing utilities for behavior verification
 */
export class FakeLogger {
  public logs: Array<{ level: string; message: string; meta?: any; timestamp: Date }> = [];
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  info(message: string, meta?: any): void {
    this.logs.push({ level: 'info', message, meta, timestamp: new Date() });
  }

  warn(message: string, meta?: any): void {
    this.logs.push({ level: 'warn', message, meta, timestamp: new Date() });
  }

  error(message: string, meta?: any): void {
    this.logs.push({ level: 'error', message, meta, timestamp: new Date() });
  }

  debug(message: string, meta?: any): void {
    this.logs.push({ level: 'debug', message, meta, timestamp: new Date() });
  }

  // Test utilities
  clearLogs(): void {
    this.logs = [];
  }

  getLogCount(level?: string): number {
    return level ? this.logs.filter(log => log.level === level).length : this.logs.length;
  }

  getLogsByLevel(level: string): Array<{ level: string; message: string; meta?: any; timestamp: Date }> {
    return this.logs.filter(log => log.level === level);
  }

  hasLogContaining(message: string): boolean {
    return this.logs.some(log => log.message.includes(message));
  }

  hasLogWithLevel(level: string): boolean {
    return this.logs.some(log => log.level === level);
  }

  hasLogWithMeta(key: string, value?: any): boolean {
    return this.logs.some(log => {
      if (!log.meta) return false;
      if (value === undefined) return key in log.meta;
      return log.meta[key] === value;
    });
  }

  getLastLog(): { level: string; message: string; meta?: any; timestamp: Date } | undefined {
    return this.logs[this.logs.length - 1];
  }

  getLogsInOrder(): Array<{ level: string; message: string; meta?: any; timestamp: Date }> {
    return [...this.logs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Advanced assertions
  assertLogSequence(expectedMessages: string[]): boolean {
    const actualMessages = this.logs.map(log => log.message);
    return expectedMessages.every((msg, index) => 
      actualMessages[index] && actualMessages[index].includes(msg)
    );
  }

  // Factory methods
  static create(context?: string): FakeLogger {
    return new FakeLogger(context);
  }

  static createWithInitialLogs(logs: Array<{level: string, message: string, meta?: any}>): FakeLogger {
    const logger = new FakeLogger();
    logs.forEach(log => {
      (logger as any)[log.level](log.message, log.meta);
    });
    return logger;
  }
}
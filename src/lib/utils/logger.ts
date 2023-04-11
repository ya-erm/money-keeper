/* eslint-disable no-console */

export enum LogLevel {
  debug = 0,
  log = 1,
  warn = 2,
  error = 3,
}

/** Global log level */
export const LOG_LEVEL = LogLevel.debug;

type LoggerOptions = {
  disabled?: boolean;
  level?: LogLevel;
  color?: string;
};

export class Logger {
  constructor(private _name: string, private _options: LoggerOptions = {}) {}

  get name() {
    return this._name;
  }

  private skipLog(logLevel: LogLevel) {
    return this._options.disabled || logLevel < (this._options.level ?? 0) || logLevel < LOG_LEVEL;
  }

  private getDefaultArgs() {
    return [`%c${this.name}:`, `color: ${this._options.color ?? 'green'}`];
  }

  debug(...args: unknown[]) {
    if (this.skipLog(0)) return;
    console.debug(...this.getDefaultArgs(), ...args);
  }

  log(...args: unknown[]) {
    if (this.skipLog(1)) return;
    console.log(...this.getDefaultArgs(), ...args);
  }

  warn(...args: unknown[]) {
    if (this.skipLog(2)) return;
    console.warn(...this.getDefaultArgs(), ...args);
  }

  error(...args: unknown[]) {
    if (this.skipLog(3)) return;
    console.error(...this.getDefaultArgs(), ...args);
  }
}

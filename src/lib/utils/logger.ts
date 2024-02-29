/* eslint-disable no-console */

import { writable } from 'svelte/store';

export enum LogLevel {
  debug = 0,
  log = 1,
  warn = 2,
  error = 3,
}

/** Global log level */
export const LOG_LEVEL = LogLevel.debug;

type LogMessage = {
  level: LogLevel;
  timestamp: Date;
  logger: Logger;
  args: unknown[];
};

export const logs = writable<LogMessage[]>([]);

type LoggerOptions = {
  disabled?: boolean;
  level?: LogLevel;
  color?: string;
};

export class Logger {
  constructor(
    private _name: string,
    private _options: LoggerOptions = {},
  ) {}

  get name() {
    return this._name;
  }

  get color() {
    return this._options.color;
  }

  private skipLog(logLevel: LogLevel) {
    return this._options.disabled || logLevel < (this._options.level ?? 0) || logLevel < LOG_LEVEL;
  }

  private getDefaultArgs() {
    return [`%c[${this.name}]`, `color: ${this._options.color ?? 'green'}`];
  }

  private onMessage(message: LogMessage) {
    logs.update((prev) => prev.concat(message));
  }

  debug(...args: unknown[]) {
    if (this.skipLog(0)) return;
    console.debug(...this.getDefaultArgs(), ...args);
    this.onMessage({ timestamp: new Date(), logger: this, level: LogLevel.debug, args });
  }

  log(...args: unknown[]) {
    if (this.skipLog(1)) return;
    console.log(...this.getDefaultArgs(), ...args);
    this.onMessage({ timestamp: new Date(), logger: this, level: LogLevel.log, args });
  }

  warn(...args: unknown[]) {
    if (this.skipLog(2)) return;
    console.warn(...this.getDefaultArgs(), ...args);
    this.onMessage({ timestamp: new Date(), logger: this, level: LogLevel.warn, args });
  }

  error(...args: unknown[]) {
    if (this.skipLog(3)) return;
    console.error(...this.getDefaultArgs(), ...args);
    this.onMessage({ timestamp: new Date(), logger: this, level: LogLevel.error, args });
  }
}

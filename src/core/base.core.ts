const defaultLogger = (...args: unknown[]) => console.log(...args);

export class Base {
  private logger: (...args: unknown[]) => void = defaultLogger;

  public setLogger(logger: (...args: unknown[]) => void) {
    this.logger = logger;
    return this;
  }

  public sysLog(...args: unknown[]) {
    this.logger(...args);
    return this;
  }

  public customLog(logger: (...args: unknown[]) => void, ...args: unknown[]) {
    logger(...args);
    return this;
  }
}

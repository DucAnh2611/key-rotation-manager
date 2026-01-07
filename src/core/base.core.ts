import { DEFAULT_BASE_OPTIONS } from 'src/constants/default.constant';
import { TBaseLogger, TBaseOptions } from 'src/types/base.type';

export class Base<TLogger extends (...args: any[]) => any = (...args: unknown[]) => void> {
  private logger!: TBaseLogger<TLogger>;
  private bOptions: Required<TBaseOptions>;

  constructor(options: Partial<TBaseOptions>) {
    this.bOptions = { ...DEFAULT_BASE_OPTIONS, ...options };

    this.logger = ((...args: any[]) => console.log(...args)) as TBaseLogger<TLogger>;
  }

  protected getLogger() {
    return this.logger;
  }

  public setLogger<T extends (...args: any[]) => any>(logger: TBaseLogger<T>): this {
    this.logger = logger as any;
    return this;
  }

  public async sysLog(...args: Parameters<typeof this.logger>) {
    if (!this.bOptions.quiet) await this.logger(...args);
    return this;
  }

  public async customLog<T extends (...args: any[]) => any>(
    logger: TBaseLogger<T>,
    ...args: Parameters<T>
  ) {
    await logger(...args);
    return this;
  }
}

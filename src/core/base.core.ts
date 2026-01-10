import { DEFAULT_BASE_LOGGER, DEFAULT_BASE_OPTIONS } from 'src/constants/default.constant';
import { TBaseLogger, TBaseOptions, THook } from 'src/types/base.type';

type DefaultLogger = typeof DEFAULT_BASE_LOGGER;

export class Base<TLogger extends (...args: any[]) => any = DefaultLogger> {
  private logger: TBaseLogger<TLogger>;
  private bOptions: Required<TBaseOptions>;
  private hooks: Map<string, THook> = new Map();

  constructor(options: Partial<TBaseOptions>) {
    this.bOptions = { ...DEFAULT_BASE_OPTIONS, ...options };
    this.logger = DEFAULT_BASE_LOGGER as TBaseLogger<TLogger>;
  }

  protected getLogger(): TBaseLogger<TLogger> {
    return this.logger;
  }

  public setLogger(logger: TBaseLogger<TLogger>): this {
    this.logger = logger;
    return this;
  }

  public sysLog(...args: Parameters<TLogger>): this {
    if (!this.bOptions.quiet) {
      const result = this.logger(...args);
      if (result && typeof result === 'object' && 'catch' in result) {
        (result as Promise<unknown>).catch(() => {});
      }
    }
    return this;
  }

  public async customLog<T extends (...args: any[]) => any>(
    logger: TBaseLogger<T>,
    ...args: Parameters<T>
  ) {
    await logger(...args);
    return this;
  }

  protected setHooks<T extends Record<string, THook> = {}>(hooks: T) {
    Object.entries(hooks).forEach(([name, handler]) => {
      if (this.hooks.has(name)) {
        this.hooks.get('onHookOverriding')?.call(this, name);
      }

      this.hooks.set(name, handler);
    });
    return this;
  }

  protected runHook<Hooks extends Record<string, THook>, K extends keyof Hooks>(
    name: K,
    ...args: Parameters<Hooks[K]>
  ): ReturnType<Hooks[K]> {
    if (!this.hooks.has(name as string)) {
      this.hooks.get('onHookNotFound')?.call(this, name as string);
      return undefined as any;
    }

    return this.hooks.get(name as string)!.call(this, ...args);
  }

  protected getHooks(): Record<string, THook> {
    return Object.fromEntries(this.hooks.entries()) as Record<string, THook>;
  }
}

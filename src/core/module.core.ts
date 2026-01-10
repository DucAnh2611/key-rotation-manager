import { TModuleHooks, TModuleOptions } from 'src/types';
import { DEFAULT_MODULE_OPTIONS } from 'src/constants/default.constant';
import { KeyManager } from './key-manager.core';

export class KM extends KeyManager {
  private options: Required<TModuleOptions>;

  constructor(options: Partial<TModuleOptions>) {
    super(options);

    this.options = {
      ...DEFAULT_MODULE_OPTIONS,
      ...options,
    };
  }

  public setOptions(options: TModuleOptions): this {
    this.options = {
      ...DEFAULT_MODULE_OPTIONS,
      ...options,
    };
    return this;
  }

  public getOptions(): TModuleOptions | undefined {
    return this.options;
  }

  /**
   *
   * @param instance: use instance options to create new instance
   * @param extend: overide options
   * @returns new instance
   */
  public clone(extend: Partial<TModuleOptions> = {}): KM {
    const module = new KM({ ...this.getOptions(), ...extend });

    if (this.saveKeyFn) module.useSaveKey(this.saveKeyFn);
    if (this.getKeyFn) module.useGetKey(this.getKeyFn);
    if (this.storePath) module.useStorePath(this.storePath);

    module.setHooks(this.getHooks());
    module.setLogger(this.getLogger());

    return module;
  }

  public useHooks(hooks: Partial<{ [x in keyof TModuleHooks]: TModuleHooks[x] }>) {
    this.setHooks(hooks);
    return this;
  }

  public setHook<HookName extends keyof TModuleHooks>(
    name: HookName,
    handler: TModuleHooks[HookName]
  ) {
    this.setHooks({ [name]: handler });
    return this;
  }
}

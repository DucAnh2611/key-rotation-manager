import { TModuleOptions } from 'src/types';
import { DEFAULT_MODULE_OPTIONS } from 'src/constants/default.constant';
import { KeyManager } from './key-manager.core';

export class Module extends KeyManager {
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
}

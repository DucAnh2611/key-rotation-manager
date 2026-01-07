import { KM } from './core/module.core';
import * as types from './types';
export * from './types';

let instance: KM | null = null;

/**
 *
 * @param options: Options to create new instance
 * @param only: use session instance or create new instance
 * @returns new instance
 */
export const create = (options: Partial<types.TModuleOptions> = {}, only: boolean = true): KM => {
  if (only) return new KM(options);

  if (!instance) {
    instance = new KM(options);
  }

  return instance;
};

/**
 * @alias create()
 */
export const km = create;
export type { KM };

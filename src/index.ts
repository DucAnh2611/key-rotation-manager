import { KM } from './core/module.core';
import * as types from './types';
export * from './types';

let instance: KM | null = null;

/**
 * Create a new KeyManager instance
 * @param options - Options to configure the instance
 * @param singleton - If true, returns a shared singleton instance; if false, creates a new instance
 * @returns KM instance
 */
export const create = (
  options: Partial<types.TModuleOptions> = {},
  singleton: boolean = false
): KM => {
  if (!singleton) return new KM(options);

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

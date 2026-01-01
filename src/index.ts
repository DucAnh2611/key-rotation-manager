import { Module } from './core/module.core';
import * as types from './types';
export * from './types';

let instance: Module | null = null;

/**
 *
 * @param options: Options to create new instance
 * @param only: use session instance or create new instance
 * @returns new instance
 */
export const create = (
  options: Partial<types.TModuleOptions> = {},
  only: boolean = true
): Module => {
  if (only) return new Module(options);

  if (!instance) {
    instance = new Module(options);
  }

  return instance;
};

/**
 *
 * @param instance: use instance options to create new instance
 * @param extend: overide options
 * @returns new instance
 */
export const clone = (instance: Module, extend?: Partial<types.TModuleOptions>): Module => {
  return new Module({ ...instance.getOptions(), ...extend });
};

/**
 * @alias create()
 */
export const km = create;

// internal use
export * from './utils/crypto.util';
export * from './utils/file.util';
export * from './utils/string.util';

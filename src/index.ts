import { Module } from './core/module.core';
import * as types from './types';
import * as crypto from './utils/crypto.util';
import * as file from './utils/file.util';
import * as string from './utils/string.util';

let instance: Module | null = null;

/**
 *
 * @param options: Options to create new instance
 * @param only: use session instance or create new instance
 * @returns new instance
 */
const create = (options: Partial<types.TModuleOptions> = {}, only: boolean = false): Module => {
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
const clone = (instance: Module, extend?: Partial<types.TModuleOptions>): Module => {
  return new Module({ ...instance.getOptions(), ...extend });
};

/**
 * @alias create()
 */
const m = create;

const utils = {
  ...crypto,
  ...string,
  ...file,
};
export { types, create, clone, m, utils };

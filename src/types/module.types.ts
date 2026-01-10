import { TBaseHooks } from './base.type';
import { TKeyManagerHooks, TKeyManagerOptions } from './key-manager.types';

export type TModuleOptions = Partial<TKeyManagerOptions> & {};

export enum EError {}

export type TModuleHooks = TKeyManagerHooks & TBaseHooks & {};

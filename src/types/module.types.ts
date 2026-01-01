import { TKeyManagerOptions } from './key-manager.types';

export type TModuleOptions = Partial<TKeyManagerOptions> & {
  quiet: boolean;
};

export enum EError {}

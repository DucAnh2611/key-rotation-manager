import { TStoreOptions } from './store.types';

export type TKeyManagerOptions = Partial<TStoreOptions> & {
  versionGenerator: () => string;
};

export type TKeyDurationUnit = 'seconds' | 'minutes' | 'hours' | 'days';

export type TGetKeyOptions = {
  path: string;
  version: string;
  onRotate?: Omit<Required<TGenerateKeyOptions>, 'type'>;
};

export type TGenerateKeyOptions = {
  type: string;
  duration?: number;
  unit?: TKeyDurationUnit;
  rotate?: boolean;
  /**
   * Merge keys into 1 files or multiple files
   */
  merge?: boolean;
};

export type TKeyGenerated = {
  /**
   * ISO
   */
  from: string;
  /**
   * ISO
   */
  to: 'NON_EXPIRED' | (string & {});
  /**
   * Key type
   */
  type: string;
  /**
   * Original key
   */
  key: string;
  /**
   * Hashed key
   */
  hashed: string;
  /**
   * version of current key
   */
  version: number | string;
  /**
   * auto renew on expired
   */
  rotate: boolean;
};

export type TKeyPrimitive = string | number;
export type TKeyVariablesData = TKeyPrimitive | TKeyPrimitive[];
export type TKeyVariables = {
  [key: string]: TKeyVariablesData | TKeyVariables;
};

export type TKeyBindValues = {
  version: number;
  type: string;
  ext: string;
};

export type TGetKeyResult = {
  validKey: TKeyGenerated;
  expiredKey?: TKeyGenerated;
};

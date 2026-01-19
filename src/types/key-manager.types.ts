import { TStoreOptions } from './store.types';

export type TKeyManagerOptions = Partial<TStoreOptions> & {
  /**
   * Version generator function
   * This function will be used to generate the version of the key
   * @returns string | number | Promise<string | number>
   */
  versionGenerator: () => string | number | Promise<string | number>;
};

export type TKeyDurationUnit = 'seconds' | 'minutes' | 'hours' | 'days';

export type TGetKey = { expired: TKeyGenerated | null; ready: TKeyGenerated | null };

export type TGetKeyOptions = {
  path: string;
  version: string;
  disableHooks?: boolean;
  onRotate?: Omit<Required<TGenerateKeyOptions>, 'type' | 'keyLength' | 'merge'> &
    Pick<TGenerateKeyOptions, 'keyLength' | 'merge'>;
};

export type TKeyManagerHooks = {
  /**
   * This will fire when key is rotatable but expired and missing options to rotate
   */
  onKeyMissingRotateOption: (key: TKeyGenerated, options: TGetKeyOptions) => void | Promise<void>;
  /**
   * This will fire when key is invalid includes validate types, from date, to date, etc...
   */
  onKeyInvalid: (
    key: TKeyGenerated,
    message: string,
    errorOn?: keyof TKeyGenerated
  ) => void | Promise<void>;
  /**
   * This will fire when key is renewed
   */
  onKeyRenewed: (getKey: TGetKey, path: string, options: TGetKeyOptions) => void | Promise<void>;
  /**
   * This will fire when key file is not found or version is not found in file
   * @description
   * IMPORTANT: every file invalid should return `{}` as key data and this will caused this event to be fired
   * - Invalid file (file not found or not valid json)
   * - Version not found in file
   * - From date in future
   * - Properties in key data is not valid types
   * - hashedBytes is less than 0
   */
  onKeyNotFound: (path: string, version: string | number) => void | Promise<void>;
  onKeyExpired: (path: string, key: TKeyGenerated) => void | Promise<void>;
};

export type TGenerateKeyOptions = {
  type: string;
  keyLength?: number;
  duration?: number;
  unit?: TKeyDurationUnit;

  /**
   * @property
   * Mark key as rotateable
   * - If this is `true` this options of `getKey` will define the next key whether it will be rotated or not
   * - If this is `false` this key will not be rotated even if it is expired
   */
  rotate?: boolean;

  /**
   * @property
   * Merge keys into 1 files or multiple files
   * - if this is `true`, becareful with `file` and `path` have {{version}} or {{variables}} is dynamic
   * - Suggest to use file, path static defines for merge keys
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
   * Hashed key bytes
   */
  hashedBytes: number;
  /**
   * Version of current key
   */
  version: number | string;
  /**
   * Auto renew on expired
   */
  rotate: boolean;
  /**
   * Secret used to hash the key
   */
  secret?: string;
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

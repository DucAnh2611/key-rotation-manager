import { TCryptoOptions } from './crypto.type';
import { TEventsOptions } from './events.types';
import { TKeyBindValues, TKeyGenerated } from './key-manager.types';

type TKeyFileFormat = `{{${keyof TKeyBindValues}}}` | (string & {});

export type TFormatUsable = Array<TKeyFileFormat> | TKeyFileFormat;

export type TStoreOptions = TEventsOptions & {
  /**
   * Path to the folder where the store will be stored.
   * @default ['keys', '{{type}}'] // -> root/keys/{{type}}
   */
  path: string | string[];

  /**
   * File name to use for the store.
   * @default ['v', '{{version}}'] // -> root/keys/{{type}}/v_[1,2,...].txt
   */
  file: TFormatUsable;

  /**
   * File name splitor to use for the store.
   * @default '_'
   */
  fileSplitor: string;

  /**
   * File name splitor to use for the store.
   * @default 'json'
   */
  fileExt: string;

  /**
   * Add keys folder to .gitignore file
   * @default true
   */
  gitIgnore: boolean;

  /**
   * Options for cyprto hash, verify, encrypt, decrypt keys
   */
  crypto: Partial<TCryptoOptions>;
};

/**
 * @param filename filename after binded data into variables {{...}}
 * @param key key generated
 * @param merge merge into 1 file
 */
export type TSaveKeyFn = (filename: string, key: TKeyGenerated, merge: boolean) => Promise<string>;

/**
 * @param path full path
 * @param version version of target key
 */
export type TGetKeyFn = (path: string, version: string) => Promise<TKeyGenerated | null>;

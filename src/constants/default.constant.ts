import { TEventsOptions, TModuleOptions, TStoreOptions } from 'src/types';
import { TCryptoOptions } from 'src/types/crypto.type';
import { TKeyManagerOptions } from 'src/types/key-manager.types';

export const DEFAULT_CRYPTO_OPTIONS: Required<TCryptoOptions> = {
  algorithm: 'aes-256-gcm',
  kdf: 'scrypt',
  hashAlgorithm: 'sha256',
  keyLength: 32,
  ivLength: 16,
  saltLength: 32,
  tagLength: 16,
  iterations: 100000,
  encoding: 'base64',
};

export const DEFAULT_EVENTS_OPTIONS: Required<TEventsOptions> = {
  // Event
  useEvent: true,
};

export const DEFAULT_STORE_OPTIONS: Required<TStoreOptions> = {
  path: ['keys'],
  file: ['{{type}}', 'v', '{{version}}'],
  fileSplitor: '_',
  fileExt: 'json',
  gitIgnore: true,

  ...DEFAULT_EVENTS_OPTIONS,

  // Key manager
  crypto: DEFAULT_CRYPTO_OPTIONS,
};

export const DEFAULT_KEY_MANAGER_OPTIONS: Required<TKeyManagerOptions> = {
  // Store
  ...DEFAULT_STORE_OPTIONS,

  versionGenerator: () => new Date().getTime().toString(),
};

export const DEFAULT_MODULE_OPTIONS: Required<TModuleOptions> = {
  ...DEFAULT_KEY_MANAGER_OPTIONS,

  // Module
  quiet: false,
};

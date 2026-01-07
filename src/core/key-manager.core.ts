import {
  TGenerateKeyOptions,
  TGetKey,
  TGetKeyEvents,
  TGetKeyOptions,
  TKeyGenerated,
  TKeyManagerOptions,
  TKeyVariables,
} from 'src/types/key-manager.types';
import { Store } from './store.core';
import { CryptoService } from 'src/utils/crypto.util';
import { DEFAULT_KEY_MANAGER_OPTIONS } from 'src/constants/default.constant';
import { addDuration, bindString, isDate, isType } from 'src/utils/string.util';
import { executePromisably, promiseAll } from 'src/utils/promise.util';

export class KeyManager extends Store {
  private cryptoService: CryptoService;
  private kOptions: Required<TKeyManagerOptions>;

  constructor(options: Partial<TKeyManagerOptions>) {
    super(options);

    this.kOptions = { ...DEFAULT_KEY_MANAGER_OPTIONS, ...options };
    this.cryptoService = new CryptoService(this.kOptions.crypto);
  }

  /**
   * Retrieve and validate a stored key by path and version.
   *
   * This method:
   * - Loads a key from the configured store
   * - Validates structure, type safety, and time constraints
   * - Detects expiration and rotation eligibility
   * - Optionally auto-rotates an expired key if rotation options are provided
   *
   * If the key is expired and marked as rotatable, a new key will be generated
   * automatically using the provided `onRotate` options.
   *
   * @param options Configuration for key retrieval
   * @param options.path Storage path of the key
   * @param options.version Specific key version to retrieve
   * @param options.onRotate Optional rotation configuration used when the key
   *        is expired and renewable
   *
   * @param events Configuration for event triggered
   *
   * @returns An object containing:
   * - `ready`: The valid (usable) key, or the newly generated key after rotation
   * - `expired`: The expired key if rotation occurred, otherwise `null`
   *
   * @throws Error if:
   * - The key does not exist
   * - The key structure or fields are invalid
   * - The key is expired but rotation options are missing
   * - The key is not yet valid or otherwise unusable
   *
   * @example
   * ```ts
   * const { ready, expired } = await keyManager.getKey({
   *   path: '/keys/api',
   *   version: 'v1',
   *    // This define the new key attributes: is it rotate? Durations and unit?
   *   onRotate: {
   *     duration: 30,
   *     unit: 'days',
   *     rotate: true,
   *   },
   * });
   *
   * if (expired) {
   *   console.log('Key was rotated from version:', expired.version);
   * }
   *
   * // Use expired.originKey ?? ready.originKey safely
   * ```
   */
  public async getKey(
    options: TGetKeyOptions,
    /**
     * If this is not provided, the key manager will throw error instead of fire event
     */
    events: Partial<TGetKeyEvents> = {}
  ): Promise<TGetKey> {
    const { path, version } = options;

    const key = await this.getKeyByStore(path, String(version));

    if (!key) {
      await executePromisably(events.onKeyNotFound?.bind(this)(path, version));
      await this.sysLog(`Key not found!`, {
        path,
        version,
      });
      return { expired: null, ready: null };
    }

    const { ok, message, isExpired, isRenewable, errorOn } = this.validateKey(key);

    if (!ok && isExpired && isRenewable && key) {
      if (!options.onRotate) {
        await promiseAll(
          executePromisably(events.onMissingRotateOption?.bind(this)(key, options)),
          this.sysLog('Expired rotate options not provided!', {
            options,
          })
        );
        return { expired: null, ready: null };
      }

      const renew = await this.newKey({
        type: key.type,
        ...options.onRotate,
      });

      await promiseAll(
        executePromisably(
          events.onKeyRenewed?.bind(this)({ expired: key, ready: renew.key }, options.onRotate)
        ),
        this.sysLog(`Key renewed!`, {
          path,
          version,
        })
      );

      return { expired: key, ready: renew.key };
    }

    if (!ok && isExpired && !isRenewable && key) {
      await promiseAll(
        executePromisably(events.onExpired?.bind(this)(path, key)),
        this.sysLog(`Key expired!`, {
          path,
          version,
        })
      );
      return { expired: key, ready: null };
    }

    if (!ok) {
      await promiseAll(
        executePromisably(events.onKeyInvalid?.bind(this)(key, message, errorOn)),
        this.sysLog(`Key is invalid!`, {
          path,
          version,
          reason: errorOn,
          message,
        })
      );
      return { expired: null, ready: null };
    }

    return { expired: null, ready: key };
  }

  /**
   * Generate a new cryptographic key and persist it to the configured store.
   *
   * This method:
   * - Generates a random origin key
   * - Hashes the key using the configured crypto options
   * - Calculates an expiration time (if provided)
   * - Assigns versioning and rotation metadata
   * - Saves the generated key to storage
   * - The hashed key will follow this format: `salt-buffer:hashed`
   *
   * @param options Configuration for key generation
   * @param options.type Logical key type (e.g. api, session, encryption, etc.)
   * @param options.duration Optional lifetime value for the key
   * @param options.unit Time unit for the duration (seconds | minutes | hours | days)
   * @param options.rotate Whether this key should participate in key rotation
   * @param options.merge Whether to merge with an existing stored key (if supported)
   *
   * @param variables Optional variables used for dynamic path or filename resolution
   *
   * @returns An object containing:
   * - `key`: The generated key metadata and raw key value
   * - `path`: The storage path where the key was saved
   *
   * @example
   * ```ts
   * const { key, path } = await keyManager.newKey(
   *   {
   *     type: 'api',
   *     duration: 30, <- Optional
   *     unit: 'days', <- Optional
   *     rotate: true, <- Optional
   *   },
   *   { env: 'production', ... }
   * );
   * ```
   */
  public async newKey(
    options: TGenerateKeyOptions,
    variables: TKeyVariables = {}
  ): Promise<{ key: TKeyGenerated; path: string }> {
    const { rotate, duration, type, unit, merge, keyLength } = options;

    const { key, length: kLength } = this.cryptoService.generateKey(keyLength);
    const { salt } = this.cryptoService.generateSalt();

    await this.sysLog(`Key generated\nOptions:`, options);

    const hashedKey = this.cryptoService.hash(key, salt);
    const now = new Date();

    const keyGenerated: TKeyGenerated = {
      from: now.toISOString(),
      to: duration && unit ? addDuration(now, duration, unit).toISOString() : 'NON_EXPIRED',
      key: key,
      hashed: hashedKey,
      hashedBytes: kLength,
      type,
      version: await executePromisably(this.kOptions.versionGenerator()),
      rotate: !!rotate,
    };

    const path = await this.saveKeyToStore(keyGenerated, !!merge, variables);
    await this.sysLog(`Key saved!`, {
      path,
      version: keyGenerated.version,
      type: keyGenerated.type,
    });

    return { key: keyGenerated, path };
  }

  private async getKeyByStore(path: string, version: string): Promise<TKeyGenerated | null> {
    if (this.getKeyFn) {
      return this.getKeyFn(path, version);
    }

    const savedData = await this.getKeyFileData(path);
    return savedData[version] ?? null;
  }

  private async saveKeyToStore(
    key: TKeyGenerated,
    merge: boolean,
    variables: TKeyVariables
  ): Promise<string> {
    return (this.saveKeyFn?.bind(this) ?? this.saveKeyFile.bind(this))(
      this.getFilename({ ...variables, version: key.version, type: key.type }),
      key,
      merge
    );
  }

  private validateKey(keyGenerated: Partial<TKeyGenerated>): {
    ok: boolean;
    message: string;
    errorOn?: keyof TKeyGenerated;
    isExpired?: boolean;
    isRenewable?: boolean;
  } {
    const requiredKeyGenerated = keyGenerated as TKeyGenerated;

    const typeChecks: Record<keyof TKeyGenerated, keyof ReturnType<typeof isType>> = {
      from: 'string',
      to: 'string',
      key: 'string',
      hashed: 'string',
      rotate: 'boolean',
      type: 'string',
      version: 'string',
      hashedBytes: 'number',
    };

    for (const [field, type] of Object.entries(typeChecks) as Array<
      [field: keyof TKeyGenerated, type: keyof ReturnType<typeof isType>]
    >) {
      if (!isType(requiredKeyGenerated[field])[type])
        return { ok: false, message: `${field} is not valid`, errorOn: field };
    }

    if (!isDate(requiredKeyGenerated.from)) {
      return { ok: false, message: 'From date is not valid!', errorOn: 'from' };
    } else if (new Date(requiredKeyGenerated.from) > new Date()) {
      return { ok: false, message: 'Key is not started!' };
    }

    if (!isDate(requiredKeyGenerated.to)) {
      if (requiredKeyGenerated.to !== 'NON_EXPIRED') {
        return { ok: false, message: 'Expire date is not valid!', errorOn: 'to' };
      }
    } else if (new Date(requiredKeyGenerated.to) < new Date()) {
      return {
        ok: false,
        message: 'Key is expired',
        errorOn: 'to',
        isExpired: true,
        isRenewable: !!requiredKeyGenerated.rotate,
      };
    }

    if (requiredKeyGenerated.hashedBytes < 0)
      return {
        ok: false,
        message: 'Invalid hashedBytes range',
        errorOn: 'hashedBytes',
      };

    return { ok: true, message: '' };
  }

  private getFilename(variables: TKeyVariables) {
    return bindString(
      bindString(`{{root}}/{{filename}}.{{ext}}`, {
        root: this.getPath(this.kOptions.path, '/'),
        filename: this.getPath(this.kOptions.file, this.kOptions.fileSplitor),
        ext: this.kOptions.fileExt,
      }),
      variables
    );
  }
}

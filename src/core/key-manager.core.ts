import {
  TGenerateKeyOptions,
  TGetKeyOptions,
  TKeyGenerated,
  TKeyManagerOptions,
  TKeyVariables,
} from 'src/types/key-manager.types';
import { Store } from './store.core';
import { CryptoService } from 'src/utils/crypto.util';
import { DEFAULT_KEY_MANAGER_OPTIONS } from 'src/constants/default.constant';
import { addDuration, bindString, isDate, isType } from 'src/utils/string.util';

export class KeyManager extends Store {
  private cryptoService: CryptoService;
  private kOptions: Required<TKeyManagerOptions>;

  constructor(options: Partial<TKeyManagerOptions>) {
    super(options);

    this.kOptions = { ...DEFAULT_KEY_MANAGER_OPTIONS, ...options };
    this.cryptoService = new CryptoService(this.kOptions.crypto);
  }

  public async getKey(
    options: TGetKeyOptions
  ): Promise<{ expired: TKeyGenerated | null; ready: TKeyGenerated | null }> {
    const { path, version } = options;

    let key: TKeyGenerated | null = await this.getKeyByStore(path, String(version));
    let expired: TKeyGenerated | null = null;

    const { ok, message, isExpired, isRenewable, errorOn } = this.validateKey(key);

    if (!ok && isExpired && isRenewable && key) {
      if (!options.onRotate) throw new Error('Expired rotate options not provided');

      const renew = await this.newKey({
        type: key.type,
        ...options.onRotate,
      });

      return { expired: key, ready: renew.key };
    }

    if (!ok && key)
      throw new Error(
        `${message}\nPath: ${path}\nVersion: ${version}\nReason: ${errorOn}`
      );

    return { expired, ready: key };
  }

  public async newKey(
    options: TGenerateKeyOptions,
    variables: TKeyVariables = {}
  ): Promise<{ key: TKeyGenerated; path: string }> {
    const { rotate, duration, type, unit, merge } = options;

    const originKey = this.cryptoService.generateRandom(this.kOptions.crypto.keyLength!);
    const salt = this.cryptoService.generateRandom(this.kOptions.crypto.saltLength!);

    const hashedKey = this.cryptoService.hash(originKey, salt);
    const now = new Date();

    const keyGenerated: TKeyGenerated = {
      from: now.toISOString(),
      to: duration && unit ? addDuration(now, duration, unit).toISOString() : 'NON_EXPIRED',
      key: originKey,
      hashed: hashedKey,
      type,
      version: this.kOptions.versionGenerator(),
      rotate: !!rotate,
    };

    const path = await this.saveKeyToStore(keyGenerated, !!merge, variables);

    return { key: keyGenerated, path };
  }

  private async getKeyByStore(path: string, version: string): Promise<TKeyGenerated | null> {
    if (this.getKeyFn) {
      return this.getKeyFn(path, version);
    }

    const savedData = await this.getKeyFileData(path);
    return savedData?.[version] ?? null;
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

  private validateKey(keyGenerated: Partial<TKeyGenerated> | null): {
    ok: boolean;
    message: string;
    errorOn?: keyof TKeyGenerated;
    isExpired?: boolean;
    isRenewable?: boolean;
  } {
    if (!keyGenerated) return { ok: false, message: 'Key is not generated' };

    const requiredKeyGenerated = keyGenerated as TKeyGenerated;

    const typeChecks: Record<keyof TKeyGenerated, keyof ReturnType<typeof isType>> = {
      from: 'string',
      to: 'string',
      key: 'string',
      hashed: 'string',
      rotate: 'boolean',
      type: 'string',
      version: 'string',
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

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  pbkdf2Sync,
  createHash,
} from 'crypto';
import { DEFAULT_CRYPTO_OPTIONS } from 'src/constants/default.constant';
import { TCryptoOptions } from 'src/types/crypto.type';

export class CryptoService {
  private options: TCryptoOptions;

  constructor(options: Partial<TCryptoOptions> = {}) {
    this.options = { ...DEFAULT_CRYPTO_OPTIONS, ...options };
  }

  /**
   * Generate cryptographically secure random string
   */
  generateRandom(length: number = 32): string {
    return randomBytes(length).toString(this.options.encoding);
  }

  /**
   * Derive key from password
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    if (this.options.kdf === 'none') {
      return Buffer.from(password, 'hex');
    }

    if (this.options.kdf === 'scrypt') {
      return scryptSync(password, salt, this.options.keyLength);
    }

    return pbkdf2Sync(
      password,
      salt,
      this.options.iterations,
      this.options.keyLength,
      this.options.hashAlgorithm
    );
  }

  /**
   * Encrypt data
   */
  encrypt(plainText: string, secret: string): string {
    const salt =
      this.options.kdf !== 'none' ? randomBytes(this.options.saltLength) : Buffer.alloc(0);

    const key = this.deriveKey(secret, salt);
    const iv = randomBytes(this.options.ivLength);
    const cipher = createCipheriv(this.options.algorithm, key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const hasAuth = this.options.algorithm.includes('gcm');
    const authTag = hasAuth ? (cipher as any).getAuthTag() : null;

    // Combine: salt + iv + authTag + encrypted
    const parts = [salt, iv];
    if (authTag) parts.push(authTag);
    parts.push(Buffer.from(encrypted, 'hex'));

    return Buffer.concat(parts).toString(this.options.encoding);
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: string, secret: string): string {
    const buffer = Buffer.from(encryptedData, this.options.encoding);

    let offset = 0;
    const salt =
      this.options.kdf !== 'none'
        ? buffer.subarray(offset, (offset += this.options.saltLength))
        : Buffer.alloc(0);

    const iv = buffer.subarray(offset, (offset += this.options.ivLength));

    const hasAuth = this.options.algorithm.includes('gcm');
    const authTag = hasAuth ? buffer.subarray(offset, (offset += this.options.tagLength)) : null;

    const encrypted = buffer.subarray(offset);

    const key = this.deriveKey(secret, salt);
    const decipher = createDecipheriv(this.options.algorithm, key, iv);

    if (authTag) {
      (decipher as any).setAuthTag(authTag);
    }

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash data (one-way)
   */
  hash(data: string, salt?: string): string {
    const saltBuffer = salt ? Buffer.from(salt, this.options.encoding) : randomBytes(16);

    const hash = createHash(this.options.hashAlgorithm)
      .update(data)
      .update(saltBuffer)
      .digest(this.options.encoding);

    return `${saltBuffer.toString(this.options.encoding)}:${hash}`;
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    const [salt, _originalHash] = hashedData.split(':');
    const newHash = this.hash(data, salt);

    return newHash === hashedData;
  }
}

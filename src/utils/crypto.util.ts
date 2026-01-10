import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import { DEFAULT_CRYPTO_OPTIONS } from 'src/constants/default.constant';
import { TCryptoOptions } from 'src/types/crypto.type';

export class CryptoService {
  private options: Required<TCryptoOptions>;

  constructor(options: Partial<TCryptoOptions> = {}) {
    this.options = { ...DEFAULT_CRYPTO_OPTIONS, ...options };
  }

  /**
   * Generate random bytes and encode them
   */
  generateRandom(length: number = 32): string {
    const buffer = randomBytes(length);
    return this.encodeBuffer(buffer);
  }

  /**
   * Generate a random key
   * @param length Length of the key in bytes
   * @default cryptoOptions.keyLength
   */
  generateKey(length: number = this.options.keyLength) {
    return { key: this.generateRandom(length), length } as const;
  }

  /**
   * Generate a random salt
   * @param length Length of the salt in bytes
   * @default cryptoOptions.saltLength
   */
  generateSalt(length: number = this.options.saltLength) {
    return { salt: this.generateRandom(length), length } as const;
  }

  /**
   * Generate a random IV
   * @param length Length of the IV in bytes
   * @default cryptoOptions.ivLength
   */
  generateIV(length: number = this.options.ivLength) {
    return { iv: this.generateRandom(length), length } as const;
  }

  private encodeBuffer(buffer: Buffer): string {
    switch (this.options.encoding) {
      case 'hex':
        return buffer.toString('hex');
      case 'base64url':
        return buffer.toString('base64url');
      case 'base64':
      default:
        return buffer.toString('base64');
    }
  }

  private decodeToBuffer(encoded: string): Buffer {
    switch (this.options.encoding) {
      case 'hex':
        return Buffer.from(encoded, 'hex');
      case 'base64url':
        return Buffer.from(encoded, 'base64url');
      case 'base64':
      default:
        return Buffer.from(encoded, 'base64');
    }
  }

  private deriveKey(password: string, salt: Buffer, keyLength?: number): Buffer {
    if (this.options.kdf === 'none') {
      return Buffer.from(password, 'hex');
    }

    const actualKeyLength = keyLength ?? this.options.keyLength;
    return pbkdf2Sync(
      password,
      salt,
      this.options.iterations,
      actualKeyLength,
      this.options.hashAlgorithm
    );
  }

  /**
   * Encrypt data using AES-CBC
   * @param plainText Text to encrypt
   * @param secret Secret key for encryption
   * @param options Optional lengths for key, salt, and IV
   */
  encrypt(
    plainText: string,
    secret: string,
    {
      keyLength,
      saltLength,
      ivLength,
    }: { keyLength?: number; saltLength?: number; ivLength?: number } = {}
  ): string {
    keyLength = keyLength ?? this.options.keyLength;
    saltLength = saltLength ?? this.options.saltLength;
    ivLength = ivLength ?? this.options.ivLength;

    const salt = this.options.kdf !== 'none' ? randomBytes(saltLength) : Buffer.alloc(0);
    const iv = randomBytes(ivLength);
    const key = this.deriveKey(secret, salt, keyLength);

    const cipher = createCipheriv(this.options.algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);

    // Pack: keyLength(2) + saltLength(2) + ivLength(2) + salt + iv + encrypted
    const keyLengthBuf = Buffer.alloc(2);
    keyLengthBuf.writeUInt16BE(keyLength);

    const saltLengthBuf = Buffer.alloc(2);
    saltLengthBuf.writeUInt16BE(salt.length);

    const ivLengthBuf = Buffer.alloc(2);
    ivLengthBuf.writeUInt16BE(ivLength);

    const combined = Buffer.concat([keyLengthBuf, saltLengthBuf, ivLengthBuf, salt, iv, encrypted]);

    return this.encodeBuffer(combined);
  }

  /**
   * Decrypt data
   * @param encryptedData Encrypted data to decrypt
   * @param secret Secret key for decryption
   * @returns Decrypted string, or empty string if decryption fails (wrong password/corrupted data)
   */
  decrypt(encryptedData: string, secret: string): string {
    try {
      const combined = this.decodeToBuffer(encryptedData);
      let offset = 0;

      // Read lengths (2 bytes each)
      const keyLength = combined.readUInt16BE(offset);
      offset += 2;
      const saltLength = combined.readUInt16BE(offset);
      offset += 2;
      const ivLength = combined.readUInt16BE(offset);
      offset += 2;

      // Read salt, iv, and encrypted data
      const salt = combined.subarray(offset, offset + saltLength);
      offset += saltLength;

      const iv = combined.subarray(offset, offset + ivLength);
      offset += ivLength;

      const encrypted = combined.subarray(offset);

      const key = this.deriveKey(secret, salt, keyLength);

      const decipher = createDecipheriv(this.options.algorithm, key, iv);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return decrypted.toString('utf8');
    } catch {
      // Return empty string on decryption failure (wrong password, corrupted data, etc.)
      // This matches the behavior of crypto-js
      return '';
    }
  }

  /**
   * Hash data (one-way)
   * @param data Data to hash
   * @param secret Secret key used in hashing
   * @param salt Optional encoded salt string for deterministic hashing
   */
  hash(data: string, secret: string, salt?: string): string {
    let saltBuffer: Buffer;
    let saltStr: string;

    if (salt) {
      // Deterministic mode: use provided salt
      saltBuffer = this.decodeToBuffer(salt);
      saltStr = salt;
    } else {
      // Non-deterministic mode: generate random salt
      saltBuffer = randomBytes(this.options.saltLength);
      saltStr = this.encodeBuffer(saltBuffer);
    }

    const hash = createHash(this.options.hashAlgorithm)
      .update(data)
      .update(secret)
      .update(saltBuffer)
      .digest();

    const hashStr = this.encodeBuffer(hash);

    return `${saltStr}:${hashStr}`;
  }

  /**
   * Verify hashed data
   * @param data Data to verify
   * @param hashedData Previously hashed data (format: salt:hash)
   * @param secret Secret key used during hashing
   */
  verifyHash(data: string, hashedData: string, secret: string): boolean {
    const [saltStr, expectedHashStr] = hashedData.split(':');
    if (!saltStr || !expectedHashStr) {
      return false;
    }

    const saltBuffer = this.decodeToBuffer(saltStr);

    const hash = createHash(this.options.hashAlgorithm)
      .update(data)
      .update(secret)
      .update(saltBuffer)
      .digest();

    const hashStr = this.encodeBuffer(hash);

    // Use timing-safe comparison
    return hashStr === expectedHashStr;
  }
}

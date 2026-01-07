import CryptoJS from 'crypto-js';
import { DEFAULT_CRYPTO_OPTIONS } from 'src/constants/default.constant';
import { TCryptoOptions } from 'src/types/crypto.type';

export class CryptoService {
  private options: TCryptoOptions;

  constructor(options: Partial<TCryptoOptions> = {}) {
    this.options = { ...DEFAULT_CRYPTO_OPTIONS, ...options };
  }

  private generateRandomWordArray(length: number): CryptoJS.lib.WordArray {
    return CryptoJS.lib.WordArray.random(length);
  }

  generateRandom(length: number = 32): string {
    const wordArray = this.generateRandomWordArray(length);
    return this.encode(wordArray);
  }

  /*
   * Generate a random key
   * @param length Length of the key
   * @default cryptoOptions.keyLength
   * @returns { key: string, length: number }
   */
  generateKey(length: number = this.options.keyLength) {
    return { key: this.generateRandom(length), length } as const;
  }

  /*
   * Generate a random salt
   * @param length Length of the salt
   * @default cryptoOptions.saltLength
   * @returns { salt: string, length: number }
   */
  generateSalt(length: number = this.options.saltLength) {
    return { salt: this.generateRandom(length), length } as const;
  }

  /*
   * Generate a random IV
   * @param length Length of the IV
   * @default cryptoOptions.ivLength
   * @returns { iv: string, length: number }
   */
  generateIV(length: number = this.options.ivLength) {
    return { iv: this.generateRandom(length), length } as const;
  }

  private encode(wordArray: CryptoJS.lib.WordArray): string {
    switch (this.options.encoding) {
      case 'hex':
        return wordArray.toString(CryptoJS.enc.Hex);
      case 'base64url':
        return wordArray
          .toString(CryptoJS.enc.Base64)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      case 'base64':
      default:
        return wordArray.toString(CryptoJS.enc.Base64);
    }
  }

  private decode(encoded: string): CryptoJS.lib.WordArray {
    switch (this.options.encoding) {
      case 'hex':
        return CryptoJS.enc.Hex.parse(encoded);
      case 'base64url':
        // Convert base64url to base64
        const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - (base64.length % 4)) % 4);
        return CryptoJS.enc.Base64.parse(base64 + padding);
      case 'base64':
      default:
        return CryptoJS.enc.Base64.parse(encoded);
    }
  }

  private deriveKey(
    password: string,
    salt: CryptoJS.lib.WordArray,
    keyLength?: number
  ): CryptoJS.lib.WordArray {
    if (this.options.kdf === 'none') {
      return CryptoJS.enc.Hex.parse(password);
    }

    const actualKeyLength = keyLength ?? this.options.keyLength;
    const keySize = actualKeyLength / 4;
    return CryptoJS.PBKDF2(password, salt, {
      keySize,
      iterations: this.options.iterations,
      hasher: this.getHasher(),
    });
  }

  private getHasher(): typeof CryptoJS.algo.SHA256 {
    switch (this.options.hashAlgorithm) {
      case 'sha512':
        return CryptoJS.algo.SHA512;
      case 'sha384':
        return CryptoJS.algo.SHA384;
      case 'sha256':
      default:
        return CryptoJS.algo.SHA256;
    }
  }

  private getAESMode(): typeof CryptoJS.mode.CBC {
    return CryptoJS.mode.CBC;
  }

  private getPadding(): typeof CryptoJS.pad.Pkcs7 {
    return CryptoJS.pad.Pkcs7;
  }

  /**
   * Encrypt data
   * @param plainText Text to encrypt
   * @param secret Secret key for encryption Key length, salt, and IV will be randomly generated within configured range
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

    const salt =
      this.options.kdf !== 'none'
        ? this.generateRandomWordArray(saltLength)
        : CryptoJS.lib.WordArray.create();
    const iv = this.generateRandomWordArray(ivLength);
    const key = this.deriveKey(secret, salt, keyLength);

    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
      iv,
      mode: this.getAESMode(),
      padding: this.getPadding(),
    });

    const actualSaltLength = salt.sigBytes;
    const keyLengthHex = keyLength.toString(16).padStart(4, '0');
    const saltLengthHex = actualSaltLength.toString(16).padStart(4, '0');
    const ivLengthHex = ivLength.toString(16).padStart(4, '0');
    const saltHex = salt.toString(CryptoJS.enc.Hex);
    const ivHex = iv.toString(CryptoJS.enc.Hex);
    const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);

    const combined = keyLengthHex + saltLengthHex + ivLengthHex + saltHex + ivHex + encryptedHex;
    return this.encode(CryptoJS.enc.Hex.parse(combined));
  }

  /**
   * Decrypt data
   * @param encryptedData Encrypted data to decrypt
   * @param secret Secret key for decryption
   */
  decrypt(encryptedData: string, secret: string): string {
    const combined = this.decode(encryptedData);
    const combinedHex = combined.toString(CryptoJS.enc.Hex);

    let offset = 0;

    // Read key, salt and IV lengths (4 hex chars = 2 bytes each)
    const keyLengthHex = combinedHex.substring(offset, offset + 4);
    offset += 4;
    const saltLengthHex = combinedHex.substring(offset, offset + 4);
    offset += 4;
    const ivLengthHex = combinedHex.substring(offset, offset + 4);
    offset += 4;

    const keyLength = parseInt(keyLengthHex, 16);
    const saltLength = parseInt(saltLengthHex, 16);
    const ivLength = parseInt(ivLengthHex, 16);

    // Read salt and IV based on their lengths stored in the encrypted data
    const saltHexLength = saltLength * 2; // hex is 2 chars per byte
    const ivHexLength = ivLength * 2;

    const saltHex = saltHexLength > 0 ? combinedHex.substring(offset, offset + saltHexLength) : '';
    offset += saltHexLength;

    const ivHex = combinedHex.substring(offset, offset + ivHexLength);
    offset += ivHexLength;

    const encryptedHex = combinedHex.substring(offset);

    const salt = saltHex ? CryptoJS.enc.Hex.parse(saltHex) : CryptoJS.lib.WordArray.create();
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const encrypted = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Hex.parse(encryptedHex),
    });

    const key = this.deriveKey(secret, salt, keyLength);

    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv,
      mode: this.getAESMode(),
      padding: this.getPadding(),
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Hash data (one-way)
   * @param data Data to hash
   * @param secret Secret key used in hashing
   * @param salt Optional encoded salt string for deterministic hashing
   */
  hash(data: string, secret: string, salt?: string): string {
    const secretWordArray = CryptoJS.enc.Utf8.parse(secret);
    const hasher = this.getHasher();

    let saltWordArray: CryptoJS.lib.WordArray;
    let saltStr: string;

    if (salt) {
      // Deterministic mode: use provided salt
      saltWordArray = this.decode(salt);
      saltStr = salt;
    } else {
      // Non-deterministic mode: generate random salt
      saltWordArray = this.generateRandomWordArray(this.options.saltLength);
      saltStr = this.encode(saltWordArray);
    }

    const hash = hasher
      .create()
      .update(data)
      .update(secretWordArray)
      .update(saltWordArray)
      .finalize();

    const hashStr = this.encode(hash);

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

    const salt = this.decode(saltStr);
    const secretWordArray = CryptoJS.enc.Utf8.parse(secret);
    const hasher = this.getHasher();

    const hash = hasher.create().update(data).update(secretWordArray).update(salt).finalize();

    const hashStr = this.encode(hash);

    return hashStr === expectedHashStr;
  }
}

export type TAlgorithmType =
  | 'aes-128-gcm'
  | 'aes-192-gcm'
  | 'aes-256-gcm'
  | 'aes-128-cbc'
  | 'aes-192-cbc'
  | 'aes-256-cbc';

export type TKeyDerivationFunction = 'scrypt' | 'pbkdf2' | 'none';

export type THashAlgorithm = 'sha256' | 'sha512' | 'sha384';

export type TEncodingType = 'base64' | 'hex' | 'base64url';

export interface TCryptoOptions {
  /**
   * Encryption algorithm used for symmetric encryption/decryption.
   *
   * - GCM variants (`aes-*-gcm`) provide **authenticated encryption**
   *   (confidentiality + integrity).
   * - CBC variants (`aes-*-cbc`) provide **encryption only** and
   *   require external integrity checks.
   *
   * @default 'aes-256-gcm'
   */
  algorithm: TAlgorithmType;

  /**
   * Key Derivation Function (KDF) used to derive a cryptographic key
   * from a password or secret.
   *
   * - `scrypt`: Memory-hard, resistant to GPU/ASIC attacks (**recommended**)
   * - `pbkdf2`: CPU-hard, widely supported, configurable via `iterations`
   * - `none`: Uses the provided secret directly as a hex-encoded key
   *           (only safe when the key is already cryptographically strong)
   *
   * @default 'scrypt'
   */
  kdf: TKeyDerivationFunction;

  /**
   * Hash algorithm used by PBKDF2 and one-way hashing (`hash()`).
   *
   * Stronger hashes (e.g. `sha512`) increase security but may
   * slightly reduce performance.
   *
   * @default 'sha256'
   */
  hashAlgorithm: THashAlgorithm;

  /**
   * Length (in bytes) of the derived encryption key.
   *
   * Must match the selected algorithm:
   * - AES-128 → 16 bytes
   * - AES-192 → 24 bytes
   * - AES-256 → 32 bytes
   *
   * @default 32
   */
  keyLength: number;

  /**
   * Length (in bytes) of the Initialization Vector (IV).
   *
   * IV must be unique per encryption.
   * 16 bytes is standard for AES.
   *
   * @default 16
   */
  ivLength: number;

  /**
   * Length (in bytes) of the random salt used by KDFs.
   *
   * Salt prevents rainbow-table attacks and ensures
   * identical passwords produce different keys.
   *
   * @default 32
   */
  saltLength: number;

  /**
   * Length (in bytes) of the authentication tag.
   *
   * Used only by AEAD algorithms (e.g. AES-GCM).
   * Ignored for non-AEAD algorithms like CBC.
   *
   * @default 16
   */
  tagLength: number;

  /**
   * Number of iterations for PBKDF2.
   *
   * Higher values increase resistance to brute-force attacks
   * at the cost of slower key derivation.
   *
   * @default 100000
   */
  iterations: number;

  /**
   * Encoding used for output strings (ciphertext, hashes, random values).
   *
   * - `base64`: Compact and widely supported
   * - `base64url`: URL-safe variant
   * - `hex`: Human-readable but larger output
   *
   * @default 'base64'
   */
  encoding: TEncodingType;
}

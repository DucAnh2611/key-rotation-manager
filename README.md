# 🔐 Key Rotation Manager

> **Flexible, file-based cryptographic key management for Node.js**

A production-ready library for generating, storing, rotating, and retrieving cryptographic keys with support for expiration, versioning, merge strategies, custom storage logic, and lifecycle hooks.

**Key Rotation Manager** is a comprehensive Node.js library for secure cryptographic key management. It provides automatic key rotation, expiration handling, versioning, and flexible storage options. Perfect for API key management, token rotation, secret management, and credential handling in production applications.

[![npm version](https://img.shields.io/npm/v/key-rotation-manager)](https://www.npmjs.com/package/key-rotation-manager)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Core Concepts](#-core-concepts)
  - [Creating Keys](#creating-keys)
  - [Retrieving Keys](#retrieving-keys)
  - [Key Rotation](#key-rotation)
- [Advanced Usage](#-advanced-usage)
  - [Custom Storage Logic](#custom-storage-logic)
  - [Custom Path & File Naming](#custom-path--file-naming)
  - [Hooks & Lifecycle Events](#hooks--lifecycle-events)
  - [Logging](#logging)
  - [Instance Cloning](#instance-cloning)
- [API Reference](#-api-reference)
- [Use Cases](#-use-cases)
- [Changelog](#-changelog)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- 🔐 **Secure Key Generation** - AES-256-CBC encryption with PBKDF2 key derivation
- 🔄 **Automatic Rotation** - Built-in expiration and rotation support
- 🗂 **Flexible Storage** - File-based storage with configurable structure
- 🧩 **Merge Strategies** - Support for single-file or multi-file key storage
- 🔧 **Extensible** - Custom save/get hooks and storage logic
- 📡 **Event-Driven** - Lifecycle hooks for key events
- 📁 **Git Integration** - Automatic `.gitignore` management
- 🎯 **TypeScript** - Full TypeScript support with comprehensive types
- ⚡ **Zero Dependencies** - Uses native Node.js crypto module
- 🚀 **Production Ready** - Battle-tested for enterprise applications

---

## 📦 Installation

```bash
npm install key-rotation-manager
```

**Requirements:** Node.js >= 18.0.0

**Package:** [npmjs.com/package/key-rotation-manager](https://www.npmjs.com/package/key-rotation-manager)

---

## 🚀 Quick Start

```typescript
import { create } from 'key-rotation-manager';

// Initialize key manager
const keyManager = create();

// Generate a new key
const { key, path } = await keyManager.newKey({
  type: 'api',
  duration: 30,
  unit: 'days',
  rotate: true,
});

console.log('Key generated:', key.key);
console.log('Storage path:', path);

// Retrieve the key
const result = await keyManager.getKey({
  path,
  version: key.version,
});
```

---

## ⚙️ Configuration

### Default Options

```typescript
{
  // Storage configuration
  path: ['keys', '{{type}}'],        // Directory structure (supports variables)
  file: ['v', '{{version}}'],        // File naming pattern
  fileSplitor: '_',                  // File name separator
  fileExt: 'json',                   // File extension
  gitIgnore: true,          // Auto-update .gitignore (boolean | string | string[])

  // Cryptographic settings
  crypto: {
    algorithm: 'aes-256-cbc',
    kdf: 'pbkdf2',
    hashAlgorithm: 'sha256',
    keyLength: 32,
    ivLength: 16,
    saltLength: 32,
    tagLength: 16,
    iterations: 100000,
    encoding: 'base64',
  },

  // Version generation
  versionGenerator: () => Date.now().toString()
}
```

### File Structure

With default settings, keys are stored as:

```
keys/
└── {{type}}/
    └── v_{{version}}.json
```

**Example:** `keys/api/v_1704067200000.json`

### Git Ignore Configuration

The `gitIgnore` option controls how the key storage folder is added to `.gitignore`.

**Type:** `boolean | string | string[]`

| Value | Behavior |
|-------|----------|
| `false` | Disable auto-update `.gitignore` |
| `true` | Uses `path + file + fileExt` pattern |
| `string \| string[]` | Uses custom path pattern |

**Default:** `true` → adds `path + file + fileExt` to `.gitignore`

**Variable Replacement:** Any `{{variable}}` in the path will be replaced with `*` in `.gitignore`.

**Wildcard Support:** You can use `'*'` directly in the path array for explicit wildcard matching.

**Examples:**

```typescript
// Disable gitignore management
const km1 = create({ gitIgnore: false });

// Use full path pattern (path + file + fileExt)
const km2 = create({ gitIgnore: true });
// .gitignore: keys/{{type}}/v_{{version}}.json → keys/*/v_*.json

// Custom folder with wildcard (default)
const km3 = create({ gitIgnore: ['keys', '*'] });
// .gitignore: keys/*

// Custom path with variables
const km4 = create({ gitIgnore: ['secrets', '{{env}}', 'keys'] });
// .gitignore: secrets/*/keys

// Custom path with explicit wildcard
const km5 = create({ gitIgnore: ['keys', '{{type}}', '*'] });
// .gitignore: keys/*/*

// Simple string
const km6 = create({ gitIgnore: 'keys' });
// .gitignore: keys
```

---

## 📚 Core Concepts

### Creating Keys

#### 1. Non-Expiring Key

```typescript
const { key, path } = await keyManager.newKey({
  type: 'service',
});
```

#### 2. Expiring Key with Rotation

```typescript
const { key, path } = await keyManager.newKey({
  type: 'api',
  duration: 30,
  unit: 'days',      // 'seconds' | 'minutes' | 'hours' | 'days'
  rotate: true,      // Enable automatic rotation
});
```

#### 3. Merge Strategy (Single File)

Store multiple key versions in a single file:

```typescript
const { key, path } = await keyManager.newKey({
  type: 'service',
  merge: true,       // Store all versions in one file
  duration: 7,
  unit: 'days',
  rotate: true,
});
```

### Retrieving Keys

#### Basic Retrieval

```typescript
const result = await keyManager.getKey({
  path: '/path/to/key/file',
  version: 'v1',
});

// Result structure
{
  ready: TKeyGenerated | null,    // Valid, usable key
  expired: TKeyGenerated | null   // Expired key (if rotation occurred)
}
```

#### Key Rotation

When a key is expired and rotatable, provide rotation options:

```typescript
const result = await keyManager.getKey({
  path: '/path/to/key/file',
  version: 'v1',
  onRotate: {
    duration: 30,
    unit: 'days',
    rotate: true,
    merge: true,      // Optional: merge strategy for new key
  },
});

if (result.expired) {
  console.log('Key was rotated');
  console.log('Old version:', result.expired.version);
  console.log('New version:', result.ready?.version);
}
```

#### Handling Missing Keys

```typescript
const result = await keyManager.getKey({
  path: '/path/to/key/file',
  version: 'v1',
});

if (!result.ready) {
  // Key not found or invalid
  console.log('Key unavailable');
}
```

### Key Rotation

Key rotation occurs automatically when:

1. A key is expired (`to` date has passed)
2. The key has `rotate: true`
3. `onRotate` options are provided in `getKey()`

**Rotation Flow:**

```
Expired Key → Check rotate flag → Generate new key → Return both keys
```

---

## 🔧 Advanced Usage

### Custom Storage Logic

#### Custom Get Logic

Override how keys are retrieved:

```typescript
keyManager.useGetKey(async (path, version) => {
  // Your custom retrieval logic
  const data = await fetchFromDatabase(path, version);
  
  if (!data) return null;
  
  return {
    from: data.createdAt,
    to: data.expiresAt,
    key: data.rawKey,
    hashed: data.hashedKey,
    hashedBytes: 32,
    type: data.type,
    version: data.version,
    rotate: data.rotate,
  };
});
```

#### Custom Save Logic

Override how keys are saved:

```typescript
keyManager.useSaveKey(async (keyData, options) => {
  // Your custom save logic
  const savedPath = await saveToDatabase(keyData);
  return savedPath; // This becomes key.path
});
```

### Custom Path & File Naming

Use variables in path and file names:

```typescript
const keyManager = create({
  path: ['keys', '{{type}}', '{{env}}'],
  file: ['{{version}}', '{{region}}'],
  fileExt: 'json',
});

const { key, path } = await keyManager.newKey(
  {
    type: 'api',
  },
  {
    env: 'production',
    region: 'us-east-1',
  }
);

// Result: keys/api/production/1704067200000_us-east-1.json
```

**Available Variables:**
- `{{type}}` - Key type
- `{{version}}` - Key version
- Any custom variables passed to `newKey()`

### Hooks & Lifecycle Events

> **Available since v1.0.10**

Hooks allow you to execute custom logic when specific key lifecycle events occur.

#### Available Hooks

**Key Manager Hooks:**

| Hook | Description | Parameters |
|------|-------------|------------|
| `onKeyNotFound` | Fires when key file is not found or version doesn't exist | `(path: string, version: string \| number)` |
| `onKeyInvalid` | Fires when key validation fails | `(key: TKeyGenerated, message: string, errorOn?: keyof TKeyGenerated)` |
| `onKeyMissingRotateOption` | Fires when expired key needs rotation but options are missing | `(key: TKeyGenerated, options: TGetKeyOptions)` |
| `onKeyRenewed` | Fires when a key is successfully rotated | `(getKey: TGetKey, options: TGetKeyOptions)` |
| `onKeyExpired` | Fires when a key expires but is not renewable | `(path: string, key: TKeyGenerated)` |

**Base Hooks:**

| Hook | Description | Parameters |
|------|-------------|------------|
| `onHookNotFound` | Fires when a hook is called but not registered | `(name: string)` |
| `onHookOverriding` | Fires when a hook is being overridden | `(name: string)` |

#### Setting Hooks

**Set Multiple Hooks:**

```typescript
keyManager.useHooks({
  onKeyNotFound: (path, version) => {
    console.log(`Key not found: ${path}@${version}`);
  },
  onKeyInvalid: (key, message, errorOn) => {
    console.error(`Invalid key: ${message}`, { errorOn, key });
  },
  onKeyRenewed: (getKey, options) => {
    console.log('Key renewed:', {
      expired: getKey.expired?.version,
      ready: getKey.ready?.version,
    });
  },
});
```

**Set Single Hook:**

```typescript
keyManager.setHook('onKeyRenewed', (getKey, options) => {
  console.log('Key was renewed successfully');
});
```

**Async Hooks:**

```typescript
keyManager.setHook('onKeyRenewed', async (getKey, options) => {
  await sendNotification({
    message: 'Key was rotated',
    expiredVersion: getKey.expired?.version,
    newVersion: getKey.ready?.version,
  });
});

keyManager.setHook('onKeyInvalid', async (key, message, errorOn) => {
  await logToDatabase({
    event: 'key_invalid',
    message,
    errorOn,
    keyVersion: key.version,
  });
});
```

#### Complete Hook Example

```typescript
import { create } from 'key-rotation-manager';

const keyManager = create({
  versionGenerator: () => 'v1',
});

// Configure all hooks
keyManager.useHooks({
  onKeyNotFound: (path, version) => {
    console.log(`[Hook] Key not found: ${path}@${version}`);
  },
  onKeyInvalid: (key, message, errorOn) => {
    console.error(`[Hook] Invalid key: ${message}`, {
      version: key.version,
      errorOn,
    });
  },
  onKeyRenewed: async (getKey, options) => {
    console.log('[Hook] Key renewed:', {
      from: getKey.expired?.version,
      to: getKey.ready?.version,
    });
    // Perform async operations (notifications, logging, etc.)
  },
  onKeyMissingRotateOption: (key, options) => {
    console.warn(`[Hook] Missing rotate option for key: ${key.version}`);
  },
  onKeyExpired: (path, key) => {
    console.log(`[Hook] Key expired: ${path}@${key.version}`);
  },
});

// Use the key manager
const result = await keyManager.getKey({
  path: '/keys/api',
  version: 'v1',
});
```

### Logging

#### Custom Logger

```typescript
// Synchronous logger
keyManager.setLogger((...args) => {
  console.log('[KeyManager]', ...args);
});

// Async logger
keyManager.setLogger(async (...args) => {
  await logToService(...args);
});
```

#### System Logging

```typescript
await keyManager.sysLog('Key operation completed');
```

#### Custom Logging

```typescript
await keyManager.customLog(async (...args) => {
  await customLoggingService.log(...args);
}, 'Log message');
```

### Instance Cloning

Create a new instance with shared configuration:

```typescript
const original = create({ versionGenerator: () => 'v1' });

// Clone with additional options
const cloned = original.clone({
  path: ['custom', 'keys'],
});

// Cloned instance includes:
// - Custom save/get hooks
// - Store path configuration
// - Logger settings
// - Hooks settings
```

---

## 📖 API Reference

### `create(options?, singleton?)`

Creates a new KeyManager instance.

**Parameters:**
- `options` (optional): Partial `TModuleOptions`
- `singleton` (optional): `boolean` - If `true`, returns a shared singleton instance (default: `false`)

**Returns:** `KM` instance

**Example:**
```typescript
const km = create({ versionGenerator: () => 'v1' });
// or
const km = create({}, true); // Singleton instance
```

### `newKey(options, variables?)`

Generates a new cryptographic key.

**Parameters:**
- `options`: `TGenerateKeyOptions`
  - `type`: `string` - Key type identifier
  - `duration?`: `number` - Expiration duration
  - `unit?`: `'seconds' | 'minutes' | 'hours' | 'days'` - Time unit
  - `rotate?`: `boolean` - Enable rotation
  - `merge?`: `boolean` - Merge strategy
  - `keyLength?`: `number` - Key length in bytes
- `variables?`: `TKeyVariables` - Custom variables for path/file naming

**Returns:** `Promise<{ key: TKeyGenerated, path: string }>`

### `getKey(options)`

Retrieves a key by path and version.

**Parameters:**
- `options`: `TGetKeyOptions`
  - `path`: `string` - Storage path
  - `version`: `string` - Key version
  - `disableHooks?`: `boolean` - Skip hook execution (default: `false`)
  - `onRotate?`: Rotation options (if key is expired and rotatable)

**Returns:** `Promise<TGetKey>`

**Example:**
```typescript
const result = await keyManager.getKey({
  path: '/keys/api',
  version: 'v1',
  onRotate: {
    duration: 30,
    unit: 'days',
    rotate: true,
  },
});

// With disabled hooks for performance
const result = await keyManager.getKey({
  path: '/keys/api',
  version: 'v1',
  disableHooks: true,
});
```

### `verifyKey(hashedKey, path, version, disableGetKeyHooks?)`

Verifies a hashed key against a stored key.

**Parameters:**
- `hashedKey`: `string` - The hashed key to verify
- `path`: `string` - Storage path
- `version`: `string | number` - Key version
- `disableGetKeyHooks?`: `boolean` - Disable hooks in getKey call (default: `true`)

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const isValid = await keyManager.verifyKey(hashedKey, '/keys/api', 'v1');
if (isValid) {
  console.log('Key is valid!');
} else {
  console.log('Key is invalid!');
}

// Verification with hooks enabled
const isValid = await keyManager.verifyKey(hashedKey, '/keys/api', 'v1', false);
```

**Notes:**
- Uses PBKDF2 verification if the key has a `secret` field
- Falls back to direct hash comparison otherwise
- Verifies against expired keys if no ready key is available

### `useHooks(hooks)`

Sets multiple hooks at once.

**Parameters:**
- `hooks`: `Partial<TModuleHooks>`

**Returns:** `this` (chainable)

### `setHook(name, handler)`

Sets a single hook.

**Parameters:**
- `name`: `keyof TModuleHooks`
- `handler`: `TModuleHooks[K]`

**Returns:** `this` (chainable)

---

## 🎯 Use Cases

- **API Key Management** - Secure storage and rotation of API keys for third-party services
- **Token Rotation** - Automatic credential rotation for OAuth tokens, JWT secrets, and access tokens
- **Secret Management** - File-based secret storage with expiration for application secrets
- **Multi-Version Keys** - Support for multiple key versions simultaneously during rotation periods
- **Custom Persistence** - Integrate with databases, cloud storage, or key management services
- **Backend Services** - Production-ready key management for Node.js applications and microservices
- **Encryption Keys** - Manage encryption keys for data protection with automatic rotation
- **Session Keys** - Rotate session encryption keys periodically for enhanced security
- **Database Credentials** - Rotate database passwords and connection strings securely
- **Service-to-Service Authentication** - Manage keys for inter-service communication

---

## 📝 Changelog

See the full changelog for each version:

- **[v1.1.2](https://github.com/DucAnh2611/key-rotation-manager/tree/master/changelogs/1.1.2.md)** - Key verification, hook control, enhanced documentation
- **[v1.1.1](https://github.com/DucAnh2611/key-rotation-manager/tree/master/changelogs/1.1.1.md)** - Native crypto, zero dependencies, bug fixes
- **[v1.0.10](https://github.com/DucAnh2611/key-rotation-manager/tree/master/changelogs/1.0.10.md)** - Hooks system, enhanced gitIgnore configuration

---

## 🐛 Issues & Bug Reports

Found a bug or have a feature request?

**[🐛 Report an Issue](https://github.com/DucAnh2611/key-rotation-manager/issues/new)**

Please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, package version)
- Code samples if applicable

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/DucAnh2611/key-rotation-manager/blob/master/LICENSE) file for details.

---

## 🔍 Search Keywords

This package is optimized for searches related to:
- key rotation
- key management
- cryptographic key storage
- API key rotation
- secret rotation
- credential management
- token rotation
- key versioning
- automatic key rotation
- secure key storage
- Node.js key management
- TypeScript key management
- production key rotation
- enterprise key management

---

**Made with ❤️ for secure key management**

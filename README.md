# Rotate Key

Flexible, file-based key management for Node.js.  
It helps you **generate, store, rotate, and retrieve cryptographic keys** with support for expiration, versioning, merge strategies, custom storage logic, and lifecycle events.

This library is designed for backend systems that need safe, extensible, and transparent key handling.

---

## Features

- 🔐 Secure key generation (AES-256-GCM by default)
- 🔄 Key expiration & rotation
- 🗂 File-based storage with configurable structure
- 🧩 Merge & non-merge key strategies
- 🔧 Custom save & get hooks
- 📡 Event-driven lifecycle
- 📁 Automatic `.gitignore` integration

---

## Installation

```bash
npm install rotate-key
```

---

## Quick Start

```typescript
import { create } from 'rotate-key';

const keyManager = create({});

const { key, path } = await keyManager.newKey({
  type: 'api',
});

console.log(key, path);
```

This will:
- Create a `keys/` directory
- Generate a new key
- Save it using default storage rules

---

## Basic Usage

### Initialize KeyManager

```typescript
import { create } from 'rotate-key';

const keyManager = create({});
```

On initialization:
- The key storage folder is created
- `.gitignore` is updated (if enabled)
- A store initialization event is emitted

### Default Configuration

```typescript
{
  path: ['keys'],
  file: ['{{type}}', 'v', '{{version}}'],
  fileSplitor: '_',
  fileExt: 'json',
  gitIgnore: true,

  crypto: {
    algorithm: 'aes-256-gcm',
    kdf: 'scrypt',
    hashAlgorithm: 'sha256',
    keyLength: 32,
    ivLength: 16,
    saltLength: 32,
    tagLength: 16,
    iterations: 100000,
    encoding: 'base64',
  },

  versionGenerator: () => Date.now().toString()
}
```

### File Structure

With default settings, keys are stored as:

```
keys/
└── api_v_1700000000000.json
```

---

## Creating Keys

### 1. Non-expiring Key

```typescript
const { key } = await keyManager.newKey({
  type: 'service',
});
```

### 2. Expiring / Rotating Key

```typescript
const { key } = await keyManager.newKey({
  type: 'service',
  duration: 30,
  unit: 'seconds',
  rotate: true,
});
```

The key expires after 30 seconds and requires rotation.

### 3. Merge Strategy

Merge mode stores multiple key versions in a single file.

```typescript
const { key } = await keyManager.newKey({
  type: 'service',
  duration: 30,
  unit: 'seconds',
  rotate: true,
  merge: true,
});
```

---

## Custom Path & File Naming

```typescript
import { create } from 'rotate-key';

const keyManager = create({
  path: ['keys', 'custom'],
  file: '{{type}}',
  fileExt: 'txt',
});
```

Resulting structure:

```
keys/custom/service.txt
```

---

## Custom Save Logic

Override how and where keys are saved:

```typescript
keyManager.useSaveKey(async () => {
  return '/absolute/custom/path/key.json';
});
```

The returned value becomes `key.path`.

---

## Retrieving Keys

### Rotate Key (Valid)

```typescript
const result = await keyManager.getKey({
  path: 'keys/service_merge.json',
  version: 'rotate',
  onRotate: {
    duration: 30,
    unit: 'seconds',
    rotate: true,
    merge: true,
  },
});
```

Returned structure:

```typescript
{
  ready: Key | null,
  expired?: Key
}
```

- `ready` → usable key
- `expired` → expired key (if rotation occurred)

### Rotate Key (Invalid – Missing Options)

```typescript
await keyManager.getKey({
  path: 'keys/service_merge.json',
  version: 'rotate-invalid',
});
```

Throws:

```
Expired rotate options not provided
```

### Non-Rotating Key

```typescript
const result = await keyManager.getKey({
  path: 'keys/service_merge.json',
  version: 'non-rotate',
});
```

---

## Custom Get Logic

Override how keys are retrieved:

```typescript
keyManager.useGetKey(async () => {
  return {
    from: '2025-12-29T01:23:27.882Z',
    to: '2099-12-29T01:23:57.882Z',
    key: '...',
    hashed: '...',
    type: 'service',
    version: 'rotate',
    rotate: true,
  };
});
```

Return `null` to indicate an invalid or missing key.

---

## Events

KeyManager emits lifecycle events.

### Store Initialization Event

```typescript
import { create, types } from 'rotate-key';
const { EEvent } = types;
const keyManager = create({});

keyManager.once(EEvent.STORE_INIT_FOLDER, ({ storePath }) => {
  console.log('Key store initialized at:', storePath);
});
```

---

## Use Cases

- API key management
- Token & credential rotation
- Secure file-based secrets
- Multi-version key handling
- Custom persistence strategies
- Backend Node.js services

---

## License

MIT

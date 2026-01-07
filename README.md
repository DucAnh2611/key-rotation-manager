# Rotate Key

Flexible, file-based key management for Node.js.  
It helps you **generate, store, rotate, and retrieve cryptographic keys** with support for expiration, versioning, merge strategies, custom storage logic, and lifecycle events.

This library is designed for backend systems that need safe, extensible, and transparent key handling.

---

## Issues & Bug Reports

Found a bug or have a feature request?

**[🐛 Report an Issue](https://github.com/DucAnh2611/key-rotation-manager/issues/new)**

Please include:
- A clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Your environment (Node.js version, OS, package version)
- Code samples if applicable

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
npm install key-rotation-manager
```

---

## Quick Start

```typescript
import { create, km } from 'key-rotation-manager';

const keyManager = create({});
// or 
const keyManager = km({});

const { key, path } = await keyManager.newKey({
  type: 'api',
  ...options
});
```

This will:
- Create a `keys/` directory base on `{{path}}/{{filename}}.{{fileExt}}`
- Generate a new key
- Save it using default storage rules

---

## Basic Usage

### Initialize KeyManager

```typescript
import { create, km } from 'key-rotation-manager';

const keyManager = create();
// or 
const keyManager = km();
```

On initialization:
- The key storage folder is created
- `.gitignore` is updated (if enabled)
- A store initialization event is emitted

### Default Configuration

```typescript
{
  path: ['keys', '{{type}}'], // FROM 1.0.8 allow using variable: {{...}}
  file: ['v', '{{version}}'],
  fileSplitor: '_',
  fileExt: 'json',
  gitIgnore: true, // add resolved path to .gitignore

  crypto: {
    algorithm: 'aes-256-gcm',
    kdf: 'pbkdf2',
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
└── {{type}}/
    └── v_{{version}}.json
```

---

## Creating Keys

### 1. Non-expiring Key

```typescript
const { key } = await km.newKey({
  type: 'service',
});
```

### 2. Expiring / Rotating Key

```typescript
const { key } = await km.newKey({
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
  merge: true, // Merge into 1 file {{path}}/{filename}
  ...options,
});
```

---

## Custom Path & File Naming

```typescript
import { create } from 'key-rotation-manager';

const keyManager = create({
  path: ['keys', '{{type}}'],
  file: ['{{version}}', '{{custom_variables}}'],
  fileExt: 'txt',
  ...options,
});
```

Resulting structure:

```
path: ['keys', '{{type}}']
file: ['{{version}}', '{{custom_variables}}']
fileExt: "txt"
type: "service"
variables: { custom_variables: "example" }

getKey({ type }, variables) -> keys/service/17000000000_example.txt

>> .gitignore
keys/*/*_*.txt
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
  path: 'path (full path return from km.newKey)',
  version: 'rotate',
  onRotate: {
    duration: 30,
    unit: 'seconds',
    rotate: true,
    merge: true,
  },
}, eventHandlers);
```

```typescript
// from 1.0.8 getKey allow user use events

type TGetKeyEvents = {
  /**
   * This will fire when key is rotatable but expired and missing options to rotate
   */
  onMissingRotateOption: (key: TKeyGenerated, options: TGetKeyOptions) => void | Promise<void>;
  /**
   * This will fire when key is invalid includes validate types, from date, to date, etc...
   */
  onKeyInvalid: (
    key: TKeyGenerated,
    message: string,
    errorOn?: keyof TKeyGenerated
  ) => void | Promise<void>;
  /**
   * This will fire when key is renewed
   */
  onKeyRenewed: (getKey: TGetKey, options: TGetKeyOptions['onRotate']) => void | Promise<void>;
  /**
   * This will fire when key file is not found or version is not found in file
   * @description
   * IMPORTANT: every file invalid should return `{}` as key data and this will caused this event to be fired
   * - Invalid file (file not found or not valid json)
   * - Version not found in file
   * - From date in future
   * - Properties in key data is not valid types
   * - hashedBytes is less than 0
   */
  onKeyNotFound: (path: string, version: string | number) => void | Promise<void>;
  onExpired: (path: string, key: TKeyGenerated) => void | Promise<void>;
};
```

Returned structure:

```typescript
{
  ready: Key | null,
  expired: Key | null
}
```

- `ready` → usable key
- `expired` → expired key

### Rotate Key (Invalid – Missing Options)

```typescript
await keyManager.getKey({
  path: 'path (full path return from km.newKey)',
  version: 'rotate-invalid',
});
```

Return:

```
{ expired: null, ready: null }
```

### Non-Rotating Key

```typescript
const result = await keyManager.getKey({
  path: 'path (full path return from km.newKey)',
  version: 'version',
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
    hashedBytes: 16,
    type: 'service',
    version: 'version',
    rotate: true,
  };
});
```

Return `null` to indicate an invalid or missing key.

## Custom logger

Override how logger work

```typescript 
km.setLogger((...args: unknown[]) => console.log(...args))
// or Async
km.setLogger(async (...args: unknown[]) => console.log(...args))

km.sysLog(...args);
km.customLog(async (...args: unknown[]) => console.log(...args))
```

## Clone instance

Clone instance to new instance include custom saveKey, getKey and storePath

```typescript 
const k = km();
const k2 = k.clone(options);
```

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

MIT

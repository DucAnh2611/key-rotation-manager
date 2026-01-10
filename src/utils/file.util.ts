import { access, mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { dirname } from 'path';

export class FileUtilError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly operation: 'read' | 'write' | 'delete' | 'access' | 'mkdir',
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'FileUtilError';
  }
}

export class FileUtil {
  async getFolder(path: string): Promise<string> {
    try {
      await access(path);
      return path;
    } catch {
      try {
        await mkdir(path, { recursive: true });
        return path;
      } catch (error) {
        throw new FileUtilError(`Failed to create folder: ${path}`, path, 'mkdir', error);
      }
    }
  }

  async read(path: string, fallback?: string): Promise<string> {
    try {
      const data = await readFile(path, { encoding: 'utf8' });
      return data;
    } catch (error) {
      if (fallback !== undefined) return fallback;
      throw new FileUtilError(`Failed to read file: ${path}`, path, 'read', error);
    }
  }

  async write(path: string, data: string, flag: 'w' | 'a' = 'w'): Promise<void> {
    const dir = dirname(path);
    await this.getFolder(dir);

    try {
      await writeFile(path, data, { encoding: 'utf8', flag });
    } catch (error) {
      throw new FileUtilError(`Failed to write file: ${path}`, path, 'write', error);
    }
  }

  async checkExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await unlink(path);
    } catch (error) {
      throw new FileUtilError(`Failed to delete file: ${path}`, path, 'delete', error);
    }
  }
}

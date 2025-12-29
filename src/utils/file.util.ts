import { access, mkdir, readFile, unlink, writeFile } from 'fs/promises';

export class FileUtil {
  async getFolder(path: string): Promise<string> {
    try {
      try {
        await access(path);
      } catch {
        await mkdir(path, { recursive: true });
      }

      return path;
    } catch {
      throw new Error(`Failed to get folder: ${path}`);
    }
  }

  async read(path: string, fallback: string = ''): Promise<string> {
    try {
      const data = await readFile(path, { encoding: 'utf8' });
      return data;
    } catch {
      return fallback ?? '';
    }
  }

  async write(path: string, data: string, flag: 'w' | 'a' = 'w'): Promise<void> {
    try {
      await writeFile(path, data, { encoding: 'utf8', flag });
    } catch {
      throw new Error(`Failed to write file: ${path}`);
    }
  }

  async checkExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      throw new Error(`Failed to check existence of file: ${path}`);
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await unlink(path);
    } catch {
      throw new Error(`Failed to delete file: ${path}`);
    }
  }
}

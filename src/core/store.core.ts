import { EEvent, TEvents, TGetKeyFn, TSaveKeyFn, TStoreOptions } from 'src/types';
import { ConfigEvents } from './config-events.core';
import { FileUtil } from 'src/utils/file.util';
import { DEFAULT_STORE_OPTIONS } from 'src/constants/default.constant';
import { join } from 'path';
import { TKeyGenerated } from 'src/types/key-manager.types';

export class Store extends ConfigEvents {
  private sOptions: Required<Omit<TStoreOptions, 'useEvent' | 'crypto'>>;
  private fileUtil: FileUtil;
  private storePath?: string;
  protected saveKeyFn?: TSaveKeyFn;
  protected getKeyFn?: TGetKeyFn;

  constructor(options: Partial<TStoreOptions>) {
    super(options);

    this.sOptions = { ...DEFAULT_STORE_OPTIONS, ...options };
    this.fileUtil = new FileUtil();
    this.initStore();
  }

  protected getPath(path: string | string[], splitor: string): string {
    if (typeof path === 'object' && Array.isArray(path)) {
      return path.join(splitor);
    }

    return path;
  }

  protected async getKeyStoreFolder(): Promise<string> {
    if (this.storePath) return this.storePath;

    const { path } = this.sOptions;

    const folder = await this.fileUtil.getFolder(join(process.cwd(), this.getPath(path, '/')));

    return folder;
  }

  protected async getKeyFileData(filePath: string): Promise<Record<string, TKeyGenerated>> {
    const existingData = await this.fileUtil.read(filePath);
    const savedData = this.toSavedData(existingData);

    return savedData;
  }

  protected async saveKeyFile(
    path: string,
    data: TKeyGenerated,
    merge: boolean = false
  ): Promise<string> {
    let savedData = await this.getKeyFileData(path);

    let saveData: Record<string, TKeyGenerated> = {};

    if (merge) {
      saveData = { ...savedData };
    }

    saveData = { ...saveData, [data.version]: data };

    await this.fileUtil.write(path, JSON.stringify(saveData, null, 2));

    this.emit(EEvent.STORE_FILE_SAVED, { path, data: saveData });

    return path;
  }

  /**
   * @param storePath custom store path
   * root folder of store
   * @returns this
   */
  public useStorePath(storePath: string): this {
    this.storePath = storePath;
    return this;
  }

  /**
   * @param saveKeyFn custom save key function
   * @returns this
   */
  public useSaveKey(saveKeyFn: TSaveKeyFn): this {
    this.saveKeyFn = saveKeyFn;
    return this;
  }

  /**
   * @param saveKeyFn custom get key function
   * @returns this
   */
  public useGetKey(getKeyFn: TGetKeyFn): this {
    this.getKeyFn = getKeyFn;
    return this;
  }

  private async initStore(): Promise<void> {
    const storePath = await this.getKeyStoreFolder();

    let eventEmitPayload: TEvents[EEvent.STORE_INIT_FOLDER] = {
      storePath,
    };

    if (this.sOptions.gitIgnore) {
      const gitignore = await this.addStoreFolderToGitignore();
      eventEmitPayload = { ...eventEmitPayload, ...gitignore };
    }

    this.emit(EEvent.STORE_INIT_FOLDER, eventEmitPayload);
  }

  private toSavedData(dataString: string): Record<string, TKeyGenerated> {
    try {
      if (!dataString) return {};
      const parsedData = JSON.parse(dataString) as Record<string, TKeyGenerated>;

      if (typeof parsedData !== 'object' || Array.isArray(parsedData)) {
        throw new Error(`Invalid JSON data (must be Record<version, TKeyGenerated>) ${dataString}`);
      }

      return parsedData;
    } catch (error) {
      throw new Error('Invalid JSON data (must be Record<version, TKeyGenerated>)');
    }
  }

  private async addStoreFolderToGitignore(): Promise<
    Omit<TEvents[EEvent.STORE_INIT_FOLDER], 'storePath'>
  > {
    const gitignorePath = join(process.cwd(), '.gitignore');
    const gitignoreContent = await this.fileUtil.read(gitignorePath);

    const storePath = this.getPath(this.sOptions.path, '/');

    if (!gitignoreContent.includes(`${storePath}/*\r`)) {
      await this.fileUtil.write(
        gitignorePath,
        `${gitignoreContent ? '\r' : ''}${storePath}/*\r`,
        'a'
      );

      return {
        gitIgnoreStorePath: storePath,
        gitIgnorePath: gitignorePath,
        gitIgnoreAddStatus: 'added',
      };
    } else {
      return {
        gitIgnoreStorePath: storePath,
        gitIgnorePath: gitignorePath,
        gitIgnoreAddStatus: 'already',
      };
    }
  }
}

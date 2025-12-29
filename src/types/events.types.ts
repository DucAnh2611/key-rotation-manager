import { TKeyGenerated } from './key-manager.types';

export enum EEvent {
  STORE_INIT_FOLDER = 'store-init-folder',
  STORE_FILE_SAVED = 'saved-key-file',
}

export type TEvents = {
  [EEvent.STORE_INIT_FOLDER]: {
    gitIgnoreStorePath?: string;
    gitIgnorePath?: string;
    gitIgnoreAddStatus?: 'already' | 'added';
    storePath: string;
  };
  [EEvent.STORE_FILE_SAVED]: { path: string; data: Record<string, TKeyGenerated> };
};

export type TEventsOptions = {
  /**
   * Is use event emitter
   * @default true
   */
  useEvent?: boolean;
};

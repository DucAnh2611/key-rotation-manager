export type TBaseOptions = {
  quiet: boolean;
};
export type TBaseLogger<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

export type THook<T extends (...args: any[]) => any = (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

export type TBaseHooks = {
  onHookNotFound: (name: string) => void;
  onHookOverriding: (name: string) => void;
};

export type TBaseOptions = {
  quiet: boolean;
};
export type TBaseLogger<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

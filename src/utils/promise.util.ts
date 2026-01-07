export const executePromisably = <T>(
  promiseOrFn: T | Promise<T> | ((...args: unknown[]) => T | Promise<T>)
): Promise<T> => {
  try {
    const value =
      typeof promiseOrFn === 'function' && !(promiseOrFn instanceof Promise)
        ? (promiseOrFn as (...args: unknown[]) => T | Promise<T>)()
        : promiseOrFn;
    return Promise.resolve(value);
  } catch (error) {
    return Promise.reject(error);
  }
};

export const promiseAll = <T extends readonly unknown[]>(
  ...fns: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> => {
  return Promise.all(fns);
};

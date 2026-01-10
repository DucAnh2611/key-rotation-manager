import { TKeyDurationUnit } from 'src/types/key-manager.types';

const getNested = (obj: Record<string, any>, path: string): any =>
  path.split('.').reduce((curr, key) => curr?.[key], obj);

const flatten = (obj: Record<string, any>, prefix = ''): Record<string, any> =>
  Object.entries(obj).reduce((acc, [key, val]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    return val && typeof val === 'object' && !Array.isArray(val)
      ? { ...acc, ...flatten(val, newKey) }
      : { ...acc, [newKey]: val };
  }, {});

const stringify = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

export const bindString = (format: string, bindValues: Record<string, any>): string => {
  return format
    .replace(/\{\{\.\.\.([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();
      const val = trimmedPath.includes('.')
        ? getNested(bindValues, trimmedPath)
        : bindValues[trimmedPath];

      return val && typeof val === 'object' && !Array.isArray(val)
        ? JSON.stringify(flatten(val, trimmedPath))
        : match;
    })
    .replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();

      // Skip if it's a spread syntax (already handled)
      if (trimmedPath.startsWith('...')) {
        return match;
      }

      const val = trimmedPath.includes('.')
        ? getNested(bindValues, trimmedPath)
        : bindValues[trimmedPath];
      return stringify(val);
    });
};
export const isDate = (data: string): boolean => {
  try {
    const date = new Date(data);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

export const addDuration = (date: Date, duration: number, unit: TKeyDurationUnit): Date => {
  const result = new Date(date.getTime());

  switch (unit) {
    case 'seconds':
      result.setSeconds(result.getSeconds() + duration);
      break;

    case 'minutes':
      result.setMinutes(result.getMinutes() + duration);
      break;

    case 'hours':
      result.setHours(result.getHours() + duration);
      break;

    case 'days':
      result.setDate(result.getDate() + duration);
      break;

    default: {
      const _exhaustiveCheck: never = unit;
      throw new Error(`Unsupported duration unit: ${_exhaustiveCheck}`);
    }
  }

  return result;
};

export const isType = (data?: unknown) => {
  return {
    number: typeof data === 'number' && !Number.isNaN(Number(data)),
    string: typeof data === 'string',
    stringNumber: typeof data === 'string' || typeof data === 'number',
    boolean: typeof data === 'boolean',
    null: data === null,
    undefined: data === undefined,
  };
};

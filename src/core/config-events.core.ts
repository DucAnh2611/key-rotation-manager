import { TEventsOptions } from 'src/types';
import { Events } from './events.core';

export class ConfigEvents extends Events {
  constructor(options: Partial<TEventsOptions>) {
    super(options);
  }
}

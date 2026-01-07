import EventEmitter from 'node:events';
import { Base } from './base.core';
import { TEvents, TEventsOptions } from 'src/types';
import { DEFAULT_EVENTS_OPTIONS } from 'src/constants/default.constant';

export class Events extends Base {
  private events?: EventEmitter;
  private eOptions: Required<TEventsOptions>;

  constructor(options: TEventsOptions) {
    super(options);

    this.eOptions = {
      ...DEFAULT_EVENTS_OPTIONS,
      ...options,
    };

    if (this.eOptions.useEvent) {
      this.events = new EventEmitter();
    }
  }

  protected emit<K extends keyof TEvents>(event: K, args: TEvents[K]) {
    if (!this.events) return this;

    this.events.emit(event, args);
    return this;
  }

  on<K extends keyof TEvents>(event: K, listener: (args: TEvents[K]) => void) {
    if (!this.events) return this;

    this.events.on(event, listener);
    return this;
  }

  once<K extends keyof TEvents>(event: K, listener: (args: TEvents[K]) => void) {
    if (!this.events) return this;

    this.events.once(event, listener);
    return this;
  }

  off<K extends keyof TEvents>(event: K, listener: (args: TEvents[K]) => void) {
    if (!this.events) return this;

    this.events.off(event, listener);
    return this;
  }
}

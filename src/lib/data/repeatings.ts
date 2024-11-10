import type { Repeating } from './interfaces';
import { BaseService } from './service';

export class RepeatingsService extends BaseService<Repeating> {
  constructor() {
    super('RepeatingService', 'repeatings', 'repeating');
  }

  get repeatings() {
    return this.items;
  }

  get $repeatings() {
    return this.$items;
  }
}

export const repeatingsService = new RepeatingsService();

export const repeatingsStore = repeatingsService.$repeatings;

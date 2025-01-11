import dayjs from 'dayjs';

import { unexpectedCase } from '$lib/utils';

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

export function getNextRepeatingDate(repeating: Repeating, date: dayjs.Dayjs | Date | string) {
  const lastDate = dayjs(date);

  switch (repeating.interval) {
    case 'day':
      return lastDate.add(repeating.count, 'day');
    case 'week':
      return lastDate.add(repeating.count, 'week');
    case 'month': {
      const nextDate = lastDate.add(repeating.count, 'month');
      if (repeating.dayOfMonth) {
        const changedDate = nextDate.set('date', repeating.dayOfMonth);
        if (changedDate.isBefore(nextDate.endOf('month'))) {
          return changedDate;
        }
      }
      return nextDate;
    }
    case 'year':
      return lastDate.add(repeating.count, 'year');
    default:
      throw unexpectedCase(repeating.interval);
  }
}

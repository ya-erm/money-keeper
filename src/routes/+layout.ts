import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { browser } from '$app/environment';

import { journalService, mainService, membersService } from '$lib/data';
import { handleError } from '$lib/utils';

dayjs.extend(utc);
dayjs.extend(timezone);

export const load = async () => {
  if (!browser) {
    return;
  }

  await mainService.init().catch(handleError);

  // sync for authorized users only
  if (!membersService.isGuest) {
    void journalService.syncWithServer().catch(handleError);
  }
};

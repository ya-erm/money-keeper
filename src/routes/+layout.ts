import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

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

  if (membersService.selectedMember) {
    // TODO: don't sync for non-authorized users only
    void journalService.syncWithServer().catch(handleError);
  }
};

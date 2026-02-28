/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const debug = false;

export const db = new PrismaClient({
  log: debug
    ? [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: 'error',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
        {
          emit: 'stdout',
          level: 'warn',
        },
      ]
    : [],
});

if (debug) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db.$on('query', (e: any) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
    console.log('------------------------------');
  });
}

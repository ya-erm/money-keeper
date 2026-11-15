import { derived } from 'svelte/store';
import { debtEntries } from '../debts/calculations';
import type { DebtRecord } from './interfaces';
import { operationsStore } from './operations';
import { BaseService } from './service';

class DebtRecordsService extends BaseService<DebtRecord> {
  constructor() {
    super('DebtRecordsService', 'debtRecords', 'debtRecord');
  }
  get $records() {
    return this.$items;
  }
}

export const debtRecordsService = new DebtRecordsService();
export const debtRecordsStore = debtRecordsService.$records;
export const debtEntriesStore = derived([operationsStore, debtRecordsStore], ([operations, records]) =>
  debtEntries(operations, records),
);

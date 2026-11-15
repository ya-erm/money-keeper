import type { DebtContact } from '../data/interfaces';
import type { DebtMessage } from '../translate/debtMessages';

/** Totals use the generic label; contact rows agree with the selected grammatical form. */
export function debtDirectionMessage(
  contact: Pick<DebtContact, 'grammaticalForm'> | null | undefined,
  amount: number,
): DebtMessage {
  if (amount < 0) return 'debts.payable';
  switch (contact?.grammaticalForm) {
    case 'masculine':
      return 'debts.owes_masculine';
    case 'feminine':
      return 'debts.owes_feminine';
    case 'neuter':
      return 'debts.owes_neuter';
    case 'plural':
      return 'debts.owes_plural';
    default:
      return 'debts.receivable';
  }
}

export function repaymentDirectionMessage(
  contact: Pick<DebtContact, 'grammaticalForm'> | null | undefined,
): DebtMessage {
  switch (contact?.grammaticalForm) {
    case 'masculine':
      return 'debts.he_returned';
    case 'feminine':
      return 'debts.she_returned';
    case 'neuter':
      return 'debts.it_returned';
    default:
      return 'debts.they_returned';
  }
}

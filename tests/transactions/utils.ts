import { expect, Page } from '@playwright/test';

export const getTransactionFormLocators = (page: Page) => {
  const form = page.getByTestId('TransactionForm');
  return {
    form,
    typeSwitch: form.getByTestId('TypeSwitch'),
    typeSwitchInButton: form.getByTestId('TypeSwitch.Button.IN'),
    typeSwitchOutButton: form.getByTestId('TypeSwitch.Button.OUT'),
    typeSwitchTransferButton: form.getByTestId('TypeSwitch.Button.TRANSFER'),
    sourceAccountSelect: form.getByTestId('SourceAccountSelect'),
    destinationAccountSelect: form.getByTestId('DestinationAccountSelect'),
    categorySelect: form.getByTestId('CategorySelect'),
    dateInput: form.locator('input[name="date"]'),
    timeInput: form.locator('input[name="time"]'),
    amountInput: form.locator('input[name="amount"]'),
    destinationAmountInput: form.locator('input[name="destinationAmount"]'),
    commentInput: form.locator('input[name="comment"]'),
    tags: form.getByTestId('TagsContainer'),
    createButton: form.getByTestId('CreateTransactionButton'),
    saveButton: form.getByTestId('SaveTransactionButton'),
    deleteButton: form.getByTestId('DeleteTransactionButton'),
  };
};

export async function checkCommonInputs(page: Page) {
  const { dateInput, timeInput, amountInput, commentInput } = getTransactionFormLocators(page);

  expect(await dateInput.isVisible()).toBe(true);
  expect(await dateInput.getAttribute('required')).toBe('');

  expect(await timeInput.isVisible()).toBe(true);
  expect(await timeInput.getAttribute('required')).toBe('');

  expect(await amountInput.isVisible()).toBe(true);
  expect(await amountInput.getAttribute('required')).toBe('');

  expect(await commentInput.isVisible()).toBe(true);
}

import { describe, expect, it } from 'vitest';
import {
  createLoanRecord,
  deserializeLoanRecord,
  isDateOnly,
  serializeLoanRecord,
  transitionLoanStatus,
  validateLoanInput,
  type LoanInput,
} from './tool-loan';

const today = '2026-10-28';
const now = '2026-10-28T09:00:00.000Z';
const validInput: LoanInput = {
  toolName: 'Cordless drill',
  category: 'power-tools',
  quantity: 1,
  plannedReturnDate: today,
};

describe('tool loan draft validation', () => {
  it('accepts inclusive quantity, title and date boundaries', () => {
    const boundaryInput = {
      ...validInput,
      toolName: 'D'.repeat(80),
      quantity: 99,
      plannedReturnDate: today,
    };
    expect(validateLoanInput(boundaryInput, today)).toEqual([]);
    expect(isDateOnly('2024-02-29')).toBe(true);
  });

  it('rejects blank or overlong names, invalid quantity, category and calendar dates', () => {
    const invalid = validateLoanInput({
      ...validInput,
      toolName: ' '.repeat(2),
      quantity: 1.5,
      category: 'not-a-category' as LoanInput['category'],
      plannedReturnDate: '2026-02-29',
    }, today);
    expect(invalid.map((error) => error.field)).toEqual(['toolName', 'category', 'quantity', 'plannedReturnDate']);
    expect(isDateOnly('2026-02-29')).toBe(false);
    expect(validateLoanInput({ ...validInput, toolName: 'T'.repeat(81) }, today)[0]?.message).toContain('80');
    expect(validateLoanInput({ ...validInput, quantity: 0 }, today)[0]?.field).toBe('quantity');
    expect(validateLoanInput({ ...validInput, quantity: 100 }, today)[0]?.field).toBe('quantity');
  });

  it('allows today but rejects a planned return date before today', () => {
    expect(validateLoanInput({ ...validInput, plannedReturnDate: today }, today)).toEqual([]);
    expect(validateLoanInput({ ...validInput, plannedReturnDate: '2026-10-27' }, today)[0]?.field).toBe('plannedReturnDate');
    expect(validateLoanInput({ ...validInput, plannedReturnDate: '' }, today)).toEqual([]);
  });
});

describe('local planning lifecycle', () => {
  it('creates a local record without party, ownership, deposit or condition fields', () => {
    const created = createLoanRecord(validInput, { id: 'local-1', now, today });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.status).toBe('listed');
    expect(created.value.history).toEqual([{ status: 'listed', at: now }]);
    expect(created.value).not.toHaveProperty('borrower');
    expect(created.value).not.toHaveProperty('owner');
    expect(created.value).not.toHaveProperty('deposit');
    expect(created.value).not.toHaveProperty('condition');
  });

  it('allows a reservation plan and cancellation at the same instant, then prevents retirement reversal', () => {
    const created = createLoanRecord(validInput, { id: 'local-2', now, today });
    if (!created.ok) throw new Error('expected valid record');
    const reserved = transitionLoanStatus(created.value, 'reserved', now);
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    expect(transitionLoanStatus(reserved.value, 'listed', now).ok).toBe(true);
    const retired = transitionLoanStatus(reserved.value, 'retired', now);
    expect(retired.ok).toBe(true);
    if (!retired.ok) return;
    expect(transitionLoanStatus(retired.value, 'listed', now).ok).toBe(false);
  });

  it('rejects invalid timestamps and out-of-order status changes', () => {
    const created = createLoanRecord(validInput, { id: 'local-3', now, today });
    if (!created.ok) throw new Error('expected valid record');
    expect(transitionLoanStatus(created.value, 'reserved', 'not-a-timestamp').ok).toBe(false);
    expect(transitionLoanStatus(created.value, 'reserved', '2026-10-28T08:59:59.000Z').ok).toBe(false);
    expect(transitionLoanStatus(created.value, 'listed', now).ok).toBe(false);
  });

  it('round-trips JSON and rejects corrupt or malformed serialization', () => {
    const created = createLoanRecord(validInput, { id: 'local-4', now, today });
    if (!created.ok) throw new Error('expected valid record');
    const serialized = serializeLoanRecord(created.value);
    expect(deserializeLoanRecord(serialized)).toEqual(created.value);
    expect(() => deserializeLoanRecord('{')).toThrow();
    expect(() => deserializeLoanRecord('{"id":"not-a-loan"}')).toThrow('Invalid local loan record');
  });
});

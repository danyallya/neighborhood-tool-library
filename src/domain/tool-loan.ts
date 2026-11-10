export const toolCategories = [
  'gardening',
  'hand-tools',
  'power-tools',
  'cleaning',
  'other',
] as const;

export type ToolCategory = (typeof toolCategories)[number];
export type LoanStatus = 'listed' | 'reserved' | 'retired';

export type LoanInput = {
  toolName: string;
  category: ToolCategory;
  quantity: number;
  plannedReturnDate: string;
};

export type LoanEvent = {
  status: LoanStatus;
  at: string;
};

export type LoanRecord = {
  schemaVersion: 1;
  id: string;
  toolName: string;
  category: ToolCategory;
  quantity: number;
  plannedReturnDate: string | null;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
  history: LoanEvent[];
};

export type LoanError = {
  field: keyof LoanInput;
  message: string;
};

export type LoanResult =
  | { ok: true; value: LoanRecord }
  | { ok: false; errors: LoanError[] };

export type CreateLoanOptions = {
  id: string;
  now: string;
  today: string;
};

const allowedTransitions: Record<LoanStatus, readonly LoanStatus[]> = {
  listed: ['reserved', 'retired'],
  reserved: ['listed', 'retired'],
  retired: [],
};

export function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateLoanInput(
  input: LoanInput,
  today: string,
): LoanError[] {
  const errors: LoanError[] = [];
  const toolName = input.toolName.trim();

  if (!toolName) {
    errors.push({ field: 'toolName', message: 'Enter a tool name.' });
  } else if (toolName.length > 80) {
    errors.push({ field: 'toolName', message: 'Use 80 characters or fewer.' });
  }

  if (!toolCategories.includes(input.category)) {
    errors.push({ field: 'category', message: 'Choose a listed category.' });
  }

  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 99) {
    errors.push({ field: 'quantity', message: 'Quantity must be a whole number from 1 to 99.' });
  }

  if (!isDateOnly(today)) {
    errors.push({ field: 'plannedReturnDate', message: 'The current date is invalid.' });
  }

  if (input.plannedReturnDate) {
    if (!isDateOnly(input.plannedReturnDate)) {
      errors.push({ field: 'plannedReturnDate', message: 'Enter a valid calendar date.' });
    } else if (isDateOnly(today) && input.plannedReturnDate < today) {
      errors.push({ field: 'plannedReturnDate', message: 'Choose today or a later date.' });
    }
  }

  return errors;
}

export function createLoanRecord(
  input: LoanInput,
  options: CreateLoanOptions,
): LoanResult {
  const errors = validateLoanInput(input, options.today);
  const timestamp = Date.parse(options.now);

  if (!Number.isFinite(timestamp)) {
    errors.push({ field: 'plannedReturnDate', message: 'The record time is invalid.' });
  }
  if (!options.id.trim()) {
    errors.push({ field: 'toolName', message: 'A local record ID is required.' });
  }
  if (errors.length > 0) return { ok: false, errors };

  const createdAt = new Date(timestamp).toISOString();
  const record: LoanRecord = {
    schemaVersion: 1,
    id: options.id,
    toolName: input.toolName.trim(),
    category: input.category,
    quantity: input.quantity,
    plannedReturnDate: input.plannedReturnDate || null,
    status: 'listed',
    createdAt,
    updatedAt: createdAt,
    history: [{ status: 'listed', at: createdAt }],
  };
  return { ok: true, value: record };
}

export function transitionLoanStatus(
  record: LoanRecord,
  nextStatus: LoanStatus,
  at: string,
): LoanResult {
  const errors: LoanError[] = [];
  const timestamp = Date.parse(at);

  if (!Number.isFinite(timestamp)) {
    errors.push({ field: 'plannedReturnDate', message: 'The change time is invalid.' });
  }
  if (!allowedTransitions[record.status].includes(nextStatus)) {
    errors.push({ field: 'toolName', message: `Cannot move a ${record.status} record to ${nextStatus}.` });
  }
  const lastTimestamp = Date.parse(record.updatedAt);
  if (Number.isFinite(timestamp) && timestamp < lastTimestamp) {
    errors.push({ field: 'plannedReturnDate', message: 'Changes must stay in chronological order.' });
  }
  if (errors.length > 0) return { ok: false, errors };

  const changedAt = new Date(timestamp).toISOString();
  return {
    ok: true,
    value: {
      ...record,
      status: nextStatus,
      updatedAt: changedAt,
      history: [...record.history, { status: nextStatus, at: changedAt }],
    },
  };
}

export function serializeLoanRecord(record: LoanRecord): string {
  return JSON.stringify(record);
}

export function deserializeLoanRecord(value: string): LoanRecord {
  const parsed: unknown = JSON.parse(value);
  if (!isLoanRecord(parsed)) throw new Error('Invalid local loan record.');
  return parsed;
}

function isLoanRecord(value: unknown): value is LoanRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<LoanRecord>;
  if (
    record.schemaVersion !== 1 ||
    typeof record.id !== 'string' ||
    typeof record.toolName !== 'string' ||
    !toolCategories.includes(record.category as ToolCategory) ||
    !Number.isInteger(record.quantity) ||
    (record.quantity ?? 0) < 1 ||
    (record.quantity ?? 100) > 99 ||
    !['listed', 'reserved', 'retired'].includes(record.status ?? '') ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string' ||
    !(record.plannedReturnDate === null || (typeof record.plannedReturnDate === 'string' && isDateOnly(record.plannedReturnDate))) ||
    !Array.isArray(record.history) ||
    record.history.length === 0
  ) {
    return false;
  }

  let previousTime = Number.NEGATIVE_INFINITY;
  for (const event of record.history) {
    if (!event || !['listed', 'reserved', 'retired'].includes(event.status)) return false;
    const eventTime = Date.parse(event.at);
    if (!Number.isFinite(eventTime) || eventTime < previousTime) return false;
    previousTime = eventTime;
  }

  return (
    record.history[0]?.status === 'listed' &&
    record.history.at(-1)?.status === record.status &&
    Date.parse(record.createdAt) <= Date.parse(record.updatedAt) &&
    record.history.at(-1)?.at === record.updatedAt
  );
}

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { LuArchive, LuBookOpenCheck, LuDatabase, LuTrash2, LuWifiOff } from 'react-icons/lu';
import { localDatabase } from '@/client-db';
import {
  createLoanRecord,
  toolCategories,
  transitionLoanStatus,
  type LoanError,
  type LoanInput,
  type LoanRecord,
  type LoanStatus,
  type ToolCategory,
} from '@/domain/tool-loan';
import { projectInfo } from '@/project-info';

const categoryLabels: Record<ToolCategory, string> = {
  gardening: 'Gardening',
  'hand-tools': 'Hand tools',
  'power-tools': 'Power tools',
  cleaning: 'Cleaning',
  other: 'Other',
};

const statusLabels: Record<LoanStatus, string> = {
  listed: 'Listed locally',
  reserved: 'Reservation planned locally',
  retired: 'Retired locally',
};

const emptyInput: LoanInput = {
  toolName: '',
  category: 'hand-tools',
  quantity: 1,
  plannedReturnDate: '',
};

function localDate(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function messageForSaveState(state: 'idle' | 'unsaved' | 'saved' | 'error'): string {
  if (state === 'unsaved') return 'This form has unsaved changes.';
  if (state === 'saved') return 'Draft saved on this device.';
  if (state === 'error') return 'Could not save on this device. Keep this page open and try again.';
  return 'No unsaved form changes.';
}

export default function HomePage() {
  const [records, setRecords] = useState<LoanRecord[]>([]);
  const [input, setInput] = useState<LoanInput>(emptyInput);
  const [errors, setErrors] = useState<LoanError[]>([]);
  const [storageState, setStorageState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saveState, setSaveState] = useState<'idle' | 'unsaved' | 'saved' | 'error'>('idle');
  const [busyRecord, setBusyRecord] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;
    localDatabase.loanDrafts
      .orderBy('updatedAt')
      .reverse()
      .toArray()
      .then((savedRecords) => {
        if (!active) return;
        setRecords(savedRecords);
        setStorageState('ready');
      })
      .catch(() => {
        if (!active) return;
        setStorageState('error');
      });
    return () => { active = false; };
  }, []);

  const errorsFor = (field: keyof LoanInput) => errors.filter((error) => error.field === field);

  async function refreshRecords() {
    const savedRecords = await localDatabase.loanDrafts.orderBy('updatedAt').reverse().toArray();
    setRecords(savedRecords);
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError('');
    const result = createLoanRecord(input, {
      id: crypto.randomUUID(),
      now: new Date().toISOString(),
      today: localDate(),
    });
    if (!result.ok) {
      setErrors(result.errors);
      setSaveState('unsaved');
      return;
    }

    setErrors([]);
    setSaveState('unsaved');
    try {
      await localDatabase.loanDrafts.add(result.value);
      await refreshRecords();
      setInput(emptyInput);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  async function changeStatus(record: LoanRecord, status: LoanStatus) {
    setActionError('');
    setBusyRecord(record.id);
    const result = transitionLoanStatus(record, status, new Date().toISOString());
    if (!result.ok) {
      setActionError(result.errors[0]?.message ?? 'That status change is not available.');
      setBusyRecord(null);
      return;
    }
    try {
      await localDatabase.loanDrafts.put(result.value);
      await refreshRecords();
      setSaveState('saved');
    } catch {
      setActionError('Could not update this record on the device.');
    } finally {
      setBusyRecord(null);
    }
  }

  async function deleteRecord(record: LoanRecord) {
    if (!window.confirm(`Permanently delete “${record.toolName}” from this device?`)) return;
    setActionError('');
    setBusyRecord(record.id);
    try {
      await localDatabase.loanDrafts.delete(record.id);
      await refreshRecords();
      setSaveState('saved');
    } catch {
      setActionError('Could not delete this record from the device.');
    } finally {
      setBusyRecord(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold text-sky-800">{projectInfo.scope}</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{projectInfo.title}</h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Local planning</span>
        </header>

        <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5" aria-labelledby="safety-heading">
          <h2 id="safety-heading" className="font-semibold text-amber-950">Planning only</h2>
          <p className="mt-2 text-sm leading-6 text-amber-950">
            This page stores tool drafts on this device. A reservation is only a personal planning marker; it does not verify ownership,
            accept a request, or confirm an exchange, handover or return. Do not enter names, contact details, deposits, damage reports,
            condition notes or photos. Rules for real exchanges are not in place yet.
          </p>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <LuBookOpenCheck className="text-sky-800" size={22} aria-hidden="true" />
              <div>
                <h2 className="text-xl font-semibold">Add a local tool draft</h2>
                <p className="mt-1 text-sm text-slate-600">No account or server connection is used.</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={saveRecord} noValidate>
              <div>
                <label className="block text-sm font-medium" htmlFor="tool-name">Tool name</label>
                <input
                  id="tool-name"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
                  value={input.toolName}
                  maxLength={80}
                  autoComplete="off"
                  aria-invalid={errorsFor('toolName').length > 0}
                  aria-describedby={errorsFor('toolName').length ? 'tool-name-error' : undefined}
                  onChange={(event) => {
                    setInput({ ...input, toolName: event.target.value });
                    setErrors(errors.filter((error) => error.field !== 'toolName'));
                    setSaveState('unsaved');
                  }}
                />
                {errorsFor('toolName').map((error) => <p id="tool-name-error" key={error.message} className="mt-1 text-sm text-red-700">{error.message}</p>)}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium" htmlFor="category">Category</label>
                  <select
                    id="category"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
                    value={input.category}
                    onChange={(event) => {
                      setInput({ ...input, category: event.target.value as ToolCategory });
                      setSaveState('unsaved');
                    }}
                  >
                    {toolCategories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
                  </select>
                  {errorsFor('category').map((error) => <p key={error.message} className="mt-1 text-sm text-red-700">{error.message}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium" htmlFor="quantity">Quantity</label>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    max={99}
                    step={1}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
                    value={input.quantity}
                    aria-invalid={errorsFor('quantity').length > 0}
                    onChange={(event) => {
                      setInput({ ...input, quantity: Number(event.target.value) });
                      setErrors(errors.filter((error) => error.field !== 'quantity'));
                      setSaveState('unsaved');
                    }}
                  />
                  {errorsFor('quantity').map((error) => <p key={error.message} className="mt-1 text-sm text-red-700">{error.message}</p>)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="return-date">Planned return date <span className="font-normal text-slate-500">(optional)</span></label>
                <input
                  id="return-date"
                  type="date"
                  min={localDate()}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
                  value={input.plannedReturnDate}
                  aria-invalid={errorsFor('plannedReturnDate').length > 0}
                  onChange={(event) => {
                    setInput({ ...input, plannedReturnDate: event.target.value });
                    setErrors(errors.filter((error) => error.field !== 'plannedReturnDate'));
                    setSaveState('unsaved');
                  }}
                />
                {errorsFor('plannedReturnDate').map((error) => <p key={error.message} className="mt-1 text-sm text-red-700">{error.message}</p>)}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={storageState !== 'ready'}
                  className="rounded-lg bg-sky-900 px-4 py-2.5 font-medium text-white hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {storageState === 'loading' ? 'Opening local storage…' : 'Save local tool draft'}
                </button>
                <p className="text-sm text-slate-600" aria-live="polite">{messageForSaveState(saveState)}</p>
              </div>
            </form>

            {storageState === 'error' && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">Local storage is unavailable in this browser. Nothing was saved.</p>}
          </div>

          <section aria-labelledby="records-heading">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 id="records-heading" className="text-xl font-semibold">This device</h2>
                <p className="mt-1 text-sm text-slate-600">Drafts saved in this browser</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                <LuWifiOff aria-hidden="true" /> Not synced
              </div>
            </div>

            <div className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              <LuDatabase className="mt-1 shrink-0" aria-hidden="true" />
              <p>Records stay in this browser&apos;s local storage. They are not sent to a server or available on another device. Anyone using this browser profile may be able to see them.</p>
            </div>

            {actionError && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{actionError}</p>}
            {storageState === 'loading' && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading local drafts…</p>}
            {storageState === 'ready' && records.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h3 className="font-semibold">No local drafts yet</h3>
                <p className="mt-2 text-sm text-slate-600">Add a tool above to begin a private planning list.</p>
              </div>
            )}

            <ul className="space-y-3">
              {records.map((record) => (
                <li key={record.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{record.toolName}</h3>
                      <p className="mt-1 text-sm text-slate-600">{categoryLabels[record.category]} · Quantity {record.quantity}</p>
                      {record.plannedReturnDate && <p className="mt-1 text-sm text-slate-600">Planned return: {record.plannedReturnDate}</p>}
                    </div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900">{statusLabels[record.status]}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {record.status === 'listed' && <button className="rounded-lg border border-sky-800 px-3 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50" disabled={busyRecord === record.id} onClick={() => void changeStatus(record, 'reserved')}>Plan reservation</button>}
                    {record.status === 'reserved' && <button className="rounded-lg border border-sky-800 px-3 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50" disabled={busyRecord === record.id} onClick={() => void changeStatus(record, 'listed')}>Cancel plan</button>}
                    {record.status !== 'retired' && <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50" disabled={busyRecord === record.id} onClick={() => void changeStatus(record, 'retired')}><LuArchive className="mr-1 inline" aria-hidden="true" />Retire listing</button>}
                    <button className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-800 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50" disabled={busyRecord === record.id} onClick={() => void deleteRecord(record)}><LuTrash2 className="mr-1 inline" aria-hidden="true" />Delete from device</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500">
          <p>Offline support covers local drafts only. There is no account, shared inventory, conflict handling, backup or sync.</p>
        </footer>
      </div>
    </main>
  );
}

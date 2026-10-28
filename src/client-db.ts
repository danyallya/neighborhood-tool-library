import Dexie,{type Table} from 'dexie';
import type {LoanRecord} from './domain/tool-loan';
export type OutboxItem={id:string;payload:unknown;createdAt:number;attempts:number;lastError?:string};
export class LocalDatabase extends Dexie {
  outbox!:Table<OutboxItem,string>;
  loanDrafts!:Table<LoanRecord,string>;
  constructor(){
    super("idea-neighborhood-tool-library");
    this.version(1).stores({outbox:'id,createdAt,attempts'});
    this.version(2).stores({outbox:'id,createdAt,attempts',loanDrafts:'id,status,updatedAt'});
  }
}
export const localDatabase=new LocalDatabase();

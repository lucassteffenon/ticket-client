import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface Ticket {
  code: string;
  eventId: string;
  status: 'valid' | 'used' | 'invalid';
  holderName?: string;
}

interface PendingValidation {
  code: string;
  timestamp: number;
  status: 'valid' | 'invalid';
}

export interface PendingRegistration {
  name: string;
  email: string;
  eventId: string;
  timestamp: number;
}

interface TicketDB extends DBSchema {
  tickets: {
    key: string;
    value: Ticket;
  };
  'pending-validations': {
    key: string;
    value: PendingValidation;
  };
  'pending-registrations': {
    key: number; // Auto-increment ID
    value: PendingRegistration;
  };
}

@Injectable({
  providedIn: 'root',
})
export class OfflineService {
  private dbPromise: Promise<IDBPDatabase<TicketDB>>;

  constructor() {
    this.dbPromise = openDB<TicketDB>('ticket-db', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tickets')) {
          db.createObjectStore('tickets', { keyPath: 'code' });
        }
        if (!db.objectStoreNames.contains('pending-validations')) {
          db.createObjectStore('pending-validations', { keyPath: 'code' });
        }
        if (!db.objectStoreNames.contains('pending-registrations')) {
          db.createObjectStore('pending-registrations', { autoIncrement: true });
        }
      },
    });
  }

  async saveTickets(tickets: Ticket[]) {
    const db = await this.dbPromise;
    const tx = db.transaction('tickets', 'readwrite');
    await Promise.all([
      ...tickets.map((ticket) => tx.store.put(ticket)),
      tx.done,
    ]);
  }

  async getTicket(code: string): Promise<Ticket | undefined> {
    const db = await this.dbPromise;
    return db.get('tickets', code);
  }

  async addPendingValidation(validation: PendingValidation) {
    const db = await this.dbPromise;
    await db.put('pending-validations', validation);
  }

  async getPendingValidations(): Promise<PendingValidation[]> {
    const db = await this.dbPromise;
    return db.getAll('pending-validations');
  }

  async clearPendingValidations(codes: string[]) {
    const db = await this.dbPromise;
    const tx = db.transaction('pending-validations', 'readwrite');
    await Promise.all([
      ...codes.map((code) => tx.store.delete(code)),
      tx.done,
    ]);
  }

  async addPendingRegistration(registration: PendingRegistration) {
    const db = await this.dbPromise;
    await db.add('pending-registrations', registration);
  }

  async getPendingRegistrations(): Promise<PendingRegistration[]> {
    const db = await this.dbPromise;
    return db.getAll('pending-registrations');
  }

  async clearPendingRegistrations() {
    const db = await this.dbPromise;
    await db.clear('pending-registrations');
  }
}

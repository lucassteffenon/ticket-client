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

export interface PendingCheckin {
  event_id: string;
  user_id: string;
  checkin_time: string;
}

interface EventData {
  id: string;
  event: any;
  participants: any[];
  downloadedAt: string;
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
  'pending-checkins': {
    key: number; // Auto-increment ID
    value: PendingCheckin;
  };
  'offline-events': {
    key: string; // Event ID
    value: EventData;
  };
}

@Injectable({
  providedIn: 'root',
})
export class OfflineService {
  private dbPromise: Promise<IDBPDatabase<TicketDB>>;

  constructor() {
    this.dbPromise = openDB<TicketDB>('ticket-db', 4, {
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
        if (!db.objectStoreNames.contains('pending-checkins')) {
          db.createObjectStore('pending-checkins', { autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('offline-events')) {
          db.createObjectStore('offline-events', { keyPath: 'id' });
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

  async saveEventForOffline(eventId: string, event: any, participants: any[]) {
    const db = await this.dbPromise;
    const eventData: EventData = {
      id: eventId,
      event,
      participants,
      downloadedAt: new Date().toISOString()
    };
    await db.put('offline-events', eventData);
  }

  async getOfflineEvent(eventId: string): Promise<EventData | undefined> {
    const db = await this.dbPromise;
    return db.get('offline-events', eventId);
  }

  async getAllOfflineEvents(): Promise<EventData[]> {
    const db = await this.dbPromise;
    return db.getAll('offline-events');
  }

  async deleteOfflineEvent(eventId: string) {
    const db = await this.dbPromise;
    await db.delete('offline-events', eventId);
  }

  async addPendingCheckin(checkin: PendingCheckin) {
    const db = await this.dbPromise;
    await db.add('pending-checkins', checkin);
  }

  async getPendingCheckins(): Promise<PendingCheckin[]> {
    const db = await this.dbPromise;
    return db.getAll('pending-checkins');
  }

  async clearPendingCheckins() {
    const db = await this.dbPromise;
    await db.clear('pending-checkins');
  }
}

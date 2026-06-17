import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';

export type SyncChannel = 'productos' | 'ventas' | 'clientes' | 'personal' | 'proveedores';

interface SyncEvent {
  channel: SyncChannel;
  reason: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeSyncService {
  private readonly eventsSubject = new Subject<SyncEvent>();
  private readonly socket: Socket | null =
    typeof window !== 'undefined'
      ? io('http://localhost:3000', {
          transports: ['websocket', 'polling'],
        })
      : null;
  private readonly broadcastChannel =
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('riky-inventory-sync')
      : null;

  constructor() {
    this.broadcastChannel?.addEventListener('message', (event: MessageEvent<SyncEvent>) => {
      if (event.data?.channel) {
        this.eventsSubject.next(event.data);
      }
    });

    this.socket?.on('inventory:event', (event: SyncEvent) => {
      if (event?.channel) {
        this.eventsSubject.next(event);
      }
    });
  }

  watch(...channels: SyncChannel[]): Observable<SyncEvent> {
    return this.eventsSubject.asObservable().pipe(
      filter((event) => channels.includes(event.channel))
    );
  }

  notify(channel: SyncChannel, reason = 'updated'): void {
    const event: SyncEvent = {
      channel,
      reason,
      timestamp: Date.now(),
    };

    this.eventsSubject.next(event);
    this.broadcastChannel?.postMessage(event);
    this.socket?.emit('inventory:event:client', event);
  }
}

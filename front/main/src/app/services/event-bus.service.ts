import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { EmitEvent, Event } from '../interfaces/EmitEvent';
import { filter, pluck } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EventBusService {
  private subject$ = new Subject<EmitEvent>();

  emit<T = void>(event: Event, data?: T) {
    this.subject$.next({ event, data });
  }

  onObserver<T>(events: Event[]): Observable<T> {
    return this.subject$.asObservable().pipe(
      filter((e: EmitEvent) => events.includes(e.event)),
      pluck('data')
    );
  }

  onObserverWithEventName(events: Event[]): Observable<EmitEvent> {
    return this.subject$.asObservable().pipe(
      filter((e: EmitEvent) => events.includes(e.event)),
    );
  }
}

import {Util} from "./Util";

/**
 * Observable for custom events.
 *
 * If you create a new observable, ensure that when the owner is destroyed, releaseAll() is called. Otherwise, will
 * leave dangling references.
 *
 * @param C The caller.
 * @param T The event data.
 */
export class Observable<C, T>
{
    private readonly observers: Observer<C, T>[] = [];

    /**
     * Register an observer for this Observable event.
     * @param observer The observer to register.
     */
    register(observer: Observer<C, T>): void
    {
        this.observers.push(observer);
    }

    /**
     * Deregister an observer for this Observable event. Call this if the observer is destroyed or no longer required.
     * @param observer The observer to deregister.
     */
    deregister(observer: Observer<C, T>): void
    {
        Util.remove(this.observers, observer);
    }

    /**
     * Trigger the event.
     * @param caller The event caller.
     * @param data The data for the event.
     */
    trigger(caller: C, data: T): void
    {
        this.observers.forEach(value => value(caller, data));
    }

    /**
     * Release all Observers on this observable.
     */
    releaseAll(): void
    {
        this.observers.length = 0;
    }
}

/**
 * Type definition for an Observer function. The parameter types should match the Observable types.
 * @param caller The caller.
 * @param data The data for the event.
 */
export type Observer<C, T> = (caller: C, data: T) => void;

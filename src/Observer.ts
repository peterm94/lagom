import {Util} from "./Util";

export class Observable<C, T> {
    private readonly observers: Observer<C, T>[] = [];

    register(observer: Observer<C, T>) {
        this.observers.push(observer);
    }

    deregister(observer: Observer<C, T>) {
        Util.remove(this.observers, observer);
    }

    trigger(caller: C, data: T) {
        this.observers.forEach(value => value(caller, data));
    }
}

export type Observer<C, T> = (caller: C, data: T) => void;
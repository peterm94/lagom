import {Util} from "./Util";

export class Observable<T> {
    private readonly observers: Observer<T>[] = [];

    register(observer: Observer<T>) {
        this.observers.push(observer);
    }

    deregister(observer: Observer<T>) {
        Util.remove(this.observers, observer);
    }

    trigger(data: T) {
        this.observers.forEach(value => value.notify(this, data));
    }
}

export interface Observer<T> {
    notify(observable: Observable<T>, data: T): void;
}
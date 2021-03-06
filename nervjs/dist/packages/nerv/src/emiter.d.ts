declare class Emiter<T> {
    value: T;
    private handlers;
    constructor(value: T);
    on(handler: Function): void;
    off(handler: Function): void;
    set(value: T): void;
}
export { Emiter };

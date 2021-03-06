export interface Cache<Key, Value> {
    k: Key;
    v: Value;
}
export declare class SimpleMap<Key, Value> {
    cache: Array<Cache<Key, Value>>;
    size: number;
    constructor();
    set(k: any, v: any): void;
    get(k: any): Value | undefined;
    has(k: any): boolean;
    delete(k: any): boolean;
    clear(): void;
}
export declare const MapClass: MapConstructor;

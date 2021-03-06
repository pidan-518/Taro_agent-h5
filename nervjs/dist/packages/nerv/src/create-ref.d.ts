export interface RefObject<T> {
    current?: T;
}
export declare function createRef<T>(): RefObject<T>;
export declare function forwardRef(cb: Function): Function;

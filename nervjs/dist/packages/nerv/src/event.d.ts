declare global {
    interface Event {
        persist: Function;
    }
}
export declare function attachEvent(domNode: Element, eventName: string, handler: Function): void;
export declare function detachEvent(domNode: Element, eventName: string, handler: Function): void;

export declare class Renderer {
    rid: any;
    pending: any[];
    connected: boolean;
    instMap: WeakMap<any, any>;
    hook: any;
    constructor(hook: any, rid: any);
    markConnected(): void;
    flushPendingEvents(): void;
    mount(vnode: any): void;
    update(vnode: any): void;
    handleCommitFiberRoot(vnode: any): any;
    handleCommitFiberUnmount(vnode: any): void;
    getNativeFromReactElement(vnode: any): any;
    getReactElementFromNative(dom: any): any;
    walkTree(): void;
    cleanup(): void;
}

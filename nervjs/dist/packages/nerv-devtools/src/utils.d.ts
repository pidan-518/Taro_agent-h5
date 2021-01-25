export declare function getNodeType(vnode: any): "Composite" | "Native" | "Text";
export declare function getDisplayName(vnode: any): string;
export declare function setIn(obj: any, path: any, value: any): void;
export declare function isRoot(vnode: any): boolean;
export declare function getInstance(vnode: any): any;
export declare function shallowEqual(a: any, b: any, isProps?: any): boolean;
export declare function hasDataChanged(prev: any, next: any): boolean;
export declare function getChildren(vnode: any): any;
export declare function getData(_vnode: any): {
    nodeType: string;
    type: any;
    name: string;
    ref: any;
    key: any;
    updater: any;
    text: any;
    state: Readonly<any> | null;
    props: any;
    children: any;
    publicInstance: any;
    memoizedInteractions: never[];
    actualDuration: number;
    actualStartTime: any;
    treeBaseDuration: number;
};
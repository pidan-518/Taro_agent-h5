import Component from './component';
export declare function memo(component: Function, propsAreEqual?: Function): {
    (this: Component<{}, {}>, props: any): import("../../nerv-shared/src").VNode | Component<any, any> | import("./full-component").default;
    _forwarded: boolean;
    isMemo: boolean;
};

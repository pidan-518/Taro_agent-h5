export interface Widget {
    vtype: VType;
    name: string;
    _owner: any;
    props: any;
    _rendered: any;
    context: any;
    init(parentContext: any, parentComponent: any): Element | null;
    update(previous: ComponentInstance, current: ComponentInstance, context: any, dom?: Element): Element | null;
    destroy(dom?: Element): any;
}
export interface Portal {
    type: Element;
    vtype: VType;
    children: VirtualNode;
    dom: null | Element;
}
export declare type ComponentInstance = CompositeComponent | StatelessComponent;
export interface CompositeComponent extends Widget {
    type: any;
    component: Component<any, any>;
    ref?: Ref;
    dom: Element | null;
}
export interface StatelessComponent extends Widget {
    type: Function;
    dom: Element | null;
}
export declare const EMPTY_CHILDREN: any[];
export declare const EMPTY_OBJ: {};
export interface VText {
    vtype: VType;
    text: string | number;
    dom: Text | null;
}
export interface VVoid {
    dom: Text | null;
    vtype: VType;
}
export interface VNode {
    vtype: VType;
    type: string;
    props: Props;
    children: VirtualChildren;
    key: string | number | undefined;
    namespace: string | null;
    _owner: Component<any, any>;
    isSvg?: boolean;
    parentContext?: any;
    dom: Element | null;
    ref: Function | string | null;
}
export declare type VirtualNode = VNode | VText | CompositeComponent | StatelessComponent | VVoid | Portal;
export declare type VirtualChildren = Array<string | number | VirtualNode> | VirtualNode;
export declare type Ref = (node?: Element | null) => void | null | string;
export interface Props {
    children?: VirtualChildren;
    ref?: Ref;
    key?: any;
    className?: string | object;
    [k: string]: any;
}
export interface ComponentLifecycle<P, S> {
    componentWillMount?(): void;
    componentDidMount?(): void;
    componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
    shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean;
    componentWillUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): void;
    componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>, prevContext: any): void;
    componentWillUnmount?(): void;
    componentDidCatch?(error?: any): void;
    getDerivedStateFromProps?(nextProps: Readonly<P>, prevState: Readonly<S>): object | null;
    getDerivedStateFromError?(error?: any): object | null;
    getSnapshotBeforeUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>): object | null;
}
export interface Refs {
    [k: string]: any;
}
export interface Component<P, S> extends ComponentLifecycle<P, S> {
    state: Readonly<S>;
    props: Readonly<P> & Readonly<any>;
    context: any;
    _dirty: boolean;
    _disable: boolean;
    _rendered: any;
    _parentComponent: Component<any, any>;
    prevProps: P;
    prevState: S;
    prevContext: object;
    isReactComponent: object;
    dom: any;
    vnode: CompositeComponent;
    clearCallBacks: () => void;
    getState(): S;
    refs: Refs;
    render(props?: any, context?: any): VirtualNode;
}
export declare function isNullOrUndef(o: any): o is undefined | null;
export declare function isInvalid(o: any): o is undefined | null | true | false;
export declare function isVNode(node: any): node is VNode;
export declare function isVText(node: any): node is VText;
export declare function isComponent(instance: any): instance is Component<any, any>;
export declare function isWidget(node: any): node is CompositeComponent | StatelessComponent;
export declare function isPortal(vtype: VType, node: any): node is Portal;
export declare function isComposite(node: any): node is CompositeComponent;
export declare function isValidElement(node: any): node is VirtualNode;
export declare function isHook(arg: any): boolean;
export declare function noop(): void;
export declare const enum VType {
    Text = 1,
    Node = 2,
    Composite = 4,
    Void = 16,
    Portal = 32
}

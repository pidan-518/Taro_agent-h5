import { Props, ComponentLifecycle, Refs, Component as ComponentInst, CompositeComponent } from 'nerv-shared';
import { Hook, HookEffect } from './hooks';
interface Component<P = {}, S = {}> extends ComponentLifecycle<P, S> {
    _rendered: any;
    dom: any;
}
declare class Component<P, S> implements ComponentInst<P, S> {
    static defaultProps: {};
    static getDerivedStateFromError?(error?: any): object | null;
    state: Readonly<S>;
    props: Readonly<P> & Readonly<Props>;
    prevProps: P;
    prevState: S;
    prevContext: object;
    _parentComponent: Component<any, any>;
    vnode: CompositeComponent;
    context: any;
    _dirty: boolean;
    _disable: boolean;
    _pendingStates: any[];
    _pendingCallbacks: Function[];
    refs: Refs;
    isReactComponent: Object;
    _afterScheduleEffect: boolean;
    hooks: Hook[];
    effects: HookEffect[];
    layoutEffects: HookEffect[];
    constructor(props?: P, context?: any);
    setState<K extends keyof S>(state: ((prevState: Readonly<S>, props: P) => Pick<S, K> | S) | (Pick<S, K> | S), callback?: () => void): void;
    getState(): S;
    clearCallBacks(): void;
    forceUpdate(callback?: Function): void;
    render(nextProps?: P, nextState?: any, nextContext?: any): any;
}
export default Component;

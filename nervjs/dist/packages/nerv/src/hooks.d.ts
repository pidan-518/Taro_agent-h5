import Component from './component';
import { RefObject } from './create-ref';
import { Context } from './create-context';
export declare function getHooks(index: number): Hook;
declare type SetStateAction<S> = S | ((prevState: S) => S);
declare type Dispatch<A> = (value: A) => void;
declare type EffectCallback = () => (void | (() => void));
declare type DependencyList = ReadonlyArray<any>;
declare type Reducer<S, A> = (prevState: S, action: A) => S;
declare type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
declare type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;
export interface HookEffect {
    deps?: DependencyList;
    effect: EffectCallback;
    cleanup?: Function;
}
export interface HookState<S> {
    component: Component<any, any>;
    state: [S, Dispatch<SetStateAction<S>>];
}
export interface HookRef<T> {
    ref?: RefObject<T>;
}
export interface HookReducer<R extends Reducer<any, any>, I> {
    component: Component<any, any>;
    state: [ReducerState<R>, Dispatch<ReducerAction<R>>];
}
export interface HookCallback<T> {
    deps?: DependencyList;
    callback: Function;
    value: T;
}
export interface HookContext {
    context?: true;
}
export declare type Hook = HookEffect & HookState<unknown> & HookReducer<any, unknown> & HookRef<unknown> & HookCallback<any> & HookContext;
export declare function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
export declare function useReducer<R extends Reducer<any, any>, I>(reducer: R, initialState: I & ReducerState<R>, initializer?: (arg: I & ReducerState<R>) => ReducerState<R>): [ReducerState<R>, Dispatch<ReducerAction<R>>];
export declare function invokeEffects(component: Component<any, any>, delay?: boolean): void;
export declare function useEffect(effect: EffectCallback, deps?: DependencyList): void;
export declare function useLayoutEffect(effect: EffectCallback, deps?: DependencyList): void;
export declare function useRef<T>(initialValue?: T): RefObject<T>;
export declare function useMemo<T>(factory: () => T, deps?: DependencyList): T;
export declare function useCallback<T extends (...args: never[]) => unknown>(callback: T, deps: DependencyList): T;
export declare function useContext<T>(context: Context<T>): T;
export declare function useImperativeHandle<T, R extends T>(ref: RefObject<T> | undefined, init: () => R, deps?: DependencyList): void;
export {};

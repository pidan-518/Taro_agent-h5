import Component from './component';
export declare let uid: number;
export interface ProviderProps<T> {
    value: T;
}
export interface ConsumerProps {
    children: Function;
}
export interface ConsumerState<T> {
    value: T;
}
export interface Context<T> {
    Provider: Component<ProviderProps<T>>;
    Consumer: Component<ConsumerProps, ConsumerState<T>>;
    _id: string;
    _defaultValue: T;
}
export declare function createContext<T>(defaultValue: T): Context<T>;

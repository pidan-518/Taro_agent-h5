import { Component } from 'nervjs';
import { ComponentLifecycle } from 'nerv-shared';
export interface Mixin<P, S> extends ComponentLifecycle<P, S> {
    statics?: {
        [key: string]: any;
    };
    mixins?: any;
    displayName?: string;
    propTypes?: {
        [index: string]: Function;
    };
    getDefaultProps?(): P;
    getInitialState?(): S;
}
export interface ComponentClass<P, S> extends Mixin<P, S> {
    propTypes?: {};
    contextTypes?: {};
    childContextTypes?: {};
    defaultProps?: P;
    displayName?: string;
    new (props?: P, context?: any): Component<P, S>;
}
export interface ComponentSpec<P, S> extends Mixin<P, S> {
    [propertyName: string]: any;
    render(props?: any, context?: any): any;
}
export interface ClassicComponent<P, S> extends Component<P, S> {
    replaceState(nextState: S, callback?: () => any): void;
    isMounted(): boolean;
    getInitialState?(): S;
}
export interface ClassicComponentClass<P, S> extends ComponentClass<P, S> {
    new (props?: P, context?: any): ClassicComponent<P, S>;
    getDefaultProps?(): P;
}
export default function createClass<P, S>(obj: ComponentSpec<P, S>): ClassicComponentClass<P, S>;

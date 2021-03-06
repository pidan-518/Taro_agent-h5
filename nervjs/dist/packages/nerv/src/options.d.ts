import { CompositeComponent, StatelessComponent, VirtualNode, Component } from 'nerv-shared';
export declare type optionsHook = (vnode: CompositeComponent | StatelessComponent) => void;
declare const options: {
    afterMount: optionsHook;
    afterUpdate: optionsHook;
    beforeUpdate: optionsHook;
    beforeUnmount: optionsHook;
    beforeMount: optionsHook;
    afterCreate: optionsHook;
    beforeRender: (component: Component<any, any>) => void;
    roots: VirtualNode[];
    debug: boolean;
};
export default options;

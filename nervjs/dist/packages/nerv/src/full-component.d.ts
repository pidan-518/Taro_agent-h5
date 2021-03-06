import { VType, CompositeComponent, Ref } from 'nerv-shared';
import Component from './component';
declare class ComponentWrapper implements CompositeComponent {
    vtype: VType;
    type: any;
    name: string;
    _owner: any;
    props: any;
    component: Component<any, any>;
    context: any;
    key: any;
    dom: Element | null;
    _rendered: any;
    ref: Ref;
    constructor(type: any, props: any);
    init(parentContext: any, parentComponent: any): Element;
    update(previous: any, current: any, parentContext: any, domNode?: any): any;
    destroy(): void;
}
export default ComponentWrapper;

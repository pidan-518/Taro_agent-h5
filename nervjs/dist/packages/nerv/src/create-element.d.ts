import FullComponent from './full-component';
import { Props, VNode, VirtualChildren } from 'nerv-shared';
import Component from './component';
declare function createElement<T>(type: string | Function | Component<any, any>, properties?: T & Props | null, ..._children: Array<VirtualChildren | null>): Component<any, any> | VNode | FullComponent;
export default createElement;

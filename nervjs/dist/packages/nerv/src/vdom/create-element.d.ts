import { VirtualNode, VNode } from 'nerv-shared';
declare function createElement(vnode: VirtualNode | VirtualNode[], isSvg?: boolean, parentContext?: any, parentComponent?: any): Element | Text | Comment | Array<Element | Text | Comment>;
export declare function mountVNode(vnode: VNode, isSvg?: boolean, parentContext?: any, parentComponent?: any): Element;
export declare function mountChild(child: VNode, domNode: Element, parentContext: Object, isSvg?: boolean, parentComponent?: any): void;
export declare function mountElement(element: Element | Text | Comment | Array<Element | Text | Comment>, parentNode: Element, refChild?: Node | null): void;
export declare function insertElement(element: Element | Text | Comment | Array<Element | Text | Comment>, parentNode: Element, lastDom: Element): void;
export default createElement;

import { VNode } from 'nerv-shared';
export declare function patch(lastVnode: any, nextVnode: any, parentNode: Element, context: object, isSvg?: boolean): any;
export declare function patchChildren(parentDom: Element, lastChildren: any, nextChildren: any, context: object, isSvg: boolean): void;
export declare function patchProp(domNode: Element, prop: string, lastValue: any, nextValue: any, lastVnode: VNode | null, isSvg?: boolean): void;
export declare function setProperty(node: any, name: any, value: any): void;
export default patch;

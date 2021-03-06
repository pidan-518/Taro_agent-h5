import { VirtualChildren } from 'nerv-shared';
export declare type IterateFn = (value: VirtualChildren | any, index: number, array: Array<VirtualChildren | any>) => any;
export declare const Children: {
    map(children: any[], fn: IterateFn, ctx: any): any[];
    forEach(children: any[], fn: IterateFn, ctx: any): void;
    count(children: any[]): number;
    only(children: any[]): any;
    toArray(children: any[]): any[];
};

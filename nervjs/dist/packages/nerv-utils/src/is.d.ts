export declare function isNumber(arg: any): arg is number;
export declare const isSupportSVG: boolean;
export declare function isString(arg: any): arg is string;
export declare function isFunction(arg: any): arg is Function;
export declare function isBoolean(arg: any): arg is true | false;
export declare const isArray: (arg: any) => arg is any[];
export declare function isObject(arg: any): arg is Object;
export declare function isNative(Ctor: any): boolean;
export declare function isUndefined(o: any): o is undefined;
export declare function objectIs(x: any, y: any): boolean;
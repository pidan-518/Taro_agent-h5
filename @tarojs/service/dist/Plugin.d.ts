import Kernel from './Kernel';
import { IHook, ICommand, IPlatform } from './utils/types';
export default class Plugin {
    id: string;
    path: string;
    ctx: Kernel;
    optsSchema: Function;
    constructor(opts: any);
    register(hook: IHook): void;
    registerCommand(command: ICommand): void;
    registerPlatform(platform: IPlatform): void;
    registerMethod(...args: any[]): void;
    addPluginOptsSchema(schema: any): void;
}

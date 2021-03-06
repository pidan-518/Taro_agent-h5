import { PluginItem } from '@tarojs/taro/types/compile';
import { PluginType } from './constants';
import { IPlugin } from './types';
export declare function getPluginPath(pluginPath: string): string;
export declare function convertPluginsToObject(items: PluginItem[]): () => {};
export declare function mergePlugins(dist: PluginItem[], src: PluginItem[]): () => any;
export declare function resolvePresetsOrPlugins(root: string, args: any, type: PluginType): IPlugin[];
export declare function printHelpLog(command: any, optionsList: Map<string, string>, synopsisList?: Set<string>): void;

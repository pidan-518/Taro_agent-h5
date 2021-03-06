"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const events_1 = require("events");
const tapable_1 = require("tapable");
const helper_1 = require("@tarojs/helper");
const helper = require("@tarojs/helper");
const joi = require("@hapi/joi");
const constants_1 = require("./utils/constants");
const utils_1 = require("./utils");
const Plugin_1 = require("./Plugin");
const Config_1 = require("./Config");
class Kernel extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.debugger = helper_1.createDebug('Taro:Kernel');
        this.appPath = options.appPath || process.cwd();
        this.optsPresets = options.presets;
        this.optsPlugins = options.plugins;
        this.hooks = new Map();
        this.methods = new Map();
        this.commands = new Map();
        this.platforms = new Map();
        this.initHelper();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.debugger('init');
            this.initConfig();
            this.initPaths();
            this.initPresetsAndPlugins();
            yield this.applyPlugins('onReady');
        });
    }
    initConfig() {
        this.config = new Config_1.default({
            appPath: this.appPath
        });
        this.initialConfig = this.config.initialConfig;
        this.debugger('initConfig', this.initialConfig);
    }
    initPaths() {
        this.paths = {
            appPath: this.appPath,
            nodeModulesPath: helper_1.recursiveFindNodeModules(path.join(this.appPath, helper_1.NODE_MODULES))
        };
        if (this.config.isInitSuccess) {
            Object.assign(this.paths, {
                configPath: this.config.configPath,
                sourcePath: path.join(this.appPath, this.initialConfig.sourceRoot),
                outputPath: path.join(this.appPath, this.initialConfig.outputRoot)
            });
        }
        this.debugger(`initPaths:${JSON.stringify(this.paths, null, 2)}`);
    }
    initHelper() {
        this.helper = helper;
        this.debugger('initHelper');
    }
    initPresetsAndPlugins() {
        const initialConfig = this.initialConfig;
        const allConfigPresets = utils_1.mergePlugins(this.optsPresets || [], initialConfig.presets || [])();
        const allConfigPlugins = utils_1.mergePlugins(this.optsPlugins || [], initialConfig.plugins || [])();
        this.debugger('initPresetsAndPlugins', allConfigPresets, allConfigPlugins);
        helper_1.createBabelRegister({
            only: [...Object.keys(allConfigPresets), ...Object.keys(allConfigPlugins)]
        });
        this.plugins = new Map();
        this.extraPlugins = [];
        this.resolvePresets(allConfigPresets);
        this.resolvePlugins(allConfigPlugins);
    }
    resolvePresets(presets) {
        const allPresets = utils_1.resolvePresetsOrPlugins(this.appPath, presets, constants_1.PluginType.Preset);
        while (allPresets.length) {
            this.initPreset(allPresets.shift());
        }
    }
    resolvePlugins(plugins) {
        const allPlugins = utils_1.resolvePresetsOrPlugins(this.appPath, plugins, constants_1.PluginType.Plugin);
        const _plugins = [...this.extraPlugins, ...allPlugins];
        while (_plugins.length) {
            this.initPlugin(_plugins.shift());
        }
        this.extraPlugins = [];
    }
    initPreset(preset) {
        this.debugger('initPreset', preset);
        const { id, path, opts, apply } = preset;
        const pluginCtx = this.initPluginCtx({ id, path, ctx: this });
        const { presets, plugins } = apply()(pluginCtx, opts) || {};
        this.registerPlugin(preset);
        if (Array.isArray(presets)) {
            const _presets = utils_1.resolvePresetsOrPlugins(this.appPath, utils_1.convertPluginsToObject(presets)(), constants_1.PluginType.Preset);
            while (_presets.length) {
                this.initPreset(_presets.shift());
            }
        }
        if (Array.isArray(plugins)) {
            this.extraPlugins.push(...utils_1.resolvePresetsOrPlugins(this.appPath, utils_1.convertPluginsToObject(plugins)(), constants_1.PluginType.Plugin));
        }
    }
    initPlugin(plugin) {
        const { id, path, opts, apply } = plugin;
        const pluginCtx = this.initPluginCtx({ id, path, ctx: this });
        this.debugger('initPlugin', plugin);
        this.registerPlugin(plugin);
        apply()(pluginCtx, opts);
        this.checkPluginOpts(pluginCtx, opts);
    }
    checkPluginOpts(pluginCtx, opts) {
        if (typeof pluginCtx.optsSchema !== 'function') {
            return;
        }
        const schema = pluginCtx.optsSchema(joi);
        if (!joi.isSchema(schema)) {
            throw `插件${pluginCtx.id}中设置参数检查 schema 有误，请检查！`;
        }
        const { error } = schema.validate(opts);
        if (error) {
            error.message = `插件${pluginCtx.id}获得的参数不符合要求，请检查！`;
            throw error;
        }
    }
    registerPlugin(plugin) {
        if (this.plugins.has(plugin.id)) {
            throw new Error(`插件 ${plugin.id} 已被注册`);
        }
        this.plugins.set(plugin.id, plugin);
    }
    initPluginCtx({ id, path, ctx }) {
        const pluginCtx = new Plugin_1.default({ id, path, ctx });
        const internalMethods = ['onReady', 'onStart'];
        const kernelApis = [
            'appPath',
            'plugins',
            'platforms',
            'paths',
            'helper',
            'runOpts',
            'initialConfig',
            'applyPlugins'
        ];
        internalMethods.forEach(name => {
            if (!this.methods.has(name)) {
                pluginCtx.registerMethod(name);
            }
        });
        return new Proxy(pluginCtx, {
            get: (target, name) => {
                if (this.methods.has(name))
                    return this.methods.get(name);
                if (kernelApis.includes(name)) {
                    return typeof this[name] === 'function' ? this[name].bind(this) : this[name];
                }
                return target[name];
            }
        });
    }
    applyPlugins(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let name;
            let initialVal;
            let opts;
            if (typeof args === 'string') {
                name = args;
            }
            else {
                name = args.name;
                initialVal = args.initialVal;
                opts = args.opts;
            }
            this.debugger(`applyPlugins`);
            this.debugger(`applyPlugins:name:${name}`);
            this.debugger(`applyPlugins:initialVal:${initialVal}`);
            this.debugger(`applyPlugins:opts:${opts}`);
            if (typeof name !== 'string') {
                throw new Error(`调用失败，未传入正确的名称！`);
            }
            const hooks = this.hooks.get(name) || [];
            const waterfall = new tapable_1.AsyncSeriesWaterfallHook(['arg']);
            if (hooks.length) {
                const resArr = [];
                for (const hook of hooks) {
                    waterfall.tapPromise({
                        name: hook.plugin,
                        stage: hook.stage || 0,
                        before: hook.before
                    }, (arg) => __awaiter(this, void 0, void 0, function* () {
                        const res = yield hook.fn(opts, arg);
                        if (constants_1.IS_MODIFY_HOOK.test(name) && constants_1.IS_EVENT_HOOK.test(name)) {
                            return res;
                        }
                        if (constants_1.IS_ADD_HOOK.test(name)) {
                            resArr.push(res);
                            return resArr;
                        }
                        return null;
                    }));
                }
            }
            return yield waterfall.promise(initialVal);
        });
    }
    runWithPlatform(platform) {
        if (!this.platforms.has(platform)) {
            throw `不存在编译平台 ${platform}`;
        }
        const withNameConfig = this.config.getConfigWithNamed(platform, this.platforms.get(platform).useConfigName);
        return withNameConfig;
    }
    setRunOpts(opts) {
        this.runOpts = opts;
    }
    run(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let name;
            let opts;
            if (typeof args === 'string') {
                name = args;
            }
            else {
                name = args.name;
                opts = args.opts;
            }
            this.debugger('command:run');
            this.debugger(`command:run:name:${name}`);
            this.debugger('command:runOpts');
            this.debugger(`command:runOpts:${JSON.stringify(opts, null, 2)}`);
            this.setRunOpts(opts);
            yield this.init();
            this.debugger('command:onStart');
            yield this.applyPlugins('onStart');
            if (!this.commands.has(name)) {
                throw new Error(`${name} 命令不存在`);
            }
            if (opts && opts.isHelp) {
                const command = this.commands.get(name);
                const defaultOptionsMap = new Map();
                defaultOptionsMap.set('-h, --help', 'output usage information');
                let customOptionsMap = new Map();
                if (command === null || command === void 0 ? void 0 : command.optionsMap) {
                    customOptionsMap = new Map(Object.entries(command === null || command === void 0 ? void 0 : command.optionsMap));
                }
                const optionsMap = new Map([...customOptionsMap, ...defaultOptionsMap]);
                utils_1.printHelpLog(name, optionsMap, (command === null || command === void 0 ? void 0 : command.synopsisList) ? new Set(command === null || command === void 0 ? void 0 : command.synopsisList) : new Set());
                return;
            }
            if (opts && opts.platform) {
                opts.config = this.runWithPlatform(opts.platform);
            }
            yield this.applyPlugins({
                name,
                opts
            });
        });
    }
}
exports.default = Kernel;

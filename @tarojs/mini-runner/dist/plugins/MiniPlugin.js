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
exports.isFileToBeTaroComponent = exports.createTarget = void 0;
const path = require("path");
const fs = require("fs-extra");
const transformer_wx_1 = require("@tarojs/transformer-wx");
const SingleEntryDependency = require("webpack/lib/dependencies/SingleEntryDependency");
const FunctionModulePlugin = require("webpack/lib/FunctionModulePlugin");
const JsonpTemplatePlugin = require("webpack/lib/web/JsonpTemplatePlugin");
const NodeSourcePlugin = require("webpack/lib/node/NodeSourcePlugin");
const LoaderTargetPlugin = require("webpack/lib/LoaderTargetPlugin");
const lodash_1 = require("lodash");
const t = require("babel-types");
const babel_traverse_1 = require("babel-traverse");
const webpack_sources_1 = require("webpack-sources");
const loader_utils_1 = require("loader-utils");
const helper_1 = require("@tarojs/helper");
const utils_1 = require("../utils");
const TaroSingleEntryDependency_1 = require("../dependencies/TaroSingleEntryDependency");
const helper_2 = require("../utils/helper");
const parseAst_1 = require("../utils/parseAst");
const template_rewriter_1 = require("../quickapp/template-rewriter");
const TaroLoadChunksPlugin_1 = require("./TaroLoadChunksPlugin");
const TaroNormalModulesPlugin_1 = require("./TaroNormalModulesPlugin");
const MiniLoaderPlugin_1 = require("./MiniLoaderPlugin");
const PLUGIN_NAME = 'MiniPlugin';
let taroFileTypeMap = {};
const quickappCommonStyle = 'common';
exports.createTarget = function createTarget(name) {
    return (compiler) => {
        const { options } = compiler;
        new JsonpTemplatePlugin().apply(compiler);
        new FunctionModulePlugin(options.output).apply(compiler);
        new NodeSourcePlugin(options.node).apply(compiler);
        new LoaderTargetPlugin('node').apply(compiler);
    };
};
function isFileToBeTaroComponent(code, sourcePath, buildAdapter, constantsReplaceList) {
    try {
        const transformResult = transformer_wx_1.default({
            code,
            sourcePath: sourcePath,
            isTyped: helper_1.REG_TYPESCRIPT.test(sourcePath),
            adapter: buildAdapter,
            isNormal: true,
            env: constantsReplaceList
        });
        const { ast } = transformResult;
        let isTaroComponent = false;
        babel_traverse_1.default(ast, {
            ClassDeclaration(astPath) {
                astPath.traverse({
                    ClassMethod(astPath) {
                        if (astPath.get('key').isIdentifier({ name: 'render' })) {
                            astPath.traverse({
                                JSXElement() {
                                    isTaroComponent = true;
                                }
                            });
                        }
                    }
                });
            },
            ClassExpression(astPath) {
                astPath.traverse({
                    ClassMethod(astPath) {
                        if (astPath.get('key').isIdentifier({ name: 'render' })) {
                            astPath.traverse({
                                JSXElement() {
                                    isTaroComponent = true;
                                }
                            });
                        }
                    }
                });
            }
        });
        return {
            isTaroComponent,
            transformResult
        };
    }
    catch (error) {
        return error;
    }
}
exports.isFileToBeTaroComponent = isFileToBeTaroComponent;
class MiniPlugin {
    constructor(options = {}) {
        this.tryAsync = fn => (arg, callback) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield fn(arg);
                callback();
            }
            catch (err) {
                callback(err);
            }
        });
        this.options = lodash_1.defaults(options || {}, {
            buildAdapter: 'weapp',
            nodeModulesPath: '',
            sourceDir: '',
            outputDir: '',
            designWidth: 750,
            isBuildQuickapp: false,
            commonChunks: ['runtime', 'vendors', 'taro', 'common'],
            isBuildPlugin: false,
            alias: {},
            constantsReplaceList: {},
            fileType: {
                style: '.wxss',
                config: '.json',
                script: '.js',
                templ: '.wxml'
            }
        });
        this.sourceDir = this.options.sourceDir;
        this.outputDir = this.options.outputDir;
        this.pages = new Set();
        this.components = new Set();
        this.pageConfigs = new Map();
        this.tabBarIcons = new Set();
        this.quickappStyleFiles = new Set();
        this.isWatch = false;
        this.errors = [];
        this.addedComponents = new Set();
        this.pageComponentsDependenciesMap = new Map();
        this.dependencies = new Map();
        this.quickappImports = new Map();
        this.subPackages = new Set();
        this.parseConstantsList();
    }
    parseConstantsList() {
        const parsedConstantsReplaceList = {};
        Object.keys(this.options.constantsReplaceList).forEach(key => {
            try {
                parsedConstantsReplaceList[key] = JSON.parse(this.options.constantsReplaceList[key]);
            }
            catch (error) {
                parsedConstantsReplaceList[key] = this.options.constantsReplaceList[key];
            }
        });
        this.options.constantsReplaceList = parsedConstantsReplaceList;
    }
    apply(compiler) {
        this.context = compiler.context;
        this.appEntry = this.getAppEntry(compiler);
        let taroLoadChunksPlugin;
        const commonStyles = new Set();
        const { commonChunks, isBuildPlugin, addChunkPages, fileType, isBuildQuickapp } = this.options;
        compiler.hooks.run.tapAsync(PLUGIN_NAME, this.tryAsync((compiler) => __awaiter(this, void 0, void 0, function* () {
            yield this.run(compiler);
            if (taroLoadChunksPlugin)
                taroLoadChunksPlugin.destroy();
            taroLoadChunksPlugin = new TaroLoadChunksPlugin_1.default({
                commonChunks: commonChunks,
                isBuildPlugin: isBuildPlugin,
                addChunkPages: addChunkPages,
                pages: this.pages,
                depsMap: this.pageComponentsDependenciesMap,
                sourceDir: this.sourceDir,
                subPackages: this.subPackages,
                isBuildQuickapp
            });
            taroLoadChunksPlugin.apply(compiler);
        })));
        compiler.hooks.watchRun.tapAsync(PLUGIN_NAME, this.tryAsync((compiler) => __awaiter(this, void 0, void 0, function* () {
            const changedFiles = this.getChangedFiles(compiler);
            if (!changedFiles.length) {
                yield this.run(compiler);
            }
            else {
                yield this.watchRun(compiler, changedFiles);
            }
            if (taroLoadChunksPlugin)
                taroLoadChunksPlugin.destroy();
            taroLoadChunksPlugin = new TaroLoadChunksPlugin_1.default({
                commonChunks: commonChunks,
                isBuildPlugin: isBuildPlugin,
                addChunkPages: addChunkPages,
                pages: this.pages,
                depsMap: this.pageComponentsDependenciesMap,
                sourceDir: this.sourceDir,
                subPackages: this.subPackages,
                isBuildQuickapp
            });
            taroLoadChunksPlugin.apply(compiler);
        })));
        compiler.hooks.make.tapAsync(PLUGIN_NAME, (compilation, callback) => {
            const dependencies = this.dependencies;
            const promises = [];
            dependencies.forEach(dep => {
                promises.push(new Promise((resolve, reject) => {
                    compilation.addEntry(this.sourceDir, dep, dep.name, err => err ? reject(err) : resolve());
                }));
            });
            Promise.all(promises).then(() => callback(), callback);
        });
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
            compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory);
            compilation.dependencyFactories.set(TaroSingleEntryDependency_1.default, normalModuleFactory);
            compilation.hooks.afterOptimizeChunkAssets.tap(PLUGIN_NAME, chunks => {
                chunks.forEach(chunk => {
                    const id = typeof chunk.id === 'string' ? chunk.id : chunk.name;
                    this.options.commonChunks.forEach(commonName => {
                        if (id === commonName) {
                            const _modules = chunk._modules;
                            if (_modules) {
                                for (const mod of _modules) {
                                    if (helper_1.REG_STYLE.test(mod.resource)) {
                                        commonStyles.add(mod.resource);
                                    }
                                }
                            }
                        }
                    });
                });
            });
            compilation.hooks.afterOptimizeAssets.tap(PLUGIN_NAME, (assets) => {
                Object.keys(assets).forEach(assetPath => {
                    const styleExt = fileType.style;
                    if (new RegExp(`${styleExt}.js$`).test(assetPath)) {
                        delete assets[assetPath];
                    }
                    else if (new RegExp(`${styleExt}${styleExt}$`).test(assetPath)) {
                        const assetObj = assets[assetPath];
                        const newAssetPath = assetPath.replace(styleExt, '');
                        assets[newAssetPath] = assetObj;
                        delete assets[assetPath];
                    }
                });
            });
        });
        compiler.hooks.emit.tapAsync(PLUGIN_NAME, this.tryAsync((compilation) => __awaiter(this, void 0, void 0, function* () {
            compilation.errors = compilation.errors.concat(this.errors);
            yield this.generateMiniFiles(compilation, commonStyles);
            this.addedComponents.clear();
        })));
        compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, this.tryAsync((compilation) => __awaiter(this, void 0, void 0, function* () {
            yield this.addTarBarFilesToDependencies(compilation);
        })));
        new TaroNormalModulesPlugin_1.default().apply(compiler);
        new MiniLoaderPlugin_1.default({
            sourceDir: this.sourceDir,
            fileType
        }).apply(compiler);
    }
    getChangedFiles(compiler) {
        const { watchFileSystem } = compiler;
        const watcher = watchFileSystem.watcher || watchFileSystem.wfs.watcher;
        return Object.keys(watcher.mtimes);
    }
    getAppEntry(compiler) {
        const { entry } = compiler.options;
        if (this.options.isBuildPlugin) {
            const entryCopy = Object.assign({}, entry);
            compiler.options.entry = {};
            return entryCopy;
        }
        if (this.options.appEntry) {
            compiler.options.entry = {};
            return this.options.appEntry;
        }
        function getEntryPath(entry) {
            const app = entry['app'];
            if (Array.isArray(app)) {
                return app[0];
            }
            return app;
        }
        const appEntryPath = getEntryPath(entry);
        compiler.options.entry = {};
        return appEntryPath;
    }
    getNpmComponentRealPath(code, component, adapter) {
        let componentRealPath = null;
        let importExportName;
        const isTaroComponentRes = this.judgeFileToBeTaroComponent(code, component.path, adapter);
        if (isTaroComponentRes == null) {
            return null;
        }
        const { isTaroComponent, transformResult } = isTaroComponentRes;
        const isNativePageOrComponent = this.isNativePageOrComponent(this.getTemplatePath(component.path), fs.readFileSync(component.path).toString());
        if (isTaroComponent || isNativePageOrComponent) {
            return component.path;
        }
        const componentName = component.name.split('|')[1] || component.name;
        const { ast } = transformResult;
        babel_traverse_1.default(ast, {
            ExportNamedDeclaration(astPath) {
                const node = astPath.node;
                const specifiers = node.specifiers;
                const source = node.source;
                if (source && source.type === 'StringLiteral') {
                    specifiers.forEach(specifier => {
                        const exported = specifier.exported;
                        if (lodash_1.kebabCase(exported.name) === componentName) {
                            componentRealPath = helper_1.resolveScriptPath(path.resolve(path.dirname(component.path), source.value));
                        }
                    });
                }
                else {
                    specifiers.forEach(specifier => {
                        const exported = specifier.exported;
                        if (lodash_1.kebabCase(exported.name) === componentName) {
                            importExportName = exported.name;
                        }
                    });
                }
            },
            ExportDefaultDeclaration(astPath) {
                const node = astPath.node;
                const declaration = node.declaration;
                if (component.type === 'default') {
                    importExportName = declaration.name;
                }
            },
            CallExpression(astPath) {
                if (astPath.get('callee').isIdentifier({ name: 'require' })) {
                    const arg = astPath.get('arguments')[0];
                    if (t.isStringLiteral(arg.node)) {
                        componentRealPath = helper_1.resolveScriptPath(path.resolve(path.dirname(component.path), arg.node.value));
                    }
                }
            },
            Program: {
                exit(astPath) {
                    astPath.traverse({
                        ImportDeclaration(astPath) {
                            const node = astPath.node;
                            const specifiers = node.specifiers;
                            const source = node.source;
                            if (importExportName) {
                                specifiers.forEach(specifier => {
                                    const local = specifier.local;
                                    if (local.name === importExportName) {
                                        componentRealPath = helper_1.resolveScriptPath(path.resolve(path.dirname(component.path), source.value));
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
        if (componentRealPath) {
            component.path = componentRealPath;
            code = fs.readFileSync(componentRealPath).toString();
            componentRealPath = this.getNpmComponentRealPath(code, component, adapter);
        }
        return componentRealPath;
    }
    transformComponentsPath(filePath, components) {
        const { buildAdapter, alias } = this.options;
        components.forEach(component => {
            try {
                let componentPath = component.path;
                let realComponentPath;
                if (componentPath) {
                    if (helper_1.isNpmPkg(componentPath)) {
                        if (helper_1.isAliasPath(componentPath, alias)) {
                            componentPath = helper_1.replaceAliasPath(filePath, componentPath, alias);
                            realComponentPath = helper_1.resolveScriptPath(path.resolve(filePath, '..', componentPath));
                        }
                        else {
                            realComponentPath = helper_1.npm.resolveNpmSync(componentPath, this.options.nodeModulesPath);
                        }
                    }
                    else {
                        realComponentPath = helper_1.resolveScriptPath(path.resolve(filePath, '..', componentPath));
                    }
                    const code = fs.readFileSync(realComponentPath).toString();
                    const newComponent = Object.assign({}, component, { path: realComponentPath });
                    realComponentPath = this.getNpmComponentRealPath(code, newComponent, buildAdapter);
                    component.path = realComponentPath;
                }
            }
            catch (error) {
                if (error.codeFrame) {
                    this.errors.push(new Error(error.message + '\n' + error.codeFrame));
                }
                else {
                    this.errors.push(error);
                }
            }
        });
    }
    getTabBarFiles(compiler, appConfig) {
        const tabBar = appConfig.tabBar;
        if (tabBar && typeof tabBar === 'object' && !helper_1.isEmptyObject(tabBar)) {
            const list = tabBar['list'] || [];
            list.forEach(item => {
                item['iconPath'] && this.tabBarIcons.add(item['iconPath']);
                item['selectedIconPath'] && this.tabBarIcons.add(item['selectedIconPath']);
            });
            if (tabBar.custom) {
                const customTabBarPath = path.join(this.sourceDir, 'custom-tab-bar');
                const customTabBarComponentPath = helper_1.resolveScriptPath(customTabBarPath);
                if (fs.existsSync(customTabBarComponentPath)) {
                    const customTabBarComponentTemplPath = this.getTemplatePath(customTabBarComponentPath);
                    const isNative = this.isNativePageOrComponent(customTabBarComponentTemplPath, fs.readFileSync(customTabBarComponentPath).toString());
                    if (!this.isWatch) {
                        helper_1.printLog("compile" /* COMPILE */, '自定义 tabBar', this.getShowPath(customTabBarComponentPath));
                    }
                    const componentObj = {
                        name: 'custom-tab-bar/index',
                        path: customTabBarComponentPath,
                        isNative,
                        stylePath: isNative ? this.getStylePath(customTabBarComponentPath) : null,
                        templatePath: isNative ? this.getTemplatePath(customTabBarComponentPath) : null
                    };
                    this.components.add(componentObj);
                    this.getComponents(compiler, new Set([componentObj]), false);
                }
            }
        }
    }
    getSubPackages(appConfig) {
        const subPackages = appConfig.subPackages || appConfig['subpackages'];
        if (subPackages && subPackages.length) {
            subPackages.forEach(item => {
                if (item.pages && item.pages.length) {
                    const root = item.root;
                    this.subPackages.add(root);
                    item.pages.forEach(page => {
                        let pageItem = `${root}/${page}`;
                        pageItem = pageItem.replace(/\/{2,}/g, '/');
                        let hasPageIn = false;
                        this.pages.forEach(({ name }) => {
                            if (name === pageItem) {
                                hasPageIn = true;
                            }
                        });
                        if (!hasPageIn) {
                            const pagePath = helper_1.resolveScriptPath(path.join(this.sourceDir, pageItem));
                            const templatePath = this.getTemplatePath(pagePath);
                            const isNative = this.isNativePageOrComponent(templatePath, fs.readFileSync(pagePath).toString());
                            this.pages.add({
                                name: pageItem,
                                path: pagePath,
                                isNative,
                                stylePath: isNative ? this.getStylePath(pagePath) : null,
                                templatePath: isNative ? this.getTemplatePath(pagePath) : null
                            });
                        }
                    });
                }
            });
        }
    }
    getShowPath(filePath) {
        return filePath.replace(this.context, '').replace(/\\/g, '/').replace(/^\//, '');
    }
    getPages(compiler) {
        const { buildAdapter, constantsReplaceList, nodeModulesPath, alias, isBuildQuickapp } = this.options;
        const appEntry = this.appEntry;
        const code = fs.readFileSync(appEntry).toString();
        try {
            const transformResult = transformer_wx_1.default({
                code,
                sourcePath: appEntry,
                sourceDir: this.sourceDir,
                isTyped: helper_1.REG_TYPESCRIPT.test(appEntry),
                isApp: true,
                adapter: buildAdapter,
                env: constantsReplaceList
            });
            const { configObj, importStyles } = parseAst_1.default(transformResult.ast, appEntry, nodeModulesPath, alias, isBuildQuickapp);
            const appPages = configObj.pages;
            this.appConfig = configObj;
            compiler.appConfig = configObj;
            if (!appPages || appPages.length === 0) {
                throw new Error('缺少页面');
            }
            if (!this.isWatch) {
                helper_1.printLog("compile" /* COMPILE */, '发现入口', this.getShowPath(appEntry));
            }
            this.getSubPackages(configObj);
            this.getTabBarFiles(compiler, configObj);
            taroFileTypeMap[this.appEntry] = {
                type: helper_1.PARSE_AST_TYPE.ENTRY,
                config: configObj,
                code: transformResult.code,
                importStyles
            };
            this.pages = new Set([
                ...this.pages,
                ...appPages.map(item => {
                    const pagePath = helper_1.resolveScriptPath(path.join(this.sourceDir, item));
                    const pageTemplatePath = this.getTemplatePath(pagePath);
                    const isNative = this.isNativePageOrComponent(pageTemplatePath, fs.readFileSync(pagePath).toString());
                    return {
                        name: item,
                        path: pagePath,
                        isNative,
                        stylePath: isNative ? this.getStylePath(pagePath) : null,
                        templatePath: isNative ? this.getTemplatePath(pagePath) : null
                    };
                })
            ]);
        }
        catch (error) {
            if (error.codeFrame) {
                this.errors.push(new Error(error.message + '\n' + error.codeFrame));
            }
            else {
                this.errors.push(error);
            }
        }
    }
    getPluginFiles(compiler) {
        const fileList = new Set();
        const { pluginConfig, buildAdapter } = this.options;
        let normalFiles = new Set();
        Object.keys(this.appEntry).forEach(key => {
            const filePath = this.appEntry[key][0];
            const code = fs.readFileSync(filePath).toString();
            const isTaroComponentRes = this.judgeFileToBeTaroComponent(code, filePath, buildAdapter);
            if (key === this.options.pluginMainEntry) {
                this.addEntry(compiler, filePath, key, helper_1.PARSE_AST_TYPE.EXPORTS);
            }
            if (isTaroComponentRes == null) {
                return null;
            }
            if (isTaroComponentRes.isTaroComponent) {
                if (pluginConfig) {
                    fileList.add({
                        name: key,
                        path: filePath,
                        isNative: false
                    });
                    let isPage = false;
                    let isComponent = false;
                    Object.keys(pluginConfig).forEach(pluginKey => {
                        if (pluginKey === 'pages') {
                            Object.keys(pluginConfig[pluginKey]).forEach(pageKey => {
                                if (`plugin/${pluginConfig[pluginKey][pageKey]}` === key) {
                                    isPage = true;
                                }
                            });
                        }
                        if (pluginKey === 'publicComponents') {
                            Object.keys(pluginConfig[pluginKey]).forEach(pageKey => {
                                if (`plugin/${pluginConfig[pluginKey][pageKey]}` === key) {
                                    isComponent = true;
                                }
                            });
                        }
                    });
                    if (isPage) {
                        this.pages.add({
                            name: key,
                            path: filePath,
                            isNative: false
                        });
                        this.getComponents(compiler, fileList, isPage);
                    }
                    else if (isComponent) {
                        this.components.add({
                            name: key,
                            path: filePath,
                            isNative: false
                        });
                        this.getComponents(compiler, fileList, false);
                    }
                    else {
                        normalFiles.add({
                            name: key,
                            path: filePath,
                            isNative: true
                        });
                    }
                }
            }
        });
        normalFiles.forEach(item => {
            this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.NORMAL);
        });
        this.pages.forEach(item => {
            if (item.isNative) {
                this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.NORMAL);
                if (item.stylePath && fs.existsSync(item.stylePath)) {
                    this.addEntry(compiler, item.stylePath, this.getStylePath(item.name), helper_1.PARSE_AST_TYPE.NORMAL);
                }
                if (item.templatePath && fs.existsSync(item.templatePath)) {
                    this.addEntry(compiler, item.templatePath, this.getTemplatePath(item.name), helper_1.PARSE_AST_TYPE.NORMAL);
                }
            }
            else {
                this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.PAGE);
            }
        });
        this.components.forEach(item => {
            if (item.isNative) {
                this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.NORMAL);
                if (item.stylePath && fs.existsSync(item.stylePath)) {
                    this.addEntry(compiler, item.stylePath, this.getStylePath(item.name), helper_1.PARSE_AST_TYPE.NORMAL);
                }
                if (item.templatePath && fs.existsSync(item.templatePath)) {
                    this.addEntry(compiler, item.templatePath, this.getTemplatePath(item.name), helper_1.PARSE_AST_TYPE.NORMAL);
                }
            }
            else {
                this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.COMPONENT);
            }
        });
    }
    isNativePageOrComponent(templatePath, jsContent) {
        return fs.existsSync(templatePath) && jsContent.indexOf(helper_1.taroJsFramework) < 0;
    }
    getComponentName(componentPath) {
        return this.getRelativePath(componentPath)
            .replace(/\\/g, '/')
            .replace(path.extname(componentPath), '')
            .replace(/^(\/|\\)/, '');
    }
    getComponents(compiler, fileList, isRoot) {
        const { buildAdapter, alias, isBuildQuickapp, fileType, constantsReplaceList, nodeModulesPath } = this.options;
        fileList.forEach(file => {
            try {
                const isNative = file.isNative;
                const isComponentConfig = isRoot ? {} : { component: true };
                let configObj;
                let taroSelfComponents;
                let depComponents;
                let code = fs.readFileSync(file.path).toString();
                let importStyles;
                if (isNative) {
                    const configPath = this.getConfigPath(file.path);
                    if (fs.existsSync(configPath)) {
                        configObj = JSON.parse(fs.readFileSync(configPath).toString());
                        const usingComponents = configObj.usingComponents;
                        depComponents = usingComponents ? Object.keys(usingComponents).map(item => ({
                            name: item,
                            path: usingComponents[item]
                        })) : [];
                    }
                }
                else {
                    if (isBuildQuickapp && isRoot) {
                        const styleName = this.getStylePath(quickappCommonStyle);
                        const taroJsQuickAppStylesPath = path.resolve(this.options.nodeModulesPath, helper_1.taroJsQuickAppComponents, 'src/common/css');
                        const sourceStylePath = path.resolve(taroJsQuickAppStylesPath, styleName);
                        this.quickappStyleFiles.add({
                            path: sourceStylePath,
                            name: styleName
                        });
                    }
                    const transformResult = transformer_wx_1.default({
                        code,
                        sourcePath: file.path,
                        sourceDir: this.sourceDir,
                        isTyped: helper_1.REG_TYPESCRIPT.test(file.path),
                        isRoot,
                        adapter: buildAdapter,
                        env: constantsReplaceList
                    });
                    let parseAstRes = parseAst_1.default(transformResult.ast, file.path, nodeModulesPath, alias, isBuildQuickapp);
                    configObj = parseAstRes.configObj;
                    importStyles = parseAstRes.importStyles;
                    if (isRoot) {
                        const showPath = file.path.replace(this.sourceDir, '').replace(path.extname(file.path), '');
                        this.pageConfigs.set(showPath, configObj);
                    }
                    taroSelfComponents = parseAstRes.taroSelfComponents;
                    const usingComponents = configObj.usingComponents;
                    if (usingComponents) {
                        Object.keys(usingComponents).forEach(item => {
                            transformResult.components.push({
                                name: item,
                                path: usingComponents[item]
                            });
                        });
                    }
                    if (isRoot) {
                        taroSelfComponents.add('taro-page');
                    }
                    depComponents = transformResult.components;
                    code = transformResult.code;
                }
                depComponents = depComponents.filter(item => !/^(plugin|dynamicLib|plugin-private):\/\//.test(item.path));
                this.transformComponentsPath(file.path, depComponents);
                if (isBuildQuickapp) {
                    const scriptPath = file.path;
                    const outputScriptPath = scriptPath.replace(this.sourceDir, this.outputDir).replace(path.extname(scriptPath), fileType.script);
                    const importTaroSelfComponents = helper_2.getImportTaroSelfComponents(outputScriptPath, this.options.nodeModulesPath, this.outputDir, taroSelfComponents);
                    const importCustomComponents = helper_2.getImportCustomComponents(file.path, depComponents);
                    const usingComponents = configObj.usingComponents;
                    let importUsingComponent = new Set([]);
                    if (usingComponents) {
                        importUsingComponent = new Set(Object.keys(usingComponents).map(item => {
                            return {
                                name: item,
                                path: usingComponents[item]
                            };
                        }));
                    }
                    this.quickappImports.set(scriptPath, new Set([...importTaroSelfComponents, ...importUsingComponent, ...importCustomComponents]));
                }
                if (!this.isWatch) {
                    helper_1.printLog("compile" /* COMPILE */, isRoot ? '发现页面' : '发现组件', this.getShowPath(file.path));
                }
                taroFileTypeMap[file.path] = {
                    type: isRoot ? helper_1.PARSE_AST_TYPE.PAGE : helper_1.PARSE_AST_TYPE.COMPONENT,
                    config: lodash_1.merge({}, isComponentConfig, utils_1.buildUsingComponents(file.path, this.sourceDir, alias, depComponents), configObj),
                    code,
                    importStyles
                };
                if (isBuildQuickapp && taroSelfComponents) {
                    taroFileTypeMap[file.path].taroSelfComponents = new Set(Array.from(taroSelfComponents).map(item => {
                        const taroJsQuickAppComponentsPath = helper_2.getTaroJsQuickAppComponentsPath(this.options.nodeModulesPath);
                        const componentPath = path.join(taroJsQuickAppComponentsPath, item, `index${fileType.templ}`);
                        return {
                            name: item,
                            path: componentPath
                        };
                    }));
                }
                if (depComponents && depComponents.length) {
                    const componentsList = new Set();
                    depComponents.forEach(item => {
                        const componentPath = helper_1.resolveScriptPath(path.resolve(path.dirname(file.path), item.path));
                        if (fs.existsSync(componentPath) && !Array.from(this.components).some(item => item.path === componentPath)) {
                            const componentName = this.getComponentName(componentPath);
                            const componentTempPath = this.getTemplatePath(componentPath);
                            const isNative = this.isNativePageOrComponent(componentTempPath, fs.readFileSync(componentPath).toString());
                            const componentObj = {
                                name: componentName,
                                path: componentPath,
                                isNative,
                                stylePath: isNative ? this.getStylePath(componentPath) : null,
                                templatePath: isNative ? this.getTemplatePath(componentPath) : null
                            };
                            this.components.add(componentObj);
                            this.addedComponents.add(componentObj);
                            componentsList.add(componentObj);
                            this.pageComponentsDependenciesMap.set(file.path, componentsList);
                            this.getComponents(compiler, new Set([componentObj]), false);
                        }
                    });
                }
            }
            catch (error) {
                if (error.codeFrame) {
                    this.errors.push(new Error(error.message + '\n' + error.codeFrame));
                }
                else {
                    this.errors.push(error);
                }
            }
        });
    }
    addEntry(compiler, entryPath, entryName, entryType) {
        let dep;
        if (this.dependencies.has(entryPath)) {
            dep = this.dependencies.get(entryPath);
            dep.name = entryName;
            dep.loc = { name: entryName };
            dep.entryPath = entryPath;
            dep.entryType = entryType;
        }
        else {
            dep = new TaroSingleEntryDependency_1.default(entryPath, entryName, { name: entryName }, entryType);
        }
        this.dependencies.set(entryPath, dep);
    }
    addEntries(compiler) {
        this.addEntry(compiler, this.appEntry, 'app', helper_1.PARSE_AST_TYPE.ENTRY);
        this.pages.forEach(item => {
            if (item.isNative) {
                this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.NORMAL);
                if (item.stylePath && fs.existsSync(item.stylePath)) {
                    this.addEntry(compiler, item.stylePath, this.getStylePath(item.name), helper_1.PARSE_AST_TYPE.NORMAL);
                }
                if (item.templatePath && fs.existsSync(item.templatePath)) {
                    this.addEntry(compiler, item.templatePath, this.getTemplatePath(item.name), helper_1.PARSE_AST_TYPE.NORMAL);
                }
            }
            else {
                this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.PAGE);
            }
        });
        this.components.forEach(item => {
            if (item.isNative) {
                this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.NORMAL);
                if (item.stylePath && fs.existsSync(item.stylePath)) {
                    this.addEntry(compiler, item.stylePath, this.getStylePath(item.name), helper_1.PARSE_AST_TYPE.NORMAL);
                }
                if (item.templatePath && fs.existsSync(item.templatePath)) {
                    this.addEntry(compiler, item.templatePath, this.getTemplatePath(item.name), helper_1.PARSE_AST_TYPE.NORMAL);
                }
            }
            else {
                this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.COMPONENT);
            }
        });
    }
    generateMiniFiles(compilation, commonStyles) {
        return __awaiter(this, void 0, void 0, function* () {
            const { isBuildQuickapp, fileType, buildAdapter, commonChunks, modifyBuildTempFileContent, modifyBuildAssets } = this.options;
            if (typeof modifyBuildTempFileContent === 'function') {
                yield modifyBuildTempFileContent(taroFileTypeMap);
            }
            Object.keys(taroFileTypeMap).forEach(item => {
                const relativePath = this.getRelativePath(item);
                const extname = path.extname(item);
                let jsonPath = relativePath.replace(extname, fileType.config).replace(/\\/g, '/').replace(/^\//, '');
                const scriptPath = relativePath.replace(extname, fileType.script).replace(/\\/g, '/').replace(/^\//, '');
                const templatePath = relativePath.replace(extname, fileType.templ).replace(/\\/g, '/').replace(/^\//, '');
                const stylePath = relativePath.replace(extname, fileType.style).replace(/\\/g, '/').replace(/^\//, '');
                const itemInfo = taroFileTypeMap[item];
                if (itemInfo.type === helper_1.PARSE_AST_TYPE.ENTRY) {
                    jsonPath = relativePath.replace(RegExp(`(.${buildAdapter})?${extname}$`), fileType.config).replace(/\\/g, '/').replace(/^\//, '');
                }
                if (!isBuildQuickapp) {
                    const jsonStr = JSON.stringify(itemInfo.config);
                    compilation.assets[jsonPath] = {
                        size: () => jsonStr.length,
                        source: () => jsonStr
                    };
                }
                else {
                    let hitScriptItem;
                    let template = compilation.assets[templatePath];
                    template = helper_2.generateQuickAppUx({
                        template: template ? (template._source ? template._source.source() : template._value) : '',
                        imports: this.quickappImports.get(item)
                    });
                    template = template ? template_rewriter_1.default(template) : template;
                    Object.keys(compilation.assets).forEach(item => {
                        if (stylePath.indexOf(item) >= 0) {
                            const relativeStylePath = helper_1.promoteRelativePath(path.relative(scriptPath, stylePath));
                            template = `<style src='${relativeStylePath}'></style>\n` + template;
                        }
                        if (scriptPath.indexOf(item) >= 0) {
                            const assetItem = compilation.assets[item];
                            let scriptContent = assetItem._source ? assetItem._source.source() : assetItem._value;
                            scriptContent = `let exportRes;\n${scriptContent}\nexport default exportRes;`;
                            hitScriptItem = item;
                            template += `\n<script>${scriptContent}</script>`;
                        }
                    });
                    if (hitScriptItem) {
                        delete compilation.assets[hitScriptItem];
                    }
                    compilation.assets[templatePath] = {
                        size: () => template.length,
                        source: () => template
                    };
                }
                if (itemInfo.taroSelfComponents) {
                    itemInfo.taroSelfComponents.forEach(item => {
                        if (fs.existsSync(item.path)) {
                            const content = fs.readFileSync(item.path).toString();
                            const relativePath = this.getRelativePath(item.path).replace(/\\/g, '/');
                            compilation.assets[relativePath] = {
                                size: () => content.length,
                                source: () => content
                            };
                        }
                    });
                }
                // 处理公共样式引入
                // 2.1.1 开始只有引用到公共样式的组件或页面文件里会引入 common 公共样式
                const importStyles = itemInfo.importStyles;
                let needAddCommon = false;
                if (importStyles && importStyles.size && commonStyles.size) {
                    commonStyles.forEach(val => {
                        if (importStyles.has(val)) {
                            needAddCommon = true;
                        }
                    });
                }
                const assets = compilation.assets;
                const asset = assets[stylePath];
                if (needAddCommon) {
                    const source = new webpack_sources_1.ConcatSource();
                    Object.keys(assets).forEach(assetName => {
                        const fileName = path.basename(assetName, path.extname(assetName));
                        if (helper_1.REG_STYLE.test(assetName) && commonChunks.includes(fileName)) {
                            source.add(`@import ${JSON.stringify(loader_utils_1.urlToRequest(helper_1.promoteRelativePath(path.relative(stylePath, assetName))))};`);
                            source.add('\n');
                        }
                    });
                    if (asset) {
                        const _source = asset._source || asset._value;
                        source.add(_source);
                    }
                    assets[stylePath] = {
                        size: () => source.source().length,
                        source: () => source.source()
                    };
                }
                else {
                    if (asset) {
                        const value = asset._source ? asset._source.source() : asset._value;
                        if (value) {
                            let commonStylePath;
                            Object.keys(assets).forEach(assetName => {
                                const fileName = path.basename(assetName, path.extname(assetName));
                                if (helper_1.REG_STYLE.test(assetName) && commonChunks.includes(fileName)) {
                                    commonStylePath = helper_1.promoteRelativePath(path.relative(stylePath, assetName));
                                }
                            });
                            const newValue = value.split('\n').map(item => {
                                if (commonStylePath && item.indexOf(commonStylePath) >= 0) {
                                    return;
                                }
                                return item;
                            }).filter(item => item).join('\n');
                            assets[stylePath] = {
                                size: () => newValue.length,
                                source: () => newValue
                            };
                        }
                    }
                }
            });
            if (isBuildQuickapp) {
                const quickappJSON = helper_2.generateQuickAppManifest({
                    sourceDir: this.sourceDir,
                    taroFileTypeMap,
                    designWidth: this.options.designWidth,
                    quickappJSON: this.options.quickappJSON
                });
                const quickappJSONStr = JSON.stringify(quickappJSON).replace(/\\\\/g, '/');
                compilation.assets['./manifest.json'] = {
                    size: () => quickappJSONStr.length,
                    source: () => quickappJSONStr
                };
            }
            this.tabBarIcons.forEach(icon => {
                const iconPath = path.resolve(this.sourceDir, icon);
                if (fs.existsSync(iconPath)) {
                    const iconStat = fs.statSync(iconPath);
                    const iconSource = fs.readFileSync(iconPath);
                    compilation.assets[icon] = {
                        size: () => iconStat.size,
                        source: () => iconSource
                    };
                }
            });
            this.quickappStyleFiles.forEach(item => {
                if (fs.existsSync(item.path)) {
                    const styleContent = fs.readFileSync(item.path).toString();
                    const relativePath = this.getRelativePath(item.path).replace(/\\/g, '/');
                    compilation.assets[relativePath] = {
                        size: () => styleContent.length,
                        source: () => styleContent
                    };
                }
            });
            if (typeof modifyBuildAssets === 'function') {
                yield modifyBuildAssets(compilation.assets);
            }
        });
    }
    getRelativePath(filePath) {
        let relativePath;
        if (helper_1.NODE_MODULES_REG.test(filePath)) {
            relativePath = filePath.replace(this.options.nodeModulesPath, 'npm');
        }
        else {
            relativePath = filePath.replace(this.sourceDir, '');
        }
        return relativePath;
    }
    addTarBarFilesToDependencies(compilation) {
        const { fileDependencies } = compilation;
        this.tabBarIcons.forEach(icon => {
            if (!fileDependencies.has(icon)) {
                fileDependencies.add(icon);
            }
        });
    }
    judgeFileToBeTaroComponent(code, sourcePath, buildAdapter) {
        const { constantsReplaceList } = this.options;
        const isTaroComponentRes = isFileToBeTaroComponent(code, sourcePath, buildAdapter, constantsReplaceList);
        if (isTaroComponentRes instanceof Error) {
            if (isTaroComponentRes.codeFrame) {
                this.errors.push(isTaroComponentRes);
            }
            else {
                this.errors.push(isTaroComponentRes);
            }
            return null;
        }
        return isTaroComponentRes;
    }
    run(compiler) {
        this.errors = [];
        this.pages = new Set();
        this.components = new Set();
        this.pageConfigs = new Map();
        this.tabBarIcons = new Set();
        this.quickappStyleFiles = new Set();
        this.addedComponents = new Set();
        if (!this.options.isBuildPlugin) {
            this.getPages(compiler);
            this.getComponents(compiler, this.pages, true);
            this.addEntries(compiler);
        }
        else {
            this.getPluginFiles(compiler);
        }
    }
    watchRun(compiler, changedFiles) {
        const changedFile = changedFiles[0];
        this.isWatch = true;
        if (helper_1.REG_SCRIPTS.test(changedFile)) {
            this.changedFile = changedFile;
            let { type, obj } = this.getChangedFileInfo(changedFile);
            this.errors = [];
            if (!type) {
                const code = fs.readFileSync(changedFile).toString();
                const isTaroComponentRes = this.judgeFileToBeTaroComponent(code, changedFile, this.options.buildAdapter);
                if (isTaroComponentRes == null) {
                    return;
                }
                if (isTaroComponentRes.isTaroComponent) {
                    const isNative = this.isNativePageOrComponent(this.getTemplatePath(changedFile), code);
                    type = helper_1.PARSE_AST_TYPE.COMPONENT;
                    obj = {
                        name: changedFile.replace(this.sourceDir, '').replace(path.extname(changedFile), ''),
                        path: changedFile,
                        isNative,
                        stylePath: isNative ? this.getStylePath(changedFile) : null,
                        templatePath: isNative ? this.getTemplatePath(changedFile) : null
                    };
                }
            }
            this.changedFileType = type;
            if (this.changedFileType === helper_1.PARSE_AST_TYPE.ENTRY
                || this.changedFileType === helper_1.PARSE_AST_TYPE.PAGE
                || this.changedFileType === helper_1.PARSE_AST_TYPE.COMPONENT) {
                this.components.forEach(component => {
                    if (component.path === changedFile) {
                        this.components.delete(component);
                    }
                });
                if (this.changedFileType === helper_1.PARSE_AST_TYPE.ENTRY) {
                    this.run(compiler);
                }
                else {
                    if (!this.options.isBuildPlugin) {
                        this.getComponents(compiler, new Set([obj]), this.changedFileType === helper_1.PARSE_AST_TYPE.PAGE);
                        if (this.addedComponents.size) {
                            this.addedComponents.forEach(item => {
                                if (item.isNative) {
                                    this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.NORMAL);
                                    if (item.stylePath && fs.existsSync(item.stylePath)) {
                                        this.addEntry(compiler, item.stylePath, this.getStylePath(item.name), helper_1.PARSE_AST_TYPE.NORMAL);
                                    }
                                    if (item.templatePath && fs.existsSync(item.templatePath)) {
                                        this.addEntry(compiler, item.templatePath, this.getTemplatePath(item.name), helper_1.PARSE_AST_TYPE.NORMAL);
                                    }
                                }
                                else {
                                    this.addEntry(compiler, item.path, item.name, helper_1.PARSE_AST_TYPE.COMPONENT);
                                }
                            });
                        }
                    }
                    else {
                        this.getPluginFiles(compiler);
                    }
                }
                if (obj && type === helper_1.PARSE_AST_TYPE.COMPONENT
                    && !Array.from(this.components).some(item => item.path === obj.path)) {
                    this.components.add(obj);
                }
            }
        }
    }
    getChangedFileInfo(filePath) {
        let type;
        let obj;
        this.pages.forEach(page => {
            if (page.path === filePath) {
                type = helper_1.PARSE_AST_TYPE.PAGE;
                obj = page;
            }
        });
        this.components.forEach(component => {
            if (component.path === filePath) {
                type = helper_1.PARSE_AST_TYPE.COMPONENT;
                obj = component;
            }
        });
        if (filePath === this.appEntry) {
            type = helper_1.PARSE_AST_TYPE.ENTRY;
        }
        return {
            type,
            obj
        };
    }
    getTargetFilePath(filePath, targetExtname) {
        const extname = path.extname(filePath);
        if (extname) {
            return filePath.replace(extname, targetExtname);
        }
        return filePath + targetExtname;
    }
    getTemplatePath(filePath) {
        return this.getTargetFilePath(filePath, this.options.fileType.templ);
    }
    getConfigPath(filePath) {
        return this.getTargetFilePath(filePath, this.options.fileType.config);
    }
    getStylePath(filePath) {
        return this.getTargetFilePath(filePath, this.options.fileType.style);
    }
    static getTaroFileTypeMap() {
        return taroFileTypeMap;
    }
    static init() {
        taroFileTypeMap = {};
    }
}
exports.default = MiniPlugin;

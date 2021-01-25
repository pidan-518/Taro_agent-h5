"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostcssPlugins = void 0;
const path = require("path");
const autoprefixer = require("autoprefixer");
const pxtransform = require("postcss-pxtransform");
const url = require("postcss-url");
const resolve_1 = require("resolve");
const helper_1 = require("@tarojs/helper");
const browser_list_1 = require("../config/browser_list");
const defaultAutoprefixerOption = {
    enable: true,
    config: {
        overrideBrowserslist: browser_list_1.default,
        flexbox: 'no-2009'
    }
};
const defaultPxtransformOption = {
    enable: true,
    config: {
        platform: process.env.TARO_ENV
    }
};
const defaultUrlOption = {
    enable: true,
    config: {
        limit: 1000,
        url: 'inline'
    }
};
const optionsWithDefaults = ['autoprefixer', 'pxtransform', 'cssModules', 'url'];
const plugins = [];
exports.getPostcssPlugins = function (appPath, { isBuildQuickapp = false, designWidth, deviceRatio, postcssOption = {} }) {
    if (designWidth) {
        defaultPxtransformOption.config.designWidth = designWidth;
    }
    if (deviceRatio) {
        defaultPxtransformOption.config.deviceRatio = deviceRatio;
    }
    const autoprefixerOption = helper_1.recursiveMerge({}, defaultAutoprefixerOption, postcssOption.autoprefixer);
    const pxtransformOption = helper_1.recursiveMerge({}, defaultPxtransformOption, postcssOption.pxtransform);
    const urlOption = helper_1.recursiveMerge({}, defaultUrlOption, postcssOption.url);
    if (autoprefixerOption.enable) {
        plugins.push(autoprefixer(autoprefixerOption.config));
    }
    if (pxtransformOption.enable && !isBuildQuickapp) {
        plugins.push(pxtransform(pxtransformOption.config));
    }
    if (urlOption.enable) {
        plugins.push(url(urlOption.config));
    }
    plugins.unshift(require('postcss-import'));
    Object.entries(postcssOption).forEach(([pluginName, pluginOption]) => {
        if (optionsWithDefaults.indexOf(pluginName) > -1)
            return;
        if (!pluginOption || !pluginOption.enable)
            return;
        if (!helper_1.isNpmPkg(pluginName)) { // local plugin
            pluginName = path.join(appPath, pluginName);
        }
        try {
            const pluginPath = resolve_1.sync(pluginName, { basedir: appPath });
            plugins.push(require(pluginPath)(pluginOption.config || {}));
        }
        catch (e) {
            const msg = e.code === 'MODULE_NOT_FOUND' ? `缺少postcss插件${pluginName}, 已忽略` : e;
            console.log(msg);
        }
    });
    return plugins;
};

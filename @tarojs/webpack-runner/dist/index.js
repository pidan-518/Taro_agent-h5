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
const detectPort = require("detect-port");
const opn = require("opn");
const path = require("path");
const url_1 = require("url");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const build_conf_1 = require("./config/build.conf");
const dev_conf_1 = require("./config/dev.conf");
const devServer_conf_1 = require("./config/devServer.conf");
const prod_conf_1 = require("./config/prod.conf");
const util_1 = require("./util");
const logHelper_1 = require("./util/logHelper");
const chain_1 = require("./util/chain");
const stripTrailingSlash = (path) => path.charAt(path.length - 1) === '/' ? path.slice(0, -1) : path;
const stripLeadingSlash = (path) => path.charAt(0) === '/' ? path.substr(1) : path;
const addHtmlExtname = (str) => {
    return /\.html\b/.test(str)
        ? str
        : `${str}.html`;
};
const customizeChain = (chain, modifyWebpackChainFunc, customizeFunc) => __awaiter(void 0, void 0, void 0, function* () {
    if (modifyWebpackChainFunc instanceof Function) {
        yield modifyWebpackChainFunc(chain, webpack);
    }
    if (customizeFunc instanceof Function) {
        customizeFunc(chain, webpack);
    }
});
const buildProd = (appPath, config) => __awaiter(void 0, void 0, void 0, function* () {
    const webpackChain = prod_conf_1.default(appPath, config);
    yield customizeChain(webpackChain, config.modifyWebpackChain, config.webpackChain);
    const webpackConfig = webpackChain.toConfig();
    const compiler = webpack(webpackConfig);
    const onBuildFinish = config.onBuildFinish;
    compiler.hooks.emit.tapAsync('taroBuildDone', (compilation, callback) => __awaiter(void 0, void 0, void 0, function* () {
        if (typeof config.modifyBuildAssets === 'function') {
            yield config.modifyBuildAssets(compilation.assets);
        }
        callback();
    }));
    return new Promise((resolve, reject) => {
        logHelper_1.bindProdLogger(compiler);
        compiler.run((err, stats) => {
            if (err) {
                logHelper_1.printBuildError(err);
                if (typeof onBuildFinish === 'function') {
                    onBuildFinish({
                        error: err,
                        stats: null,
                        isWatch: false
                    });
                }
                return reject(err);
            }
            if (typeof onBuildFinish === 'function') {
                onBuildFinish({
                    error: err,
                    stats,
                    isWatch: false
                });
            }
            resolve();
        });
    });
});
const buildDev = (appPath, config) => __awaiter(void 0, void 0, void 0, function* () {
    const conf = build_conf_1.default(config);
    const routerConfig = config.router || {};
    const routerMode = routerConfig.mode || 'hash';
    const routerBasename = routerConfig.basename || '/';
    const publicPath = conf.publicPath ? util_1.addLeadingSlash(util_1.addTrailingSlash(conf.publicPath)) : '/';
    const outputPath = path.join(appPath, conf.outputRoot);
    const customDevServerOption = config.devServer || {};
    const webpackChain = dev_conf_1.default(appPath, config);
    const homePage = config.homePage || [];
    const onBuildFinish = config.onBuildFinish;
    yield customizeChain(webpackChain, config.modifyWebpackChain, config.webpackChain);
    const devServerOptions = util_1.recursiveMerge({
        publicPath,
        contentBase: outputPath,
        historyApiFallback: {
            rewrites: [{
                    from: /./,
                    to: publicPath
                }]
        }
    }, devServer_conf_1.default, customDevServerOption);
    const originalPort = devServerOptions.port;
    const availablePort = yield detectPort(originalPort);
    if (availablePort !== originalPort) {
        console.log();
        console.log(`预览端口 ${originalPort} 被占用, 自动切换到空闲端口 ${availablePort}`);
        devServerOptions.port = availablePort;
    }
    let pathname;
    if (routerMode === 'multi') {
        pathname = `${stripTrailingSlash(routerBasename)}/${addHtmlExtname(stripLeadingSlash(homePage[1] || ''))}`;
    }
    else if (routerMode === 'browser') {
        pathname = routerBasename;
    }
    else {
        pathname = '/';
    }
    const devUrl = url_1.format({
        protocol: devServerOptions.https ? 'https' : 'http',
        hostname: devServerOptions.host,
        port: devServerOptions.port,
        pathname
    });
    const webpackConfig = webpackChain.toConfig();
    WebpackDevServer.addDevServerEntrypoints(webpackConfig, devServerOptions);
    const compiler = webpack(webpackConfig);
    logHelper_1.bindDevLogger(devUrl, compiler);
    const server = new WebpackDevServer(compiler, devServerOptions);
    compiler.hooks.emit.tapAsync('taroBuildDone', (compilation, callback) => __awaiter(void 0, void 0, void 0, function* () {
        if (typeof config.modifyBuildAssets === 'function') {
            yield config.modifyBuildAssets(compilation.assets);
        }
        callback();
    }));
    compiler.hooks.done.tap('taroBuildDone', stats => {
        if (typeof onBuildFinish === 'function') {
            onBuildFinish({
                error: null,
                stats,
                isWatch: true
            });
        }
    });
    compiler.hooks.failed.tap('taroBuildDone', error => {
        if (typeof onBuildFinish === 'function') {
            onBuildFinish({
                error,
                stats: null,
                isWatch: true
            });
        }
    });
    return new Promise((resolve, reject) => {
        server.listen(devServerOptions.port, devServerOptions.host, err => {
            if (err) {
                reject();
                return console.log(err);
            }
            resolve();
            /* 补充处理devServer.open配置 */
            if (devServerOptions.open) {
                const openUrl = url_1.format({
                    protocol: devServerOptions.https ? 'https' : 'http',
                    hostname: util_1.formatOpenHost(devServerOptions.host),
                    port: devServerOptions.port,
                    pathname
                });
                opn(openUrl);
            }
        });
    });
});
exports.default = (appPath, config) => __awaiter(void 0, void 0, void 0, function* () {
    const newConfig = yield chain_1.makeConfig(config);
    if (newConfig.isWatch) {
        try {
            yield buildDev(appPath, newConfig);
        }
        catch (e) {
            console.error(e);
        }
    }
    else {
        try {
            yield buildProd(appPath, newConfig);
        }
        catch (e) {
            console.error(e);
            process.exit(1);
        }
    }
});

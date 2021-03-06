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
exports.getModuleDefaultExport = exports.addPlatforms = exports.extnameExpRegOf = exports.readDirWithFileTypes = exports.getAllFilesInFloder = exports.getBabelConfig = exports.unzip = exports.applyArrayedVisitors = exports.mergeVisitors = exports.recursiveMerge = exports.getInstalledNpmPkgVersion = exports.getInstalledNpmPkgPath = exports.pascalCase = exports.emptyDirectory = exports.cssImports = exports.generateConstantsList = exports.generateEnvList = exports.resolveScriptPath = exports.isEmptyObject = exports.shouldUseCnpm = exports.shouldUseYarn = exports.getSystemUsername = exports.getConfig = exports.getTaroPath = exports.getUserHomeDir = exports.recursiveFindNodeModules = exports.printLog = exports.resolveStylePath = exports.promoteRelativePath = exports.replaceAliasPath = exports.isAliasPath = exports.isQuickAppPkg = exports.isNpmPkg = exports.isNodeModule = exports.normalizePath = void 0;
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const stream_1 = require("stream");
const child_process = require("child_process");
const chalk = require("chalk");
const findWorkspaceRoot = require("find-yarn-workspace-root");
const lodash_1 = require("lodash");
const yauzl = require("yauzl");
const constants_1 = require("./constants");
const babel_1 = require("./babel");
const execSync = child_process.execSync;
function normalizePath(path) {
    return path.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
}
exports.normalizePath = normalizePath;
exports.isNodeModule = (filename) => constants_1.NODE_MODULES_REG.test(filename);
function isNpmPkg(name) {
    if (/^(\.|\/)/.test(name)) {
        return false;
    }
    return true;
}
exports.isNpmPkg = isNpmPkg;
function isQuickAppPkg(name) {
    return /^@(system|service)\.[a-zA-Z]{1,}/.test(name);
}
exports.isQuickAppPkg = isQuickAppPkg;
function isAliasPath(name, pathAlias = {}) {
    const prefixs = Object.keys(pathAlias);
    if (prefixs.length === 0) {
        return false;
    }
    return prefixs.includes(name) || (new RegExp(`^(${prefixs.join('|')})/`).test(name));
}
exports.isAliasPath = isAliasPath;
function replaceAliasPath(filePath, name, pathAlias = {}) {
    // 后续的 path.join 在遇到符号链接时将会解析为真实路径，如果
    // 这里的 filePath 没有做同样的处理，可能会导致 import 指向
    // 源代码文件，导致文件被意外修改
    filePath = fs.realpathSync(filePath);
    const prefixs = Object.keys(pathAlias);
    if (prefixs.includes(name)) {
        return promoteRelativePath(path.relative(filePath, fs.realpathSync(resolveScriptPath(pathAlias[name]))));
    }
    const reg = new RegExp(`^(${prefixs.join('|')})/(.*)`);
    name = name.replace(reg, function (m, $1, $2) {
        return promoteRelativePath(path.relative(filePath, path.join(pathAlias[$1], $2)));
    });
    return name;
}
exports.replaceAliasPath = replaceAliasPath;
function promoteRelativePath(fPath) {
    const fPathArr = fPath.split(path.sep);
    let dotCount = 0;
    fPathArr.forEach(item => {
        if (item.indexOf('..') >= 0) {
            dotCount++;
        }
    });
    if (dotCount === 1) {
        fPathArr.splice(0, 1, '.');
        return fPathArr.join('/');
    }
    if (dotCount > 1) {
        fPathArr.splice(0, 1);
        return fPathArr.join('/');
    }
    return normalizePath(fPath);
}
exports.promoteRelativePath = promoteRelativePath;
function resolveStylePath(p) {
    const realPath = p;
    const removeExtPath = p.replace(path.extname(p), '');
    const taroEnv = process.env.TARO_ENV;
    for (let i = 0; i < constants_1.CSS_EXT.length; i++) {
        const item = constants_1.CSS_EXT[i];
        if (taroEnv) {
            if (fs.existsSync(`${removeExtPath}.${taroEnv}${item}`)) {
                return `${removeExtPath}.${taroEnv}${item}`;
            }
        }
        if (fs.existsSync(`${p}${item}`)) {
            return `${p}${item}`;
        }
    }
    return realPath;
}
exports.resolveStylePath = resolveStylePath;
function printLog(type, tag, filePath) {
    const typeShow = constants_1.processTypeMap[type];
    const tagLen = tag.replace(/[\u0391-\uFFE5]/g, 'aa').length;
    const tagFormatLen = 8;
    if (tagLen < tagFormatLen) {
        const rightPadding = new Array(tagFormatLen - tagLen + 1).join(' ');
        tag += rightPadding;
    }
    const padding = '';
    filePath = filePath || '';
    if (typeof typeShow.color === 'string') {
        console.log(chalk[typeShow.color](typeShow.name), padding, tag, padding, filePath);
    }
    else {
        console.log(typeShow.color(typeShow.name), padding, tag, padding, filePath);
    }
}
exports.printLog = printLog;
function recursiveFindNodeModules(filePath, lastFindPath) {
    if (lastFindPath && (normalizePath(filePath) === normalizePath(lastFindPath))) {
        return filePath;
    }
    const dirname = path.dirname(filePath);
    const workspaceRoot = findWorkspaceRoot(dirname);
    const nodeModules = path.join(workspaceRoot || dirname, 'node_modules');
    if (fs.existsSync(nodeModules)) {
        return nodeModules;
    }
    if (dirname.split(path.sep).length <= 1) {
        printLog("error" /* ERROR */, `在${dirname}目录下`, `未找到node_modules文件夹，请先安装相关依赖库！`);
        return nodeModules;
    }
    return recursiveFindNodeModules(dirname, filePath);
}
exports.recursiveFindNodeModules = recursiveFindNodeModules;
function getUserHomeDir() {
    function homedir() {
        const env = process.env;
        const home = env.HOME;
        const user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;
        if (process.platform === 'win32') {
            return env.USERPROFILE || '' + env.HOMEDRIVE + env.HOMEPATH || home || '';
        }
        if (process.platform === 'darwin') {
            return home || (user ? '/Users/' + user : '');
        }
        if (process.platform === 'linux') {
            return home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : ''));
        }
        return home || '';
    }
    return typeof os.homedir === 'function' ? os.homedir() : homedir();
}
exports.getUserHomeDir = getUserHomeDir;
function getTaroPath() {
    const taroPath = path.join(getUserHomeDir(), constants_1.TARO_CONFIG_FLODER);
    if (!fs.existsSync(taroPath)) {
        fs.ensureDirSync(taroPath);
    }
    return taroPath;
}
exports.getTaroPath = getTaroPath;
function getConfig() {
    const configPath = path.join(getTaroPath(), 'config.json');
    if (fs.existsSync(configPath)) {
        return require(configPath);
    }
    return {};
}
exports.getConfig = getConfig;
function getSystemUsername() {
    const userHome = getUserHomeDir();
    const systemUsername = process.env.USER || path.basename(userHome);
    return systemUsername;
}
exports.getSystemUsername = getSystemUsername;
function shouldUseYarn() {
    try {
        execSync('yarn --version', { stdio: 'ignore' });
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.shouldUseYarn = shouldUseYarn;
function shouldUseCnpm() {
    try {
        execSync('cnpm --version', { stdio: 'ignore' });
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.shouldUseCnpm = shouldUseCnpm;
function isEmptyObject(obj) {
    if (obj == null) {
        return true;
    }
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}
exports.isEmptyObject = isEmptyObject;
function resolveScriptPath(p) {
    const realPath = p;
    const taroEnv = process.env.TARO_ENV;
    const SCRIPT_EXT = constants_1.JS_EXT.concat(constants_1.TS_EXT);
    for (let i = 0; i < SCRIPT_EXT.length; i++) {
        const item = SCRIPT_EXT[i];
        if (taroEnv) {
            if (fs.existsSync(`${p}.${taroEnv}${item}`)) {
                return `${p}.${taroEnv}${item}`;
            }
            if (fs.existsSync(`${p}${path.sep}index.${taroEnv}${item}`)) {
                return `${p}${path.sep}index.${taroEnv}${item}`;
            }
            if (fs.existsSync(`${p.replace(/\/index$/, `.${taroEnv}/index`)}${item}`)) {
                return `${p.replace(/\/index$/, `.${taroEnv}/index`)}${item}`;
            }
        }
        if (fs.existsSync(`${p}${item}`)) {
            return `${p}${item}`;
        }
        if (fs.existsSync(`${p}${path.sep}index${item}`)) {
            return `${p}${path.sep}index${item}`;
        }
    }
    return realPath;
}
exports.resolveScriptPath = resolveScriptPath;
function generateEnvList(env) {
    const res = {};
    if (env && !isEmptyObject(env)) {
        for (const key in env) {
            try {
                res[`process.env.${key}`] = JSON.parse(env[key]);
            }
            catch (err) {
                res[`process.env.${key}`] = env[key];
            }
        }
    }
    return res;
}
exports.generateEnvList = generateEnvList;
function generateConstantsList(constants) {
    const res = {};
    if (constants && !isEmptyObject(constants)) {
        for (const key in constants) {
            if (lodash_1.isPlainObject(constants[key])) {
                res[key] = generateConstantsList(constants[key]);
            }
            else {
                try {
                    res[key] = JSON.parse(constants[key]);
                }
                catch (err) {
                    res[key] = constants[key];
                }
            }
        }
    }
    return res;
}
exports.generateConstantsList = generateConstantsList;
function cssImports(content) {
    let match;
    const results = [];
    content = String(content).replace(/\/\*.+?\*\/|\/\/.*(?=[\n\r])/g, '');
    while ((match = constants_1.CSS_IMPORT_REG.exec(content))) {
        results.push(match[2]);
    }
    return results;
}
exports.cssImports = cssImports;
/*eslint-disable*/
const retries = (process.platform === 'win32') ? 100 : 1;
function emptyDirectory(dirPath, opts = { excludes: [] }) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                let removed = false;
                let i = 0; // retry counter
                do {
                    try {
                        if (!opts.excludes.length || !opts.excludes.some(item => curPath.indexOf(item) >= 0)) {
                            emptyDirectory(curPath);
                            fs.rmdirSync(curPath);
                        }
                        removed = true;
                    }
                    catch (e) {
                    }
                    finally {
                        if (++i < retries) {
                            continue;
                        }
                    }
                } while (!removed);
            }
            else {
                fs.unlinkSync(curPath);
            }
        });
    }
}
exports.emptyDirectory = emptyDirectory;
/* eslint-enable */
exports.pascalCase = (str) => str.charAt(0).toUpperCase() + lodash_1.camelCase(str.substr(1));
function getInstalledNpmPkgPath(pkgName, basedir) {
    const resolvePath = require('resolve');
    try {
        return resolvePath.sync(`${pkgName}/package.json`, { basedir });
    }
    catch (err) {
        return null;
    }
}
exports.getInstalledNpmPkgPath = getInstalledNpmPkgPath;
function getInstalledNpmPkgVersion(pkgName, basedir) {
    const pkgPath = getInstalledNpmPkgPath(pkgName, basedir);
    if (!pkgPath) {
        return null;
    }
    return fs.readJSONSync(pkgPath).version;
}
exports.getInstalledNpmPkgVersion = getInstalledNpmPkgVersion;
exports.recursiveMerge = (src, ...args) => {
    return lodash_1.mergeWith(src, ...args, (value, srcValue, key, obj, source) => {
        const typeValue = typeof value;
        const typeSrcValue = typeof srcValue;
        if (typeValue !== typeSrcValue)
            return;
        if (Array.isArray(value) && Array.isArray(srcValue)) {
            return value.concat(srcValue);
        }
        if (typeValue === 'object') {
            return exports.recursiveMerge(value, srcValue);
        }
    });
};
exports.mergeVisitors = (src, ...args) => {
    const validFuncs = ['exit', 'enter'];
    return lodash_1.mergeWith(src, ...args, (value, srcValue, key, object, srcObject) => {
        if (!object.hasOwnProperty(key) || !srcObject.hasOwnProperty(key)) {
            return undefined;
        }
        const shouldMergeToArray = validFuncs.indexOf(key) > -1;
        if (shouldMergeToArray) {
            return lodash_1.flatMap([value, srcValue]);
        }
        const [newValue, newSrcValue] = [value, srcValue].map(v => {
            if (typeof v === 'function') {
                return {
                    enter: v
                };
            }
            else {
                return v;
            }
        });
        return exports.mergeVisitors(newValue, newSrcValue);
    });
};
exports.applyArrayedVisitors = obj => {
    let key;
    for (key in obj) {
        const funcs = obj[key];
        if (Array.isArray(funcs)) {
            obj[key] = (astPath, ...args) => {
                funcs.forEach(func => {
                    func(astPath, ...args);
                });
            };
        }
        else if (typeof funcs === 'object') {
            exports.applyArrayedVisitors(funcs);
        }
    }
    return obj;
};
function unzip(zipPath) {
    return new Promise((resolve, reject) => {
        yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
            if (err)
                throw err;
            zipfile.on('close', () => {
                fs.removeSync(zipPath);
                resolve();
            });
            zipfile.readEntry();
            zipfile.on('error', (err) => {
                reject(err);
            });
            zipfile.on('entry', entry => {
                if (/\/$/.test(entry.fileName)) {
                    const fileNameArr = entry.fileName.replace(/\\/g, '/').split('/');
                    fileNameArr.shift();
                    const fileName = fileNameArr.join('/');
                    fs.ensureDirSync(path.join(path.dirname(zipPath), fileName));
                    zipfile.readEntry();
                }
                else {
                    zipfile.openReadStream(entry, (err, readStream) => {
                        if (err)
                            throw err;
                        const filter = new stream_1.Transform();
                        filter._transform = function (chunk, encoding, cb) {
                            cb(undefined, chunk);
                        };
                        filter._flush = function (cb) {
                            cb();
                            zipfile.readEntry();
                        };
                        const fileNameArr = normalizePath(entry.fileName).split('/');
                        fileNameArr.shift();
                        const fileName = fileNameArr.join('/');
                        const writeStream = fs.createWriteStream(path.join(path.dirname(zipPath), fileName));
                        writeStream.on('close', () => { });
                        readStream
                            .pipe(filter)
                            .pipe(writeStream);
                    });
                }
            });
        });
    });
}
exports.unzip = unzip;
let babelConfig;
function getBabelConfig(babel) {
    if (!babelConfig) {
        babelConfig = lodash_1.mergeWith({}, babel_1.default, babel, (objValue, srcValue) => {
            if (Array.isArray(objValue)) {
                return Array.from(new Set(srcValue.concat(objValue)));
            }
        });
    }
    return babelConfig;
}
exports.getBabelConfig = getBabelConfig;
exports.getAllFilesInFloder = (floder, filter = []) => __awaiter(void 0, void 0, void 0, function* () {
    let files = [];
    const list = readDirWithFileTypes(floder);
    yield Promise.all(list.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const itemPath = path.join(floder, item.name);
        if (item.isDirectory) {
            const _files = yield exports.getAllFilesInFloder(itemPath, filter);
            files = [...files, ..._files];
        }
        else if (item.isFile) {
            if (!filter.find(rule => rule === item.name))
                files.push(itemPath);
        }
    })));
    return files;
});
function readDirWithFileTypes(floder) {
    const list = fs.readdirSync(floder);
    const res = list.map(name => {
        const stat = fs.statSync(path.join(floder, name));
        return {
            name,
            isDirectory: stat.isDirectory(),
            isFile: stat.isFile()
        };
    });
    return res;
}
exports.readDirWithFileTypes = readDirWithFileTypes;
function extnameExpRegOf(filePath) {
    return new RegExp(`${path.extname(filePath)}$`);
}
exports.extnameExpRegOf = extnameExpRegOf;
function addPlatforms(platform) {
    const upperPlatform = platform.toLocaleUpperCase();
    if (constants_1.PLATFORMS[upperPlatform])
        return;
    constants_1.PLATFORMS[upperPlatform] = platform;
}
exports.addPlatforms = addPlatforms;
exports.getModuleDefaultExport = exports => exports.__esModule ? exports.default : exports;

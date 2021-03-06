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
exports.getSassLoaderOption = exports.getBundleContent = exports.getBundleResult = void 0;
const scss_bundle_1 = require("scss-bundle");
/**
 * Return bundled sass content.
 *
 * @param {string} url Absolute file path.
 * @param {(string | undefined)} projectDirectory Absolute project location, where node_modules are located.
 * Used for resolving tilde imports.
 * @returns Bundle result.
 */
function getBundleResult(url, projectDirectory = undefined) {
    return __awaiter(this, void 0, void 0, function* () {
        let bundler = new scss_bundle_1.Bundler();
        if (projectDirectory) {
            bundler = new scss_bundle_1.Bundler(undefined, projectDirectory);
        }
        const res = yield bundler.bundle(url);
        return res;
    });
}
exports.getBundleResult = getBundleResult;
/**
 * Return bundled sass content, but input resource can be a single string or an array.
 * @param {(string | string[])} resource Input file path or a path array.
 * @param {(string | undefined)} projectDirectory Absolute project location, where node_modules are located.
 * Used for resolving tilde imports.
 * @returns Bundle result.
 */
function getBundleContent(resource, projectDirectory = undefined) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = '';
        try {
            if (typeof resource === 'string') {
                const res = yield getBundleResult(resource, projectDirectory);
                result = res.bundledContent;
            }
            if (Array.isArray(resource)) {
                for (const url of resource) {
                    const res = yield getBundleResult(url, projectDirectory);
                    result += res.bundledContent || '';
                }
            }
        }
        catch (error) {
            throw new Error(error);
        }
        return result;
    });
}
exports.getBundleContent = getBundleContent;
/**
 * Return the merged sass loader option.
 * @param {BuildConfig} param0 Build config.
 * @returns Merged sass loader option.
 */
function getSassLoaderOption({ sass, sassLoaderOption }) {
    return __awaiter(this, void 0, void 0, function* () {
        sassLoaderOption = sassLoaderOption || {};
        let bundledContent = '';
        if (!sass) {
            return sassLoaderOption;
        }
        const { resource, projectDirectory } = sass;
        if (resource) {
            const content = yield getBundleContent(resource, projectDirectory);
            bundledContent += content;
        }
        if (sass.data) {
            bundledContent += sass.data;
        }
        return Object.assign(Object.assign({}, sassLoaderOption), { prependData: sassLoaderOption.prependData ? `${sassLoaderOption.prependData}${bundledContent}` : bundledContent });
    });
}
exports.getSassLoaderOption = getSassLoaderOption;
exports.default = getSassLoaderOption;

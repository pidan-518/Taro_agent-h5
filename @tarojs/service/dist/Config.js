"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const lodash_1 = require("lodash");
const helper_1 = require("@tarojs/helper");
const constants_1 = require("./utils/constants");
class Config {
    constructor(opts) {
        this.appPath = opts.appPath;
        this.init();
    }
    init() {
        this.configPath = helper_1.resolveScriptPath(path.join(this.appPath, constants_1.CONFIG_DIR_NAME, constants_1.DEFAULT_CONFIG_FILE));
        if (!fs.existsSync(this.configPath)) {
            this.initialConfig = {};
            this.isInitSuccess = false;
        }
        else {
            helper_1.createBabelRegister({
                only: [
                    filePath => filePath.indexOf(path.join(this.appPath, constants_1.CONFIG_DIR_NAME)) >= 0
                ]
            });
            try {
                this.initialConfig = helper_1.getModuleDefaultExport(require(this.configPath))(lodash_1.merge);
                this.isInitSuccess = true;
            }
            catch (err) {
                this.initialConfig = {};
                this.isInitSuccess = false;
                console.log(err);
            }
        }
    }
    getConfigWithNamed(platform, useConfigName) {
        const initialConfig = this.initialConfig;
        const sourceDirName = initialConfig.sourceRoot || helper_1.SOURCE_DIR;
        const outputDirName = initialConfig.outputRoot || helper_1.OUTPUT_DIR;
        const sourceDir = path.join(this.appPath, sourceDirName);
        const entryName = helper_1.ENTRY;
        const entryFilePath = helper_1.resolveScriptPath(path.join(sourceDir, entryName));
        const entry = {
            [entryName]: [entryFilePath]
        };
        return Object.assign({ entry, alias: initialConfig.alias || {}, copy: initialConfig.copy, sourceRoot: sourceDirName, outputRoot: outputDirName, platform, babel: helper_1.getBabelConfig(initialConfig.babel), csso: initialConfig.csso, sass: initialConfig.sass, uglify: initialConfig.uglify, plugins: initialConfig.plugins, projectName: initialConfig.projectName, env: initialConfig.env, defineConstants: initialConfig.defineConstants, designWidth: initialConfig.designWidth, deviceRatio: initialConfig.deviceRatio }, initialConfig[useConfigName]);
    }
}
exports.default = Config;

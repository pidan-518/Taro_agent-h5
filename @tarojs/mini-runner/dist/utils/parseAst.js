"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const t = require("babel-types");
const babel_traverse_1 = require("babel-traverse");
const babel_core_1 = require("babel-core");
const helper_1 = require("@tarojs/helper");
const constants_1 = require("./constants");
const utils_1 = require("../utils");
const _ = require("lodash");
function parseAst(ast, sourceFilePath, nodeModulesPath, alias, isBuildquickapp) {
    let configObj = {};
    let hasEnablePageScroll;
    const taroSelfComponents = new Set();
    const importStyles = new Set();
    let componentClassName = '';
    const newAst = babel_core_1.transformFromAst(ast, '', {
        plugins: [
            [require('babel-plugin-preval')]
        ]
    }).ast;
    babel_traverse_1.default(newAst, {
        ClassDeclaration(astPath) {
            const node = astPath.node;
            let hasCreateData = false;
            if (node.superClass) {
                astPath.traverse({
                    ClassMethod(astPath) {
                        if (astPath.get('key').isIdentifier({ name: '_createData' })) {
                            hasCreateData = true;
                        }
                    }
                });
                if (hasCreateData) {
                    astPath.traverse({
                        ClassMethod(astPath) {
                            const node = astPath.node;
                            if (node.kind === 'constructor') {
                                astPath.traverse({
                                    ExpressionStatement(astPath) {
                                        const node = astPath.node;
                                        if (node.expression &&
                                            node.expression.type === 'AssignmentExpression' &&
                                            node.expression.operator === '=') {
                                            const left = node.expression.left;
                                            if (left.type === 'MemberExpression' &&
                                                left.object.type === 'ThisExpression' &&
                                                left.property.type === 'Identifier' &&
                                                left.property.name === 'config') {
                                                configObj = utils_1.traverseObjectNode(node.expression.right);
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    });
                    if (node.id === null) {
                        componentClassName = '_TaroComponentClass';
                    }
                    else if (node.id.name === 'App') {
                        componentClassName = '_App';
                    }
                    else {
                        componentClassName = node.id.name;
                    }
                }
            }
        },
        ClassExpression(astPath) {
            const node = astPath.node;
            if (node.superClass) {
                let hasCreateData = false;
                astPath.traverse({
                    ClassMethod(astPath) {
                        if (astPath.get('key').isIdentifier({ name: '_createData' })) {
                            hasCreateData = true;
                        }
                    }
                });
                if (hasCreateData) {
                    if (node.id === null) {
                        const parentNode = astPath.parentPath.node;
                        if (t.isVariableDeclarator(astPath.parentPath)) {
                            componentClassName = parentNode.id.name;
                        }
                        else {
                            componentClassName = '_TaroComponentClass';
                        }
                    }
                    else if (node.id.name === 'App') {
                        componentClassName = '_App';
                    }
                    else {
                        componentClassName = node.id.name;
                    }
                }
            }
        },
        ClassMethod(astPath) {
            const keyName = astPath.get('key').node.name;
            if (keyName === 'onPageScroll' || keyName === 'onReachBottom') {
                hasEnablePageScroll = true;
            }
        },
        ClassProperty(astPath) {
            const node = astPath.node;
            const keyName = node.key.name;
            if (keyName === 'config') {
                configObj = utils_1.traverseObjectNode(node);
            }
        },
        ImportDeclaration(astPath) {
            const node = astPath.node;
            const source = node.source;
            let value = source.value;
            const specifiers = node.specifiers;
            if (helper_1.REG_STYLE.test(value)) {
                importStyles.add(getAbsPath({
                    rPath: value,
                    source: sourceFilePath,
                    nodeModulesPath,
                    alias
                }));
            }
            if (helper_1.isNpmPkg(value) && isBuildquickapp && value === helper_1.taroJsComponents) {
                specifiers.forEach(specifier => {
                    const name = specifier.local.name;
                    if (!constants_1.QUICKAPP_SPECIAL_COMPONENTS.has(name)) {
                        taroSelfComponents.add(_.kebabCase(name));
                    }
                });
                astPath.remove();
            }
        },
        CallExpression(astPath) {
            const node = astPath.node;
            const callee = node.callee;
            if (callee.name === 'require') {
                const args = node.arguments;
                let value = args[0].value;
                const parentNode = astPath.parentPath.parentPath.node;
                if (helper_1.REG_STYLE.test(value)) {
                    importStyles.add(getAbsPath({
                        rPath: value,
                        source: sourceFilePath,
                        nodeModulesPath,
                        alias
                    }));
                }
                if (helper_1.isNpmPkg(value) && isBuildquickapp && value === helper_1.taroJsComponents) {
                    if (parentNode.declarations.length === 1 && parentNode.declarations[0].init) {
                        const id = parentNode.declarations[0].id;
                        if (id.type === 'ObjectPattern') {
                            const properties = id.properties;
                            properties.forEach(p => {
                                if (p.type === 'ObjectProperty' && p.value.type === 'Identifier') {
                                    taroSelfComponents.add(_.kebabCase(p.value.name));
                                }
                            });
                        }
                    }
                    astPath.remove();
                }
            }
        },
        AssignmentExpression(astPath) {
            const node = astPath.node;
            const left = node.left;
            if (t.isMemberExpression(left) && t.isIdentifier(left.object)) {
                // 当 App 的 config 为静态属性(static prop)时,
                // componentClassName(_App) 与 left.object.name(App)
                // 不匹配, 造成获取不到 config 对象的问题
                if ((left.object.name === componentClassName || left.object.name === 'App')
                    && t.isIdentifier(left.property)
                    && left.property.name === 'config') {
                    configObj = utils_1.traverseObjectNode(node.right);
                }
            }
        }
    });
    return {
        configObj,
        importStyles,
        hasEnablePageScroll,
        taroSelfComponents
    };
}
exports.default = parseAst;
function getAbsPath({ rPath, source, alias, nodeModulesPath }) {
    if (helper_1.isAliasPath(rPath, alias)) {
        rPath = helper_1.replaceAliasPath(source, rPath, alias);
    }
    if (helper_1.isNpmPkg(rPath)) {
        return helper_1.npm.resolveNpmSync(rPath, nodeModulesPath) || '';
    }
    return path.resolve(source, '..', rPath);
}

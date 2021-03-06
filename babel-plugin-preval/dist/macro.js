'use strict';

// const printAST = require('ast-pretty-print')
var _require = require('babel-macros'),
    createMacro = _require.createMacro;

var getReplacement = require('./get-replacement');

module.exports = createMacro(prevalMacros);

function prevalMacros(_ref) {
  var references = _ref.references,
      state = _ref.state,
      babel = _ref.babel;

  references.default.forEach(function (referencePath) {
    if (referencePath.parentPath.type === 'TaggedTemplateExpression') {
      asTag(referencePath.parentPath.get('quasi'), state, babel);
    } else if (referencePath.parentPath.type === 'CallExpression') {
      asFunction(referencePath.parentPath.get('arguments'), state, babel);
    } else if (referencePath.parentPath.type === 'JSXOpeningElement') {
      asJSX({
        attributes: referencePath.parentPath.get('attributes'),
        children: referencePath.parentPath.parentPath.get('children')
      }, state, babel);
    } else if (!(referencePath.parentPath.type === 'JSXClosingElement')) {
      throw new Error(`babel-plugin-preval/macro can only be used as tagged template expression, function call or JSX element. You tried ${referencePath.parentPath.type}.`);
    }
  });
}

function asTag(quasiPath, _ref2, babel) {
  var filename = _ref2.file.opts.filename;

  var string = quasiPath.parentPath.get('quasi').evaluate().value;
  quasiPath.parentPath.replaceWith(getReplacement({
    string,
    filename,
    babel
  }));
}

function asFunction(argumentsPaths, _ref3, babel) {
  var filename = _ref3.file.opts.filename;

  var string = argumentsPaths[0].evaluate().value;
  argumentsPaths[0].parentPath.replaceWith(getReplacement({
    string,
    filename,
    babel
  }));
}

// eslint-disable-next-line no-unused-vars
function asJSX(_ref4, _ref5, babel) {
  var attributes = _ref4.attributes,
      children = _ref4.children;
  var filename = _ref5.file.opts.filename;

  // It's a shame you cannot use evaluate() with JSX
  var string = children[0].node.value;
  children[0].replaceWith(getReplacement({
    string,
    filename,
    babel
  }));
  var _children$0$parentPat = children[0].parentPath.node,
      openingElement = _children$0$parentPat.openingElement,
      closingElement = _children$0$parentPat.closingElement;

  openingElement.name.name = 'div';
  closingElement.name.name = 'div';
}
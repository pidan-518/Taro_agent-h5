"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const style_rewriter_1 = require("../quickapp/style-rewriter");
function quickappStyleLoader(source) {
    return style_rewriter_1.default(source);
}
exports.default = quickappStyleLoader;

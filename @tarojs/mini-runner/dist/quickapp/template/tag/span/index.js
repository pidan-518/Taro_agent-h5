"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    name(node) {
        if (node.parent && node.parent.name === 'div') {
            return 'text';
        }
        return node.name;
    }
};

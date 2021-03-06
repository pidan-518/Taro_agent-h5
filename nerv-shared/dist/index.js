const EMPTY_CHILDREN = [];
const EMPTY_OBJ = {};
function isNullOrUndef(o) {
    return o === undefined || o === null;
}
function isInvalid(o) {
    return isNullOrUndef(o) || o === true || o === false;
}
function isVNode(node) {
    return !isNullOrUndef(node) && node.vtype === 2 /* Node */;
}
function isVText(node) {
    return !isNullOrUndef(node) && node.vtype === 1 /* Text */;
}
function isComponent(instance) {
    return !isInvalid(instance) && instance.isReactComponent === EMPTY_OBJ;
}
function isWidget(node) {
    return (!isNullOrUndef(node) &&
        (node.vtype & (4 /* Composite */)) > 0);
}
function isPortal(vtype, node) {
    return (vtype & 32 /* Portal */) > 0;
}
function isComposite(node) {
    return !isNullOrUndef(node) && node.vtype === 4 /* Composite */;
}
function isValidElement(node) {
    return !isNullOrUndef(node) && node.vtype;
}
function isHook(arg) {
    return !isNullOrUndef(arg) && typeof arg.vhook === 'number';
}
// tslint:disable-next-line:no-empty
function noop() { }
// typescript will compile the enum's value for us.
// eg.
// Composite = 1 << 2  => Composite = 4
var VType;
(function (VType) {
    VType[VType["Text"] = 1] = "Text";
    VType[VType["Node"] = 2] = "Node";
    VType[VType["Composite"] = 4] = "Composite";
    VType[VType["Void"] = 16] = "Void";
    VType[VType["Portal"] = 32] = "Portal";
})(VType || (VType = {}));

export { EMPTY_CHILDREN, EMPTY_OBJ, isNullOrUndef, isInvalid, isVNode, isVText, isComponent, isWidget, isPortal, isComposite, isValidElement, isHook, noop, VType };
//# sourceMappingURL=index.js.map

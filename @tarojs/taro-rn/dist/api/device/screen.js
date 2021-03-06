var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as Brightness from 'expo-brightness';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { errorHandler, shouleBeObject, successHandler } from '../utils';
/**
 * 设置屏幕亮度
 * @param opts
 * @param {number} opts.value - 屏幕亮度值，范围 0 ~ 1。0 最暗，1 最亮
 */
export function setScreenBrightness(opts = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = { errMsg: 'setScreenBrightness:ok' };
        const isObject = shouleBeObject(opts);
        if (!isObject.res) {
            res = { errMsg: `setScreenBrightness${isObject.msg}` };
            console.error(res.errMsg);
            return Promise.reject(res);
        }
        const { value, success, fail, complete } = opts;
        try {
            yield Brightness.setBrightnessAsync(value);
            return successHandler(success, complete)(res);
        }
        catch (e) {
            res.errMsg = `setScreenBrightness:fail invalid ${e}`;
            return errorHandler(fail, complete)(res);
        }
    });
}
/**
 * 获取屏幕亮度
 * @param opts
 */
export function getScreenBrightness(opts = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = { errMsg: 'getScreenBrightness:ok' };
        const isObject = shouleBeObject(opts);
        if (!isObject.res) {
            res = { errMsg: `getScreenBrightness${isObject.msg}` };
            console.error(res.errMsg);
            return Promise.reject(res);
        }
        const { success, fail, complete } = opts;
        try {
            res.num = yield Brightness.getBrightnessAsync();
            return successHandler(success, complete)(res);
        }
        catch (e) {
            res.errMsg = `getScreenBrightness:fail invalid ${e}`;
            return errorHandler(fail, complete)(res);
        }
    });
}
/**
 * keepScreenOn
 * @param {{}} opts
 * @param {boolean} opts.keepScreenOn - 是否保持屏幕常亮
 */
export function setKeepScreenOn(opts = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = { errMsg: 'setKeepScreenOn:ok' };
        const { keepScreenOn, success, fail, complete } = opts;
        try {
            if (keepScreenOn) {
                activateKeepAwake();
            }
            else {
                deactivateKeepAwake();
            }
            return successHandler(success, complete)(res);
        }
        catch (e) {
            res.errMsg = `setKeepScreenOn:fail invalid ${e}`;
            return errorHandler(fail, complete)(res);
        }
    });
}
/**
 * @todo
 * 监听用户主动截屏事件。用户使用系统截屏按键截屏时触发
 */
export function onUserCaptureScreen(callback) {
    console.log('onUserCaptureScreen has not finished');
}

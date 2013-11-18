// straw-android.js

var straw = (function (window) {
    'use strict';

    var NATIVE_TO_JS_INTERFACE_NAME = 'NATIVE_TO_JS_INTERFACE';
    var JS_TO_NATIVE_INTERFACE_NAME = 'JS_TO_NATIVE_INTERFACE';


    var NATIVE_TO_JS_INTERFACE = window[NATIVE_TO_JS_INTERFACE_NAME] = {};

    NATIVE_TO_JS_INTERFACE.exec = function (callbackId, success, args, keepAlive) {
        straw.nativeCallback(callbackId, success, args, keepAlive);
    };


    /**
     * CallbackPair class - success and fail callbacks
     */
    var CallbackPair = function (successCallback, failCallback) {
        if (!successCallback && !failCallback) {
            this.id = null;
            this.success = null;
            this.fail = null;
        } else {
            this.id = (CallbackPair.currentId++).toString();
            this.success = successCallback;
            this.fail = failCallback;
        }
    };

    CallbackPair.currentId = Math.floor(Math.random() * 10000000);

    var callbackPairPt = CallbackPair.prototype;

    callbackPairPt.call = function (isSuccess, args) {
        if (isSuccess && typeof this.success === 'function') {
            this.success.call(null, args);
        } else if (!isSuccess && typeof this.fail === 'function') {
            this.fail.call(null, args);
        }
    };


    /**
     * Straw callback interface manager
     */
    var Straw = function () {
        this.table = {};
    };

    var strawPt = Straw.prototype;

    strawPt.exec = function (plugin, action, args, successCallback, errorCallback) {
        var callback = new CallbackPair(successCallback, errorCallback);

        this.storeCallback(callback);

        window[JS_TO_NATIVE_INTERFACE_NAME].exec(plugin, action, JSON.stringify(args), callback.id);
    };

    strawPt.storeCallback = function (callback) {
        if (callback == null || callback.id == null) {
            return;
        }

        this.table[callback.id] = callback;
    };

    strawPt.retrieveCallback = function (id, keepAlive) {
        var callback = this.table[id];

        if (!keepAlive) {
            delete this.table[id];
        }

        return callback;
    };

    strawPt.nativeCallback = function (callbackId, isSuccess, args, keepAlive) {

        // retrieve callback object from callback storage
        var callback = this.retrieveCallback(callbackId, keepAlive);

        // skip if callback is not registered
        if (callback != null) {

            callback.call(isSuccess, args);
        }
    };

    var exports = new Straw();

    // expose native2js / js2native interfaces for hackers
    exports.NATIVE_TO_JS_INTERFACE = NATIVE_TO_JS_INTERFACE;
    exports.JS_TO_NATIVE_INTERFACE = window.JS_TO_NATIVE_INTERFACE;

    return exports;

}(window));

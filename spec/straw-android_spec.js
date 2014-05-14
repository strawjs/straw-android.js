

/* hint of globals for jshint */
/* global describe, it, expect, sinon, straw */

describe('straw', function () {
    'use strict';

    it('exists', function () {
        expect(window.straw).not.toEqual(null);
    });

    it('is a object', function () {
        expect(typeof window.straw === 'object').toBe(true);
    });

    it('has methods', function () {
        expect(typeof straw.exec === 'function').toBe(true);
        expect(typeof straw.storeCallback === 'function').toBe(true);
        expect(typeof straw.retrieveCallback === 'function').toBe(true);
        expect(typeof straw.nativeCallback === 'function').toBe(true);
    });

    describe('exec', function () {

        it('calls exec of JS_TO_NATIVE_CALLBACK\'s exec and stores a callback with id', function () {
            var a = function () {};
            var b = function () {};

            sinon.spy(straw, 'storeCallback');

            var nativeApi = window.JS_TO_NATIVE_INTERFACE = {exec: function () {}};
            sinon.spy(nativeApi, 'exec');

            straw.exec('fooPlugin', 'barAction', {value: 1}, a, b);

            expect(straw.storeCallback.calledOnce).toBe(true);

            var storedCallback = straw.storeCallback.getCall(0).args[0];
            expect(storedCallback).not.toEqual(null);
            expect(storedCallback.success).toBe(a);
            expect(storedCallback.fail).toBe(b);

            var callbackId = storedCallback.id;
            expect(callbackId).not.toEqual(null);

            expect(nativeApi.exec.calledOnce).toBe(true);
            var nativeCall = nativeApi.exec.getCall(0);

            expect(nativeCall.args[0]).toEqual('fooPlugin');
            expect(nativeCall.args[1]).toEqual('barAction');
            expect(nativeCall.args[2]).toEqual('{"value":1}');
            expect(nativeCall.args[3]).toEqual(callbackId);

            expect(straw.retrieveCallback(callbackId)).toBe(storedCallback);

            nativeApi.exec.restore();
            straw.storeCallback.restore();
        });

        it('doesn\'t store callback when both success and fail callbacks are not specified', function () {
            var length = straw.table.length;

            straw.exec('fooPlugin', 'barAction', {value: 1});

            expect(straw.table.length).toBe(length);
        });
    });

    describe('nativeCallback', function () {

        it('fire success callback when succeeded', function () {
            var success = sinon.spy();
            var fail = sinon.spy();

            sinon.spy(straw, 'storeCallback');

            straw.exec('foo', 'bar', {a: 1}, success, fail);

            var callbackId = straw.storeCallback.getCall(0).args[0].id;

            var callbackArgs = {abc: 123};

            straw.nativeCallback(callbackId, true, callbackArgs, false);

            expect(success.calledOnce).toBe(true);
            expect(success.getCall(0).args[0]).toBe(callbackArgs);

            expect(fail.called).toBe(false);

            straw.storeCallback.restore();
        });

        it('fire fail callback when failed', function () {
            var success = sinon.spy();
            var fail = sinon.spy();

            sinon.spy(straw, 'storeCallback');

            straw.exec('foo', 'bar', {a: 1}, success, fail);

            var callbackId = straw.storeCallback.getCall(0).args[0].id;

            var callbackArgs = {abc: 123};

            straw.nativeCallback(callbackId, false, callbackArgs, false);

            expect(success.called).toBe(false);

            expect(fail.calledOnce).toBe(true);
            expect(fail.getCall(0).args[0]).toBe(callbackArgs);

            straw.storeCallback.restore();
        });

        it('cannot fire callbacks again if keepAlive == false', function () {
            var success = sinon.spy();
            var fail = sinon.spy();

            sinon.spy(straw, 'storeCallback');

            straw.exec('foo', 'bar', {a: 1}, success, fail);

            var callbackId = straw.storeCallback.getCall(0).args[0].id;

            straw.nativeCallback(callbackId, true, {}, false);

            expect(success.calledOnce).toBe(true);

            straw.nativeCallback(callbackId, true, {}, false);

            expect(success.calledOnce).toBe(true);

            straw.storeCallback.restore();
        });

        it('can fire callbacks again if keepAlive == true', function () {
            var success = sinon.spy();
            var fail = sinon.spy();

            sinon.spy(straw, 'storeCallback');

            straw.exec('foo', 'bar', {a: 1}, success, fail);

            var callbackId = straw.storeCallback.getCall(0).args[0].id;

            straw.nativeCallback(callbackId, true, {}, true);

            expect(success.calledOnce).toBe(true);

            straw.nativeCallback(callbackId, true, {}, false);

            expect(success.calledTwice).toBe(true);

            straw.storeCallback.restore();
        });

        it('does nothing if callbackId is irrelevant', function () {
            straw.nativeCallback('irrelevant-id', true, {}, true);
        });
    });

    describe('storeCallback', function () {

        it('stores callaback', function () {
            var callback = {id: 'a-1'};
            straw.storeCallback(callback);

            expect(straw.retrieveCallback('a-1')).toBe(callback);
        });

        it('does nothing when callback is null', function () {
            var length = Object.keys(straw.table).length;

            straw.storeCallback(null);

            expect(Object.keys(straw.table).length).toBe(length);
        });

        it('does nothing when callback.id is null', function () {
            var length = Object.keys(straw.table).length;

            straw.storeCallback({id: null});

            expect(Object.keys(straw.table).length).toBe(length);
        });
    });
});

describe('NATIVE_TO_JS_INTERFACE', function () {
    'use strict';

    describe('exec', function () {

        it('calls straw.nativeCallback with same arguments', function () {
            sinon.spy(straw, 'nativeCallback');

            var args = {};

            window.NATIVE_TO_JS_INTERFACE.exec('abc', true, args, false);

            expect(straw.nativeCallback.calledOnce).toBe(true);
            expect(straw.nativeCallback.getCall(0).args[0]).toBe('abc');
            expect(straw.nativeCallback.getCall(0).args[1]).toBe(true);
            expect(straw.nativeCallback.getCall(0).args[2]).toBe(args);
            expect(straw.nativeCallback.getCall(0).args[3]).toBe(false);

            straw.nativeCallback.restore();
        });

    });

});

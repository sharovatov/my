/*globals describe,it,expect,myWorker,SharedWorker*/

describe("Browser SharedWorker support", function () {
    "use strict";

    it("browser should have a shared worker object defined", function () {
        expect(SharedWorker).toBeDefined();
    });

    it("should have a port property defined", function () {
        var myWorker = new SharedWorker("stub.js");
        expect(myWorker.port).toBeDefined();
    });

    it("should have addEventListener, port.start and postMessage defined", function () {
        var myWorker = new SharedWorker("stub.js");
        expect(myWorker.addEventListener).toBeDefined();
        expect(myWorker.port.start).toBeDefined();
        expect(myWorker.port.postMessage).toBeDefined();
    });

});

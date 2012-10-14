//this is a worker, it accepts the connections and manages them

/*globals self*/

function isFunction(func) {
    "use strict";
    return Object.prototype.toString.call(func) === '[object Function]';
}
function isArray(arr) {
    "use strict";
    return Object.prototype.toString.call(arr) === '[object Array]';
}

//simple forEach (in case any library can be used, it should be replaced with a corresponding library call
function forEach(arr, func) {
    "use strict";

    //make sure an array is passed as a first argument
    if (!isArray(arr)) {
        throw new TypeError("forEach allows only arrays");
    }

    //make sure a function is passed as a second argument
    if (!isFunction(func)) {
        throw new TypeError("forEach allows only functions to be callbacks");
    }

    var i, l = arr.length;

    for (i = 0; i < l; i = i + 1) {
        func(arr[i]);
    }

}

//simple partial application method
function partial(fn) {
    "use strict";

    //take all the initial arguments (without the function)
    var cl = Array.prototype.slice.call,
        initialArguments = cl(arguments, 1);

    //return a function that returns a function with all the arguments (except for the func)
    //aggregated into one array and applied as an arguments object
    return function() {
        return fn.apply(null, initialArguments.concat(cl(arguments)));
    };
}


//closured var to store connections number
var connections = 0;

//used to store peers
var peers = [];

//var broadcast = partial(forEach, peers);




self.onconnect = function (e) {

    "use strict";

    //get the first port
    var port = e.ports[0];

    //push it to the peers list
    peers.push(port);

    //increase the number of connections
    connections = connections + 1;

    //set the handler
    port.onmessage = function (e) {
        var msg = "<b>worker</b>: you sent [" + e.data + "], connections=[" + connections + "]";
        forEach(peers, function (peer) {
            var prefix = peer === port ? "Me: " : "Others: ";
            peer.postMessage(prefix + ": " + msg);
        });
    };

    //start the connection
    port.start();

};
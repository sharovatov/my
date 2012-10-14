//make sure jsLint doesn't bark on sharedworkers
/*global SharedWorker*/


//var myWorker = {};

//broadcasts message to all pipes
/*myWorker.broadcast = function () {
    "use strict";


};*/


function initWorkers() {
    "use strict";

    //create a sharedworker instance
    var worker = new SharedWorker("src/worker.js", "myWorker");

    //listen to messages from it and put their result into div#log
    worker.port.onmessage = function (e) {
        document.getElementById('log').innerHTML += e.data + "<hr>";
    };

    //start its port
    worker.port.start();

    document.getElementById('myForm').onsubmit = function () {

        var msg = this.messageInput.value;

        console.log("submitting to shared worker: " + msg);

        worker.port.postMessage(msg);

        //prevent default submission
        return false;

    };

}

window.onload = function () {
    "use strict";
    document.getElementById('startWorker').onclick = initWorkers;
};


/*(function () {
    "use strict";

    var worker = new SharedWorker('worker.js', 'my-shared-scope'),
        log = document.getElementById('log'),
        sendMessage;

    //set handler
    worker.port.onmessage = function (e) {
        log.textContent += '\n' + e.data.msg;
    };

    //start the port
    worker.port.start();

    //send the message there
    worker.port.postMessage({ msg: 'ping' });

    sendMessage = (function () {
        var count = 0;

        return function (ev) {
           // ev.preventDefault();


            //var msg = $(this).find('.js-message').val();

            var msg = this.messageInput.value;
            alert(msg);

            return false;
            //console.log('going to send message:', msg);
            //worker.port.postMessage({ msg: '[' + count + ']' + msg });
            //count += 1;
        };
    }());

    function attachHandlers() {
        document.getElementById('myform').onsubmit = sendMessage;
    }

}());          */
/*
window.onload = function () {
    "use strict";

    var sendMessage;

    sendMessage = (function () {
        var count = 0;

        return function () {

            var msg = this.messageInput.value;

            //worker.port.postMessage({ msg: '[' + count + ']' + msg });

            return false;
            //console.log('going to send message:', msg);
            //count += 1;
        };
    }());

    document.getElementById('myform').onsubmit = sendMessage;

};*/
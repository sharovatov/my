// todo: refactor and cover with tests
// todo: check the getNewerMessages insertion order

document.addEventListener('DOMContentLoaded', function() {
	initPTR(getNewerMessages);
	//initInfiniteBottomScroll();
});

// provides basic ajax support - calls the callback when request for the specified URL completes
function initGet(url, callback) {
	var XHR = new XMLHttpRequest();
	XHR.open("GET", url, true);
	XHR.send(null);
	XHR.onreadystatechange = function() {
		if (this.readyState==4 || this.readyState=="complete") {
			callback(this.responseText, this.status);
		}
	};
}

// should try to go to the future (i.e. fetch newer messages from the server)
// but dialogues.get_messages can't take messages from a certain date towards future,
// it can only take messages from a certain date towards the past
// so here we just take get_messages data with from_id=0 so that it shows most fresh records
function getNewerMessages(callback){
	// set args_from_post_i=0 to take most fresh messages
	var URL = location.protocol + '//' + location.host + 
		window.iOSParams.NextCommentsPageUrl + '0';

	// is being processed flag (not to initiate the same request twice)
	if ('undefined' !== typeof getNewerMessages.isBeingProcessed && 
		getNewerMessages.isBeingProcessed ) {
		//console.log('not doing anything');
		return;
	}
	// set the processing flag
	getNewerMessages.isBeingProcessed = true;

	// init the ajax request 
	initGet(URL, function(text){
		var obj,
			mainList = document.querySelector('.l-messagesList'),
			tempParent = document.createElement('ul'),
			tempChild, tempArr;
		try {
			// append resulting text to temporary element
			tempParent.innerHTML = parseGetMessagesResult(JSON.parse(text)[2]);

			// clear the mainList from its children
			mainList.innerHTML = '';

			// and now move to the main messagesList element (put them on the top)
			while(tempParent.hasChildNodes()) {
				mainList.insertBefore(tempParent.removeChild(tempParent.firstChild), mainList.firstChild);
			}
			// drop being processed flag so that the thing can be queried again
			getNewerMessages.isBeingProcessed = false;

			//call the passed callback so that the loading thing gets hidden
			callback();
		} catch (e) {
			// what's the preferred error handling way here?
			console.log(e.message);
			callback();
		}
	});
}

// goes to the past - loads messages older than the specified fromID and calls specified 
// callback upon completion
function getOlderMessages() {
	var URL = location.protocol + '//' + location.host + 
		window.iOSParams.NextCommentsPageUrl + getBottomMessageID();

	// is being processed flag (not to initiate the same request twice)
	if ('undefined' !== typeof getOlderMessages.isBeingProcessed && 
		getOlderMessages.isBeingProcessed ) {
		//console.log('not doing anything');
		return;
	}
	// set the processing flag
	getOlderMessages.isBeingProcessed = true;

	// init the ajax request 
	initGet(URL, function(text){
		var obj,
			mainList = document.querySelector('.l-messagesList'),
			tempParent = document.createElement('ul'),
			tempChild, tempArr;
		try {
			// append resulting text to temporary element
			tempParent.innerHTML = parseGetMessagesResult(JSON.parse(text)[2]);
			// and now move to the main messagesList element
			while(tempParent.hasChildNodes()) {
				mainList.appendChild(tempParent.removeChild(tempParent.firstChild));
				//mainList.appendChild(tempParent.removeChild(tempParent.firstChild));
			}
			// drop being processed flag so that the thing can be queried again
			getOlderMessages.isBeingProcessed = false;
		} catch (e) {
			// what's the preferred error handling way here?
			console.log(e.message);
		}
	});
}

// returns "inbox" or "outbox" for the direction value
function getDirection(messageHtmlText) {
	return (-1 < messageHtmlText.indexOf('data-direction="inbox"')? "inbox": "outbox");
}

// parses the specified HTML messages text array (which usually comes from 
// fetching dialogues.get_messages)
function parseMessagesTextArray(htmlTextArr) {
	var messagesList = [], previousDirectionIsInbox;

	// throw if not an array
	if ('[object Array]' !== Object.prototype.toString.call(htmlTextArr)) {
		throw new SyntaxError('array allowed only');
	}
	// iterate over all elements and put them in the resulting array folded in parent
	// if needed 
	htmlTextArr.forEach(function(messageText,key) {
		// if last message direction is different than the current one, close 
		// previous container and start the new one
		var currentDirectionIsInbox = getDirection(messageText);
		if (currentDirectionIsInbox !== previousDirectionIsInbox){
			messagesList.push([]);
		}
		// save current direction for the future iteration check
		previousDirectionIsInbox = currentDirectionIsInbox;

		//add text to the last element
		messagesList[messagesList.length-1].push(messageText);
	});

	return messagesList;
}

// queries DOM to give all messages list
function getAllMessagesFromDom() {
	return document.querySelectorAll('.l-messagesList__text');
}

// queries DOM to find the last message ID
function getBottomMessageID() {
	var allMsgs = getAllMessagesFromDom();
	return allMsgs[allMsgs.length-1].getAttribute('data-msg-id');
}

// queries DOM to find the first message ID 
function getTopMessageID() {
	var allMsgs = getAllMessagesFromDom();
	return allMsgs[0].getAttribute('data-msg-id');
}

// takes array of messageTexts and converts them to proper insertable html
function parseGetMessagesResult(htmlTextArr) {
	var wrappedMessages = parseMessagesTextArray(htmlTextArr),
		resultingText = [];

	// wrap inbox messages into <li class="l-messagesList__item m-primary">
	// and outbox into m-secondary
	wrappedMessages.forEach(function(messageParent){
		// take first message to decide the direction
		// m-primary is for inbox direction, m-secondary for outbox
		var mode = getDirection(messageParent[0]) === "inbox" ? "m-primary": "m-secondary";
		resultingText.push('<li class="l-messagesList__item ' + mode + '">');
		resultingText.push(messageParent.join(''));
		resultingText.push('</li>');
	});
	return resultingText.join('');
}

// sample with setTimeout, should be replaced with ajax call 
function updateContent(closeLoading) {
/*    window.setTimeout(function(){
		var d = document.querySelector('.l-messagesList'),
			newElem = document.createElement('li');
		newElem.innerHTML = 'appended content';
		d.insertBefore(newElem, d.firstChild);
		closeLoading();
	}, 1000); */
}

/** 
 *  initializes pull-to-refresh interface (true PTR for the top and infinite scroll for the bottom)
 *  @param {function} callback callback that is called when the "loading" message is shown. This function will be passed a param that has to be called to hide the loading bar
 */
function initPTR(callback) {
	var find = document.querySelector.bind(document),
		child = find('.ios-inner'),
		parent = find('.ios-middle'),
		arrow = find('.ios-arrow__rotating'),
		PTRControl = find('.PTRControl'),
		pull = find('.PTRControl-pull'),
		release = find('.PTRControl-release'),
		loading = find('.PTRControl-loading'),
		content = find('#PTR-content');

		// @todo: take from the element or make configurable
		ptrHeight = 50,
		arrowDelay = ptrHeight / 3 * 2,
		// indicates whether the arrow-release is being rotated
		isRotating = false,
		// additional "scrolling latency" for the release-to-update to show
		offsetCoeff = -10;

	// checks for all elements presence in DOM
	if (isNotInDom(child) || isNotInDom(parent) || isNotInDom(arrow) ||
		isNotInDom(PTRControl) || isNotInDom(pull) || isNotInDom(release) ||
		isNotInDom(loading) || isNotInDom(content)) {
		throw new ReferenceError('all elements must be present in DOM');
	}

// does this help?
//child.style.WebkitPerspective = '1000';
//child.style.WebkitBackfaceVisibility = 'hidden';

	function isNotInDom(elem) {
		return null === elem;
	}

	/**
	 * Animates element to the specified Y offset
	 * @param {HTMLElement} element dom node to animate
	 * @param {number} value vertical offset value to animate to
	 */
	function animateElementToTransformPosition(element, value) {
		element.style.WebkitTransition = '-webkit-transform 200ms ease-in-out';
		setElementTransformPosition(element, value);
	}

	/**
	 * Transforms element to the specified Y offset
	 * @param element
	 * @param position
	 */
	function setElementTransformPosition(element, position) {
		element.style.WebkitTransform = 'translate3d(0px, ' + position + 'px, 0px)';
	}


	//restores the whole scrolling block position to the initial state (it's height)
	function restoreHandlerPosition() {
		setElementTransformPosition(child, -ptrHeight);
	}

	// sets all labels states at once
	function switchVisibility(statesObj) {
		pull.style.display =    'hidden' === statesObj.pull?    'none': 'block';
		release.style.display = 'hidden' === statesObj.release? 'none': 'block';
		loading.style.display = 'hidden' === statesObj.loading? 'none': 'block';
	}

	// removes togglerotate class 
	function stopRotating(element) {
		isRotating = false;
		arrow.className = arrow.className.replace(' m-toggleRotate', '');
	}

	// adds togglerotate class to start CSS rotation
	function startRotating(element) {
		// this has to be done upon next tick, otherwise the value will 
		// just change without any animation but with flickering
		window.setTimeout(function(){
			element.className += " m-toggleRotate";
		}, 0);
		isRotating = true;
	}

	// called once touch is started 
	function touchstartHandler(e) {
		//make sure that any touch start event restores the handler position
		restoreHandlerPosition();

		//show only "pull to refresh"
		switchVisibility({pull: 'shown', release: 'hidden', loading: 'hidden'});

		//stop rotating
		stopRotating(arrow);
	}

	// called when is touched and moved, happens whenever at least 1px is
	// moved so must perform quickly (optimally <16ms)
	function touchmoveHandler(e) {
		var scrollOffset = parent.scrollTop,
			position = -1*(50+scrollOffset);

		// if scrolled enough to show at least a part of the element, change its text to "PTR plz"
		if (scrollOffset < -10) {
			switchVisibility({pull: 'shown', release: 'hidden', loading: 'hidden'});
		}

		// if scrolled enough to show full element
		if (scrollOffset < -ptrHeight/2 + offsetCoeff) {
			// show "release to refresh"
			switchVisibility({pull: 'hidden', release: 'shown', loading: 'hidden'});

			//only start animation if it's not started yet
			if (!isRotating) { 
				startRotating(arrow);
			}

		}

		// move the whole element by using translate3d instead of position-relative's top
		//setElementTransformPosition(child, position);

		// prevent the default behaviour if scrolled too much
//		if (scrollOffset > content.offsetHeight) e.preventDefault();

	}

	// touchend event handler called once the screen is untouched
	function touchendHandler(e) {
		var scrollOffset = parent.scrollTop;

		//stop rotating the arrow
		stopRotating(arrow);

		// if scrolled to show full element and stopped dragging
		//    (i.e. scrolled enough for PTR):
		// 1) show the element fully (change it translate3d-y to 0 instead of -height
		// 2) change its text to "wait, loading"
		// 3) call the updateContents method
		if (scrollOffset < -ptrHeight/2 + offsetCoeff) {
			animateElementToTransformPosition(child, 0);

			switchVisibility({pull: 'hidden', release: 'hidden', loading: 'shown'});

			// call user-passed callback with our restoration callback
			if ('undefined' !== typeof callback && 
				'[object Function]' ===Object.prototype.toString.call(callback)) {
				callback(restoreHandlerPosition);
			}
		}
		// otherwise just drop it to the initial state
		else {
			//console.log(scrollOffset);
			restoreHandlerPosition();
		}
		// if scrolled to the bottom (more than the total height), initiate bottom loading
		/*if (scrollOffset > content.offsetHeight - 30 && scrollOffset < content.offsetHeight) {
			console.log('about to add more messages = '  + scrollOffset);
		}
*/
	}

// requestAnimationFrame to check scrolling?
// onscroll event?

	parent.addEventListener('scroll',function(e) {
		var scrollOffset = parent.scrollTop;
		// if scrolled to the very end, load more messages
		if (scrollOffset > content.offsetHeight - 300) {
			getOlderMessages();
		}
	});
	document.addEventListener('touchstart', touchstartHandler);
	document.addEventListener('touchmove', touchmoveHandler);
	document.addEventListener('touchend', touchendHandler);
	//document.addEventListener('scroll', function(e){ console.log('scroll ended'); });
}

/*function initMessagesGet(callback) {// simplest ajax GET
	var URL = location.protocol + '//' + location.host + window.iOSParams.NextCommentsPageUrl + 
			window.iOSParams.BottomMessageID;
	initGet(URL);
}*/

function GO(param) {
	location.href = "http://" + location.host + window.iOSParams.NextCommentsPageUrl + param;
}

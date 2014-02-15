window.onload = function() {
	initPTR(updateContent);
};

// sample with setTimeout, should be replaced with ajax call 
function updateContent(closeLoading) {
	window.setTimeout(function(){
		var d = document.getElementById('content'),
			newElem = document.createElement('p');
		newElem.innerHTML = 'appended content';
		d.insertBefore(newElem, d.firstChild);
		closeLoading();
	}, 1000);
}

/** 
 *	initializes pull-to-refresh interface
 *	@param {function} callback callback that is called when the "loading" message is shown. This function will be passed a param that has to be called to hide the loading bar
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
		content = find('.PTR-content'),

		// maximum content height
		totalPositiveHeight = content.offsetHeight,// + PTRControl.offsetHeight,

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
		isNotInDom(loading)) {
		throw new ReferenceError('all elements must be present in DOM');
	}

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

		// if scrolled enough to show the bottom PTRControl
		if (scrollOffset > totalPositiveHeight) console.log('show bottom one');

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
		setElementTransformPosition(child, position);

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
			restoreHandlerPosition();
		}
	}

	document.addEventListener('touchstart', touchstartHandler);
	document.addEventListener('touchmove', touchmoveHandler);
	document.addEventListener('touchend', touchendHandler);
};
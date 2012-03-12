TestCase("basic API tests", {
	setUp: function(){
		this.myList = new ShoppingList();
	}
	,tearDown: function(){
		delete this.myList;
	}
	,"test application lists item in the store": function(){
		//as our shopping list is empty, it should return empty array of items
		assertEquals([], this.myList.getItems());
	}
	,"test application allows adding items to the store": function(){
		var bananas = "1.5 kilos of bananas", lemons = "3 kilos of lemons";
		this.myList.addItem(bananas);
		this.myList.addItem(lemons);

		assertEquals([bananas, lemons], this.myList.getItems());
	}

});

TestCase("mocking tests", {
	setUp: function () {

		this.myList = new ShoppingList();

		//set up high-level AJAX mocking - "server"
		this.server = sinon.fakeServer.create();
	}

	,tearDown: function () {

		delete this.myList;

		//restore the environment for next TestCases
		this.server.restore();
	}

	,"test sync method send ajax request to the server": function () {

		//ask server to respond to our request
		this.server.respondWith(
			"POST", //method it responds to
			"http://sharovatov.ru/sync.php", //URL it will respond to
			[200, // HTTP status code
				{"Content-Type": "text/plain"}, //HTTP headers
				'' //HTTP response body
			]);

		//stub for processSyncResult method
		var responseHandlerStub = sinon.stub(this.myList, 'processSyncResult');

		//ask myList to send data to the server
		this.myList.sync();

		//ask server mock to respond immediately
		this.server.respond();

		//check that our stub was actually called
		assertTrue(responseHandlerStub.called);
	}

});

TestCase("timeouts tests", {

	setUp: function(){

		this.myList = new ShoppingList();

		//set up timers mocking
		this.clock = sinon.useFakeTimers();
	}
	,tearDown: function(){

		delete this.myList;

		//restore timers to the original state
		this.clock.restore();
	}

	//more of an integrational test rather than TDD/unit test
	,"test should animate added element": function(){

		//assume that added element is identified by class="added", add this to DOM
		/*:DOC += "<p class='b-shoppingList-added'></p>"*/

		var addedElement= $('.b-shoppingList-added');

		//run visualizing method
		this.myList.visualizeAdding(addedElement);

		//ask timers mock to think that 1 second passed
		this.clock.tick(400);

		//dirty css-based assert for the first animation part
		assertEquals('100', addedElement.height());

		//and the second animation part in the chain
		this.clock.tick(400);
		assertEquals('20', addedElement.height());

	}

});
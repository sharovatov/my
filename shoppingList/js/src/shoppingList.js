function ShoppingList(){
	var dataStore = [];
	this.getItems = function(){
		return dataStore;
	};
	this.addItem = function(item) {
		dataStore.push(item);
	};

	/* ... removeItem and other basic methods ... */

	this.processSyncResult = function(data){
		//do something with data - e.g. for success show "saved" and for error - show "try again later"
	};
	//send all current data to a sync URL
	this.sync = function() {
		$.post('http://sharovatov.ru/sync.php', JSON.stringify(dataStore), this.processSyncResult);
	};

	/* ... now some timeouts tests ... */

	this.visualizeAdding = function(element){
		$(element).animate({height: '100px'}).animate({height: '20px'});
	};

}
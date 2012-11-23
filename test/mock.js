describe('Basic Grid Layout',function(){
	var table;
	
	beforeEach(function(){

		jasmine.getFixtures().fixturesPath = 'fixtures';
		loadFixtures("basicTable.html");
		table = $("#basicTable");

	});

	it('should have a proper mocks',function(){
		expect(table.find("tr").length).toBe(2);
		expect(table.find("tr").first().find("td").length).toBe(3);
		expect(table.find("td").length).toBe(6);
		expect(table.find("input").length).toBe(4);
		expect(table.find("input[name^=data]").length).toBe(4);
	});

	it('should add class to table',function(){
	
		table.grid();

		expect(table).toBe('.hipp-grid');
		expect(table.find("td.editable").length).toBe(6);

	});

	it('should hide inputs',function(){

		table.grid();

		var styles = ["display: none;", "display: none;", "display: none;", "display: none;"];
		
		expect(table.find(":input").map(function(){return $(this).attr("style");}).get()).toEqual(styles);

	});

	it('should add render spans',function(){

		table.grid();

		expect(table.find("span.render").length).toBe(4);
	
	});
	it('should add add a cursor',function(){
	
		table.grid();

		expect($(".cursor").length).toBe(1);
	
	});
});

describe('Keyboard & Mouse Navigation',function(){
	var table;
	
	beforeEach(function(){

		jasmine.getFixtures().fixturesPath = 'fixtures';
		loadFixtures("basicTable.html");
		table = $("#basicTable");

	});

	it("should focus cursor on cell click ",function(){
		var wasFocused = false;
		var focusedCell = false;
		table.grid();
		table.bind("gridfocus",function(e,cell){
			wasFocused = true;
			focusedCell = cell;
		});
		table.find("td").first().click();
		expect(wasFocused).toBeTruthy();
		expect(focusedCell).toBe(table.find("td").first());
	});
});


describe('Editing Functionality',function(){
	var table;
	
	beforeEach(function(){

		jasmine.getFixtures().fixturesPath = 'fixtures';
		loadFixtures("basicTable.html");
		table = $("#basicTable");

	});

	it("should accept keyboard inputs and write them to the DOM",function(){
		table.grid();

		table.find("td").first().click();
		//write TEST
		var event = jQuery.Event("keydown");
		//T
		event.keyCode = 84;
		$(".cursor").trigger(event);
		//E
		event = jQuery.Event("keydown");
		event.keyCode = 69;
		$(".cursor").trigger(event);
		//S
		event = jQuery.Event("keydown");
		event.keyCode = 83;
		$(".cursor").trigger(event);
		//T
		event = jQuery.Event("keydown");
		event.keyCode = 84;
		$(".cursor").trigger(event);
		//<ENTER>
		event = jQuery.Event("keydown");
		event.keyCode = 13;
		$(".cursor").trigger(event);

		expect(table.find("td").first().find("input").val()).toBe('test');
	});


});



describe('Adding & Deleting Rows',function(){

});

describe('Inserting Data Programmatically',function(){

});

describe('Retrieving Data Programmatically',function(){

});
jQuery.fn.peGrid = function(options){
	
	var defaults = {
		selection:true,
		allowAdd:true,
		allowDelete:true
	};
	
	var selecting;
	
	options = $.extend(defaults,options||{});
	
	var styleTable = function(context){
		var table;
		if(context.is("table")){
			table = context;
		}else{
			table = $("table",context);
		}
		
		table.addClass("peGrid");
		
	}

	//Hide Inputs From Cells
	//Add Editable Class to Cell
	//
	var hideInputs = function(context){
		$("td",context).filter(":has(:input[name^=data]:visible)").addClass("editable").not(":has(:checkbox)").each(function(){
			var input = $(this).find(":input[name^=data]");
			var value;
			if(input.is("select")){
				value = input.find("option:selected").text();
			}else{
				value = input.val();
			}
			input.hide();
			$("<span class='render'></span>").text(value).appendTo(this);
		}).end();
			
	}
	
	//Sets and Fixes the classes needed for 
	//even/odd Striping
	var reStripe = function(context){
		$("tr",context)
		.removeClass("even odd")
		.filter(":even")
			.addClass("even")
		.end()
		.filter(":odd")
			.addClass("odd");
		return context;
	}
	
	//Clears Cursor and context tools
	//Kills Editing components
	var clearEdit = function(){
		if(typeof ($("#target").data("current")) === "undefined" ){
			return;
		}
		$($("#target").data("current"));
		$("#target").removeClass("editing").find(":input").remove().end().focus();
		
	}
	
	var checkBeforeNavigate = function(e){
		
		var currentTD = $($("#target").data("current"));
			var text = $("#target :text").get(0);
			switch(e.keyCode){
				case 13:
					currentTD.trigger("commitEdit.PeGrid");
					// currentTD.trigger("endEdit.PeGrid");
					currentTD.trigger("focus.PeGrid");
				case 27:
					currentTD.trigger("endEdit.PeGrid");
					return false;
		      	case 37:
				case 39:
				// console.log(text.selectionStart);
				// console.log(text.selectionEnd);
				if(e.keyCode==37){
					if(text && text.selectionStart && text.selectionEnd){
						 if(text.selectionEnd!=text.selectionStart){
							// console.log('con seleccion')
							break;
						}else if(text.selectionStart!=0){
								//Do not Jump From Cell
								// console.log('no inicio')
								break;

						}
					}
				}else if(e.keyCode==39){
					if(text && text.selectionStart && text.selectionEnd){
						if(text.selectionEnd!=text.selectionStart){
							
							break;
						}else if(text.selectionEnd!=text.value.length){
								//Do not Jump From Cell
								// console.log('no fin')

								break;

						}
					}
				}





		        case 38:
				case 40:
					// console.dir($(this));
					if($(this).attr("aria-haspopup") || $(this).is(".hasDatepicker") || $(this).is(".complex") || $(this).is("select")){
						//Ok...it is a complex component....leave it alone...
						// console.log("complex component");
						break;
					}
				currentTD.trigger("commitEdit.PeGrid");
				navigateCells(e);
				return false;
				default:
			}

	}
	
	var beginEdit = function(e){
		var currentTD = $($("#target").data("current"));
		var editor;
		if(currentTD.is(":not(.editable)") || currentTD.is(".editing")){
			//avoid recursive calls and non-editable fields
			return false;
		}

		if(currentTD.is(":has(:checkbox)")){
			var $checkbox = currentTD.find(':checkbox');
			$checkbox.attr('checked', !$checkbox.attr('checked'));
			return false;
		}

		if(currentTD.find(":input").length>0){
			editor = currentTD.find(":input").clone().css({
				"min-width":$("#target").width(),
				"min-height":$("#target").height()
			}).attr("id","editor"+(Math.random()*1000).toFixed(0)).show();
			editor.val(currentTD.find(":input").val());
			// if(editor.is("select"))
		}else{
			editor = $("<textarea name=\"editor\"></textarea>").css({
				"min-width":$("#target").width(),
				"min-height":$("#target").height()
			}).text(currentTD.text());
		}
			$("#target").addClass("editing").append(editor);

			editor.position({
					of:currentTD,
					my:"left top",
					at:"left top"
				}).bind("keydown",checkBeforeNavigate).focus();

				if(editor.is("input,textarea,number")){
					editor.get(0).select();
				}
	}
	
	var commitEdit = function(){
		// var current = $($("#target").data("current"));
		var current = $(this);
		var history = current.data("history")||[];
		var oldValue ;
		var newValue ;
		
		if($("#target").is(".editing")){
			$("#target").removeClass("editing");
	
			newValue = $("#target").find(":input").val();
			oldValue = (current.find(":input[name^=data]").val());
			
			//update hidden value...
			current.find(":input[name^=data]").val(newValue);
			
			//now we can render...
			current.trigger("render.PeGrid");
			
			// if there is no render span...
			//use the Cell's Text Node
			if(!current.is(":has(span.render)")){
				oldValue = (current.text());
			}
			
	
			history.push(oldValue);
	
			if(history.indexOf(newValue)==0){
				current.removeClass("dirty");
			}else{
				current.addClass("dirty");
			}
	
			current.data("history",history);
			
			//Clear-up validation Messages
			
			$(".error-message",current).hide("fast");
			
			current.removeClass("error");
		}
		
	}
	
	var render = function(){
			var inputs = $(this).find(":input[name^=data]");
			var value;

			//test to se if there are many inputs...
			switch(inputs.length){
				case 0:
					//no inputs?
					value = "";
					break;
				case 1:
					value = inputs.val();
					break;
				default:
					value = inputs.filter(".renderMe").val();
			}

			if($(this).is(":has(span.render)")){
				$(this).find("span.render").text(value);
			}// else{
			// 		// $(this).text(value);
			// 	}
	}
	
	var setEvents = function(context){
		//bind click event
		$("td",context).click(function(e){
			var last = $($("#target").data("current"));
			$(last).trigger("commitEdit.PeGrid");
			$(last).trigger("endEdit.PeGrid");
			// $(last).trigger("blur.PeGrid");
			$(this).trigger("focus.PeGrid");
			// return false;
		}).data("data-history",[])
		.bind("render.PeGrid",render)
		.bind("focus.PeGrid",focusCell)
		.bind("beginEdit.PeGrid",beginEdit)
		.bind("endEdit.PeGrid",clearEdit)
		.bind("commitEdit.PeGrid",commitEdit)
		.bind("selectionChange.PeGrid",selectionChange)
		.bind("addRow.PeGrid",addRow)
		;
		
		if(!options.selection){
			$("td",context).unbind("selectionChange.PeGrid");
		}
	}
	
	var focusCell = function(e){

		//inform blur to last cell
		
		// console.log(selecting);
		
		if(selecting){
			$(this).addClass("selected");
		}else{
			$(this).parents("table").find("td.selected").removeClass("selected");
		}
		
		$(this).trigger("selectionChange.PeGrid");

		
		var last = $($("#target").data('current'));
		
		last.trigger("blur.PeGrid");
		
		

		$("#delete-row-button").css({
			height:($(this).outerHeight(false)-10)
		}).show().position({
			of:$(this).parents("tr"),
			my:"left top",
			at:"right top",
			offset:"0 0"
		});

		$("#target").show().css({
			width:($(this).outerWidth(false)-2),
			height:($(this).outerHeight(false)-2)
		}).position({
			of:$(this),
			my:"left top",
			at:"left top",
			offset:"0 0"
		}).data('current',$(this)).focus();
	}
	
	var startCursor = function(){
		//if there is no cursor...
		if ($("#target").length==0) {
			//Defining Cursor

			$("<div tabindex='-1' id='target'>&nbsp;</div>").css({outline:"0",border:"2px solid #3875D7","box-shadow":"1px 1px 3px","background":"transparent","position":"absolute"}).appendTo("body").bind("click",function(e){
				if(!$(this).is(".editing")){
					var currentTd = $("#target").data('current');
					// currentTd.trigger("endEdit.PeGrid");
					currentTd.trigger("beginEdit.PeGrid"); 
				}

			});

			$("#target").hide().bind("keydown",function(e){
				if($("#target").is(":visible") && !$("#target").is(".editing")){
					navigateCells(e);
				}
			}).bind("keyup",function(e){
				selecting = e.shiftKey;
			});
		}
	}
	
	var startContextTools = function(){
		if(options.allowDelete){
			//if there is no cursor...
			if ($("#delete-row-button").length==0) {
				//Defining Cursor

				$("<div tabindex='-1' id='delete-row-button'><strong><a href='javascript:void()'>Eliminar</a></strong></div>")
				.css({
					outline:"0",
					border:"1px solid #CCC",
					"box-shadow":"1px 1px 3px",
					"background":"#EEE",
					"position":"absolute",
					"padding":"5px",
					"-webkit-border-top-right-radius": "10px",
					"-webkit-border-bottom-right-radius": "10px",
					"-moz-border-radius-topright": "10px",
					"-moz-border-radius-bottomright": "10px",
					"border-top-right-radius": "10px",
					"border-bottom-right-radius": "10px",
					"-moz-box-shadow": "1px 1px 2px #ccc", 
					"-webkit-box-shadow": "1px 1px 2px #ccc",
					"box-shadow":"1px 1px 2px #ccc"
					})
				.appendTo("body")
				.find("a")
				.bind("click",function(e){
					deleteRow();
					return false;
				});
			}
		}

	}
	
	var selectionChange = function(){

		var maxX,maxY,minX,minY;
		
		$(".selection").remove();
		
		$(".selected").each(function(){
			var pos = $(this).position();
			var offsetX = $(this).outerWidth();
			var offsetY = $(this).outerHeight();
			
			if(typeof maxX === "undefined"){
				maxX = pos.left + offsetX;
			}else if((pos.left + offsetX) > maxX){
				maxX = pos.left + offsetX;
			}
			
			if(typeof maxY === "undefined"){
				maxY = pos.top + offsetY;
			}else if((pos.top + offsetY) > maxY){
				maxY = pos.top + offsetY;
			}
			
			
			if(typeof minY === "undefined"){
				minY = pos.top;
			}else if(pos.top < minY){
				minY = pos.top;
			}
			
			if(typeof minX === "undefined"){
				minX = pos.left;
			}else if(pos.left < minX){
				minx = pos.left;
			}
			
		});
		
		
		var css = {outline:"0",border:"1px solid #3875D7","background-color":"#3875D7","opacity":0.3,"position":"absolute"};
		
		$("<div class='selection'>&nbsp;</div>").css(css).css(
			{
				width:maxX-minX+"px",
				height:maxY-minY+"px",
				top:minY,
				left:minX
			}).appendTo("body");
		
		
	}
	
	var renameInputs = function (row){
			var rName = /^(data\[\w*\]\[)(\d+)(\]\[\w*\])$/;
			var rId = /^(\D+)(\d+)(\D+)$/;
			$(":input[name^=data]",row).each(function(i,e){
				var $this = $(this);
				var name = $this.attr("name");
				var id = $this.attr("id");
				var mName = name.match(rName);
				var mId = id.match(rId);
				var numero = 0;
				if(mName && mId && mName[2] == mId[2]){
					numero = parseInt(mName[2]);
					if(isFinite(numero)){
						numero++;
						$this.attr("name",name.replace(rName,"$1"+numero+"$3"));
						$this.attr("id",id.replace(rId,"$1"+numero+"$3"));
					}
				}
			});


	}
	
	var addRow = function(){
		if(options.allowAdd){
			var tabla = $(this).parents("table");
			var nueva = $("tr:has(:input[name^=data])",tabla).last().clone();
			renameInputs(nueva);
			nueva
				.toggleClass("even")
				.toggleClass("odd")
				.find(":input[name^=data]")
					.filter(":input[name$='[id]']") //Limipiar ID
						.val("")
					.end()
				.end()
				.insertAfter(tabla.find("tr:last"));
			setEvents(nueva);
		}

	}
	
	var navigateCells = function(e){
			var currentTd = $($("#target").data('current'));
			var tr;
			var next;
			next = currentTd.trigger("endEdit.PeGrid");
			//if shift is down...
			//Select
			if(e.shiftKey){
				currentTd.addClass("selected");
				selecting=true;
			}else{
				selecting=false;
			}
		  	
			
			//if Ctrl down
			//Handle copy or paste
			// console.dir(e);
			if(e.ctrlKey){
				console.log("control");
				console.log(e.keyCode);
				if(e.keyCode==67){
					console.log("copying...");
				}
			}
			
			switch(e.keyCode)
		  {
		      // left arrow
		      case 37:
		          next = currentTd.prev(":visible").trigger("focus.PeGrid");
		          break;

			  case 9:
		      // right arrow
		      case 39:
		          next = currentTd.next(":visible").trigger("focus.PeGrid");
		          break;
		      // up arrow
		      case 38:
				next = currentTd.parent().prev().children("td").eq($(currentTd).index()).trigger("focus.PeGrid");
		      break;
		      // down arrow
		      case 40:
				var tr = currentTd.parent().next();
				if(tr.length){
					next = tr.children("td").eq(currentTd.index()).trigger("focus.PeGrid");
				}else{
					currentTd.trigger("addRow.PeGrid");
				}
				break;
					//Esc Key
			case 27:
				currentTd.trigger("endEdit.PeGrid");
				break;

					//Esc Key
			case 13:
				e.preventDefault();
				currentTd.trigger("beginEdit.PeGrid");
			break;
					//Backspace Key
			case 8:
				e.stopPropagation();
				currentTd.trigger("beginEdit.PeGrid");

			break;

			default:
			if((e.keyCode >= 48 && e.keyCode <= 90) || (e.keyCode == 32) || (e.keyCode >= 96 && e.keyCode <= 105) ){
				currentTd.trigger("beginEdit.PeGrid");
			}
		  }
		
			if(e.shiftKey){
				next.addClass("selected");
				currentTd.trigger("selectionChange.PeGrid");
			}

		return false;
	} 
	
	var confirmExit=function(context){
		// $(window).bind()
		var that = context;
		window.onbeforeunload = function (e) {
			var message = "Los cambios aun no fueron guardados";
		  	
			// alert($(that).is(":has(.dirty)"));
			// console.log($(that).is(":has(.dirty)"));
			if($(that).is(":has(.dirty)")||$("#target").is(".editing")){
				e = e || window.event;
			  // For IE and Firefox
			  if (e) {
			    e.returnValue = message;
			  }

			  // For Safari
			  return message;
			}else{
				return;
			}

		};
	};
	
	
	styleTable(this);

	hideInputs(this);
	
	//fix Striping (if any);
	reStripe(this);
	
	//Link Events
	setEvents(this);
	
	//setUp Cursor
	startCursor();
	
	//Contextual Tools
	startContextTools();
	
	confirmExit(this);
	
	// $(document).click(function(){
	// 	$("td")
	// });

	return this;
}
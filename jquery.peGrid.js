	jQuery.fn.peGrid = function(options){

		var blurTimer;

		var defaults = {
			selection:false, //this is buggy...for now...
			allowAdd:true,
			allowDelete:true,
			autoSubmit:true,
			queryUpdateTemplate:":input[name='data[{model}][{iterator}][{field}]']",
			deleteUrlTemplate:"controller/delete/{id}",
			idQueryTemplate:":input[name$='[id]']",
			lastRowText:"Ultima fila. Presione la tecla ⇣ para agregar una nueva fila",
			deleteLinkText: "Elminar Fila",
			extractFields:/data\[[^\]]+\]\[[^\]]+\]\[([^\]]+)\]/gi,
		};

		var selecting;

		options = jQuery.extend(defaults,options||{});

		var invalidData = function(data){
				queryTemplate = options.queryUpdateTemplate;
				var current;
				for(ord in data){
					for(model in data[ord]){
						for(field in data[ord][model]){
							jQuery(queryTemplate.replace("{model}",model).replace("{iterator}",ord).replace("{field}",field))
							.parents("td")
								.addClass("error")
								.attr("title",data[ord][model][field].join("\n"));
						}

					}
				}
		}

		var updateInput = function(input,value){
			if(input.length>0){

				td = input.parents("td");
				oldValue = input.val()
				newValue = value;

				if(newValue != oldValue || td.is(".dirty") ){
					if(input.is(":checkbox")){
						input.attr( "checked" , !!newValue );
					}else if(input.is("select")){
						input.val(input.find("option:contains('"+newValue+"')").first().attr("value"));
					}else{
						input.val(newValue)
					}



					input.trigger("render.PeGrid");

					td
					.removeClass("dirty")
					.removeClass("error")
					.attr("title","");						
					modified = true;
				}
			}
		}

		var updateData = function(data){
			queryTemplate = options.queryUpdateTemplate;
			var tr = jQuery("");
			var input,oldValue,newValue,td,modified;
			for(ord in data){
				modified = false;
				for(model in data[ord]){
					for(field in data[ord][model]){
						input = jQuery(queryTemplate.replace("{model}",model).replace("{iterator}",ord).replace("{field}",field));
						//if there is no input for this field...ignore it...
						updateInput(input,data[ord][model][field]);



					}
				}
				if(modified){
					tr = tr.add(td.parents("tr"));
				}

			}
			tr.trigger("updated");

		}

		var styleTable = function(context){
			var table;
			if(context.is("table")){
				table = context;
			}else{
				table = jQuery("table",context);
			}

			table.addClass("peGrid");

		}

		//Set up the drag area
		var startDropArea =  function(){
			var table = jQuery(this).parents("table");
			jQuery("<textarea id='dropTarget'></textarea>").css({
				width:(table.outerWidth(false)-2),
				height:(table.outerHeight(false)-2),
				position:"absolute"
			}).data("owner",table).appendTo("body").position({
				of:table,
				my:"top left",
				at:"top left"
			}).bind("drop",processDrop);
		}

		//Process Data once it si dropped
		var processDrop = function(){
			setTimeout(function(){
				var raw = jQuery("#dropTarget").val();
				var rows = raw.split("\n");
				var data = [];
				var table = jQuery("#dropTarget").data("owner");
				var fields = table.find("tbody tr").first().find("td").find(":input[name^=data]").map(function(){
					return jQuery(this).attr("name").replace(options.extractFields,"$1");
					}).get();
				var cells,datum,tds;
				var trs = table.find("tbody tr");
				if( trs.length < rows.length ){
					for (var i=0; i < (rows.length - trs.length); i++) {
						addRow.apply(trs,[null,true]);
					};
				}
				//expand trs set to include the newly add rows
				trs = table.find("tbody tr");

				for (var i=0; i < rows.length; i++) {
					cells = rows[i].split("\t");
					tds = trs.eq(i).find("td").filter(":has(:input[name^=data])");

					for (var j=0; j < cells.length; j++) {
						updateInput(tds.eq(j).find(':input[name^=data]'),cells[j]);
					};

				};
				jQuery("#dropTarget").remove();
				// alert(jQuery(this).val());
			},0);
		}


		//Hide Inputs From Cells
		//Add Editable Class to Cell if the cell has a visible input item
		var hideInputs = function(context){
			jQuery("td",context).filter(":has(:input[name^=data]:visible)").addClass("editable").not(":has(:checkbox)").each(function(){
				var input = jQuery(this).find(":input[name^=data]");
				var value;
				if(input.is("select")){
					value = input.find("option:selected").text();
				}else{
					value = input.val();
				}
				input.hide();
				jQuery("<span class='render'></span>").text(value).appendTo(this);
			}).end();

		}

		//Sets and Fixes the classes needed for 
		//even/odd Striping
		var reStripe = function(context){
			jQuery("tr",context)
			.removeClass("even odd")
			.filter(":even")
				.addClass("even")
			.end()
			.filter(":odd")
				.addClass("odd");
			return context;
		}

		//Clears Cursor and context tools
		//Removes Editing components
		var clearEdit = function(){
			if(typeof (jQuery("#target").data("current")) === "undefined" ){
				return;
			}
			jQuery(jQuery("#target").data("current"));
			jQuery("#target").removeClass("editing").find(":input").remove().end().focus();

		}

		//If the editor is opened
		//Check the key before invoking
		//default cell navigation
		var checkBeforeNavigate = function(e){

			var currentTD = jQuery(jQuery("#target").data("current"));
				var text = jQuery("#target :text").get(0);
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
					case 9:
					// console.log(text.selectionStart);
					// console.log(text.selectionEnd);
					if(e.keyCode==37){
						if(text && text.selectionStart && text.selectionEnd){
							 if(text.selectionEnd!=text.selectionStart){
								break;
							}else if(text.selectionStart!=0){
									//Do not Jump From Cell
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
						// console.dir(jQuery(this));
						if(jQuery(this).attr("aria-haspopup") || jQuery(this).is(".hasDatepicker") || jQuery(this).is(".complex") || jQuery(this).is("select")){
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
			var currentTD = jQuery(jQuery("#target").data("current"));
			var editor;
			if(currentTD.is(":not(.editable)") || currentTD.is(".editing")){
				//avoid recursive calls and non-editable fields
				return false;
			}

			if(currentTD.is(":has(:checkbox)")){
				var jQuerycheckbox = currentTD.find(':checkbox');
				jQuerycheckbox.attr('checked', !jQuerycheckbox.attr('checked'));
				return false;
			}

			if(currentTD.find(":input").length>0){
				editor = currentTD.find(":input").clone().css({
					"min-width":jQuery("#target").width(),
					"min-height":jQuery("#target").height()
				}).attr("id","editor"+(Math.random()*1000).toFixed(0)).show();
				editor.val(currentTD.find(":input").val());
				// if(editor.is("select"))
			}else{
				editor = jQuery("<textarea name=\"editor\"></textarea>").css({
					"min-width":jQuery("#target").width(),
					"min-height":jQuery("#target").height()
				}).text(currentTD.text());
			}

			editor.bind("blur",function(){
				// currentTD.trigger("blurTable.PeGrid");
			});

				jQuery("#target").addClass("editing").append(editor);

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
			// var current = jQuery(jQuery("#target").data("current"));
			var current = jQuery(this);
			var history = current.data("history")||[];
			var oldValue ;
			var newValue ;

			if(jQuery("#target").is(".editing")){
				jQuery("#target").removeClass("editing");

				newValue = jQuery("#target").find(":input").val();
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

				jQuery(".error-message",current).hide("fast");

				current.removeClass("error");
			}

		}

		var render = function(){
				var inputs = jQuery(this).find(":input[name^=data]");
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

				if(jQuery(this).is(":has(span.render)")){
					var target = jQuery(this).find("span.render");
					if(target.text()!=value){
						jQuery(this).find("span.render").text(value);
						if(jQuery.isFunction(jQuery.fn.effect)){
							jQuery(this).filter(":not(:animated)").effect("highlight","slow");
						}
					}

				}// else{
				// 		// jQuery(this).text(value);
				// 	}
		}

		var setEvents = function(context){
			//bind click event
			jQuery("td",context).click(function(e){
				var last = jQuery(jQuery("#target").data("current"));
				jQuery(last).trigger("commitEdit.PeGrid");
				jQuery(last).trigger("endEdit.PeGrid");
				// jQuery(last).trigger("blur.PeGrid");
				jQuery(this).trigger("focus.PeGrid");
				// return false;
			}).data("data-history",[])
			.bind("render.PeGrid",render)
			.bind("focus.PeGrid",focusCell)
			.bind("beginEdit.PeGrid",beginEdit)
			.bind("endEdit.PeGrid",clearEdit)
			.bind("commitEdit.PeGrid",commitEdit)
			.bind("selectionChange.PeGrid",selectionChange)
			.bind("addRow.PeGrid",addRow)
			.bind("blurTable.PeGrid",blurTable)
			.bind("localDelete.PeGrid",localDelete)
			.bind("dragenter.PeGrid",startDropArea)
			;

			if(!options.selection){
				jQuery("td",context).unbind("selectionChange.PeGrid");
			}

			jQuery("td",context).parents("table").click(function(){
				// console.log("Click CONTENIDO...");
				return false;
			})

			jQuery(document).bind("click",function(){
				jQuery(jQuery("#target").data("current")).trigger("blurTable.PeGrid");
			})

		}

		var blurTable = function(e){
			var caller = this;
			setTimeout(function(){
				jQuery("#target").hide();
				jQuery("#delete-row-button").hide();
				jQuery(jQuery("#target").data('current')).trigger("commitEdit.PeGrid").trigger("endEdit.PeGrid");
				//If I auto submit...
				if(options.autoSubmit){
					//check if Form plugin is loaded...
					// if(jQuery.ajaxSubmit){
						// console.log("in..");
						var params = {
							dataType:  'json', 
							type: "POST",
							"success":function(data){
								if(data.success){
									updateData(data.success);
									invalidData(data.invalid);
								}
							},
							"error":function(){
								console.log("comm error");
							}
						};
						// console.dir(caller);
						jQuery(caller).parents("form").ajaxSubmit(params);
					// }
				}

			},50);

		}

		var focusCell = function(e){

			//inform blur to last cell

			// console.log(selecting);

			if(selecting){
				jQuery(this).addClass("selected");
			}else{
				jQuery(this).parents("table").find("td.selected").removeClass("selected");
			}

			jQuery(this).trigger("selectionChange.PeGrid");


			var last = jQuery(jQuery("#target").data('current'));

			last.trigger("blur.PeGrid");



			jQuery("#delete-row-button").css({
				width:(jQuery(this).parents("tr").outerWidth(false)-10)
			}).show().position({
				of:jQuery(this).parents("tr"),
				my:"left top",
				at:"left bottom",
				offset:"0 2"
			});

			if(!jQuery(this).parents("tr").next().length){
				jQuery("#delete-row-button>.last").show();
			}else{
				jQuery("#delete-row-button>.last").hide();

			}

			jQuery("#target").show().css({
				width:(jQuery(this).outerWidth(false)-2),
				height:(jQuery(this).outerHeight(false)-2)
			}).position({
				of:jQuery(this),
				my:"left top",
				at:"left top",
				offset:"0 0"
			});
			//sometimes position() breaks chain...
			jQuery("#target").data('current',jQuery(this)).focus();
		}

		var startCursor = function(){
			//if there is no cursor...
			if (jQuery("#target").length==0) {
				//Defining Cursor

				jQuery("<div tabindex='-1' id='target'>&nbsp;</div>").css({
					outline:"0",
					border:"2px solid #3875D7",
					"box-shadow":"1px 1px 3px",
					"background":"transparent",
					"position":"absolute"
					}).appendTo("body").bind("click",function(e){
					if(!jQuery(this).is(".editing")){
						var currentTd = jQuery("#target").data('current');
						// currentTd.trigger("endEdit.PeGrid");
						currentTd.trigger("beginEdit.PeGrid"); 
					}
					return false;

				});

				jQuery("#target").hide().bind("keydown",function(e){
					if(jQuery("#target").is(":visible") && !jQuery("#target").is(".editing")){
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
				if (jQuery("#delete-row-button").length==0) {
					//Defining Cursor

					jQuery("<div tabindex='-1' id='delete-row-button'><span class='last'>"+options.lastRowText+"</span><strong><a class='fr' href='javascript:void()'>"+options.deleteLinkText+"</a></strong></div>")
					.css({
						outline:"0",
						border:"1px solid #CCC",
						"box-shadow":"1px 1px 3px",
						"background":"rgba(0,0,0,0.7)",
						"position":"absolute",
						"padding":"5px",
						"-webkit-border-bottom-left-radius": "10px",
						"-webkit-border-bottom-right-radius": "10px",
						"-moz-border-radius-bottomleft": "10px",
						"-moz-border-radius-bottomright": "10px",
						"border-bottom-left-radius": "10px",
						"border-bottom-right-radius": "10px",
						"-moz-box-shadow": "1px 1px 2px #000", 
						"-webkit-box-shadow": "1px 1px 2px #000",
						"box-shadow":"1px 1px 2px #000"
						})
					.appendTo("body")
					.find("a")
					.bind("click",function(e){
						deleteRow();
						return false;
					})
					.end()
					.bind("click",function(e){
						return false;
					})
					.hide()
					;
				}
			}

		}

		var selectionChange = function(){

			var maxX,maxY,minX,minY;

			jQuery(".selection").remove();

			jQuery(".selected").each(function(){
				var pos = jQuery(this).position();
				var offsetX = jQuery(this).outerWidth();
				var offsetY = jQuery(this).outerHeight();

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

			jQuery("<div class='selection'>&nbsp;</div>").css(css).css(
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
				jQuery(":input[name^=data]",row).each(function(i,e){
					var $this = jQuery(this);
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

		var addRow = function(e,noFocus){

			if(options.allowAdd){
				var tabla = jQuery(this).parents("table");
				var nueva = jQuery("tr:has(:input[name^=data])",tabla).last().clone();
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

				// //focus new row
				if(!noFocus){
					jQuery(this).parent().next().children("td").eq(jQuery(this).index()).trigger("focus.PeGrid");

				}
			}

		}

		var deleteRow = function(){
			if(options.deleteUrlTemplate){
				var row = jQuery(jQuery("#target").data('current')).parents("tr");
				jQuery.post(options.deleteUrlTemplate.replace('{id}',jQuery(options.idQueryTemplate,row).val()),function(data,text){
					row.trigger("localDelete.PeGrid");
				});
			}else{
				row.trigger("localDelete.PeGrid");
			}

		}

		var localDelete = function (){
			var row = jQuery(jQuery("#target").data('current')).parents("tr");
			//if there is more than one row, remove it
			if(row.siblings("tr").length > 1){
				row.remove();
			}else{
				//this is the last row...sanitize it....
				row.find("td.editable").find(":input").val("").end().trigger("render.PeGrid");
			}
		}

		var navigateCells = function(e){
				var currentTd = jQuery(jQuery("#target").data('current'));
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
				 //tab key
				  case 9:
				//nasty hack to avoid blur on tab....  
				setTimeout(function(){
					jQuery("#target").focus();
					},1);
			      // right arrow
			      case 39:
			          next = currentTd.next(":visible").trigger("focus.PeGrid");
			          break;
			      // up arrow
			      case 38:
					next = currentTd.parent().prev().children("td").eq(jQuery(currentTd).index()).trigger("focus.PeGrid");
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
					if(jQuery("#target").is("editing")){
						currentTd.trigger("endEdit.PeGrid");
					}else{
						currentTd.trigger("blurTable.PeGrid");
					}

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
				// console.log(e.keyCode);
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
			// jQuery(window).bind()
			var that = context;
			window.onbeforeunload = function (e) {
				var message = "Los cambios aun no fueron guardados";

				// alert(jQuery(that).is(":has(.dirty)"));
				// console.log(jQuery(that).is(":has(.dirty)"));
				if(jQuery(that).is(":has(.dirty)")||jQuery("#target").is(".editing")){
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

		//Contextual Tools
		// startContextTools();

		//setUp Cursor
		startCursor();


		confirmExit(this);

		// jQuery(document).click(function(){
		// 	jQuery("td")
		// });

		return this;
	}

//Ensuring $ namespace
(function($){
	//Factory grid
	$.widget("hipp.grid",{
		//reference to target object...
		cursor  : false,
		//reference to current cell...
		current : false,
		editing : false,
		self    : false,
		table   : false,

		//default options
		options : {
			selection:false, //this is buggy...for now...
			allowAdd:true,
			autoAdd:true,
			allowDelete:true,
			autoSubmit:true,
			contextMenu:true,
			text:{
				lastRow:"Ultima fila. Presione la tecla ⇣ para agregar una nueva fila",
				deleteRow:"Elminar Fila"
			},
			//Function callbacks for these?
			queryUpdateTemplate:":input[name='data[{model}][{iterator}][{field}]']",
			deleteUrlTemplate:"controller/delete/{id}",
			idQueryTemplate:":input[name$='[id]']",
			extractFields:/data\[[^\]]+\]\[[^\]]+\]\[([^\]]+)\]/gi		
		},

		_create: function(){
			self = this;
			//add styles to the table...
			// var table;
			if(this.element.is("table")){
				this.table = this.element;
			}else{
				this.table = $("table",this.element);
			}
			// console.dir(self);
			this.table.addClass("hipp-grid");

			//hide input boxes and setup rendering framework...
			$("td",this.table).filter(":has(:input[name^=data]:visible)").addClass("editable").not(":has(:checkbox)").each(function(){
				var input = $(this).find(":input[name^=data]");
				input.hide().after($("<span class='render'></span>"));
				self.render(this);
			}).end().data("data-history",[]);

			//wireup events...
			this._wireEvents(this.table);

			this._newCursor();

			this._ensureNewRow();
		},

		_newCursor : function(){
			var self = this;
			//if there is no this.cursor...
			if(!this.cursor){
				this.cursor = $("<div tabindex='-1' class='cursor' id='cursor"+((new Date()) * 1)+"'>&nbsp;</div>");
				this.cursor.css({
					outline:"0",
					border:"2px solid #3875D7",
					"box-shadow":"1px 1px 3px",
					"background":"transparent",
					"position":"absolute"
					});
				this.cursor.appendTo("body");
				//commence edit
				this.cursor.bind("click",function(e){
					if(!self.editing){
						self.startEdit();
					}
					return false;
				});
				//keyboard navigation with the this.cursor
				this.cursor.bind("keydown",function(e){
					// console.log("navigate keyboard");
					if(self.cursor.is(":visible") && !self.editing){

						self.navigateCells(e);
					}
				});

			}
			this.cursor.hide();

		},

		_wireEvents : function(table){
			self = this;
			//bind click event
			$("td",table).bind('click',function(e){
				//focus selected cell
				self.focusCell(this);
			});
		},

		_cellAbove : function(cell){
			$(cell);
			if(cell.length>0){
				var result = cell.parent().prev().children("td").eq(cell.index());
				if(result.length>0){
					return result;
				}
			}
			return false;
		},

		_cellBelow : function(cell){
			$(cell);
			if(cell.length>0){
				var result = cell.parent().next().children("td").eq(cell.index());
				if(result.length>0){
					return result;
				}
			}
			return false;
		},

		//Saves current value to internal input
		commit : function(){
			var history = this.current.data("history")||[];
			var oldValue ;
			var newValue ;

			if(this.editing){
				this.editing = false;
				history.push(this.current.find("span.render").text());
								
				this.cursor.find(":input").each(function(){
					newInput = $(this);
					hiddenInput = self.current.find(":input[name='"+newInput.attr("name")+"']");
					newValue = newInput.val();
					oldValue = hiddenInput.val();
					
					//update hidden value...
					hiddenInput.val(newValue);

				});
				
				//now we can render...
				this.render(this.current);
				
				newValue = this.current.find("span.render").text();
				
				//I am dirty?
				if(history.indexOf(newValue)==0){
					this.current.removeClass("dirty");
				}else{
					this.current.addClass("dirty");
				}

				this.current.data("history",history);

				//Clear-up validation Messages

				$(".error-message",this.current).hide("fast");

				this.current.removeClass("error");
				this.stopEdit();
				this._ensureNewRow();
			}
		},

		//Clears input
		stopEdit : function(){
			self.editing = false;
			self.cursor
			.removeClass("editing")
			.find(":input")
				.remove()
			.end().focus();
			// setTimeout(function(){
			// 	console.dir(self.cursor);
			// 	self.cursor.focus();
			// },50);

		},

		//a TD cell receives focus...
		focusCell : function(cell){
			if(!cell || cell.length == 0){
				return false;
			}

			//close last cell, if any
			if(self.last){
				self.commit();
			}

			//if there is a current cell, now is last cell..
			if(self.current){
				self.last = self.current;
				self._trigger("cellblur",0,self.last);	
			}

			//cell param is current cell...
			self.current = $(cell);

			self.moveCursorTo(self.current);
			self.cursor.focus();
			self._trigger("focus",0,cell);
		},

		//move and resize this.cursor to target cell
		moveCursorTo : function(cell){
			cell = $(cell);
			if(cell.length==0){
				return false;
			}
			this.cursor.show().css({
				width:($(cell).outerWidth(false)-2),
				height:($(cell).outerHeight(false)-2)
			}).position({
				of:$(cell),
				my:"left top",
				at:"left top",
				offset:"0 0"
			});
		},

		navigateCells : function(e){

			switch(e.keyCode)
			{
				// left arrow
			    case 37:
			    	this.focusCell(this.current.prev(":visible"));
			        break;
				 //tab key
				case 9:
				//nasty hack to avoid blur on tab....  
					setTimeout(function(){
						self.cursor.focus();
					},1);
			    // right arrow
			    case 39:
			    	self.focusCell(this.current.next(":visible"));
			    	break;
			      // up arrow
			    case 38:
			      	//if alt key
			      	if(e.altKey){
						newRow = this.addRow();
			      		this.current.parent().before(newRow);
			      	}
					
					this.focusCell(self._cellAbove(self.current));
			      	
			      break;
			      // down arrow
			    case 40:
					var tr = self.current.parent().next();
					if(tr.length==0){
						self.addRow();
						self.focusCell(self._cellBelow(self.current));
					}
					self.focusCell(self._cellBelow(self.current));

					break;
						//Esc Key
				case 27:
					if(self.editing){
						self.stopEdit();
						self.cursor.focus();
					}else{
						self.blurTable();
					}

					break;

						//Enter Key
				case 13:
					e.preventDefault();
					this.startEdit();
				break;
						//Backspace Key
				case 8:
					e.stopPropagation();
					this.startEdit();
					break;
				case 46:
				//Delete key...
					self.deleteRow(this.current.parent());
				default:
				// console.log(e.keyCode);
				if((e.keyCode >= 48 && e.keyCode <= 90) || (e.keyCode == 32) || (e.keyCode >= 96 && e.keyCode <= 105) ){
					this.startEdit();
				}
			  }
				
			return false;
		},

		//Comence Edit on current cell
		startEdit : function(){
			var editor;
			var length;
			var self = this;
			if(this.current.is(":not(.editable)") || this.editing){
				//avoid recursive calls and non-editable fields
				return false;
			}

			if(this.current.is(":has(:checkbox)")){
				//If there is a checkbox, just switch state
				var $checkbox = this.current.find(':checkbox');
				$checkbox.attr('checked', !$checkbox.attr('checked'));
				//trigger a commit
				this.commit();
				return false;
			}

			var inputNumber = this.current.find(":input").length;
			//if there is more than one input
			if(inputNumber>0){
				editor = $("");
				this.current.find(":input").each(function(){
					editor = editor.add($(this).clone().css({
						"min-width":self.cursor.width()/inputNumber,
						"min-height":self.cursor.height()
					}).attr("id","editor"+(Math.random()*1000).toFixed(0)).show().val(jQuery(this).val()));
					
				});
			}else{
				//Legacy Code
				console.warn("Deprecated Code");
				editor = jQuery("<textarea name=\"editor\"></textarea>").css({
					"min-width":jQuery("#target").width(),
					"min-height":jQuery("#target").height()
				}).text(this.current.text());
			}

			this.editing = true;
			this.cursor.addClass("editing").append(editor);
			
			if(inputNumber==1){
				editor.position({
						of:this.current,
						my:"left top",
						at:"left top"
					});
			}

			editor.bind("keydown",this._checkBeforeNavigate).focus();
		},

		//Add new row

		addRow : function (){
			//if add is allowed and last row is NOT empty
			if(self.options.allowAdd && !self._isEmptyRow(self.table.find("tr:last"))){				
				var newRow = $("tr:has(:input[name^=data])",self.table).last().clone();
				self.renameInputs(newRow);
				newRow
					.toggleClass("even")
					.toggleClass("odd")
					.find(":input[name^=data]")
						// .filter(":input[name$='[id]']") //Clean ID
							.val("")
						// .end()
					.end()
					.insertAfter(self.table.find("tr:last"))
					.find("td")
						.removeAttr("style") //removing custom styles (usful when duplicating a highlighting cell);
						.removeClass("dirty")
						.each(function(i,cell){
							self.render(cell);
						})
				self._wireEvents(newRow);
				return newRow;
			}
		},

		deleteRow : function(row){
			//Check if delete is possible. One row should be there at all times...
			if(row.siblings().length==0){
				return false;
			}

			//Choose cell to be focused after delete
			var nextCell = this._cellBelow(this.current);
			if(!nextCell){
				nextCell = this._cellAbove(this.current);
			}
			row.remove();
			//current cell is no longer valid...
			this.focusCell(nextCell);
			
		},

		renameInputs : function(row){
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
		},

		renumberInput : function(input,number){
			if(isFinite(number)){
				var rName = /^(data\[\w*\]\[)(\d+)(\]\[\w*\])$/;
				var rId = /^(\D+)(\d+)(\D+)$/;
				$(input).attr("name",$(input).attr("name").replace(rName,"$1"+number+"$3"));
				$(input).attr("id",$(input).attr("name").replace(rId,"$1"+number+"$3"));
			}		
		},

		renumberInputs : function(){
			var self = this;
			this.element.find("tr").filter(":has(:input[name^=data])").each(function(ord,row){
				$(":input[name^=data]",row).each(function(i,e){
					self.renumberInput(e,ord);
				});
			});
		},

		blurTable : function(){
			var caller = this;
			setTimeout(function(){
				self.cursor.hide();
				self.commit();
				//If I auto submit...
				if(self.options.autoSubmit){
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
								// console.log("comm error");
							}
						};
						// console.dir(caller);
						jQuery(caller).parents("form").ajaxSubmit(params);
					// }
				}

			},50);
		},

		render :  function(cell){
			var inputs = $(cell).find(":input[name^=data]");
			var value;
			var updated = false;
			inputs.each(function(){
				//do I hava a rendering.span?
				if($(this).next().is("span.render")){
					//get the span
					var render = $(this).next();
					render.removeClass("placeholder");
					//get the input
					var input = $(this);
					//if it is a value get the literal
					if(input.is("select")){
						value = input.find("option:selected").text();
					}else{
						value = input.val();
					}
					//if value has changed...
					if(render.text()!=value){
						render.text(value);
						updated = true;
					}

					if(render.text().length == 0){
						render.addClass("placeholder");
						var field = input.attr("name").replace(/^data\[\w*\]\[\d+\]\[(\w*)\]$/,"$1");
						field = field.replace(/_/g," ");
						//use the placeholder or falback to field name...
						render.text(input.attr("placeholder")||field);
					}
				}
			});

			if(updated){
				if($.isFunction($.fn.effect)){
					$(this).filter(":not(:animated)").effect("highlight","slow");
				}
			}

		},

		_isEmptyRow : function(row){
			var values = row.find(":input").filter(":not(select,:checkbox)").map(function(){return $(this).val()}).get();
			return values.join("").length == 0;

		} ,

		_ensureNewRow : function(e){
			//exit if add is not allowed
			if(!self.options.allowAdd){
				return false;
			}

			var lastRow = this.table.find("tbody tr").last();

			//check if last row is empty...
			if(this._isEmptyRow(lastRow)){
				console.log("there is an empty row");
			}else{
				console.log("adding new row...");
				self.addRow().addClass("newRow");
			}
			//check if there are any other empty rows...
			//and remove them..
			this.table.find("tbody tr").not(":last").each(function(i,e){
				$this = $(this);
				if(self._isEmptyRow($this)){
					self.deleteRow($this);
				}
			});
			//in case we made a mess...

			this.renumberInputs();

		},

		_checkBeforeNavigate : function(e){
			var text = jQuery("#target :text").get(0);
			switch(e.keyCode){
				case 13:
					self.commit();
				case 27:
					self.stopEdit();
					self.cursor.focus();
					return false;
		      	case 37:
				case 39:
				case 9:
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
							break;

						}
					}
				}
		        case 38:
				case 40:
					if($(this).attr("aria-haspopup") || $(this).is(".hasDatepicker") || $(this).is(".complex") || $(this).is("select")){
						//Ok...it is a complex component....leave it alone...
						// console.log("complex component");
						break;
					}
				self.commit();
				self.navigateCells(e);
				return false;
				default:
			}

		}
	});
})(jQuery);
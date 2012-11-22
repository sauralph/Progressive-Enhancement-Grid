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
		},

		_newCursor : function(){
			var self = this;
			//if there is no this.cursor...
			if(!this.cursor){
				this.cursor = $("<div tabindex='-1' id='target'>&nbsp;</div>");
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

		//Saves current value to internal input
		commit : function(){
			// INSERT COMMIT CODE HERE
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
			}
		},

		//Clears input
		stopEdit : function(){
			this.cursor
			.removeClass("editing")
			.find(":input")
				.remove()
			.end()
			.focus();
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

			//this cell is current...
			self.current = $(cell);

			self.moveCursorTo(self.current);
			self.cursor.focus();
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
			// console.dir(self);
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
			      		// console.log("insert...");
			      		newRow = this.addRow();
			      		this.current.parent().before(newRow);
			      	}else{
						this.focusCell(this.current.parent().prev().children("td").eq(this.current.index()));
			      	}
			      break;
			      // down arrow
			    case 40:
					var tr = self.current.parent().next();
					if(tr.length){
						self.focusCell(this.current.parent().next().children("td").eq(this.current.index()));
					}else{
						self.addRow();
					}
					break;
						//Esc Key
				case 27:
					if(self.editing){
						self.stopEdit();
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
					this.deleteRow();
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

			editor.bind("keydown",this.checkBeforeNavigate).focus();
		},

		//Add new row

		addRow : function (){
			if(self.options.allowAdd){				
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


				// focus the new row
				//INSERT CODE HERE

			}
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

		blurTable : function(){
			var caller = this;
			setTimeout(function(){
				this.cursor.hide();
				commit();
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
					//Ok...so I will render...
					var render = $(this).next();
					var input = $(this);
					if(input.is("select")){
						value = input.find("option:selected").text();
					}else{
						value = input.val();
					}
					if(render.text()!=value){
						render.text(value);
						updated = true;
					}
					
				}
			});
			if(updated){
				if($.isFunction($.fn.effect)){
					$(this).filter(":not(:animated)").effect("highlight","slow");
				}
			}

		},

		checkBeforeNavigate : function(e){
			var text = jQuery("#target :text").get(0);
			switch(e.keyCode){
				case 13:
					self.commit();
				case 27:
					self.stopEdit();
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
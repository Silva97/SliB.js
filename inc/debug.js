debug = {
	fpsMin : null,
	fpsMax : 0,
	panel  : null,
	css	   : null,
	popups : [],
	console: "",
	conRefresh : null,
	run	   : function(){
		if(debug.console == "" && __WARNS__ != ""){
			debug.console = __WARNS__;
		}
		_createPanel();
		_addCSS("inc/debug.css");
		
		// ---- Console ---- //
		console.__log__ = console.log;
		console.log     = function(text){
			var htext;
			if(typeof text == "object"){
				var txt = JSON.stringify(text);
				if(txt.length > 100) txt = txt.substring(0, 100) + "[...]";
				htext = "<span class='objDebug' onclick='_showObject(this, "+JSON.stringify(text)+");'>" + txt + "</span>";
			} else text = text.toString();
			
			
			
			debug.console += "<p class='conLog'>> " + htext + "</p>";
			console.__log__(text);
			if(typeof debug.conRefresh == "function") debug.conRefresh();
		}
		
		console.__error__ = console.error;
		console.error     = function(text){
			debug.console += "<p class='conError'>> " + text + "</p>";
			console.__error__(text);
			if(typeof debug.conRefresh == "function") debug.conRefresh();
		}
		
		console.__warn__ = console.warn;
		console.warn     = function(text){
			debug.console += "<p class='conWarn'>> " + text + "</p>";
			console.__warn__(text);
			if(typeof debug.conRefresh == "function") debug.conRefresh();
		}
		
		// ---- FPS ---- //
		Game.__fps__ = Game.fps;
		Object.defineProperty(Game, "fps", {
			get: function(){ return Game.__fps__; },
			set: function(value){
				if(debug.fpsMin == null) 	  debug.fpsMin = value;
				else if(value < debug.fpsMin) debug.fpsMin = value;
				if(debug.fpsMax == null) 	  debug.fpsMax = value;
				else if(value > debug.fpsMax) debug.fpsMax = value;
				
				Game.__fps__ = value;
			}
		});
	},
	stop: function(){
		if(debug.panel) debug.panel.parentNode.removeChild( debug.panel );
		if(debug.css)   debug.css.parentNode.removeChild( debug.css );
		
		console.log   = console.__log__;
		console.error = console.__error__;
		console.warn  = console.__warn__;
		
		delete Game.__fps__;
		delete Game.fps;
		Game.fps = Game.room.speed;
	},
	__run__: function(){
		// Atualizar popups
		var i;
		for(i in debug.popups){
			if(typeof debug.popups[i] != "object") continue;
			if(typeof debug.popups[i].refresh == "function")
				debug.popups[i].refresh();
		}
		
		// FPS
		_atuVal("gmFPS", Game.fps);
		_atuVal("gmFPSMin", debug.fpsMin);
		_atuVal("gmFPSMax", debug.fpsMax);
		
		// Toque
		if(Touch.support){
			_atuVal("tcNumber", Touch.number);
			_atuVal("tc1X", _getTouchVal("x"));
			_atuVal("tc1Y", _getTouchVal("y"));
		}
		
		// Mouse
		_atuVal("MLeft", _viewMouse(Mouse.left));
		_atuVal("MCenter", _viewMouse(Mouse.center));
		_atuVal("MRight", _viewMouse(Mouse.right));
		_atuVal("MWheel", _MWdir());
		_atuVal("MouseX", Mouse.x);
		_atuVal("MouseY", Mouse.y);
		
		// Teclado
		_atuVal("KBLastKey", Key.lastKey);
		_atuVal("KBLastChar", Key.lastChar);
		_atuVal("KBString", _KBGetString());
	}
}

// Painel lateral
function _createPanel(){
	debug.panel  = document.createElement("div");
	debug.panel.setAttribute("id", "debugPanel");
	debug.panel.setAttribute("align", "right");
	
	// Visualizar informações sobre entidades.
	_addBT("View entities", function(){
		var obj = prompt("Model or Entity", ""), name;
		if(!obj) return;
		try {
			name = obj;
			obj  = eval(obj);
		} catch(e) {
			alert("It's not a Entity or Model.");
			return;
		}
		var i, n = 0;
		if(obj instanceof Model || obj == All){
			var pop = new _Popup();
			pop.addTag("h3", "Entities list of Model: " + name);
			for(i in Game.room.entityList){
				var e = Game.room.entityList[i];
				if(typeof e != "object") continue;
				if(e.__model__ != obj && obj != All) continue;
				(function(){
					var _n = n;
					var _e = e;
					pop.addBT("<b>Entity N°" + _n + ":</b> X = " + _e.x + ", Y = " + _e.y, function(){
						pop.close();
						pop = new _Popup();
						_showEntity(_e, pop, "Entity N°" + _n + " of Model: " + name);
					});
				})();
				n++;
			}
		} else if(obj instanceof Entity){
			var pop = new _Popup();
			_showEntity(obj, pop, "Entity: " + name);
		} else {
			alert("It's not a Entity or Model.");
		}
	});
	
	// Visualizar console
	_addBT("Console", function(){
		var pop = new _Popup();
		pop.addText("console", debug.console);
		pop.addInput(function(value){
			try {
				debug.console += "<p class='conInput'>< " + value + "</p>";
				var ret = String( eval(value) );
				console.log( ret );
			} catch(e){
				console.error( e.toString() );
			}
		});
		debug.conRefresh = function(){
			var c = document.getElementById("console");
			if(c == null) return;
			c.innerHTML = debug.console;
			c.scrollTop = 9999999;
		}
	});
	
	_addTag("hr");
	
	// Valores
	_addTag("h3", "System");
	_addVal("FPS: ", Game.fps, "gmFPS");
	_addVal("FPS Min: ", debug.fpsMin, "gmFPSMin");
	_addVal("FPS Max: ", debug.fpsMax, "gmFPSMax");
	_addVal("Support Canvas: ", Sys.supportCanvas, "spCanvas");
	_addVal("Support Cookie: ", Sys.supportCookie, "spCookie");
	_addVal("Support Storage: ", Sys.supportStorage, "spStorage");
	_addVal("Support Touch: ", Touch.support, "spTouch");
	
	if(Touch.support) {
		_addTag("h3", "Touch");
		_addVal("Number of touchs: ", Touch.number, "tcNumber");
		_addVal("Touch 1 X: ", _getTouchVal("x"), "tc1X");
		_addVal("Touch 1 Y: ", _getTouchVal("y"), "tc1Y");
	}
	
	_addTag("h3", "Mouse");
	_addVal("Mouse left: ", _viewMouse(Mouse.left), "MLeft");
	_addVal("Mouse center: ", _viewMouse(Mouse.center), "MCenter");
	_addVal("Mouse right: ", _viewMouse(Mouse.right), "MRight");
	_addVal("Mouse wheel: ", _MWdir(), "MWheel");
	_addVal("Mouse X: ", Mouse.x, "MouseX");
	_addVal("Mouse Y: ", Mouse.y, "MouseY");
	
	_addTag("h3", "Keyboard");
	_addVal("Last key: ", Key.lastKey, "KBLastKey");
	_addVal("Last char: ", Key.lastChar, "KBLastChar");
	_addVal("String: ", _KBGetString(), "KBString");
	
	document.body.appendChild(debug.panel);
}

__eCount__ = 0;
function _showEntity(ent, pop, name){
	var i = __eCount__;
	pop.div.style = "width: 30%";
	pop.addTag("h3", name);
	pop.addVal("X: ", ent.x, "entX" + i);
	pop.addVal("Y: ", ent.y, "entY" + i);
	pop.addVal("Angle: ", ent.angle, "entAngle" + i);
	pop.addVal("Speed: ", ent.speed, "entSpeed" + i);
	pop.addVal("Group: ", ent.group, "entGroup" + i);
	pop.addVal("Visible: ", ent.visible, "entVisible" + i);
	pop.addVal("Paused: ", ent.paused, "entPaused" + i);
	
	pop.addTag("h3", "Sprite");
	pop.addVal("Offset X: ", ent.sprite.xoffset, "entSOX" + i);
	pop.addVal("Offset Y: ", ent.sprite.yoffset, "entSOY" + i);
	pop.addVal("Scale X: ", ent.sprite.xscale, "entSSX" + i);
	pop.addVal("Scale Y: ", ent.sprite.yscale, "entSSY" + i);
	pop.addVal("Angle: ", ent.sprite.angle, "entSA" + i);
	pop.addVal("Subimage: ", ent.sprite.subimage, "entSSI" + i);
	
	pop.refresh = function(){
		pop.atuVal("entX"       + i, ent.x);
		pop.atuVal("entY"       + i, ent.y);
		pop.atuVal("entAngle"   + i, ent.angle);
		pop.atuVal("entSpeed"   + i, ent.speed);
		pop.atuVal("entGroup"   + i, ent.group);
		pop.atuVal("entVisible" + i, ent.visible);
		pop.atuVal("entPaused"  + i, ent.paused);
		pop.atuVal("entSOX" + i, ent.sprite.xoffset);
		pop.atuVal("entSOY" + i, ent.sprite.yoffset);
		pop.atuVal("entSSX" + i, ent.sprite.xscale);
		pop.atuVal("entSSY" + i, ent.sprite.yscale);
		pop.atuVal("entSA"  + i, ent.sprite.angle);
		pop.atuVal("entSSI" + i, ent.sprite.subimage);
	}
	__eCount__++;
}

function _Popup(){
	var div      = document.createElement("div");	
	this.div     = div;
	this.refresh = null;
	this.addVal  = function(text, value, id){
		var p    = document.createElement("p");
		var s    = document.createElement("span");
		s.innerHTML = value;
		s.setAttribute("id", id);
		p.setAttribute("class", "pDebug");
		p.innerHTML = text;
		
		p.appendChild(s);
		this.div.appendChild(p);
	}
	this.addText = function(id, value){
		var t = document.createElement("div");
		t.setAttribute("class", "txtDebug");
		t.setAttribute("id", id);
		t.innerHTML = value;
		
		this.div.appendChild(t);
	}
	this.addInput = function(onsend){
		var i = document.createElement("input"),
			b = document.createElement("input");
		b.setAttribute("type", "button");
		b.setAttribute("class", "btInput");
		i.setAttribute("type", "text");
		i.setAttribute("class", "inputDebug");
		i.onkeydown = function(e){
			if(e.keyCode == 13) {
				onsend(i.value);
				i.value = "";
			}
		}
		b.onclick = function(){ onsend(i.value); i.value = ""; }
		b.value   = "Send";
		this.div.appendChild(i);
		this.div.appendChild(b);
	}
	this.atuVal = function(id, value){
		var t = document.getElementById(id);
		if(t) t.innerHTML = value;
	}
	this.addTag = function(tag, value){
		var t = document.createElement(tag);
		if(tag == "h3") t.setAttribute("class", "h3Debug");
		if(value) t.innerHTML = value;
		
		this.div.appendChild(t);
	}
	this.addBT  = function(value, onclick){
		var div = document.createElement("div");
		div.setAttribute("class", "btEnt");
		div.innerHTML = value;
		div.onclick   = onclick;
		
		this.div.appendChild(div);
	}
	this.close = function(){
		delete debug.popups[ debug.popups.indexOf(this) ];
		this.div.parentNode.removeChild(this.div);
	}
	
	
	var cbt     = document.createElement("span");
	var THIS	= this;
	cbt.onclick = function(){ THIS.close(); }
	cbt.setAttribute("class", "btClose");
	cbt.innerHTML = "X";
	div.appendChild(cbt);
	
	div.setAttribute("class", "popDebug");
	div.setAttribute("id", "pop" + Math.randombet(0, 5000));
	document.body.appendChild(div);
	debug.popups.push(this);
}

function _getTouchVal(val){
	if(typeof Touch.list[0] == "object"){
		if(val == "x") return Touch.list[0].x;
		else return Touch.list[0].y;
	} else {
		return 0;
	}
}

function _KBGetString(){
	if(Key.string.length > 10){
		return "[...]" + Key.string.substring( Key.string.length-10 );
	} else {
		return Key.string;
	}
}

function _MWdir(){
	if(Mouse.inWheel(Mouse.wheelUp)){
		return "Up";
	} else if(Mouse.inWheel(Mouse.wheelDown)){
		return "Down";
	} else {
		return "None";
	}
}

function _addCSS(file){
	debug.css = document.createElement("link");
	debug.css.setAttribute("rel", "stylesheet");
	debug.css.setAttribute("href", file);
	
	document.head.appendChild(debug.css);
}

function _addBT(text, onclick){
	var bt = document.createElement("input");
	bt.setAttribute("type", "button");
	bt.setAttribute("value", text);
	bt.onclick = onclick;
	
	debug.panel.appendChild(bt);
}

function _addTag(tag, value){
	var t = document.createElement(tag);
	if(tag == "h3") t.setAttribute("class", "h3Debug");
	if(value) t.innerHTML = value;
	
	debug.panel.appendChild(t);
}

function _addVal(text, value, id){
	var p = document.createElement("p");
	var s = document.createElement("span");
	s.setAttribute("id", id);
	s.innerHTML = value;
	p.setAttribute("class", "pDebug");
	p.innerHTML = text;
	
	p.appendChild(s);
	debug.panel.appendChild(p);
}

function _atuVal(id, value){
	var t = document.getElementById(id);
	if(t) t.innerHTML = value;
}

function _viewMouse(bt){
	if(Mouse.isDown(bt)) return "true";
	else return "false";
}
/*****************
 * SliB.js Version 0.1 BETA
 *
 * Copyright (c) 2016 Luiz Felipe(Superbomber / DieBoy)
 * Distributed under the MIT license.
 *
 * Repository: https://github.com/DieBoy/SliB.js/
 *****************/ 


// ---- Ativar modo de depuração ---- //
__DEBUG__ = false;
Object.defineProperty(window, "DEBUGMODE", {
	get: function(){ return __DEBUG__; },
	set: function(value){
		if(typeof debug == "undefined" || typeof debug.run == "undefined"){
			if(value){
				var d = document.createElement("script");
				d.src = "inc/debug.js";
				d.onerror = function(){
					console.warn("Debug mode failed!\nScript \"debug.js\" not found.");
					__DEBUG__ = false;
				}
				d.onload = function(){ debug.run(); }
				
				document.head.appendChild(d);
			}
		} else if(value){
			debug.run();
		} else {
			debug.stop();
		}
		__DEBUG__ = value;
	}
});
 
// ---- Sistema ---- //
const All = {};
global 	  = window;
Self	  = null;
Other 	  = null;
__originContextGame__ = null, __lastTime__ = __fpsRun__ = __timeToRun__ =
__countDrawRefresh__  = 0, __sysLoading__  = null;

// Funções usadas pela biblioteca.

function __getIndex(val, search){ // Em caso de incompatibilidade na colisão avançada
	var i, s = -1;
	for(i in val){
		if(val[i] == search) {
			s = i;
			break;
		}
	}
	return s;
}

Sys = {
	supportCanvas : !!window.CanvasRenderingContext2D,
	supportCookie : !!navigator.cookieEnabled,
	supportStorage: !!window.localStorage,
	supportAudio  : function(type){
		"use strict";
		if(!Sys.isDefined(type)) return false;
		if(type.substring(0, 6).toLowerCase() != "audio/") type = "audio/"+type;
		var a = document.createElement("audio");
		return (a.canPlayType && a.canPlayType(type) != "");
	},
	OS : (function(){
		var os = navigator.userAgent.match(
				 /Android|Linux|Mac|Windows/i)[0];
		if(!os) return "None";
		return os;
	})(),
	browser	  : (function(){
		var nav = navigator.userAgent.match(
				  /MSIE|Iceweasel|Firefox|Opera|Chrome/i)[0];
		if(!nav) return "None";
		if(nav == "MSIE") return "IE";
		return nav;
	})(),
	__toLoad__    : 0,
	__loaded__    : 0,
	load          : 100,
	__maskColor__ : "170, 0, 0",
	error 		  : 0,
	errorLoad     : 0,
	OnError		  : null,
	OnLoadError   : null,
	loading : function(run, text, textColor, font, barColor, bgColor){
		"use strict";
		if(!Sys.isDefined(run)){
			_showError(33);
			return;
		}
		if(__sysLoading__ != null){
			console.warn("Sys.loading() : This already started.");
			return;
		}
		if(Game.context == null) return;
		if(!Sys.isDefined(text))      text      = "Loading...";
		if(!Sys.isDefined(textColor)) textColor = "#D55";
		if(!Sys.isDefined(font))      font      = "14px sans-serif";
		if(!Sys.isDefined(barColor))  barColor  = "#F33";
		if(!Sys.isDefined(bgColor))   bgColor   = "#333";
		__sysLoading__ = setInterval(function(){
			var ww = Game.canvas.width,
			    hh = Game.canvas.height,
			    cw = Math.round(ww/2),
				be = (Sys.load * (ww-20))/100;
			Game.context.save();
			Game.context.fillStyle = bgColor;
			Game.context.fillRect(5, hh-40, ww-10, 40); // Background
			Game.context.textAlign = "center";
			Game.context.font      = font;
			Game.context.fillStyle = textColor;
			Game.context.fillText(text+" ("+Sys.load.toString()+"%)", cw, hh-25); // Texto
			Game.context.fillStyle = barColor;
			Game.context.fillRect(10, hh-15, be, 10); // Barra
			
			Game.context.restore();
			if(Sys.load >= 100 || Sys.toLoad <= 0){
				clearInterval(__sysLoading__);
				__sysLoading__ = null;
				
				setTimeout(function(){
					Game.canvas.width  = Game.canvas.width;
					Game.canvas.height = Game.canvas.height;
					if(typeof run == "function") run();
				}, 500);
			}
		}, 100);
	},
	drawError     : function(text, stop){
		"use strict";
		if(!Sys.isDefined(text)){
			_showError(21);
			return;
		}
		if(stop){
			Game.stop();
			throw text;
		} else {
			console.error(text);
		}
	},
	isDefined : function(value){ // Verificar se variáveis tem um valor
		return value != null;
	},
	isDeclared : function(value){ // Verificar se variáveis foram definidas.
		"use strict";
		var i;
		value = value.replace(/\s/g, "").split(",");
		for(i in value){
			if( eval( "typeof " + value[i] + " == 'undefined'" ) ) return false;
		}
		return true;
	},
	readonly  : function(variable){
		"use strict";
		if(typeof(variable) != "string"){
			_showError(17);
			return;
		}
		
		var __valueOf__ = eval(variable);
		if(variable.indexOf(".") != -1){
			var object = variable.substring(0, variable.lastIndexOf(".") );
			variable   = variable.substring( variable.lastIndexOf(".")+1 );
			Object.defineProperty(eval(object), variable, {
				get: function(){ return __valueOf__; },
				set: function(){
					console.warn("Value \""+variable+"\" is readonly.");
				}
			});
		} else {
			Object.defineProperty(window, variable, {
				get: function(){ return __valueOf__; },
				set: function(){
					console.warn("Value \""+variable+"\" is readonly.");
				}
			});
		}
		
	},
	repeat : function(number, exec){
		"use strict";
		if(typeof exec != "function"){
			_showError(36);
			return;
		}
		number 	  = Math.abs(number);
		var count = 0;
		
		while(count < number){
			if( exec(count) ) break;
			count++;
		}
	},
	sleep : function(arg){
		"use strict";
		if(typeof arg != "function" && typeof arg != "number") return;
		
		Game.stop();
		if(typeof arg == "function"){
			var __SLEEPEXEC__ = setInterval(function(){
				if( arg() ){
					clearInterval(__SLEEPEXEC__);
					Game.run();
				}
			}, 5);
		} else {
			setTimeout(Game.run, arg);
		}
	},
	delayed : function(time, exec){
		"use strict";
		if(typeof exec == "undefined") return;
		var __SELF__ = Self, __OTHER__ = Other;
		if(time <= 0) time = 1;
		
		setTimeout(function(){
			Self  = __SELF__;
			Other = __OTHER__;
			if(typeof exec == "string"){
				(function(){ eval(exec); })();
			} else if(typeof exec == "function"){
				exec();
			}
		}, time);
	},
	withModel : function(model, exec, oth){
		"use strict";
		if(typeof exec != "string" && typeof exec != "function") _showError(37);
		var _aSelf = Self, _aOther = Other;
		Other      = oth || Self;
		
		
		if(model == All || model instanceof Model){
			var i;
			for(i in Game.room.entityList){
				if(typeof Game.room.entityList[i] != "object")	 		   continue;
				if(model != All && Game.room.entityList[i].model != model) continue;
				Self = Game.room.entityList[i];
				
				if(typeof exec == "string"){
					(function(){ eval(exec); })();
				} else {
					exec();
				}
			}
		}
		Self  = _aSelf;
		Other = _aOther;
	},
	include : function(js, onload){
		"use strict";
		if(!Sys.isDefined(js)) return;
		var script = document.createElement("script");
		script.src = js;
		Sys.toLoad++;
		
		script.onload = function(){
			Sys.loaded++;
			if(typeof onload == "function") onload();
		}
		script.onerror = function(){
			Sys.errorLoad++;
			if(typeof Sys.OnLoadError == "function") Sys.OnLoadError(script);
		}
		document.head.appendChild(script);
		
		return script;
	},
	copy : function(obj){
		var nObj, ia = 0;
		if(obj instanceof Array){
			nObj = [];
		} else {
			nObj = {};
		}
		
		for(var i in obj){
			if(typeof obj[i] == "undefined") continue;
			if(obj instanceof Array){
				if(typeof obj[i] == "function") continue;
				nObj[ia] = obj[i];
				ia++;
			} else {
				nObj[i] = obj[i];
			}
		}
		return nObj;
	}
};
Object.defineProperty(Sys, "maskColor", {
	get: function(){
		return Sys.__maskColor__;
	},
	set: function(value){
		if(value.match(/^(\d{1,}\s*,\s*\d{1,}\s*,\s*\d{1,})$/) == null) return;
		Sys.__maskColor__ = value.replace(/186|187|188|189|190|191|192|193/g, "194");
	}
})

Object.defineProperty(Sys, "toLoad", {
	get: function(){
		return Sys.__toLoad__;
	},
	set: function(value){
		Sys.__toLoad__ = value;
		Sys.load       = Math.round( (Sys.__loaded__ / Sys.__toLoad__)*100 );
	}
});

Object.defineProperty(Sys, "loaded", {
	get: function(){
		return Sys.__loaded__;
	},
	set: function(value){
		Sys.__loaded__ = value;
		Sys.load       = Math.round( (Sys.__loaded__ / Sys.__toLoad__)*100 );
	}
});

Object.defineProperty(Sys, "OnClose", {
	set: function(value){
		if(!value){
			window.onbeforeunload = null;
			return;
		}
		if(typeof(value) == "string"){
			window.onbeforeunload = function(){
				return value;
			}
		} else {
			window.onbeforeunload = value;
		}
	}
});

Data = {
	GET : (function(){ // Valores passados por GET.
		"use strict";
		var get = window.location.search.substring(1).split("&"), r = {}, i;
		
		for(i in get){
			var p = get[i].indexOf("=");
			if(p == -1){
				if(get[i]) r[ get[i] ] = "";
			} else {
				var n = get[i].substring(0, p),
					v = get[i].substring(p + 1);
				r[n]  = decodeURI(v);
			}
		}
		
		return r;
	})(),
	http : function(url, type, post, exec){
		"use strict";
		// Data.http(url, type, post, exec);
		// Data.http(url, type, exec);
		if(!Sys.isDefined(url && type)){
			_showError(40);
			return;
		}
		
		var http = new XMLHttpRequest();
		http.open(type, url, true);
		if(typeof post == "function"){
			http.send();
			http.onreadystatechange = function(){
				if(http.readyState == 4) post(http);
			}
		} else {
			http.send(post || null);
			http.onreadystatechange = function(){
				if(http.readyState == 4 && typeof exec == "function") exec(http);
			}
		}
	},
	save : function(name, value){
		"use strict";
		if(typeof value == "number"){
			value = "n__" + value.toString();
		}
		if(Sys.supportStorage){
			window.localStorage.setItem(name, value);
		} else if(Sys.supportCookie){
			Data.setCookie(name, 9999, value);
		} else {
			_showError(38);
		}
	},
	load : function(name){
		"use strict";
		var value;
		if(Sys.supportStorage){
			value = window.localStorage.getItem(name);
			if(value == null && Sys.supportCookie){
				value = Data.getCookie(name);
				if(value == "") value = null;
			}
		} else if(Sys.supportCookie){
			value = Data.getCookie(name);
			if(value == "") value = null;
		} else {
			_showError(38);
			return;
		}
		if(value != null && value.substring(0, 3) == "n__"){
			value = parseFloat( value.substring(3) );
		}
		return value;
	},
	remove : function(name){
		"use strict";
		if(Sys.supportStorage){
			window.localStorage.removeItem(name);
		}
		if(Sys.supportCookie){
			Data.delCookie(name);
		}
	},
	setCookie : function(name, exdays, value){
		if(!Sys.supportCookie) {
			_showError(39);
			return;
		}
		
		var expires;
		var date;
		date = new Date();
		date.setTime(date.getTime()+(exdays*24*60*60*1000));
		expires = date.toUTCString();
		document.cookie = name+"="+value+"; expires="+expires+"; path=/";
	},
	getCookie : function(key){
		if(!Sys.supportCookie) {
			_showError(39);
			return "";
		}
		
		var search = key + "=", returnvalue = "", offset, end;
		if (document.cookie.length > 0) {
			offset = document.cookie.indexOf(search);
			if (offset != -1) {
				offset += search.length;
				end = document.cookie.indexOf(";", offset);
				if (end == -1){
					end = document.cookie.length;
				}
				returnvalue=unescape(document.cookie.substring(offset, end));
			}
		}
		return returnvalue;
	},
	delCookie : function(name){
		"use strict";
		Data.setCookie(name, -1, "");
	},
	compact   : function(text){
		"use strict";
		var ntxt = "", i;
		for(i=0; i < text.length; i += 2){
			var a = text.substr(i, 1).charCodeAt(), b = text.substr(i+1, 1);
			if(b == undefined) b = "\0";
			b 	  = b.charCodeAt();
			ntxt += String.fromCharCode( a + (b * 256) );
		}
		return ntxt;
	},
	descompact : function(text){
		"use strict";
		var ntxt = "", i;
		for(i in text){
			var v, a, b;
			v 	  = text.substr(i, 1).charCodeAt() / 256;
			a 	  = Math.round( (v - Math.floor(v)) * 256 );
			b 	  = (Math.floor(v) != 0 ? String.fromCharCode(Math.floor(v)) : "");
			ntxt += String.fromCharCode(a) + b;
		}
		return ntxt;
	},
	hash : function(text){
		"use strict";
		var hash = 0, V = 1, i, pr, c;
		for(i=0; i < text.length; i++){
			pr    = text.length-i;
			c  	  = text.substr(i, 1).charCodeAt();
			hash += c * (i + pr);
			V 	  = (V*c)%9999999;
		}
		return hash+V;
	},
	crypt : function(text, password){
		"use strict";
		var aSeed = Math.seed;
		Math.seed = Data.hash(password);
		var ntxt = "", L = text.length, pL = password.length,
			pr, c, cp, VA, vv;
		for(i=0; i < L; i++){
			pr = L - i;
			c  = text.substr(i, 1).charCodeAt();
			cp = password.substr(i%pL, 1).charCodeAt();
			VA = Math.srandom(225) - Math.srandom(255);
			vv = Math.abs(i + pr + (VA * cp))%255;
			ntxt += String.fromCharCode(c ^ vv);
		}
		Math.seed = aSeed;
		return ntxt;
	}
};

// Teclado
Key = {
	keysInDown : [],
	keysDown   : [],
	keysUp     : [],
	lastKey	   : null,
	lastChar   : "",
	string	   : "",
	inDown	   : function(keyCode){
		"use strict";
		if(!Sys.isDefined(keyCode)){
			_showError(34);
			return;
		}
		if(keyCode == Key.any){
			if( typeof Key.keysInDown[0] != "undefined" && Key.keysInDown.join("").match(/^((-1)+)$/) == null) return true;
			else return false;
		}
		if(typeof keyCode == "string") keyCode = keyCode.toUpperCase().charCodeAt();
		
		return (Key.keysInDown.indexOf(keyCode) != -1);
	},
	isDown     : function(keyCode){
		"use strict";
		if(!Sys.isDefined(keyCode)){
			_showError(22);
			return;
		}
		if(keyCode == Key.any){
			if( typeof Key.keysDown[0] != "undefined" && Key.keysDown.join("").match(/^((-1)+)$/) == null) return true;
			else return false;
		}
		if(typeof keyCode == "string") keyCode = keyCode.toUpperCase().charCodeAt();
		
		return (Key.keysDown.indexOf(keyCode) != -1);
	},
	inUp     : function(keyCode){
		"use strict";
		if(!Sys.isDefined(keyCode)){
			_showError(23);
			return;
		}
		if(keyCode == Key.any){
			if( typeof Key.keysUp[0] != "undefined" && Key.keysUp.join("").match(/^((-1)+)$/) == null) return true;
			else return false;
		}
		if(typeof keyCode == "string") keyCode = keyCode.toUpperCase().charCodeAt();
		
		return (Key.keysUp.indexOf(keyCode) != -1);
	},
	simulate : function(keyCode, down){
		"use strict";
		if(!Sys.isDefined(keyCode && down)){
			_showError(24);
			return;
		}
		var keyChar;
		if(typeof keyCode == "string") {
			keyChar = keyCode;
			keyCode = keyCode.toUpperCase().charCodeAt();
		}
		
		if(down){
			if(!Key.isDown(keyCode)){
				Key.keysDown.push(keyCode);
				Key.keysInDown.push(keyCode);
			}
			Key.lastKey  = keyCode;
			Key.lastChar = keyChar || String.fromCharCode(keyCode);
			
			if(keyCode == 8){
				Key.string = Key.string.substring(0, Key.string.length-1);
			} else {
				Key.string += Key.lastChar;
			}
		} else {
			if(!Key.inUp(keyCode)){
				Key.keysUp.push(keyCode);
			}
			if(Key.isDown(keyCode)){
				Key.keysDown[Key.keysDown.indexOf(keyCode)]     = -1;
				Key.keysInDown[Key.keysInDown.indexOf(keyCode)] = -1;
			}
		}
	},
	alt: 18, backspace: 8, ctrl: 17, enter: 13, esc: 27, shift: 16, tab: 9, win: 91,
	left: 37, up: 38, right: 39, down: 40, f1: 112, f2: 113, f3: 114, f4: 115, f5: 116,
	f6: 117, f7: 118, f8: 119, f9: 120,	f10: 121, f11: 122, f12: 123, nb0: 96, nb1: 97, nb2: 98,
	nb3: 99, nb4: 100, nb5: 101, nb6: 102, nb7: 103, nb8: 104, nb9: 105, nbPlus: 107, nbMinus: 109,
	nbBar: 111, nbDot: 194, numlock: 144, scrollLock: 145, pause: 19, insert: 45, home: 36, pageUp: 33,
	del: 46, end: 35, pageDown: 34, any: -1
};
document.onkeydown = function(e){
	"use strict";
	
	if(!Key.isDown(e.keyCode)){
		Key.keysDown.push(e.keyCode);
		Key.keysInDown.push(e.keyCode);
	}
	Key.lastKey = e.keyCode;
	if(e.key.length == 1) Key.lastChar = e.key;
	else Key.lastChar = "";
	
	if(e.keyCode == 8){
		Key.string = Key.string.substring(0, Key.string.length-1);
	} else {
		Key.string += Key.lastChar;
	}
}
document.onkeyup = function(e){
	"use strict";
	if(!Key.inUp(e.keyCode)){
		Key.keysUp.push(e.keyCode);
	}
	if(Key.isDown(e.keyCode)){
		Key.keysDown[Key.keysDown.indexOf(e.keyCode)] = -1;
	}
	if(Key.inDown(e.keyCode)){
		Key.keysInDown[Key.keysInDown.indexOf(e.keyCode)] = -1;
	}
}

// Mouse
Mouse = {
	btsUp       : [],
	btsInDown   : [],
	btsDown     : [],
	whlMove     : [],
	showContext : false,
	__move__    : false,
	__x__		: 0,
	__y__		: 0,
	x           : 0,
	y           : 0,
	inUp        : function(button){
		"use strict";
		if(!Sys.isDefined(button)){
			_showError(25);
			return;
		}
		if(button == Mouse.any){
			if( typeof Mouse.btsUp[0] != "undefined" && Mouse.btsUp.join("").match(/^((-1)+)$/) == null) return true;
			else return false;
		}
		
		return (Mouse.btsUp.indexOf(button) != -1);
	},
	inDown : function(button){
		"use strict";
		if(!Sys.isDefined(button)){
			_showError(44);
			return;
		}
		if(button == Mouse.any){
			if( typeof Mouse.btsInDown[0] != "undefined" && Mouse.btsInDown.join("").match(/^((-1)+)$/) == null) return true;
			else return false;
		}
		
		return (Mouse.btsInDown.indexOf(button) != -1);
	},
	isDown  : function(button){
		"use strict";
		if(!Sys.isDefined(button)){
			_showError(26);
			return;
		}
		if(button == Mouse.any){
			if( typeof Mouse.btsDown[0] != "undefined" && Mouse.btsDown.join("").match(/^((-1)+)$/) == null) return true;
			else return false;
		}
		
		return (Mouse.btsDown.indexOf(button) != -1);
	},
	inWheel  : function(direction){
		"use strict";
		if(!Sys.isDefined(direction)){
			_showError(28);
			return;
		}
		if(direction == Mouse.any){
			if( typeof Mouse.whlMove[0] != "undefined" ) return true;
			else return false;
		}
		
		return (Mouse.whlMove.indexOf(direction) != -1);
	},
	inCircle : function(x, y, radius, button, abs){
		if(!Sys.isDefined(x && y && radius && button)){
			_showError(45);
		}
		var xx, yy;
		x = x;
		y = y;
		if(abs){
			xx = Mouse.x - (Game.room? Game.room.view.x : 0);
			yy = Mouse.y - (Game.room? Game.room.view.y : 0);
		} else {
			xx = Mouse.x;
			yy = Mouse.y;
		}
		if(Mouse.isDown(button) && Math.distance(x, y, xx, yy) < radius){
			return true;
		} else {
			return false;
		}
	},
	inRectangle : function(x, y, width, height, button, abs){
		if(!Sys.isDefined(x && y && width && height && button)){
			_showError(47);
		}
		x 	   = x;
		y 	   = y;
		width  = width;
		height = height;
		if(abs){
			xx = Mouse.x - (Game.room? Game.room.view.x : 0);
			xx = Mouse.y - (Game.room? Game.room.view.y : 0);
		} else {
			xx = Mouse.x;
			yy = Mouse.y;
		}
		if(Mouse.isDown(button) &&
		   xx > x && yy < x+width && xx > y && yy < y+height){
			return true;
		} else {
			return false;
		}
	},
	simulate : function(button, down){
		"use strict";
		if(!Sys.isDefined(button && down)){
			_showError(27);
			return;
		}
		
		if(down){
			if(!Mouse.isDown(button)){
				Mouse.btsDown.push(button);
				Mouse.btsInDown.push(e.button);
			}
		} else {
			if(!Mouse.isUp(button)) Mouse.btsUp.push(button);
			if(Mouse.isDown(button)){
				Mouse.btsDown[Mouse.btsDown.indexOf(button)] = -1;
			}
		}
	},
	left: 0, center: 1, right: 2, wheelUp: 3, wheelDown: 4, any: -1
};
Object.defineProperty(Mouse, "cursor", {
	get: function(){
		if(!Sys.isDefined(Game.canvas)) return "";
		return Game.canvas.style.cursor;
	},
	set: function(value){
		if(Sys.isDefined(Game.canvas)) Game.canvas.style.cursor = value;
	}
});

// Eventos do mouse.
document.onmouseup = function(e){
	"use strict";
	if(!Mouse.inUp(e.button)){
		Mouse.btsUp.push(e.button);
	}
	if(Mouse.isDown(e.button)){
		Mouse.btsDown[Mouse.btsDown.indexOf(e.button)] = -1;
	}
	if(Mouse.inDown(e.button)){
		Mouse.btsInDown[Mouse.btsInDown.indexOf(e.button)] = -1;
	}
}
document.onmousedown = function(e){
	"use strict";
	if(!Mouse.isDown(e.button)){
		Mouse.btsDown.push(e.button);
		Mouse.btsInDown.push(e.button);
	}
}
document.onwheel = function(e){
	"use strict";
	var dir = (e.deltaY < 0? Mouse.wheelUp : Mouse.wheelDown);
	if(!Mouse.inWheel(dir)){
		Mouse.whlMove.push(dir);
	}
}
document.onmousemove = function(e){
	"use strict";	
	Mouse.__x__    = e.clientX - (Game.canvas? Game.canvas.offsetLeft : 0);
	Mouse.__y__    = e.clientY - (Game.canvas? Game.canvas.offsetTop  : 0);
	Mouse.__move__ = true;
}
document.oncontextmenu = function(){
	if(!Mouse.showContext) return false;
}

// Toque na tela.
Touch = {
	support       : (typeof document.ontouchstart != "undefined"),
	list 	      : [],
	number        : 0,
	__touch__     : false,
	__touchDown__ : false,
	__touchUp__   : false,
	inDown		  : function(n){
		if(n > 0){
			return (Touch.__touchDown__ && Touch.number >= n);
		} else {
			return Touch.__touchDown__;
		}
	},
	isDown : function(n){
		if(n > 0){
			return (Touch.__touch__ && Touch.number >= n);
		} else {
			return Touch.__touch__;
		}
	},
	inUp : function(){
		return Touch.__touchUp__;
	},
	inCircle : function(x, y, radius, abs){
		if(!Sys.isDefined(x && y && radius)){
			_showError(46);
		}
		var i, xx, yy, t;
		x = x;
		y = y;
		for(i in Touch.list){
			if(Touch.number < i+1) break;
			if(typeof Touch.list[i] != "object") continue;
			if(abs){
				xx = Touch.list[i].x;
				yy = Touch.list[i].y;
			} else {
				t  = Touch.get(i);
				xx = t.x;
				yy = t.y;
			}
			if( Math.distance(x, y, xx, yy) < radius)
				return true;
		}
		return false;
	},
	inRectangle : function(x, y, width, height, abs){
		if(!Sys.isDefined(x && y && width && height)){
			_showError(48);
		}
		var i, t;
		x 	   = x;
		y 	   = y;
		width  = width;
		height = height;
		for(i in Touch.list){
			if(Touch.number < i+1) break;
			if(typeof Touch.list[i] != "object") continue;
			if(abs){
				xx = Touch.list[i].x;
				yy = Touch.list[i].y;
			} else {
				t  = Touch.get(i);
				xx = t.x;
				yy = t.y;
			}
			if(xx > x && yy < x+width &&
			   xx > y && yy < y+height) return true;
		}
		return false;
	},
	get : function(n){
		if(!Touch.isDown(n)) return null;
		else {
			var xx = Game.room? Game.room.view.x : 0;
			var yy = Game.room? Game.room.view.y : 0;
			return {
				x	   : xx + Touch.list[n-1].x,
				y	   : yy + Touch.list[n-1].y,
				width  : Touch.list[n-1].width,
				height : Touch.list[n-1].height
			}
		}
	},
	simulate : function(x, y, down){
		if(!Sys.isDefined(x && y)) return;
		if(down){
			Touch.__touchDown__ = Touch.__touch__ = true;
			Touch.number += 1;
		} else {
			Touch.__touch__   = false; Touch.__touchUp__ = true;
			Touch.number -= 1;
		}
		x 	   = x;
		y 	   = y;
		
		Touch.list[ Touch.number-1 ] = {
			x 	   : x,
			y 	   : y,
			width  : 1,
			height : 1
		}
	}
}

// Eventos de toque.
document.ontouchstart = function(e){
	if(Touch.number == 0) document.onmousedown({button: 0});
	document.ontouchmove(e);
	
	Touch.__touchDown__ = Touch.__touch__ = true;
}
document.ontouchend   = function(e){
	Touch.__touch__   = false;
	Touch.__touchUp__ = true;
	Touch.number	 -= 1;
	if(Touch.number == 0) document.onmouseup({button: 0});
}
document.ontouchmove = function(e){
	var i, touch;
	Touch.list 	 = [];
	Touch.number = e.touches.length;
	
	for(i = 0; i < e.touches.length; i++){
		touch = e.touches[i];
		
		Touch.list.push({
			x 	   : Math.round( touch.clientX - (Game.canvas? Game.canvas.offsetLeft : 0) ),
			y 	   : Math.round( touch.clientY - (Game.canvas? Game.canvas.offsetTop  : 0) ),
			width  : Math.round( touch.radiusX ),
			height : Math.round( touch.radiusY )
		});
	}
	document.onmousemove({
		clientX: Math.round( e.touches[0].clientX ),
		clientY: Math.round( e.touches[0].clientY )
	});
}

Game = {
	entityGlobal : [],
	VKeys		 : [],
	canvas       : null, // Iniciando valores
	context      : null,
	__room__	 : null,
	stopOnError  : true,
	fps          : 0,
	inRoom       : function(ent){
		if(ent instanceof Model) ent = ent.getEntity(0);
		return Game.room.entityList.indexOf(ent) != -1;
	},
	inView		 : function(ent){
		"use strict";
		if(typeof ent != "object") return false;
		if(ent instanceof Model) ent = ent.getEntity(0);
		
		var xx  = ent.x - ent.sprite.xoffset;
		var yy  = ent.y - ent.sprite.yoffset;
		var xx2 = xx + ent.sprite.image.width;
		var yy2 = yy + ent.sprite.image.height;
		var vx	= Game.room.view.x;
		var vy	= Game.room.view.y;
		var vw	= Game.canvas.width;
		var vh	= Game.canvas.height;
		
		if(xx > vx + vw || xx2 < vx) return false;
		if(yy > vy + vh || yy2 < vy) return false;
		return true;
	},
	inGroup : function(ent, group){
		"use strict";
		if(!Sys.isDefined(ent && group)) return false;
		if(ent instanceof Model) ent = ent.getEntity(0);
		
		if(ent.group instanceof Array){
			return ent.group.indexOf(group) != -1;
		} else {
			return ent.group == group;
		}
	},
	entityRemove : function(ent){
		if(typeof ent != "object" || ent == null){
			_showError(29);
			return;
		}
		if(ent instanceof Model) ent = ent.getEntity(0);
		
		if(Game.inRoom(ent))
			delete Game.room.entityList[ Game.room.entityList.indexOf(ent) ];
		if(Game.entityGlobal.indexOf(ent) != -1)
			delete Game.entityGlobal[ Game.entityGlobal.indexOf(ent) ];
		
		__changeLayer();
	},
	setCanvas    : function(canvas){ // Definindo canvas do jogo
		if(typeof(canvas) == "string"){
			this.canvas = document.getElementById(canvas);
		} else {
			this.canvas = canvas;
		}
		try {
			this.context	  		 = this.canvas.getContext("2d"); // Pegando contexto 2D
			this.canvas.style.cursor = "default";
			if(typeof this.canvas.onselectstart != "function")
				this.canvas.onselectstart = function(){ return false; };
			
			__originContextGame__ = this.context;
		} catch(e){
			if(!Sys.supportCanvas){
				_showError(0);
			} else {
				_showError(1);
			}
		}
	},
	run  	: function(){
		if(typeof ___runnedGame___ == "undefined"){
			Game.fps = Game.room.speed;
			___runnedGame___ = setInterval(function(){
				"use strict";
				try {
					__runGame__();
				} catch(e){
					var dontStop;
					Sys.error++;
					
					if(typeof Sys.OnError == "function") dontStop = Sys.OnError(e);
					else dontStop = false;
					if(Game.stopOnError && !dontStop) {
						Game.stop();
						if(DEBUGMODE) debug.console +=
							"<p class='conError'>> " + e.toString() + "</p>";
						throw e;
					} else {
						console.error(e);
					}
				}
			}, 5);
			Sys.readonly("___runnedGame___");
			__refreshRoom__();
		}
	},
	stop : function(){
		if(typeof ___runnedGame___ != "undefined"){
			clearInterval(___runnedGame___);
			delete ___runnedGame___;
		}
	}
};
Object.defineProperty(Game, "room", {
	get: function(){
		return Game.__room__;
	},
	set: function(room){
		"use strict";
		var i;
		if(Game.__room__ != null && !Game.__room__.persistent){
			for(i in Game.__room__.entityList){
				delete Game.__room__.entityList[i];
			}
			for(i in Game.__room__.tiles){
				delete Game.__room__.tiles[i];
			}
			
			Game.__room__.entityList = [];
			Game.__room__.tiles		 = [];
			Game.__room__.__init__   = false;
		}
		
		if(room.persistent){
			Game.__room__ = room;
			for(i in Game.entityGlobal){
				if(room.entityList.indexOf(Game.entityGlobal[i]) == -1 && typeof Game.entityGlobal[i] != "undefined"){
					room.entityList.push(Game.entityGlobal[i]);
				}
			}
			if(!room.__init__){
				room.time = 0;
				if(typeof room.Start == "function") room.Start();
			}
		} else {
			Game.__room__   = room;
			room.entityList = [].concat(Game.entityGlobal);
			room.tiles		= [];
			room.time 		= 0;
			if(typeof room.Start == "function") room.Start();
		}
		room.__init__ = true;
		__refreshRoom__();
	}
});

Sys.readonly("Game.run");
Sys.readonly("Game.stop");
function __refreshRoom__(){ // Funções executadas ao atualizar a room
	__changeLayer();
}

// ---- Execução do jogo ---- //
const __runGame__ = function(){
	"use strict";
	// Calculando o FPS
	if(__fpsRun__ >= 1000){
		var atu 	 = new Date().getTime();
		var dif 	 = atu - __lastTime__;
		__lastTime__ = atu;
		
		Game.fps     = Math.round( Game.room.speed * (1000/dif) );
		__fpsRun__   = 0;
	} else {
		__fpsRun__ += 5;
		if(__lastTime__ == 0) __lastTime__ = new Date().getTime();
	}
	
	Other = null;
	
	// Draw
	var __i, pp, mp;
	if(Draw.refresh != -1){
		if(__countDrawRefresh__ >= Draw.refresh){
			Draw.redraw();
			
			__countDrawRefresh__ = 0;
		} else {
			__countDrawRefresh__++;
		}
	}
	
	if((1000/Game.room.speed) > __timeToRun__){
		__timeToRun__ += 5;
		return;
	} else {
		__timeToRun__ = 5;
	}
	
	if(Game.room.paused){
		Self = Game.room;
		if(typeof Game.room.InPause == "function") Game.room.InPause();
	} else {
		// Atualizando X e Y do mouse.
		Mouse.x = (Game.room? Game.room.view.x : 0) + Mouse.__x__;
		Mouse.y = (Game.room? Game.room.view.y : 0) + Mouse.__y__;
		
		// Partículas
		for(__i in Game.room.partList){
			if(typeof Game.room.partList[__i] != "object") continue;
			pp = Game.room.partList[__i];
			
			if(pp.time != -1){
				pp.time--;
				if( ~~pp.time <= 0 ){
					Game.room.partList[__i].destroy();
					continue;
				}
			}
			
			pp.xscale += pp.part.xscaleTransform;
			if(pp.xscale < 0) pp.xscale = 0;
			
			pp.yscale += pp.part.yscaleTransform;
			if(pp.yscale < 0) pp.yscale = 0;
			
			pp.alpha  += pp.part.alphaTransform;
			if(pp.alpha < 0) pp.alpha = 0;
			
			pp.angle  += pp.part.angleTransform;
			
			if(pp.force > 0){
				mp 	  = Math.radiusGetPoint(pp.force, pp.direction);
				pp.x += mp.x;
				pp.y += mp.y;
				
				pp.force -= 0.1;
			}
			
			if(pp.gravity != 0){
				pp.y += pp.gravity;
				pp.gravity += 0.2;
			}
			
		}
		
		// Botões virtuais
		for(__i in Game.VKeys){
			if(typeof Game.VKeys[__i] != "object") continue;
			if(!Game.VKeys[__i].actived) continue;
			if( !Mouse.isDown(Mouse.left) && !Touch.isDown() && Game.VKeys[__i].clicked ){
				Key.simulate(Game.VKeys[__i].button, false);
				Game.VKeys[__i].clicked = Game.VKeys[__i].touched = false;
			}
			if(Game.VKeys[__i].style.mode == "circle"){
				if( Mouse.inCircle(Game.VKeys[__i].x, Game.VKeys[__i].y, Game.VKeys[__i].radius, Mouse.left, true) ||
					Touch.inCircle(Game.VKeys[__i].x, Game.VKeys[__i].y, Game.VKeys[__i].radius, true) ) {
					Game.VKeys[__i].clicked = Game.VKeys[__i].touched = true;
					if(typeof Game.VKeys[__i].button == "function"){
						Game.VKeys[__i].button();
					} else {
						Key.simulate(Game.VKeys[__i].button, true);
					}
				} else if(Game.VKeys[__i].clicked){
					Key.simulate(Game.VKeys[__i].button, false);
					Game.VKeys[__i].clicked = Game.VKeys[__i].touched = false;
				}
			}
		}
		
		// Step 1 da Room
		Self = Game.room;
		if(typeof Game.room.Step1 == "function") Game.room.Step1();
		if(Game.room.entityList.length > 0){
			for(__i in Game.room.entityList){
				if(typeof Game.room.entityList[__i] != "object") continue;
				if(Game.room.paused) continue;
				Self = Game.room.entityList[__i];
				
				if(Self.paused) {
					if(typeof Self.InPause == "function") Self.InPause();
					continue;
				} // Entidade pausada
				
				// Movimento com speed.
				if(Self.speed != 0){
					var mov = Math.radiusGetPoint(Self.speed, Self.angle);
					Self.x += mov.x;
					Self.y += mov.y;
				}
				
				// Step 1
				if(typeof Self.Step1 == "function") Self.Step1();
				// Mouse
				if(Mouse.btsUp.length != 0 || Mouse.btsDown.length != 0 || Mouse.whlMove.length != 0 || Mouse.btsInDown.length != 0 || Mouse.__move__){
					if(typeof Self.Mouse == "function") {
						Self.Mouse();
					}
				}
				// Teclado
				if(Key.keysDown.length != 0 || Key.keysUp.length != 0 || Key.keysInDown.length != 0){
					if(typeof Self.Keyboard == "function") {
						Self.Keyboard();
					}
				}
			}
			// Step 2
			for(__i in Game.room.entityList){
				if(typeof Game.room.entityList[__i] == "undefined") continue;
				if(Game.room.paused) continue;
				Self = Game.room.entityList[__i];
				
				if(Self.paused) continue;
				if(typeof Self.Step2 == "function") Self.Step2();
			}
		}
		// Step 2 da Room
		Self = Game.room;
		if(typeof Game.room.Step2 == "function") Game.room.Step2();
	}
	
	Mouse.__move__ = false;
	Game.room.time++;
	
	// Modo de depuração
	if(DEBUGMODE && typeof debug != "undefined" && typeof debug.__run__ == "function") debug.__run__();
	
	Game.room.partList  = Sys.copy( Game.room.partList );
	Touch.__touchDown__ = Touch.__touchUp__ = false;
	Key.keysInDown = Key.keysUp = Mouse.btsInDown = Mouse.btsUp = Mouse.whlMove = [];
	if(Key.keysDown.join("").match(/^((-1)+)$/)  != null) Key.keysDown  = [];
	if(Mouse.btsDown.join("").match(/^((-1)+)$/) != null) Mouse.btsDown = [];
}

const __drawGame__ = function(){
	"use strict";
	var __i, pp, ac;
	var view = Game.room.view;
	// View
	if(view.follow != null && !Draw.__inProj__){
		var CX, CY, XX, YY, WM, HM,
			ent  = view.follow;
		if(ent instanceof Model) ent = ent.getEntity(0);
		
		CX = view.x + Math.round(Game.canvas.width / 2);
		CY = view.y + Math.round(Game.canvas.height / 2);
		XX = view.x;
		YY = view.y;
		WM = view.wmax;
		HM = view.hmax;
		if(Math.abs(CX - ent.x) > WM){
			if(CX < ent.x) view.x += Math.abs((CX+WM) - ent.x);
			if(CX > ent.x) view.x -= Math.abs((CX-WM) - ent.x);
		}
		if(Math.abs(CY - ent.y) > view.hmax){
			if(CY < ent.y) view.y += Math.abs((CY+HM) - ent.y);
			if(CY > ent.y) view.y -= Math.abs((CY-HM) - ent.y);
		}
		if(view.xmin != -1 && view.x < view.xmin) view.x = view.xmin;
		if(view.xmax != -1 && view.x > view.xmax) view.x = view.xmax;
		if(view.ymin != -1 && view.y < view.ymin) view.y = view.ymin;
		if(view.ymax != -1 && view.y > view.ymax) view.y = view.ymax;
	}
	
	if(!Draw.__inProj__){
		Game.canvas.width  = Game.canvas.width;
		Game.canvas.height = Game.canvas.height;
	}
	// Background
	if(typeof Game.room.bgColor == "string" && Game.room.bgColor){
		ac 			   = Draw.colorFill;
		Draw.colorFill = Game.room.bgColor;
		Draw.rectangle(0, 0, Game.canvas.width, Game.canvas.height);
		Draw.colorFill = ac;
	}
	if(Game.room.background != null){
		var BG = Game.room.background;
		Game.context.save();
		
		Game.context.scale(BG.xscale, BG.yscale);
		Game.context.translate(BG.x, BG.y);
		if(BG.repeat) Draw.imageRepeat(BG.__image__, -view.x, -view.y);
		else 		  Game.context.drawImage(BG.__image__, -view.x, -view.y);
		
		Game.context.restore();
		BG.x += BG.xspeed;
		BG.y += BG.yspeed;
	}
	Game.context.translate(-view.x, -view.y);
	
	// Tileset
	__tilesetRefresh();
	
	// Partículas
	for(__i in Game.room.partList){
		if(typeof Game.room.partList[__i] != "object") continue;
		pp = Game.room.partList[__i];
		
		var aAlpha = Draw.alpha;
		Draw.alpha = pp.alpha;
		// (image, x, y, xoffset, yoffset, xscale, yscale, angle)
		Draw.image(pp.part.__image__, pp.x, pp.y, pp.part.xoffset,
				   pp.part.yoffset, pp.xscale, pp.yscale, pp.angle);
				   
		Draw.alpha = aAlpha;
	}
	
	// Entidades
	for(__i in Game.room.entityList){
		if(typeof Game.room.entityList[__i] != "object") continue;
		Self = Game.room.entityList[__i];
		
		// Desenhando o sprite
		if(typeof Self.sprite == "object" && Self.visible && Self.sprite.image instanceof Image){
			Game.context.save();
			Game.context.translate(Self.x, Self.y);
			Game.context.rotate( Math.deg2rad(Self.sprite.angle) );
			Game.context.scale(Self.sprite.xscale, Self.sprite.yscale);
			
			var __spr = Self.sprite, __sub = Math.floor(Self.sprite.subimage);
			Game.context.drawImage(__spr.images[__sub], -__spr.xoffset, -__spr.yoffset);
			Game.context.restore();
		}
		// Draw da entidade
		if(typeof Self.Draw == "function") Self.Draw();
	}
	// Draw da Room
	Self = Game.room;
	if(typeof Game.room.Draw == "function") Game.room.Draw();
	
	// Draw VKeys
	if(!Draw.__inProj__){
		for(__i in Game.VKeys){
			if(typeof Game.VKeys[__i] != "object") continue;
			if(!Game.VKeys[__i].actived || !Game.VKeys[__i].visible) continue;
			
			Game.context.save();
			
			Draw.font  = Game.VKeys[__i].style.font  || "12px Arial";
			var bSize  = Game.VKeys[__i].style.borderSize || 1,
					xx = Game.room.view.x + Game.VKeys[__i].x,
					yy = Game.room.view.y + Game.VKeys[__i].y,
					radius = Game.VKeys[__i].radius,
					txtC   = Math.floor( parseInt(Draw.font)/4 ),
					color;
			if(Game.VKeys[__i].clicked){
				Draw.alpha = Game.VKeys[__i].style.alphaOnClick || 1;
				color 	   = Game.VKeys[__i].style.colorOnClick ||
							 Game.VKeys[__i].style.color || "#DDD";
			} else {
				Draw.alpha = Game.VKeys[__i].style.alpha || 0.7;
				color 	   = Game.VKeys[__i].style.color || "#DDD";
			}
			
			if(Game.VKeys[__i].style.mode == "circle"){
				Draw.colorFill = Game.VKeys[__i].style.colorBorder || "#000";
				Draw.circle(xx, yy, radius + bSize);
				
				Draw.colorFill = color;
				Draw.circle(xx, yy, radius);
				
				Draw.textAlign = "center";
				Draw.colorFill = Game.VKeys[__i].style.textColor || "#FFF";
				Draw.text(Game.VKeys[__i].text, xx, yy + txtC);
			}
			
			Game.context.restore();
		}
	}
}


// ---- Draw ---- //
Draw = {
	refresh     : 6,
	redraw		: function(){ __drawGame__(); },
	setTarget   : function(canvas){
		if(!Sys.isDefined(canvas)) return;
		var con;
		if(typeof canvas.canvas != "undefined"){
			con = canvas; // Caso apresente o contexto como argumento
		} else if(typeof(canvas.getContext) != "undefined"){
			con = canvas.getContext("2d");
		} else {
			_showError(12);
			return;
		}
		
		Game.context = con;
	},
	resetTarget : function(){
		Game.context = __originContextGame__;
	},
	rectangle : function(x, y, width, height, outline){
		"use strict";
		if(!Sys.isDefined(x && y && width && height)) _showError(3); // Verificando se argumentos foram definidos
		
		if(Game.context != null){
			Game.context.beginPath();
			if(outline){
				Game.context.strokeRect(x, y, width, height);
			} else {
				Game.context.fillRect(x, y, width, height);
			}
			Game.context.closePath();
		}
	},
	point  : function(x, y, size){
		"use strict";
		if(!Sys.isDefined(x && y)){
			_showError(9);
			return;
		}
		
		if(Game.context != null){
			if(Sys.isDefined(size) && size > 1){
				Game.context.fillRect(x-(size/2), y-(size/2), size, size);
			} else {
				Game.context.fillRect(x, y, 1, 1);
			}
		}
	},
	circle : function(x, y, radius, outline, angleEnd, angleStart, closed){
		"use strict";
		if(!Sys.isDefined(x && y && radius)){
			_showError(8);
			return;
		}
		
		var dir = false;
		if(radius < 0){
			dir = true;
			radius = Math.abs(radius);
		}
		var aEnd, aStart;
		if(angleEnd != null){
			aEnd = (Math.round(angleEnd*2)/360) * Math.PI;
		} else {
			aEnd = 2 * Math.PI;
		}
		if(angleStart != null){
			aStart = (Math.round(angleStart*2)/360) * Math.PI;
		} else {
			aStart = 0;
		}
		if(Game.context != null){
			Game.context.beginPath();
			Game.context.arc(x, y, radius, aStart, aEnd, dir);
			if(closed){
				Game.context.lineTo(x, y);
			}
			if(outline){
				if(closed){
					var eArc = Math.radiusGetPoint(radius, angleStart);
					eArc.y = -eArc.y;
					Game.context.lineTo(Math.ceil(x+eArc.x), Math.ceil(y+eArc.y));
				}
				Game.context.stroke();
			} else {
				Game.context.fill();
			}
			Game.context.closePath();
		}
	},
	line : function(x1, y1, x2, y2, size){
		"use strict";
		if(!Sys.isDefined(x1 && y1 && x2 && y2)){
			_showError(4);
			return;
		}
		
		if(Game.context != null){
			var _tmpLineWidth = Game.context.lineWidth;
			if(size != null){
				Game.context.lineWidth = size;
			}
			Game.context.beginPath();
			Game.context.moveTo(x1, y1);
			Game.context.lineTo(x2, y2);
			Game.context.closePath();
			Game.context.stroke();
			Game.context.lineWidth = _tmpLineWidth;
		}
	},
	radius : function(x, y, length, angle, size){
		"use strict";
		if(!Sys.isDefined(x && y && length && angle)){
			_showError(16);
			return;
		}
		
		if(Game.context != null){
			var pos = Math.radiusGetPoint(length, angle);
			Game.context.save();
			Game.context.beginPath();
			
			if(Sys.isDefined(size)){
				Game.context.lineWidth = size;
			}
			Game.context.moveTo(x, y);
			Game.context.lineTo(x+pos.x, y+pos.y);
			Game.context.stroke();
			
			Game.context.closePath();
			Game.context.restore();
		}
	},
	curve : function(p1x, p1y, p2x, p2y, p3x, p3y, size){
		"use strict";
		if(!Sys.isDefined(p1x && p1y && p2x && p2y && p3x && p3y)){
			_showError(10);
			return;
		}
		
		if(Game.context != null){
			Game.context.beginPath();
			if(Sys.isDefined(size)){
				var _tmpLineWidth = Game.context.lineWidth;
				Game.context.lineWidth = size;
			}
			Game.context.bezierCurveTo(p1x, p1y, p2x, p2y, p3x, p3y);
			Game.context.stroke();
			Game.context.lineWidth = _tmpLineWidth;
			Game.context.closePath();
		}
	},
	text : function(text, x, y, color, width){
		"use strict";
		if(!Sys.isDefined(text && x && y)){
			_showError(5);
			return;
		}
		text  = String( text );
		if(width != null) width = width;
		
		if(Game.context != null){
			if(color != null){
				Game.context.fillStyle = color;
			}
			if(width != null){
				Game.context.fillText(text, x, y, width);
			} else {
				Game.context.fillText(text, x, y);
			}
		}
	},
	sprite : function(sprite, imageid, x, y){
		"use strict";
		if(!Sys.isDefined(sprite && imageid && x && y)){
			_showError(7);
			return;
		}
		
		if(Game.context != null){
			Game.context.save();
			Game.context.translate(x, y);
			Game.context.scale(sprite.xscale, sprite.yscale);
			Game.context.rotate( Math.deg2rad(sprite.angle) );
			
			Game.context.drawImage(sprite.images[imageid], -sprite.xoffset, -sprite.yoffset);
			Game.context.restore();
		}
	},
	image : function(image, x, y, xoffset, yoffset, xscale, yscale, angle){
		"use strict";
		if(!Sys.isDefined(image && x && y)){
			_showError(11);
			return;
		}
		
		if(Game.context != null){
			Game.context.save();
			Game.context.translate(x, y);
			if(Sys.isDefined(xscale && yscale)){
				Game.context.scale(xscale, yscale);
			}
			if(Sys.isDefined(angle)){
				Game.context.rotate( Math.deg2rad(angle) );
			}
			var xx, yy;
			xx = xoffset != null? -xoffset : 0;
			yy = yoffset != null? -yoffset : 0;
			
			Game.context.drawImage(image, xx, yy);
			Game.context.restore();
		}
	},
	imageRepeat : function(image, x, y){
		"use strict";
		if(!Sys.isDefined(image && x && y)) _showError(54);
		if(!image instanceof Image) 		_showError(54);
		
		var xx, yy, sx, sy;
		
		for(sx = x; sx > 0; sx -= image.width);   // Get start X
		for(sy = y; sy > 0; sy -= image.height); //  Get start Y
		
		for(xx = sx; xx < Game.canvas.width; xx += image.width){
			for(yy = sy; yy < Game.canvas.height; yy += image.height){								
				Game.context.drawImage(image, xx, yy);
			}
		}
	},
	mask : function(ent, simple){
		"use strict";
		if(!ent.mask || !ent.sprite) return;
		if(simple){
			var xx  = ent.x-ent.sprite.xoffset;
			var yy  = ent.y-ent.sprite.yoffset;
			var pts = ent.mask.__sPoints__;
			Draw.colorFill = "rgba("+ent.mask.color+", 0.5)";
			Draw.rectangle(xx+pts.x, yy+pts.y, pts.width, pts.height);
		} else {
			Draw.image(ent.mask.canvas, ent.x, ent.y, ent.sprite.xoffset, ent.sprite.yoffset, ent.sprite.xscale, ent.sprite.yscale, ent.sprite.angle);
		}
	},
	clear : function(x, y, width, height){
		"use strict";
		if(x == All){
			Game.canvas.width  = Game.canvas.width;
			Game.canvas.height = Game.canvas.height;
			return;
		} else if(!Sys.isDefined(x && y && width && height)){
			return;
		}
		
		Game.context.clearRect(x, y, width, height);
	},
	__projCanvas__ : document.createElement("canvas"),
	__inProj__	   : false,
	projection     : function(x, y, xscale, yscale, angle, px, py, pwidth, pheight){
		if(!Sys.isDefined(x && y && xscale && yscale && angle && px && py && pwidth && pheight)){
			_showError(53);
			return;
		}
		if(this.__inProj__) return;
		
		this.__projCanvas__.width  = pwidth;
		this.__projCanvas__.height = pheight;
		
		var ax = Game.room.view.x, ay = Game.room.view.y;
		
		Game.room.view.x = px;
		Game.room.view.y = py;
		this.__inProj__  = true;
		
		Draw.setTarget(this.__projCanvas__);
		Draw.redraw();
		Draw.resetTarget();
		
		Game.room.view.x = ax;
		Game.room.view.y = ay;
		
		this.__inProj__  = false;
		
		// (image, x, y, xoffset, yoffset, xscale, yscale, angle)
		Draw.image(this.__projCanvas__, x, y, 0, 0, xscale, yscale, angle);
	}
};
// Atalhos Draw
(function(){
	"use strict";
	var __sVs__ = ["colorFill:fillStyle", "colorBorder:strokeStyle", "alpha:globalAlpha", "font:font", "lineStyle:lineCap",
			   "textAlign:textAlign"];
	var __i;
	for(__i in __sVs__){
		var d    = __sVs__[__i].indexOf(":"),
			from = __sVs__[__i].substring(0, d),
			to   = __sVs__[__i].substring(d+1);
		(function(from, to){
			"use strict";
			Object.defineProperty(Draw, from, {
				get: function(){
					if(Game.context == null) {
						_showError(2);
						return;
					}
					return eval("Game.context."+to);
				},
				set: function(value){
					if(Game.context == null) {
						_showError(2);
						return;
					}
					if(typeof value == "string"){
						value = '"'+value+'"';
					}
					eval("Game.context."+to+" = "+value);
				}
			});
		})(from, to);
	}
})();

// ---- Colisão ---- //
Col = {
	simple     : {
		entity : function(ent1, ent2){
			"use strict";
			if(ent1 instanceof Model) ent1 = ent1.getEntity(0);
			if(ent2 instanceof Model) ent2 = ent2.getEntity(0);
			if(!Sys.isDefined(ent1.mask && ent2.mask))   return false;
			if(!Game.inRoom(ent1) || !Game.inRoom(ent2)) return false;
			var pts1 = ent1.mask.__sPoints__;
			
			var V1X = (ent1.x-ent1.sprite.xoffset) + Math.round(ent1.mask.width/2);
			var V1Y = (ent1.y-ent1.sprite.yoffset) + Math.round(ent1.mask.height/2);
			var V2X = (ent2.x-ent2.sprite.xoffset) + Math.round(ent2.mask.width/2);
			var V2Y = (ent2.y-ent2.sprite.yoffset) + Math.round(ent2.mask.height/2);
			
			if(Math.abs(V1X - V2X) > ent1.mask.width)  return false;
			if(Math.abs(V1Y - V2Y) > ent1.mask.height) return false;
			
			var xx  = (ent1.x - ent1.sprite.xoffset)+pts1.x;
			var yy  = (ent1.y - ent1.sprite.yoffset)+pts1.y;
			if(Col.simple.rectangle(xx, yy, pts1.width, pts1.height, ent2)){
				Other = ent2;
				return true;
			} else {
				Other = null;
				return false;
			}
		},
		rectangle : function(x, y, width, height, ent){
			if(!Sys.isDefined(x && y && width && height && ent)){
				return false;
			}
			if(typeof ent != "object") return false;
			if(ent instanceof Model) ent = ent.getEntity(0);
			if(!Sys.isDefined(ent.mask && ent.sprite)) return false;
			
			var pts = ent.mask.__sPoints__;
			
			var xx  = (ent.x - ent.sprite.xoffset)+pts.x;
			var yy  = (ent.y - ent.sprite.yoffset)+pts.y;
			var xx2 = xx + pts.width;
			var yy2 = yy + pts.height;
			
			if(xx > x+width  || xx2 < x) return false;
			if(yy > y+height || yy2 < y) return false;
			
			return true;
		},
		model : function(ent, model){
			"use strict";
			if(ent instanceof Model) ent = ent.getEntity(0);
			if(!Sys.isDefined(ent.mask) || !Game.inRoom(ent)) return false;
			var i, R = false;
			Other = null;
			
			for(i in Game.room.entityList){
				if(typeof Game.room.entityList[i] == "undefined") continue;
				var ent2 = Game.room.entityList[i];
				
				if(model != All && ent2.model != model && ent2.parent != model) continue;
				if(ent == ent2) continue;
				
				if(Col.simple.entity(ent, ent2)){
					R 	  = true;
					Other = ent2;
					break;
				}
			}
			return R;
		},
		tileset : function(ent, tileset){
			"use strict";
			
			if(!Sys.isDefined(ent && tileset)) return false;
			if(typeof ent != "object") 		   return false;
			if(ent instanceof Model) 		   ent = ent.getEntity(0);
			if(!Game.inRoom(ent)) 			   return false;
			if(!Sys.isDefined(ent.mask && ent.sprite)) return false;
			
			var i;
			for(i in Game.room.tiles){
				if(typeof Game.room.tiles[i] == "undefined") continue;
				var t = Game.room.tiles[i];
				if(t.tileset != tileset) continue;
				
				if(Col.simple.rectangle(t.x, t.y, t.tileset.twidth, t.tileset.theight, ent)){
					Other = t;
					return true;
				}
			}
			Other = null;
			return false;
		},
		particle : function(ent, particle){
			"use strict";
			
			if(!Sys.isDefined(ent && particle)) return false;
			if(typeof ent != "object") 			return false;
			if(ent instanceof Model) ent = ent.getEntity(0);
			
			var i, pp;
			for(i in Game.room.partList){
				if(typeof Game.room.partList[i] != "object") continue;
				if(Game.room.partList[i].part   != particle) continue;
				pp = Game.room.partList[i];
				
				if( Col.simple.rectangle( Math.round(pp.x - pp.part.xoffset), Math.round(pp.y - pp.part.yoffset),
					Math.round(pp.part.__image__.width*pp.xscale), Math.round(pp.part.__image__.height*pp.yscale), ent) ){
						Other = pp;
						return true;
				}
			}
			
			Other = null;
			return false;
		},
		group : function(ent, group){
			"use strict";
			if(ent instanceof Model) ent = ent.getEntity(0);
			if(!Sys.isDefined(ent.mask) || !Game.inRoom(ent)) return false;
			var i;
			
			for(i in Game.room.entityList){
				if(typeof Game.room.entityList[i] == "undefined") continue;
				var ent2 = Game.room.entityList[i];
				if(ent == ent2) continue;
				if(!Game.inGroup(ent2, group) && !Game.inGroup(ent2.parent, group)) continue;
				
				if(Col.simple.entity(ent, ent2)){
					Other = ent2;
					return true;
				}
			}
			
			for(i in Game.room.tiles){
				if(typeof Game.room.tiles[i] == "undefined") continue;
				var t = Game.room.tiles[i];
				if(typeof t.tileset == "undefined") continue;
				if(!Game.inGroup(t.tileset, group)) continue;
				
				if(Col.simple.rectangle(t.x, t.y, t.tileset.twidth, t.tileset.theight, ent)){
					Other = t;
					return true;
				}
			}
			return false;
		},
		onPosition : function(x, y, ent1, obj){
			"use strict";
			if(ent1 instanceof Model) ent1 = ent1.getEntity(0);
			if(!Sys.isDefined(ent1.mask)) return false;
			
			var AX = ent1.x, AY = ent1.y, R;
			ent1.__x__ = x;
			ent1.__y__ = y;
			if(obj instanceof Model || obj == All){
				R = Col.simple.model(ent1, obj);
			} else if(obj instanceof Entity){
				R = Col.simple.entity(ent1, obj);
			} else if(obj instanceof Tileset){
				R = Col.simple.tileset(ent1, obj);
			} else {
				R = Col.simple.group(ent1, obj);
			}
			ent1.__x__ = AX;
			ent1.__y__ = AY;
			return R;
		},
		point : function(x, y, ent){
			"use strict";
			if(!Sys.isDefined(x && y && ent) || typeof ent != "object") return false;
			if(ent instanceof Model) ent = ent.getEntity(0);
			if(!Sys.isDefined(ent.mask)) return false;
			if(!Game.inRoom(ent))        return false;
			var R  = true, pts = ent.mask.__sPoints__,
				xx = ent.x - ent.sprite.xoffset,
				yy = ent.y - ent.sprite.yoffset;
			if(x < xx+pts.x || x > xx+pts.x+pts.width)  R = false;
			if(y < yy+pts.y || y > yy+pts.y+pts.height) R = false;
			
			return R;
		}
	},
	__canvas__ 	  : document.createElement("canvas"),
	compatible    : true,
	compatibility : function(){
		Col 	   = Col.simple;
		Col.simple = Col;
	},
	entity        : function(ent1, ent2){
		"use strict";
		if(ent1 instanceof Model) ent1 = ent1.getEntity(0);
		if(ent2 instanceof Model) ent2 = ent2.getEntity(0);
		if(!Sys.isDefined(ent1.mask && ent2.mask))   return false;
		if(!Game.inRoom(ent1) || !Game.inRoom(ent2)) return false;
		var V1X = (ent1.x-ent1.sprite.xoffset) + Math.round(ent1.mask.width/2);
		var V1Y = (ent1.y-ent1.sprite.yoffset) + Math.round(ent1.mask.height/2);
		var V2X = (ent2.x-ent2.sprite.xoffset) + Math.round(ent2.mask.width/2);
		var V2Y = (ent2.y-ent2.sprite.yoffset) + Math.round(ent2.mask.height/2);
		
		if(Math.abs(V1X - V2X) > ent1.mask.width)  return false;
		if(Math.abs(V1Y - V2Y) > ent1.mask.height) return false;
		
		var iData, R, V, i;
		Col.__canvas__.width   = ent1.mask.width;
		Col.__canvas__.height  = ent1.mask.height;
		
		Draw.setTarget(Col.__canvas__);
		// Draw.image(image, x, y, xoffset, yoffset, xscale, yscale, angle);
		Draw.image(ent1.mask.canvas, ent1.sprite.xoffset, ent1.sprite.yoffset, ent1.sprite.xoffset, ent1.sprite.yoffset, ent1.sprite.xscale, ent1.sprite.yscale, ent1.sprite.angle);
		Draw.image(ent2.mask.canvas, (ent2.x+ent2.sprite.xoffset) - (ent1.x-ent1.sprite.xoffset), (ent2.y+ent2.sprite.yoffset) - (ent1.y-ent1.sprite.yoffset), 
				   ent2.sprite.xoffset, ent2.sprite.yoffset, ent2.sprite.xscale, ent2.sprite.yscale, ent2.sprite.angle);
		Draw.resetTarget();
		
		iData = Col.__context__.getImageData(0, 0, ent1.mask.width, ent1.mask.height);
		if(window.navigator.appCodeName == "Mozilla") {
			V = 192;
		} else {
			V = 190;
		}
		if(typeof iData.data.indexOf == "undefined"){
			i = __getIndex(iData.data, V);
		} else {
			i = iData.data.indexOf(V);
		}
		if(i != -1){
			R 	  = true;
			Other = ent2;
		} else {
			R 	  = false;
			Other = null;
		}
		
		return R;
	},
	model      : function(ent, model){
		"use strict";
		if(ent instanceof Model) ent = ent.getEntity(0);
		if(!Sys.isDefined(ent.mask) || !Game.inRoom(ent)) return false;
		
		var i, R = false;
		for(i in Game.room.entityList){
			if(typeof Game.room.entityList[i] == "undefined") continue;
			var ent2 = Game.room.entityList[i];
			if(model != All && ent2.model != model && ent2.parent != model) continue;
			if(ent == ent2) continue;
			
			if(Col.entity(ent, ent2)){
				R = true;
				break;
			}
		}
		return R;
	},
	tileset : function(ent, tileset){
		"use strict";
		
		if(!Sys.isDefined(ent && tileset)) return false;
		if(typeof ent != "object") 		   return false;
		if(ent instanceof Model) 		   ent = ent.getEntity(0);
		if(!Game.inRoom(ent)) 			   return false;
		if(!Sys.isDefined(ent.mask && ent.sprite)) return false;
		
		var i;
		for(i in Game.room.tiles){
			if(typeof Game.room.tiles[i] == "undefined") continue;
			var t = Game.room.tiles[i];
			if(t.tileset != tileset) continue;
			
			if(Col.rectangle(t.x, t.y, t.tileset.twidth, t.tileset.theight, ent)){
				Other = t;
				return true;
			}
		}
		Other = null;
		return false;
	},
	group	   : function(ent, group){
		"use strict";
		if(ent instanceof Model) ent = ent.getEntity(0);
		if(!Sys.isDefined(ent.mask) || !Game.inRoom(ent)) return false;
		
		var i;
		for(i in Game.room.entityList){
			if(typeof Game.room.entityList[i] == "undefined") continue;
			var ent2 = Game.room.entityList[i];
			if(ent == ent2) continue;
			if(!Game.inGroup(ent2, group) && !Game.inGroup(ent2.parent, group)) continue;
			
			if(Col.entity(ent, ent2)){
				Other = ent2;
				return true;
			}
		}
		
		for(i in Game.room.tiles){
			if(typeof Game.room.tiles[i] == "undefined") continue;
			var t = Game.room.tiles[i];
			if(typeof t.tileset == "undefined") continue;
			if(!Game.inGroup(t.tileset, group)) continue;
			
			if(Col.rectangle(t.x, t.y, t.tileset.twidth, t.tileset.theight, ent)){
				Other = t;
				return true;
			}
		}
		return false;
	},
	onPosition : function(x, y, ent1, obj){
		"use strict";
		if(ent1 instanceof Model) ent1 = ent1.getEntity(0);
		if(!Sys.isDefined(ent1.mask)) return false;
		
		var AX = ent1.x, AY = ent1.y, R;
		ent1.__x__ = x;
		ent1.__y__ = y;
		if(obj instanceof Model || obj == All){
			R = Col.model(ent1, obj);
		} else if(obj instanceof Entity){
			R = Col.entity(ent1, obj);
		} else if(obj instanceof Tileset){
			R = Col.tileset(ent1, obj);
		} else {
			R = Col.group(ent1, obj);
		} 
		ent1.__x__ = AX;
		ent1.__y__ = AY;
		return R;
	},
	rectangle: function(x, y, width, height, ent){
		"use strict";
		if(ent instanceof Model) ent = ent.getEntity(0);
		if(!Sys.isDefined(ent.mask)) return false;
		if(!Game.inRoom(ent)) 		 return false;
		var V1X = (ent.x-ent.sprite.xoffset) + Math.round(ent.mask.width/2);
		var V1Y = (ent.y-ent.sprite.yoffset) + Math.round(ent.mask.height/2);
		var V2X = x + Math.round(width/2);
		var V2Y = y + Math.round(height/2);
		
		if(Math.abs(V1X - V2X) > ent.mask.width)  return false;
		if(Math.abs(V1Y - V2Y) > ent.mask.height) return false;
		
		var iData, V, i, chk = new Uint8ClampedArray();
		Col.__canvas__.width   = ent.mask.width;
		Col.__canvas__.height  = ent.mask.height;
		
		Game.context.save();
		Draw.setTarget(Col.__canvas__);
		
		// Draw.image(image, x, y, xoffset, yoffset, xscale, yscale, angle);
		Draw.image(ent.mask.canvas, ent.sprite.xoffset, ent.sprite.yoffset, ent.sprite.xoffset, ent.sprite.yoffset, ent.sprite.xscale, ent.sprite.yscale, ent.sprite.angle);
		if(typeof chk.indexOf == "undefined"){
			Game.context.fillStyle = "rgba(170, 10, 10, 0.50)";
		} else {
			Game.context.fillStyle = "rgba(170, 10, 10, 0.51)";
		}
		Draw.rectangle(x - (ent.x-ent.sprite.xoffset), y - (ent.y-ent.sprite.yoffset), width, height);
		
		Draw.resetTarget();
		Game.context.restore();
		
		iData = Col.__context__.getImageData(0, 0, ent.mask.width, ent.mask.height);
		if(window.navigator.appCodeName == "Mozilla") {
			V = 192;
		} else {
			V = 190;
		}
		if(typeof iData.data.indexOf == "undefined"){
			i = __getIndex(iData.data, V);
		} else {
			i = iData.data.indexOf(V);
		}
		if(i != -1){
			return true;
		} else {
			return false;
		}
	},
	point: function(x, y, ent){
		return Col.rectangle(x, y, 1, 1, ent);
	}
}
Col.__context__ = Col.__canvas__.getContext("2d");

// ---- Objetos ---- //
VStyles = {
	circle: {
		mode: "circle",
		colorBorder: "#AAB",
		color: "#889",
		colorOnClick: "#AAB",
		alpha: 0.8,
		alphaOnClick: 1,
		font: "24px Agency FB",
		textColor: "#DDD"
	}
}

function VKey(text, x, y, button, style){
	this.text    = text   || "Click-me!";
	this.x 	     = x      || 0;
	this.y 	     = y      || 0;
	this.button  = button || -1;
	this.style   = Sys.copy( style  || VStyles.circle );
	this.width   = 50;
	this.height  = 50;
	this.radius  = 25;
	this.actived = true;
	this.visible = true;
	this.clicked = false;
	this.touched = false;
	this.delete  = function(){
		delete Game.VKeys[ Game.VKeys.indexOf(this) ];
	}
	
	Game.VKeys.push( this );
}

function Mask(width, height){
	if(!Sys.isDefined(width && height)){
		_showError(35);
		return;
	}
	var COLOR = "rgba("+Sys.__maskColor__+", 0.5)";
	
	this.canvas  	   = document.createElement("canvas");
	this.context 	   = this.canvas.getContext("2d");
	this.canvas.width  = width;
	this.canvas.height = height;
	this.width         = width;
	this.height        = height;
	this.color         = Sys.maskColor;
	this.__sPoints__   = {
		x      : 0,
		y      : 0,
		width  : 0,
		height : 0
	};
	
	var __t = this;
	this.beginPoint    = function(){
		__t.context.beginPath();
		__t.context.fillStyle = COLOR;
	}
	this.endPoint      = function(){
		__t.context.closePath();
		__t.context.fill();
	}
	this.points        = function(){ // (p1x, p1y, p2x, p2y, ...)
		"use strict";
		var i;
		for(i=0; i < arguments.length; i += 2){
			var x = arguments[i];
			var y = arguments[i+1];
			if(x == undefined || y == undefined) break;
			if(x <= 0) x = 1;
			if(y <= 0) y = 1;
			if(x >= __t.width)  x = __t.width-1;
			if(y >= __t.height) y = __t.height-1;
			
			__t.context.lineTo(x, y);
		}
	}
	this.rectangle = function(x, y, width, height){
		__t.context.fillStyle = COLOR;
		__t.context.fillRect(x, y, width, height);
	}
	this.circle    = function(x, y, radius){
		__t.context.fillStyle = COLOR;
		Draw.setTarget(__t.canvas);
		Draw.circle(x, y, radius);
		Draw.resetTarget();
	}
	this.simple = function(x, y, width, height){
		this.__sPoints__.x      = x;
		this.__sPoints__.y      = y;
		this.__sPoints__.width  = width;
		this.__sPoints__.height = height;
	}
}

function Room(){
	this.__init__   = false; // Para rooms persistentes.
	this.tiles      = [];
	this.partList 	= [];
	this.background = null;
	this.__bgColor__= "#999";
	this.paused  	= false;
	this.persistent = false;
	this.Start		= null;
	this.Step1   	= null;
	this.Step2   	= null;
	this.InPause 	= null;
	this.Draw		= null;
	this.speed      = 30; // Frames por segundo, máximo 200.
	this.time 		= 0;
	this.view       = {x: 0, y: 0, __follow__: null, wmax: 50, hmax: 50, xmin: -1, ymin: -1, xmax: -1, ymax: -1};
	Object.defineProperty(this.view, "follow", {
		get: function(){ return this.__follow__; },
		set: function(value){
			if(value != null && value instanceof Model){
				this.__follow__ = value.getEntity(0);
			} else {
				this.__follow__ = value;
			}
		}
	});
	
	this.setViewLimit = function(xmin, ymin, xmax, ymax){
		this.view.xmin = xmin;
		this.view.ymin = ymin;
		this.view.xmax = xmax;
		this.view.ymax = ymax;
	}
	
	this.setFollowLimit = function(wmax, hmax){
		this.view.wmax = wmax;
		this.view.hmax = hmax;
	}
	
	this.entityList = [];
	this.entity     = function(model, x, y){
		if(!Sys.isDefined(model)) _showError(15);
		
		var ent, aRoom = Game.room;
		Game.room 	   = this;
		ent 		   = new Entity(model, x, y);
		Game.room      = aRoom;
		return ent;
	}
	this.addTile = function(tileset, tilex, tiley, x, y){
		if(!Sys.isDefined(tileset && tilex && tiley && x && y)) _showError(42);
		this.tiles.push({tileset: tileset, tilex: tilex, tiley: tiley, x: x, y: y});
	}
	this.removeTile = function(x, y, all){
		if(x == All) {
			delete this.tiles;
			this.tiles = [];
			return;
		}
		if(!Sys.isDefined(x && y)){
			_showError(43);
			return;
		}
		
		var i;
		for(i in this.tiles){
			if(typeof this.tiles[i] != "object") continue;
			if(this.tiles[i].x <= x && this.tiles[i].x+this.tiles[i].tileset.twidth >= x){
				if(this.tiles[i].y <= y && this.tiles[i].y+this.tiles[i].tileset.theight >= y){
					delete this.tiles[i];
					if(!all) break;
				}
			}
		}
	}
}
Object.defineProperty(Room.prototype, "bgColor", {
	get: function(){ return this.__bgColor__; },
	set: function(value){
		this.__bgColor__ = value;
		if(Game.room == this) Game.canvas.style.background = value;
	}
});

function Background(image, repeat){
	this.__image__     = new Image();
	this.__image__.src = image || "";
	
	if(image) Sys.toLoad++;
	this.__image__.onload  = function(){
		Sys.loaded++;
	}
	this.__image__.onerror = function(){
		Sys.errorLoad++;
		if(typeof Sys.OnLoadError == "function") Sys.OnLoadError(this);
	}
	
	this.x       = 0;
	this.y       = 0;
	this.xscale  = 1;
	this.yscale  = 1;
	this.repeat  = repeat || false;
	this.xspeed	 = 0;
	this.yspeed	 = 0;
}
Object.defineProperty(Background.prototype, "image", {
	get: function(){ return this.__image__.src; },
	set: function(value){
		Sys.toLoad++;
		this.__image__.src = value;
	}
});

function Tileset(image, tileWidth, tileHeight){
	if(!Sys.isDefined(image && tileWidth && tileHeight) || typeof image != "string") _showError(41);
	this.twidth    = tileWidth;
	this.theight   = tileHeight;
	this.loaded    = 0;
	this.group	   = [];
	this.image     = new Image();
	this.image.src = image;
	Sys.toLoad++;
	
	var obj = this;
	this.image.onerror =  function(){
		Sys.errorLoad++;
		if(typeof Sys.OnLoadError == "function") Sys.OnLoadError(this);
	}
	this.image.onload  = function(){
		obj.loaded = 100;
		Sys.loaded++;
	}
}
function __tilesetRefresh(){
	"use strict";
	if(Game.room.tiles.length == 0) return;
	var i, tile, con = Game.context;
	
	for(i in Game.room.tiles){
		if(typeof Game.room.tiles[i] != "object") continue;
		tile = Game.room.tiles[i];
		
		// drawImage(image, ix, iy, iwidth, iheight, x, y, width, height)
		con.drawImage(tile.tileset.image, tile.tilex, tile.tiley, tile.tileset.twidth, tile.tileset.theight, tile.x, tile.y, tile.tileset.twidth, tile.tileset.theight);
	}
}

function Part(image, xoffset, yoffset, timelife, gravity){
	this.xoffset  = xoffset  || 0;
	this.yoffset  = yoffset  || 0;
	this.timelife = timelife || (Game.room? Game.room.speed*1.5 : 45); // Step
	this.gravity  = gravity  || 0;
	this.xscale   = 1;
	this.yscale   = 1;
	this.alpha	  = 1;
	
	this.xscaleTransform = 0;
	this.yscaleTransform = 0;
	this.alphaTransform  = 0;
	this.angleTransform  = 0;
	
	this.__image__     = new Image();
	this.__image__.src = image || "";
	
	this.setScale = function(xscale, yscale){
		this.xscale = xscale || 1;
		this.yscale = yscale || 1;
	}
	
	this.setTransform = function(xscaleT, yscaleT, alphaT, angleT){
		if( !Sys.isDefined(xscaleT) ) {
			_showError(52);
			return;
		}
		
		this.xscaleTransform = xscaleT;
		
		if(yscaleT != null) this.yscaleTransform = yscaleT;
		if(alphaT  != null) this.alphaTransform  = alphaT;
		if(angleT  != null) this.angleTransform  = angleT;
	}
	
	this.emit = function(x, y, force, direction){
		if( !Sys.isDefined(x && y) ){
			_showError(51);
			return;
		}
		
		if(Game.room instanceof Room){
			Game.room.partList.push({
				part      : this,
				time      : this.timelife,
				gravity   : this.gravity,
				xscale    : this.xscale,
				yscale    : this.yscale,
				alpha     : this.alpha,
				angle     : 0,
				force     : force     || 0,
				direction : direction || 0,
				x	      : x,
				y	      : y,
				destroy   : function(){
					delete Game.room.partList[ Game.room.partList.indexOf(this) ];
				}
			});
		} else {
			_showError(50);
		}
	}
	
	if(image) Sys.toLoad++;
	this.__image__.onerror = function(){
		Sys.errorLoad++;
		if(typeof Sys.OnLoadError == "function") Sys.OnLoadError(this);
	}
	this.__image__.onload  = function(){
		Sys.loaded++;
	}
}
Object.defineProperty(Part.prototype, "image", {
	get: function(){ return this.__image__.src; },
	set: function(value){
		Sys.toLoad++;
		this.__image__.src = value;
	}
});

function Sprite(images, xoffset, yoffset){
	if(!Sys.isDefined(images)){
		_showError(6);
		return;
	}
	var i, obj = this;
	if(typeof images == "string" && images != ""){
		images = images.split(";");
		Sys.toLoad += images.length;
	}
	
	this.loaded   = 0;
	this.images   = [];
	this.xoffset  = xoffset || 0;
	this.yoffset  = yoffset || 0;
	this.xscale   = 1;
	this.yscale   = 1;
	this.angle    = 0;
	this.subimage = 0;
	Object.defineProperty(this, "image", {
		get: function(){
			return this.images[ this.subimage ];
		}
	});
	
	if(images != ""){
		for(i in images){
			if(typeof images[i] != "string") continue;
			this.images[i]         = new Image();
			this.images[i].onerror = function(){
				Sys.errorLoad++;
				if(typeof Sys.OnLoadError == "function") Sys.OnLoadError(this);
			}
			this.images[i].onload  = function(){
				obj.loaded += 100 / images.length;
				Sys.loaded++;
			}
			this.images[i].src = images[i];
		}
	}
}
function _copySprite(spr){ // Função usada para copiar o sprite
	if(!spr) return null;
	
	var obj = {
		loaded 	 : spr.loaded,
		images 	 : spr.images,
		xoffset	 : spr.xoffset,
		yoffset	 : spr.yoffset,
		xscale 	 : spr.xscale,
		yscale 	 : spr.yscale,
		__angle__: spr.angle,
		subimage : spr.subimage
	};
	Object.defineProperty(obj, "image", {
		get: function(){
			return this.images[ this.subimage ];
		}
	});
	Object.defineProperty(obj, "angle", {
		get: function(){ return this.__angle__; },
		set: function(value){
			if(value < 0){
				this.__angle__ = 360 + (value%360);
			} else if(value > 360){
				this.__angle__ = value%360;
			} else {
				this.__angle__ = value;
			}
		}
	})
	
	return obj;
}

function Model(sprite){
	this.sprite     	= sprite || new Sprite("");
	this.mask			= null;
	this.angle      	= 0;
	this.speed			= 0;
	this.__persistent__ = false;
	this.parent			= null;
	this.group			= [];
	this.visible    	= true;
	this.layer			= 0;
	this.paused     	= false;
	this.Create     	= null;
	this.Step1      	= null;
	this.Step2      	= null;
	this.Draw       	= null;
	this.Mouse      	= null;
	this.Keyboard   	= null;
	this.InPause    	= null;
	this.OnMove     	= null;
	this.getEntity  	= function(index){
		"use strict";
		var i, E = null, count = 0;
		for(i in Game.room.entityList){
			if(typeof Game.room.entityList[i] == "undefined") continue;
			if(Game.room.entityList[i].model == this){
				if(count == index){
					E = Game.room.entityList[i];
					break;
				}
				count++;
			}
		}
		return E;
	}
}

function Entity(model, x, y){
	if(!Sys.isDefined(model)){
		_showError(15);
		return;
	}
	if(!model instanceof Model){
		_showError(20);
		return;
	}
	
	this.__x__     = (x != undefined? x : 0);
	this.__y__     = (y != undefined? y : 0);
	this.xprevious = this.__x__;
	this.yprevious = this.__y__;
	Game.room.entityList.push(this);
	
	this.__sprite__ 	= (model.sprite == null? null : _copySprite(model.sprite) );
	this.model  		= model;
	this.mask			= model.mask;
	this.angle      	= model.angle;
	this.speed      	= model.speed;
	this.__persistent__ = model.__persistent__;
	this.parent			= model.parent;
	this.group			= model.group;
	this.visible    	= model.visible;
	this.__layer__		= model.layer;
	this.paused     	= model.paused;
	this.Create     	= model.Create;
	this.Step1      	= model.Step1;
	this.Step2      	= model.Step2;
	this.Draw       	= model.Draw;
	this.Mouse      	= model.Mouse;
	this.Keyboard   	= model.Keyboard;
	this.InPause    	= model.InPause;
	this.OnMove     	= model.OnMove;
	this.remove     	= function(){
		Game.entityRemove(this);
	}
	
	var aSelf = Self;
	Self = this;
	if(typeof this.Create == "function") this.Create();
	Self = aSelf;
}
Object.defineProperty(Entity.prototype, "layer", {
	get: function(){ return this.__layer__; },
	set: function(value){
		this.__layer__ = value;
		__changeLayer();
	}
});

Object.defineProperty(Entity.prototype, "persistent", {
	get: function(){ return this.__persistent__; },
	set: function(value){
		"use strict";
		this.__persistent__ = value;
		var R = Game.entityGlobal.indexOf(this);
		if(value){
			if(R == -1){
				Game.entityGlobal.push(this);
			}
		} else if(R != -1){
			Game.entityGlobal[R] = undefined;
		}
	}
});

// Posição X/Y do objeto.
Object.defineProperty(Entity.prototype, "x", {
	get: function(){ return this.__x__; },
	set: function(value){
		"use strict";
		this.xprevious = this.__x__;
		this.__x__     = value;
		if(typeof this.OnMove == "function"){
			var _aSelf = Self, _aOther = Other;
			Self       = this;
			Other      = _aSelf;
			this.OnMove("x", value - this.xprevious);
			Self  = _aSelf;
			Other = _aOther;
		}
	}
});
Object.defineProperty(Entity.prototype, "y", {
	get: function(){ return this.__y__; },
	set: function(value){
		"use strict";
		this.yprevious = this.__y__;
		this.__y__     = value;
		if(typeof this.OnMove == "function"){
			var _aSelf = Self, _aOther = Other;
			Self       = this;
			Other      = _aSelf;
			this.OnMove("y", value - this.yprevious);
			Self  = _aSelf;
			Other = _aOther;
		}
	}
});

Object.defineProperty(Entity.prototype, "sprite", {
	get: function(){ return this.__sprite__; },
	set: function(value){
		delete this.__sprite__;
		this.__sprite__ = _copySprite(value);
	}
});

function __changeLayer(){
	"use strict";
	var nList = [], nCheck = [], i, E;
	for(i in Game.room.entityList){
		E = Game.room.entityList[i];
		if(typeof E != "object") continue;
		nCheck.push(E.__layer__.toString()+"|"+i.toString());
	}
	
	nCheck = nCheck.sort( function(a, b){ return a - b; } );
	
	for(i in nCheck){
		if(typeof nCheck[i] != "string") break;
		E = parseInt( nCheck[i].substring(nCheck[i].indexOf("|")+1)  );
		nList.push( Game.room.entityList[E] );
	}
	Game.room.entityList = nList;
}

function createCanvas(width, height){ // Criando novo canvas
	var canvas = document.createElement("canvas");
	if(!Sys.supportCanvas) _showError(0);
	canvas.width   = width  || 300;
	canvas.height  = height || 150;
	canvas.context = canvas.getContext("2d");
	return canvas;
}

function createSound(src){
	if(typeof src != "string"){
		_showError(31);
		return;
	}
	var ext = src.substring(src.lastIndexOf(".")+1);
	if(!Sys.supportAudio(ext)){
		_showError(32, ext);
		return new Audio();
	}
	
	var a    = new Audio();
	a.loaded = 0;
	a.src    = src;
	Sys.toLoad++;
	a.oncanplay  = function(){
		a.loaded = 100;
		Sys.loaded++;
	}
	a.onerror = function(){
		a.loaded = 100;
		Sys.loaded++;
		Sys.errorLoad++;
		if(typeof Sys.OnLoadError == "function") Sys.OnLoadError(this);
	}
	return a;
}

// ---- Funções ---- //

Math.roundGrid    = function(value, grid){
	"use strict";
	return Math.round( value / grid ) * grid;
}
Math.idealRefresh = function(){
	"use strict";
	if(Game.room.speed == 0) return 200; // 200*5 = 1000
	return Math.floor( (1000/Game.room.speed)/5 );
}
Math.idealSpeed   = function(){
	"use strict";
	if(Draw.refresh == 0) return 200; // 1000/5 = 200
	return Math.floor( (1000/(Draw.refresh*5))/10 )*10;
}
Math.rad2deg = function(value){
	"use strict";
	return value * (-180 / Math.PI);
}
Math.deg2rad = function(value){
	"use strict";
	return value * (Math.PI / -180);
}
Math.distance = function(x1, y1, x2, y2){
	"use strict";
	if(!Sys.isDefined(x1 && y1 && x2 && y2)) _showError(13);
	/*    ________________________
	 *  \/ (x1 - x2)² + (y1 - y2)² = Distância
	 */
	return Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) );
}
Math.angle = function(x1, y1, x2, y2){
	"use strict";
	if(!Sys.isDefined(x1 && y1 && x2 && y2)) _showError(14);
	
	return Math.rad2deg( Math.atan2(y2 - y1, x2 - x1) );
}
Math.radiusGetPoint = function(radius, angle){
	"use strict";
	if(!Sys.isDefined(radius && angle)) _showError(49);
	
	var xx = radius * Math.cos( Math.deg2rad(angle) );
	var yy = radius * Math.sin( Math.deg2rad(angle) );
	return {x: xx, y: yy};
}
Math.randombet  = function(v1, v2){
	"use strict";
	if(!Sys.isDefined(v1 && v2)) return 0;
	return Math.round( Math.random()*Math.abs(v1-v2) )+v1;
}
Math.choose     = function(){
	return arguments[ Math.randombet(0, arguments.length-1) ];
}
Math.percentage = function(number1, number2, get){
	"use strict";
	if(!Sys.isDefined(number1 && number2)) _showError(30);
	if(get){
		// Retorna a porcentagem que equivale o n1 do n2.
		return (number1 /  number2)*100;
	} else {
		// Retorna o valor que equivale a porcentagem(n1) do n2.
		return (number1 * number2)/100;
	}
}

// Random com sistema de seed.(semente)
Math.__seedActualValue__ = 0, Math.__seed__ = 0;
Object.defineProperty(Math, "seed", {
	get: function(){ return Math.__seed__; },
	set: function(value){
		Math.__seed__            = value;
		Math.__seedActualValue__ = value;
	}
});
Math.rseed    = function(){
	Math.seed = Math.round( Math.random()*9999999999999 )+100000;
}
Math.rseed(); // Iniciando com seed aleatória.
Math.srandom  = function(v1, v2){
	"use strict";
	if(!Sys.isDefined(v1)) _showError(18);
	var val, nMax = 989999999999999999999;
	if(v2 != null){
		val = v1+(7*Math.__seedActualValue__)%(Math.abs(v1 - v2)+1);
	} else {
		val = (7*Math.__seedActualValue__)%(v1+1);
	}
	
	Math.__seedActualValue__ = (7*Math.__seedActualValue__)%nMax;
	return val;
}

Array.prototype.set2D = function(x, y, value){
	"use strict";
	if(!Sys.isDefined(x && y && value)) _showError(19);
	if(typeof this[x] == "undefined"){
		this[x] = [];
	}
	this[x][y] = value;
}
Array.prototype.get2D = function(x, y){
	"use strict";
	if(!Sys.isDefined(x && y)) return null;
	if(typeof this[x] == "undefined") return null;
	
	return this[x][y];
}

// ---- Erros ---- //
function _showError(errorID, txt){
	switch(errorID){
		case  0: Sys.drawError("System : Canvas not supported.", true); break;
		case  1: Sys.drawError("Game.setCanvas() : Invalid Canvas element.", Game.stopOnError); break;
		case  2: Sys.drawError("Draw : Game.context not defined.", Game.stopOnError); break;
		case  3: Sys.drawError("Draw.rectangle() : Arguments (x, y, width, height, [outline]) expected.", Game.stopOnError); break;
		case  4: Sys.drawError("Draw.line() : Arguments (x1, y1, x2, y2, [size]) expected.", Game.stopOnError); break;
		case  5: Sys.drawError("Draw.text() : Arguments (text, x, y, [color], [width]) expected.", Game.stopOnError); break;
		case  6: Sys.drawError("Constructor Sprite() : Argument (images, [xoffset], [yoffset]) expected.", Game.stopOnError); break;
		case  7: Sys.drawError("Draw.sprite() : Arguments (sprite, imageid, x, y) expected.", Game.stopOnError); break;
		case  8: Sys.drawError("Draw.circle() : Arguments (x, y, radius, [outline], [angleEnd], [angleStart], [closed]) expected.", Game.stopOnError); break;
		case  9: Sys.drawError("Draw.point() : Arguments (x, y, [size]) expected.", Game.stopOnError); break;
		case 10: Sys.drawError("Draw.curve() : Arguments (p1x, p1y, p2x, p2y, p3x, p3y, [size]) expected.", Game.stopOnError); break;
		case 11: Sys.drawError("Draw.image() : Arguments (image, x, y, [xoffset, yoffset], [xscale, yscale], [angle]) expected.", Game.stopOnError); break;
		case 12: Sys.drawError("Draw.setTarget() : Canvas or context argument is expected.", Game.stopOnError); break;
		case 13: Sys.drawError("Math.distance() : Arguments (x1, y1, x2, y2) expected.", Game.stopOnError); break;
		case 14: Sys.drawError("Math.direction() : Arguments (x1, y1, x2, y2) expected.", Game.stopOnError); break;
		case 15: Sys.drawError("Constructor Entity() : Arguments (model, [x], [y]) expected.", Game.stopOnError); break;
		case 16: Sys.drawError("Draw.radius() : Arguments (x, y, length, angle, [size]) expected.", Game.stopOnError); break;
		case 17: Sys.drawError("Sys.readonly() : Argument (variable{string}) expected.", Game.stopOnError); break;
		case 18: Sys.drawError("Math.srandom() : Arguments (valueMax) or (valueStart, valueMax) expected.", Game.stopOnError); break;
		case 19: Sys.drawError("[Array].set2D() : Arguments (x, y, value) expected.", Game.stopOnError); break;
		case 20: Sys.drawError("Constructor Entity() : Invalid model argument.", Game.stopOnError); break;
		case 21: Sys.drawError("Sys.drawError() : Arguments (text, [stop]) expected."); break;
		case 22: Sys.drawError("Key.isDown() : Argument (keyCode) is a real or string.", Game.stopOnError); break;
		case 23: Sys.drawError("Key.isUp() : Argument (keyCode) is a real or string.", Game.stopOnError); break;
		case 24: Sys.drawError("Key.simulate() : Arguments (keyCode{string or real}, down) expected.", Game.stopOnError); break;
		case 25: Sys.drawError("Mouse.isUp() : Argument (button) expected.", Game.stopOnError); break;
		case 26: Sys.drawError("Mouse.isDown() : Argument (button) expected.", Game.stopOnError); break;
		case 27: Sys.drawError("Mouse.simulate() : Arguments (button, down) expected.", Game.stopOnError); break;
		case 28: Sys.drawError("Mouse.isWheel() : Argument (direction) expected.", Game.stopOnError); break;
		case 29: Sys.drawError("Game.entityRemove() : Argument(entity) expected.", Game.stopOnError); break;
		case 30: Sys.drawError("Math.percentage() : Arguments (number1, number2, [get]) expected.", Game.stopOnError); break;
		case 31: Sys.drawError("createSound() : Argument src is a string.", Game.stopOnError); break;
		case 32: Sys.drawError('System : Audio file ".'+txt+'" not supported.', false); break;
		case 33: Sys.drawError("Sys.loading() : Arguments (run, [text], [textColor], [font], [barColor], [bgColor]) expected.", Game.stopOnError); break;
		case 34: Sys.drawError("Key.inDown() : Argument (keyCode) is a real or string.", Game.stopOnError); break;
		case 35: Sys.drawError("Constructor Mask() : Arguments (width, height) expected.", Game.stopOnError); break;
		case 36: Sys.drawError("Sys.repeat() : Arguments (number, execution{function}) expected.", Game.stopOnError); break;
		case 37: Sys.drawError("withModel() : Arguments (model, exec{string or function}, [Other]) expected.", Game.stopOnError); break;
		case 38: Sys.drawError("Data : localStorage and Cookie not supported.", false); break;
		case 39: Sys.drawError("Data : Cookie not supported.", false); break;
		case 40: Sys.drawError("Data.http() : Arguments (url, type, [post], [exec]) or (url, type, [exec]) expected.", Game.stopOnError); break;
		case 41: Sys.drawError("Constructor Tileset() : Arguments (image, tileWidth, tileHeight) expected.", Game.stopOnError); break;
		case 42: Sys.drawError("addTile() : Arguments (tileset, tilex, tiley, x, y) expected.", Game.stopOnError); break;
		case 43: Sys.drawError("removeTile() : Arguments (x, y) expected.", Game.stopOnError); break;
		case 44: Sys.drawError("Mouse.inDown() : Argument (button) expected.", Game.stopOnError); break;
		case 45: Sys.drawError("Mouse.inCircle() : Arguments (x, y, radius, button, [absolute]) expected.", Game.stopOnError); break;
		case 46: Sys.drawError("Touch.inCircle() : Arguments (x, y, radius, [absolute]) expected.", Game.stopOnError); break;
		case 47: Sys.drawError("Mouse.inRectangle() : Arguments (x, y, width, height, button, [absolute]) expected.", Game.stopOnError); break;
		case 48: Sys.drawError("Touch.inRectangle() : Arguments (x, y, width, height, [absolute]) expected.", Game.stopOnError); break;
		case 49: Sys.drawError("Math.radiusGetPoint() : Arguments (radius, angle) expected.", Game.stopOnError); break;
		case 50: Sys.drawError("Part.emit() : Game.room is not defined to a room.", false); break;
		case 51: Sys.drawError("Part.emit() : Arguments (x, y, [force], [direction]) expected.", Game.stopOnError); break;
		case 52: Sys.drawError("Part.setTransform() : Arguments (xscaleT, [yscaleT], [alphaT], [angleT]) expected.", Game.stopOnError); break;
		case 53: Sys.drawError("Draw.projection() : Arguments (x, y, xscale, yscale, angle, px, py, pwidth, pheight) expected.", Game.stopOnError); break;
		case 54: Sys.drawError("Draw.imageRepeat() : Arguments (image, x, y) expected.", Game.stopOnError); break;
		default: Sys.drawError("Unexpected error.", Game.stopOnError); break;
	}
}


// ---- Compatibilidade ---- //
__WARNS__ = "";

(function(){
	var _showWarn_ = function(text){
		console.warn(text);
		__WARNS__ += "<p class='conWarn'>> " + text.replace(/\n/g, "<br>") + "</p>";
	}
	
	// Compatibilidade com colisão avançada.
	var chk = new Uint8ClampedArray();
	if(typeof chk.indexOf == "undefined"){
		_showWarn_("This browser is not complete compatible with advanced collision.\n"+
				   "Its runs, but slowly.");
				   
		Col.compatible = false;
	}
})();
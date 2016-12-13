(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.webvrui = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
/*!
* screenfull
* v3.0.0 - 2015-11-24
* (c) Sindre Sorhus; MIT License
*/
(function () {
	'use strict';

	var isCommonjs = typeof module !== 'undefined' && module.exports;
	var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;

	var fn = (function () {
		var val;
		var valLength;

		var fnMap = [
			[
				'requestFullscreen',
				'exitFullscreen',
				'fullscreenElement',
				'fullscreenEnabled',
				'fullscreenchange',
				'fullscreenerror'
			],
			// new WebKit
			[
				'webkitRequestFullscreen',
				'webkitExitFullscreen',
				'webkitFullscreenElement',
				'webkitFullscreenEnabled',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			// old WebKit (Safari 5.1)
			[
				'webkitRequestFullScreen',
				'webkitCancelFullScreen',
				'webkitCurrentFullScreenElement',
				'webkitCancelFullScreen',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			[
				'mozRequestFullScreen',
				'mozCancelFullScreen',
				'mozFullScreenElement',
				'mozFullScreenEnabled',
				'mozfullscreenchange',
				'mozfullscreenerror'
			],
			[
				'msRequestFullscreen',
				'msExitFullscreen',
				'msFullscreenElement',
				'msFullscreenEnabled',
				'MSFullscreenChange',
				'MSFullscreenError'
			]
		];

		var i = 0;
		var l = fnMap.length;
		var ret = {};

		for (; i < l; i++) {
			val = fnMap[i];
			if (val && val[1] in document) {
				for (i = 0, valLength = val.length; i < valLength; i++) {
					ret[fnMap[0][i]] = val[i];
				}
				return ret;
			}
		}

		return false;
	})();

	var screenfull = {
		request: function (elem) {
			var request = fn.requestFullscreen;

			elem = elem || document.documentElement;

			// Work around Safari 5.1 bug: reports support for
			// keyboard in fullscreen even though it doesn't.
			// Browser sniffing, since the alternative with
			// setTimeout is even worse.
			if (/5\.1[\.\d]* Safari/.test(navigator.userAgent)) {
				elem[request]();
			} else {
				elem[request](keyboardAllowed && Element.ALLOW_KEYBOARD_INPUT);
			}
		},
		exit: function () {
			document[fn.exitFullscreen]();
		},
		toggle: function (elem) {
			if (this.isFullscreen) {
				this.exit();
			} else {
				this.request(elem);
			}
		},
		raw: fn
	};

	if (!fn) {
		if (isCommonjs) {
			module.exports = false;
		} else {
			window.screenfull = false;
		}

		return;
	}

	Object.defineProperties(screenfull, {
		isFullscreen: {
			get: function () {
				return Boolean(document[fn.fullscreenElement]);
			}
		},
		element: {
			enumerable: true,
			get: function () {
				return document[fn.fullscreenElement];
			}
		},
		enabled: {
			enumerable: true,
			get: function () {
				// Coerce to boolean in case of old WebKit
				return Boolean(document[fn.fullscreenEnabled]);
			}
		}
	});

	if (isCommonjs) {
		module.exports = screenfull;
	} else {
		window.screenfull = screenfull;
	}
})();

},{}],3:[function(require,module,exports){
"use strict";

var _EnterVRButton = require("./EnterVRButton");

var _states = require("./states");

var State = _interopRequireWildcard(_states);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

if (typeof AFRAME !== 'undefined' && AFRAME) {
    AFRAME.registerComponent('webvr-ui', {
        dependencies: ['canvas'],

        schema: {
            enabled: { type: 'boolean', default: true }
        },

        init: function init() {},

        update: function update() {
            var scene = document.querySelector('a-scene');
            scene.setAttribute("vr-mode-ui", { enabled: !this.data.enabled });

            if (this.data.enabled) {
                if (this.enterVREl) {
                    return;
                }

                var options = {
                    onRequestStateChange: function onRequestStateChange(state) {
                        if (state == State.PRESENTING) {
                            scene.enterVR();
                        } else {
                            scene.exitVR();
                        }
                        return false;
                    }
                };

                var enterVR = this.enterVR = new _EnterVRButton.EnterVRButton(scene.canvas, options);

                this.enterVREl = enterVR.domElement;

                document.body.appendChild(enterVR.domElement);

                enterVR.domElement.style.position = "absolute";
                enterVR.domElement.style.bottom = "10px";

                enterVR.domElement.style.left = "50%";
                enterVR.domElement.style.transform = "translate(-50%, -50%)";
                enterVR.domElement.style.textAlign = "center";
            } else {
                if (this.enterVREl) {
                    this.enterVREl.parentNode.removeChild(this.enterVREl);
                    this.enterVR.remove();
                }
            }
        },

        remove: function remove() {
            if (this.enterVREl) {
                this.enterVREl.parentNode.removeChild(this.enterVREl);
                this.enterVR.remove();
            }
        }
    });
}
// import * as manager from "./WebVRManager";

},{"./EnterVRButton":5,"./states":7}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _WebVRUI_css_injected = false;

var cssPrefix = "webvr-ui";

var DefaultButtonDom = exports.DefaultButtonDom = function () {
    function DefaultButtonDom(options) {
        _classCallCheck(this, DefaultButtonDom);

        this.domElement = document.createElement("div");

        this.domElement.className = cssPrefix;
        this.height = options.height;
        this.fontSize = this.height / 2.5;

        this.domElement.innerHTML = DefaultButtonDom.generateHTML(this.fontSize);

        if (!options.add360Link) {
            this.getChild("enter360").style.display = "none";
        }
    }

    _createClass(DefaultButtonDom, [{
        key: "getChild",
        value: function getChild(suffix) {
            return this.domElement.querySelector("." + cssPrefix + "-" + suffix);
        }
    }, {
        key: "injectCSS",
        value: function injectCSS() {
            // Make sure its only injected once
            if (!_WebVRUI_css_injected) {
                _WebVRUI_css_injected = true;

                // Create the css
                var style = document.createElement("style");
                style.innerHTML = DefaultButtonDom.generateCss(cssPrefix, this.height, this.fontSize);

                var head = document.getElementsByTagName("head")[0];
                head.insertBefore(style, head.firstChild);
            }
        }
    }, {
        key: "setTitle",
        value: function setTitle(text) {
            var disabled = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            var button = this.getChild("button");
            var title = this.getChild("title");
            button.title = text;
            button.setAttribute("disabled", disabled);

            if (!text) {
                title.style.display = "none";
            } else {
                title.innerText = text;
                title.style.display = "inherit";
            }
        }
    }, {
        key: "setTooltip",
        value: function setTooltip(tooltip) {
            var button = this.getChild("button");
            button.title = tooltip;
        }
    }, {
        key: "setDescription",
        value: function setDescription(html) {
            var descrip = this.getChild("description");
            descrip.innerHTML = html;
        }
    }, {
        key: "set360Title",
        value: function set360Title(html) {
            var threeSixty = this.getChild("enter360");
            threeSixty.innerText = html;
        }
    }], [{
        key: "generateHTML",
        value: function generateHTML(fontSize) {

            var svgString = DefaultButtonDom.generateVRIcon(cssPrefix + "-svg", fontSize);

            return "\n            <button class=\"" + cssPrefix + "-button\">\n              <div class=\"" + cssPrefix + "-title\"></div>\n              <div class=\"" + cssPrefix + "-logo\">" + svgString + "</div>\n            </button>\n            <div class=\"" + cssPrefix + "-description\"></div>\n            <div class=\"" + cssPrefix + "-enter360\"></div>";
        }
    }, {
        key: "generateVRIcon",
        value: function generateVRIcon(cssClass, height) {
            var fill = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "#000000";

            var aspect = 28 / 18;
            return "<svg class=\"" + cssClass + "\" version=\"1.1\" x=\"0px\" y=\"0px\" width=\"" + aspect * height + "px\" height=\"" + height + "px\" viewBox=\"0 0 28 18\" xml:space=\"preserve\">\n                <path fill=\"" + fill + "\" d=\"M26.8,1.1C26.1,0.4,25.1,0,24.2,0H3.4c-1,0-1.7,0.4-2.4,1.1C0.3,1.7,0,2.7,0,3.6v10.7\n            c0,1,0.3,1.9,0.9,2.6C1.6,17.6,2.4,18,3.4,18h5c0.7,0,1.3-0.2,1.8-0.5c0.6-0.3,1-0.8,1.3-1.4l1.5-2.6C13.2,13.1,13,13,14,13v0h-0.2\n            h0c0.3,0,0.7,0.1,0.8,0.5l1.4,2.6c0.3,0.6,0.8,1.1,1.3,1.4c0.6,0.3,1.2,0.5,1.8,0.5h5c1,0,2-0.4,2.7-1.1c0.7-0.7,1.2-1.6,1.2-2.6\n            V3.6C28,2.7,27.5,1.7,26.8,1.1z M7.4,11.8c-1.6,0-2.8-1.3-2.8-2.8c0-1.6,1.3-2.8,2.8-2.8c1.6,0,2.8,1.3,2.8,2.8\n            C10.2,10.5,8.9,11.8,7.4,11.8z M20.1,11.8c-1.6,0-2.8-1.3-2.8-2.8c0-1.6,1.3-2.8,2.8-2.8C21.7,6.2,23,7.4,23,9\n            C23,10.5,21.7,11.8,20.1,11.8z\"/>\n            </svg>";
        }
        /*
            static generate360Icon(cssClass, height, fill="#000000"){
                let aspect = 28/18;
                return (
                    `<svg class="${cssClass}" version="1.1" x="0px" y="0px" width="${aspect*height}px" height="${height}px" viewBox="0 0 28 11" xml:space="preserve">
                        <path fill="${fill}" d="M17.3,7.1c0.3,0,0.9,0,1.6,0c0.7,0,1.5-0.1,2.4-0.2c0.9-0.1,2-0.3,3-0.6c0.5-0.2,1.1-0.4,1.6-0.7
                    c0.5-0.3,0.8-0.7,0.8-0.9c0-0.1-0.1-0.3-0.3-0.5c-0.2-0.2-0.5-0.3-0.8-0.5c-0.6-0.3-1.3-0.5-2-0.6c-1.4-0.3-3-0.5-4.6-0.6
                    c-0.7-0.1-1.7-0.1-2.3-0.1v-1c0.6,0,1.6,0,2.4,0.1c1.6,0.1,3.2,0.2,4.7,0.5c0.8,0.2,1.5,0.3,2.2,0.6c0.4,0.2,0.7,0.3,1.1,0.6
                    C27.5,3.6,27.9,4,28,4.6c0.1,0.6-0.2,1.1-0.4,1.5c-0.3,0.3-0.6,0.6-0.9,0.8c-0.6,0.4-1.2,0.7-1.8,0.9c-1.2,0.5-2.3,0.7-3.3,1
                    c-1,0.2-1.9,0.3-2.6,0.4c-0.7,0.1-1.4,0.1-1.8,0.2c-0.2,0-0.5,0-0.5,0v1.6L13.7,8l3.1-2.9v1.9C16.8,7.1,17.1,7.1,17.3,7.1z"/>
                    <path id="XMLID_15_" d="M10.5,3.8c-0.3,0-0.8,0-1.5,0C8.4,3.8,7.6,3.9,6.7,4c-0.9,0.1-2,0.3-3,0.6C3.1,4.8,2.6,5,2.1,5.3
                    C1.6,5.6,1.3,6,1.3,6.2c0,0.1,0.1,0.3,0.3,0.5C1.8,6.8,2.1,7,2.4,7.1c0.6,0.3,1.3,0.5,2,0.6c1.4,0.3,2.8,0.5,4.4,0.6
                    c0.7,0.1,1.5,0.1,2.1,0.1v1c-0.6,0-1.4,0-2.2-0.1C7.1,9.3,5.6,9.1,4.1,8.8C3.3,8.7,2.6,8.5,1.9,8.2C1.5,8,1.2,7.9,0.8,7.6
                    C0.5,7.4,0.1,7,0,6.4c-0.1-0.6,0.2-1.1,0.4-1.5C0.7,4.6,1,4.3,1.3,4.1c0.6-0.4,1.2-0.7,1.8-0.9c1.2-0.5,2.3-0.7,3.3-1
                    C7.4,2,8.2,1.9,9,1.8c0.7-0.1,1.2-0.1,1.6-0.2c0.2,0,0.3,0,0.3,0V0L14,2.9l-3.1,2.9V3.9C10.9,3.9,10.7,3.8,10.5,3.8z"/>
                    </svg>`
                );
            }*/

    }, {
        key: "generateCss",
        value: function generateCss(prefix) {
            var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 50;
            var fontSize = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 18;
            var disabledColor = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "rgba(255,255,255,0.4)";

            var borderWidth = 2;
            var borderRadius = height / 2;
            // borderRadius = 0;

            return "\n            @font-face {\n                font-family: 'Karla';\n                font-style: normal;\n                font-weight: 400;\n                src: local('Karla'), local('Karla-Regular'), url(https://fonts.gstatic.com/s/karla/v5/31P4mP32i98D9CEnGyeX9Q.woff2) format('woff2');\n                unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;\n            }\n            @font-face {\n                font-family: 'Karla';\n                font-style: normal;\n                font-weight: 400;\n                src: local('Karla'), local('Karla-Regular'), url(https://fonts.gstatic.com/s/karla/v5/Zi_e6rBgGqv33BWF8WTq8g.woff2) format('woff2');\n                unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2212, U+2215, U+E0FF, U+EFFD, U+F000;\n            }\n            \n            ." + prefix + " {\n                font-family: 'Karla', sans-serif;\n            }\n\n            button." + prefix + "-button {\n                border: white " + borderWidth + "px solid;\n                border-radius: " + borderRadius + "px;\n                box-sizing: border-box;\n                background: rgba(0,0,0, 0);\n\n                height: " + height + "px;\n                min-width: " + 125 + "px;\n                display: inline-block;\n                position: relative;\n\n                margin-top: 8px;\n\n                cursor: pointer;\n\n                -webkit-transition: width 0.5s;\n                transition: width 0.5s;\n            }\n\n            /*\n            * Logo\n            */\n\n            ." + prefix + "-logo {\n                width: " + height + "px;\n                height: " + height + "px;\n                border-radius: " + borderRadius + "px;\n                background-color: white;\n                position: absolute;\n                top:-" + borderWidth + "px;\n                left:-" + borderWidth + "px;\n            }\n            ." + prefix + "-logo > svg {\n                margin-top: " + (height - fontSize) / 2 + "px;\n            }\n\n\n            /*\n            * Title\n            */\n\n            ." + prefix + "-title {\n                color: white;\n                position: relative;\n                font-size: " + fontSize + "px;\n                top: -" + borderWidth + "px;\n                line-height: " + (height - borderWidth * 2) + "px;\n                text-align: left;\n                padding-left: " + height * 1.05 + "px;\n                padding-right: " + (borderRadius - 10 < 5 ? 5 : borderRadius - 10) + "px;\n            }\n\n            /*\n            * Description\n            */\n\n            ." + prefix + "-description , ." + prefix + "-enter360{\n                font-size: 13px;\n                margin-top: 15px;\n                margin-bottom: 10px;\n\n            }\n\n            ." + prefix + "-description > a {\n                color: white\n            }\n            \n            ." + prefix + "-enter360 {\n                text-decoration: underline;\n                cursor: pointer;\n            }\n\n            /*\n            * disabled\n            */\n\n            button." + prefix + "-button[disabled=true] {\n                border-color: " + disabledColor + ";\n            }\n            button." + prefix + "-button[disabled=true] > ." + prefix + "-logo {\n                background-color: " + disabledColor + ";\n                top:0;\n                left:0;\n                width: " + (height - 4) + "px;\n                height: " + (height - 4) + "px;\n            }\n            button." + prefix + "-button[disabled=true] > ." + prefix + "-logo > svg {\n                margin-top: " + ((height - fontSize) / 2 - 2) + "px;\n                margin-left: -2px;\n            }\n            \n            button." + prefix + "-button[disabled=true] > ." + prefix + "-title {\n                color: " + disabledColor + ";\n            }\n\n        ";
        }
    }]);

    return DefaultButtonDom;
}();

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EnterVRButton = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _WebVRManager = require("./WebVRManager");

var _DefaultButtonDom = require("./DefaultButtonDom");

var _states = require("./states");

var State = _interopRequireWildcard(_states);

var _eventemitter = require("eventemitter3");

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A button to allow easy-entry and messaging around a WebVR experience
 * @class
 */
var EnterVRButton = exports.EnterVRButton = function (_EventEmitter) {
    _inherits(EnterVRButton, _EventEmitter);

    /**
     * Construct a new Enter VR Button
     * @constructor
     * @param {HTMLCanvasElement} sourceCanvas the canvas that you want to present in WebVR
     *
     * @param {Object} [options] optional parameters
     * @param {Number} [options.height=35] specify the height of the button
     * @param {AbstractButtonDom} [options.buttonClass=DefaultButtonDom] specify a custom button class
     * @param {Boolean} [options.injectCSS=true] set to false if you want to write your own styles
     * @param {Function} [options.onRequestStateChange] set to a function returning false to prevent default state changes
     */
    function EnterVRButton(sourceCanvas, options) {
        _classCallCheck(this, EnterVRButton);

        var _this = _possibleConstructorReturn(this, (EnterVRButton.__proto__ || Object.getPrototypeOf(EnterVRButton)).call(this));

        options = options || {};
        // Option to change pixel height of the button.
        options.height = options.height || 45;
        options.injectCSS = options.injectCSS !== false;

        options.onRequestStateChange = options.onRequestStateChange || function () {
            return true;
        };

        options.textEnterVRTitle = options.textEnterVRTitle || 'Enter VR';
        options.textExitVRTitle = options.textExitVRTitle || 'Exit VR';
        options.text360Title = options.text360Title || 'or try it in 360° mode';

        _this.options = options;

        _this.sourceCanvas = sourceCanvas;

        _this.buttonClass = options.buttonClass || new _DefaultButtonDom.DefaultButtonDom(options);

        if (options.injectCSS && _this.buttonClass.injectCSS) {
            _this.buttonClass.injectCSS();
        }

        // Create WebVR Manager
        _this.manager = new _WebVRManager.WebVRManager();
        _this.manager.addListener("change", function (state) {
            return _this.__onStateChange(state);
        });

        // Bind button click events to __onClick
        _this.__onEnterVRClick = _this.__onEnterVRClick.bind(_this);
        _this.__onEnter360Click = _this.__onEnter360Click.bind(_this);
        _this.buttonClass.getChild("button").addEventListener("click", _this.__onEnterVRClick);
        _this.buttonClass.getChild("enter360").addEventListener("click", _this.__onEnter360Click);

        _this.buttonClass.setTitle(_this.options.textEnterVRTitle);
        _this.buttonClass.set360Title(_this.options.text360Title);
        return _this;
    }

    _createClass(EnterVRButton, [{
        key: "show",
        value: function show() {
            this.domElement.style.display = "inherit";
            return this;
        }
    }, {
        key: "hide",
        value: function hide() {
            this.domElement.style.display = "none";
            return this;
        }

        /**
         * clean up object for garbage collection
         */

    }, {
        key: "remove",
        value: function remove() {
            this.manager.remove();

            if (this.domElement.parentElement) {
                this.domElement.parentElement.removeChild(this.domElement);
            }
        }

        /**
         * @private
         * Handling click event from button
         */

    }, {
        key: "__onEnterVRClick",
        value: function __onEnterVRClick() {
            if (this.state == State.READY_TO_PRESENT) {
                if (this.options.onRequestStateChange(State.PRESENTING)) {
                    this.manager.enterVR(this.manager.defaultDisplay, this.sourceCanvas);
                }
            } else if (this.state == State.PRESENTING) {
                if (this.options.onRequestStateChange(State.READY_TO_PRESENT)) {
                    this.manager.exitVR(this.manager.defaultDisplay);
                }
            }
        }
    }, {
        key: "__onEnter360Click",
        value: function __onEnter360Click() {
            if (this.state != State.PRESENTING) {
                if (this.options.onRequestStateChange(State.PRESENTING)) {
                    this.manager.enter360(this.sourceCanvas);
                }
            } else if (this.state == State.PRESENTING) {
                if (this.options.onRequestStateChange(State.READY_TO_PRESENT)) {
                    this.manager.exit360();
                }
            }
        }

        /**
         * @private
         */

    }, {
        key: "__onStateChange",
        value: function __onStateChange(state) {
            if (state != this.state) {
                if (this.state === State.PRESENTING) {
                    this.emit("exit");
                }

                switch (state) {
                    case State.READY_TO_PRESENT:
                        this.show();
                        this.buttonClass.setTitle(this.options.textEnterVRTitle);
                        this.buttonClass.setDescription("Get your headset ready. <a href='http://webvr.info' target='_blank'>Learn more.</a>");
                        if (this.manager.defaultDisplay) this.buttonClass.setTooltip("Enter VR using " + this.manager.defaultDisplay.displayName);
                        this.buttonClass.set360Title(this.options.text360Title);
                        break;

                    case State.PRESENTING:
                        this.hide();
                        this.buttonClass.setTitle(this.options.textExitVRTitle);
                        this.buttonClass.setDescription("");
                        this.emit("enter");
                        break;

                    // Error states
                    case State.ERROR_BROWSER_NOT_SUPPORTED:
                        this.show();
                        this.buttonClass.setTitle("Browser not supported", true);
                        this.buttonClass.setDescription("Sorry, your browser doesn't support <a href='http://webvr.info'>WebVR</a>");
                        this.emit("error", new Error(state));
                        break;

                    case State.ERROR_NO_PRESENTABLE_DISPLAYS:
                        this.show();
                        this.buttonClass.setTitle(this.options.textEnterVRTitle, true);
                        this.buttonClass.setDescription("No VR headset found. <a href='http://webvr.info'>Learn more</a>");
                        this.emit("error", new Error(state));
                        break;

                    case State.ERROR_REQUEST_TO_PRESENT_REJECTED:
                        this.show();
                        this.buttonClass.setTitle(this.options.textEnterVRTitle, true);
                        this.buttonClass.setDescription("Something went wrong trying to start presenting to your headset.");
                        this.emit("error", new Error(state));
                        break;

                    case State.ERROR_EXIT_PRESENT_REJECTED:
                    default:
                        this.show();
                        this.buttonClass.setTitle(this.options.textEnterVRTitle, true);
                        this.buttonClass.setDescription("Unknown error.");
                        this.emit("error", new Error(state));
                }
                this.state = state;
            }
        }
    }, {
        key: "domElement",
        get: function get() {
            return this.buttonClass.domElement;
        }
    }]);

    return EnterVRButton;
}(_eventemitter2.default);

},{"./DefaultButtonDom":4,"./WebVRManager":6,"./states":7,"eventemitter3":1}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WebVRManager = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _states = require("./states");

var State = _interopRequireWildcard(_states);

var _eventemitter = require("eventemitter3");

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _screenfull = require("screenfull");

var _screenfull2 = _interopRequireDefault(_screenfull);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WebVRManager = exports.WebVRManager = function (_EventEmitter) {
    _inherits(WebVRManager, _EventEmitter);

    function WebVRManager() {
        _classCallCheck(this, WebVRManager);

        var _this = _possibleConstructorReturn(this, (WebVRManager.__proto__ || Object.getPrototypeOf(WebVRManager)).call(this));

        _this.state = State.PREPARING;

        _this.checkDisplays();

        // Bind vr display present change event to __onVRDisplayPresentChange
        _this.__onVRDisplayPresentChange = _this.__onVRDisplayPresentChange.bind(_this);
        window.addEventListener("vrdisplaypresentchange", _this.__onVRDisplayPresentChange);

        _this.__onChangeFullscreen = _this.__onChangeFullscreen.bind(_this);
        if (_screenfull2.default.enabled) {
            document.addEventListener(_screenfull2.default.raw.fullscreenchange, _this.__onChangeFullscreen);
        }

        return _this;
    }

    /**
     * Check if the browser is compatible with WebVR and has headsets.
     * @returns {Promise<VRDisplay>}
     */


    _createClass(WebVRManager, [{
        key: "checkDisplays",
        value: function checkDisplays() {
            var _this2 = this;

            return WebVRManager.getVRDisplay().then(function (display) {
                _this2.defaultDisplay = display;
                _this2.__setState(State.READY_TO_PRESENT);
                return display;
            }).catch(function (e) {
                delete _this2.defaultDisplay;
                if (e.name == "NO_DISPLAYS") {
                    _this2.__setState(State.ERROR_NO_PRESENTABLE_DISPLAYS);
                } else if (e.name == "WEBVR_UNSUPPORTED") {
                    _this2.__setState(State.ERROR_BROWSER_NOT_SUPPORTED);
                } else {
                    _this2.__setState(State.ERROR_UNKOWN);
                }
            });
        }

        /**
         * clean up object for garbage collection
         */

    }, {
        key: "remove",
        value: function remove() {
            window.removeEventListener("vrdisplaypresentchange", this.__onVRDisplayPresentChange);
            if (_screenfull2.default.enabled) {
                document.removeEventListener(_screenfull2.default.raw.fullscreenchanged, this.__onChangeFullscreen);
            }

            this.removeAllListeners();
        }

        /**
         * returns promise returning list of available VR displays.
         * @returns Promise<VRDisplay>
         */

    }, {
        key: "enterVR",


        /**
         * Enter presentation mode with your set VR display
         */
        value: function enterVR(display, canvas) {
            var _this3 = this;

            return display.requestPresent([{
                source: canvas
            }]).then(function () {},
            //this could fail if:
            //1. Display `canPresent` is false
            //2. Canvas is invalid
            //3. not executed via user interaction
            function () {
                return _this3.__setState(State.ERROR_REQUEST_TO_PRESENT_REJECTED);
            });
        }
    }, {
        key: "exitVR",
        value: function exitVR(display) {
            var _this4 = this;

            return display.exitPresent().then(function () {},
            //this could fail if:
            //1. exit requested while not currently presenting
            function () {
                return _this4.__setState(State.ERROR_EXIT_PRESENT_REJECTED);
            });
        }

        /**
         * Enter 360 mode
         */

    }, {
        key: "enter360",
        value: function enter360(canvas) {
            if (_screenfull2.default.enabled) {
                _screenfull2.default.request(canvas);
            }
            return true;
        }
    }, {
        key: "exit360",
        value: function exit360() {
            if (_screenfull2.default.enabled && _screenfull2.default.isFullscreen) {
                _screenfull2.default.exit();
            }
            return true;
        }
    }, {
        key: "__setState",


        /**
         * @private
         */
        value: function __setState(state) {
            if (state != this.state) {
                this.emit("change", state, this.state);
                this.state = state;
            }
        }
    }, {
        key: "__onChangeFullscreen",
        value: function __onChangeFullscreen(e) {
            if (_screenfull2.default.isFullscreen) {
                this.__setState(State.PRESENTING);
            } else {
                this.checkDisplays();
            }
        }

        /**
         * @private
         */

    }, {
        key: "__onVRDisplayPresentChange",
        value: function __onVRDisplayPresentChange() {
            var isPresenting = this.defaultDisplay && this.defaultDisplay.isPresenting;
            this.__setState(isPresenting ? State.PRESENTING : State.READY_TO_PRESENT);
        }
    }], [{
        key: "getVRDisplay",
        value: function getVRDisplay() {
            return new Promise(function (resolve, reject) {
                if (!navigator || !navigator.getVRDisplays) {
                    var e = new Error("Browser not supporting WebVR");
                    e.name = "WEBVR_UNSUPPORTED";
                    reject(e);
                    return;
                }

                var rejectNoDisplay = function rejectNoDisplay() {
                    // No displays are found.
                    var e = new Error("No displays found");
                    e.name = "NO_DISPLAYS";
                    reject(e);
                };

                navigator.getVRDisplays().then(function (displays) {
                    // Promise succeeds, but check if there are any displays actually.
                    for (var i = 0; i < displays.length; i++) {
                        if (displays[i].capabilities.canPresent) {
                            resolve(displays[i]);
                            break;
                        }
                    }

                    rejectNoDisplay();
                }, rejectNoDisplay);
            });
        }
    }]);

    return WebVRManager;
}(_eventemitter2.default);

},{"./states":7,"eventemitter3":1,"screenfull":2}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Not yet presenting, but ready to present
var READY_TO_PRESENT = exports.READY_TO_PRESENT = "ready";

// In presentation mode
var PRESENTING = exports.PRESENTING = "presenting";

// Checking device availability
var PREPARING = exports.PREPARING = "preparing";

// Errors
var ERROR_NO_PRESENTABLE_DISPLAYS = exports.ERROR_NO_PRESENTABLE_DISPLAYS = "error-no-presentable-displays";
var ERROR_BROWSER_NOT_SUPPORTED = exports.ERROR_BROWSER_NOT_SUPPORTED = "error-browser-not-supported";
var ERROR_REQUEST_TO_PRESENT_REJECTED = exports.ERROR_REQUEST_TO_PRESENT_REJECTED = "error-request-to-present-rejected";
var ERROR_EXIT_PRESENT_REJECTED = exports.ERROR_EXIT_PRESENT_REJECTED = "error-exit-present-rejected";

var ERROR_UNKOWN = exports.ERROR_UNKOWN = "error-unkown";

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WebVRManager = exports.State = exports.EnterVRButton = undefined;

var _WebVRManager = require("./WebVRManager");

var _WebVRManager2 = _interopRequireDefault(_WebVRManager);

var _states = require("./states");

var State = _interopRequireWildcard(_states);

var _EnterVRButton = require("./EnterVRButton");

require("./AframeComponent");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.EnterVRButton = _EnterVRButton.EnterVRButton;
exports.State = State;
exports.WebVRManager = _WebVRManager2.default;

},{"./AframeComponent":3,"./EnterVRButton":5,"./WebVRManager":6,"./states":7}]},{},[8])(8)
});
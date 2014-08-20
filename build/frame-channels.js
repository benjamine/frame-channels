!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.frameChannels=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
var Promise = _dereq_("./promise/promise").Promise;
var polyfill = _dereq_("./promise/polyfill").polyfill;
exports.Promise = Promise;
exports.polyfill = polyfill;
},{"./promise/polyfill":5,"./promise/promise":6}],2:[function(_dereq_,module,exports){
"use strict";
/* global toString */

var isArray = _dereq_("./utils").isArray;
var isFunction = _dereq_("./utils").isFunction;

/**
  Returns a promise that is fulfilled when all the given promises have been
  fulfilled, or rejected if any of them become rejected. The return promise
  is fulfilled with an array that gives all the values in the order they were
  passed in the `promises` array argument.

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `RSVP.all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @for RSVP
  @param {Array} promises
  @param {String} label
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
*/
function all(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to all.');
  }

  return new Promise(function(resolve, reject) {
    var results = [], remaining = promises.length,
    promise;

    if (remaining === 0) {
      resolve([]);
    }

    function resolver(index) {
      return function(value) {
        resolveAll(index, value);
      };
    }

    function resolveAll(index, value) {
      results[index] = value;
      if (--remaining === 0) {
        resolve(results);
      }
    }

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && isFunction(promise.then)) {
        promise.then(resolver(i), reject);
      } else {
        resolveAll(i, promise);
      }
    }
  });
}

exports.all = all;
},{"./utils":10}],3:[function(_dereq_,module,exports){
(function (process,global){
"use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

// node
function useNextTick() {
  return function() {
    process.nextTick(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function() {
    node.data = (iterations = ++iterations % 2);
  };
}

function useSetTimeout() {
  return function() {
    local.setTimeout(flush, 1);
  };
}

var queue = [];
function flush() {
  for (var i = 0; i < queue.length; i++) {
    var tuple = queue[i];
    var callback = tuple[0], arg = tuple[1];
    callback(arg);
  }
  queue = [];
}

var scheduleFlush;

// Decide what async method to use to triggering processing of queued callbacks:
if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else {
  scheduleFlush = useSetTimeout();
}

function asap(callback, arg) {
  var length = queue.push([callback, arg]);
  if (length === 1) {
    // If length is 1, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    scheduleFlush();
  }
}

exports.asap = asap;
}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"1YiZ5S":11}],4:[function(_dereq_,module,exports){
"use strict";
var config = {
  instrument: false
};

function configure(name, value) {
  if (arguments.length === 2) {
    config[name] = value;
  } else {
    return config[name];
  }
}

exports.config = config;
exports.configure = configure;
},{}],5:[function(_dereq_,module,exports){
(function (global){
"use strict";
/*global self*/
var RSVPPromise = _dereq_("./promise").Promise;
var isFunction = _dereq_("./utils").isFunction;

function polyfill() {
  var local;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof window !== 'undefined' && window.document) {
    local = window;
  } else {
    local = self;
  }

  var es6PromiseSupport = 
    "Promise" in local &&
    // Some of these methods are missing from
    // Firefox/Chrome experimental implementations
    "resolve" in local.Promise &&
    "reject" in local.Promise &&
    "all" in local.Promise &&
    "race" in local.Promise &&
    // Older version of the spec had a resolver object
    // as the arg rather than a function
    (function() {
      var resolve;
      new local.Promise(function(r) { resolve = r; });
      return isFunction(resolve);
    }());

  if (!es6PromiseSupport) {
    local.Promise = RSVPPromise;
  }
}

exports.polyfill = polyfill;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./promise":6,"./utils":10}],6:[function(_dereq_,module,exports){
"use strict";
var config = _dereq_("./config").config;
var configure = _dereq_("./config").configure;
var objectOrFunction = _dereq_("./utils").objectOrFunction;
var isFunction = _dereq_("./utils").isFunction;
var now = _dereq_("./utils").now;
var all = _dereq_("./all").all;
var race = _dereq_("./race").race;
var staticResolve = _dereq_("./resolve").resolve;
var staticReject = _dereq_("./reject").reject;
var asap = _dereq_("./asap").asap;

var counter = 0;

config.async = asap; // default async is asap;

function Promise(resolver) {
  if (!isFunction(resolver)) {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  if (!(this instanceof Promise)) {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  this._subscribers = [];

  invokeResolver(resolver, this);
}

function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    try {
      value = callback(detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (handleThenable(promise, value)) {
    return;
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    resolve(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

var PENDING   = void 0;
var SEALED    = 0;
var FULFILLED = 1;
var REJECTED  = 2;

function subscribe(parent, child, onFulfillment, onRejection) {
  var subscribers = parent._subscribers;
  var length = subscribers.length;

  subscribers[length] = child;
  subscribers[length + FULFILLED] = onFulfillment;
  subscribers[length + REJECTED]  = onRejection;
}

function publish(promise, settled) {
  var child, callback, subscribers = promise._subscribers, detail = promise._detail;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    invokeCallback(settled, child, callback, detail);
  }

  promise._subscribers = null;
}

Promise.prototype = {
  constructor: Promise,

  _state: undefined,
  _detail: undefined,
  _subscribers: undefined,

  then: function(onFulfillment, onRejection) {
    var promise = this;

    var thenPromise = new this.constructor(function() {});

    if (this._state) {
      var callbacks = arguments;
      config.async(function invokePromiseCallback() {
        invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
      });
    } else {
      subscribe(this, thenPromise, onFulfillment, onRejection);
    }

    return thenPromise;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = all;
Promise.race = race;
Promise.resolve = staticResolve;
Promise.reject = staticReject;

function handleThenable(promise, value) {
  var then = null,
  resolved;

  try {
    if (promise === value) {
      throw new TypeError("A promises callback cannot return that same promise.");
    }

    if (objectOrFunction(value)) {
      then = value.then;

      if (isFunction(then)) {
        then.call(value, function(val) {
          if (resolved) { return true; }
          resolved = true;

          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          if (resolved) { return true; }
          resolved = true;

          reject(promise, val);
        });

        return true;
      }
    }
  } catch (error) {
    if (resolved) { return true; }
    reject(promise, error);
    return true;
  }

  return false;
}

function resolve(promise, value) {
  if (promise === value) {
    fulfill(promise, value);
  } else if (!handleThenable(promise, value)) {
    fulfill(promise, value);
  }
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = value;

  config.async(publishFulfillment, promise);
}

function reject(promise, reason) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = reason;

  config.async(publishRejection, promise);
}

function publishFulfillment(promise) {
  publish(promise, promise._state = FULFILLED);
}

function publishRejection(promise) {
  publish(promise, promise._state = REJECTED);
}

exports.Promise = Promise;
},{"./all":2,"./asap":3,"./config":4,"./race":7,"./reject":8,"./resolve":9,"./utils":10}],7:[function(_dereq_,module,exports){
"use strict";
/* global toString */
var isArray = _dereq_("./utils").isArray;

/**
  `RSVP.race` allows you to watch a series of promises and act as soon as the
  first promise given to the `promises` argument fulfills or rejects.

  Example:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 2");
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // result === "promise 2" because it was resolved before promise1
    // was resolved.
  });
  ```

  `RSVP.race` is deterministic in that only the state of the first completed
  promise matters. For example, even if other promises given to the `promises`
  array argument are resolved, but the first completed promise has become
  rejected before the other promises became fulfilled, the returned promise
  will become rejected:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error("promise 2"));
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // Code here never runs because there are rejected promises!
  }, function(reason){
    // reason.message === "promise2" because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  @method race
  @for RSVP
  @param {Array} promises array of promises to observe
  @param {String} label optional string for describing the promise returned.
  Useful for tooling.
  @return {Promise} a promise that becomes fulfilled with the value the first
  completed promises is resolved with if the first completed promise was
  fulfilled, or rejected with the reason that the first completed promise
  was rejected with.
*/
function race(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to race.');
  }
  return new Promise(function(resolve, reject) {
    var results = [], promise;

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && typeof promise.then === 'function') {
        promise.then(resolve, reject);
      } else {
        resolve(promise);
      }
    }
  });
}

exports.race = race;
},{"./utils":10}],8:[function(_dereq_,module,exports){
"use strict";
/**
  `RSVP.reject` returns a promise that will become rejected with the passed
  `reason`. `RSVP.reject` is essentially shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @for RSVP
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become rejected with the given
  `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Promise = this;

  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}

exports.reject = reject;
},{}],9:[function(_dereq_,module,exports){
"use strict";
function resolve(value) {
  /*jshint validthis:true */
  if (value && typeof value === 'object' && value.constructor === this) {
    return value;
  }

  var Promise = this;

  return new Promise(function(resolve) {
    resolve(value);
  });
}

exports.resolve = resolve;
},{}],10:[function(_dereq_,module,exports){
"use strict";
function objectOrFunction(x) {
  return isFunction(x) || (typeof x === "object" && x !== null);
}

function isFunction(x) {
  return typeof x === "function";
}

function isArray(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
}

// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function() { return new Date().getTime(); };


exports.objectOrFunction = objectOrFunction;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.now = now;
},{}],11:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],12:[function(_dereq_,module,exports){

var Promise = _dereq_('es6-promise').Promise;

function ChannelIFrame(channel){
  this.channel = channel;
}

ChannelIFrame.prototype.ready = function () {
  var self = this;
  var promise = this.readyPromise;
  if (!promise) {
    var channel = this.channel;
    var options = channel.options.iframe;
    promise = new Promise(function(resolve, reject) {

      var ready = false;
      var timeout = false;

      var readyListener = function(message){
        if (ready || timeout || !(message.ready || message.pong)) {
          return;
        }
        // frame is ready and listening!
        ready = true;
        channel.unsubscribe(readyListener);
        resolve();
      };
      channel.subscribe(readyListener);

      var element = self.element || document.getElementById(options.id);
      if (!element) {
        element = document.createElement('iframe');
        self.element = element;
        element.id = options.id;
        element.style.display = 'none';
        if (options.allowPositionControl) {
          self.subscribeToPositionMessages();
        }
        document.body.appendChild(element);
        if (options.url) {
          element.src = options.url;
        } else if (options.html) {
          var doc = element.contentDocument || element.contentWindow.document;
          doc.write(options.html.toString());
          doc.close();
        }
        if (typeof options.setup === 'function') {
          options.setup(element);
        }
      } else {
        self.element = element;
        try {
          channel.push({ ping: true, respond: true });
        } catch (err) {
          console.log('failed to ping frame channel');
        }
      }

      setTimeout(function(){
        if (!ready) {
          timeout = true;
          if (console.error) {
            console.error('timeout waiting for frame channel');
          }
          channel.unsubscribe(readyListener);
          reject(new Error('timeout waiting for frame channel'));
        }
      }, options.readyTimeout || 15000);
    });
    this.readyPromise = promise;
  }
  return promise;
};


ChannelIFrame.prototype.subscribeToPositionMessages = function() {
  // let the iframe control it's own position with messages
  var iframe = this;
  this.channel.subscribe(function(msg, respond) {
    if (msg.maximize) {
      iframe.maximize();
    }
    if (msg.size) {
      iframe.size(msg.size.width, msg.size.height);
    }
    if (msg.restore) {
      iframe.restore();
    }
    if (msg.dock) {
      iframe.dock(msg.dock);
    }
    if (msg.show) {
      iframe.show();
    }
    if (msg.hide) {
      iframe.hide();
    }
    if (respond) {
      respond();
    }
  });
};

ChannelIFrame.prototype.show = function() {
  this.element.display = '';
  return this;
};

ChannelIFrame.prototype.hide = function() {
  this.element.display = 'none';
  return this;
};

ChannelIFrame.prototype.size = function(width, height) {
  if (width === '100%' && height === '100%') {
    return this.maximize();
  }
  if (this.preMaximize) {
    this.restore();
  }
  var element = this.element;
  element.style.width = width;
  element.style.height = height;
  return this;
};

ChannelIFrame.prototype.dock = function(location) {
  location = location || 'bottom right';
  var left = location.indexOf('left') >= 0;
  var right = location.indexOf('right') >= 0;
  var bottom = location.indexOf('bottom') >= 0;
  var top = location.indexOf('top') >= 0;
  var element = this.element;
  element.style.position = 'fixed';
  element.style.left = left ? 0 : 'auto';
  element.style.right = right ? 0 : 'auto';
  element.style.bottom = bottom ? 0 : 'auto';
  element.style.top = top ? 0 : 'auto';
  element.style.margin = 0;
  element.style.padding = 0;
  element.style.border = 0;
  element.style.zIndex = 99999999;
  var pre = this.preMaximize;
  if (pre) {
    element.style.width = pre.width;
    element.style.height = pre.height;
    this.preMaximize = null;
  }
  return this;
};

ChannelIFrame.prototype.maximize = function() {
  var pre = {};
  var element = this.element;
  element.style.position = 'fixed';
  pre.left = element.style.left;
  pre.right = element.style.right;
  pre.bottom = element.style.bottom;
  pre.top = element.style.top;
  pre.width = element.style.width;
  pre.height = element.style.height;
  element.style.left = 0;
  element.style.right = 0;
  element.style.bottom = 0;
  element.style.top = 0;
  element.style.width = '100%';
  element.style.height = '100%';
  element.contentWindow.focus();
  if (!this.preMaximize) {
    this.preMaximize = pre;
  }
  return this;
};

ChannelIFrame.prototype.restore = function() {
  var pre = this.preMaximize;
  if (!pre) {
    return;
  }
  var element = this.element;
  for (var name in pre) {
    element.style[name] = pre[name];
  }
  this.preMaximize = null;
  return this;
};

module.exports = ChannelIFrame;

},{"es6-promise":1}],13:[function(_dereq_,module,exports){

var Promise = _dereq_('es6-promise').Promise;
var ChannelIFrame = _dereq_('./channel-iframe');
var messageCount = 0;

function Channel(name, options) {
  this.options = options || {};
  if (typeof name !== 'string' || name.length < 1) {
    throw new Error('name must be a non-empty string');
  }
  this.name = name;
  this.options = options || {};
  this.handlers = [];
  this.listening = false;
  this.isReady = false;
  if (this.options.iframe) {
    this.iframe = new ChannelIFrame(this);
  }
}

Channel.prototype.findMyWindow = function () {
  if (this._myWindow) {
    return this._myWindow;
  }
  var myWindow = this.options.myWindow;
  if (myWindow && typeof myWindow.addEventListener === 'function') {
    this._myWindow = myWindow;
    return this._myWindow;
  }
  this._myWindow = window;
  return this._myWindow;
};

Channel.prototype.findWindow = function () {
  if (this._window) {
    return this._window;
  }
  var target = this.options.target;
  if (!target && this.options.iframe && this.options.iframe.id) {
    target = '#' + this.options.iframe.id;
  }
  if (typeof target === 'string') {
    var element = document.querySelector(target);
    if (!element || !element.contentWindow) {
      throw new Error('unable to find contentWindow of ' + target);
    }
    this._window = element.contentWindow;
    return this._window;
  }
  if (target && typeof target.postMessage === 'function') {
    this._window = target;
    return this._window;
  }
  throw new Error('no valid target was provided (eg. #iframeIdOrSelector, window.parent, someWindow)');
};

function waitMessageResponse(self, id, timeout, resolve, reject) {

  var _myWindow = self.findMyWindow();

  var listener = function responseListener(event) {
    if (!event.data || event.data.channel !== self.name) {
      return;
    }
    if (!self.originIsAllowed(event.origin)) {
      return;
    }
    if (event.data._responseTo === id) {
      if (!listener) {
        return;
      }
      _myWindow.removeEventListener('message', listener);
      listener = null;
      if (event.data && event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data);
      }
    }
  };

  _myWindow.addEventListener('message', listener, false);

  setTimeout(function(){
    if (!listener) {
      return;
    }
    _myWindow.removeEventListener('message', listener);
    listener = null;
    var err = new Error('timeout waiting for cross-frame response');
    err.timeout = true;
    reject(err);
  }, timeout || self.options.responseTimeout || 3000);
}

Channel.prototype.push = function(message) {
  var msg = message;
  if (typeof msg !== 'object') {
    msg = { value: msg };
  }
  msg.channel = this.name;

  messageCount++;
  var id = msg._messageid = messageCount;

  var _window = this.findWindow();
  var self = this;
  setTimeout(function(){
    _window.postMessage(msg, self.options.targetOrigin || '*');
  }, 1);

  return new Promise(function(resolve, reject){
    if (!msg.respond) {
      resolve();
      return;
    }
    waitMessageResponse(self, id, msg.timeout, resolve, reject);
  });
};

Channel.prototype.request = function(message) {
  var msg = message;
  if (typeof msg !== 'object') {
    msg = { value: msg };
  }
  msg.respond = true;
  return this.push(msg);
};

Channel.prototype.originIsAllowed = function (origin) {
  var filter = this.options.originFilter;
  if (!filter) {
    return true;
  }
  if (typeof filter.test === 'function') {
    return filter.test(event.origin);
  }
  if (typeof filter === 'string') {
    return origin === filter;
  }
  return false;
};

function handleMessage(self, message, handler) {
  var respond;
  if (message.respond) {
    respond = function(response){
      var resp = response;
      if (resp instanceof Error) {
        resp = { error: resp.message };
      }
      if (typeof resp !== 'object') {
        resp = { value: resp };
      }
      resp._responseTo = message._messageid;
      self.push(resp);
    };
  }
  try {
    handler(message, respond);
  } catch (err) {
    if (console && console.error) {
      console.error('error on subscriber: ', err);
      console.error(err.stack);
    }
  }
}

Channel.prototype.subscribe = function (handler) {
  if (typeof handler !== 'function') {
    throw new Error('handler function is required');
  }
  this.handlers.push(handler);
  if (!this.listening) {
    var self = this;
    var _myWindow = self.findMyWindow();
    _myWindow.addEventListener('message', function(event) {
      if (!event.data || event.data.channel !== self.name) {
        return;
      }
      if (!self.originIsAllowed(event.origin)) {
        return;
      }
      var handlers = Array.prototype.slice.apply(self.handlers);
      while (handlers.length) {
        handleMessage(self, event.data, handlers.shift());
      }
    }, false);
    this.listening = true;

    this.respondToPings();
    if (this.options.autoReady !== false) {
      this.notifyReady();
    }
  }
  return this;
};

Channel.prototype.respondToPings = function(){
  if (this.respondingToPings) {
    return;
  }
  this.subscribe(function(message, respond){
    if (message.ping && respond) {
      respond({ pong: true });
    }
  });
};

Channel.prototype.notifyReady = function () {
  this.respondToPings();
  try {
    this.push({ ready: true });
  } catch(err) {
    // maybe there's no target window yet, just ignore this
  }
};

Channel.prototype.unsubscribe = function (handler) {
  for (var i = this.handlers.length - 1; i >= 0; i--) {
    if (this.handlers[i] === handler) {
      this.handlers.splice(i, 1);
    }
  }
  return this;
};

module.exports = Channel;

},{"./channel-iframe":12,"es6-promise":1}],14:[function(_dereq_,module,exports){
(function (process){

var Channel = _dereq_('./channel');
exports.Channel = Channel;
exports.create = function channel(name, options) {
  return new Channel(name, options);
};

// detect runtime
var inNode = typeof process !== 'undefined' && typeof process.execPath === 'string';
if (inNode) {
  // exports only for node.js
  var packageInfo = _dereq_('../package' + '.json');
  exports.version = packageInfo.version;
  exports.homepage = packageInfo.homepage;
} else {
  // exports only for browser bundle
	exports.homepage = 'https://github.com/benjamine/frame-channels';
	exports.version = '0.0.40';
}

}).call(this,_dereq_("1YiZ5S"))
},{"./channel":13,"1YiZ5S":11}]},{},[14])
(14)
});
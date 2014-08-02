
var Promise = require('es6-promise').Promise;
var ChannelIFrame = require('./channel-iframe');
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
};

module.exports = Channel;

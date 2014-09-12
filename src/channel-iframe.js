
var Promise = require('es6-promise').Promise;

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
  this.element.style.display = '';
  return this;
};

ChannelIFrame.prototype.hide = function() {
  this.element.style.display = 'none';
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

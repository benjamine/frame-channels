
var EventEmitter = require('events').EventEmitter;

function MockWindow(origin) {
  this.emitter = new EventEmitter();
  this.origin = origin || 'http://localhost';
  this.sourceOrigin = 'http://localhost';
  this.received = [];
}

MockWindow.prototype.postMessage = function(message, origin) {
  if (origin && origin !== '*' && this.origin !== origin) {
    // cross-domain policy
    return;
  }
  this.received.push(message);
  var self = this;
  var data = JSON.parse(JSON.stringify(message));
  setTimeout(function(){
    self.emitter.emit('message', {
      data: data,
      origin: self.sourceOrigin
    });
  }, 1);
};

MockWindow.prototype.addEventListener = function(name, handler) {
  this.emitter.on(name, handler);
};

MockWindow.prototype.removeEventListener = function(name, handler) {
  this.emitter.removeListener(name, handler);
};

module.exports = MockWindow;

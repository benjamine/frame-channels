
var EventEmitter = require('events').EventEmitter;

var instanceCount = 0;

function MockWindow(origin) {
  this.instanceId = instanceCount;
  instanceCount++;
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
  var selfOrigin = self.sourceOrigin;
  setTimeout(function(){
    self.emitter.emit('message', {
      data: data,
      origin: selfOrigin
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

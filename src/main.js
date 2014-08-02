
var Channel = require('./channel');
exports.Channel = Channel;
exports.create = function channel(name, options) {
  return new Channel(name, options);
};

// detect runtime
var inNode = typeof process !== 'undefined' && typeof process.execPath === 'string';
if (inNode) {
  // exports only for node.js
  var packageInfo = require('../package' + '.json');
  exports.version = packageInfo.version;
  exports.homepage = packageInfo.homepage;
} else {
  // exports only for browser bundle
	exports.homepage = '{{package-homepage}}';
	exports.version = '{{package-version}}';
}

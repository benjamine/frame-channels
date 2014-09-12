
// global exports

var Channel = require('./channel');
exports.Channel = Channel;
exports.create = function channel(name, options) {
  return new Channel(name, options);
};

if (process.browser) {
  // exports only for browser bundle
  exports.version = '{{package-version}}';
  exports.homepage = '{{package-homepage}}';
} else {
  // exports only for node.js
  var packageInfo = require('../pack'+'age.json');
  exports.version = packageInfo.version;
  exports.homepage = packageInfo.homepage;
}

/*
* mocha's bdd syntax is inspired in RSpec
*   please read: http://betterspecs.org/
*/
require('./util/globals');

describe('frameChannels', function(){
  it('has a semver version', function(){
    expect(frameChannels.version).to.match(/^\d+\.\d+\.\d+(-.*)?$/);
  });
  describe('.create', function(){
    it('creates a new Channel', function(){
      var channel = frameChannels.create('some name');
      expect(channel).to.be.a(frameChannels.Channel);
    });
  });
});

require('./channel');
require('./channel-iframe');

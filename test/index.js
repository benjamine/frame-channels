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

var MockWindow = require('./util/mock-window');

describe('Channel', function(){
  beforeEach(function(){
    // setup 2 cross-domain windows
    this.window1 = new MockWindow('http://domain1');
    this.window2 = new MockWindow('http://domain2');
    this.window1.sourceOrigin = this.window2.origin;
    this.window2.sourceOrigin = this.window1.origin;
    // create corresponding channels
    this.channel1 = frameChannels.create('the channel', {
      target: this.window2,
      myWindow: this.window1,
      responseTimeout: 100
    });
    this.channel2 = frameChannels.create('the channel', {
      target: this.window1,
      myWindow: this.window2,
      responseTimeout: 100
    });
  });
  describe('#push', function(){
    it('sends a message object', function(done){
      this.channel1.push({ hello: 'world' });
      this.window2.addEventListener('message', function(e) {
        expect(e.data.hello).to.be('world');
        done();
      });
    });
    it('sends a message value', function(done){
      this.channel1.push('hello world');
      this.window2.addEventListener('message', function(e) {
        expect(e.data.value).to.be('hello world');
        done();
      });
    });
    when('requesting a response', function(){
      it('gets the response back', function(done){
        this.channel2.subscribe(function(message, respond){
          respond({ yourewelcome: true });
        });
        this.channel1.push({ thanks: true, respond: true }).then(function(response){
          expect(response.yourewelcome).to.be(true);
          done();
        }, function(err){
          done.fail('response failed: ' + err);
        });
      });
      it('gets response errors', function(done){
        this.channel2.subscribe(function(message, respond){
          respond(new Error('fake error'));
        });
        this.channel1.push({ thanks: true, respond: true }).then(function(){
          done.fail('response not expected');
        }, function(err){
          expect(err.message).to.be('fake error');
          done();
        });
      });
      it('errors if nobody responds', function(done){
        this.channel1.push({ hello: 'world', respond: true }).then(function(){
          done.fail('response not expected');
        }, function(err){
          expect(err.timeout).to.be(true);
          done();
        });
      });
    });
    when('origin is not valid', function(){
      beforeEach(function(){
        this.channel1.options.targetOrigin = 'http://domain34';
      });
      it('nothing is sent', function(){
        this.channel1.push({ hello: 'world' });
        this.channel1.push('hello world');
        expect(this.window2.received).to.be.empty();
      });
    });
  });
  describe('#subscribe', function(){
    it('receives a message', function(done){
      this.channel2.subscribe(function(message){
        expect(message.hello).to.be('world');
        done();
      });
      this.channel1.push({ hello: 'world' });
    });
    it('receives 3 messages', function(done){
      var count = 0;
      this.channel2.subscribe(function(message){
        expect(message.hello).to.be('world');
        count++;
        if (count === 3) {
          done();
        }
      });
      this.channel1.push({ hello: 'world' });
      this.channel1.push({ hello: 'world' });
      this.channel1.push({ hello: 'world' });
    });
  });
});

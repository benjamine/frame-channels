/*
* mocha's bdd syntax is inspired in RSpec
*   please read: http://betterspecs.org/
*/
require('./util/globals');

// test real iframe creation only on browsers
if (typeof window === 'undefined') {
  return;
}

var echoIFrameChannel =  require('./util/echo-iframe-channel');

describe('ChannelIFrame', function(){

  beforeEach(function(){
    this.channel = echoIFrameChannel.create();
  });
  describe('#ready', function(){
    it('creates an iframe', function(done){
      var channel = this.channel;
      this.channel.iframe.ready().then(function(){
        expect(channel.iframe.element.tagName).to.be('IFRAME');
        done();
      }, function(err){
        done.fail(err);
      });
    });
    when('targeting same iframe', function(){
      beforeEach(function(done){
        var context = this;
        var channel = this.channel;
        channel.iframe.ready().then(function(){
          var channel2 = context.channel2 = echoIFrameChannel.create({
            id: channel.iframe.element.id,
            name: channel.name
          });
          channel2.iframe.ready().then(function(){
            done();
          }, function(err) {
            done.fail(err);
          });
        }, function(err){
          done.fail(err);
        });
      });
      it('reuses same iframe element', function(){
        expect(this.channel.iframe.element).to.be(this.channel2.iframe.element);
      });
      it('both get same messages', function(done){
        var got = 0;
        var channel = this.channel;
        this.channel.subscribe(function(msg){
          if (msg.ack) {
            expect(msg.value).to.be('same thing');
            got++;
            if (got === 2) {
              done();
            }
          }
        });
        var channel2 = this.channel2;
        this.channel2.subscribe(function(msg){
          if (msg.ack) {
            expect(msg.value).to.be('same thing');
            got++;
            if (got === 2) {
              done();
            }
          }
        });
        this.channel.iframe.ready().then(function(){
          channel2.iframe.ready().then(function(){
            channel.request('same thing');
          }, function(err){
            done.fail(err);
          });
        }, function(err){
          done.fail(err);
        });
      });
    });
    it('reports when the iframe channel is ready', function(done){
      this.channel.iframe.ready().then(function(){
        done();
      }, function(err){
        done.fail(err);
      });
    });
  });
  when('iframe send first message right away', function(){
    it('first message is received', function(done){
      // create an iframe channel that sends a first message right away
      var channel = echoIFrameChannel.create({
        firstMessage: true
      });
      channel.subscribe(function(msg){
        if (msg.firstMessage) {
          expect(msg.firstMessage).to.be(true);
          done();
        }
      });
      channel.iframe.ready();
    });
  });
  when('ready', function(){
    beforeEach(function(done){
      this.channel.iframe.ready().then(function(){
        done();
      }, function(err){
        done.fail(err);
      });
    });
    it('gets responses', function(done){
      this.channel.request({ hi: 'there' }).then(function(response){
        expect(response.ack).to.be(true);
        done();
      });
    });
  });
});

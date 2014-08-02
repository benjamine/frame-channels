frame-channels
==============
[![Build Status](https://secure.travis-ci.org/benjamine/frame-channels.png)](http://travis-ci.org/benjamine/frame-channels)
[![NPM version](https://badge.fury.io/js/frame-channels.png)](http://badge.fury.io/js/frame-channels)
[![NPM dependencies](https://david-dm.org/benjamine/frame-channels.png)](https://david-dm.org/benjamine/frame-channels)
[![Bower version](https://badge.fury.io/bo/frame-channels.png)](http://badge.fury.io/bo/frame-channels)

[![browser support](https://ci.testling.com/benjamine/frame-channels.png)
](https://ci.testling.com/benjamine/frame-channels)

pub/sub channels between browser [i]frames

Usage
------

Open a channel to communicate with an iframe

``` js
var channel = frameChannels.create('my-channel', {
  // iframe selector or window object
  target: '#my-iframe',
  // (optional) restrict message origin
  originFilter: /^http\:\/\/domain\.com\//,
  // (optional) timeout when waiting for a message response
  responseTimeout: 30000,
  // (optional) let the iframe control it's own position with messages
  allowPositionControl: true
  // (optional) indicate how to create the iframe if it doesn't exists
  iframe: {
    id: 'my-iframe',
    url: 'http://domain.com/path',
    setup: function(element) {
      element.style.width = '180px';
      element.style.height = '50px';
      element.style.zIndex = 999999;
      channel.iframe.dock('bottom-right');
    }
  }
});

// send a message to the iframe
// ready() ensures the iframe is built and
// someone inside the iframe is listening (called channel.subscribe)
channel.iframe.ready().then(function(){
  channel.push({ hello: 'world' });
  channel.subscribe(function(msg){
    console.log('got', msg);
  });
});
```

Inside the iframe, open a channel with parent window

``` js
var channelA = frameChannels.create('my-channel', {
  target: window.parent
});
channel.push({ hello: 'parent' });
channel.subscribe(function(msg){
  console.log('parent sent', msg);
});

// set iframe position in parent
channel.push({ dock: 'bottom right', size: {
  width: '180px',
  height: '50px'
}});
channel.push({ maximize: true });
channel.push({ hide: true });
channel.push({ show: true });
channel.push({ restore: true });
```

using Request/Response pattern:

``` js
channel.push({
  question: 'areYouOk?',
  respond: true
}).then(function(response) {
  if (response.ok) {
    console.log('great');
  }
});
```

``` js
channel.subscribe(function(msg, respond){
  if (msg.question === 'areYouOk?' && respond) {
    respond({ ok: true });
  }
});
```

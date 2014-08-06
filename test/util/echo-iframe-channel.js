require('./globals');

var instanceCount = 0;

function create(options) {
  // create echo src-less iframe to talk to
  var iframeHtml;
  options = options || {};
  if (!options.id) {
    options.id = 'my-iframe-' + instanceCount;
    iframeHtml = '<!doctype html><html><head>' +
      document.querySelector('script[src*="/frame-channels.js"]').outerHTML +
      '</head></body><sc'+'ript>' +
        'var channel = frameChannels.create("echo channel #' + instanceCount +
        '", { target: window.parent }).subscribe(function(msg, respond){'+
          'if (respond) { respond({ ack: true, value: msg.value }); }' +
        '});' +
        (options.firstMessage ? 'channel.push({ firstMessage: true });' : '') +
      '</scri'+'pt></body></html>';
  }
  if (!options.name) {
    options.name = 'echo channel #' + instanceCount;
  }
  var channel = frameChannels.create(options.name, {
    responseTimeout: 100,
    iframe: {
      id: options.id,
      html: iframeHtml,
      setup: function(element) {
        element.style.width = '180px';
        element.style.height = '50px';
        element.style.zIndex = 999999;
        channel.iframe.dock('bottom-right');
      }
    }
  });
  instanceCount++;
  return channel;
}

exports.create = create;

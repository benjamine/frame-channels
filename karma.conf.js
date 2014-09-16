module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['mocha'],
    files: [
      'public/build/frame-channels.js',
      'public/build/test-bundle.js'
    ],
    reporters : ['spec', 'growler']
  });
};

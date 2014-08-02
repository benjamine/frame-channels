module.exports = function(config) {
    config.set({
        basePath: '.',
        frameworks: ['mocha'],
        files: [
            'build/frame-channels.js',
            'build/test-bundle.js'
        ],
        reporters : ['spec', 'growler']
    });
};

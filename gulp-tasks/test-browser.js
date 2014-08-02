var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

var browsers = process.env.BROWSERS || process.env.BROWSER || 'PhantomJS';
browsers = browsers ? browsers.split(' ') : undefined;

gulp.task('test-browser', ['bundle'], function() {
  return gulp.src('./file-list-at-karma-conf-file')
    .pipe(plugins.karma({
      configFile: 'karma.conf.js',
      browsers: browsers,
      action: 'run'
    }));
});

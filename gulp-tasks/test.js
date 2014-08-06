
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var plumber = require('./util/plumber').plumber;

gulp.task('test', ['lint'], function () {
    return gulp.src('./test/index.js')
        .pipe(plumber())
        .pipe(plugins.mocha({
            grep: process.env.FILTER || undefined,
            reporter: 'spec',
            growl: true
        }))
        .pipe(plumber());
});

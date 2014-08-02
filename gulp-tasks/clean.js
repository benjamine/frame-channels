
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

gulp.task('clean', function() {
    return gulp.src(['./build'], {read: false})
        .pipe(plugins.clean());
});

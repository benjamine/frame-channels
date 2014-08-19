var gulp = require('gulp');
var exec = require('./util/exec');

exec.task('npm-version-patch', [], 'npm version patch');
exec.task('npm-publish', [], 'npm publish');

gulp.task('bump', [], function(callback) {
  var packageInfo = require('../package');
  exec('npm', ['version', 'patch'], function(err){
    if (err) {
      callback(err);
      return;
    }
    exec('npm', ['test'], function(err){
      if (err) {
        callback(err);
        return;
      }
      exec('git', ['add', '--all', '.'], function(err){
        if (err) {
          callback(err);
          return;
        }
        exec('git', ['commit', '--amend', '--no-edit'], function(err){
          if (err) {
            callback(err);
            return;
          }
          exec('git', ['push'], function(err){
            if (err) {
              callback(err);
              return;
            }
            if (packageInfo.private) {
              console.log('private package, skipping npm publish');
              callback();
            }
            if (!packageInfo.homepage) {
              console.log('no package homepage specified, skipping npm publish');
              callback();
            }
            exec('npm', ['publish'], function(err){
              if (err) {
                callback(err);
                return;
              }
              callback();
            });
          });
        });
      });
    });
  });
  /*
    npm version patch
    if (browser)
      gulp bundle
      amend
    fi
    if (pages) {
      gulp pages
      if (pages is git subrepo) {
        cd subrepo
        git a && commit
        git push
        cd ..
      }
      amend
    }
    git push
    npm publish
  */
});

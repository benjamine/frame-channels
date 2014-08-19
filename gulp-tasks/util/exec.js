var gulp = require('gulp');
var childProcess = require('child_process');

function exec(cmd, args, callback) {
  if (typeof args === 'function') {
    callback = args;
    args = [];
  }
  var child = childProcess.spawn(cmd, args || [], { stdio: 'inherit' });
  child.on('close', function (code) {
    if (code !== 0) {
      callback(new Error('process exited with code ' + code));
      return;
    }
    callback();
  });
}

function execTask(taskName, deps, command, args) {
  gulp.task(taskName, deps, function(callback) {
    exec(command, args, function (err) {
      if (err) {
        callback(err);
        return;
      }
      callback();
    });
  });
}

module.exports = exec;
exec.task = execTask;

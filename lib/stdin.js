var fs           = require('fs'),
    util         = require('./util'),
    EventEmitter = require('events').EventEmitter;

function Stdin() {
  EventEmitter.call(this);
  var self = this;
  self.stdin = null;
  var stream = self.stdout = process.openStdin();
  self.stderr = null;
  stream.on('close', function() { self.emit('exit') });
  stream.pause();
}
util.inherits(Stdin, EventEmitter);

Stdin.prototype.spawn = function(stdout, stderr) {
  var stream = this.stdout;
  if (stdout) {
    util.pipe(stream, stdout);
  } else {
    stream.resume();
  }
};

exports.Stdin = Stdin;
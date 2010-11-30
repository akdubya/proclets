var fs           = require('fs'),
    util         = require('./util'),
    EventEmitter = require('events').EventEmitter;

function Stdout() {
  EventEmitter.call(this);
  var self = this;
  var stream = self.stdin = process.stdout;
  self.stdout = null;
  self.stderr = null;
  stream.on('close', function() { self.emit('exit') });
}
util.inherits(Stdout, EventEmitter);

Stdout.prototype.spawn = function(stdout, stderr) {};

exports.Stdout = Stdout;
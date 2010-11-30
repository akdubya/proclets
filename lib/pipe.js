var EventEmitter = require('events').EventEmitter,
    util = require('./util'),
    Stub = require('./stub').Stub;

function Pipe(queue) {
  EventEmitter.call(this);
  this.stdin  = queue[0].stdin;
  this.stdout = queue[queue.length-1].stdout;
  this.stderr = null;
  detectExit(this, queue);
  this.__defineGetter__('queue', function() {
    return queue;
  });
}
util.inherits(Pipe, EventEmitter);

Pipe.prototype.spawn = function(stdout, stderr) {
  var queue = this.queue;
  queue.forEach(function(proc, idx) {
    var nextOut = queue[idx+1] ? queue[idx+1].stdin : stdout;
    proc.spawn(nextOut, stderr);
  });
};

Pipe.prototype.kill = function(sig) {
  this.killed = true;
  this.queue.forEach(function(proc) {
    proc.kill(sig);
  });
};

exports.Pipe = Pipe;

function detectExit(pipe, queue) {
  var pending = queue.length;
  queue.forEach(function(proc) {
    proc.on('exit', function() {
      if (--pending === 0) {
        pipe.emit('exit');
      }
    });
  });
}
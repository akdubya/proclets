var EventEmitter = require('events').EventEmitter,
    util = require('./util'),
    Stub = require('./stub').Stub;

function Tee(procs) {
  EventEmitter.call(this);
  if (!procs) procs = [];
  this.stdout = this.stdin = new Stub();
  this.stderr = null;
  detectExit(this, procs);
  this.__defineGetter__('procs', function() {
    return procs;
  });
}
util.inherits(Tee, EventEmitter);

Tee.prototype.spawn = function(stdout, stderr) {
  var stdin = this.stdin;
  if (stdout) util.pump(stdin, stdout);
  this.procs.forEach(function(proc) {
    proc.spawn(null, stderr);
    util.pump(stdin, proc.stdin);
  });
};

Tee.prototype.kill = function(sig) {
  this.killed = true;
  this.procs.forEach(function(proc) {
    proc.kill(sig);
  });
};

exports.Tee = Tee;

function detectExit(tee, procs) {
  var pending = procs.length;
  procs.forEach(function(proc) {
    proc.on('exit', function() {
      if (--pending === 0) {
        tee.emit('exit');
      }
    });
  });
}
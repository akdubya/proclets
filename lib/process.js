var ChildProcess  = process.binding('child_process').ChildProcess,
    util          = require('./util'),
    fs            = require('fs'),
    EventEmitter  = require('events').EventEmitter,
    net           = require('net');

function Process(cmd, args, options) {
  EventEmitter.call(this);
  this.cmd     = cmd;
  this.args    = args || [];
  this.stdin   = new net.Stream({fd: -1, type: 'pipein'});
  this.stdout  = new net.Stream({fd: -1, type: 'pipeout'});
  this.stderr  = new net.Stream({fd: -1, type: 'pipeout'});
  var internal = this._internal = new ChildProcess();
  this.__defineGetter__('pid', function () { return internal.pid });
}
util.inherits(Process, EventEmitter);

Process.prototype.spawn = function(stdout, stderr) {
  if (stdout) util.pipe(this.stdout, stdout);
  if (stderr) util.pipe(this.stderr, stderr, {end: false});

  var self = this,
      thisin = self.stdin,
      thisout = self.stdout,
      thiserr = self.stderr;

  if (thisin.fd === null) thisin.once('ready', _check);
  if (thisout.fd === null) thisout.once('ready', _check);
  if (thiserr.fd === null) thiserr.once('ready', _check);

  function _check() {
    if (!(thisin.fd !== null && thisout.fd !== null && thiserr.fd !== null)) return;
    doSpawn(self);
  }

  _check();
};

Process.prototype.kill = function(sig) {
  if (this._internal.pid) {
    this.killed = true;
    if (!constants) constants = process.binding("constants");
    sig = sig || 'SIGTERM';
    if (!constants[sig]) throw new Error("Unknown signal: " + sig);
    return this._internal.kill(constants[sig]);
  }
};

function doSpawn(proc) {
  var cwd = proc.cwd || '';
  var env = proc.env || process.env;
  var stdin = proc.stdin;
  var stdout = proc.stdout;
  var stderr = proc.stderr;

  var pairs = [];
  var keys = Object.keys(env);
  for (var i=0, len=keys.length; i<len; i++) {
    var key = keys[i];
    pairs.push(key + "=" + env[key]);
  }

  var fds = proc._internal.spawn(proc.cmd, proc.args, cwd, pairs, [stdin.fd, stdout.fd, stderr.fd]);

  if (stdin.fd === -1) {
    stdin.open(fds[0]);
    stdin.writable = true;
    stdin.readable = false;
  }
  stdin.emit('fork');

  if (stdout.fd === -1) {
    stdout.open(fds[1]);
    stdout.writable = false;
    stdout.readable = true;
    stdout.on('close', _checkExited);
    stdout.resume();
  }
  stdout.emit('fork');

  if (stderr.fd === -1) {
    stderr.open(fds[2]);
    stderr.writable = false;
    stderr.readable = true;
    stderr.on('close', _checkExited);
    stderr.resume();
  }
  stderr.emit('fork');

  var exitCode, exitSignal;
  proc._internal.onexit = function(code, signal) {
    exitCode = code;
    exitSignal = signal;
    _checkExited();
  };

  var fired = false;
  function _checkExited() {
    if (fired) return;
    if (exitCode === undefined) return;
    if (stdout.readable || stderr.readable) return;
    if (stdin.writable) stdin.end();
    if (stdin.writable === undefined) stdin.emit('close');
    if (stdout.readable === undefined) stdout.emit('close');
    fired = true;
    proc.emit('exit', exitCode, exitSignal);
  }
}

exports.Process = Process;
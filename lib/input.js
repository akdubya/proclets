var fs           = require('fs'),
    util         = require('./util'),
    EventEmitter = require('events').EventEmitter;

function Input(path, options) {
  EventEmitter.call(this);
  this.path = path;
  this.options = options;
  this.stdin = null;
  var stream = this.stdout = createInputStream(path);
  this.stderr = null;
  stream.fd = null;
  var self = this;
  stream.on('close', function() { self.emit('exit') });
}
util.inherits(Input, EventEmitter);

Input.prototype.spawn = function(stdout, stderr) {
  var stream = this.stdout;

  if (stdout) util.pipe(stream, stdout);

  fs.open(this.path, 'r', function(err, fd) {
    if (err) {
      stream.readable = false;
      stream.emit('error', err);
      return;
    }
    stream.fd = fd;
    if (!stdout) stream.resume();
    stream.emit('open', fd);
  });

  if (stderr) stream.on('error', function(err) { stderr.write(err.toString()) });
};

function createInputStream(path, options) {
  var opts = options ? options : {};
  if (opts.fd === null || opts.fd === undefined) {
    opts.fd = -1;
    opts.paused = true;
  }
  var stream = new fs.ReadStream(path, opts);
  stream.resume = resumeStream;
  return stream;
}

function resumeStream() {
  var stream = this;
  if (!stream.paused) return;
  stream.paused = false;

  if (stream.buffer) {
    stream._emitData(stream.buffer);
    stream.buffer = null;
  }

  if (stream.fd) {
    stream._read();
  } else {
    stream.once('open', stream._read);
  }
}

exports.Input = Input;
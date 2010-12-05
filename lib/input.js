var fs           = require('fs'),
    util         = require('./util'),
    EventEmitter = require('events').EventEmitter;

function Input(path, options) {
  EventEmitter.call(this);
  var opts = options || {};
  this.path = path;
  this.stdin = null;
  var stream = this.stdout = createInputStream(path, opts);
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
    if (err) return onErr(err);
    if (stream.stat) {
      fs.fstat(fd, function(err, stats) {
        if (err) return onErr(err);
        stream.stats = stats;
        onReady(fd);
      });
    } else {
      onReady(fd);
    }
  });

  function onErr(err) {
    stream.readable = false;
    stream.emit('error', err);
  }

  function onReady(fd) {
    stream.fd = fd;
    if (!stdout) stream.resume();
    stream.emit('open', fd);
  }

  if (stderr) stream.on('error', function(err) { stderr.write(err.toString()) });
};

function createInputStream(path, options) {
  if (options.fd === null || options.fd === undefined) {
    options.fd = -1;
    options.paused = true;
  }
  var stream = new fs.ReadStream(path, options);
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
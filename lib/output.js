var util    = require('./util'),
    fs      = require('fs');
    EventEmitter = require('events').EventEmitter;

function Output(path, options) {
  EventEmitter.call(this);
  this.path    = path;
  this.options = options;
  this.stdin   = fs.createWriteStream(this.path, {fd: -1});
  this.stdout  = null;
  this.stderr  = null;
  this.stdin.fd = null;
  var self = this;
  self.stdin.on('close', function() { self.emit('exit') });
}
util.inherits(Output, EventEmitter);

Output.prototype.spawn = function(stdout, stderr) {
  var self = this, stream = self.stdin;
  if (stderr) self.stdin.on('error', function(err) { stderr.write(err) });
  stream._queue.push([fs.open, stream.path, stream.flags, stream.mode, undefined]);
  stream.flush();
};

// WriteStream.end should accept data args per the stream spec
fs.WriteStream.prototype.end = function(cb) {
  var args;
  if (cb && typeof cb !== 'function') {
    args = Array.prototype.slice.call(arguments);
    if (typeof arguments[arguments.length-1] === 'function') {
      cb = args.pop();
    } else {
      cb = undefined;
    }
    this.write.apply(this, args);
  }

  this.writable = false;
  this._queue.push([fs.close, cb]);
  this.flush();
};

exports.Output = Output;
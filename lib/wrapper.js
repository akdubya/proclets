var util = require('./util'),
    EventEmitter = require('events').EventEmitter;

function Wrapper(stream, options) {
  EventEmitter.call(this);

  var self = this;
  if (stream.writable) self.stdin = stream;
  if (stream.readable) {
    self.stdout = stream;
    stream.pause();
  }
  self.stderr = null;
  self.ready = false;
  stream.on('close', function() { self.emit('exit') });
  self.__defineGetter__('_stream', function () { return stream });
}
util.inherits(Wrapper, EventEmitter);

Wrapper.prototype.spawn = function(stdout, stderr) {
  var stream = this._stream;
  if (stdout) util.pipe(stream, stdout);
  if (stderr) stream.on('error', function(err) { stderr.write(err) });
  stream.paused && stream.resume();
};

exports.Wrapper = Wrapper;
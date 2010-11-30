var util = require('./util'),
    EventEmitter = require('events').EventEmitter,
    net = require('net');

function Socket(port, host, options) {
  EventEmitter.call(this);
  var stream = new net.Stream();
  this.port = port;
  this.host = host;
  this.stdin = stream;
  this.stdout = stream;
  this.stderr = null;
  // exit handler
  this.__defineGetter__('_stream', function () { return stream });
}
util.inherits(Socket, EventEmitter);

Socket.prototype.spawn = function(stdout, stderr) {
  var stream = this._stream;
  if (stdout) util.pipe(stream, stdout);
  if (stderr) stream.on('error', function(err) { stderr.write(err) });
  stream.connect(this.port, this.host);
};

Socket.prototype.kill = function() {
  this._stream.destroy();
};

exports.Socket = Socket;
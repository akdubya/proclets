var EventEmitter = require('events').EventEmitter,
    util = require('./util');

function Stub() {
  if (!(this instanceof Stub)) return new Stub();
  this.readable = this.writable = true;
  EventEmitter.call(this);
}
util.inherits(Stub, EventEmitter);

Stub.prototype.write = function(data) {
  if (!this.writable) throw new Error("The stream is not writable");
  if (this.paused) {
    var self = this;
    this.on('flush', function() { self._emitData(data) });
    return false;
  }
  this._emitData(data);
  return true;
};

Stub.prototype.pause = function() {
  this.paused = true;
};

Stub.prototype.resume = function() {
  this.paused = false;
  this.emit('flush');
  this.removeAllListeners('flush');
  this.emit('drain');
};

Stub.prototype.destroy = function() {
  this.readable = this.writable = false;
  this.removeAllListeners('flush');
  this.emit('close');
};

Stub.prototype.end = function(data) {
  var self = this;
  data && self.write(data);
  self.writable = false;
  if (self.paused) {
    self.on('flush', function() {
      self.emit('end');
      self.emit('close');
    });
  } else {
    self.emit('end');
    self.emit('close');
  }
};

Stub.prototype.setEncoding = function(encoding) {
  var StringDecoder = require("string_decoder").StringDecoder;
  this._decoder = new StringDecoder(encoding);
};

Stub.prototype._emitData = function(d) {
  if (this._decoder) {
    var string = this._decoder.write(d);
    if (string.length) this.emit('data', string);
  } else {
    this.emit('data', d);
  }
};

exports.Stub = Stub;
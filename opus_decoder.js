var opus = require('node-opus');
var fs = require('fs');

const rate = 48000;
const framesize = 1500;
const channels = 1;

async function OpusToRaw (inputPath, filename)
{
  var encoder = new opus.OpusEncoder(rate);
  var decoded = encoder.decode()
}

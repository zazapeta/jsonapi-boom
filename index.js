var Boom = require('boom');
var debug = require('debug')('error:json-api-boom');

debug('Extending Boom', Boom);
var JsonApiBoom = {};
for (var attrib in Boom) {
  JsonApiBoom[attrib] = Boom[attrib];
}
debug('JsonApiBoom', JsonApiBoom);

module.exports = JsonApiBoom;

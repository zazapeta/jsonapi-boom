'use strict';

var Boom = require('boom');
var debug = require('debug')('error:json-api-boom');

var JsonApiBoom = {
  docs: {
    url: ''
  }
};

Object.keys(Boom).map(function (key) {
  if (typeof Boom[key] !== 'function') {
    return;
  }

  JsonApiBoom[key] = function () {
    var err;
    var originalErr;
    var headers;
    var statusCode;
    var message = '';
    var options = {};

    if (key === 'wrap') {
      originalErr = arguments[0];
      statusCode = arguments[1];
      message = arguments[2];
    } else if (key === 'unauthorized' && (!arguments[0] || arguments[1])) {
      message = arguments[0];
      headers = arguments[1];
    } else if (typeof arguments[0] === 'object' && arguments[0].err) {
      options = arguments[0];
      originalErr = arguments[0].err;
      message = arguments[0].message || originalErr.message;
    } else {
      message = arguments[0];
      originalErr = arguments[1];
    }
    debug(key, options, message, err);

    if (key === 'wrap') {
      // handle wrap's signature
      err = Boom[key].apply(this, [originalErr, statusCode, message]);
    } else if (headers) {
      // handle unauthorized headers
      err = Boom[key].apply(this, arguments);
    } else {
      err = Boom[key].apply(this, [message, originalErr]);
    }

    /* id: a unique identifier for this particular occurrence of the problem. */
    err.output.payload.id = options.id || err.output.payload.id || '';

    /* status: the HTTP status code applicable to this problem, expressed as a string value. */
    err.output.payload.status = err.output.payload.statusCode.toString();

    /* title: a short, human-readable summary of the problem that SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization. */
    err.output.payload.title = options.title || err.output.payload.error;

    /* detail: a human-readable explanation specific to this occurrence of the problem. Like title, this field’s value can be localized. */
    if (err.output.payload.statusCode < 500) {
      err.output.payload.detail = options.detail || err.output.payload.message || err.output.payload.error;
    } else {
      err.output.payload.detail = options.detail || err.output.payload.error;
    }

    /* code: an application-specific error code, expressed as a string value. */
    err.output.payload.code = options.code || '0';

    /* source: an object containing references to the source of the error, optionally including any of the following members: */
    options.source = options.source || {};
    /* pointer: a JSON Pointer [RFC6901] to the associated entity in the request document [e.g. "/data" for a primary data object, or "/data/attributes/title" for a specific attribute]. */
    options.source.pointer = options.source.pointer || '';
    /* parameter: a string indicating which URI query parameter caused the error. */
    options.source.parameter = options.source.parameter || '';
    err.output.payload.source = options.source;

    /* links: a links object containing the following members: */
    /* about: a link that leads to further details about this particular occurrence of the problem. */
    err.output.payload.links = options.links || {};
    err.output.payload.links.about = err.output.payload.links.about || JsonApiBoom.docs.url + '/' + err.output.payload.code;

    /* meta: a meta object containing non-standard meta-information about the error. */
    err.output.payload.meta = options.meta || {};

    debug('json-api boom', err);
    return err;
  };
});

JsonApiBoom.serialize = function (err) {
  return {
    errors: [{
      status: err.output.payload.status,
      code  : err.output.payload.code,
      title : err.output.payload.title,
      detail: err.output.payload.detail,
      id    : err.output.payload.id,
      source: err.output.payload.source,
      links : err.output.payload.links,
      meta  : err.output.payload.meta
    }]
  };
};


// catch boom errors
// inspired by https://github.com/zazapeta/express-boom

module.exports = function () {
  return function (req, res, next) {
    if (res.boom) {
      throw new Error('boom already exists on response object');
    }

    res.boom = {};

    Object.keys(JsonApiBoom).forEach((key) => {
      if (typeof JsonApiBoom[key] !== 'function') {
        return;
      }
      res.boom[key] = function(){
        let boomed = JsonApiBoom[key].apply(this, arguments);
        res.status(boomed.output.statusCode).send(boomed.output.payload);
      };
    });
    next();
  };
};

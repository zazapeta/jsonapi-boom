# usage 
```
var express = require('express');
var boom = require('./middleware-express-jsonapi-boom');

var app = express();

app.use(boom());

app.use(function (req, res) {
  // some validation check fail and returns an object : reasons
  
  return res.boom.forbidden({
        id    : '76876',
        code  : '123',
        title : 'Invalid Attribute',
        source: {
          pointer  : '/data/attributes/id'
        },
        links : {
          about: 'http://jsonapi.org/format/#error-objects'
        },
        meta  : {
          comments: 'its a json api error'
        },
        err   : new Error('The id cannot be updated')
      });
});
      
```
# middleware-express-jsonapi-boom

[Boom](https://github.com/hapijs/boom) with [JSON-api error](http://jsonapi.org/format/#error-objects) support.

[![Build Status](https://secure.travis-ci.org/cesine/jsonapi-boom.svg)](http://travis-ci.org/cesine/jsonapi-boom)
[![Current Version](https://img.shields.io/npm/v/jsonapi-boom.svg)](https://www.npmjs.com/package/jsonapi-boom)

<!-- toc -->

- [JsonApiBoom](#jsonapiboom)
  - [Helper Methods](#helper-methods)
    - [`wrap(error, [statusCode], [message])`](#wraperror-statuscode-message)
    - [`create(statusCode, [message], [data])`](#createstatuscode-message-data)
  - [HTTP 4xx Errors](#http-4xx-errors)
    - [`JsonApiBoom.badRequest([message], [data])`](#boombadrequestmessage-data)
    - [`JsonApiBoom.unauthorized([message], [scheme], [attributes])`](#boomunauthorizedmessage-scheme-attributes)
    - [`JsonApiBoom.forbidden([message], [data])`](#boomforbiddenmessage-data)
    - [`JsonApiBoom.notFound([message], [data])`](#boomnotfoundmessage-data)
    - [`JsonApiBoom.methodNotAllowed([message], [data])`](#boommethodnotallowedmessage-data)
    - [`JsonApiBoom.notAcceptable([message], [data])`](#boomnotacceptablemessage-data)
    - [`JsonApiBoom.proxyAuthRequired([message], [data])`](#boomproxyauthrequiredmessage-data)
    - [`JsonApiBoom.clientTimeout([message], [data])`](#boomclienttimeoutmessage-data)
    - [`JsonApiBoom.conflict([message], [data])`](#boomconflictmessage-data)
    - [`JsonApiBoom.resourceGone([message], [data])`](#boomresourcegonemessage-data)
    - [`JsonApiBoom.lengthRequired([message], [data])`](#boomlengthrequiredmessage-data)
    - [`JsonApiBoom.preconditionFailed([message], [data])`](#boompreconditionfailedmessage-data)
    - [`JsonApiBoom.entityTooLarge([message], [data])`](#boomentitytoolargemessage-data)
    - [`JsonApiBoom.uriTooLong([message], [data])`](#boomuritoolongmessage-data)
    - [`JsonApiBoom.unsupportedMediaType([message], [data])`](#boomunsupportedmediatypemessage-data)
    - [`JsonApiBoom.rangeNotSatisfiable([message], [data])`](#boomrangenotsatisfiablemessage-data)
    - [`JsonApiBoom.expectationFailed([message], [data])`](#boomexpectationfailedmessage-data)
    - [`JsonApiBoom.badData([message], [data])`](#boombaddatamessage-data)
    - [`JsonApiBoom.locked([message], [data])`](#boomlockedmessage-data)
    - [`JsonApiBoom.preconditionRequired([message], [data])`](#boompreconditionrequiredmessage-data)
    - [`JsonApiBoom.tooManyRequests([message], [data])`](#boomtoomanyrequestsmessage-data)
    - [`JsonApiBoom.illegal([message], [data])`](#boomillegalmessage-data)
  - [HTTP 5xx Errors](#http-5xx-errors)
    - [`JsonApiBoom.badImplementation([message], [data])`](#boombadimplementationmessage-data)
    - [`JsonApiBoom.notImplemented([message], [data])`](#boomnotimplementedmessage-data)
    - [`JsonApiBoom.badGateway([message], [data])`](#boombadgatewaymessage-data)
    - [`JsonApiBoom.serverUnavailable([message], [data])`](#boomserverunavailablemessage-data)
    - [`JsonApiBoom.gatewayTimeout([message], [data])`](#boomgatewaytimeoutmessage-data)
  - [F.A.Q.](#faq)

<!-- tocstop -->

# JsonApiBoom

**boom** provides a set of utilities for returning HTTP errors.

**jsonapi-boom** extends `Boom` utilities with a method signature that accepts any JSON-API attributes, and populates the JSON-API attributes on the error payload.

 Each utility returns a `Boom` error response object (instance of `Error`) which includes the following properties:
([See also the JSON-API Specification for Error Objects](http://jsonapi.org/format/#error-objects))
- `id` - a unique identifier for this particular occurrence of the problem.
- `links` - a links object containing the following members:
  - `about` - a link that leads to further details about this particular occurrence of the problem.
- `status` - the HTTP status code applicable to this problem, expressed as a string value.
- `code` - an application-specific error code, expressed as a string value.
- `title` - a short, human-readable summary of the problem that SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of - `localization.
- `detail` - a human-readable explanation specific to this occurrence of the problem. Like title, this field’s value can be localized.
- `source` - an object containing references to the source of the error, optionally including any of the following members:
  - `pointer` - a JSON Pointer [RFC6901] to the associated entity in the request document [e.g. "/data" for a primary data object, or "/data/attributes/title" for a specific attribute].
  - `parameter` - a string indicating which URI query parameter caused the error.
- `meta` - a meta object containing non-standard meta-information about the error.
- `isBoom` - if `true`, indicates this is a `Boom` object instance.
- `isServer` - convenience bool indicating status code >= 500.
- `message` - the error message.
- `output` - the formatted response. Can be directly manipulated after object construction to return a custom
  error response. Allowed root keys:
    - `statusCode` - the HTTP status code (typically 4xx or 5xx).
    - `headers` - an object containing any HTTP headers where each key is a header name and value is the header content.
    - `payload` - the formatted object used as the response payload (stringified). Can be directly manipulated but any
      changes will be lost
      if `reformat()` is called. Any content allowed and by default includes the following content:
        - `statusCode` - the HTTP status code, derived from `error.output.statusCode`.
        - `error` - the HTTP status message (e.g. 'Bad Request', 'Internal Server Error') derived from `statusCode`.
        - `message` - the error message derived from `error.message`.
- inherited `Error` properties.

The `JsonApiBoom` object also supports the following method:
- `reformat()` - rebuilds `error.output` using the other object properties.

## Options

Each utility can be called with an object containing any of the JSON-API attributes.

```js
var error = JsonApiBoom.badRequest({
  id: 'abc-123',
  code: 'y-5678',
  source: {
    parameter: 'included'
  },
  meta: {
    something: 'else'
  },
  err: new Error('Opps!')
});
```

Generates the following response payload:

```json
{
    "id": "abc-123",
    "links": {
        "about": "http://api.example.com/docs/errors/y-5678"
    },
    "status": 400,
    "statusCode": 400,
    "code": "y-5678",
    "title": "Bad Request",
    "error": "Bad Request",
    "detail": "Opps!",
    "message": "Opps!",
    "source": {
        "pointer": "",
        "parameter": "included"
    },
    "meta": {
        "something": "else"
    },
}
```

## Methods

Each utility can also be called with the original `boom` signature, meaning you can switch `boom` for this package for in your existing API and you will obtain mimially JSON-API compliant error objects.


### `wrap(error, [statusCode], [message])`

Decorates an error with the **boom** properties where:
- `error` - the error object to wrap. If `error` is already a **boom** object, returns back the same object.
- `statusCode` - optional HTTP status code. Defaults to `500`.
- `message` - optional message string. If the error already has a message, it adds the message as a prefix.
  Defaults to no message.

```js
var error = new Error('Unexpected input');
JsonApiBoom.wrap(error, 400);
```

### `create(statusCode, [message], [data])`

Generates an `Error` object with the **boom** decorations where:
- `statusCode` - an HTTP error code number. Must be greater or equal 400.
- `message` - optional message string.
- `data` - additional error data set to `error.data` property.

```js
var error = JsonApiBoom.create(400, 'Bad request', { timestamp: Date.now() });
```

## HTTP 4xx Errors

### `JsonApiBoom.badRequest([message], [data])`

Returns a 400 Bad Request error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.badRequest('invalid query');
```

Generates the following response payload:

```json
{
    "statusCode": 400,
    "error": "Bad Request",
    "message": "invalid query"
}
```

### `JsonApiBoom.unauthorized([message], [scheme], [attributes])`

Returns a 401 Unauthorized error where:
- `message` - optional message.
- `scheme` can be one of the following:
  - an authentication scheme name
  - an array of string values. These values will be separated by ', ' and set to the 'WWW-Authenticate' header.
- `attributes` - an object of values to use while setting the 'WWW-Authenticate' header. This value is only used
  when `scheme` is a string, otherwise it is ignored. Every key/value pair will be included in the
  'WWW-Authenticate' in the format of 'key="value"' as well as in the response payload under the `attributes` key.
  `null` and `undefined` will be replaced with an empty string. If `attributes` is set, `message` will be used as
  the 'error' segment of the 'WWW-Authenticate' header. If `message` is unset, the 'error' segment of the header
  will not be present and `isMissing` will be true on the error object.

If either `scheme` or `attributes` are set, the resultant `Boom` object will have the 'WWW-Authenticate' header set for the response.

```js
JsonApiBoom.unauthorized('invalid password');
```

Generates the following response:

```json
"payload": {
    "statusCode": 401,
    "error": "Unauthorized",
    "message": "invalid password"
},
"headers" {}
```

```js
JsonApiBoom.unauthorized('invalid password', 'sample');
```

Generates the following response:

```json
"payload": {
    "statusCode": 401,
    "error": "Unauthorized",
    "message": "invalid password",
    "attributes": {
        "error": "invalid password"
    }
},
"headers" {
  "WWW-Authenticate": "sample error=\"invalid password\""
}
```

```js
JsonApiBoom.unauthorized('invalid password', 'sample', { ttl: 0, cache: null, foo: 'bar' });
```

Generates the following response:

```json
"payload": {
    "statusCode": 401,
    "error": "Unauthorized",
    "message": "invalid password",
    "attributes": {
        "error": "invalid password",
        "ttl": 0,
        "cache": "",
        "foo": "bar"
    }
},
"headers" {
  "WWW-Authenticate": "sample ttl=\"0\", cache=\"\", foo=\"bar\", error=\"invalid password\""
}
```

### `JsonApiBoom.forbidden([message], [data])`

Returns a 403 Forbidden error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.forbidden('try again some time');
```

Generates the following response payload:

```json
{
    "statusCode": 403,
    "error": "Forbidden",
    "message": "try again some time"
}
```

### `JsonApiBoom.notFound([message], [data])`

Returns a 404 Not Found error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.notFound('missing');
```

Generates the following response payload:

```json
{
    "statusCode": 404,
    "error": "Not Found",
    "message": "missing"
}
```

### `JsonApiBoom.methodNotAllowed([message], [data])`

Returns a 405 Method Not Allowed error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.methodNotAllowed('that method is not allowed');
```

Generates the following response payload:

```json
{
    "statusCode": 405,
    "error": "Method Not Allowed",
    "message": "that method is not allowed"
}
```

### `JsonApiBoom.notAcceptable([message], [data])`

Returns a 406 Not Acceptable error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.notAcceptable('unacceptable');
```

Generates the following response payload:

```json
{
    "statusCode": 406,
    "error": "Not Acceptable",
    "message": "unacceptable"
}
```

### `JsonApiBoom.proxyAuthRequired([message], [data])`

Returns a 407 Proxy Authentication Required error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.proxyAuthRequired('auth missing');
```

Generates the following response payload:

```json
{
    "statusCode": 407,
    "error": "Proxy Authentication Required",
    "message": "auth missing"
}
```

### `JsonApiBoom.clientTimeout([message], [data])`

Returns a 408 Request Time-out error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.clientTimeout('timed out');
```

Generates the following response payload:

```json
{
    "statusCode": 408,
    "error": "Request Time-out",
    "message": "timed out"
}
```

### `JsonApiBoom.conflict([message], [data])`

Returns a 409 Conflict error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.conflict('there was a conflict');
```

Generates the following response payload:

```json
{
    "statusCode": 409,
    "error": "Conflict",
    "message": "there was a conflict"
}
```

### `JsonApiBoom.resourceGone([message], [data])`

Returns a 410 Gone error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.resourceGone('it is gone');
```

Generates the following response payload:

```json
{
    "statusCode": 410,
    "error": "Gone",
    "message": "it is gone"
}
```

### `JsonApiBoom.lengthRequired([message], [data])`

Returns a 411 Length Required error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.lengthRequired('length needed');
```

Generates the following response payload:

```json
{
    "statusCode": 411,
    "error": "Length Required",
    "message": "length needed"
}
```

### `JsonApiBoom.preconditionFailed([message], [data])`

Returns a 412 Precondition Failed error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.preconditionFailed();
```

Generates the following response payload:

```json
{
    "statusCode": 412,
    "error": "Precondition Failed"
}
```

### `JsonApiBoom.entityTooLarge([message], [data])`

Returns a 413 Request Entity Too Large error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.entityTooLarge('too big');
```

Generates the following response payload:

```json
{
    "statusCode": 413,
    "error": "Request Entity Too Large",
    "message": "too big"
}
```

### `JsonApiBoom.uriTooLong([message], [data])`

Returns a 414 Request-URI Too Large error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.uriTooLong('uri is too long');
```

Generates the following response payload:

```json
{
    "statusCode": 414,
    "error": "Request-URI Too Large",
    "message": "uri is too long"
}
```

### `JsonApiBoom.unsupportedMediaType([message], [data])`

Returns a 415 Unsupported Media Type error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.unsupportedMediaType('that media is not supported');
```

Generates the following response payload:

```json
{
    "statusCode": 415,
    "error": "Unsupported Media Type",
    "message": "that media is not supported"
}
```

### `JsonApiBoom.rangeNotSatisfiable([message], [data])`

Returns a 416 Requested Range Not Satisfiable error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.rangeNotSatisfiable();
```

Generates the following response payload:

```json
{
    "statusCode": 416,
    "error": "Requested Range Not Satisfiable"
}
```

### `JsonApiBoom.expectationFailed([message], [data])`

Returns a 417 Expectation Failed error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.expectationFailed('expected this to work');
```

Generates the following response payload:

```json
{
    "statusCode": 417,
    "error": "Expectation Failed",
    "message": "expected this to work"
}
```

### `JsonApiBoom.badData([message], [data])`

Returns a 422 Unprocessable Entity error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.badData('your data is bad and you should feel bad');
```

Generates the following response payload:

```json
{
    "statusCode": 422,
    "error": "Unprocessable Entity",
    "message": "your data is bad and you should feel bad"
}
```

### `JsonApiBoom.locked([message], [data])`

Returns a 423 Locked error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.locked('this resource has been locked');
```

Generates the following response payload:

```json
{
    "statusCode": 423,
    "error": "Locked",
    "message": "this resource has been locked"
}
```

### `JsonApiBoom.preconditionRequired([message], [data])`

Returns a 428 Precondition Required error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.preconditionRequired('you must supply an If-Match header');
```

Generates the following response payload:

```json
{
    "statusCode": 428,
    "error": "Precondition Required",
    "message": "you must supply an If-Match header"
}
```

### `JsonApiBoom.tooManyRequests([message], [data])`

Returns a 429 Too Many Requests error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.tooManyRequests('you have exceeded your request limit');
```

Generates the following response payload:

```json
{
    "statusCode": 429,
    "error": "Too Many Requests",
    "message": "you have exceeded your request limit"
}
```

### `JsonApiBoom.illegal([message], [data])`

Returns a 451 Unavailable For Legal Reasons error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.illegal('you are not permitted to view this resource for legal reasons');
```

Generates the following response payload:

```json
{
    "statusCode": 451,
    "error": "Unavailable For Legal Reasons",
    "message": "you are not permitted to view this resource for legal reasons"
}
```

## HTTP 5xx Errors

All 500 errors hide your message from the end user. Your message is recorded in the server log.

### `JsonApiBoom.badImplementation([message], [data])`

Returns a 500 Internal Server Error error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.badImplementation('terrible implementation');
```

Generates the following response payload:

```json
{
    "statusCode": 500,
    "error": "Internal Server Error",
    "message": "An internal server error occurred"
}
```

### `JsonApiBoom.notImplemented([message], [data])`

Returns a 501 Not Implemented error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.notImplemented('method not implemented');
```

Generates the following response payload:

```json
{
    "statusCode": 501,
    "error": "Not Implemented",
    "message": "method not implemented"
}
```

### `JsonApiBoom.badGateway([message], [data])`

Returns a 502 Bad Gateway error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.badGateway('that is a bad gateway');
```

Generates the following response payload:

```json
{
    "statusCode": 502,
    "error": "Bad Gateway",
    "message": "that is a bad gateway"
}
```

### `JsonApiBoom.serverUnavailable([message], [data])`

Returns a 503 Service Unavailable error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.serverUnavailable('unavailable');
```

Generates the following response payload:

```json
{
    "statusCode": 503,
    "error": "Service Unavailable",
    "message": "unavailable"
}
```

### `JsonApiBoom.gatewayTimeout([message], [data])`

Returns a 504 Gateway Time-out error where:
- `message` - optional message.
- `data` - optional additional error data.

```js
JsonApiBoom.gatewayTimeout();
```

Generates the following response payload:

```json
{
    "statusCode": 504,
    "error": "Gateway Time-out"
}
```

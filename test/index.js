var chai = require('chai');
var expect = chai.expect;

var JsonApiBoom = require('./../');

describe('JsonApiBoom', function() {
  afterEach(function() {
    JsonApiBoom.docs = {
      url: ''
    };
  });

  it('should load', function() {
    expect(JsonApiBoom).to.be.defined;
  });

  describe('implements JSON-API', function() {
    it('should support all attributes', function() {
      JsonApiBoom.docs = {
        url: 'http://api.example.com/docs/errors'
      };

      var err = JsonApiBoom.badRequest({
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

      expect(err.output).to.deep.equal({
        statusCode: 400,
        payload: {
          id: 'abc-123',
          links: {
            about: 'http://api.example.com/docs/errors/y-5678'
          },
          status: '400',
          statusCode: 400,
          code: 'y-5678',
          title: 'Bad Request',
          error: 'Bad Request',
          detail: 'Opps!',
          message: 'Opps!',
          source: {
            pointer: '',
            parameter: 'included'
          },
          meta: {
            something: 'else'
          },
        },
        headers: {}
      });
    });

    it('should can serialize into json-api', function() {
      JsonApiBoom.docs = {
        url: 'http://api.example.com/docs/errors'
      };

      var err = JsonApiBoom.unauthorized({
        id: 'abc-123',
        code: 'y-996',
        err: new Error('Opps!')
      });

      expect(JsonApiBoom.serialize(err)).to.deep.equal({
        errors: [{
          id: 'abc-123',
          links: {
            about: 'http://api.example.com/docs/errors/y-996'
          },
          status: '401',
          code: 'y-996',
          title: 'Unauthorized',
          detail: 'Opps!',
          source: {
            pointer: '',
            parameter: ''
          },
          meta: {}
        }]
      });
    });
  });

  describe('extends boom', function() {
    it('returns the same object when already boom', function(done) {
      var error = JsonApiBoom.badRequest();
      var wrapped = JsonApiBoom.wrap(error);
      expect(error).to.equal(wrapped);
      done();
    });

    it('returns an error with info when varructed using another error', function(done) {
      var error = new Error('ka-boom');
      error.xyz = 123;
      var err = JsonApiBoom.wrap(error);
      expect(err.xyz).to.equal(123);
      expect(err.message).to.equal('ka-boom');
      expect(err.output).to.deep.equal({
        statusCode: 500,
        payload: {
          id: '',
          links: {
            about: '/0'
          },
          status: '500',
          code: '0',
          title: 'Internal Server Error',
          error: 'Internal Server Error',
          detail: 'Internal Server Error',
          source: {
            pointer: '',
            parameter: ''
          },
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An internal server error occurred',
          meta: {}
        },
        headers: {}
      });
      expect(err.data).to.equal(null);
      done();
    });

    it('does not override data when varructed using another error', function(done) {
      var error = new Error('ka-boom');
      error.data = {
        useful: 'data'
      };
      var err = JsonApiBoom.wrap(error);
      expect(err.data).to.equal(error.data);
      done();
    });

    it('sets new message when none exists', function(done) {
      var error = new Error();
      var wrapped = JsonApiBoom.wrap(error, 400, 'something bad');
      expect(wrapped.message).to.equal('something bad');
      done();
    });

    it('throws when statusCode is not a number', function(done) {
      expect(function() {
        JsonApiBoom.create('x');
      }).to.throw('First argument must be a number (400+): x');
      done();
    });

    it('will cast a number-string to an integer', function(done) {
      var codes = [{
        input: '404',
        result: 404
      }, {
        input: '404.1',
        result: 404
      }, {
        input: 400,
        result: 400
      }, {
        input: 400.123,
        result: 400
      }];

      for (var i = 0; i < codes.length; ++i) {
        var code = codes[i];
        var err = JsonApiBoom.create(code.input);
        expect(err.output.statusCode).to.equal(code.result);
      }

      done();
    });

    it('throws when statusCode is not finite', function(done) {
      expect(function() {
        JsonApiBoom.create(1 / 0);
      }).to.throw('First argument must be a number (400+): null');
      done();
    });

    it('sets error code to unknown', function(done) {
      var err = JsonApiBoom.create(999);
      expect(err.output.payload.error).to.equal('Unknown');
      done();
    });

    describe('create()', function() {
      it('does not sets null message', function(done) {
        var error = JsonApiBoom.unauthorized(null);
        expect(error.output.payload.message).to.equal(undefined);
        expect(error.isServer).to.equal(false);
        done();
      });

      it('sets message and data', function(done) {
        var error = JsonApiBoom.badRequest('Missing data', {
          type: 'user'
        });
        expect(error.data.type).to.equal('user');
        expect(error.output.payload.message).to.equal('Missing data');
        done();
      });
    });

    describe('isBoom()', function() {
      it('returns true for JsonApiBoom object', function(done) {
        expect(JsonApiBoom.badRequest().isBoom).to.equal(true);
        done();
      });

      it('returns false for Error object', function(done) {
        expect((new Error()).isBoom).to.equal(undefined);
        done();
      });
    });

    describe('badRequest()', function() {
      it('returns a 400 error statusCode', function(done) {
        var error = JsonApiBoom.badRequest();

        expect(error.output.statusCode).to.equal(400);
        expect(error.isServer).to.equal(false);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.badRequest('my message').message).to.equal('my message');
        done();
      });

      it('sets the message to HTTP status if none provided', function(done) {
        expect(JsonApiBoom.badRequest().message).to.equal('Bad Request');
        done();
      });
    });

    describe('unauthorized()', function() {
      it('returns a 401 error statusCode', function(done) {
        var err = JsonApiBoom.unauthorized();
        expect(err.output.statusCode).to.equal(401);
        expect(err.output.headers).to.deep.equal({});
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.unauthorized('my message').message).to.equal('my message');
        done();
      });

      it('returns a WWW-Authenticate header when passed a scheme', function(done) {
        var err = JsonApiBoom.unauthorized('boom', 'Test');
        expect(err.output.statusCode).to.equal(401);
        expect(err.output.headers['WWW-Authenticate']).to.equal('Test error="boom"');
        done();
      });

      it('returns a WWW-Authenticate header set to the schema array value', function(done) {
        var err = JsonApiBoom.unauthorized(null, ['Test', 'one', 'two']);
        expect(err.output.statusCode).to.equal(401);
        expect(err.output.headers['WWW-Authenticate']).to.equal('Test, one, two');
        done();
      });

      it('returns a WWW-Authenticate header when passed a scheme and attributes', function(done) {
        var err = JsonApiBoom.unauthorized('boom', 'Test', {
          a: 1,
          b: 'something',
          c: null,
          d: 0
        });
        expect(err.output.statusCode).to.equal(401);
        expect(err.output.headers['WWW-Authenticate']).to.equal('Test a="1", b="something", c="", d="0", error="boom"');
        expect(err.output.payload.attributes).to.deep.equal({
          a: 1,
          b: 'something',
          c: '',
          d: 0,
          error: 'boom'
        });
        done();
      });

      it('returns a WWW-Authenticate header when passed attributes, missing error', function(done) {
        var err = JsonApiBoom.unauthorized(null, 'Test', {
          a: 1,
          b: 'something',
          c: null,
          d: 0
        });
        expect(err.output.statusCode).to.equal(401);
        expect(err.output.headers['WWW-Authenticate']).to.equal('Test a="1", b="something", c="", d="0"');
        expect(err.isMissing).to.equal(true);
        done();
      });

      it('sets the isMissing flag when error message is empty', function(done) {
        var err = JsonApiBoom.unauthorized('', 'Basic');
        expect(err.isMissing).to.equal(true);
        done();
      });

      it('does not set the isMissing flag when error message is not empty', function(done) {
        var err = JsonApiBoom.unauthorized('message', 'Basic');
        expect(err.isMissing).to.equal(undefined);
        done();
      });

      it('sets a WWW-Authenticate when passed as an array', function(done) {
        var err = JsonApiBoom.unauthorized('message', ['Basic', 'Example e="1"', 'Another x="3", y="4"']);
        expect(err.output.headers['WWW-Authenticate']).to.equal('Basic, Example e="1", Another x="3", y="4"');
        done();
      });
    });


    describe('methodNotAllowed()', function() {
      it('returns a 405 error statusCode', function(done) {
        expect(JsonApiBoom.methodNotAllowed().output.statusCode).to.equal(405);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.methodNotAllowed('my message').message).to.equal('my message');
        done();
      });
    });


    describe('notAcceptable()', function() {
      it('returns a 406 error statusCode', function(done) {
        expect(JsonApiBoom.notAcceptable().output.statusCode).to.equal(406);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.notAcceptable('my message').message).to.equal('my message');
        done();
      });
    });


    describe('proxyAuthRequired()', function() {
      it('returns a 407 error statusCode', function(done) {
        expect(JsonApiBoom.proxyAuthRequired().output.statusCode).to.equal(407);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.proxyAuthRequired('my message').message).to.equal('my message');
        done();
      });
    });


    describe('clientTimeout()', function() {
      it('returns a 408 error statusCode', function(done) {
        expect(JsonApiBoom.clientTimeout().output.statusCode).to.equal(408);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.clientTimeout('my message').message).to.equal('my message');
        done();
      });
    });


    describe('conflict()', function() {
      it('returns a 409 error statusCode', function(done) {
        expect(JsonApiBoom.conflict().output.statusCode).to.equal(409);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.conflict('my message').message).to.equal('my message');
        done();
      });
    });


    describe('resourceGone()', function() {
      it('returns a 410 error statusCode', function(done) {
        expect(JsonApiBoom.resourceGone().output.statusCode).to.equal(410);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.resourceGone('my message').message).to.equal('my message');
        done();
      });
    });


    describe('lengthRequired()', function() {
      it('returns a 411 error statusCode', function(done) {
        expect(JsonApiBoom.lengthRequired().output.statusCode).to.equal(411);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.lengthRequired('my message').message).to.equal('my message');
        done();
      });
    });


    describe('preconditionFailed()', function() {
      it('returns a 412 error statusCode', function(done) {
        expect(JsonApiBoom.preconditionFailed().output.statusCode).to.equal(412);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.preconditionFailed('my message').message).to.equal('my message');
        done();
      });
    });


    describe('entityTooLarge()', function() {
      it('returns a 413 error statusCode', function(done) {
        expect(JsonApiBoom.entityTooLarge().output.statusCode).to.equal(413);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.entityTooLarge('my message').message).to.equal('my message');
        done();
      });
    });


    describe('uriTooLong()', function() {
      it('returns a 414 error statusCode', function(done) {
        expect(JsonApiBoom.uriTooLong().output.statusCode).to.equal(414);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.uriTooLong('my message').message).to.equal('my message');
        done();
      });
    });


    describe('unsupportedMediaType()', function() {
      it('returns a 415 error statusCode', function(done) {
        expect(JsonApiBoom.unsupportedMediaType().output.statusCode).to.equal(415);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.unsupportedMediaType('my message').message).to.equal('my message');
        done();
      });
    });


    describe('rangeNotSatisfiable()', function() {
      it('returns a 416 error statusCode', function(done) {
        expect(JsonApiBoom.rangeNotSatisfiable().output.statusCode).to.equal(416);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.rangeNotSatisfiable('my message').message).to.equal('my message');
        done();
      });
    });


    describe('expectationFailed()', function() {
      it('returns a 417 error statusCode', function(done) {
        expect(JsonApiBoom.expectationFailed().output.statusCode).to.equal(417);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.expectationFailed('my message').message).to.equal('my message');
        done();
      });
    });


    describe('badData()', function() {
      it('returns a 422 error statusCode', function(done) {
        expect(JsonApiBoom.badData().output.statusCode).to.equal(422);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.badData('my message').message).to.equal('my message');
        done();
      });
    });


    describe('locked()', function() {
      it('returns a 423 error statusCode', function(done) {
        expect(JsonApiBoom.locked().output.statusCode).to.equal(423);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.locked('my message').message).to.equal('my message');
        done();
      });
    });


    describe('preconditionRequired()', function() {
      it('returns a 428 error statusCode', function(done) {
        expect(JsonApiBoom.preconditionRequired().output.statusCode).to.equal(428);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.preconditionRequired('my message').message).to.equal('my message');
        done();
      });
    });


    describe('tooManyRequests()', function() {
      it('returns a 429 error statusCode', function(done) {
        expect(JsonApiBoom.tooManyRequests().output.statusCode).to.equal(429);
        done();
      });

      it('sets the message with the passed-in message', function(done) {
        expect(JsonApiBoom.tooManyRequests('my message').message).to.equal('my message');
        done();
      });
    });


    describe('illegal()', function() {
      it('returns a 451 error statusCode', function(done) {
        expect(JsonApiBoom.illegal().output.statusCode).to.equal(451);
        done();
      });

      it('sets the message with the passed-in message', function(done) {
        expect(JsonApiBoom.illegal('my message').message).to.equal('my message');
        done();
      });
    });

    describe('serverUnavailable()', function() {
      it('returns a 503 error statusCode', function(done) {
        expect(JsonApiBoom.serverUnavailable().output.statusCode).to.equal(503);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.serverUnavailable('my message').message).to.equal('my message');
        done();
      });
    });

    describe('forbidden()', function() {
      it('returns a 403 error statusCode', function(done) {
        expect(JsonApiBoom.forbidden().output.statusCode).to.equal(403);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.forbidden('my message').message).to.equal('my message');
        done();
      });
    });

    describe('notFound()', function() {
      it('returns a 404 error statusCode', function(done) {
        expect(JsonApiBoom.notFound().output.statusCode).to.equal(404);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.notFound('my message').message).to.equal('my message');
        done();
      });
    });

    describe('internal()', function() {
      it('returns a 500 error statusCode', function(done) {
        expect(JsonApiBoom.internal().output.statusCode).to.equal(500);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        var err = JsonApiBoom.internal('my message');
        expect(err.message).to.equal('my message');
        expect(err.isServer).to.equal(true);
        expect(err.output.payload.message).to.equal('An internal server error occurred');
        done();
      });

      it('passes data on the callback if its passed in', function(done) {
        expect(JsonApiBoom.internal('my message', {
          my: 'data'
        }).data.my).to.equal('data');
        done();
      });

      it('returns an error with composite message', function(done) {
        try {
          x.foo();
        } catch (err) {
          var boom = JsonApiBoom.internal('Someting bad', err);
          expect(boom.message).to.equal('Someting bad: x is not defined');
          expect(boom.isServer).to.equal(true);
          done();
        }
      });
    });

    describe('notImplemented()', function() {
      it('returns a 501 error statusCode', function(done) {
        expect(JsonApiBoom.notImplemented().output.statusCode).to.equal(501);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.notImplemented('my message').message).to.equal('my message');
        done();
      });
    });


    describe('badGateway()', function() {
      it('returns a 502 error statusCode', function(done) {
        expect(JsonApiBoom.badGateway().output.statusCode).to.equal(502);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.badGateway('my message').message).to.equal('my message');
        done();
      });
    });

    describe('gatewayTimeout()', function() {
      it('returns a 504 error statusCode', function(done) {
        expect(JsonApiBoom.gatewayTimeout().output.statusCode).to.equal(504);
        done();
      });

      it('sets the message with the passed in message', function(done) {
        expect(JsonApiBoom.gatewayTimeout('my message').message).to.equal('my message');
        done();
      });
    });

    describe('badImplementation()', function() {
      it('returns a 500 error statusCode', function(done) {
        var err = JsonApiBoom.badImplementation();
        expect(err.output.statusCode).to.equal(500);
        expect(err.isDeveloperError).to.equal(true);
        expect(err.isServer).to.equal(true);
        done();
      });
    });

    describe('stack trace', function() {
      it('should omit lib', function(done) {
        ['badRequest', 'unauthorized', 'forbidden', 'notFound', 'methodNotAllowed',
          'notAcceptable', 'proxyAuthRequired', 'clientTimeout', 'conflict',
          'resourceGone', 'lengthRequired', 'preconditionFailed', 'entityTooLarge',
          'uriTooLong', 'unsupportedMediaType', 'rangeNotSatisfiable', 'expectationFailed',
          'badData', 'preconditionRequired', 'tooManyRequests',

          // 500s
          'internal', 'notImplemented', 'badGateway', 'serverUnavailable',
          'gatewayTimeout', 'badImplementation'
        ].forEach(function(name) {

          var err = JsonApiBoom[name]();
          expect(err.stack).to.not.match(/\/lib\/index\.js/);
        });

        done();
      });
    });
  });
});

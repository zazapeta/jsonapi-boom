var chai = require('chai');
var expect = chai.expect;

var JsonApiBoom = require('./');

describe('JsonApiBoom', function() {
  it('should load', function() {
    expect(JsonApiBoom).to.be.defined;
  });
});

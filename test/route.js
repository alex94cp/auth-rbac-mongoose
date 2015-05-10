var rbacAuth = {};
rbacAuth.mongoose = require('../');

var should = require('should');
var mongoose = require('mongoose');
var mockgoose = require('mockgoose');
mockgoose(mongoose);

var User = require('./models/users');

describe('Route', function() {
	var route;
	before(function() {
		var credRoute = rbacAuth.mongoose.start({ user: String, pass: String });
		route = credRoute.field('user').rel('link', 'name').gives(User);
	});

	describe('#routeFrom', function() {
		it('should return the correct object', function(done) {
			route.routeFrom({ user: 'guest' }, function(err, user) {
				if (err)
					return done(err);
				(user !== null).should.be.true;
				user.name.should.equal('guest');
				return done();
			});
		});
	});
});

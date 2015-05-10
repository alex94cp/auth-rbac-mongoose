var rbacAuth = {};
rbacAuth.mongoose = require('../');
var Route = rbacAuth.mongoose.Route;

var should = require('should');
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/test');

describe('Route', function() {
	describe('#routeFrom', function() {
		describe('field', function() {
			var route;
			before(function() {
				route = new Route({ field: String }).field('field');
			});

			it('should invoke callback with field value', function(done) {
				route.routeFrom({ field: 'value' }, function(err, fieldValue) {
					if (err)
						return done(err);
					fieldValue.should.equal('value');
					return done();
				});
			});

			it('should invoke callback with null otherwise', function(done) {
				route.routeFrom({}, function(err, fieldValue) {
					if (err)
						return done(err);
					(!!fieldValue).should.be.false;
					return done();
				});
			});
		});

		describe('linkWith', function(done) {
			var Foo, foo, route;
			before(function(done) {
				var fromRoute = new Route({ link: String });
				var fooSchema = new Schema({ linked: String });
				Foo = mongoose.model('Foo', fooSchema);
				route = Route.newFrom(fromRoute).field('link').linkWith('linked').gives(Foo);
				foo = new Foo({ linked: 'value' });
				foo.save(done);
			});

			after(function(done) {
				Foo.remove(done);
			});

			it('should invoke callback with correct object', function(done) {
				route.routeFrom({ link: 'value' }, function(err, foo) {
					if (err)
						return done(err);
					(!!foo).should.be.true;
					foo.linked.should.equal('value');
					return done();
				});
			});

			it('should invoke callback with null otherwise', function(done) {
				route.routeFrom({ link: 'invalid' }, function(err, foo) {
					if (err)
						return done(err);
					(!!foo).should.be.false;
					return done();
				});
			});
		});
	});

	describe('#checkRoute', function() {
		var route;
		before(function() {
			route = new Route({ field: [String] }).field('field').gives([String]);
		});

		it('should invoke callback with true if field contains value', function(done) {
			route.checkRoute({ field: ['foo', 'bar'] }, 'foo', function(err, hasValue) {
				if (err)
					return done(err);
				hasValue.should.be.true;
				return done();
			});
		});

		it('should invoke callback with false otherwise', function(done) {
			route.checkRoute({ field: ['foo', 'bar'] }, 'invalid', function(err, hasValue) {
				if (err)
					return done(err);
				hasValue.should.be.false;
				return done();
			});
		});
	});
});

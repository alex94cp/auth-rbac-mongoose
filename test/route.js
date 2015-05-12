var rbacAuth = {};
rbacAuth.mongoose = require('../');
var Route = rbacAuth.mongoose.Route;

var should = require('should');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/test');

describe('Route', function() {
	describe('#routeFrom', function() {
		describe('field', function() {
			var route;
			before(function() {
				route = new Route({ field: String }).field('field');
			});

			it('invokes callback with field value', function(done) {
				route.routeFrom({ field: 'foo' }, function(err, value) {
					if (err)
						return done(err);
					value.should.equal('foo');
					return done();
				});
			});

			it('invokes callback with null otherwise', function(done) {
				route.routeFrom({}, function(err, value) {
					if (err)
						return done(err);
					(!!value).should.be.false;
					return done();
				});
			});
		});

		describe('dbRef', function() {
			var Foo, foo, route;
			before(function(done) {
				var fromRoute = new Route({ id: Schema.ObjectId });
				Foo = mongoose.model('foo', new Schema);
				route = fromRoute.field('id').dbRef.gives(Foo);
				foo = new Foo;
				foo.save(done);
			});

			after(function(done) {
				Foo.remove(done);
			});

			it('invokes callback with correct object', function(done) {
				route.routeFrom({ id: foo._id }, function(err, value) {
					if (err)
						return done(err);
					(!!value).should.be.true;
					value._id.equals(foo._id).should.be.true;
					return done();
				});
			});

			it('invokes callback with null otherwise', function(done) {
				route.routeFrom({ id: new mongoose.Types.ObjectId }, function(err, value) {
					if (err)
						return done(err);
					(!!value).should.be.false;
					return done();
				});
			});
		});

		describe('linkWith', function() {
			var Foo, route;
			before(function(done) {
				var fromRoute = new Route({ link: String });
				Foo = mongoose.model('Foo', new Schema({ linked: String }));
				route = fromRoute.field('link').linkWith('linked').gives(Foo);
				Foo.create({ linked: 'foo' }, done);
			});

			after(function(done) {
				Foo.remove(done);
			});

			it('invokes callback with correct object', function(done) {
				route.routeFrom({ link: 'foo' }, function(err, value) {
					if (err)
						return done(err);
					(!!value).should.be.true;
					value.linked.should.equal('foo');
					return done();
				});
			});

			it('invokes callback with null otherwise', function(done) {
				route.routeFrom({ link: 'invalid' }, function(err, value) {
					if (err)
						return done(err);
					(!!value).should.be.false;
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

		it('invokes callback with true if field contains value', function(done) {
			route.checkRoute({ field: ['foo', 'bar'] }, 'foo', function(err, hasValue) {
				if (err)
					return done(err);
				hasValue.should.be.true;
				return done();
			});
		});

		it('invokes callback with false otherwise', function(done) {
			route.checkRoute({ field: ['foo', 'bar'] }, 'invalid', function(err, hasValue) {
				if (err)
					return done(err);
				hasValue.should.be.false;
				return done();
			});
		});
	});
});

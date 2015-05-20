var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://localhost/test');

var authRbacMongoose = require('../');
var Route = authRbacMongoose.Route;

describe('Route', function() {
	describe('newFrom', function() {
		it('creates new route starting from route', function() {
			var rootRoute = new Route(String);
			var route = Route.newFrom(rootRoute);
			expect(route).to.not.equal(rootRoute);
		});
	});

	describe('#self', function() {
		it('makes #routeFrom invoke callback with given object', function() {
			var route = new Route(String);
			route.routeFrom('expected-value', function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('expected-value');
			});
		});
	});

	describe('#field', function() {
		it('makes #routeFrom invoke callback with field from given object', function() {
			var route = new Route({ field: String }).field('field');
			route.routeFrom({ field: 'field-value' }, function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('field-value');
			});
		});

		it('makes #routeFrom invoke callback with deep field from given object', function() {
			var route = new Route({ inner: { field: String }}).field('inner.field');
			route.routeFrom({ inner: { field: 'field-value' }}, function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('field-value');
			});
		});

		it('makes #routeFrom invoke callback with array element from given object', function() {
			var route = new Route({ arr: [String] }).field('arr[0]');
			route.routeFrom({ arr: ['elem-value'] }, function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('elem-value');
			});
		});

		it('makes #routeFrom invoke callback with undefined if invalid field given', function() {
			var route = new Route({}).field('invalid');
			route.routeFrom({}, function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.not.exist;
			});
		});
	});

	describe('#linkedWith', function() {
		var LinkedModel;
		before(function(done) {
			var linkedSchema = new mongoose.Schema({ linkedField: String });
			LinkedModel = db.model('LinkedModel', linkedSchema);
			LinkedModel.create({ linkedField: 'linked-value' }, done);
		});

		after(function(done) {
			LinkedModel.remove(done);
		});

		it('makes #routeFrom invoke callback with matching document', function(done) {
			var route = new Route(String).linkedWith('linkedField').gives(LinkedModel);
			route.routeFrom('linked-value', function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.have.property('linkedField', 'linked-value');
				return done();
			});
		});

		it('makes #routeFrom invoke callback with matching documents', function(done) {
			var route = new Route(String).linkedWith('linkedField').gives([LinkedModel]);
			route.routeFrom('linked-value', function(err, values) {
				expect(err).to.not.exist;
				expect(values).to.be.an.instanceof(Array)
							.and.have.property('length', 1);
				return done();
			});
		});
	});

	describe('#dbRef', function() {
		var DbRefModel, output;
		before(function(done) {
			var dbRefSchema = new mongoose.Schema;
			DbRefModel = db.model('DbRefModel', dbRefSchema);
			output = new DbRefModel();
			output.save(done);
		});

		after(function(done) {
			DbRefModel.remove(done);
		});

		it('makes #routeFrom invoke callback with referenced mongoose document', function(done) {
			var route = new Route(mongoose.Types.ObjectId).dbRef.gives(DbRefModel);
			route.routeFrom(output._id, function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.have.property('_id');
				expect(value._id).to.satisfy(function(id) {
					return id.equals(output._id);
				});
				return done();
			});
		});
	});

	describe('#assert', function() {
		var condCallback, route;
		before(function() {
			condCallback = sinon.stub();
			route = new Route(String).assert(condCallback);
		});

		beforeEach(function() {
			condCallback.reset();
		});

		it('makes #routeFrom invoke callback with value if condition is true', function() {
			condCallback.callsArgWith(1, null, true);
			route.routeFrom('expected-value', function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('expected-value');
			});
			var paramsMatch = sinon.match({ value: 'expected-value' });
			expect(condCallback).to.have.been.calledWith(paramsMatch);
		});

		it('makes #routeFrom invoke callback with null if condition is false', function() {
			condCallback.callsArgWith(1, null, false);
			route.routeFrom('expected-value', function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.not.exist;
			});
			var paramsMatch = sinon.match({ value: 'expected-value' });
			expect(condCallback).to.have.been.calledWith(paramsMatch);
		});
	});

	describe('#saveAs', function() {
		it('makes value available for #assert callbacks', function() {
			var condCallback = sinon.stub().callsArgWith(1, null, true);
			var route = new Route(String).saveAs('savedAs').assert(condCallback);
			route.routeFrom('saved-value', function(err, value, saved) {
				expect(err).to.not.exist;
				expect(value).to.equal('saved-value');
			});
			expect(condCallback).to.have.been.calledWith(sinon.match({
				value: 'saved-value', saved: { savedAs: 'saved-value' }
			}));
		});
	});

	describe('#checkRoute', function() {
		it('invokes callback with true if returned object matches value', function() {
			var route = new Route(String);
			route.checkRoute('expected-value', 'expected-value', function(err, match) {
				expect(err).to.not.exist;
				expect(match).to.be.true;
			});
		});

		it('invokes callback with true if returned array has value', function() {
			var route = new Route([Number]);
			route.checkRoute([1,2,3], 1, function(err, hasValue) {
				expect(err).to.not.exist;
				expect(hasValue).to.be.true;
			});
		});
	});
});

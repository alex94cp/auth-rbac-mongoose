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

	describe('#saveAs', function() {
		var paramsMatch;
		before(function() {
			paramsMatch = sinon.match({
				value: 'saved-value',
				saved: { savedAs: 'saved-value' }
			});
		});

		it('makes value available for #assert callbacks', function() {
			var condCallback = sinon.stub().callsArgWith(1, null, true);
			var route = new Route(String).saveAs('savedAs').assert(condCallback);
			route.routeFrom('saved-value', function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('saved-value');
			});
			expect(condCallback).to.have.been.calledWith(paramsMatch);
		});

		it('makes value available for #filter callbacks', function() {
			var filterCallback = sinon.stub().callsArgWith(1, null, 'returned-value');
			var route = new Route(String).saveAs('savedAs').filter(filterCallback);
			route.routeFrom('saved-value', function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('returned-value');
			});
			expect(filterCallback).to.have.been.calledWith(paramsMatch);
		});
	});

	describe('#filter', function() {
		var filterCallback, route;
		before(function() {
			filterCallback = sinon.stub();
			route = new Route(String).filter(filterCallback);
		});

		beforeEach(function() {
			filterCallback.reset();
		});

		it('makes #routeFrom invoke callback with return value from filter', function() {
			filterCallback.callsArgWith(1, null, 'returned-value');
			route.routeFrom('expected-value', function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('returned-value');
			});
			var paramsMatch = sinon.match({ value: 'expected-value' });
			expect(filterCallback).to.have.been.calledWith(paramsMatch);
		});

		it('propagates filter callback errors', function() {
			filterCallback.callsArgWith(1, new Error);
			route.routeFrom('expected-value', function(err, value) {
				expect(err).to.exist;
				expect(value).to.not.exist;
			});
			var paramsMatch = sinon.match({ value: 'expected-value' });
			expect(filterCallback).to.have.been.calledWith(paramsMatch);
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
			var route = new Route({ arr: [String] }).field('array.1');
			route.routeFrom({ array: [null, 'elem-value'] }, function(err, value) {
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
});

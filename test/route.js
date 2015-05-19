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
			var route = new Route({ fieldName: String }).field('fieldName');
			route.routeFrom({ fieldName: 'field-value' }, function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('field-value');
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

	describe('#check', function() {
		var checkCallback, route;
		before(function() {
			checkCallback = sinon.stub();
			route = new Route(String).check(checkCallback);
		});

		beforeEach(function() {
			checkCallback.reset();
		});

		it('makes #routeFrom invoke callback with value if check passed', function() {
			checkCallback.callsArgWith(1, null, true);
			route.routeFrom('expected-value', function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('expected-value');
			});
			expect(checkCallback).to.have.been.calledWith('expected-value');
		});

		it('makes #routeFrom invoke callback with null if check not passed', function() {
			checkCallback.callsArgWith(1, null, false);
			route.routeFrom('expected-value', function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.not.exist;
			});
			expect(checkCallback).to.have.been.calledWith('expected-value');
		});
	});

	describe('#saveAs', function() {
		it('makes value available for #check as name', function() {
			var checkCallback = sinon.stub().callsArgWith(2, null, true);
			var route = new Route(String).saveAs('saved').check(checkCallback, 'saved');
			route.routeFrom('saved-value', function(err, value) {
				expect(err).to.not.exist;
				expect(value).to.equal('saved-value');
			});
			expect(checkCallback).to.have.been.calledWith('saved-value', 'saved-value');
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

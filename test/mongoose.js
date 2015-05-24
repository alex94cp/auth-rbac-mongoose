var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://localhost/test');

var credSchema = new mongoose.Schema({ user: String });
var userSchema = new mongoose.Schema({ name: String, role: String });
var roleSchema = new mongoose.Schema({ name: String, privs: [String] });

var userModel = db.model('User', userSchema);
var roleModel = db.model('Role', roleSchema);

var authMongoose = require('../lib/mongoose');
var authRbacMongoose = require('../');
var Route = authRbacMongoose.Route;

var credRoute = new Route(credSchema);
var userRoute = Route.newFrom(credRoute).field('user').linkedWith('name').gives(userModel);
var roleRoute = Route.newFrom(userRoute).field('role').linkedWith('name').gives(roleModel);
var privRoute = Route.newFrom(roleRoute).field('privs');

var authenticateUser = authMongoose.authenticateUser(userRoute);
var userGetRole      = authMongoose.userGetRole(roleRoute);
var roleHasPrivilege = authMongoose.roleHasPrivilege(privRoute);

sinon.stub(userRoute, 'routeFrom');
sinon.stub(roleRoute, 'routeFrom');
sinon.stub(privRoute, 'routeFrom');

describe('authRbacMongoose', function() {
	describe('authenticateUser', function() {
		beforeEach(function() {
			userRoute.routeFrom.reset();
		});

		it('uses userRoute to get user info from given credentials', function() {
			userRoute.routeFrom.callsArgWith(1, null, 'user-info');
			authenticateUser('cred-info', function(err, userInfo) {
				expect(err).to.not.exist;
				expect(userInfo).to.equal('user-info');
			});
			expect(userRoute.routeFrom).to.have.been.calledWith('cred-info');
		});

		it('propagates userRoute errors', function() {
			userRoute.routeFrom.callsArgWith(1, new Error);
			authenticateUser('cred-info', function(err, userInfo) {
				expect(err).to.exist;
				expect(userInfo).to.not.exist;
			});
			expect(userRoute.routeFrom).to.have.been.calledWith('cred-info');
		});
	});

	describe('userGetRole', function() {
		beforeEach(function() {
			roleRoute.routeFrom.reset();
		});

		it('uses roleRoute to get role info from user info', function() {
			roleRoute.routeFrom.callsArgWith(1, null, 'role-info');
			userGetRole('user-info', function(err, roleInfo) {
				expect(err).to.not.exist;
				expect(roleInfo).to.equal('role-info');
			});
			expect(roleRoute.routeFrom).to.have.been.calledWith('user-info');
		});

		it('propagates roleRoute errors', function() {
			roleRoute.routeFrom.callsArgWith(1, new Error);
			userGetRole('user-info', function(err, roleInfo) {
				expect(err).to.exist;
				expect(roleInfo).to.not.exist;
			});
			expect(roleRoute.routeFrom).to.have.been.calledWith('user-info');
		});
	});

	describe('roleHasPrivilege', function() {
		beforeEach(function() {
			privRoute.routeFrom.reset();
		});

		it('uses privRoute to check if role has privilege', function() {
			privRoute.routeFrom.callsArgWith(1, null, ['priv-name']);
			roleHasPrivilege('role-info', 'priv-name', function(err, hasPriv) {
				expect(err).to.not.exist;
				expect(hasPriv).to.be.true;
			});
			expect(privRoute.routeFrom).to.have.been.calledWith('role-info');
		});

		it('propagates privRoute errors', function() {
			privRoute.routeFrom.callsArgWith(1, new Error);
			roleHasPrivilege('role-info', 'priv-name', function(err, hasPriv) {
				expect(err).to.exist;
				expect(hasPriv).to.not.exist;
			});
			expect(privRoute.routeFrom).to.have.been.calledWith('role-info');
		});
	});
});

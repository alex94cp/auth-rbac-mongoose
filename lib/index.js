var authRbac = require('auth-rbac');
var Route = require('./route');

function authenticateUser(userRoute) {
	return function(creds, cb) {
		userRoute.routeFrom(creds, cb);
	};
}

function userGetRole(roleRoute) {
	return function(user, cb) {
		roleRoute.routeFrom(user, cb);
	};
}

function roleHasPrivilege(privRoute) {
	return function(role, priv, cb) {
		privRoute.checkRoute(role, priv, cb);
	};
}

function authRbacMongoose(userRoute, roleRoute, privRoute) {
	return authRbac({
		authenticateUser: authenticateUser(userRoute),
		userGetRole: userGetRole(roleRoute),
		roleHasPrivilege: roleHasPrivilege(privRoute),
	});
}

module.exports = exports = authRbacMongoose;
exports.Route = Route;

var authRbac = require('auth-rbac');
var authMongoose = require('./mongoose');
var Route = require('./route');

function authRbacMongoose(userRoute, roleRoute, privRoute) {
	return authRbac.backend({
		authenticateUser: authMongoose.authenticateUser(userRoute),
		userGetRole:      authMongoose.userGetRole(roleRoute),
		roleHasPrivilege: authMongoose.roleHasPrivilege(privRoute),
	});
}

module.exports = exports = authRbacMongoose;
exports.Route = Route;

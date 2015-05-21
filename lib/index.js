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
	return function(role, requiredPriv, cb) {
		privRoute.routeFrom(role, function(err, privs) {
			if (err)
				return cb(err);
			for (var i = 0; i < privs.length; ++i)
				if (privs[i] === requiredPriv)
					return cb(null, true);
			return cb(null, false);
		});
	};
}

function authRbacMongoose(userRoute, roleRoute, privRoute) {
	return {
		authenticateUser: authenticateUser(userRoute),
		userGetRole: userGetRole(roleRoute),
		roleHasPrivilege: roleHasPrivilege(privRoute),
	};
}

module.exports = exports = authRbacMongoose;
exports.Route = Route;

exports.authenticateUser = function(userRoute) {
	return function(creds, cb) {
		userRoute.routeFrom(creds, cb);
	};
};

exports.userGetRole = function(roleRoute) {
	return function(user, cb) {
		roleRoute.routeFrom(user, cb);
	};
};

exports.roleHasPrivilege = function(privRoute) {
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
};

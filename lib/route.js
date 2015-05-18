function Route(type, parent) {
	this._dstType = type;
	this._parent = parent;
	this._srcType = parent ? parent._dstType : type;
	this._route = function(err, value, cb) {
		if (err)
			return cb(err);
		return cb(null, value);
	};
}

Route.newFrom = function(fromRoute) {
	return new Route(fromRoute._dstType);
};

Route.prototype.gives = function(type) {
	this._dstType = type;
	return this;
};

Route.prototype.field = function(fieldName) {
	var route = new Route(this._dstType, this);
	route._route = function(err, value, cb) {
		if (err)
			return cb(err);
		if (value == null)
			return cb(null, null);
		return cb(null, value[fieldName]);
	};
	return route;
};

Route.prototype.linkedWith = function(fieldName) {
	var route = new Route(this._dstType, this);
	route._route = function(err, value, cb) {
		if (err)
			return cb(err);
		if (value == null)
			return cb(null, null);
		var condition = {};
		condition[fieldName] = value;
		return route._dstType instanceof Array
		         ? route._dstType[0].find(condition, cb)
		         : route._dstType.findOne(condition, cb);
	};
	return route;
};

Object.defineProperty(Route.prototype, 'dbRef', {
	get: function() {
		var route = new Route(this._dstType, this);
		route._route = function(err, value, cb) {
			if (err)
				return cb(err);
			if (value == null)
				return cb(null, null);
			return route._dstType.findById(value, cb);
		};
		return route;
	}
});

Route.prototype.routeFrom = function(fromValue, cb) {
	if (!this._parent)
		return this._route(null, fromValue, cb);
	var self = this;
	return this._parent.routeFrom(fromValue, function(err, value) {
		if (err)
			return cb(err);
		return self._route(null, value, cb);
	});
};

Route.prototype.checkRoute = function(fromValue, toValue, cb) {
	return this.routeFrom(fromValue, function(err, value) {
		if (err)
			return cb(err);
		if (value instanceof Array)
			return cb(null, value.indexOf(toValue) != -1);
		else
			return cb(null, value === toValue);
	});
};

module.exports = Route;

function Route(type, parent) {
	this._dstType = type;
	this._parent = parent;
	this._srcType = parent ? parent._dstType : type;
	this._saved = parent ? parent._saved : {};
	this._route = function(err, value, cb) {
		if (err)
			return cb(err);
		return cb(null, value);
	};
}

Route.newFrom = function(fromRoute) {
	var route = new Route(fromRoute._dstType);
	route._saved = fromRoute._saved;
	return route;
};

Route.prototype.gives = function(type) {
	this._dstType = type;
	return this;
};

function splitFieldPath(path) {
	path = path.replace(/\[([0-9]+)\]/, '.$1');
	return path.split('.');
}

Route.prototype.field = function(path) {
	var route = new Route(this._dstType, this);
	route._route = function(err, value, cb) {
		if (err)
			return cb(err);
		if (value == null)
			return cb(null, null);
		var fields = splitFieldPath(path);
		for (var i = 0; i < fields.length; ++i)
			if (!(value = value[fields[i]]))
				break;
		return cb(null, value);
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
		return Array.isArray(route._dstType)
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

Route.prototype.saveAs = function(name) {
	var route = new Route(this._dstType, this);
	route._route = function(err, value, cb) {
		if (err)
			return cb(err);
		route._saved[name] = value;
		return cb(null, value);
	};
	return route;
};

Route.prototype.assert = function(condCallback) {
	var route = new Route(this._dstType, this);
	var restArgs = Array.prototype.slice.call(arguments, 1);
	route._route = function(err, value, cb) {
		if (err)
			return cb(err);
		if (value == null)
			return cb(null, null);
		condCallback(value, this._saved, function(err, checkPassed) {
			if (err)
				return cb(err);
			return cb(null, checkPassed ? value : null);
		});
	};
	return route;
};

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
		if (Array.isArray(value))
			return cb(null, value.indexOf(toValue) != -1);
		else
			return cb(null, value === toValue);
	});
};

module.exports = Route;

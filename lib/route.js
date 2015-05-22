function Route(type, parent) {
	this._output = type;
	this._parent = parent;
	this.input = parent ? parent._output : type;
	this._saved = parent ? parent._saved : {};
	this._route = function(err, value, cb) {
		if (err)
			return cb(err);
		return cb(null, value);
	};
}

Route.newFrom = function(fromRoute) {
	var route = new Route(fromRoute._output);
	route._saved = fromRoute._saved;
	return route;
};

Route.prototype.gives = function(what) {
	this._output = what;
	return this;
};

Route.prototype.filter = function(filterCallback) {
	var route = new Route(this._output, this);
	route._route = function(err, value, cb) {
		if (err)
			return cb(err);
		if (value == null)
			return cb(null, null);
		var params = { value: value, saved: this._saved };
		return filterCallback(params, cb);
	};
	return route;
};

Route.prototype.saveAs = function(name) {
	var route = this.filter(function(params, cb) {
		var value = params.value;
		route._saved[name] = value;
		return cb(null, value);
	});
	return route;
};

Route.prototype.assert = function(condCallback) {
	return this.filter(function(params, cb) {
		var value = params.value;
		return condCallback(params, function(err, checkPassed) {
			if (err)
				return cb(err);
			return cb(null, checkPassed ? value : null);
		})
	});
};

function splitFieldPath(path) {
	return path.split(/\.|\[([^\]]+)\]/).filter(function(x) { return !!x; });
}

function getFieldType(type, field) {
	if (type.prototype.constructor.name == 'model') {
		return type.schema.paths[field]; // model
	} else {
		return type[field]; // schema
	}
}

function fieldPathType(path, type) {
	var fields = splitFieldPath(path);
	while (type != null && fields.length > 0) {
		var f = fields.shift();
		var index = parseInt(f, 10);
		type = isNaN(index) ? getFieldType(type, f) : type[0];
	}
	return type;
}

Route.prototype.field = function(path) {
	var output = fieldPathType(path);
	var route = this.filter(function(params, cb) {
		var value = params.value;
		var fields = splitFieldPath(path);
		while (value != null && fields.length > 0)
			value = value[fields.shift()];
		return cb(null, value);
	});
	return route.gives(output);
};

Route.prototype.linkedWith = function(fieldName) {
	var route = this.filter(function(params, cb) {
		var value = params.value;
		var condition = {};
		condition[fieldName] = value;
		return Array.isArray(route._output)
		         ? route._output[0].find(condition, cb)
		         : route._output.findOne(condition, cb);
	});
	return route.gives(null);
};

Object.defineProperty(Route.prototype, 'dbRef', {
	get: function() {
		var route = this.filter(function(params, cb) {
			var value = params.value;
			return route._output.findById(value, cb);
		});
		return route.gives(null);
	}
});

Route.prototype.routeFrom = function(fromValue, cb) {
	if (this._parent == null)
		return this._route(null, fromValue, cb);
	var self = this;
	return this._parent.routeFrom(fromValue, function(err, value) {
		if (err)
			return cb(err);
		return self._route(null, value, cb);
	});
};

module.exports = Route;

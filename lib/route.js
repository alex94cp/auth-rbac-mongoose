function Route(model) {
	this._fromModel = this._toModel = model;
}

Route.newFrom = function(fromRoute) {
	var route = new Route(fromRoute._toModel);
	return route;
}

function relField(route, fromValue, cb) {
	return cb(null, fromValue[route._fieldName]);
}

Route.prototype.field = function(field) {
	this._relFn = relField;
	this._fieldName = field;
	return this;
};

function relDbRef(route, fromValue, cb) {
	return route._toModel.findById(fromValue[route._fieldName], cb);
};

Object.defineProperty(Route.prototype, 'dbRef', {
	get: function() {
		this._relFn = relDbRef;
		return this;
	}
});

function relLinkWith(route, fromValue, cb) {
	var findBy = {};
	var fieldName = route._fieldName;
	var linkWithField = route._linkWithField;
	findBy[linkWithField] = fromValue[fieldName];
	var destType = route._toModel;
	if (destType instanceof Array)
		return destType[0].find(findBy, cb);
	else
		return destType.findOne(findBy, cb);
}

Route.prototype.linkWith = function(field) {
	this._relFn = relLinkWith;
	this._linkWithField = field;
	return this;
};

Route.prototype.gives = function(what) {
	this._toModel = what;
	return this;
};

Route.prototype.routeFrom = function(fromValue, cb) {
	return this._relFn(this, fromValue, cb);
};

Route.prototype.checkRoute = function(fromValue, toValue, cb) {
	return this.routeFrom(fromValue, function(err, destValue) {
		if (err)
			return cb(err);
		if (toValue instanceof Array)
			return cb(null, destValue.indexOf(toValue) !== -1);
		else
			return cb(null, destValue === toValue);
	});
};

module.exports = Route;

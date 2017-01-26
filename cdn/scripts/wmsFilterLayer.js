/*jslint plusplus: true */
/*jslint nomen: true */
define(["dojo/request/iframe", "dojo/_base/lang", "dojo/Deferred", "dojo/on", "dojo/_base/declare", "esri/layers/DynamicMapServiceLayer"], function(iframe, lang, Deferred, on, declare, DynamicMapServiceLayer) {
	return declare("jrc/wmsFilterLayer", [DynamicMapServiceLayer], {
		constructor : function(wms_endpoint, layer) {
			this.wms_endpoint = wms_endpoint;
			this.layer = layer;
			this.loaded = true;
			this.onLoad(this);
			on(this, "update-start", lang.hitch(this, function() {
				this.deferred = new Deferred();
				return this.deferred;
			}));
			on(this, "update-end", lang.hitch(this, function() {
				this.deferred.resolve();
			}));
		},
		cql_filter : "",
		crs : "",
		method : "GET",
		getImageUrl : function(extent, width, height, callback) {
			var crs = this.crs;
			if (this.crs === "") {
				crs = "EPSG:" + extent.spatialReference.wkid;
			};
			var params = {
				CQL_FILTER : this.cql_filter,
				TRANSPARENT : true,
				CRS : crs,
				LAYERS : this.layer,
				FORMAT : "image/png",
				SERVICE : "WMS",
				VERSION : "1.1.1",
				REQUEST : "GetMap",
				STYLES : "",
				BBOX : extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax,
				WIDTH : width,
				HEIGHT : height
			};
			if (this.method === 'GET') {
				callback(this.wms_endpoint + dojo.objectToQuery(params));
			} else { //currently not working
				iframe.post(this.wms_endpoint, {
					data : params
				}).then(function(url) {
					callback(url);
				});
			};
		}
	});
});

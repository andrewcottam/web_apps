dojo.provide("jrc.ESpeciesDynamicMapServiceLayer");
dojo.addOnLoad(function() {
	dojo.declare("jrc.ESpeciesDynamicMapServiceLayer", esri.layers.DynamicMapServiceLayer, {
		"-chains-" : {
			constructor : "manual"
		},
		constructor : function(options) {
			this.inherited(arguments, ["http://ehabitat-wps.jrc.ec.europa.eu", options]);
			for(var n in options) {
				this[n] = options[n];
			}
			this.loaded = true;
			this.onLoad(this);
		},
		getImageUrl : function(extent, width, height, callback) {
			var params = {
				request : "GetMap",
				transparent : true,
				format : "image/png",
				bgcolor : "ffffff",
				version : "1.1.1",
				layers : "0,1",
				styles : "default,default",
				exceptions : "application/vnd.ogc.se_xml",
				bbox : extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax,
				srs : "EPSG:" + extent.spatialReference.wkid,
				width : width,
				height : height,
				product : this.product,
				typeid : this.typeid,
				objid : this.objid
			};
			var instance = this;
			dojo.io.script.get({
				url : "../cgi-bin/eSpecies/WMSServer?" + dojo.objectToQuery(params),
				callbackParamName : "jsoncallback", //this is set on the eSpecies utilities createimage method
				load : function(response) {
					callback(response.url);
					instance.palette = response.palette;
					instance.uniqueValues = response.uniqueValues;
				},
				error : function(error) {
					console.log("error" + error);
				}
			});
		}
	});
});

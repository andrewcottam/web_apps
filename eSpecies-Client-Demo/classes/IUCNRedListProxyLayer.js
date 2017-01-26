dojo.provide("jrc.IUCNRedListProxyLayer");
dojo.addOnLoad(function() {
	dojo.declare("jrc.IUCNRedListProxyLayer", esri.layers.DynamicMapServiceLayer, {
		"-chains-" : {
			constructor : "manual"
		},
		constructor : function(options) {
			this.inherited(arguments, ["http://ehabitat-wps.jrc.ec.europa.eu", options]);
			for (var n in options) {
				this[n] = options[n];
			}
			this.loaded = true;
			this.onLoad(this);
		},
		getImageUrl : function(extent, width, height, callback) {
			if (document.domain == 'h03-dev-vm7') {
				token = "5vr40gu7lnUa8jEE5hqu3NqjvgkiaIj52y7qNLER7cLmp1ssszDnPSliWgYRpe_5BSzqgrj5XWWLFe0gL-G54g..";
				//this is the token for my machine and I got it using the IP Request option in the Generate Token page 
				//token for ip: 139.191.147.167 (ehabitat-wps.jrc.ec.europa.eu) - seems to use this when going out from the python proxy
			} else {
				token = "5vr40gu7lnUa8jEE5hqu3NqjvgkiaIj52y7qNLER7cLmp1ssszDnPSliWgYRpe_5BSzqgrj5XWWLFe0gL-G54g..";
				//this is the token for my machine and I got it using the IP Request option in the Generate Token page 
				//token for HTTP referer: ehabitat-wps.jrc.ec.europa.eu
			}
			var params = {
				token : token,
				dpi : 96,
				transparent : true, 
				format : "png8", 
				layers: "show:0",
				bbox : extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax,
				bboxSR : 102100,
				imageSR : 102100,
				size : "950,950",
				layerDefs : "0:ID_NO=17975",
				f : "image"
			};
			callback("../cgi-bin/eSpecies/species/iucnrangemap/" + dojo.objectToQuery(params));
		}
	});
});

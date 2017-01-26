define(["dojo/_base/declare", "esri/arcgis/utils", "dojo/Evented", "dojo/_base/lang"], function(declare, arcgisUtils, Evented, lang) {
	return declare([Evented], {
		constructor : function(limit) {
			this.limit = limit;
		},
		getImagesForBBox : function(minx, miny, maxx, maxy, size) {
			//size can be original, medium (default value), small, thumbnail, square, mini_square
			this.requestPromise = esri.request({
				url : "http://www.panoramio.com/map/get_panoramas.php",
				content : {
					set : "public",
					from : "0",
					to : this.limit,
					minx : minx,
					miny : miny,
					maxx : maxx,
					maxy : maxy,
					size : size,
					mapfilter : "true"
				},
				handleAs : "json",
				callbackParamName : "callback"
			});
			this.requestPromise.then(lang.hitch(this, function(response) {
				this.photos = response.photos;
				this.emit("imagesLoaded");
			}));
		}
	});
});

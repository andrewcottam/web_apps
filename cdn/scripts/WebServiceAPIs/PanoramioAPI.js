define(["dojo/_base/declare", "dojo/Evented", "dojo/_base/lang", "dojo/request/script"], function(declare, Evented, lang, script) {
	return declare([Evented], {
		constructor : function(limit) {
			this.limit = limit;
		},
		getImagesForBBox : function(minx, miny, maxx, maxy, size) {
			script.get("http://www.panoramio.com/map/get_panoramas.php", {
				query : {
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
				jsonp : "callback"
			}).then(lang.hitch(this, function(response) {
				this.photos = response.photos;
				this.emit("imagesLoaded");
			}));
		}
	});
});

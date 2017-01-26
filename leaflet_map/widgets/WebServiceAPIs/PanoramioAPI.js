define(["dojo/_base/array", "dojo/_base/declare", "dojo/Evented", "dojo/_base/lang", "dojo/request/script"], function(array, declare, Evented, lang, script) {
	return declare([Evented], {
		constructor : function(photoViewer) {
			this.photoViewer = photoViewer;
			this.limit = 30;
			this.provider = "panoramio";
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
				array.forEach(this.photos,function(photo){
					lang.mixin(photo,{provider:"panoramio", photoSize:size});
				});
				this.emit("imagesLoaded");
			}));
		}
	});
});

//size parameters as follows:
//original
//medium 				 		500 maximum dimension
//small							240 maximum dimension
//thumbnail						100 maximum dimension
//square						60 x 60
//mini_square					32 x 32
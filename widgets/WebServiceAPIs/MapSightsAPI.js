define([ "dojo/_base/array", "dojo/_base/declare", "dojo/Evented", "dojo/_base/lang", "dojo/request/script" ], function(array, declare, Evented, lang, script) {
	// currently not working as MapSights API doesnt support the jsonp parameter so we cant make cross-domain calls
	return declare([ Evented ], {
		constructor : function(photoViewer) {
			this.photoViewer = photoViewer;
			this.limit = 30;
			this.provider = "mapsights";
		},
		getImagesForBBox : function(minx, miny, maxx, maxy, size) {
			// example call:
			// https://mapsights.com/get_photos?minlat=10.660607953624776&minlng=-223.59375000000003&maxlat=73.27735320192473&maxlng=223.41796875000003
			script.get("https://mapsights.com/get_photos", {
				query : {
					minlat : miny,
					minlng : minx,
					maxlat : maxy,
					maxlng : maxx,
				},
				jsonp : "callback",
			}).then(lang.hitch(this, function(response) {
				this.photos = response.photos;
				array.forEach(this.photos, function(photo) {
					lang.mixin(photo, {
						provider : "mapsights",
						photoSize : size
					});
				});
				this.emit("imagesLoaded");
			}));
			// request("https://mapsights.com/get_photos?", {
			// query : {
			// minlat : miny,
			// minlng : minx,
			// maxlat : maxy,
			// maxlng : maxx,
			// },
			// headers: {
			// "X-Requested-With": null
			// }
			// }).then(function(data){
			// console.log(data);
			// }, function(err){
			// console.log(err);
			// }, function(evt){
			// console.log(evt);
			// });
		},
	});
});
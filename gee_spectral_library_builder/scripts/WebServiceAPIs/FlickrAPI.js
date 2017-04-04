define(["dojo/_base/declare", "esri/arcgis/utils", "dojo/Evented", "dojo/_base/lang"], function(declare, arcgisUtils, Evented, lang) {
	return declare([Evented], {
		constructor : function(per_page) {
			this.per_page = per_page;
		},
		getImagesForBBox : function(minx, miny, maxx, maxy) {
			this.requestPromise = esri.request({
				url : "https://api.flickr.com/services/rest/",
				content : {
					method : 'flickr.photos.search',
					api_key : '6d3e521646cdd1391a6dee32d8e54d62',
					bbox : minx + ',' + miny + ',' + maxx + ',' + maxy,
					text: 'outdoor',
					format : 'json',
					per_page : this.per_page
				},
				handleAs : "json",
				callbackParamName : "jsoncallback"
			});
			this.requestPromise.then(lang.hitch(this, function(response) {
				this.photos = response.photos.photo;
				this.emit("imagesLoaded");
			}), lang.hitch(this, function(error) {
				console.log(error);
			}));
		},
		getPhotoInfo : function(photo_id) {
			this.requestPromise = esri.request({
				url : "https://api.flickr.com/services/rest/",
				content : {
					method : 'flickr.photos.getInfo',
					api_key : '6d3e521646cdd1391a6dee32d8e54d62',
					photo_id : photo_id,
					format : 'json'
				},
				handleAs : "json",
				callbackParamName : "jsoncallback"
			});
			this.requestPromise.then(lang.hitch(this, function(response) {
				this.photos = response.photo;
				this.emit("imageInfoLoaded", {
					info : response.photo
				});
			}), lang.hitch(this, function(error) {
				console.log(error);
			}));
		}
	});
});

define([ "dojo/promise/all", "dojo/_base/array", "dojo/_base/declare",		"dojo/request/script", "dojo/Evented", "dojo/_base/lang" ], function(		all, array, declare, script, Evented, lang) {
	return declare([ Evented ], {
		constructor : function(photoViewer) {
			this.photoViewer = photoViewer;
			this.per_page = 30;
			this.provider = "flickr";
		},
		// there is no size parameter in the flickr call
		getImagesForBBox : function(minx, miny, maxx, maxy) {
			var params = {
				method : 'flickr.photos.search',
				api_key : '6d3e521646cdd1391a6dee32d8e54d62',
				bbox : minx + ',' + miny + ',' + maxx + ',' + maxy,
				format : 'json',
				per_page : this.per_page,
				accuracy : 1
			};
			var promises = [];
			//make a call to get the photos with tags if required
			if (this.photoViewer.tags) {
				lang.mixin(params, {
					tags : this.photoViewer.tags.join(),
				});
				console.log("Flickr request for: " + params.tags);
				var promise1 = this.restRequest(params);
				promise1.then(lang.hitch(this, function(response) {
					this.tagPhotos = response.photos.photo;
				}));
				promises.push(promise1);
			}
			//make a call to get the photos with text if required
			if (this.photoViewer.text) {
				delete params.tags;
				lang.mixin(params, {
					text : this.photoViewer.text,
				});
				console.log("Flickr request for: " + params.text);
				var promise2 = this.restRequest(params);
				promise2.then(lang.hitch(this, function(response) {
					this.textPhotos = response.photos.photo;
				}));
				promises.push(promise2);
			}
			//when both calls have completed, merge the photo arrays together
			all(promises).then(lang.hitch(this, function(results) {
				this.photos = this.tagPhotos.concat(this.textPhotos);
				array.forEach(this.photos, function(photo) {
					lang.mixin(photo, {
						provider : "flickr"
					});
				});
				this.emit("imagesLoaded");
			}));
		},
		restRequest : function(params) {
			return script.get("https://api.flickr.com/services/rest/", {
				query : params,
				jsonp : "jsoncallback"
			});
		},
		getPhotoInfo : function(photo_id) {
			script.get("https://api.flickr.com/services/rest/", {
				query : {
					method : 'flickr.photos.getInfo',
					api_key : '6d3e521646cdd1391a6dee32d8e54d62',
					photo_id : photo_id,
					format : 'json'
				},
				jsonp : "jsoncallback"
			}).then(lang.hitch(this, function(response) {
				this.emit("imageInfoLoaded", {
					info : response.photo
				});
			}));
		}
	});
});
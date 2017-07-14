define(["dojo/promise/all", "dojo/_base/array", "dojo/_base/declare", "dojo/request/script", "dojo/Evented", "dojo/_base/lang"], function(all, array, declare, script, Evented, lang) {
	return declare([Evented], {
		constructor: function(photoViewer, accuracy) {
			this.photoViewer = photoViewer;
			this.per_page = 30;
			this.provider = "flickr";
			this.accuracy = accuracy; //user-specified accuracy for the flickr api - this relates to the location accuracy which is 1 by default (meaning world) - see https://www.flickr.com/services/api/flickr.photos.search.html
		},
		// there is no size parameter in the flickr call
		getImagesForBBox: function(minx, miny, maxx, maxy) {
			var params = {
				method: 'flickr.photos.search',
				api_key: '6d3e521646cdd1391a6dee32d8e54d62',
				bbox: minx + ',' + miny + ',' + maxx + ',' + maxy,
				format: 'json',
				per_page: this.per_page,
				accuracy: this.accuracy,
			};
			var promises = [];
			//make a call to get the photos with tags if required
			if (this.photoViewer.tags) {
				lang.mixin(params, {
					tags: this.photoViewer.tags.join(),
				});
				// console.log("Flickr request for: " + params.tags);
				var promise1 = this.restRequest(params);
				promise1.then(lang.hitch(this, function(response) {
					if (response.stat == 'fail') {
						this.restError(response);
					}
					else {
						this.tagPhotos = response.photos.photo;
						array.forEach(this.tagPhotos, function(photo) {
							lang.mixin(photo, {
								displayTagLogo: "block"
							});
						});
					}
				}));
				promises.push(promise1);
			}
			//make a call to get the photos with text if required
			if (this.photoViewer.text) {
				delete params.tags;
				lang.mixin(params, {
					text: this.photoViewer.text,
				});
				// console.log("Flickr request for: " + params.text);
				var promise2 = this.restRequest(params);
				promise2.then(lang.hitch(this, function(response) {
					if (response.stat == 'fail') {
						this.restError(response);
					}
					else {
						this.textPhotos = response.photos.photo;
						array.forEach(this.textPhotos, function(photo) {
							lang.mixin(photo, {
								displayTagLogo: "none"
							});
						});
					}
				}));
				promises.push(promise2);
			}
			//when both calls have completed, merge the photo arrays together
			all(promises).then(lang.hitch(this, function(results) {
				if (this.textPhotos) {
					if (this.tagPhotos) {
						this.photos = this.tagPhotos.concat(this.textPhotos);
					}
					else {
						this.photos = this.textPhotos;
					}
				}
				array.forEach(this.photos, function(photo) {
					lang.mixin(photo, {
						provider: "flickr"
					});
				});
				this.emit("imagesLoaded");
			}));
		},
		restError: function(response) {
			alert(response.message);
		},
		restRequest: function(params) {
			return script.get("https://api.flickr.com/services/rest/", {
				query: params,
				jsonp: "jsoncallback"
			});
		},
		getPhotoInfo: function(photo_id) {
			script.get("https://api.flickr.com/services/rest/", {
				query: {
					method: 'flickr.photos.getInfo',
					api_key: '6d3e521646cdd1391a6dee32d8e54d62',
					photo_id: photo_id,
					format: 'json'
				},
				jsonp: "jsoncallback"
			}).then(lang.hitch(this, function(response) {
				this.emit("imageInfoLoaded", {
					info: response.photo
				});
			}));
		}
	});
});

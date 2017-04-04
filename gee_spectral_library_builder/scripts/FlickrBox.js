define(["dojo/dom-style", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!templates/FlickrBox.html", "dojo/Evented", "esri/arcgis/utils", "dojo/_base/lang"], function(domStyle, declare, _WidgetBase, _TemplatedMixin, template, Evented, arcgisUtils, lang) {
	return declare([_WidgetBase, _TemplatedMixin, Evented], {
		templateString : template,
		photoDisplayTitle : String,
		dateTaken : "Unknown",
		_setDateTakenAttr : function(datetaken) {
			var datedisplay;
			domStyle.set(this.dateTakenNode, "display", "block");
			if (datetaken === "Unknown") {
				datedisplay = "Unknown";
			} else {
				datedisplay = datetaken.substring(8, 10) + "-" + datetaken.substring(5,7) + "-" + datetaken.substring(0, 4);
			}
			this.dateTakenNode.innerHTML = "Date: " + datedisplay;
			dateTaken = datetaken;
		},
		flickrLinkTitle : "Click to go to photo page",
		_setPhotoDisplayTitleAttr : function(value) {
			this.flickrLinkTitle = value;
			if (value == "") {
				value = this.photo.id;
			};
			if (value.length > 19) {
				value = value.substring(0, 17) + "..";
			};
			this.photoDisplayTitle = value;
		},
		postMixInProperties : function() {
			this.photo_url = "https://farm" + this.photo.farm + ".staticflickr.com/" + this.photo.server + "/" + this.photo.id + "_" + this.photo.secret + "_q.jpg";
			this.photoPageurl = "https://www.flickr.com/photos/" + this.photo.owner + "/" + this.photo.id;
			this.set("photoDisplayTitle", this.photo.title);
		},
		mouseEnterPhoto : function(evt) {
			this.requestPromise = esri.request({
				url : "https://api.flickr.com/services/rest/",
				content : {
					method : 'flickr.photos.geo.getLocation',
					api_key : '6d3e521646cdd1391a6dee32d8e54d62',
					format : 'json',
					photo_id : this.photo.id
				},
				handleAs : "json",
				callbackParamName : "jsoncallback"
			});
			this.requestPromise.then(lang.hitch(this, function(response) {
				this.emit("mouseEnterPhoto", {
					"type" : "Flickr",
					"latitude" : response.photo.location.latitude,
					"longitude" : response.photo.location.longitude
				});
			}));
		},
		mouseLeavePhoto : function(evt) {
			this.emit("mouseLeavePhoto");
		}
	});
});

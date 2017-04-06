define(["dojo/_base/array", "dojo/on", "./WebServiceAPIs/FlickrAPI", "dojo/dom-style", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./templates/PhotoBoxFlickr.html", "dojo/Evented", "dojo/_base/lang"], function(array, on, FlickrAPI, domStyle, declare, _WidgetBase, _TemplatedMixin, template, Evented, lang) {
	return declare([_WidgetBase, _TemplatedMixin, Evented], {
		templateString : template,
		photoDisplayTitle : String,
		displayTitle: "block",
		dateTaken : "Unknown",
		maxWidth : "100px",
		_setDateTakenAttr : function(datetaken) {
			var datedisplay;
			if (datetaken === "Unknown") {
				datedisplay = "Unknown";
			} else {
				datedisplay = datetaken.substring(8, 10) + "-" + datetaken.substring(5,7) + "-" + datetaken.substring(0, 4);
				domStyle.set(this.dateTakenNode, "display", "block");
			}
			this.dateTakenNode.innerHTML = "Date: " + datedisplay;
			this.dateTaken = datetaken;
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
			var sizeSuffix;
			switch (this.photoSize){
				case "mini_square":
					sizeSuffix = "s"; //needs to be scaled from 75x75 to 32x32
					this.maxWidth = "32px";
					break;
				case "square":
					sizeSuffix = "s"; //needs to be scaled from 75x75 to 60x60 
					this.maxWidth = "60px";
					break;
				case "thumbnail": 
					sizeSuffix = "t"; //same size
					this.maxWidth = "100px";
					break;
				case "small":
					sizeSuffix = "m"; //same size
					this.maxWidth = "240px";
					break;
				case "medium":
					sizeSuffix = "-"; //same size
					this.maxWidth = "500px";
					break;
				case "original":
					sizeSuffix = "o";
					this.maxWidth = "2048px";
					break;
			};
			this.photo_url = "https://farm" + this.photo.farm + ".staticflickr.com/" + this.photo.server + "/" + this.photo.id + "_" + this.photo.secret + "_" + sizeSuffix + ".jpg";
			this.photoPageurl = "https://www.flickr.com/photos/" + this.photo.owner + "/" + this.photo.id;
			if (array.indexOf(["small","medium","original",], this.photoSize) > -1){
				this.set("photoDisplayTitle", this.photo.title);
			}else{ //if the images are thumbnails then dont display the title 
				this.displayTitle = "none";
			};
		},
		mouseEnterPhoto : function(evt) {
			this.mouseAbove = true;
			var flickrapi = new FlickrAPI(null);
			on(flickrapi, "imageInfoLoaded", lang.hitch(this, function(response){
				this.emit("mouseEnterPhoto", {
					"type" : "Flickr",
					"latitude" : response.info.location.latitude,
					"longitude" : response.info.location.longitude,
					"target" : this
				});
			}));
			flickrapi.getPhotoInfo(this.photo.id);
		},
		mouseLeavePhoto : function(evt) {
			this.emit("mouseLeavePhoto");
			this.mouseAbove = false;
		}
	});
});

//size parameters as follows:
//s	small square 75x75
//q	large square 150x150
//t	thumbnail, 100 on longest side
//m	small, 240 on longest side
//n	small, 320 on longest side
//-	medium, 500 on longest side
//z	medium 640, 640 on longest side
//c	medium 800, 800 on longest side†
//b	large, 1024 on longest side*
//h	large 1600, 1600 on longest side†
//k	large 2048, 2048 on longest side†
//o	original image, either a jpg, gif or png, depending on source format

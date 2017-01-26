define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./templates/PhotoBoxPanoramio.html", "dojo/Evented"], function(declare, _WidgetBase, _TemplatedMixin, template, Evented) {
	return declare([_WidgetBase, _TemplatedMixin, Evented], {
		templateString : template,
		photoDisplayTitle : String,
		displayTitle: "block",
		provider: "panoramio",
		linkTitle : "Click to go to photo page",
		_setPhotoDisplayTitleAttr : function(value) {
			if (value==""){
				value= this.photo.photo_id;
			};
			if (value.length > 32) {
				this.linkTitle = value + "\n" + this.linkTitle;
				value = value.substring(0, 30) + "..";
			};
			this.photoDisplayTitle = value;
		},
		postMixInProperties : function() {
			this.original_photo_url = "http://static.panoramio.com/photos/original/" + this.photo.photo_id + ".jpg";
			this.photo_file_url = this.photo.photo_file_url;
			if (this.photo.width == 240){
				this.set("photoDisplayTitle", this.photo.photo_title);
			}else{ //if the images are thumbnails then dont display the title 
				this.displayTitle = "none";
			};
		},
		mouseEnterPhoto : function(evt) {
			this.emit("mouseEnterPhoto", {
				"type":"Panoramio",
				"latitude" : this.photo.latitude,
				"longitude" : this.photo.longitude,
				"target" : this
			});
		},
		mouseLeavePhoto : function(evt) {
			this.emit("mouseLeavePhoto");
		}
	});
});




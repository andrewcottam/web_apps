define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./templates/PanoramioBox.html", "dojo/Evented"], function(declare, _WidgetBase, _TemplatedMixin, template, Evented) {
	return declare([_WidgetBase, _TemplatedMixin, Evented], {
		templateString : template,
		photoDisplayTitle : String,
		displayTitle: "block",
		panoramioLinkTitle : "Click to go to photo page",
		_setPhotoDisplayTitleAttr : function(value) {
			if (value==""){
				value= this.photo.photo_id;
			};
			if (value.length > 32) {
				this.panoramioLinkTitle = value + "\n" + this.panoramioLinkTitle;
				value = value.substring(0, 30) + "..";
			};
			this.photoDisplayTitle = value;
		},
		postMixInProperties : function() {
			if (this.photo.width==240){
				this.set("photoDisplayTitle", this.photo.photo_title);
			}else{ //if the images are thumbnails then dont display the title 
				this.displayTitle = "none";
			}
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

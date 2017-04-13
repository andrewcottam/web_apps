define(["dojo/dom-construct", "dojo/dom-style", "dojo/request/script", "dojo/_base/lang", "dojo/Deferred", "dojo/dom-geometry", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!attractive_species_gallery/templates/SimpleSpeciesBox.html"], function(domConstruct, domStyle, script, lang, Deferred, domGeom, declare, _WidgetBase, _TemplatedMixin, template) {
	return declare([_WidgetBase, _TemplatedMixin], {
		templateString : template,
		constructor : function(args) {
			declare.safeMixin(this, args);
			this.imageLoaded = false;
		},
		startup : function() {
			this.isInViewport();
		},
		isInViewport : function() {
			(domGeom.position(this.domNode).y < document.documentElement.clientHeight) ? this.set("getImage", true) : this.set("getImage", false);
		},
		getImage : false,
		_setGetImageAttr : function(value) {
			this.getImage = value;
			if (value && !this.imageLoaded) {
				this.getFlickrImage();
			};
		},
		flickrPromise : Deferred,
		getFlickrImage : function() {
			this.set("flickrImgUrl", "./images/loading.gif");
			this.imageLoaded = true;
			this.flickrPromise = script.get("https://api.flickr.com/services/rest/", {
				query : {
					format : 'json',
					method : 'flickr.photos.search',
					text : this.searchterm,
					api_key : '6d3e521646cdd1391a6dee32d8e54d62',
					per_page : '1'
				},
				jsonp : "jsoncallback",
				timeout : 10000
			});
			this.flickrPromise.then(lang.hitch(this, function(response) {
				if (response.photos.photo.length > 0) {
					var f = response.photos.photo[0];
					this.set("flickrImgUrl", "https://farm" + f["farm"] + ".staticflickr.com/" + f["server"] + "/" + f["id"] + "_" + f["secret"] + "_q.jpg");
					this.set("flickrLink", "https://www.flickr.com/photos/" + f["owner"] + "/" + f["id"]);
				} else {
					if (response.photos.total === null) {
						console.log("The Flickr Image Search API is currently down");
					};
					if (this.taxon=='Panthera leo'){ //this is a hack just to give an error message in the UI to let people know flickr is down
						alert('The Flickr Image Search API is currently down');
					};
					domConstruct.destroy(this.flickrImgNode);
				};
				this.emit("imageRetrieved", this);
			}), lang.hitch(this, function(err) {
				this.imageLoaded = false;
				this.set("flickrImgUrl", "images/caution.png");
				this.flickrLinkNode.title = "Timeout error getting image from Flickr";
				console.log("Timeout getting Flickr image for species " + this.taxon);
			}));
		},
		flickr_image_count : 0,
		_setFlickr_image_countAttr : {
			node : "flickrImgCount",
			type : "innerHTML"
		},
		position : 0,
		_setPositionAttr : {
			node : "positionNode",
			type : "innerHTML"
		},
		flickrImgUrl : "",
		_setFlickrImgUrlAttr : {
			node : "flickrImgNode",
			type : "attribute",
			attribute : "src"
		},
		flickrLink : "",
		_setFlickrLinkAttr : {
			node : "flickrLinkNode",
			type : "attribute",
			attribute : "href"
		},
		species_same_as_genus : false,
		_setSpecies_same_as_genusAttr : function(value) {
			if (value) {
				domStyle.set(this.warningImgNode, "display", "inline-block");
				if (this.commonname) {
					this.warningImgNode.title = 'The number of images is based on a search for "' + this.taxon + '" + "' + this.commonname + '"';
					this.searchterm = this.taxon + " " + this.commonname;
				} else {
					this.warningImgNode.title = 'The number of images is based on a search for "' + this.taxon + '"';
					this.searchterm = this.taxon;
				}
			} else {
				domStyle.set(this.warningImgNode, "display", "none");
				this.searchterm = this.taxon;
			}
		},
		taxon : "",
		_setTaxonAttr : function(value) {
			l = value.toLowerCase().split(" ");
			this.taxon = value;
			this.set("species_same_as_genus", (l[0] == l[1]));
			if (value.length > 21) {
				this.binomialNode.title = value;
				value = value.substring(0, 19) + "..";
			};
			this.set("binomial_name", value);
		},
		binomial_name : "",
		_setBinomial_nameAttr : {
			node : "binomialNode",
			type : "innerHTML"
		},
		commonname : "",
		_setCommonnameAttr : function(value) {
			if (value == null) {
				value = "";
			};
			if (value.length > 20) {
				this.common_nameNode.title = value;
				value = value.substring(0, 18) + "..";
			};
			this.set("common_name_safe", value);
		},
		common_name_safe : "",
		_setCommon_name_safeAttr : {
			node : "common_nameNode",
			type : "innerHTML"
		},
		status : "",
		_setStatusAttr : function(value) {
			this.status = value;
			this.set("red_list_status_img_url", "images/" + value + ".png")
		},
		red_list_status_img_url : "",
		_setRed_list_status_img_urlAttr : {
			node : "red_list_statusImg",
			type : "attribute",
			attribute : "src"
		},
		uninitialize : function() {
			if ( typeof (this.flickrPromise) == 'object') {
				if (!this.flickrPromise.isFulfilled()) {
					this.flickrPromise.cancel('Species box destroyed', true);
				};
			};
		}
	});
});

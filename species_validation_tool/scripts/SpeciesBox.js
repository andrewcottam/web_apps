define(["dojo/dom-class", "dojo/promise/Promise", "dojo/date/stamp", "dojo/_base/window", "dojo/on", "dojo/dom-geometry", "dojo/dom-style", "dojo/dom-construct", "dojo/Stateful", "dojo/_base/array", "dojo/date/locale", "dojo/date", "dijit/Dialog", "dojo/aspect", "dojo/Deferred", "jrc/ConfirmDialog", "dojo/_base/lang", "dojo/Evented", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!species_validation_tool/templates/SpeciesBox.html", "dojo/request/script"], function(domClass, Promise, stamp, win, on, domGeom, domStyle, domConstruct, Stateful, arrayUtil, locale, date, Dialog, aspect, Deferred, ConfirmDialog, lang, Evented, declare, _WidgetBase, _TemplatedMixin, template, script) {
	return declare("jrc/SpeciesBox", [_WidgetBase, _TemplatedMixin, Evented, Stateful], {
		templateString : template,
		VALIDATION_MESSAGE : "Checked using the online species checker tool",
		constructor : function(args) {
			declare.safeMixin(this, args);
			this.imageLoaded = false;
			this.min_presence_id = 1;
			this.readOnly = true;
		},
		updateAttributes : function(attributes) {
			for (var key in attributes) {
				this.set(key, attributes[key]);
			};
			this.setTitle();
		},
		postCreate : function() {
			this.setTitle();
		},
		startup : function() {
			this.isInViewport();
			this.restServerUrl = "http://dopa-services.jrc.ec.europa.eu/services/ibex";
		},
		isInViewport : function() {
			(domGeom.position(this.domNode).y < document.documentElement.clientHeight) ? this.set("loadImage", true) : this.set("loadImage", false);
		},
		flickrPromise : Deferred,
		loadImage : false,
		_setLoadImageAttr : function(value) {
			if (value && !this.imageLoaded && this.showImages) {
				this.getFlickrImage();
			};
		},
		showImages : true,
		_setShowImagesAttr : function(value) {
			this.showImages = value;
			(value) ? this.set("imageHolderClass", "shown") : this.set("imageHolderClass", "notshown");
		},
		imageHolderClass : "shown",
		_setImageHolderClassAttr : {
			node : "checkImageHolder",
			type : "class"
		},
		min_presence_id : "1",
		_setMin_presence_idAttr : function(value) {
			this.min_presence_id = value;
			this.set("presence_id_class", "p" + value);
			this.set("presence_text", this.getPresenceText());
		},
		presence_id_class : "p1",
		_setPresence_id_classAttr : {
			node : "presenceBoxNode",
			type : "class"
		},
		presence_text : "",
		_setPresence_textAttr : {
			node : "presenceBoxNode",
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
			this.commonname = value;
			this.set("commonname_safe", value);
		},
		commonname_safe : "",
		_setCommonname_safeAttr : {
			node : "common_nameNode",
			type : "innerHTML"
		},
		taxon : "",
		_setTaxonAttr : function(value) {
			this.taxon = value;
			if (value.length > 22) {
				this.taxonNode.title = value;
				value = value.substring(0, 20) + "..";
			};
			this.set("binomial_name", value);
		},
		binomial_name : "",
		_setBinomial_nameAttr : {
			node : "taxonNode",
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
		validated : false,
		_setValidatedAttr : function(value) {
			this.validated = value;
			(value) ? this.set("checked", "checked") : this.set("checked", "unchecked");
		},
		validation_user : 0,
		checked : "checked",
		_setCheckedAttr : function(value) {
			this.checked = value;
			domClass.remove(this.checkedImgNode, "checked");
			domClass.remove(this.checkedImgNode, "unchecked");
			domClass.add(this.checkedImgNode, value);
			(!this.showIfChecked && value == 'checked') ? this.hide() : this.show();
			this.emit("validationChanged", {
				checked : value
			});
		},
		hide : function() {
			domStyle.set(this.domNode, "display", "none");
		},
		show : function() {
			domStyle.set(this.domNode, "display", "inline-block");
		},
		showIfChecked : true,
		_setShowIfCheckedAttr : function(value) {
			this.showIfChecked = value;
			this._setCheckedAttr(this.checked);
		},
		getFlickrImage : function() {
			this.set("flickrImgUrl", "./images/loading.gif");
			// console.log("Getting image for " + this.taxon)
			this.imageLoaded = true;
			this.flickrPromise = script.get("https://api.flickr.com/services/rest/", {
				query : {
					format : 'json',
					method : 'flickr.photos.search',
					text : this.taxon,
					api_key : '6d3e521646cdd1391a6dee32d8e54d62',
					per_page : '1'
				},
				jsonp : "jsoncallback",
				timeout : 10000
			});
			this.flickrPromise.then(lang.hitch(this, function(response) {
				if (response.photos === undefined) {
					if (response.stat === 'fail') {
						console.log("Flickr API error: " + response.message);
						alert("Flickr API error: " + response.message);
					}
				}
				if (response.photos.photo.length > 0) {
					var f = response.photos.photo[0];
					this.set("flickrImgUrl", "http://farm" + f["farm"] + ".staticflickr.com/" + f["server"] + "/" + f["id"] + "_" + f["secret"] + "_q.jpg");
					this.set("flickrLink", "http://www.flickr.com/photos/" + f["owner"] + "/" + f["id"]);
				} else {
					if (response.photos.total === null) {
						console.log("The Flickr Image Search API is currently down");
					};
					domConstruct.destroy(this.flickrImgNode);
				};
				this.emit("imageRetrieved", this);
			}), lang.hitch(this, function(err) {
				this.imageLoaded = false;
				this.set("flickrImgUrl", "http://ehabitat-wps.jrc.ec.europa.eu/eSpecies/images/caution.png");
				this.flickrLinkNode.title = "Timeout error getting image from Flickr";
				console.log("Timeout getting Flickr image for species " + this.taxon);
			}));
		},
		boxClicked : function(event) {
			if (this.readOnly) {
				alert('Please login to check species');
				return;
			};
			this.new_presence_id = this.getNewPresenceId();
			this.validateSpecies(false);
		},
		validateSpecies : function(update) {
			domStyle.set(document.body, "cursor", "wait");
			var method;
			this.new_validation_date = stamp.toISOString(new Date());
			(update) ? method = "_set_species_validator_update" : method = "_set_species_validator_check";
			return script.get(this.restServerUrl + "/especies/" + method, {
				query : {
					wdpa_id : this.wdpa_id,
					iucn_species_id : this.iucn_species_id,
					presence_id : this.new_presence_id,
					validation_user : this.current_user,
					validation_date : this.new_validation_date,
					validation_message : this.VALIDATION_MESSAGE
				},
				jsonp : "callback"
			}).then(lang.hitch(this, this.validateSpeciesReturned));
		},
		validateSpeciesReturned : function(response) {
			if (!response.metadata.success) {
				if (response.metadata.error.indexOf('duplicate key value violates unique constraint') > 0) {
					if (this.autoUpdate) {
						this.validateSpecies(true);
					} else {
						var MessageBox = {};
						MessageBox.confirm = function() {
							var confirmDialog = new ConfirmDialog({
								message : 'You have already validated this species - do you want to change your validation?'
							});
							confirmDialog.startup();
							var deferred = new Deferred();
							var signal, signals = [];
							var destroyDialog = function() {
								arrayUtil.forEach(signals, function(signal) {
									signal.remove();
								});
								delete signals;
								confirmDialog.destroyRecursive();
							}
							signal = aspect.after(confirmDialog, "onExecute", function() {
								destroyDialog();
								deferred.resolve('MessageBox.Yes');
							});
							signals.push(signal);
							signal = aspect.after(confirmDialog, "onCancel", function() {
								destroyDialog();
								deferred.reject('MessageBox.No');
							});
							signals.push(signal);
							confirmDialog.show();
							return deferred;
						};
						MessageBox.confirm().then(lang.hitch(this, function() {
							this.validateSpecies(true);
						}), lang.hitch(this, function() {
							console.log(this.taxon + " presence not changed from " + this.presence_text);
							domStyle.set(document.body, "cursor", "default");
							this.emit("validationUnSuccesful", this);
						}));
					};
				} else {
					alert(response.metadata.error);
					domStyle.set(document.body, "cursor", "default");
					console.log(response.metadata.error);
				};
			} else {
				(this.new_presence_id == this.min_presence_id) ? console.log(this.taxon + " checked") : console.log(this.taxon + " presence changed to " + this.presence_text);
				this.set("min_presence_id", this.new_presence_id);
				this.set("validation_date", this.new_validation_date);
				this.set("validation_user", this.current_user);
				this.set("validation_message", this.VALIDATION_MESSAGE);
				this.set("validated", true);
				this.emit("validationSuccesful", this);
				domStyle.set(document.body, "cursor", "default");
				this.setTitle();
			};
		},
		setTitle : function() {
			var dt = stamp.fromISOString(this.validation_date);
			if (this.checked == 'checked') {
				this.set("title", "Checked by: " + this.validation_user + " at " + locale.format(dt, {
					selector : "time",
					timePattern : "HH:mm:ss"
				}) + locale.format(dt, {
					selector : "date",
					datePattern : "' on ' d/M/yyyy"
				}));
			} else {
				this.set("title", "This species has not been checked");
			};
		},
		getNewPresenceId : function() {
			var retValue;
			if (this.checked == "unchecked") {
				return this.min_presence_id;
			}
			(this.min_presence_id < 6) ? retValue = this.min_presence_id + 1 : retValue = 0;
			return retValue;
		},
		getPresenceText : function() {
			switch(this.min_presence_id) {
				case 0:
					return 'Unknown';
				case 1:
					return 'Present';
				case 2:
					return 'Probably Present';
				case 3:
					return 'Possibly Present';
				case 4:
					return 'Possibly Extinct';
				case 5:
					return 'Extinct';
				case 6:
					return 'Presence Uncertain';
			};
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

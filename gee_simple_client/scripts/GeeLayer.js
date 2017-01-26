/*jslint plusplus: true */
/*jslint nomen: true */
define(["dojo/io-query", "dojo/Stateful", "dojo/dom-style", "dojo/on", "dojo/dom-construct", "dojo/_base/array", "dojo/_base/declare", "esri/layers/DynamicMapServiceLayer", "dojo/_base/lang", "dojo/request/script"], function(ioQuery, Stateful, domStyle, on, domConstruct, array, declare, DynamicMapServiceLayer, lang, script) {
	return declare("jrc/GeeLayer", [Stateful, DynamicMapServiceLayer], {
		constructor : function(url, options) {
			//options is a list of object properties that will be parsed and sent to the server if they have a value. All other object properties will be ignored.
			this.layerOptions = ['sceneid', 'redBand', 'greenBand', 'blueBand', 'min', 'max', 'detectExpression', 'hsv', 'startDate', 'endDate', 'collectionid', 'detectWater'];
			for (n in options) {
				this[n] = options[n];
			}
			this.servicesDomain = (document.domain === "ehabitat-wps.jrc.it") ? "http://geeimageserver.appspot.com/" : "http://geeimageserver.appspot.com/";
			//|| (document.domain === "127.0.0.1")
			this.loaded = true;
			this.onLoad(this);
		},
		sceneid : "",
		_sceneidSetter : function(value) {
			this.sceneid = value;
			this.refresh();
		},
		canvasVisible : false,
		detectColor : "none",
		_detectColorSetter : function(value) {
			this.detectColor = value;
			if (value === "none") {
				this.canvasVisible = false;
				this.hideCanvas();
			} else {
				this.canvasVisible = true;
				if (this.visible) {
					this.showCanvas();
					this.copyImageToCanvas();
				}
			}
		},
		_setMap : function(map, container) {
			this.inherited(arguments);
			this.canvas = domConstruct.create("canvas", {
				id : this.id + "_canvas",
				width : map.width + "px",
				height : map.height + "px;",
				style : "position: absolute; left: 0px; top: 0px; display: none"
			}, container);
			this.context = this.canvas.getContext('2d');
			on(this, "update-end", lang.hitch(this, this.copyImageToCanvas));
			on(map, "zoom-start", lang.hitch(this, function() {
				this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			}));
			on(map, "pan-start", lang.hitch(this, function() {
				this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			}));
			on(map, "resize", lang.hitch(this, function(event) {
				this.canvas.width = event.width;
				this.canvas.height = event.height;
				this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			}));
			on(map, "layers-add-result", lang.hitch(this, this.reorderDivs));
			on(this, "visibility-change", lang.hitch(this, this._visibilityChange));
			return this._div;
		},
		reorderDivs : function() {
			domConstruct.place(this.canvas, this._div, "after");
		},
		_visibilityChange : function(event) {
			console.log("visible " + event.visible);
			if (this.canvasVisible) {
				if (event.visible) {
					this.showCanvas();
				} else {
					this.hideCanvas();
				}
			}
		},
		hideCanvas : function() {
			domStyle.set(this.canvas, "display", "none");
		},
		showCanvas : function() {
			domStyle.set(this.canvas, "display", "block");
		},
		getImageUrl : function(extent, width, height, callback) {
			var params, layerParams = "{", val, paramsQuery;
			// console.log("getImageUrl (" + this.url + ")");
			if (this.suspended) {
				return;
			}
			//convert the javascript name/value pairs to Python values - these are parsed on the server
			array.forEach(this.layerOptions, lang.hitch(this, function(item) {
				switch (typeof(this[item])) {
					case "undefined":
						break;
					case "string":
						layerParams = layerParams + "\"" + item + "\":\"" + this[item] + "\",";
						break;
					case "boolean":
						val = (this[item]) ? "True" : "False";
						layerParams = layerParams + "\"" + item + "\":" + val + ",";
						break;
					default:
						layerParams = layerParams + "\"" + item + "\":" + this[item] + ",";
				}
			}));
			if (layerParams.length > 1) {
				layerParams = layerParams.substring(0, layerParams.length - 1) + "}";
			} else {
				layerParams = "";
			}
			params = {
				service : "WMS",
				request : "GetMap",
				format : "image/png",
				transparent : "false",
				styles : "",
				version : "1.1.1",
				layers : "LANDSAT/LC8_L1T_TOA",
				width : width,
				height : height,
				srs : "EPSG:" + extent.spatialReference.wkid,
				bbox : extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax
			};
			paramsQuery = ioQuery.objectToQuery(params);
			if (this.previousParamsQuery) {
				if (paramsQuery === this.previousParamsQuery) {
					domStyle.set(this._div, "display", "block");
					console.log('loading layer ' + this.url + ' from cache');
					this._updateEnd();
					//just make the layer visible again rather than re-requesting it from Google Earth Engine
					return;
				}
			}
			this.previousParamsQuery = paramsQuery;
			script.get(this.servicesDomain + "/ogc", {
				query : params,
				jsonp : "callback"
			}).then(lang.hitch(this, function(response) {
				if (this.canvas) {
					this._img_loading.crossOrigin = "Anonymous";
				}
				callback(response.url);
			}));
		},
		copyImageToCanvas : function(event) {
			if (!this._img) {
				return true;
			}
			this.context.globalCompositeOperation = "source-over";
			this.context.fillStyle = this.detectColor;
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
			this.context.globalCompositeOperation = "destination-in";
			this.context.drawImage(this._img, 0, 0);
		},
		getRGB : function(screenPoint) {
			return this.context.getImageData(screenPoint.x, screenPoint.y, 1, 1).data;
		},
		_updateEnd : function() {
			this.onUpdateEnd();
			this.updating = false;
			this._img_loading = null;
		}
	});
});

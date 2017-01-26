/*jslint plusplus: true */
/*jslint nomen: true */
define(["dojo/dom-style", "dojo/on", "dojo/dom-construct", "dojo/_base/declare", "esri/layers/layer", "dojo/_base/lang"], function(domStyle, on, domConstruct, declare, Layer, lang) {
	return declare("jrc/CanvasLayer", [Layer], {
		constructor : function(options) {
			this.inherited(arguments);
			this.loaded = true;
			this.onLoad(this);
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
			if (!this.context) {
				console.error("This browser does not support <canvas> elements.");
			}
			this._mapWidth = map.width;
			this._mapHeight = map.height;
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
			on(this, "visibility-change", this._visibilityChange);
			return this.canvas;
		},
		_visibilityChange : function(event) {
			console.log("visible " + event.visible);
			if (event.visible) {
				event.target.showCanvas();
			} else {
				event.target.hideCanvas();
			}
		},
		hideCanvas : function() {
			domStyle.set(this.canvas, "display", "none");
		},
		showCanvas : function() {
			domStyle.set(this.canvas, "display", "block");
		},
		highlightChange : function(layer) {
			console.log("highlightChange");
			this.hideCanvas();
			this.context.globalCompositeOperation = "source-over";
			this.context.fillStyle = "#FF0000";
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
			this.context.globalCompositeOperation = "destination-out";
			if (layer._img !== undefined) {
				this.context.drawImage(layer._img, 0, 0);
				on.once(layer, "update-end", lang.hitch(this, function() {
					console.log("highlightChange drawing canvas");
					this.context.globalCompositeOperation = "destination-in";
					this.context.drawImage(layer._img, 0, 0);
					this.showCanvas();
				}));
			};
		}
	});
});

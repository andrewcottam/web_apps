dojo.provide("jrc.OverlayLayer");
dojo.addOnLoad(function() {
	dojo.declare("jrc.OverlayLayer", esri.layers.Layer, {
		"-chains-" : {
			constructor : "before"
		},
		constructor : function(options) {
			for(var n in options) {
				this[n] = options[n];
			}
			this._connects = [];
			this.loaded = true;
			this.onLoad(this);
		},
		_setMap : function(map, container) {
			this._map = map;
			var element = this._element = dojo.create("canvas", {
				id : 'canvas',
				width : map.width + "px",
				height : map.height + "px",
				style : "position: absolute; left: 0px; top: 0px;"
			}, container);
			if(esri._isDefined(this.opacity)) {
				dojo.style(element, "opacity", this.opacity);
			}
			this._context = element.getContext("2d");
			if(!this._context) {
				console.error("This browser does not support <canvas> elements.");
			}
			this._mapWidth = map.width;
			this._mapHeight = map.height;
			this._connects.push(dojo.connect(map, "onPan", this, this._panHandler));
			this._connects.push(dojo.connect(map, "onExtentChange", this, this._extentChangeHandler));
			this._connects.push(dojo.connect(map, "onZoomStart", this, this.clear));
			this._connects.push(dojo.connect(map, "onMouseMove", this, this._mouseMove));
			this._connects.push(dojo.connect(this, "onVisibilityChange", this, this._visibilityChangeHandler));
			this._connects.push(dojo.connect(this, "onOpacityChange", this, this._opacityChangeHandler));
			return element;
		},
		_mouseMove : function(evt) {
			var sp = evt.screenPoint;
			if(this.getRedValue(sp.x, sp.y)) {
				if(this.mouseOverNonNullPixel) {
					return;
				} else {
					this.onMouseInPixels(evt);
					this.mouseOverNonNullPixel = true;
				}
			} else {
				if(!this.getBlueValue(sp.x, sp.y)) {
					if(this.mouseOverNonNullPixel) {
						this.onMouseOutPixels(evt);
						this.mouseOverNonNullPixel = false;
						return;
					}
				}
			}
		},
		_unsetMap : function(map, container) {
			dojo.forEach(this._connects, dojo.disconnect, dojo);
			if(this._element) {
				container.removeChild(this._element);
			}
			this._map = this._element = this._context = this._connects = this._img = null;
		},
		_panHandler : function(extent, delta) {
			this.clear();
			dojo.style(this._element, {
				left : delta.x + "px",
				top : delta.y + "px"
			});
		},
		_extentChangeHandler : function(extent, delta, levelChange, lod) {
			if(!levelChange) {
				dojo.style(this._element, {
					left : "0px",
					top : "0px"
				});
				this.clear();
			}
			this._draw();
		},
		setOpacity : function(o) {
			if(this.opacity != o) {
				this.onOpacityChange(this.opacity = o);
			}
		},
		onOpacityChange : function() {
		},
		refresh : function() {
			if(!this._canDraw()) {
				return;
			}
			this._draw();
		},
		clear : function() {
			if(!this._canDraw()) {
				return;
			}
			this._context.clearRect(0, 0, this._mapWidth, this._mapHeight);
		},
		_canDraw : function() {
			return (this._map && this._element && this._context) ? true : false;
		},
		_visibilityChangeHandler : function(visible) {
			if(visible) {
				esri.show(this._element);
			} else {
				esri.hide(this._element);
			}
		},
		_opacityChangeHandler : function(value) {
			dojo.style(this._element, "opacity", value);
		},
		addBaseEventHandlers : function(layer) {
			this._connects.push(dojo.connect(layer, "onUpdateStart", this, this._baseUpdateStart));
			this._connects.push(dojo.connect(layer, "onUpdateEnd", this, this._baseUpdateEnd));
		},
		addOverlayEventHandlers : function(layer) {
			this._connects.push(dojo.connect(layer, "onUpdateStart", this, this._overlayUpdateStart));
			this._connects.push(dojo.connect(layer, "onUpdateEnd", this, this._overlayUpdateEnd));
		},
		moveEventHandlers : function(fromLayer, toLayer) {
			toLayer.onUpdateStart = fromLayer.onUpdateStart;
			toLayer.onUpdateEnd = fromLayer.onUpdateEnd;
		},
		_draw : function() {
			if(this.baseLayer._img && this.overlayLayer._img) {
				if(this.baseLayer._img.src && this.overlayLayer._img.src) {
					this.clear();
					this._context.globalCompositeOperation = "source-over";
					this._context.drawImage(this.baseLayer._img, 0, 0);
					this._context.globalCompositeOperation = this.operator;
					this._context.drawImage(this.overlayLayer._img, 0, 0);
					this.onUpdateEnd();
				}
			}
		},
		_baseUpdateStart : function() {
			this.baseLayer._img = null;
			this.onUpdateStart();
		},
		_baseUpdateEnd : function() {
			this._draw();
		},
		_overlayUpdateStart : function() {
			this.overlayLayer._img = null;
			this.onUpdateStart();
		},
		_overlayUpdateEnd : function() {
			this.palette = this.overlayLayer.palette;
			this.uniqueValues = this.overlayLayer.uniqueValues;
			this._draw();
		},
		setBaseLayer : function(layer) {
			if(this.baseLayer) {
				this.moveEventHandlers(this.baseLayer, layer);
			} else {
				this.addBaseEventHandlers(layer);
			}
			this.baseLayer = layer;
			this.baseLayer.refresh();
		},
		setOverlayLayer : function(layer) {
			if(this.overlayLayer) {
				this.moveEventHandlers(this.overlayLayer, layer);
			} else {
				this.addOverlayEventHandlers(layer);
			}
			this.overlayLayer = layer;
			this.overlayLayer.refresh();
		},
		getRedValue : function(x, y) {
			if(!this._context)
				return;
			var I = this._context.getImageData(0, 0, this._context.canvas.width, this._context.canvas.height);
			var pixel_pos = (y * this._context.canvas.width + x) * 4;
			return I.data[pixel_pos];
		},
		getGreenValue : function(x, y) {
			if(!this._context)
				return;
			var I = this._context.getImageData(0, 0, this._context.canvas.width, this._context.canvas.height);
			var pixel_pos = ((y * this._context.canvas.width + x) * 4) + 1;
			return I.data[pixel_pos];
		},
		getBlueValue : function(x, y) {
			if(!this._context)
				return;
			var I = this._context.getImageData(0, 0, this._context.canvas.width, this._context.canvas.height);
			var pixel_pos = ((y * this._context.canvas.width + x) * 4) + 2;
			return I.data[pixel_pos];
		},
		getValue : function(x, y) {
			var redValue = this.getRedValue(x, y);
			if((!redValue) || (!this.palette))
				return;
			for(var i = 0; i < this.palette.length; i++) {
				if(this.overlayLayer.palette[i][0] == redValue) {
					return this.overlayLayer.uniqueValues[i];
				}
			}
		},
		getPixelCount : function() {
			return this._element.width * this._element.height;
		},
		getNonNullPixelCount : function() {
			if(!this._context)
				return;
			var count = 0;
			var w = this._element.width;
			var h = this._element.height;
			var I = this._context.getImageData(0, 0, w, h);
			for(var i = 0; i < w; ++i) {
				for(var j = 0; j < h; ++j) {
					var pixel_pos = (j * w + i) * 4;
					if(I.data[pixel_pos])
						count += 1;
				}
			}
			return count
		}
	});
});

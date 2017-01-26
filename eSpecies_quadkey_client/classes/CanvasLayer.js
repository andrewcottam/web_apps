dojo.provide("jrc.CanvasLayer");
dojo.declare("jrc.CanvasLayer", esri.layers.Layer, {
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
		this._connects.push(dojo.connect(this, "onVisibilityChange", this, this._visibilityChangeHandler));
		this._connects.push(dojo.connect(this, "onOpacityChange", this, this._opacityChangeHandler));
		return element;
	},
	_unsetMap : function(map, container) {
		dojo.forEach(this._connects, dojo.disconnect, dojo);
		if(this._element) {
			container.removeChild(this._element);
		}
		this._map = this._element = this._context = this._connects = this._img = null;
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
		this._drawRasterData();
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
	_panHandler : function(extent, delta) {
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
		this._drawRasterData();
	},
	_drawRasterData : function() {
		this.onUpdateStart();
		var params = {
			request : "GetMap",
			transparent : true,
			format : "image/png",
			bgcolor : "ffffff",
			version : "1.1.1",
			layers : "0,1",
			styles : "default,default",
			exceptions : "application/vnd.ogc.se_xml",
			bbox : this._map.extent.xmin + "," + this._map.extent.ymin + "," + this._map.extent.xmax + "," + this._map.extent.ymax,
			srs : "EPSG:" + this._map.extent.spatialReference.wkid,
			width : this._map.width,
			height : this._map.height,
			product : this.product,
			typeid : this.typeid,
			objid : this.objid
		};
		this._img = new Image();
		var instance = this;
		dojo.io.script.get({
			url : "http://ehabitat-wps.jrc.ec.europa.eu/cgi-bin/eSpecies/WMSServer?" + dojo.objectToQuery(params),
			callbackParamName : "jsoncallback",
			load : function(response) {
				instance._img.src = response.url;
				instance.uniqueValues = response.uniqueValues;
				instance.palette = response.palette;
				dojo.connect(instance._img, "onload", function(event) {
					instance._context.width = instance._element.width = instance._img.width;
					instance._context.height = instance._element.height = instance._img.height;
					instance._context.drawImage(instance._img, 0, 0);
					instance.onUpdateEnd();
				});
			},
			error : function(error) {
				alert("An unexpected error occurred: " + error);
			}
		});
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
	getRedValue : function(x, y) {
		if(!this._context)
			return;
		var I = this._context.getImageData(0, 0, this._context.canvas.width, this._context.canvas.height);
		var pixel_pos = (y * this._context.canvas.width + x) * 4;
		return I.data[pixel_pos];
	},
	getValue : function(x, y) {
		var redValue = this.getRedValue(x, y);
		if(!redValue)
			return;
		for(var i = 0; i < this.palette.length; i++) {
			if(this.palette[i][0] == redValue) {
				return this.uniqueValues[i];
			}
		}
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

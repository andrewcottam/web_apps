dojo.provide("jrc.CanvasTestLayer");
dojo.addOnLoad(function() {
	dojo.declare("jrc.CanvasTestLayer", esri.layers.Layer, {
		"-chains-" : {
			constructor : "manual"
		},
		constructor : function(options) {
			this.inherited(arguments, ["http://ehabitat-wps.jrc.ec.europa.eu", options]);
			this.loaded = true;
			this.operator = "source-over";
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
			dojo.style(element, "opacity", this.opacity);
			this._context = element.getContext("2d");
			this._context.globalCompositeOperation = "source-over";
			this._mapWidth = map.width;
			this._mapHeight = map.height;
			this.baseLayerImage = new Image();
			this.baseLayerImage.src = "images/richnessLayer.png";
			this.overlayLayerImage = new Image();
			//this.overlayLayerImage.src = "images/wdpaLayer.png";		
			this.overlayLayerImage.src = "images/overlay.png";
			this.draw();
			return element;
		},
		draw : function() {
			console.log(this._context.globalCompositeOperation);
			this._context.clearRect(0, 0, this._mapWidth, this._mapHeight);
			this._context.globalCompositeOperation = "source-over";
			this._context.drawImage(this.overlayLayerImage, 0, 0);
			this._context.globalCompositeOperation = this.operator;
			console.log(this._context.globalCompositeOperation);
			this._context.drawImage(this.baseLayerImage, 0, 0);
		}
	});
});

dojo.provide("jrc.QuadkeyLayer");
dojo.addOnLoad(function() {
	dojo.declare("jrc.QuadkeyLayer", esri.layers.GraphicsLayer, {
		"-chains-" : {
			constructor : "manual"
		},
		constructor : function(data, options) {
			// Manually call superclass constructor with required arguments
			instance = this;
			this.inherited(arguments, ["http://ehabitat-wps.jrc.ec.europa.eu", options]);
			this.data = data;
			this.loaded = true;
			this.onLoad(this);
		},
		_setMap : function(map) {
			this._map = map;
			this._connects = [];
			this._connects.push(dojo.connect(map, "onExtentChange", this, this._extentChangeHandler));
			this._connects.push(dojo.connect(this, "onVisibilityChange", this, this._visibilityChangeHandler));
			this._extentChangeHandler(map.extent, null, null, map.__LOD);
		},
		_unsetMap : function(map, container) {
			dojo.forEach(this._connects, dojo.disconnect, dojo);
			this._map = this.data = this._connects = null;
		},
		_extentChangeHandler : function(extent, delta, levelChange, lod) {
			if(!this.visible) {
				return
			};
			var zoom = lod.level;
			this._map.graphics.clear();
			var lltile = getTile(this._map.extent.xmin, this._map.extent.ymin, zoom);
			var urtile = getTile(this._map.extent.xmax, this._map.extent.ymax, zoom);
			urtile.tx += 1;
			urtile.ty += 1;
			var line = new esri.geometry.Polyline(this._map.spatialReference);
			var coord1, coord2, coord3, quadkey, textSymbol, point, graphic;
			var font = new esri.symbol.Font();
			font.setSize("12pt");
			font.setWeight(esri.symbol.Font.WEIGHT_BOLD);
			var offset = (getCoordinate(lltile.tx + 1, lltile.ty, zoom).mx - getCoordinate(lltile.tx, lltile.ty, zoom).mx) / 2;
			for(var i = lltile.tx; i <= urtile.tx; i++) {
				coord1 = getCoordinate(i, lltile.ty, zoom);
				coord2 = getCoordinate(i, urtile.ty, zoom);
				line.addPath([[coord1.mx, coord1.my], [coord2.mx, coord2.my]]);
				for(var j = lltile.ty; j <= urtile.ty; j++) {
					quadkey = getQuadkeyForTile({
						tx : i,
						ty : j
					}, zoom);
					textSymbol = new esri.symbol.TextSymbol(quadkey);
					var font = new esri.symbol.Font();
					font.setSize("8pt");
					textSymbol.setFont(font);
					textSymbol.setColor(new dojo.Color([255, 0, 0]));
					coord3 = getCoordinate(i, j, zoom);
					point = new esri.geometry.Point(coord3.mx + offset, coord3.my + offset, this._map.spatialReference)
					this._map.graphics.add(new esri.Graphic(point, textSymbol));
				}
			}
			for(var i = lltile.ty; i <= urtile.ty; i++) {
				coord1 = getCoordinate(lltile.tx, i, zoom);
				coord2 = getCoordinate(urtile.tx, i, zoom);
				line.addPath([[coord1.mx, coord1.my], [coord2.mx, coord2.my]]);
			}
			var sls = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 1);
			this._map.graphics.add(new esri.Graphic(line, sls));
		},
		_visibilityChangeHandler : function() {
			if(!this.visible) {
				this._map.graphics.clear();
			}
			else
			{
				this._extentChangeHandler(this._map.extent, null, null, map.__LOD);
			};
		}
	});
});


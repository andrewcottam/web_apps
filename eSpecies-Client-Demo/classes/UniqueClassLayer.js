dojo.provide("jrc.UniqueClassLayer");
dojo.addOnLoad(function() {
	dojo.declare("jrc.UniqueClassLayer", jrc.CanvasLayer, {
		"-chains-" : {
			constructor : "after"
		},
		constructor : function(options) {
			this._connects.push(dojo.connect(this, "onUpdateEnd", this, this._onUpdateEnd));
			this.setEffect(this.effect);
		},
		_onUpdateEnd : function() {
			if(this.filterValue != undefined) {
				this.setFilterValue(this.filterValue);
			}
		},
		setFilterValue : function(f) {
			this.filterValue = f;
			this._context.drawImage(this._img, 0, 0);
			var I = this._context.getImageData(0, 0, this._element.width, this._element.height);
			this.filter(I.data, this._context.width, this._context.height, this.filterValue);
			this._context.putImageData(I, 0, 0);
		},
		filter : function filter(image_data, w, h, filterValue) {
			var components = 4;
			var pixel_pos;
			for(var i = 0; i < w; ++i) {
				for(var j = 0; j < h; ++j) {
					var pixel_pos = (j * w + i) * components;
					if(image_data[pixel_pos] == filterValue) {
						if(this.pixelMatch) {
							this.pixelMatch(image_data, pixel_pos);
						}
					} else {
						if(this.pixelNoMatch) {
							this.pixelNoMatch(image_data, pixel_pos);
						}
					}
				}
			}
		},
		highlightPixel : function(image_data, pixel_pos) {
			image_data[pixel_pos] = 255;
			image_data[pixel_pos + 1] = image_data[pixel_pos + 2] = 0;
		},
		hidePixel : function(image_data, pixel_pos) {
			image_data[pixel_pos + 3] = 1;
		},
		reset : function() {
			this.filterValue = undefined
			this._context.drawImage(this._img, 0, 0);
		},
		setEffect : function(e) {
			if(e) {
				switch(e) {
					case "highlight":
						this.pixelMatch = this.highlightPixel;
						this.pixelNoMatch = null;
						break;
					case "show":
						this.pixelMatch = null;
						this.pixelNoMatch = this.hidePixel;
						break;
					default:
				}
			} else {
				this.pixelMatch = this.highlightPixel;
				this.pixelNoMatch = this.unhighlightPixel;
			}
		},
		getLandcover : function(x, y) {
			var redValue = this.getRedValue(x,y);
			for(var i = 0; i < this.palette.length; i++) {
				if(this.palette[i][0] == redValue) {
					return this.uniqueValues[i];
				}
			}
			return;
		}
	});
});

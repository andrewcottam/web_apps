dojo.provide("jrc.ThresholdLayer");
dojo.addOnLoad(function() {
	dojo.declare("jrc.ThresholdLayer", jrc.CanvasLayer, {
		"-chains-" : {
			constructor : "after"
		},
		constructor : function(options) {
			this._connects.push(dojo.connect(this, "onUpdateEnd", this, this._onUpdateEnd)); //set the threshold after we've changed extent
		},
		_onUpdateEnd : function() {
			if(this.threshold > 0) {
				this.setThreshold(this.threshold);
			}
		},
		setThreshold : function(t) {
			this.threshold = Math.round(t);
			this._context.drawImage(this._img, 0, 0);
			var I = this._context.getImageData(0, 0, this._element.width, this._element.height);
			this.filter(I.data, this._context.width, this._context.height, this.threshold);
			this._context.putImageData(I, 0, 0);
		},
		filter : function filter(image_data, w, h, t) {
			var components = 4;
			for(var index = 0; index < this.uniqueValues.length; ++index) {//get the threshold value as a red value in the palette
				if(this.uniqueValues[index] >= t) {
					break;
				}
			}
			var redValue = this.palette[index][0]
			var pixel_pos;
			for(var i = 0; i < w; ++i) {
				for(var j = 0; j < h; ++j) {
					var pixel_pos = (j * w + i) * components;
					if(image_data[pixel_pos] < redValue) {
						image_data[pixel_pos] = image_data[pixel_pos + 1] = image_data[pixel_pos + 2] = 0;
						image_data[pixel_pos + 3] = 0;
					}
				}
			}
		}
	});
});

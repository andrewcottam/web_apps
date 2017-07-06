//identical to the PhotoViewer which uses the Leaflet map but this one uses the ESRI Javascript map
define(["esri/geometry/Extent", "esri/graphic", "esri/Color", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol", "esri/layers/GraphicsLayer", "esri/geometry/Point", "esri/geometry/screenUtils", "esri/geometry/webMercatorUtils", "dojo/_base/array", "dojo/dom-geometry", "dojox/gfx", "dojo/window", "dojo/query", "dojo/dom-style", "dojo/dom-construct", "./PhotoBoxFlickr", "dijit/registry", "dojo/on", "./WebServiceAPIs/FlickrAPI", "dojo/_base/lang", "dojo/dom", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./templates/PhotoViewer.html"], 
function(Extent, Graphic, Color, SimpleLineSymbol, SimpleMarkerSymbol, GraphicsLayer, Point, screenUtils, webMercatorUtils, array, domGeom, gfx, dojowindow, query, domStyle, domConstruct, PhotoBoxFlickr, registry, on, FlickrAPI, lang, dom, declare, _WidgetBase, _TemplatedMixin, template) {
	return declare([_WidgetBase, _TemplatedMixin], {
		templateString: template,
		autoUpdate: true, //set to false to have to manually load images
		text: "",
		_setTextAttr: function(value) {
			this.text = value;
			this.getImages();
		},
		constructor: function(args) {
			this.providerObjs = [];
			if (args.providers.length > 0) {
				array.forEach(args.providers, lang.hitch(this, function(providerString) {
					switch (providerString) {
						case "flickr":
							var flickrapi = new FlickrAPI(this);
							this.providerObjs.push(flickrapi);
							break;
						default:
							console.debug("Other provider not currently supported");
					}
				}));
				//add the event handlers for each provider
				array.forEach(this.providerObjs, lang.hitch(this, function(providerObj) {
					on(providerObj, "imagesLoaded", this.imagesLoaded);
				}));
				//default values
				this.showLocatorLine = true; //set to true to show a line to the location on a map
				this.photoSize = args.photoSize ? args.photoSize : "thumbnail"; //see below for valid values
			}
			//events
		},
		postMixInProperties: function() {
			if (this.showLocatorLine) { //if the line is needed then create a canvas in the current viewport to draw the line
				var viewport = dojowindow.getBox();
				this.surface = gfx.createSurface(query("body")[0], viewport.w, viewport.h);
			}
			if (this.map !== undefined) {
				if (this.map.extent !== undefined) {
					this.mapBoundsChanged(); //this will get the images from the providers
					on(this.map, "extent-change", lang.hitch(this, function(e) {
						this.mapBoundsChanged(); //when the map is moved or zoomed refetch the images
					}));
				}
			}
		},
		startup: function() {
			on(this.domNode.parentElement, "scroll", lang.hitch(this, "scrolled"));
		},
		scrolled: function(evt) {
			if (this.activeBox) {
				var startTransform = dojox.gfx.matrix.translate(0, (this.domNode.parentElement.scrollTop - this.startScrollPos) * (-1));
				this.startMarker.setTransform(startTransform);
				var lineTransform = dojox.gfx.matrix.multiplyPoint(startTransform, this.startMarker.shape.cx, this.startMarker.shape.cy);
				if (this.isStartPointVisible(lineTransform.x, lineTransform.y)) {
					this.locatorLine.setShape({
						type: "line",
						x1: this.locatorLine.shape.x1,
						x2: this.locatorLine.shape.x2,
						y1: lineTransform.y,
						y2: this.locatorLine.shape.y2
					});
				}
				else {
					this.activeBox.emit("mouseLeavePhoto");
				}
			}
		},
		mapBoundsChanged: function() { //refetch the images
            this.mapBounds = this.map.geographicExtent;
			this.getImages();
		},
		getImages: function() {
			if ((this.autoUpdate) && (this.mapBounds)) this.requestImages();
		},
		requestImages: function(){
			this.providersLoaded = 0;
			if (this.domNode) {
				//domStyle.set(this.domNode.parentElement, "overflow", "hidden");
			}
			array.forEach(this.providerObjs, lang.hitch(this, function(providerObj) { //get the images from each provider
				providerObj.getImagesForBBox(this.mapBounds.xmin, this.mapBounds.ymin, this.mapBounds.xmax, this.mapBounds.ymax, this.photoSize);
			}));
		},
		imagesLoaded: function() {
			this.photoViewer.providersLoaded = this.photoViewer.providersLoaded + 1;
			//remove existing boxes 
			if (this.photoViewer.domNode !== null) {
				var existingPhotoBoxes = registry.findWidgets(this.photoViewer.domNode);
				array.forEach(existingPhotoBoxes, lang.hitch(this, function(photoBox) {
					photoBox.destroy();
				}));
			}
			//initialise the array of photo boxes
			this.photoBoxes = [];
			//iterate through the photos and create a photobox for each one
			if (this.photos) {
				for (var i = 0; i < this.photos.length; i++) {
					var photoBox;
					switch (this.photos[i].provider) {
						case "flickr":
							photoBox = new PhotoBoxFlickr({
								photo: this.photos[i],
								photoSize: this.photoViewer.photoSize
							});
							break;
						default:
							console.debug("Other provider not currently supported");
					}
					on(photoBox, "mouseEnterPhoto", lang.hitch(this.photoViewer, function(e) { //event to catch when the mouse enters the photo
						this.drawLocation(e);
						this.activeBox = e.target;
						this.startScrollPos = this.domNode.parentElement.scrollTop;
					}));
					on(photoBox, "mouseLeavePhoto", lang.hitch(this.photoViewer, function(e) { //event to catch when the mouse enters the photo
						this.hidelocation();
						this.activeBox = null;
					}));
					this.photoBoxes.push(photoBox);
				}
			}
			//when all the providers have returned data
			if (this.photoViewer.domNode) {
				if (this.photoViewer.providersLoaded == this.photoViewer.providerObjs.length) {
					//domStyle.set(this.photoViewer.domNode.parentElement, "overflow", "auto");
					this.photoViewer.providersLoaded = 0;
					array.forEach(this.photoViewer.providerObjs, lang.hitch(this.photoViewer, function(providerObj) { //add the photoBoxes to the DOM
						// console.debug("Adding photos for " + providerObj.provider);
						array.forEach(providerObj.photoBoxes, lang.hitch(this, function(photoBox) {
							photoBox.startup();
							domConstruct.place(photoBox.domNode, this.domNode); //add the photo box to the photoviewer
						}));
					}));
				}
			}
		},
		drawLocation: function(evt) {
			if (this.map !== undefined) { //if we have a valid  map
				if (evt.target.mouseAbove || evt.target.mouseAbove == undefined) { //with the flickr provider the lat/long data come from an asynchronous call and so by the time the results get back the mouse may be over another element so we only want to show the location if the mouse is still above the photo box
					var markerRadius = (this.showLocatorLine) ? 1 : 7; //set the radius of the marker that will be added - if no line is used then set a large marker because otherwise there will be none
        			var markerMercator = this.getMarkerActualPosition(new Point(evt.longitude, evt.latitude), markerRadius); //get the lat long of the actual position of the marker given its radius 
        			if (!this.markerLayer){
        				this.markerLayer = new GraphicsLayer();
        				this.map.addLayer(this.markerLayer);
        			}else{
        			    this.markerLayer.clear();
        			}
        			var defaultSym = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, markerRadius, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,255,255]), 1), new Color([0,105,182,1]));
        			var graphic =  this.markerLayer.add(new Graphic(markerMercator, defaultSym));
        			this.markerNode = graphic.getNode();
					domStyle.set(graphic.getNode(), "fill", "#0069B6");
					if (this.showLocatorLine) {
						if (this.markerNode !== null) {
							var endPosition = domGeom.position(this.markerNode, true); //get the screen x and y of the domNode position is the lower left point of the marker
							//get the position of the actual image
							var imgPos = domGeom.position(evt.target.imageNode, true); //get the screen x and y of the photo
							//get the center position of the image
							var centerPos = {
								x: (imgPos.x + (imgPos.w / 2)),
								y: (imgPos.y + (imgPos.h / 2))
							};
							//get the angle to the image corner
							var imageCornerTangent = imgPos.h / imgPos.w;
							var lineWidth = endPosition.x - centerPos.x;
							var lineHeight = endPosition.y - centerPos.y;
							//get the angle to the end point
							var lineTan = Math.abs(lineHeight) / Math.abs(lineWidth);
							//see if we are moving the start point to the side or top/bottom
							var moveToSide = (lineTan < imageCornerTangent) ? 1 : 0;
							if (moveToSide) { //move the start point to the left or right
								centerPos.x = centerPos.x + ((imgPos.w / 2) * Math.sign(lineWidth));
								centerPos.y = centerPos.y + (lineTan * (imgPos.w / 2) * Math.sign(lineHeight));
							}
							else { //move the start point up or down
								centerPos.x = centerPos.x + (((imgPos.h / 2) / lineTan) * Math.sign(lineWidth));
								centerPos.y = centerPos.y + ((imgPos.h / 2) * Math.sign(lineHeight));
							}
							var circleRadius = 6;
							if (this.isStartPointVisible(centerPos.x, centerPos.y)) {
								domStyle.set(this.surface.rawNode, "display", "block");
							}
							else {
								domStyle.set(this.surface.rawNode, "display", "none");
							}
							//create the line
							this.locatorLine = this.surface.createLine({
								x1: centerPos.x,
								y1: centerPos.y,
								x2: endPosition.x + markerRadius,
								y2: endPosition.y + +markerRadius
							}).setStroke({
								color: "#fff",
								width: 1.5
							});
							//create the start circle
							this.startMarker = this.surface.createCircle({
								cx: centerPos.x,
								cy: centerPos.y,
								r: circleRadius
							}).setStroke({
								color: "#fff",
								width: 2
							}).setFill("#0069B6");
							//create the end circle
							this.endMarker = this.surface.createCircle({
								cx: endPosition.x + markerRadius,
								cy: endPosition.y + +markerRadius,
								r: circleRadius
							}).setStroke({
								color: "#fff",
								width: 2
							}).setFill("#0069B6");
						} 
					}
				}
			}
		},
		isStartPointVisible: function(x, y) {
			var p = domGeom.position(this.domNode.parentElement, true); //get the screen x and y of this viewer
			var returnValue = (x > p.x && x < (p.x + p.w) && y > p.y && y < (p.y + p.h)) ? true : false;
			return returnValue;
		},
		hidelocation: function() {
			if (this.map !== undefined) {
				if (this.markerLayer !== undefined) {
					this.markerLayer.clear(); //remove the marker from the map
					if (this.showLocatorLine) {
						this.surface.clear(); //clear the line
					}
				}
			}
		},
		getMarkerActualPosition: function(latLng, radius) { //markers with large radii are not shown at the latLong but are offset so this function puts them in the right position
			var mercatorPoint = webMercatorUtils.geographicToWebMercator(latLng);
			var point = screenUtils.toScreenPoint(this.map.extent, this.map.width, this.map.height, mercatorPoint);
			var newPoint = new Point(point.x - (radius / 2), point.y - (radius / 2));
			var newPointMercator = screenUtils.toMapGeometry(this.map.extent, this.map.width, this.map.height, newPoint);
			return newPointMercator;
		},
		changePhotoSize: function(size) {
			this.photoSize = size;
			this.getImages();
		},

	});
});


//photoSize values:
//medium 				 		500 maximum dimension - no longer available for some reason 27/3/17
//small							240 maximum dimension
//thumbnail						100 maximum dimension
//square						60 x 60
//mini_square					32 x 32

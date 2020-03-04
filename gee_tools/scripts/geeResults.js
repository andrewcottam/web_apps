require({
	async : true,
	packages: [
        { name: "widgetsPackage", location: "/../../widgets" }
    ]
	}, ["dojo/text!./templates/infoWindow.html", "esri/InfoTemplate", "esri/domUtils", "widgetsPackage/wmsFilterLayer", "dijit/registry", "dojo/parser", "dojo/_base/lang", "dijit/form/HorizontalSlider", "esri/dijit/BasemapToggle", "esri/graphicsUtils", "dojo/dom-style", "dojo/dom-construct", "dojox/charting/themes/ThreeD", "dojox/charting/Chart", "dojo/io-query", "dgrid/Grid", "dojo/request/script", "dojo/Deferred", "dojo/dom", "dojo/dom-construct", "dojo/dom-attr", "dojo/keys", "dojox/gfx", "esri/geometry/Point", "esri/symbols/SimpleLineSymbol", "dojo/_base/Color", "esri/symbols/SimpleMarkerSymbol", "esri/graphic", "esri/layers/GraphicsLayer", "dojo/_base/array", "esri/geometry/screenUtils", "esri/geometry/Polygon", "dojo/request/xhr", "esri/geometry/webMercatorUtils", "dojo/on", "esri/SpatialReference", "esri/geometry/Extent", "esri/layers/WMSLayerInfo", "esri/layers/WMSLayer", "esri/map", "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dojo/domReady!", "dojox/charting/plot2d/Lines", "dojox/charting/axis2d/Default"], function(infoWindow, InfoTemplate, domUtils, wmsFilterLayer, registry, parser, lang, HorizontalSlider, BasemapToggle, graphicsUtils, domStyle, domConstruct, blue, Chart, ioQuery, Grid, script, Deferred, dom, domConstruct, domAttr, keys, gfx, Point, SimpleLineSymbol, Color, SimpleMarkerSymbol, Graphic, GraphicsLayer, array, screenUtils, Polygon, xhr, webMercatorUtils, on, SpatialReference, Extent, WMSLayerInfo, WMSLayer, Map, BorderContainer, ContentPane) {
	var WMS_ENDPOINT = "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com/geoserver/gee_workspace/wms?";
	var WFS_ENDPOINT = "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com/geoserver/gee_workspace/ows?";
	var LAYER_NAME = "gee_workspace:gee_validation_results";
	var IDENTIFY_RADIUS = 3;
	var LASSO_SURFACE_ID = "lassoSurface";
	var BBOXSIZE = 1910.925707126968;
	var SITE_IMAGE_SIZE = 250;
	var map, restServerUrl, geeServerUrl, selectedFeaturesLayer, startPoint, lassoSurface, selectedFeatures = [], confusionMatrixGrid, confusionMatrixGrid2, chart, actual_class, cqlFilter = {
		"actual_class" : "-1",
		"predicted_class" : "3",
		"applied_masks" : "1"
	};
	parser.parse().then(function() {
		on(registry.byId("appliedMasks"), "change", function(value) {
			cqlFilter.applied_masks = value;
			refreshWMSLayer();
			getConfusionMatrix();
		});
		on(registry.byId("actualClass"), "change", function(value) {
			cqlFilter.actual_class = value;
			refreshWMSLayer();
		});
		on(registry.byId("predictedClass"), "change", function(value) {
			cqlFilter.predicted_class = value;
			refreshWMSLayer();
		});
		restServerUrl = "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com:8081/python-rest-server/h05googleearthengine"; //AWS C9 environment only
		geeServerUrl = "https://geeimageserver.appspot.com/ogc?";
		map = new Map("mapDiv", {
			zoom : 3,
			center : [0, 25],
			basemap : "topo"
		});
		var toggle = new BasemapToggle({
			map : map,
			basemap : "satellite"
		}, "BasemapToggle");
		toggle.startup();
		map.on("load", initialiseMap);
		createConfusionMatrix();
		createConfusionMatrix2();
		createSpectralChart();
		var slider = new HorizontalSlider({
			name : "slider",
			value : 1,
			maximum : 1,
			intermediateChanges : true,
			onChange : function(value) {
				map.getLayer(map.basemapLayerIds[0]).setOpacity(value);
			}
		}, "slider");
		getConfusionMatrix();
	});

	function refreshWMSLayer() {
		cqlFilterString = getCQLFilterString();
		wmsLayer.cql_filter = cqlFilterString;
		wmsLayer.refresh();
	}

	function getCQLFilterString() {
		var cqlFilterString = "";
		for (var prop in cqlFilter) {
			if (cqlFilter[prop] !== "-1") {
				cqlFilterString = cqlFilterString + prop + "=" + cqlFilter[prop] + " and ";
			}
		}
		if (cqlFilterString.length > 0) {
			cqlFilterString = cqlFilterString.substring(0, cqlFilterString.length - 5);
		};
		return cqlFilterString;
	}

	function initialiseMap() {
		wmsLayer = new wmsFilterLayer(WMS_ENDPOINT, LAYER_NAME);
		wmsLayer.cql_filter = "applied_masks=1 and predicted_class=3";
		wmsLayer.crs = "EPSG:900913";
		selectedFeaturesLayer = new GraphicsLayer();
		highlightedFeaturesLayer = new GraphicsLayer();
		geeImageFeatureLayer = new GraphicsLayer();
		map.addLayers([wmsLayer, selectedFeaturesLayer, highlightedFeaturesLayer, geeImageFeatureLayer]);
		map.on("click", mapClick);
		map.on("mouse-down", mapMouseDown);
		map.on("mouse-drag", mapMouseDrag);
		map.on("mouse-up", mapMouseUp);
		on(document, "keydown", keydown);
		on(document, "keyup", keyup);
		on(wmsLayer, "update-start", function(evt) {
			domUtils.show(dom.byId("mapLoadingImg"));
		});
		on(wmsLayer, "update-end", function(evt) {
			domUtils.hide(dom.byId("mapLoadingImg"));
		});
		domStyle.set(dom.byId("mapLoadingImg"), "left", (map.width / 2) - 8 + "px");
		domStyle.set(dom.byId("mapLoadingImg"), "top", (map.height / 2) - 8 + "px");
	}

	function createConfusionMatrix() {
		var columns = [{
			label : 'Predicted',
			field : 'predicted'
		}, {
			label : 'Actual',
			field : 'actual'
		}, {
			label : 'Count',
			field : '_count'
		}, {
			label : ' ',
			field : 'complexCell',
			renderCell : function(object, value, node, options) {
				var link = domConstruct.create("a", {
					href : "#",
					innerHTML : "show",
					title : "Show " + object.actual + ' points'
				}, node);
				on(link, "click", showConfusionPoints);
				var link2 = domConstruct.create("a", {
					href : "#",
					innerHTML : "zoom",
					title : "Zoom to " + object.actual + ' points'
				}, node);
				on(link2, "click", zoomToConfusionPoints);
			}
		}];
		confusionMatrixGrid = new Grid({
			columns : columns
		}, "confusionMatrixGrid");
	}

	function createConfusionMatrix2() {
		var columns = [{
			label : 'Predicted',
			field : 'predicted'
		}, {
			label : 'water',
			field : 'water'
		}, {
			label : 'not water',
			field : 'not_water'
		}, {
			label : 'total',
			field : 'total'
		}, {
			label : 'percent',
			field : 'percent'
		}];
		confusionMatrixGrid2 = new Grid({
			columns : columns
		}, "confusionMatrixGrid2");
	}

	function getConfusionMatrix() {
		var deferred;
		deferred = script.get(restServerUrl + "/especies/get_water_detection_confusion_matrix", {
			query : {
				applied_masks : cqlFilter.applied_masks,
				format : 'json'
			},
			jsonp : "callback"
		});
		deferred.then(function(response) {
			if (!response.metadata.success) {
				alert('Unable to get Confusion Matrix data. ' + response.metadata.error);
			} else {
				var nw_nw = response.records[0].count;
				var nw_w = response.records[1].count;
				var w_nw = response.records[2].count;
				var w_w = response.records[3].count;
				var confusionData = [];
				confusionData.push({
					"predicted" : "water",
					"water" : w_w,
					"not_water" : w_nw,
					"total" : (w_w + w_nw),
					"percent" : ((w_w * 100) / (w_w + w_nw)).toFixed(2) + " %"
				});
				confusionData.push({
					"predicted" : "not water",
					"water" : nw_w,
					"not_water" : nw_nw,
					"total" : (nw_w + nw_nw),
					"percent" : ((nw_nw * 100) / (nw_w + nw_nw)).toFixed(2) + " %"
				});
				confusionData.push({
					"predicted" : "total",
					"water" : w_w + nw_w,
					"not_water" : w_nw + nw_nw,
					"total" : (w_w + w_nw) + (nw_w + nw_nw),
					"percent" : (((w_w + nw_nw) * 100) / ((w_w + w_nw) + (nw_w + nw_nw))).toFixed(2) + " %"
				});
				confusionMatrixGrid2.refresh();
				confusionMatrixGrid2.renderArray(confusionData);
			}
		});
		return deferred;
	}

	function createSpectralChart() {
		chart = new Chart("spectralChart");
		chart.setTheme(blue);
		chart.addPlot("default", {
			type : "Lines",
			markers : true
		});
		chart.addAxis("x", {
			title : "Band",
			minorTicks : false,
			titleOrientation : "away",
			htmlLabels : false,
			labels : [{
				value : 1,
				text : "B1"
			}, {
				value : 2,
				text : "B2"
			}, {
				value : 3,
				text : "B3"
			}, {
				value : 4,
				text : "B4"
			}, {
				value : 5,
				text : "B5"
			}, {
				value : 6,
				text : "B6"
			}, {
				value : 7,
				text : "B7"
			}, {
				value : 8,
				text : "B8"
			}, {
				value : 9,
				text : "B9"
			}]
		});
		chart.addAxis("y", {
			min : 0,
			max : 0.5,
			vertical : true,
			fixLower : "major",
			fixUpper : "major",
			majorLabels : true,
			minorLabels : true,
			title : 'Reflectance'
		});
	}

	function mapClick(event) {
		var screenPoint = event.screenPoint;
		var clickArea = new Polygon([[screenPoint.x - IDENTIFY_RADIUS, screenPoint.y - IDENTIFY_RADIUS], [screenPoint.x - IDENTIFY_RADIUS, screenPoint.y + IDENTIFY_RADIUS], [screenPoint.x + IDENTIFY_RADIUS, screenPoint.y + IDENTIFY_RADIUS], [screenPoint.x + IDENTIFY_RADIUS, screenPoint.y - IDENTIFY_RADIUS]]);
		identifyFeatures(clickArea);
	}

	function keydown(event) {
		switch (event.keyCode) {
		case (keys.ALT) :
			map.disablePan();
			break;
		case (keys.ESCAPE) :
			clearSelectedFeatures();
			break;
		};
	}

	function keyup(event) {
		switch (event.keyCode) {
		case (keys.ALT) :
			map.enablePan();
			break;
		};
	}

	function mapMouseDown(event) {
		if (event.altKey == true) {
			startPoint = event.screenPoint;
			clearSelectedFeatures();
			clearHighlightedFeatures();
			createLassoSurface();
		};
	}

	function createLassoSurface() {
		lassoSurface = gfx.createSurface("mapCanvas", map.width, map.height);
		domAttr.set(lassoSurface.rawNode, "id", LASSO_SURFACE_ID);
	}

	function destroyLassoSurface() {
		domConstruct.destroy(dom.byId(LASSO_SURFACE_ID));
		lassoSurface = undefined;
	}

	function mapMouseDrag(event) {
		if (!map.isPan) {//i.e. drawing a lasso
			lassoSurface.clear();
			var width = event.screenPoint.x - startPoint.x;
			var height = event.screenPoint.y - startPoint.y;
			var rectangle = lassoSurface.createRect({
				x : startPoint.x,
				y : startPoint.y,
				width : width,
				height : height
			});
			rectangle.setStroke("blue");
		}
	}

	function mapMouseUp(event) {
		var minx, miny, max, maxy;
		var endPoint = event.screenPoint;
		if (startPoint !== undefined) {
			if (startPoint.x < endPoint.x) {
				minx = startPoint.x;
				maxx = endPoint.x;
			} else {
				minx = endPoint.x;
				maxx = startPoint.x;
			}
			if (startPoint.y < endPoint.y) {
				miny = startPoint.y;
				maxy = endPoint.y;
			} else {
				miny = endPoint.y;
				maxy = startPoint.y;
			}
			identifyFeatures(new Polygon([[minx, miny], [minx, maxy], [maxx, maxy], [maxx, miny]]));
			destroyLassoSurface();
			startPoint = undefined;
		};
	}

	function identifyFeatures(selectionAreaScreen) {
		var selectionAreaMap = screenUtils.toMapGeometry(map.extent, map.width, map.height, selectionAreaScreen);
		var extent = webMercatorUtils.webMercatorToGeographic(selectionAreaMap).getExtent();
		selectedFeaturesLayer.clear();
		cqlFilterString = getCQLFilterString() + " and BBOX(geom," + extent.xmin.toString() + "," + extent.ymin.toString() + "," + extent.xmax.toString() + "," + extent.ymax.toString() + ")";
		var wfsquery = {
			CQL_FILTER : cqlFilterString,
			REQUEST : 'GetFeature',
			SERVICE : 'WFS',
			VERSION : '1.0.0',
			TYPENAME : LAYER_NAME,

			outputFormat : "json"
		};
		//run a synchronous query to get the features from WFS
		xhr(WFS_ENDPOINT, {
			query : wfsquery,
			handleAs : "json",
			sync : true,
			headers : {
				"X-Requested-With" : null
			}
		}).then(function(data) {
			selectFeatures(data.features);
		}, function(err) {
			alert("Unable to get data from WFS");
		});
	}

	function selectFeatures(features) {
		var graphic;
		array.forEach(features, function(item) {
			var point = getPointFromWFSFeature(item);
			var geometry = webMercatorUtils.geographicToWebMercator(point);
			graphic = new Graphic(point, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 6, new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, new Color([255, 0, 0, 1]), 1), new Color([0, 255, 255, 1])), item.properties);
			selectedFeaturesLayer.add(graphic);
			selectedFeatures.push(item.properties.objectid);
		});
		if (features.length > 0) {
			getSiteImageUrl(features[0], true);
			populateSpectralChart(features);
			var properties = features[0].properties;
			infoTemplate = new InfoTemplate("Validation site information", infoWindow);
			graphic.attributes = properties;
			graphic.setInfoTemplate(infoTemplate);
			map.infoWindow.setContent(graphic.getContent());
			map.infoWindow.setTitle("Validation site information");
			map.infoWindow.resize(270, 440);
			map.infoWindow.show(graphic.geometry);
		};
		rest_getConfusionMatrix(selectedFeatures);
	}

	shorten = function(value, key, data) {
		if (key === 'sceneid') {
			return value.substring(20);
		} else {
			return value;
		}
	};

	function getPointFromWFSFeature(feature) {
		var coord = feature.geometry.coordinates;
		var point = new Point(coord[0], coord[1], new SpatialReference({
			wkid : 4326
		}));
		return point;
	}

	function clearSelectedFeatures() {
		selectedFeaturesLayer.clear();
		selectedFeatures.length = 0;
	}

	function clearHighlightedFeatures() {
		highlightedFeaturesLayer.clear();
		highlightedFeaturesLayer.length = 0;
	}

	function rest_getConfusionMatrix(objectids) {
		var deferred;
		deferred = script.get(restServerUrl + "/especies/_get_gee_validated_sites_confusion_matrix", {
			query : {
				objectids : objectids.join(","),
				format : 'json'
			},
			jsonp : "callback"
		});
		deferred.then(function(response) {
			if (!response.metadata.success) {
				alert('Unable to get Confusion Matrix data. ' + response.metadata.error);
			} else {
				confusionMatrixGrid.refresh();
				confusionMatrixGrid.renderArray(response.records);
			}
		});
		return deferred;
	}

	function populateSpectralChart(features) {
		domStyle.set("loading2", "display", "block");
		domStyle.set("loading2", "z-index", "1");
		clearSpectralChart();
		array.forEach(features, function(feature, index) {
			var pixelValues = [], color;
			for (p in feature.properties) {
				if (p.substr(0, 4) === 'band' && p.length === 5) {
					pixelValues.push({
						x : Number(p.substr(4, 5)),
						y : feature.properties[p]
					});
				};
			}
			color = (feature.properties.actual_class === "3") ? "green" : "red";
			chart.addSeries("series" + index, pixelValues, {
				stroke : {
					color : color,
					width : 2
				},
				fill : color
			});
		});
		chart.render();
		domStyle.set("loading2", "z-index", "-1");
	}

	function clearSpectralChart() {
		for (var i = chart.series.length - 1; i > 0; i--) {
			chart.removeSeries(chart.series[i].name);
		}
	}

	function getSiteImageUrl(site, rgb) {
		var p = getPointFromWFSFeature(site);
		geeImageFeatureLayer.clear();
		//add a cross to the feature clicked
		geeImageFeatureLayer.add(new Graphic(p, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CROSS, 40, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 255, 1]), 1), new Color([255, 0, 255, 1]))));
		var sitePoint = webMercatorUtils.geographicToWebMercator(p);
		var bbStr = (sitePoint.x - BBOXSIZE) + "," + (sitePoint.y - BBOXSIZE) + "," + (sitePoint.x + BBOXSIZE) + "," + (sitePoint.y + BBOXSIZE);
		var params = {
			service : "WMS",
			request : "GetMap",
			version : "1.1.1",
			layers : "[" + site.properties.sceneid + "]",
			format : "image/png",
			transparent : "false",
			srs : "EPSG:3857",
			width : SITE_IMAGE_SIZE,
			height : SITE_IMAGE_SIZE,
			bbox : bbStr
		};
		var paramsQuery = ioQuery.objectToQuery(params);
		script.get(geeServerUrl, {
			query : params,
			jsonp : "callback"
		}).then(lang.hitch(p, function(response) {
			domAttr.set(dom.byId("geeimage"), "src", response.url);
			domStyle.set("loading", "z-index", "-1");
		}));
	}

	function showConfusionPoints(event) {
		highlightedFeaturesLayer.clear();
		var actual = event.target.title.substring(5, event.target.title.length - 7);
		array.forEach(selectedFeaturesLayer.graphics, function(graphic, index) {
			if (graphic.attributes.actual_class_label === actual) {
				highlightedFeaturesLayer.add(new Graphic(lang.clone(graphic.geometry), new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 7, new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, new Color([255, 0, 255, 1]), 1), new Color([255, 0, 255, 1])), lang.clone(graphic.attributes)));
			};
		});
	}

	function zoomToConfusionPoints(event) {
		if (highlightedFeaturesLayer.graphics.length !== 0) {
			var myFeatureExtent = graphicsUtils.graphicsExtent(highlightedFeaturesLayer.graphics);
			map.setExtent(myFeatureExtent, true);
		};
	}

});

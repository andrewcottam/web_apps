/*jslint plusplus: true */
require({
	async : true,
	packages: [
        { name: "widgetsPackage", location: "/../../widgets" }
    ]
}, ["esri/symbols/TextSymbol", "esri/symbols/Font", "esri/geometry/Polyline", "esri/geometry/screenUtils", "dojo/_base/event", "esri/toolbars/edit", "esri/geometry/Polygon", "widgetsPackage/wmsFilterLayer", "dojo/io-query", "dojo/request/xhr", "./scripts/poly2tri.js", "dijit/Toolbar", "dojo/request", "dojo/mouse", "dojo/dom-class", "dijit/focus", "widgetsPackage/LegendCheckBox", "widgetsPackage/EnterTextDialog", "widgetsPackage/LoadTextDialog", "widgetsPackage/CanvasLayer", "dojo/topic", "dojo/dom-geometry", "dojo/keys", "esri/SpatialReference", "esri/symbols/SimpleFillSymbol", "esri/dijit/Geocoder", "dgrid/Grid", "esri/domUtils", "dojo/json", "dojo/aspect", "widgetsPackage/LoginBox", "dojo/_base/declare", "esri/InfoTemplate", "dojo/Deferred", "dojo/dom-attr", "widgetsPackage/LegendBox", "esri/layers/GraphicsLayer", "esri/geometry/Geometry", "dojo/_base/array", "dojo/_base/window", "dojo/request/script", "dojo/_base/lang", "dojo/ready", "dojo/dom-style", "dojo/date/locale", "dojo/date/stamp", "dojo/_base/Color", "esri/symbols/SimpleLineSymbol", "esri/graphic", "esri/symbols/SimpleMarkerSymbol", "esri/geometry/Point", "esri/geometry/webMercatorUtils", "esri/map", "esri/geometry/Extent", "dojo/dom", "dijit/registry", "dojo/query", "dojo/on", "dojo/parser", "dojo/dom-construct",  "widgetsPackage/GeeLayer", "dijit/form/Select", "dijit/form/CheckBox", "dijit/form/Button", "dijit/form/TextBox", "widgetsPackage/PhotoViewerEsri", "dijit/layout/BorderContainer", "dijit/form/RadioButton", "dijit/form/HorizontalSlider", "dijit/layout/StackContainer", "dijit/layout/StackController", "dijit/Menu", "dijit/CheckedMenuItem", "dijit/layout/ContentPane", "dijit/form/DropDownButton", "dijit/ToolbarSeparator", "dijit/form/ToggleButton", "dijit/TooltipDialog"], function(TextSymbol, Font, Polyline, screenUtils, event, Edit, Polygon, wmsFilterLayer, ioQuery, xhr, poly2tri, Toolbar, request, mouse, domClass, focusUtil, LegendCheckBox, EnterTextDialog, LoadTextDialog, CanvasLayer, topic, domGeom, keys, SpatialReference, SimpleFillSymbol, Geocoder, Grid, domUtils, json, aspect, LoginBox, declare, InfoTemplate, Deferred, domAttr, LegendBox, GraphicsLayer, Geometry, array, win, script, lang, ready, domStyle, locale, stamp, Color, SimpleLineSymbol, Graphic, SimpleMarkerSymbol, Point, utils, Map, Extent, dom, registry, query, on, parser, domConstruct, GeeLayer, Select, CheckBox, Button, TextBox, PhotoViewer) {
	ready(function() {
		var geeServerUrl, geeImageServerUrl, axisMinx, axisMiny, currentAlgorithm = {}, points = [], algorithms = [], draftSites = [], legendClasses = [], siteData = [], LAYER_NAME = "gee_workspace:_gee_spectral_data", WMS_ENDPOINT = "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com/geoserver/gee_workspace/wms?", WFS_ENDPOINT = "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com/geoserver/gee_workspace/ows?", path_row = "", xAxis = 'value', yAxis = 'hue', xscale = 1, yscale = 360, xOffset = 0, yOffset = 0, IDENTIFY_RADIUS = 3, layersLoading = 0, canvasLayer, rgbLayer, hsvLayer, detectionLayer, siteLayer, draftsiteLayer, mapQueryLayer, axesLayer, triangulationLayer, queryLayer, algorithmLayer, spectralLayer, spectralMap, xAxisTitleGraphic, yAxisTitleGraphic, queryObject, currentTabId, currentUsername, loadTextDialog, previousExtent, scenePropertiesGrid, currentsceneid, currentscenedate, loadingOverlay, loginhandler, loggedIn, initExtent, map, restServerUrl, chart, showCursorValues = true, showAxes = true, textColor = new Color([64, 64, 64]), photoViewer;
		var querySymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CROSS, 40, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0, 1]), 1), new Color([255, 0, 0, 1]));
		var initialSpectralMapExtent = new Extent({
			"xmin" : 0,
			"ymin" : 0,
			"xmax" : 1,
			"ymax" : 1
		});
		LoadingOverlay = declare(null, {
			overlayNode : null,
			constructor : function() {
				// save a reference to the overlay
				this.overlayNode = dom.byId("loadingOverlay");
			},
			// called to hide the loading overlay
			endLoading : function() {
				domStyle.set(this.overlayNode, 'display', 'none');
			}
		});
		loadingOverlay = new LoadingOverlay();
		queryObject = ioQuery.queryToObject(win.doc.location.search.substring(1));
		restServerUrl = "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com:8081/python-rest-server/h05googleearthengine"; //AWS C9 environment only
		geeServerUrl = "https://db-server-blishten.c9users.io/cgi-bin/gee.py/";
		geeImageServerUrl = "https://geeImageServer.appspot.com";
		// ||(document.domain === "127.0.0.1")
		// need a copy of the current points otherwise changes to the
		// line update the existing algorithms points
		parser.parse().then(function() {
			console.log('parser.parsed');
			logout();
			algorithmNameDialog = new EnterTextDialog();
			algorithmNameDialog.startup();
			loadTextDialog = new LoadTextDialog();
			loadTextDialog.startup();
			topic.subscribe("startEditSession", startEditSession);
			topic.subscribe("endEditSession", endEditSession);
			topic.subscribe("pointsModified", pointsModified);
			topic.subscribe("algorithmCountChanged", algorithmCountChanged);
			topic.subscribe("axesChanged", axesChanged);
			on(registry.byId("algorithmList"),"change", changeAlgorithm);
			on(algorithmNameDialog, "created", saveNewAlgorithm);
			on(loadTextDialog, "created", loadAlgorithm);
			on(registry.byId("openAlgorithm"), "click", openLoadAlgorithmDialog);
			on(registry.byId("saveAlgorithmToFile"), "click", saveAlgorithmToFile);
			on(registry.byId("runAlgorithm"), "click", runAlgorithm);
			on(registry.byId("testAlgorithm"), "click", function(value) {
				if (this.checked) {
					testAlgorithm();
				} else {
					clearSelectedSites();
				}
			});
			on(registry.byId("detectionColour"), "change", changeDetectionColour);
			on(registry.byId("collectionSelect"), "change", function(value) {
				console.log('collectionSelect change');
				clearScenesBox();
				clearBandBoxes();
				rest_getScenesForCentroid(map.extent.getCenter());
			});
			on(registry.byId("createSites"), "click", createSites);
			on(registry.byId("deleteSites"), "click", clearDraftSites);
			on(registry.byId("toggleChangeLayer"), "change", function(value) {
				console.log('toggleChangeLayer change');
				canvasLayer.setVisibility(!canvasLayer.visible);
			});
			on(registry.byId("toggleRGB"), "change", function(value) {
				console.log('toggleRGB change');
				rgbLayer.setVisibility(!rgbLayer.visible);
			});
			on(registry.byId("toggleHSV"), "change", function(value) {
				console.log('toggleHSV change');
				hsvLayer.setVisibility(!hsvLayer.visible);
			});
			on(registry.byId("toggleWater"), "change", function(value) {
				console.log('toggleWater change');
				detectionLayer.setVisibility(!detectionLayer.visible);
			});
			on(registry.byId("toggleSites"), "change", function(value) {
				console.log('toggleSites change');
				siteLayer.setVisibility(!siteLayer.visible);
			});
			on(registry.byId("updateChartButton"), "click", function(evt) {
				wms_getSpectralData();
				closeDropDownMenu();
			});
			on(registry.byId("closeButton"), "click", function(evt) {
				closeDropDownMenu();
			});
			on(registry.byId("toggleAllClasses"), "change", function(value) {
				console.log('toggleAllClasses change');
				array.forEach(registry.findWidgets(dom.byId("classTogglers")), function(item) {
					item.checkbox.set("checked", value);
				});
			});
			on(registry.byId("fullScreenButton"), "click", fullScreenButtonClick);
			on(registry.byId("fullExtentButton"), "click", fullExtent);
			on(registry.byId("toggleAlgorithmButton"), "click", toggleAlgorithm);
			on(registry.byId("toggleTrainingSitesButton"), "click", toggleTrainingSites);
			on(registry.byId("toggleTriangulationButton"), "click", toggleTriangulation);
			on(registry.byId("toggleCursorXYValuesButton"), "click", toggleCursorXYValues);
			on(registry.byId("toggleAxesButton"), "click", toggleAxes);
			on(registry.byId("xAxisSelect"), "change", changeChartAxis);
			on(registry.byId("yAxisSelect"), "change", changeChartAxis);
			on(registry.byId("createNewAlgorithmButton"), "click", openNewAlgorithmDialog);
			on(registry.byId("saveAlgorithmButton"), "click", saveCurrentAlgorithm);
			on(registry.byId("deleteAlgorithmButton"), "click", deleteAlgorithm);
			on(geocoder.inputNode, "keydown", function(event) {
				if (event.keyCode === keys.ENTER) {
					if (geocoder.inputNode.value) {
						var match = geocoder.inputNode.value.match(/(-?\d+\.\d+)\,(-?\d+\.\d+)$/);
						if (match) {
							var point = new Point(match[1], match[2]);
							map.centerAndZoom(point, 11);
						}
						;
					}
					;
				}
				;
			});
			registry.byId("tabContainer").watch("selectedChildWidget", function(name, fromChild, toChild) {
				currentTabId = toChild.id;
				console.log('tabContainer selectedChildWidget change ' + currentTabId);
				if (fromChild.id === "spectralPane") {
					clearSpectralQuery();
				}
				switch (currentTabId) {
				case "flickrPane2":
					photoViewer.requestImages();
					photoViewer.autoUpdate = true;
					break;
				default:
					photoViewer.autoUpdate = false;
				}
			});
			rest_getGlc2000().then(function(response) {// get
				createLegend();
				selectDefaultClasses();
			});
			createSpectralMap();
			createScenePropertiesGrid();
			photoViewer = new PhotoViewer({
				map: map,
				providers: ["flickr"],
				text: "outdoor",
				photoSize: "thumbnail", //small
				autoUpdate: false,
			}, "flickrImages2"); 
			photoViewer.startup();
		});
		query("input[name='basemapLayer']").on("click", updateBasemap);
		initExtent = new Extent(-517344.4386681639, 1662324.7040100119, -443964.8915144937, 1740596.2209739268, new SpatialReference({
			wkid : 102100
		}));
		map = new Map("mapDiv", {
			extent : initExtent,
			basemap : "topo",
			sliderStyle : "large"
		});
		if (queryObject.x !== undefined) {
			map.centerAndZoom(new Point(queryObject.x, queryObject.y, new SpatialReference({
				wkid : 102100
			})), queryObject.level);
		}
		geocoder = new Geocoder({
			map : map,
			autoComplete : true,
			maxLocations : 4
		}, "geolocator");
		geocoder.startup();
		map.on("load", function() {
			console.log('map load');
			on(map, "extent-change", extentChange);
			on(map, "click", mapClick);
			on(map, "key-up", deleteSite);
			on(map.infoWindow, "hide", infoWindowHide);
			on(map.infoWindow, "selection-change", function(event) {
				console.log('infoWindow selection-change');
				if (this.features !== null) {
					var att = this.features[0].attributes;
					createChartQueryPoint(att[xAxis], att[yAxis]);
				}
				;
			});
			rgbLayer = new GeeLayer('rgbLayer', {
				visible : false,
			});
			registry.byId("red").on("change", function(value) {
				console.log('red change');
				rgbLayer.redBand = value;
			});
			registry.byId("green").on("change", function(value) {
				console.log('green change');
				rgbLayer.greenBand = value;
			});
			registry.byId("blue").on("change", function(value) {
				console.log('blue change');
				rgbLayer.blueBand = value;
			});
			registry.byId("minval").on("change", function(value) {
				console.log('minval change');
				rgbLayer.min = value;
				detectionLayer.min = value;
			});
			registry.byId("maxval").on("change", function(value) {
				console.log('maxval change');
				rgbLayer.max = value;
				detectionLayer.max = value;
			});
			registry.byId("updateButton").on("click", function() {
				console.log('updateButton click');
				rgbLayer.refresh();
			});
			hsvLayer = new GeeLayer('hsvLayer', {
				visible : false,
				redBand: "SWIR2",
				greenBand: "NIR",
				blueBand: "Red",
			});
			detectionLayer = new GeeLayer('waterLayer', {
				detectExpression : currentAlgorithm.expression,
				visible : false
			});
			detectionLayer.set("detectColor", "Blue");
			canvasLayer = new CanvasLayer();
			registry.byId("sceneSelect").on("change", function(item) {
				console.log('sceneSelect change');
				changeScene(item);
			});
			siteLayer = new GraphicsLayer();
			draftsiteLayer = new GraphicsLayer();
			mapQueryLayer = new GraphicsLayer();
			map.addLayers([hsvLayer, rgbLayer, detectionLayer, siteLayer, draftsiteLayer, mapQueryLayer, canvasLayer]);
			array.forEach(map.layerIds, function(item) {
				var layer = map.getLayer(item);
				on(layer, "update-start", layerUpdateStart);
				on(layer, "update-end", layerUpdateEnd);
			});
			var deleteLink = domConstruct.create("a", {
				"class" : "action",
				"id" : "deleteLink",
				"innerHTML" : "Delete",
				"href" : "javascript: void(0);"
			}, query(".actionList", map.infoWindow.domNode)[0]);
			on(deleteLink, "click", deleteSite);
		});

		function layerUpdateStart() {
			map.setMapCursor("wait");
			dom.byId("loadingMessage").innerHTML = "Loading ... ";
			domUtils.show(dom.byId("loading"));
			map.disableMapNavigation();
			map.hideZoomSlider();
			layersLoading++;
			if (this.url.substring(0, 4) === "http") {
				return;
			}
			if (this.hasOwnProperty("sceneid")) {
				console.log("update-start (" + this.url + " sceneID=" + this.sceneid + ")");
			} else {
				console.log("update-start (" + this.url + ")");
			}
		}

		function layerUpdateEnd(event) {
			layersLoading--;
			if (layersLoading < 0) {
				layersLoading = 0;
			}
			if (layersLoading === 0) {
				map.setMapCursor("default");
				domUtils.hide(dom.byId("loading"));
				dom.byId("loadingMessage").innerHTML = "";
				map.enableMapNavigation();
				map.showZoomSlider();
				on.emit(map, "allLayersLoaded");
			}
			if (event.target.url.substring(0, 4) !== "http") {
				if (event.target.hasOwnProperty("sceneid")) {
					console.log("update-end (" + event.target.url + " sceneID=" + event.target.sceneid + ")");
				} else {
					console.log("update-end (" + event.target.url + ")");
				}
			}
		}

		function extentChange(event) {
			console.log("extentChange (x=" + map.extent.getCenter().x + " y=" + map.extent.getCenter().y + ")");
			if ((event.delta) && (event.delta.x === 0) && (event.delta.y === 0) && !event.levelChange) {return} //not a real extent change but just a mouse click - Chrome being oversensitive
			getSitesForExtent();
			if ((event.delta === null) || ((event.delta.x === 0) && (event.delta.y === 0))) {
				getScenesForCentroid();
			} else {
				if ((event.extent.getCenter().x !== previousExtent.getCenter().x) || (event.extent.getCenter().y !== previousExtent.getCenter().y)) {
					getScenesForCentroid();
				}
			}
			previousExtent = event.extent;
		}

		function getSitesForExtent() {
			console.log("getSitesForExtent");
			rest_getSiteData().then(function(response) {
				siteLayer.clear();
				array.forEach(siteData, function(item) {
					addGraphic(item, false);
				});
				siteLayer.emit("graphicsLoaded");
			});
		}

		function getScenesForCentroid() {
			console.log("getScenesForCentroid");
			var currentPathRow = path_row;
			suspendResumeLayers(true);
			rest_getPathRow(map.extent.getCenter()).then(function() {
				if (currentPathRow === path_row) {
					suspendResumeLayers(false);
				} else {
					rest_getScenesForCentroid(map.extent.getCenter()).then(function() {
						console.log("<< rest_getScenesForCentroid");
						suspendResumeLayers(false);
					});
				}
			});
		}

		function suspendResumeLayers(suspend) {
			console.log("suspendResumeLayers");
			array.forEach(map.layerIds, function(item) {
				layer = map.getLayer(item);
				if (layer.declaredClass === 'jrc/GeeLayer') {
					(suspend) ? layer.suspend() : layer.resume();
				}
			});
		}

		function clearScenesBox() {
			console.log("clearScenesBox");
			var select = registry.byId("sceneSelect");
			select.set('disabled', true);
			select.removeOption(select.getOptions());
			select.addOption({
				'label' : " ",
				'value' : " "
			});
		}

		function populateScenesBox(availableScenes) {
			console.log("populateScenesBox");
			var select, options = [], scene, sceneDisplayDate, scenePropertiesDate, sceneDate, label, cloud, minCloud = 100, minCloudPosition = -1, currentScenePosition = -1, selectedPosition;
			select = registry.byId("sceneSelect");
			select.set('disabled', false);
			//TODO Update code to use the new geeimageserver REST call - the old one had all the feature collection info - the new one is just scene ids
			if (availableScenes.features.length > 0) {
				populateBandsBoxes(availableScenes.features[0]);
			}
			for ( i = 0; i < availableScenes.features.length; i++) {
				scene = availableScenes.features[i];
				if (scene.properties.DATE_ACQUIRED === undefined) {
					scenePropertiesDate = scene.properties.ACQUISITION_DATE;
					if (scene.id.substr(0,10) === 'COPERNICUS'){ //TODO WE SHOULD GET THE SENTINEL SCENE DATE FROM METADATA AND NOT THE SCENEID AS THIS MAY NOT BE STABLE
						scenePropertiesDate = scene.id.substr(14,4) + "-" + scene.id.substr(18,2) + "-" + scene.id.substr(20,2);
					}
				} else {
					scenePropertiesDate = scene.properties.DATE_ACQUIRED;
				}
				sceneDisplayDate = locale.format(stamp.fromISOString(scenePropertiesDate), {
					selector : "date",
					datePattern : "dd-MM-yyyy"
				});
				// '2004-10-19 10:23:54+02',
				sceneDate = locale.format(stamp.fromISOString(scenePropertiesDate), {
					selector : "date",
					datePattern : "yyyy-MM-dd"
				}) + " " + scene.properties.SCENE_CENTER_TIME;
				if (scene.properties.CLOUD_COVER === undefined) {
					cloud = 0;
					cloud = scene.properties.CLOUDY_PIXEL_PERCENTAGE; //for sentinel2
				} else {
					cloud = Number(scene.properties.CLOUD_COVER.toFixed(0));
				};
				if (cloud <= minCloud) {
					minCloud = cloud;
					minCloudPosition = i;
				}
				if (scene.properties.SENSING_ORBIT_NUMBER === undefined) {
					label = sceneDisplayDate + " Cloud: " + cloud + "% (P" + scene.properties.WRS_PATH + "R" + scene.properties.WRS_ROW + ") "; //for Landsat
				}else {
					label = sceneDisplayDate + " Cloud: " + cloud + "% (Orbit " + scene.properties.SENSING_ORBIT_NUMBER + ") "; //for Sentinel
				}
				options.push({
					'label' : label,
					'value' : scene.id,
					'selected' : false,
					'sceneDate' : sceneDate,
					'sceneProperties' : scene.properties
				});
			}
			array.some(options, function(item, index) {
				if (item.value === currentsceneid) {
					currentScenePosition = index;
					return true;
				}
			});
			if (currentScenePosition >= 0) {
				selectedPosition = currentScenePosition;
			} else {
				selectedPosition = minCloudPosition;
			}
			options[selectedPosition].selected = true;
			currentscenedate = options[selectedPosition].sceneDate;
			select.removeOption(select.getOptions());
			select.addOption(options);
			changeScene(select.value);
			if (domStyle.get(loadingOverlay.overlayNode, "display") !== 'none') {
				loadingOverlay.endLoading();
			}
			if (queryObject.hasOwnProperty("sceneid")) {// programmatically
				// select a
				// scene from
				// the query url
				changeScene(queryObject.sceneid);
				registry.byId("toggleHSV").set("checked", "true");
			}
		}

		function clearBandBoxes() {
			console.log("clearBandBoxes");
			var minval, maxval;
			array.forEach(["red", "green", "blue"], function(item, index) {
				var select = registry.byId(item);
				select.set('disabled', true);
				select.removeOption(select.getOptions());
				select.addOption({
					'label' : " ",
					'value' : " "
				});
			});
			minval = registry.byId("minval");
			minval.set("value", "");
			minval.set('disabled', true);
			maxval = registry.byId("maxval");
			maxval.set("value", "");
			maxval.set('disabled', true);
		}

		function populateBandsBoxes(scene) {
			console.log("populateBandsBoxes");
			var options = [], defaultBands = [], defaultMinMax = [], collectionSelect;
			array.forEach(scene.bands, function(item) {
				options.push({
					'label' : item.id,
					'value' : item.id,
					'selected' : false
				});
			});
			array.forEach(["red", "green", "blue"], function(item) {
				registry.byId(item).set('disabled', false);
			});
			if (registry.byId("red").getOptions().length !== 0) {
				if ((registry.byId("red").getOptions()[0].value === options[0].value)) {// bands have not changed
					return;
				}
			}
			if (queryObject.bands !== undefined) {
				defaultBands = queryObject.bands.split(",");
			} else {
				defaultBands = (scene.bands[0].id === "B1") ? [3, 2, 1] : [2, 1, 0];
			}
			array.forEach(["red", "green", "blue"], function(item, index) {
				var select, optionsclone, selectedValue;
				select = registry.byId(item);
				optionsclone = lang.clone(options);
				optionsclone[defaultBands[index]].selected = true;
				selectedValue = optionsclone[defaultBands[index]].value;
				switch (item) {
				case "red":
					rgbLayer.redBand = selectedValue;
					break;
				case "green":
					rgbLayer.greenBand = selectedValue;
					break;
				case "blue":
					rgbLayer.blueBand = selectedValue;
					break;
				}
				select.removeOption(select.getOptions());
				select.addOption(optionsclone);
				select.set("value", selectedValue);
			});
			collectionSelect = registry.byId("collectionSelect");
			switch (collectionSelect.value) {
			case "LANDSAT/LC8_L1T":
				defaultMinMax = [7000, 14000];
				break;
			case "LANDSAT/LT5_L1T":
			case "LANDSAT/L7_L1T":
				defaultMinMax = [0, 100];
				break;
			case "LANDSAT/LT5_L1T_TOA":
			case "LANDSAT/L7_L1T_TOA":
			case "LANDSAT/LC8_L1T_TOA":
				defaultMinMax = [0, 0.4];
				break;
			case "COPERNICUS/S2":
				defaultMinMax = [ 0, 4000];
				break;
			}
			rgbLayer.min = defaultMinMax[0];
			// this is a hack - the minval text box change event does
			// not fire immediately so we have to set the min property
			// on the rgblayer here
			rgbLayer.max = defaultMinMax[1];
			// this is a hack - the maxval text box change event does
			// not fire immediately so we have to set the max property
			// on the rgblayer here
			registry.byId("minval").set("value", defaultMinMax[0]);
			registry.byId("maxval").set("value", defaultMinMax[1]);
			registry.byId("minval").set('disabled', false);
			registry.byId("maxval").set('disabled', false);
		}

		function changeScene(value) {
			console.log("changeScene");
			var layer, select, sceneproperties;
			select = registry.byId("sceneSelect");
			if (currentsceneid) {
				if (currentsceneid === value) {
					return;
				} else {
					array.some(select.getOptions(), function(item) {
						if (item.value === value) {
							select.set("value", value);
							return true;
						}
					});
				}
				;
			}
			array.forEach(map.layerIds, function(item) {
				layer = map.getLayer(item);
				if (layer.declaredClass === 'jrc/GeeLayer') {
					layer.set("sceneid", value);
				}
				;
			});
			currentsceneid = value;
			currentscenedate = select.getOptions(value).sceneDate;
			populateScenePropertiesGrid(select.getOptions(value).sceneProperties);
		}

		/// OGC SERVICE CALLS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		function wms_getSpectralData() {
			console.log("wms_getSpectralData >>");
			var landcoverTypes = getSelectedLandcoverTypes();
			spectralLayer.cql_filter = "land_cover in('" + landcoverTypes.join("','") + "') AND bands = '" + xAxis + "_" + yAxis + "'";
			spectralLayer.refresh();
			return spectralLayer.deferred;
		}

		function identifyFeatures(identifyPolygonScreen) {
			var identifyPolygonMap = screenUtils.toMapGeometry(spectralMap.extent, spectralMap.width, spectralMap.height, identifyPolygonScreen);
			var extent = identifyPolygonMap.getExtent();
			var landcoverTypes = getSelectedLandcoverTypes();
			var cqlFilterString = "land_cover in('" + landcoverTypes.join("','") + "') AND bands = '" + xAxis + "_" + yAxis + "' AND BBOX(geometry," + extent.xmin.toString() + "," + extent.ymin.toString() + "," + extent.xmax.toString() + "," + extent.ymax.toString() + ")";
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
				if (data.features.length > 0) {
					zoomToSite(data.features[0].properties.oid);
				}
			}, function(err) {
				alert("Unable to get data from WFS");
			});
		}

		// / REST SERVICE CALLS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		function rest_getGlc2000() {
			console.log("rest_getGlc2000 >>");
			var deferred;
			deferred = script.get(restServerUrl + "/especies/_get_glc2000_categories", {
				query : {
					format : 'json'
				},
				jsonp : "callback"
			});
			deferred.then(function(response) {
				console.log("<< rest_getGlc2000");
				if (!response.metadata.success) {
					alert('Unable to get GLC2000 data. ' + response.metadata.error);
				} else {
					array.forEach(response.records, function(item) {
						legendClasses.push(item);
					});
				}
			});
			return deferred;
		}

		function rest_getSiteData() {
			console.log("rest_getSiteData >>");
			var ll, ur, params, deferred;
			ll = utils.xyToLngLat(map.extent.xmin, map.extent.ymin);
			ur = utils.xyToLngLat(map.extent.xmax, map.extent.ymax);
			deferred = script.get(restServerUrl + "/especies/_get_gee_validation_sites", {
				query : {
					llx : ll[0],
					lly : ll[1],
					urx : ur[0],
					ury : ur[1],
					dplimit : 4
					// fields : "oid,lat,lng,land_cover"
				},
				jsonp : "callback"
			});
			deferred.then(function(response) {
				console.log("<< rest_getSiteData");
				if (!response.metadata.success) {
					alert('Unable to get training site records. ' + response.metadata.error);
				} else {
					siteData.length = 0;
					array.forEach(response.records, function(item) {
						siteData.push(item);
					});
				}
			});
			return deferred;
		}

		function rest_getSingleSiteData(oid) {
			console.log("rest_getSingleSiteData >>");
			var deferred;
			deferred = script.get(restServerUrl + "/especies/_get_gee_validation_site", {
				query : {
					oid : oid
				},
				jsonp : "callback"
			});
			return deferred;
		}

		function rest_deleteSite(oid) {
			console.log("rest_deleteSite >>");
			var deferred;
			deferred = script.get(restServerUrl + "/especies/_delete_gee_validation_record", {
				query : {
					oid : oid
				},
				jsonp : "callback"
			});
			deferred.then(lang.hitch(oid, function(response) {
				console.log("<< rest_deleteSite");
				if (!response.metadata.success) {
					alert('Unable to delete site record. ' + response.metadata.error);
				} else {
					if (response.records[0].delete_gee_validation_record === 't') {
						removeGraphic(oid);
					} else {
						removeGraphic(oid);
						// a draft site
					}
				}
			}));
			return deferred;
		}

		function rest_getPathRow(centroid) {
			console.log("rest_getPathRow >>");
			var deferred, latlng;
			latlng = utils.webMercatorToGeographic(centroid);
			deferred = script.get(restServerUrl + "/especies/_get_path_row", {
				query : {
					lat : latlng.y,
					lng : latlng.x
				},
				jsonp : "callback"
			});
			deferred.then(function(response) {
				console.log("<< rest_getPathRow");
				if (response.records.length > 0) {
					path_row = "P" + response.records[0].path + "R" + response.records[0].row;
				}
			});
			return deferred;
		}

		function rest_getScenesForCentroid(centroid) {
			console.log("rest_getScenesForCentroid >>");
			var deferred;
			var latlng = utils.webMercatorToGeographic(centroid);
			domUtils.show(dom.byId("scenesLoadingImg"));
			deferred = script.get(geeImageServerUrl + "/getScenesForPoint", {
				query : {
					collection : registry.byId("collectionSelect").value,
					lng: latlng.x,
					lat: latlng.y,
					crs : "EPSG:102100"
				},
				jsonp : "callback"
			});
			deferred.then(function(response) {
				console.log("<< rest_getScenesForCentroid");
				domUtils.hide(dom.byId("scenesLoadingImg"));
				populateScenesBox(response);
			});
			return deferred;
		}

		function rest_createDraftSites() {
			console.log("rest_createDraftSites >>");
			domStyle.set(win.body(), "cursor", "wait");
			var deferred;
			deferred = script.get(geeServerUrl + "createValidationSites", {
				query : {
					username : currentUsername,
					sceneid : currentsceneid,
					scenedate : currentscenedate,
					draftSites : json.stringify(draftSites)
				},
				jsonp : "callback"
			});
			deferred.then(function(response) {
				console.log("<< rest_createDraftSites");
				if (response.rowcount < draftSites.length) {
					alert('Not all sites were captured');
				}
				if (response.hasOwnProperty("metadata")) {
					alert('Unable to create sites: ' + response.metadata.error);
				}
				clearDraftSites();
				domStyle.set(win.body(), "cursor", "default");
			});
			return deferred;
		}

		function rest_getValuesForPoint(latlong) {
			console.log("rest_getValuesForPoint >>");
			var deferred;
			deferred = script.get(geeImageServerUrl + "/getValuesForPoint", {
				query : {
					lng : latlong.x,
					lat: latlong.y,
					sceneid : currentsceneid,
				},
				jsonp : "callback"
			});
			return deferred;
		}

		function rest_getDetectionAlgorithms(username) {
			console.log("rest_getDetectionAlgorithms >>");
			var deferred;
			deferred = script.get(restServerUrl + "/especies/_get_gee_detection_algorithms", {
				query : {
					username : username,
					format : 'json'
				},
				jsonp : "callback"
			});
			return deferred;
		}

		function rest_addDetectionAlgorithms(algorithm) {
			console.log("rest_addDetectionAlgorithms >>");
			var deferred;
			var username = (currentUsername === undefined) ? "default" : currentUsername;
			deferred = script.get(restServerUrl + "/especies/_insert_gee_detection_algorithm", {
				query : {
					algorithm : json.stringify(algorithm),
					username : username,
					format : 'json'
				},
				jsonp : "callback"
			});
			return deferred;
		}

		function rest_deleteDetectionAlgorithms(algorithm_oid) {
			console.log("rest_deleteDetectionAlgorithms >>");
			var deferred;
			deferred = script.get(restServerUrl + "/especies/_delete_gee_detection_algorithm", {
				query : {
					algorithm_oid : algorithm_oid,
					format : 'json'
				},
				jsonp : "callback"
			});
			return deferred;
		}

		function rest_updateDetectionAlgorithms(algorithm) {
			console.log("rest_updateDetectionAlgorithms >>");
			var deferred;
			deferred = script.get(restServerUrl + "/especies/_update_gee_detection_algorithm", {
				query : {
					algorithm_oid : algorithm.oid,
					algorithm : json.stringify(algorithm),
					format : 'json'
				},
				jsonp : "callback"
			});
			return deferred;
		}

		// END OF WEB SERVICE CALLS////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		// LOGIN/LOGOUT FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		function showLoginForm() {
			var MessageBox = {}, loginBox, deferred, handler, handlers = [];
			MessageBox.confirm = function() {
				loginBox = new LoginBox({

				});
				loginBox.startup();
				deferred = new Deferred();
				var destroyDialog = function() {
					array.forEach(handlers, function(handler) {
						handler.remove();
					});
					loginBox.destroyRecursive();
				};
				handler = aspect.after(loginBox, "onExecute", function() {
					deferred.resolve({
						username : loginBox.content.username.value,
						password : loginBox.content.password.value
					});
					destroyDialog();
				});
				handlers.push(handler);
				handler = aspect.after(loginBox, "onCancel", function() {
					deferred.reject("Login box cancelled");
					destroyDialog();
				});
				handlers.push(handler);
				loginBox.show();
				return deferred;
			};
			MessageBox.confirm().then(function(value) {
				domStyle.set(win.body(), "cursor", "wait");
				username = value.username;
				params = {
					username : username,
					password : value.password
				};
				script.get(restServerUrl + "/especies/get_user_api_key", {
					query : params,
					jsonp : "callback"
				}).then(function(response) {
					domStyle.set(win.body(), "cursor", "default");
					if (!response.metadata.success) {
						alert('Unable to login. ' + response.metadata.error);
					} else {
						if (response.records.length === 1) {
							api_key = response.records[0].get_user_api_key;
							login(username);
						} else {
							alert('Invalid user');
						}
					}
				});
			}, function(error) {
				console.log("Login form cancelled");
			});
		}

		function login(username) {
			loggedIn = true;
			currentUsername = username;
			console.log("Logged in as " + username);
			var loginlink = dojo.byId("loginLink");
			loginlink.innerHTML = username;
			loginlink.title = "Click here to log out";
			loginhandler.remove();
			on.once(loginlink, "click", function() {
				logout();
			});
			loadAlgorithmsForUser(currentUsername);
		}

		function logout() {
			loggedIn = false;
			currentUsername = undefined;
			console.log("Logged out");
			api_key = undefined;
			var loginlink = dojo.byId("loginLink");
			loginlink.innerHTML = "Login";
			loginlink.title = "Click here to log in";
			loginhandler = on(loginlink, "click", function() {
				showLoginForm();
			});
			if (draftSites.length > 0) {
				clearDraftSites();
			}
			loadAlgorithmsForUser("default");
		}

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// END OF LOGIN/LOGOUT FUNCTIONS
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// LEGEND, SPECTRAL MAP AND QUERY GRID INITIALISATION
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		function createLegend() {
			console.log("createLegend");
			array.forEach(legendClasses, function(item) {
				legendBox = new LegendBox(item);
				legendBox.startup();
				domConstruct.place(legendBox.domNode, "landcoverclasses");
				legendCheckBox = new LegendCheckBox(item);
				legendCheckBox.startup();
				domConstruct.place(legendCheckBox.domNode, "classTogglers");
			});
		}

		function selectDefaultClasses() {
			array.forEach(registry.findWidgets(dom.byId("landcoverclasses")), function(item) {
				if (item.land_cover === 'Waterbodies') {
					item.radiobutton.set("checked", "true");
				}
			});
			array.forEach(registry.findWidgets(dom.byId("classTogglers")), function(item) {
				if (item.land_cover === 'Waterbodies' || item.land_cover === 'Lava flow') {
					item.checkbox.set("checked", "true");
				}
			});
		}

		function createSpectralMap() {
			console.log("createSpectralMap");
			spectralMap = new Map("spectralChart", {
				extent : initialSpectralMapExtent,
				logo : false
			});
			spectralMap.on("load", function() {
				spectralMap.hideZoomSlider();
				editToolbar = new Edit(spectralMap);
				on(editToolbar, "graphic-move-stop", editComplete);
				on(editToolbar, "scale-stop", editComplete);
				on(editToolbar, "graphic-move-stop", editComplete);
				on(editToolbar, "vertex-add", editComplete);
				on(editToolbar, "vertex-delete", editComplete);
				on(editToolbar, "vertex-move-stop", editComplete);
				on(editToolbar, "deactivate", editDeactivated);
				algorithmLayer.on("click", function(evt) {
					event.stop(evt);
					topic.publish("startEditSession", {
						graphic : evt.graphic
					});
				});
				spectralMap.on("click", function(evt) {
					topic.publish("spectralMap endEditSession");
					spectralMapClick(evt);
				});
				spectralMap.on("mouse-move", function(evt) {
					console.log('spectralMap mousemove');
					domStyle.set("info", "left", evt.offsetX + 35 + "px");
					domStyle.set("info", "top", evt.offsetY + 45 + "px");
					var xvalue = (xAxis === 'hue') ? parseInt(evt.mapPoint.x * xscale) : ((evt.mapPoint.x * xscale) + xOffset).toFixed(3);
					var yvalue = (yAxis === 'hue') ? parseInt(evt.mapPoint.y * yscale) : ((evt.mapPoint.y * yscale) + yOffset).toFixed(3);
					dom.byId("info").innerHTML = xAxis + ": " + xvalue + " " + yAxis + ": " + yvalue;
				});
				spectralMap.on("extent-change", function(evt) {
					console.log('spectralMap extent-change');
					addAxesTitles();
				});
				on(dom.byId("spectralChart"), mouse.leave, function(evt) {
					console.log('spectralMap mouseleave');
					domStyle.set("info", "display", "none");
				});
				on(dom.byId("spectralChart"), mouse.enter, function(evt) {
					console.log('spectralMap mouseenter');
					if (showCursorValues) {
						domStyle.set("info", "display", "block");
					};
				});
			});
			spectralLayer = new wmsFilterLayer(WMS_ENDPOINT, LAYER_NAME);
			on(spectralLayer, "update-start", function(event) {
				domStyle.set("chartLoadingImg", 'display', 'block');
			});
			on(spectralLayer, "update-end", function(event) {
				if (event.error) {
					alert("GeoServer Error: " + event.error.message);
				} else {
					domStyle.set("chartLoadingImg", 'display', 'none');
				};
			});
			testLayer = new wmsFilterLayer(WMS_ENDPOINT, LAYER_NAME + "_complete");
			on(testLayer, "update-start", function(event) {
				domStyle.set("chartLoadingImg", 'display', 'block');
			});
			on(testLayer, "update-end", function(event) {
				if (event.error) {
					alert("GeoServer Error: " + event.error.message);
				} else {
					domStyle.set("chartLoadingImg", 'display', 'none');
				};
			});
			spectralLayer.cql_filter = "land_cover in('Waterbodies','Lava flow') AND bands = 'val_hue'";
			testLayer.cql_filter = "land_cover in('No landcover')";
			//empty to start with
			axesLayer = new GraphicsLayer();
			algorithmLayer = new GraphicsLayer();
			queryLayer = new GraphicsLayer();
			triangulationLayer = new GraphicsLayer({
				visible : false
			});
			//TODO reinstate the testLayer if you want to be able to do more than one spectral domain
			spectralMap.addLayers([axesLayer, spectralLayer, algorithmLayer, queryLayer, triangulationLayer]);
//			spectralMap.addLayers([axesLayer, spectralLayer, testLayer, algorithmLayer, queryLayer, triangulationLayer]);
		}

		function addAxesTitles() {
			axesLayer.clear();
			if ((xAxis === 'ndvi') || (xAxis === 'ndwi') || (xAxis === 'band10')) {
				axisMinx = -1;
			} else {
				axisMinx = (spectralMap.extent.xmin < 0) ? 0 : spectralMap.extent.xmin;
			};
			if ((yAxis === 'ndvi') || (yAxis === 'ndwi') || (yAxis === 'band10')) {
				axisMiny = -1;
			} else {
				axisMiny = (spectralMap.extent.ymin < 0) ? 0 : spectralMap.extent.ymin;
			};
			var polygon = new Polygon([[[axisMinx, axisMiny], [20, axisMiny], [20, -20], [-20, -20], [-20, 20], [axisMinx, 20], [axisMinx, axisMiny]]]);
			axesLayer.add(new Graphic(polygon, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([220, 220, 220]), 1), new Color([250, 250, 250]))));
			var midX = ((spectralMap.extent.xmax - axisMinx) / 2) + axisMinx;
			var midY = ((spectralMap.extent.ymax - axisMiny) / 2) + axisMiny;
			var xAxisTextSymbol = new TextSymbol(xAxis).setColor(textColor).setFont(new Font("12pt")).setOffset(0, -35);
			var yAxisTextSymbol = new TextSymbol(yAxis).setColor(textColor).setFont(new Font("12pt")).setOffset(-32, 0).setAngle(-90);
			xAxisTitleGraphic = new Graphic(new Point(midX, axisMiny), xAxisTextSymbol);
			yAxisTitleGraphic = new Graphic(new Point(axisMinx, midY), yAxisTextSymbol);
			axesLayer.add(xAxisTitleGraphic);
			axesLayer.add(yAxisTitleGraphic);
			addTicMarks("x");
			addTicMarks("y");
		}

		function addTicMarks(axis) {
			var ticMark = [], scale, maxExtent, minExtent, fixedDP = 1, value, axisStep = 0.1, range;
			if (axis === "x") {
				scale = xscale;
				maxExtent = spectralMap.extent.xmax;
				minExtent = axisMinx;
			} else {
				scale = yscale;
				maxExtent = spectralMap.extent.ymax;
				minExtent = axisMiny;
			};
			range = maxExtent - minExtent;
			if (range > 5) {
				fixedDP = 0;
				axisStep = 0.5;
			} else if (range > 1) {
				fixedDP = 1;
				axisStep = 0.1;
			} else if (range > 0.5) {
				fixedDP = 2;
				axisStep = 0.05;
			} else if (range > 0.2) {
				fixedDP = 2;
				axisStep = 0.02;
			} else if (range > 0) {
				fixedDP = 2;
				axisStep = 0.01;
			}
			;
			if (scale !== 1) {
				fixedDP = 0;
			};
			for ( i = minExtent; i < maxExtent; i = i + axisStep) {
				ticMark.push(i);
			};
			var lineScreen = new Polyline([[0, 0], [0, 5]]);
			var lineMap = screenUtils.toMapGeometry(spectralMap.extent, spectralMap.width, spectralMap.height, lineScreen);
			var ticLengthMap = lineMap.paths[0][0][1] - lineMap.paths[0][1][1];
			array.forEach(ticMark, function(tic, index) {
				if (scale === 60) {
					minExtent = (273 - 60);
					//for thermal data
				};
				value = ((index * axisStep * scale) + minExtent).toFixed(fixedDP);
				if ((scale === 360) && (value > 360)) {
					return;
				};
				if (axis === "x") {
					axesLayer.add(new Graphic(new Point(tic, axisMiny), new TextSymbol(value).setColor(textColor).setOffset(0, -18).setFont(new Font("8pt"))));
					axesLayer.add(new Graphic(new Polyline([[tic, axisMiny], [tic, axisMiny - ticLengthMap]]), new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([220, 220, 220]), 1)));
				} else {
					axesLayer.add(new Graphic(new Point(axisMinx, tic), new TextSymbol(value).setColor(textColor).setOffset(-16, -3).setFont(new Font("8pt"))));
					axesLayer.add(new Graphic(new Polyline([[axisMinx, tic], [axisMinx - ticLengthMap, tic]]), new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([220, 220, 220]), 1)));
				};
			});
		}

		function fullScreenButtonClick(evt) {
			if (this.label === "Full screen") {
				chartFullScreen();
				this.set("label", "Exit full screen");
				this.set("iconClass", "jrcChartIcons jrcChartIconsNormalScreen");
			} else {
				chartNormalScreen();
				this.set("label", "Full screen");
				this.set("iconClass", "jrcChartIcons jrcChartIconsFullScreen");
			};
		}

		function toggleAlgorithm(evt) {
			if (this.checked) {
				algorithmLayer.show();
				this.set("label", "Hide the algorithm line");
				this.set("iconClass", "jrcChartIcons jrcChartIconsToggleAlgorithmVisible");
			} else {
				topic.publish("endEditSession");
				algorithmLayer.hide();
				this.set("label", "Show the algorithm line");
				this.set("iconClass", "jrcChartIcons jrcChartIconsToggleAlgorithmHidden");
			};
		}

		function toggleTrainingSites() {
			if (this.checked) {
				spectralLayer.show();
				this.set("label", "Hide the training sites");
				this.set("iconClass", "jrcChartIcons jrcChartIconsToggleSitesVisible");
			} else {
				spectralLayer.hide();
				this.set("label", "Show the training sites");
				this.set("iconClass", "jrcChartIcons jrcChartIconsToggleSitesHidden");
			};
		}

		function toggleTriangulation() {
			if (this.checked) {
				drawTriangulation();
				triangulationLayer.show();
				this.set("label", "Hide the algorithm triangulation");
				this.set("iconClass", "jrcChartIcons jrcChartIconsToggleTriangulationVisible");
			} else {
				triangulationLayer.hide();
				this.set("label", "Show the algorithm triangulation");
				this.set("iconClass", "jrcChartIcons jrcChartIconsToggleTriangulationHidden");
			};
		}

		function toggleCursorXYValues() {
			if (this.checked) {
				this.set("label", "Hide the cursor xy values");
				this.set("iconClass", "jrcChartIcons jrcChartIconsToggleXYValuesVisible");
			} else {
				this.set("label", "Show the cursor xy values");
				this.set("iconClass", "jrcChartIcons jrcChartIconsToggleXYValuesHidden");
			};
			showCursorValues = !showCursorValues;
		}

		function toggleAxes() {
			if (this.checked) {
				axesLayer.show();
				this.set("label", "Hide the chart axes");
				this.set("iconClass", "jrcChartIcons jrcChartIconsToggleAxisVisible");
			} else {
				axesLayer.hide();
				this.set("label", "Show the chart axes");
				this.set("iconClass", "jrcChartIcons jrcChartIconsToggleAxisHidden");
			};
			showAxes = !showAxes;
		}

		function spectralMapClick(event) {
			console.log("spectralMapClick");
			var screenPoint = event.screenPoint;
			var clickArea = new Polygon([[screenPoint.x - IDENTIFY_RADIUS, screenPoint.y - IDENTIFY_RADIUS], [screenPoint.x - IDENTIFY_RADIUS, screenPoint.y + IDENTIFY_RADIUS], [screenPoint.x + IDENTIFY_RADIUS, screenPoint.y + IDENTIFY_RADIUS], [screenPoint.x + IDENTIFY_RADIUS, screenPoint.y - IDENTIFY_RADIUS]]);
			identifyFeatures(clickArea);
		}

		function createScenePropertiesGrid() {
			console.log("createScenePropertiesGrid");
			scenePropertiesGrid = new Grid({
				columns : {
					propertyKey : 'Key',
					propertyValue : 'Value'
				}
			}, "scenePropertiesGridContainer");
		}

		function closeDropDownMenu() {
			registry.byId("classesDropDown").closeDropDown(false);
		}

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// END OF LEGEND, CHART AND QUERY GRID INITIALISATION
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// ALGORITHM METHODS AND EVENTS
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		function chartFullScreen() {
			var fullScreenDomNode = domConstruct.place("<div id='fullscreendiv'></div>", document.body);
			resizeSpectralMap(fullScreenDomNode.offsetWidth, fullScreenDomNode.offsetHeight);
			domConstruct.place("spectralChartToolbarContainer", fullScreenDomNode);
			domConstruct.place("spectralChart", fullScreenDomNode);
			domConstruct.place("chartLoadingImg", fullScreenDomNode);
		}

		function chartNormalScreen() {
			var currentCenterPoint = spectralMap.extent.getCenter();
			domConstruct.place("spectralChartToolbarContainer", "spectralTabContainer", "before");
			domConstruct.place("spectralChart", "spectralTabContainer", "before");
			resizeSpectralMap(400, 400);
			domConstruct.place("chartLoadingImg", "spectralTabContainer", "before");
			domConstruct.destroy(dom.byId("fullscreendiv"));
		}

		function fullExtent() {
			var xaxisTitlePointScreen = screenUtils.toScreenGeometry(spectralMap.extent, spectralMap.width, spectralMap.height, xAxisTitleGraphic.geometry);
			var yaxisTitlePointScreen = screenUtils.toScreenGeometry(spectralMap.extent, spectralMap.width, spectralMap.height, yAxisTitleGraphic.geometry);
			var minxPtScreen = new Point(yaxisTitlePointScreen.x - 60, yaxisTitlePointScreen.y);
			var minyPtScreen = new Point(xaxisTitlePointScreen.x, xaxisTitlePointScreen.y + 60);
			var minxPt = screenUtils.toMapPoint(spectralMap.extent, spectralMap.width, spectralMap.height, minxPtScreen);
			var minyPt = screenUtils.toMapPoint(spectralMap.extent, spectralMap.width, spectralMap.height, minyPtScreen);
			spectralMap.setExtent(new Extent(minxPt.x, minyPt.y, 1, 1, new SpatialReference({
				wkid : 4326
			}, true)));

		}

		function resizeSpectralMap(width, height) {
			var centerPoint = spectralMap.extent.getCenter();
			domStyle.set('spectralChart', "width", width);
			domStyle.set('spectralChart', "height", height);
			spectralMap.resize(true);
			spectralMap.setVisibility(false);
			on.once(spectralMap, "extent-change", function(event) {
				spectralMap.setVisibility(true);
			});
			spectralMap.centerAt(centerPoint);
			domStyle.set("chartLoadingImg", "top", (Math.round(height / 2)) - 8 + "px");
			domStyle.set("chartLoadingImg", "left", (Math.round(width / 2)) - 8 + "px");
		}

		// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// LOADING AND SAVING ALGORITHM CODE
		// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		function loadAlgorithmsForUser(username) {
			console.log("loadAlgorithmsForUser " + username);
			var deferred = rest_getDetectionAlgorithms(username);
			deferred.then(function(response) {
				console.log("<< rest_getDetectionAlgorithms");
				clearAlgorithmsInList();
				algorithms = [];
				if (response.records.length > 0) {
					array.forEach(response.records, function(item) {
						var algorithm = json.parse(item.algorithm);
						algorithm.oid = item.algorithm_oid;
						algorithms.push(algorithm);
						topic.publish("algorithmCountChanged", {
							action : 'loadedFromREST',
							algorithm : algorithm
						});
					});
				} else {
					// no algorithms are available for the current user
					// - so copy the default one to the users account
					topic.publish("algorithmCountChanged", {
						action : 'added',
						algorithm : currentAlgorithm
					});
				}
			});
		}

		function algorithmCountChanged(event) {
			console.log("algorithmCountChanged " + event.action);
			switch (event.action) {
			case "loadedFromREST":
				addAlgorithmToList(event.algorithm);
				if (detectionLayer !== undefined) {
					detectionLayer.detectExpression = event.algorithm.expression;
				}
				break;
			case "added":
				var deferred = rest_addDetectionAlgorithms(event.algorithm);
				deferred.then(function(response) {
					console.log("<< rest_addDetectionAlgorithms");
					if (!response.metadata.success) {
						alert('Unable to create a new algorithm ' + response.metadata.error);
						console.log("Unable to create a new algorithm " + response.metadata.error);
					} else {
						event.algorithm.oid = response.records[0]._insert_gee_detection_algorithm;
						algorithms.push(event.algorithm);
						addAlgorithmToList(event.algorithm);
						console.log("Algorithm created on the server");
					};
				});
				break;
			case "deleted":
				var deferred = rest_deleteDetectionAlgorithms(event.algorithm.oid);
				deferred.then(function(response) {
					if (!response.metadata.success) {
						alert('Unable to delete algorithm ' + response.metadata.error);
						console.log("Unable to delete algorithm " + response.metadata.error);
					} else {
						removeAlgorithmFromList(event.algorithm.value);
						console.log("Algorithm deleted on the server");
					};
				});
				break;
			}
			var testAlgorithms = registry.byId("testAlgorithmsSelect");
		}

		function saveCurrentAlgorithm(evt) {
			console.log('saveCurrentAlgorithm');
			var deferred = rest_updateDetectionAlgorithms(currentAlgorithm);
			deferred.then(function(response) {
				console.log("<< rest_updateDetectionAlgorithms");
				if (!response.metadata.success) {
					alert('Unable to save algorithm ' + response.metadata.error);
					console.log("Unable to save algorithm " + response.metadata.error);
				} else {
					removeAlgorithmFromList(event.algorithm.value);
					console.log("Algorithm saved on the server");
				};
			});
		}

		function loadAlgorithm(event) {
			console.log("loadAlgorithm");
			topic.publish("algorithmCountChanged", {
				action : 'added',
				algorithm : json.parse(event.text)
			});
		}

		function runAlgorithm() {
			console.log('runAlgorithm with expression:' + currentAlgorithm.expression);
			registry.byId("runAlgorithm").set("disabled", true);
			registry.byId("runAlgorithm").set("iconClass", "jrcChartIcons jrcChartIconsRunDisabled");
			canvasLayer.highlightChange(detectionLayer);
			detectionLayer.detectExpression = currentAlgorithm.expression;
			detectionLayer.refresh();
		}

		function testAlgorithm() {
			console.log('testing algorithm');
			var value = registry.byId("testAlgorithmSelect").value;
			var algorithm = registry.byId("testAlgorithmSelect").getOptions(value).algorithm;
			var sqlText = algorithm.expression.replace(/&&/g, " AND ");
			sqlText = sqlText.replace(/\|\|/g, " OR ");
			sqlText = sqlText.replace(/b\('/g, "");
			sqlText = sqlText.replace(/'\)/g, "");
			sqlText = sqlText.replace(/B/g, "band");
			console.log(sqlText);
			var landcoverTypes = getSelectedLandcoverTypes();
			var cql_filter = sqlText + " AND land_cover in('" + landcoverTypes.join("','") + "') AND bands = '" + xAxis + "_" + yAxis + "'";
			testLayer.cql_filter = cql_filter;
			testLayer.refresh();
		}

		function clearSelectedSites() {
			testLayer.cql_filter = "land_cover = 'none'";
			testLayer.refresh();
		}

		function saveNewAlgorithm(evt) {
			console.log('saveNewAlgorithm');
			var pointScreen = screenUtils.toScreenGeometry(spectralMap.extent, spectralMap.width, spectralMap.height, spectralMap.extent.getCenter());
			var extentScreen = new Polygon([[pointScreen.x - 100, pointScreen.y - 100], [pointScreen.x + 100, pointScreen.y - 100], [pointScreen.x + 100, pointScreen.y + 100], [pointScreen.x - 100, pointScreen.y + 100], [pointScreen.x - 100, pointScreen.y - 100]]);
			var extentMap = screenUtils.toMapGeometry(spectralMap.extent, spectralMap.width, spectralMap.height, extentScreen);
			points = [];
			array.forEach(extentMap.rings[0], function(point) {
				points.push({
					x : (point[0] * xscale) + xOffset,
					y : (point[1] * yscale) + yOffset
				});
			});
			var nowTime = stamp.toISOString(new Date());
			var displayDate = locale.format(stamp.fromISOString(nowTime), {
				datePattern : "dd-MM-yyyy",
				timePattern : "HH:mm.ss"
			});
			var algorithm = {
				value : displayDate,
				label : evt.name + " (" + displayDate + ")",
				points : lang.clone(points),
				expression : getAlgorithmExpression(),
				xAxis : xAxis,
				yAxis : yAxis
			};
			topic.publish("algorithmCountChanged", {
				action : 'added',
				algorithm : algorithm
			});
			if (algorithmLayer.visible === false) {
				registry.byId("toggleAlgorithmButton").set("checked", true);
				registry.byId("toggleAlgorithmButton").emit("Click", {});
			};
		}

		function addAlgorithmToList(algorithm) {
			console.log("addAlgorithmToList");
			var algorithmList = registry.byId("algorithmList");
			algorithmList.addOption({
				label : algorithm.label,
				value : algorithm.value,
				selected : true,
				algorithm : algorithm
			});
			var testAlgorithmSelect = registry.byId("testAlgorithmSelect");
			testAlgorithmSelect.addOption({
				label : algorithm.label,
				value : algorithm.value,
				selected : true,
				algorithm : algorithm
			});
			algorithmList.set("value", algorithm.value);
		}

		function removeAlgorithmFromList(value) {
			console.log("removeAlgorithmFromList");
			var algorithmList = registry.byId("algorithmList");
			algorithmList.removeOption(algorithmList.getOptions(value));
		}

		function clearAlgorithmsInList() {
			console.log("clearAlgorithmsInList");
			var algorithmList = registry.byId("algorithmList");
			if (algorithmList) algorithmList.removeOption(algorithmList.getOptions());
		}

		function openLoadAlgorithmDialog() {
			var position = domGeom.position(registry.byId("openAlgorithm").domNode, true);
			var domNode = domConstruct.place(loadTextDialog.domNode, document.body);
			domStyle.set(domNode, "left", position.x + 20 + "px");
			domStyle.set(domNode, "top", position.y + 20 + "px");
			domStyle.set(domNode, 'display', 'block');
			focusUtil.focus(loadTextDialog.textInput);
		}

		function openNewAlgorithmDialog() {
			console.log("openNewAlgorithmDialog");
			var position = domGeom.position(registry.byId("createNewAlgorithmButton").domNode, true);
			var domNode = domConstruct.place(algorithmNameDialog.domNode, document.body);
			domStyle.set(domNode, "left", position.x + 20 + "px");
			domStyle.set(domNode, "top", position.y + 20 + "px");
			domStyle.set(domNode, 'display', 'block');
			focusUtil.focus(algorithmNameDialog.textInput);
		}

		function saveAlgorithmToFile() {
			console.log("saveAlgorithmToFile");
			var filename = "algorithm_oid_" + currentAlgorithm.oid;
			request.post(geeImageServerUrl + "/createDownloadFile", {
				data : {
					"filename" : filename,
					"algorithm" : json.stringify(currentAlgorithm)
				},
				headers : {
					"X-Requested-With" : ""
				}
			}).then(function(url) {
				var url = "http://storage.googleapis.com" + url;
				window.location = url;

			});
		}

		function changeAlgorithm(value) {
			if (value) {
				currentAlgorithm = registry.byId("algorithmList").getOptions(value).algorithm;
				console.log('changeAlgorithm to ' + currentAlgorithm.label);
				points = lang.clone(currentAlgorithm.points);
				if ((currentAlgorithm.xAxis !== xAxis) || (currentAlgorithm.yAxis !== yAxis)) {
					registry.byId("xAxisSelect").set("value", currentAlgorithm.xAxis);
					registry.byId("yAxisSelect").set("value", currentAlgorithm.yAxis);
					changeChartAxis();
				};
				topic.publish("endEditSession");
				topic.publish("pointsModified");
				if (algorithms.length === 1) {
					registry.byId("deleteAlgorithmButton").set("disabled", true);
				} else {
					registry.byId("deleteAlgorithmButton").set("disabled", false);
				};
				if (value === "None") {
					registry.byId("deleteAlgorithmButton").set("disabled", true);
					registry.byId("runAlgorithm").set("disabled", true);
					registry.byId("runAlgorithm").set("iconClass", "jrcChartIcons jrcChartIconsRunDisabled");
				} else {
					registry.byId("runAlgorithm").set("disabled", false);
					registry.byId("runAlgorithm").set("iconClass", "jrcChartIcons jrcChartIconsRun");
				};
			};
		}

		function deleteAlgorithm() {
			console.log("deleteAlgorithm");
			var algorithmList, algorithmClone;
			algorithmList = registry.byId("algorithmList");
			array.some(algorithms, function(item, index) {
				if (item.value === algorithmList.value) {
					algorithmClone = lang.clone(algorithms[index]);
					algorithms.splice(index, 1);
					topic.publish("algorithmCountChanged", {
						action : 'deleted',
						algorithm : algorithmClone
					});
					return true;
				}
			});
		}

		function editComplete() {
			console.log("editComplete");
			var currentState = editToolbar.getCurrentState();
			if (currentState.isModified) {
				points.length = 0;
				array.forEach(currentState.graphic.geometry.rings[0], function(point) {
					points.push({
						x : (point[0] * xscale) + xOffset,
						y : (point[1] * yscale) + yOffset
					});
				});
				topic.publish("pointsModified");
			}
		}

		function editDeactivated(event) {
			console.log("editDeactivated");
			if (event.info.isModified) {
				saveCurrentAlgorithm();
			} else {
				console.log("Algorithm points not modified");
			}
		}

		function endEditSession() {
			console.log("endEditSession");
			editToolbar.deactivate();
		}

		function startEditSession(event) {
			console.log("startEditSession");
			editToolbar.activate(Edit.MOVE | Edit.SCALE | Edit.EDIT_VERTICES, event.graphic);
		}

		function pointsModified() {
			console.log("pointsModified");
			var polygon, graphic, coords = [];
			if (points.length === 0) {
				return;
			}
			currentAlgorithm.points = points;
			currentAlgorithm.expression = getAlgorithmExpression();
			if (triangulationLayer.visible) {
				drawTriangulation();
			};
			algorithmLayer.clear();
			array.forEach(points, function(point) {
				coords.push([(point.x - xOffset) / xscale, (point.y - yOffset) / yscale]);
			});
			polygon = new Polygon(coords);
			graphic = new Graphic(polygon, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25])));
			algorithmLayer.add(graphic);
			registry.byId("runAlgorithm").set("disabled", false);
			registry.byId("runAlgorithm").set("iconClass", "jrcChartIcons jrcChartIconsRun");
		}

		function getAlgorithmExpression() {
			var equations = [], closedAlgorithmLine, triangles, groupNode, group;
			console.log("getAlgorithmExpression");
			closedAlgorithmLine = (points[0].x === points[points.length - 1].x) && (points[0].y === points[points.length - 1].y);
			var xBandName = (xAxis[0] === "b") ? "B" + xAxis.substr(4) : xAxis;
			var yBandName = (yAxis[0] === "b") ? "B" + yAxis.substr(4) : yAxis;
			if (closedAlgorithmLine) {
				triangles = triangulate();
				array.forEach(triangles, function(triangle) {
					equations.push(getTriangleExpression(triangle.points_, xBandName, yBandName));
				});
			} else {
				array.forEach(points, function(item, index) {
					var p1, p2, slope, intercept, interceptString, operator, equation, minx, maxx;
					if (index > 0) {
						p1 = points[index - 1];
						p2 = points[index];
						slope = (p2.y - p1.y) / (p2.x - p1.x);
						intercept = p1.y - (p1.x * slope);
						interceptString = (intercept >= 0) ? "+" + intercept : intercept;
						operator = (slope >= 0) ? ">" : "<";
						if (slope === Infinity) {
							equation = "((b('" + xBandName + "')<" + p1.x + ")&&(b('" + yBandName + "')<" + p2.y + ")&&(b('" + yBandName + "')>" + p1.y + "))";
						} else {
							if (slope === 0) {
								equation = "((b('" + yBandName + "')>" + p1.y + ")&&(b('" + xBandName + "')<" + p2.x + ")&&(b('" + xBandName + "')>" + p1.x + "))";
							} else {
								equation = "((b('" + yBandName + "')" + operator + "(" + slope + "*b('" + xBandName + "'))" + interceptString + ")&&(b('" + yBandName + "')<" + p2.y + ")&&(b('" + yBandName + "')>" + p1.y + "))";
							}
						}
						equations.push(equation);
					}
				});
			}
			console.log(equations.join("||"));
			return "(" + equations.join("||") + ")";
		}

		function drawTriangulation() {
			triangles = triangulate();
			triangulationLayer.clear();
			array.forEach(triangles, function(triangle) {
				drawTriangle(triangle);
			});
		}

		function triangulate() {
			var allPoints = [], swctx;
			array.forEach(points, function(item, index) {
				if (index < points.length - 1) {
					var point = new poly2tri.Point(item.x, item.y);
					allPoints.push(point);
				}
			});
			swctx = new poly2tri.SweepContext(allPoints);
			swctx.triangulate();
			return swctx.getTriangles();
		}

		function drawTriangle(triangle) {
			var coords = [];
			triangle.points_.push(triangle.points_[0]);
			array.forEach(triangle.points_, function(point) {
				coords.push([(point.x - xOffset) / xscale, (point.y - yOffset) / yscale]);
			});
			var polygon = new Polygon(coords);
			var g = new Graphic(polygon, new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([200, 200, 200]), 1)));
			triangulationLayer.add(g);
		}

		function getTriangleExpression(points, xBandName, yBandName) {
			var equations = [];
			array.forEach(points, function(point, index) {
				var p1, p2, p1index, p2index, slope, intercept, interceptString, operator, equation;
				if (index === 0) {
					p1index = 2;
					p2index = 0;
				} else {
					p1index = index - 1;
					p2index = index;
				}
				p1 = points[p1index];
				p2 = points[p2index];
				if (p2.x === p1.x) {
					slope = 10000000;
				} else {
					if (p2.y === p1.y) {
						slope = 0;
					} else {
						slope = (p2.y - p1.y) / (p2.x - p1.x);
					}
				}
				intercept = p1.y - (p1.x * slope);
				interceptString = (intercept >= 0) ? "+" + intercept : intercept;
				operator = (p2.x >= p1.x) ? ">" : "<";
				equation = "(b('" + yBandName + "')" + operator + "((" + slope + "*b('" + xBandName + "'))" + interceptString + "))";
				equations.push(equation);
			});
			return "(" + equations.join("&&") + ")";
		}

		function changeDetectionColour(value) {
			detectionLayer.set("detectColor", value);
		}

		function changeChartAxis(evt) {
			console.log("changeChartAxis");
			xAxis = registry.byId("xAxisSelect").value;
			yAxis = registry.byId("yAxisSelect").value;
			xscale = (xAxis === 'hue') ? 360 : (xAxis === 'band10') ? 60 : 1;
			yscale = (yAxis === 'hue') ? 360 : (yAxis === 'band10') ? 60 : 1;
			xOffset = (xAxis === 'band10') ? 273 : 0;
			yOffset = (yAxis === 'band10') ? 273 : 0;
			domStyle.set(document.body, "cursor", "wait");
			wms_getSpectralData().then(function() {
				console.log("<< wms_getSpectralData");
				domStyle.set(document.body, "cursor", "default");
				topic.publish("axesChanged");
			});
		}

		function axesChanged(event) {
			console.log("axesChanged");
			addAxesTitles();
			if ((currentAlgorithm.xAxis === xAxis) && (currentAlgorithm.yAxis === yAxis)) {
				console.log("current algorithm has same bands as the current spectral map");
			} else {
				console.log("current algorithm does not have the same bands as the current spectral map");
				addNoneAlgorithmToList();
				registry.byId("toggleAlgorithmButton").set("checked", false);
				registry.byId("toggleAlgorithmButton").emit("Click", {});
			}
		}

		function addNoneAlgorithmToList() {
			var noneAlreadyExists = false;
			array.some(registry.byId("algorithmList").getOptions(), function(item) {
				if (item.label === "None") {
					noneAlreadyExists = true;
					return true;
				}
			});
			if (noneAlreadyExists) {
				registry.byId("algorithmList").set("value", "None");
				return;
			} else {
				addAlgorithmToList({
					value : "None",
					label : "None",
					points : [],
					expression : "",
					xAxis : xAxis,
					yAxis : yAxis
				});
			};
		}

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// END OF CHART EVENTS
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// MAP EVENTS
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		function updateBasemap(event) {
			console.log("updateBasemap");
			var selected, baselayer;
			selected = query("input[name='basemapLayer']:checked");
			if (selected.length === 1) {
				baselayer = map.getLayer(map.layerIds[0]);
				map.setBasemap(selected[0].value);
			}
		}

		function mapClick(event) {
			console.log("mapClick");
			var latlong, landcover, tabContainer;
			latLong = utils.webMercatorToGeographic(event.mapPoint);
			tabContainer = registry.byId("tabContainer");
			switch (tabContainer.selectedChildWidget.id) {
			case "landcoverclassesPane":
				if (!loggedIn) {
					alert("You must be logged in to create sites");
				} else {
					if (map.getLevel() > 1) {
						createDraftSite(latLong);
					} else {
						alert("You must be zoomed in to level 14 to create sites");
					}
				}
				break;
			case "spectralPane":
				queryValues(event.mapPoint);
				break;
			}
		}

		function queryValues(point) {
			console.log("queryValues");
			var graphic, point;
			clearSpectralQuery();
			graphic = new Graphic(point, querySymbol);
			mapQueryLayer.add(graphic);
			map.setMapCursor("wait");
			rest_getValuesForPoint(latLong).then(function(response) {
				console.log("<< rest_getValuesForPoint");
				map.setMapCursor("default");
				if ( typeof (response) === "string") {
					if (response.search("GoogleEarthEngineError") > -1) {
						alert("Getting the point values returned no data. There may be missing thermal data");
					}
				} else {
					var hsvValues, key, arr = [], infoTemplate, templateString = "", ndvi, ndwi;
					hsvValues = rgbTohsv(response.B7, response.B5, response.B4);
					// hardcoded for now - hsv input
					// uses landsat bands 7,5,4
					lang.mixin(response, hsvValues);
					ndvi = (response.B5 - response.B4) / (response.B5 + response.B4);
					ndwi = (response.B5 - response.B6) / (response.B5 + response.B6);
					lang.mixin(response, {
						'ndvi' : ndvi,
						'ndwi' : ndwi
					});
					for (key in response) {
						if ((key !== "id") && (key !== "time") && (key !== "BQA")) {
							templateString = templateString + "<tr><td>" + key + ":</td><td>${" + key + "}</td></tr>";
						}
					}
					infoTemplate = new InfoTemplate("Values for location", "<table style='width:100%'>" + templateString + "</table>");
					for (key in response) {
						if (String(response[key]).indexOf(".") > 0) {
							response[key] = response[key].toFixed(4);
						}
					};
					graphic.attributes = response;
					graphic.setInfoTemplate(infoTemplate);
					map.infoWindow.setContent(graphic.getContent());
					map.infoWindow.setTitle("Values for location");
					map.infoWindow.resize(350, 360);
					map.infoWindow.show(graphic.geometry);
					var xfield = (xAxis.substr(0, 4) === 'band') ? 'B' + xAxis.substr(4) : xAxis;
					//get hue as h, saturation as s and val as v otherwise Bn
					var yfield = (yAxis.substr(0, 4) === 'band') ? 'B' + yAxis.substr(4) : yAxis;
					//get hue as h, saturation as s and val as v otherwise Bn
					createChartQueryPoint(response[xfield], response[yfield]);
				}
			}, function(error) {
				console.log(error);
			});
		}

		function createChartQueryPoint(x, y) {
			console.log("createChartQueryPoint");
			queryLayer.clear();
			var point = new Point(x / xscale, y / yscale);
			var graphic = new Graphic(point, querySymbol);
			queryLayer.add(graphic);
		}

		function clearSpectralQuery() {
			console.log("clearSpectralQuery");
			mapQueryLayer.clear();
			queryLayer.clear();
		}

		function createDraftSite(latLong) {
			console.log("createDraftSite");
			var domNodes, landcover, newPoint;
			domNodes = query("#landcoverclasses input[type=radio]:checked");
			landcover = domAttr.get(domNodes[0], "value");
			newPoint = {
				lat : latLong.y,
				lng : latLong.x,
				land_cover : landcover
			};
			addGraphic(newPoint, true);
			draftSites.push([latLong.x, latLong.y, landcover]);
			if (dom.byId("createSites").disabled) {
				registry.byId("createSites").set("disabled", false);
			}
			if (dom.byId("deleteSites").disabled) {
				registry.byId("deleteSites").set("disabled", false);
			}
		}

		function deleteDraftSite(graphic) {
			console.log("deleteDraftSite");
			draftsiteLayer.remove(graphic);
			array.some(draftSites, function(item, index) {
				if (item.lat === graphic.attributes.lat) {
					draftSites.splice(index, 1);
					return true;
				}
			});
		}

		function clearDraftSites() {
			console.log("clearDraftSites");
			draftsiteLayer.clear();
			registry.byId("createSites").set("disabled", true);
			registry.byId("deleteSites").set("disabled", true);
			draftSites = [];
		}

		function createSites() {
			console.log("createSites");
			registry.byId("createSites").set("disabled", true);
			registry.byId("deleteSites").set("disabled", true);
			rest_createDraftSites().then(function() {
				console.log("<< rest_createDraftSites");
				getSitesForExtent();
				wms_getSpectralData().then(function() {
					console.log("<< wms_getSpectralData");
				});
			});
		}

		function deleteSite(event) {
			console.log("deleteSite");
			if ((event.keyCode === keys.DELETE) || (event.currentTarget.id === 'deleteLink')) {
				if (map.infoWindow.features.length > 0) {
					if (!loggedIn) {
						alert('You must log in to delete training sites.');
						return;
					}
					var selectedGraphic = map.infoWindow.features[0];
					if (selectedGraphic.attributes.hasOwnProperty("oid")) {
						rest_deleteSite(selectedGraphic.attributes.oid);
					} else {
						deleteDraftSite(selectedGraphic);
					}
					map.infoWindow.hide();
				}
			}
		}

		function zoomToSite(oid) {
			console.log("zoomToSite");
			rest_getSingleSiteData(oid).then(lang.hitch(oid, function(response) {
				console.log("<< rest_getSingleSiteData");
				var point;
				if (!response.metadata.success) {
					alert('Unable to retrieve site record. ' + response.metadata.error);
				} else {
					if (response.records.length > 0) {
						point = new Point(response.records[0].lng, response.records[0].lat);
						on.once(siteLayer, "graphicsLoaded", function() {
							array.some(siteLayer.graphics, function(item, index) {
								if (item.attributes.oid === oid) {
									map.infoWindow.setContent(item.getContent());
									map.infoWindow.setTitle(item.getTitle());
									map.infoWindow.setFeatures([item]);
									map.infoWindow.show(item.geometry);
									changeScene(item.attributes.sceneid);
									return true;
								}
							});
						});
						map.centerAndZoom(point, 15);
					}
				}
			}));
		}

		function addGraphic(data, draft) {
			var pt, graphic, infoTemplate;
			pt = utils.geographicToWebMercator(new Point(data.lng, data.lat));
			if (draft) {
				infoTemplate = new InfoTemplate("${land_cover}", "<table><tr><td>Land Cover:</td><td>${land_cover}</td></tr></table>");
			} else {
				data.image_date = (data.image_date === null) ? "Not calculated" : locale.format(stamp.fromISOString(data.image_date), {
					datePattern : "dd/MM/yyyy"
				});
				data.entry_date = (data.entry_date === null) ? "N/A" : locale.format(stamp.fromISOString(data.entry_date), {
					datePattern : "dd/MM/yyyy"
				});
				infoTemplate = new InfoTemplate("${land_cover}", "<table><tr><td colspan='2'>${sceneid}</td></tr><tr><td>Scene Date:</td><td>${image_date}</td></tr><tr><td>Land Cover:</td><td>${land_cover}</td></tr><tr><td>Entered By:</td><td>${username}</td></tr><tr><td>Entry Date:</td><td>${entry_date}</td></tr><tr><td>B1:</td><td>${band1}</td></tr><tr><td>B2:</td><td>${band2}</td></tr><tr><td>B3:</td><td>${band3}</td></tr><tr><td>B4:</td><td>${band4}</td></tr><tr><td>B5:</td><td>${band5}</td></tr><tr><td>B6:</td><td>${band6}</td></tr><tr><td>B7:</td><td>${band7}</td></tr><tr><td>B8:</td><td>${band8}</td></tr><tr><td>B9:</td><td>${band9}</td></tr><tr><td>B10:</td><td>${band10}</td></tr><tr><td>B11:</td><td>${band11}</td></tr><tr><td>hue:</td><td>${hue:NumberFormat(places:0)}</td></tr><tr><td>saturation:</td><td>${saturation:NumberFormat(places:4)}</td></tr><tr><td>value:</td><td>${value:NumberFormat(places:4)}</td></tr><tr><td>ndvi:</td><td>${ndvi:NumberFormat(places:4)}</td></tr><tr><td>ndwi:</td><td>${ndwi:NumberFormat(places:4)}</td></tr></table>");
			}
			symbol = getSymbol(data.land_cover, draft);
			map.infoWindow.resize(350, 360);
			graphic = new Graphic(pt, symbol, data, infoTemplate);
			if (draft) {
				draftsiteLayer.add(graphic);
			} else {
				siteLayer.add(graphic);
			}
		}

		function removeGraphic(oid) {
			console.log("removeGraphic");
			array.some(siteLayer.graphics, function(item) {
				if (item.attributes.oid === oid) {
					siteLayer.remove(item);
					return true;
				}
			});
		}

		// END OF MAP EVENTS
		// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		function populateScenePropertiesGrid(sceneProperties) {
			console.log("populateScenePropertiesGrid");
			var arr = [], key;
			for (key in sceneProperties) {
				if (key === "system:index") {
					arr.unshift({
						"propertyKey" : key,
						"propertyValue" : sceneProperties[key]
					});
				} else {
					arr.push({
						"propertyKey" : key,
						"propertyValue" : sceneProperties[key]
					});
				}
			}
			scenePropertiesGrid.refresh();
			scenePropertiesGrid.renderArray(arr);
		}

		function infoWindowHide(event) {
			console.log("infoWindowHide");
			clearSpectralQuery();
		}

		function getSymbol(landcover, draft) {
			var color, outlinecolor;
			color = getColor(landcover);
			outlinecolor = (draft) ? new Color([255, 0, 0, 1]) : new Color([255, 255, 255, 1]);
			return new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 12, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, outlinecolor, 2), color);
		}

		function getColor(landcover) {
			var color;
			array.some(legendClasses, function(item) {
				if (item.land_cover === landcover) {
					color = new Color(item.color);
					return true;
				}
			});
			return color;
		}

		function rgbTohsv(r, g, b) {
			console.log("rgbTohsv");
			var max, min, val, saturation, hue;
			max = Math.max(r, g, b);
			min = Math.min(r, g, b);
			val = max;
			saturation = (val - min) / max;
			switch (max) {
			case min:
				hue = 0;
				break;
			case r:
				hue = ((((g - b) / (val - min)) * 60) + 360) % 360;
				break;
			case g:
				hue = (((b - r) / (val - min) * 60) + 120);
				break;
			case b:
				hue = (((r - g) / (val - min) * 60) + 240);
				break;
			}
			return {
				"hue" : hue,
				"saturation" : saturation,
				"value" : val
			};
		}

		function getSelectedLandcoverTypes() {
			var landcoverTypes = [];
			if (registry.findWidgets(dom.byId("classTogglers")).length === 0) {
				landcoverTypes = ['Waterbodies', 'Lava flow'];
			} else {
				array.forEach(registry.findWidgets(dom.byId("classTogglers")), function(item) {
					if (item.checkbox.checked) {
						landcoverTypes.push(item.land_cover);
					}
				});
			}
			return landcoverTypes;
		}

	});
});

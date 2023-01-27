require({
	async : true,
	packages : [{
		name : "jrc",
		location : "/web_apps/gee_simple_client/scripts" //		location : "http://127.0.0.1:3000/gee_simple_client/scripts/"
	}]
}, ["dojo/window", "dojo/dom-geometry", "esri/symbols/PictureMarkerSymbol", "esri/InfoTemplate", "esri/layers/GraphicsLayer", "jrc/GeeLayer", "dojo/_base/lang", "esri/request", "dojo/_base/window", "dojo/io-query", "esri/layers/FeatureLayer", "esri/symbols/SimpleFillSymbol", "esri/geometry/Polygon", "dojo/_base/array", "dojo/ready", "dojo/dom-style", "dojo/date/locale", "dojo/date/stamp", "esri/arcgis/utils", "dojo/_base/Color", "esri/symbols/SimpleLineSymbol", "esri/graphic", "esri/symbols/SimpleMarkerSymbol", "esri/geometry/Point", "esri/geometry/webMercatorUtils", "esri/map", "esri/layers/WMSLayer", "esri/layers/WMSLayerInfo", "esri/geometry/Extent", "dojo/dom", "dijit/registry", "dojo/query", "dojo/on", "dojo/parser", "dojo/dom-construct", "jrc/PanoramioBox", "jrc/WebServiceAPIs/PanoramioAPI", "jrc/WebServiceAPIs/FlickrAPI", "jrc/FlickrBox", "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dijit/form/CheckBox", "dijit/form/Button", "dijit/form/Select", "dijit/form/RadioButton", "dijit/form/HorizontalSlider", "dijit/layout/StackContainer", "dijit/layout/StackController"], function(window, domGeom, PictureMarkerSymbol, InfoTemplate, GraphicsLayer, GeeLayer, lang, esriRequest, win, ioQuery, FeatureLayer, SimpleFillSymbol, Polygon, arrayUtils, ready, domStyle, locale, stamp, arcgisUtils, Color, SimpleLineSymbol, Graphic, SimpleMarkerSymbol, Point, utils, Map, WMSLayer, WMSLayerInfo, Extent, dom, registry, query, on, parser, domConstruct, PanoramioBox, PanoramioAPI, FlickrAPI, FlickrBox) {
	ready(function() {
		var shipLayer, initExtent, map, layer1, resourceInfo, wmsLayer, topographic_wmsLayer, panoramioapi, flickrapi, jsonConverter, esriJson, featureArray, pa_layer, uniqueDates = "", datesInitialised = false, servicesDomain, wdpa_id;
		parser.parse();
		queryObject = ioQuery.queryToObject(win.doc.location.search.substring(1));
		wdpa_id = queryObject.wdpaid;
		if (!wdpa_id) {
			alert('no wdpaid');
		};
		servicesDomain = "https://python-rest-server-ny43uciwwa-oc.a.run.app/python-rest-server/jrc-database/";
		esriRequest({
			url : servicesDomain + "especies/get_pa_bbox",
			content : {
				wdpa_id : wdpa_id,
				parseparams : false
			},
			handleAs : "json",
			callbackParamName : "callback",
			preventCache : true
		}).then(function(response) {
			boundingbox = response.records[0].get_pa_bbox;
			bboxSet();
		});
		var viewport = window.getBox();
		var surface = dojox.gfx.createSurface(query("body")[0], viewport.w, viewport.h);

		function bboxSet() {
			var llx, lly, urx, ury;
			boundingBoxArray = this.boundingbox.substring(this.boundingbox.indexOf("((") + 2, this.boundingbox.indexOf("))")).split(",");
			llx = parseFloat(boundingBoxArray[0].split(" ")[0]);
			lly = parseFloat(boundingBoxArray[0].split(" ")[1]);
			urx = parseFloat(boundingBoxArray[2].split(" ")[0]);
			ury = parseFloat(boundingBoxArray[2].split(" ")[1]);
			initExtent = new Extent({
				"xmin" : llx,
				"ymin" : lly,
				"xmax" : urx,
				"ymax" : ury,
				"spatialReference" : {
					"wkid" : 4326
				}
			});
			map = new Map("mapDiv", {
				extent : initExtent,
				basemap : "topo",
				sliderStyle : "large"
			});
			map.infoWindow.resize(350, 360);
			jsonConverter = geoJsonConverter();
			esriJson = jsonConverter.toEsri(pa_json);
			featureArray = arrayUtils.map(esriJson.features, function(f, idx) {
				f.attributes.objectid = idx;
				// results from geoJson converter adds unnecessary type property
				// delete it
				delete f.geometry.type;
				var polygon = new Polygon(f.geometry);
				var graphic = new Graphic(polygon, new SimpleFillSymbol(), f.attributes);
				return graphic;
			});
			var featureCollection = {
				"layerDefinition" : null,
				"featureSet" : {
					"features" : featureArray,
					"geometryType" : "esriGeometryPolygon"
				}
			};
			featureCollection.layerDefinition = {
				"geometryType" : "esriGeometryPolygon",
				"objectIdField" : "objectid",
				"fields" : [{
					"name" : "objectid",
					"alias" : "ObjectID",
					"type" : "esriFieldTypeOID"
				}, {
					"name" : "Description",
					"alias" : "Description",
					"type" : "esriFieldTypeString"
				}, {
					"name" : "Name",
					"alias" : "Name",
					"type" : "esriFieldTypeString"
				}]
			};
			pa_layer = new FeatureLayer(featureCollection);
			pa_layer.visible = false;
			registry.byId("pa_cb").on("click", function() {
				pa_layer.setVisibility(registry.byId("pa_cb").checked);
			});
			map.addLayer(pa_layer);
			var shipLayer = new GraphicsLayer();
			map.addLayer(shipLayer);
			map.on("load", function() {
				wmsLayer = new GeeLayer('rgbLayer', {
					visible : true
				});
				wmsLayer.set('sceneid', 'collection');
				map.addLayers([wmsLayer]);
				wmsLayer.on("update-start", updateStart);
				wmsLayer.on("update-end", updateEnd);
			});
			layer1 = new WMSLayerInfo({
				name : "Whatever",
				title : "Title"
			});
			resourceInfo = {
				extent : new Extent(116.676364283, 4.64623224023, 117.100028398, 4.95945957299, {
					wkid : 4326
				}),
				layerInfos : [layer1]
			};
			registry.byId("dateSelect").on("change", updateData);
			registry.byId("updateButton").on("click", updateData);
			registry.byId("slider").on("change", changeOpacity);
			query("input[type=radio]").on("click", updateBasemap);
			map.on("extent-change", extentChange);
			panoramioapi = new PanoramioAPI(30);
			flickrapi = new FlickrAPI(30);
			on(panoramioapi, "imagesLoaded", imagesLoaded);
			on(flickrapi, "imagesLoaded", flickrImagesLoaded);
			on(dom.byId("panoramioImage"), "click", function(e) {
				registry.byId("contentStack").selectChild("panoramioPane");
			});
			on(dom.byId("flickrImage"), "click", function(e) {
				registry.byId("contentStack").selectChild("flickrPane");
			});
		};

		function changeOpacity(opacity) {
			wmsLayer.setOpacity(opacity);
		}

		function showHideGEELayer(event) {
			if (registry.byId("showHideGEELayer").checked) {
				wmsLayer.show();
			} else {
				wmsLayer.hide();
			}
		}

		function updateStart(event) {
			map.setMapCursor("wait");
			domStyle.set(dom.byId("loading"), "display", "inline");
		}

		function updateEnd(event) {
			map.setMapCursor("default");
			domStyle.set(dom.byId("loading"), "display", "none");
		}

		function updateData(event) {
			var _date = registry.byId("dateSelect").value;
			var cloud, illumination, red, green, blue, layerstring;
			cloud = (registry.byId("remove_cloud_cb").checked) ? "1" : "0";
			illumination = (registry.byId("remove_illumination_cb").checked) ? "1" : "0";
			red = registry.byId("red").value;
			green = registry.byId("green").value;
			blue = registry.byId("blue").value;
			layerstring = "LANDSAT/LC8_L1T!" + _date + "!" + cloud + "!" + illumination + "!B" + red + ",B" + green + ",B" + blue;
		}

		function updateBasemap(event) {
			var selected = query("input[type=radio]:checked");
			if (selected.length == 1) {
				var baselayer = map.getLayer(map.layerIds[0]);
				if (selected[0].value == "none") {
					baselayer.opacity = 0;
					baselayer.refresh();
				} else {
					map.setBasemap(selected[0].value);
					baselayer.opacity = 1;
				};
			};
		}

		function extentChange(extent, delta, levelChange, lod) {
			var ll, ur;
			ll = utils.xyToLngLat(map.extent.xmin, map.extent.ymin);
			ur = utils.xyToLngLat(map.extent.xmax, map.extent.ymax);
			panoramioapi.getImagesForBBox(ll[0], ll[1], ur[0], ur[1], "small"); //small, thumbnail, square, mini_square
			flickrapi.getImagesForBBox(ll[0], ll[1], ur[0], ur[1]);
//			esri.request({
//				url : servicesDomain + "gee/proxy_marinetraffic",
//				content : {
//					"minlon" : ll[0],
//					"maxlon" : ur[0],
//					"minlat" : ll[1],
//					"maxlat" : ur[1]
//				},
//				callbackParamName : "callback"
//			}).then(function(response) {
//				console.log(response);
//				var infoTemplate = new InfoTemplate("${SHIPNAME}", "Time: ${TIMESTAMP}<table>				<tr><td>Latitude:</td><td>${LAT}</td></tr>				<tr><td>Longitude:</td><td>${LON}</td></tr>				<tr><td>Shipname:</td><td>${SHIPNAME}</td></tr>				<tr><td>Shipname</td><td>${FLAG}</td></tr>				<tr><td>Year built:</td><td>${YEAR_BUILT}</td></tr>				<tr><td>Width:</td><td>${WIDTH}</td></tr>				<tr><td>Length:</td><td>${LENGTH}</td></tr>				<tr><td>Draught:</td><td>${DRAUGHT}</td></tr>				<tr><td>Callsign:</td><td>${CALLSIGN}</td></tr>				<tr><td>Last port:</td><td>${LAST_PORT}</td></tr>				<tr><td>Last port time:</td><td>${LAST_PORT_TIME}</td></tr>				<tr><td>Current port:</td><td>${CURRENT_PORT}</td></tr>				<tr><td>Destination:</td><td>${DESTINATION}</td></tr>				<tr><td>ETA:</td><td>${ETA}</td></tr>				<tr><td>Course:</td><td>${COURSE}</td></tr>				<tr><td>Speed:</td><td>${SPEED}</td></tr>				<tr><td>DWT:</td><td>${DWT}</td></tr>				<tr><td>GRT:</td><td>${GRT}</td></tr>				<tr><td>IMO:</td><td>${IMO}</td></tr>				<tr><td>MMSI:</td><td>${MMSI}</td></tr></table>");
//				arrayUtils.map(response.ships, function(ship) {
//					simpleMarkerSymbol = new PictureMarkerSymbol({
//						"angle" : ship.COURSE,
//						"xoffset" : -12,
//						"yoffset" : 12,
//						"type" : "esriPMS",
//						"url" : "http://static.arcgis.com/images/Symbols/Basic/ArrowYellow.png",
//						"imageData" : "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",
//						"contentType" : "image/png",
//						"width" : 24,
//						"height" : 24
//					});
//					var graphic = map.graphics.add(new Graphic(utils.geographicToWebMercator(new Point(ship.LON, ship.LAT)), simpleMarkerSymbol, ship, infoTemplate));
//				});
//			});
			getDatesForCentroid();
		}

		function imagesLoaded() {
			var i, existingPanoramioBoxes;
			existingPanoramioBoxes = registry.findWidgets(dom.byId("panoramioImages"));
			for ( i = 0; i < existingPanoramioBoxes.length; i++) {
				existingPanoramioBoxes[i].destroy();
			}
			for ( i = 0; i < panoramioapi.photos.length; i++) {
				var panoramioBox = new PanoramioBox({
					"photo" : panoramioapi.photos[i]
				});
				on(panoramioBox, "mouseEnterPhoto", showLocation);
				on(panoramioBox, "mouseLeavePhoto", hidelocation);
				panoramioBox.startup();
				domConstruct.place(panoramioBox.domNode, "panoramioImages");
			}
		}

		function flickrImagesLoaded() {
			existingFlickrBoxes = registry.findWidgets(dom.byId("flickrImages"));
			for ( i = 0; i < existingFlickrBoxes.length; i++) {
				existingFlickrBoxes[i].destroy();
			}
			for ( i = 0; i < flickrapi.photos.length; i++) {
				var photo = flickrapi.photos[i];
				var flickrBox = new FlickrBox({
					"photo" : photo
				});
				on(flickrBox, "mouseEnterPhoto", showLocation);
				on(flickrBox, "mouseLeavePhoto", hidelocation);
				flickrBox.startup();
				domConstruct.place(flickrBox.domNode, "flickrImages");
			}
		}

		function showLocation(evt) {
			var photolocation, simpleMarkerSymbol, graphic, color;
			photolocation = utils.geographicToWebMercator(new Point(evt.longitude, evt.latitude));
			color = (evt.type == "Flickr") ? new Color([255, 0, 150, 1]) : new Color([0, 0, 255, 1]);
			simpleMarkerSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 1, new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, new Color([255, 255, 255, 1]), 3), color);
			graphic = new Graphic(photolocation, simpleMarkerSymbol);
			map.graphics.clear();
			map.graphics.add(graphic);
			var graphicDomNode = graphic.getNode();
			if (graphicDomNode!==null){
				var mapPosition = domGeom.position(graphicDomNode, true);
				var panoramioImagePosition = domGeom.position(evt.target.panoramioImage, true);
				var xOffset = 15;
				var yOffset = panoramioImagePosition.h/2;
				var radius = 6;
				surface.createLine({x1:panoramioImagePosition.x + xOffset, y1:panoramioImagePosition.y + yOffset, x2:mapPosition.x, y2:mapPosition.y}).setStroke({color: "#fff", width: 1.5});
				surface.createCircle({cx: panoramioImagePosition.x + xOffset, cy: panoramioImagePosition.y + yOffset, r: radius}).setStroke({color: "#fff", width: 2}).setFill("#0069B6");
				surface.createCircle({cx: mapPosition.x, cy: mapPosition.y, r: radius}).setStroke({color: "#fff", width: 2}).setFill("#0069B6");
			}
		}

		function hidelocation() {
			surface.clear();
			map.graphics.clear();
		}

		function getDatesForCentroid() {
			var centroid = map.extent.getCenter();
			var latlng = utils.xyToLngLat(centroid.x,centroid.y);
			var select = registry.byId("dateSelect");
			select.removeOption(select.getOptions());
			esri.request({
				url : "http://geeimageserver.appspot.com/getDatesForPoint",
				content : {
					lat: latlng[0],
					lng: latlng[1]
				},
				callbackParamName : "callback"
			}).then(function(response) {
				var options = [];
				var selected;
				for ( i = 0; i < response.records.length; i++) {
					var label = locale.format(stamp.fromISOString(response.records[i]), {
						selector : "date",
						datePattern : "dd-MM-yyyy"
					});
					if ((!datesInitialised) && (label == "19-06-2013")) {
						selected = true;
					} else {
						selected = false;
					}
					options.push({
						'label' : label,
						'value' : label,
						'selected' : selected
					});
				};
				select.addOption(options);
				if (options.join() != uniqueDates) {
					if (!uniqueDates) {
						select.set("value", options[3].value);
						//start
					} else {
						select.set("value", options[0].value);
					}
					updateData(null);
				}
				uniqueDates = options.join();
			});
		}

	});
});

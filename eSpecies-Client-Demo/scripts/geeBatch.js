/*jslint plusplus: true */
require({
	async : true,
	packages : [{
		name : "jrc",
		location : "/eSpecies/scripts"
	}]
}, ["dojo/dom", "dojo/_base/array", "dijit/form/SimpleTextarea", "dojo/request/script", "dojo/on", "esri/geometry/Extent", "esri/map", "dojo/ready", "dojo/_base/declare"], function(dom, array, SimpleTextarea, script, on, Extent, Map, ready, declare) {
	ready(function() {
		servicesDomain = (document.domain === "ehabitat-wps.jrc.it") ? "http://dopa-services.jrc.it/" : "http://dopa-services.jrc.ec.europa.eu/";
		var initExtent, map, availableScenes, console;
		console = new SimpleTextarea({
			name : "consoleTextarea",
			rows : "10",
			cols : "150",
			style : "width:auto;"
		}, "console");
		initExtent = new Extent({
			xmin : -517344.4386681639,
			ymin : 1662324.7040100119,
			xmax : -443964.8915144937,
			ymax : 1740596.2209739268,
			"spatialReference" : {
				"wkid" : 102100
			}
		});
		map = new Map("mapDiv", {
			extent : initExtent,
			basemap : "topo",
			sliderStyle : "large"
		});
		map.on("extent-change", extentChange);

		function extentChange(event) {
			var centroid;
			centroid = map.extent.getCenter();
			script.get(servicesDomain + "gee/getScenesForPoint", {
				query : {
					POINT : centroid.x + "," + centroid.y,
					CRS : "EPSG:102100"
				},
				jsonp : "callback"
			}).then(function(response) {
				outputToConsole(response.features.length + " matching scenes");
				var ll_lat, ll_long, ur_lat, ur_long;
				ll_lat = response.features[0].properties.CORNER_LL_LAT_PRODUCT;
				ll_long = response.features[0].properties.CORNER_LL_LON_PRODUCT;
				ur_lat = response.features[0].properties.CORNER_UR_LAT_PRODUCT;
				ur_long = response.features[0].properties.CORNER_UR_LON_PRODUCT;
				outputToConsole("LL Lat,Long  UR Lat/Long: " + ll_lat + "," + ll_long + " " + ur_lat + "," + ur_long);
				for ( i = 0; i < response.features.length; i++) {
					outputToConsole("Processing " + response.features[i].id);
					script.get(servicesDomain + "gee/WMS_scene", {
						query : {
							SERVICE : "wms",
							REQUEST : "GetMap",
							FORMAT : "image/png",
							TRANSPARENT : "TRUE",
							STYLES : "",
							VERSION : "1.3.0",
							LAYERS : "{'redBand':'B7','greenBand':'B5','blueBand':'B4','sceneid':'" + response.features[i].id + "','detectWater':True}",
							WIDTH : 1000,
							HEIGHT : 1000,
							CRS : "EPSG:4326",
							BBOX : ll_long + "," + ll_lat + "," + ur_long + "," + ur_lat
						},
						jsonp : "callback"
					}).then(function(response) {
						outputToConsole(response.url);
						// dom.byId('waterimg').src = response.url;
						script.get(response.url);
					});
				}
			});
		}

		function outputToConsole(text) {
			console.set("value", console.get("value") + text + "\n");
		}

	});
});


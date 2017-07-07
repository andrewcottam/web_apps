require({
		async : true,
		paths:{
			widgetsPackage: "/../../widgets",
		}
	}, ["dijit/form/Button", "dojo/dom", "widgetsPackage/ReferenceList", "widgetsPackage/ImageryTimeSlider", "widgetsPackage/PhotoViewer", "dojo/dom-construct", "dojo/io-query", "dojo/_base/window", "dojo/parser", "dojo/on", "dijit/registry", "dojo/ready", "dijit/form/CheckBox", "dijit/layout/BorderContainer", "dijit/layout/ContentPane"],
	function(Button, dom, ReferenceList, ImageryTimeSlider, PhotoViewer, domConstruct, ioQuery, win, parser, on, registry, ready) {
		ready(function() {
			var queryObject = ioQuery.queryToObject(win.doc.location.search.substring(1));
			// var geeServerUrl = (document.domain === "localhost") ? "http://localhost:8080" : "http://geeImageServer.appspot.com";
			var geeServerUrl = "http://geeImageServer.appspot.com";
			var digitialGlobeApiKey = "pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNpbmJscnhhZTBudmp0cWx3MXI5bWt0djgifQ.9DibR63tG-LY6FvjDLhCXg";
			// var jrcLayer = L.tileLayer.wms(geeServerUrl + "/ogc", { // traditional WMS request with a default tile size of 250x250 pixels
			var osmlayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
				maxZoom: 18,
				id: 'blishten.pnnbdo98',
				accessToken: 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg'
			});
			var map = L.map('mapid', {
				layers: [osmlayer],
				// center: [16.02, -3.54],//used for ages
				center: [16.5887,-14.8975], // Podor Senegal - seasonal flooding
				// center: [11.5265,-9.3102], // Siguiri Gold Mine in Guinea
				zoom: 12,
				loadingControl: true,
				fullscreenControl: true,
			});
			map.whenReady(function mapLoaded(e) {
				if (queryObject.lat !== undefined) {
					map.setView({
						lon: queryObject.lng,
						lat: queryObject.lat
					}, queryObject.zoom);
				};
			});
			var digitalGlobeLayer = new L.tileLayer('https://{s}.tiles.mapbox.com/v4/digitalglobe.nal0g75k/{z}/{x}/{y}.png?access_token=' + digitialGlobeApiKey, {
				minZoom: 1,
				maxZoom: 19,
				attribution: '(c) <a href="http://microsites.digitalglobe.com/interactive/basemap_vivid/">DigitalGlobe</a> , (c) OpenStreetMap, (c) Mapbox'
			});
			var transitions = new L.tileLayer("https://storage.googleapis.com/global-surface-water/maptiles/transitions/{z}/{x}/{y}.png", {
				format: "image/png",
				maxZoom: 13,
				errorTileUrl: "https://storage.googleapis.com/global-surface-water/downloads_ancillary/blank.png",
				attribution: "<a href='https://global-surface-water.appspot.com/'>© 2016 EC JRC/Google</a>"
			});
			//normal WMS layers from lrm-maps - reprojected on the fly from 4326 to 3857
			//		var africa_boundaries = L.tileLayer.wms("http://lrm-maps.jrc.ec.europa.eu/geoserver/acp/wms?", {
			//		    layers: 'acp:acp-africa-countries',
			//		    format: 'image/png',
			//		    transparent: true
			//		});
			//		var pais = L.tileLayer.wms("http://lrm-maps.jrc.ec.europa.eu/geoserver/pais/wms?", {
			//		    layers: 'pais:validated_segments',
			//		    format: 'image/png',
			//            styles: 'pais_class_1990',
			//		    transparent: true
			//		});
			L.control.scale().addTo(map);
			// L.control.mousePosition().addTo(map);
			parser.parse().then(function() {
				on(registry.byId("togglewaterlayer"), "change", function(value) {
					(value) ? map.addLayer(transitions): map.removeLayer(transitions);
				});
				on(registry.byId("togglebaselayer"), "change", function(value) {
					(value) ? map.addLayer(digitalGlobeLayer): map.removeLayer(digitalGlobeLayer);
				});
				on(registry.byId("toggleleafletlayer"), "change", function(value) {
					(value) ? map.addLayer(osmlayer): map.removeLayer(osmlayer);
				});
				//			map.addLayer(pais);
				var photoViewer = new PhotoViewer({
					map: map,
					providers: ["flickr"],
					tags: ["biopama"],
					text: "outdoor",
					photoSize: "thumbnail", //small
					accuracy: 4,
				}, "photos"); //tags are an array, e.g. tags: ["biopama"], text is a string, e.g. text: "landscape"
				photoViewer.startup();
				var imageryTimeSlider = new ImageryTimeSlider({
					leafletMap: map,
					// provider: "geeImagerServer",
					provider: "sentinelHub",
					hideToEdge: true
				}, "ImageryTimeSliderDiv");
				imageryTimeSlider.startup();
			});
		});
	});

//photoSizes:
//medium 				 		500 maximum dimension
//small							240 maximum dimension
//thumbnail						100 maximum dimension
//square						60 x 60
//mini_square					32 x 32

//tags:
//these are passed on to the Flickr search API

//showLocatorLine: set to true to show a line to the location on a map

/*jslint plusplus: true */
require(["dojo/date/locale", "dijit/focus", "dojo/parser", "dijit/form/RadioButton", "dojo/dom-class", "dojo/dom-attr", "dojo/_base/lang", "dojo/Deferred", "dojo/keys", "dojo/topic", "dojo/_base/array", "dojo/dom-style", "dojo/dom", "dojo/_base/lang", "dojox/gfx", "dojo/io-query", "dojo/dom-style", "dijit/registry", "dojo/on", "dojo/request/script", "dojo/ready", "dijit/form/Button", "dijit/Dialog", "dijit/form/TextBox"], function(locale, focusUtil, parser, RadioButton, domClass, domAttr, lang, Deferred, keys, topic, array, domStyle, dom, lang, gfx, ioQuery, domstyle, registry, on, script, ready, Button, Dialog, TextBox) {
	ready(function() {
		var OSM_DEFAULT_SCALE = 5;
		var START_POINT = L.latLng([9.437,-64.754]); //as lat,lng
		var SQUARE_WIDTH = 90; //width of the validation square in metres
		var position = -1, sites, imageSize = 400, bboxSize = 1910.925707126968, bufferSize = 10, urlsToGet, nextSiteRetrieved = true, validationClasses, default_class = "Green", currentValidation, stretch = 1;
		var digitialGlobeApiKey = "pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNpbmJscnhhZTBudmp0cWx3MXI5bWt0djgifQ.9DibR63tG-LY6FvjDLhCXg";
		var bingApiKey = "AhW7FP_kNS9ae83qjF2DzlmTYOU609o9Io_Guc3a2AHUsRhfIz3SlxuOHCdn1b4G";
		var username = "Christelle"; //default value
		var sensors = [
 		  {name: "L5", bands: {Blue: "B1", Green: "B2", Red: "B3", NIR: "B4", SWIR1: "B5", SWIR2: "B7", TIR: "B6"}},
 		  {name: "L7", bands: {Blue: "B1", Green: "B2", Red: "B3", NIR: "B4", SWIR1: "B5", SWIR2: "B7", TIR: "B6_VCID_2"}},
 		  {name: "L8", bands: {Blue: "B2", Green: "B3", Red: "B4", NIR: "B5", SWIR1: "B6", SWIR2: "B7", TIR: "B10"}},
 		];
 		var validations = [
 		  {name: "satelliteImageValidation", activeImageDiv: "satelliteImage", activeInfoDiv: "satelliteInfoPanel", inactiveImageDiv: "highResImage", inactiveInfoDiv: "highResInfoPanel", classDiv:"actualClass"},
 		  {name: "highResImageValidation", activeImageDiv: "highResImage", activeInfoDiv: "highResInfoPanel", inactiveImageDiv: "satelliteImage", inactiveInfoDiv: "satelliteInfoPanel", classDiv:"highResActualClass"}
 		];
		var digitalGlobeLayer = new L.tileLayer('https://{s}.tiles.mapbox.com/v4/digitalglobe.nal0g75k/{z}/{x}/{y}.png?access_token=' + digitialGlobeApiKey, {
		    minZoom: 1,
		    maxZoom: 19,
		    attribution: '(c) <a href="http://microsites.digitalglobe.com/interactive/basemap_vivid/">DigitalGlobe</a> , (c) OpenStreetMap, (c) Mapbox'
		});
		var bingLayer = L.tileLayer.bing(bingApiKey);
		var osmlayer =  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		    maxZoom: 18,
		    id: 'blishten.0oj2580i',
		    accessToken: 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg'
		});
		var contextMap = L.map('mapDiv',{
			layers: [osmlayer],
		    center: START_POINT,
		    zoom: OSM_DEFAULT_SCALE,
		    loadingControl: true
		});
		contextMap.on('zoomend', function(e) {
			addExtentToContextMap();
		});
		var imagerymap = L.map('mapDiv2',{
			layers: [bingLayer],
		    center: START_POINT,
		    zoom: 15,
		    loadingControl: true,
		    keyboard: false
		});
		//used to get the region parameter in the gee call - the centroid is set and then the bounds are read
		var offScreenMap = L.map('mapDiv3',{
		    center: START_POINT,
		    zoom: OSM_DEFAULT_SCALE,
		    loadingControl: false
		});
		//add the validation square to the high resolution imagery map
		addValidationSquare(imagerymap, START_POINT);
		//add the extent of the high resolution map to the context map
		addExtentToContextMap();
		var restServerUrl = "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com:8081/python-rest-server/"; //AWS C9 ec2-default environment only
		// var restServerUrl = "http://18.200.163.92:8080/python-rest-server/"; // python-rest-server running on tornado on ec2-default instance
//		geeServerUrl = (document.domain === "localhost") ? "http://localhost:8080" : "http://geeImageServer.appspot.com";
		var geeServerUrl = "https://geeImageServer.appspot.com";
		getValidationClasses();
		topic.subscribe("urlsPopulated", urlsPopulated);
		on(document, "keydown", keydown);
		on(dom.byId("geimage"), "load", hideLoading);
		on(dom.byId("geimage"),"onerror",imageOnError);
		//add the validation square to the imagery map
		var surface = gfx.createSurface("satelliteImage", imageSize, imageSize);
		surface.createPath("M5 5L24 5L24 24L5 24Z").setStroke("#ffffff");
		populateSiteData(bufferSize, 0);
		parser.parse().then(function() {
			usernameDialog.on("execute", function(){
				username = usernameDialog.get("value").username;
				dom.byId("loggedinUsername").innerHTML = "Logged in as " + username;
			});
			usernameDialog.show();
			on(registry.byId("toggledglayer"), "click", function(evt) {
				imagerymap.addLayer(digitalGlobeLayer);
				imagerymap.removeLayer(bingLayer);
				focusUtil.curNode.blur();
			});
			on(registry.byId("togglebinglayer"), "click", function(evt) {
				imagerymap.addLayer(bingLayer);
				imagerymap.removeLayer(digitalGlobeLayer);
				focusUtil.curNode.blur();
			});
		});
		
		function hideLoading() {
			domStyle.set(dom.byId("loading"), "display", "none");
		}

		function imageOnError(e){
			console.log("Failed to load image");
			moveImage(1);
		}
		function showLoading() {
			domStyle.set(dom.byId("loading"), "display", "block");
		}

		//rest call to get the information on the validation classes, e.g. Green, Not-Green etc.
		function getValidationClasses() {
			var deferred;
			deferred = script.get(restServerUrl + "roadless/services/get_gee_validation_landcovertypes?format=json", {
				jsonp : "callback"
			});
			deferred.then(function(response) {
				validationClasses = response.records;
			});
			return deferred;
		}

		//manages all REST calls to get the site data
		function populateSiteData(count, oid) {
			var startoid = (oid === undefined) ? sites[sites.length - 1].oid : oid;
			urlsToGet = count;
			getSites(startoid, count).then(function() {
				//get the sites that we need to populate with an imageurl
				var toGet = sites.slice(sites.length - count);
				array.forEach(toGet, function(site) {
					//get the sensor information for the site
					site.sensor = getSceneSensor(site);
					//get the image for the site - by default 
					getSiteImageUrl(site, "SWIR2,NIR,Red", "url1", false);
				});
			});
		}

		//REST call to get the site information
		function getSites(startFrom, records) {
			var deferred;
			deferred = script.get(restServerUrl + "roadless/services/get_validated_sites?format=json", {
				query : {
					startfrom : startFrom,
					buffersize : records
				},
				jsonp : "callback"
			});
			deferred.then(function(response) {
				if (sites === undefined) {
					sites = response.records;
				} else { 
					sites.push(response.records[0]);
					nextSiteRetrieved = true;
				}
			},function(err){
				console.log(err);
			});
			return deferred;
		}

		function moveActiveDiv()
		{
			domStyle.set(dom.byId(currentValidation.activeImageDiv), "border", "1px white solid");
			domStyle.set(dom.byId(currentValidation.inactiveImageDiv), "border", "1px black solid");
			domStyle.set(dom.byId(currentValidation.activeInfoDiv), "display", "block");
			domStyle.set(dom.byId(currentValidation.inactiveInfoDiv), "display", "none");
		}
		//gets an image url for the site from the Google Earth Engine geeImageServer
		function getSiteImageUrl(site, bands, urlproperty, show) {
			var centerPoint = L.CRS.EPSG3857.unproject(L.point(site.x,site.y));
			offScreenMap.setView(centerPoint, 15);
			var boundsLL = offScreenMap.getBounds();
			var ur = L.CRS.EPSG3857.project(boundsLL.getNorthEast());
			var ll = L.CRS.EPSG3857.project(boundsLL.getSouthWest());
			var bboxSize_x = Math.abs(ur.x - ll.x)/2;
			var bboxSize_y = Math.abs(ur.y - ll.y)/2;
//			var bbStr = (site.x - bboxSize) + "," + (site.y - bboxSize) + "," + (site.x + bboxSize) + "," + (site.y + bboxSize);
			var bbStr = (site.x - bboxSize_x) + "," + (site.y - bboxSize_y) + "," + (site.x + bboxSize_x) + "," + (site.y + bboxSize_y);
			var params = {
				service : "WMS",
				request : "GetMap",
				version : "1.1.1",
				layers : "[" + site.sceneid + "]",
				styles : "",
				format : "image/png",
				transparent : "false",
				srs : "EPSG:3857",
				width : imageSize,
				height : imageSize,
				bbox : bbStr,
				bands : bands,
				stretch : stretch
			};
			var paramsQuery = ioQuery.objectToQuery(params);
			script.get(geeServerUrl + "/ogc", {
				query : params,
				jsonp : "callback"
			}).then(lang.hitch(site, function(response) {
				if (response.url.search("Google Earth Engine Services Error") != -1) {
					console.log("An error was raised by Google Earth Engine for site: " + site.oid + ". " + response.url);
					var deleteIndex;
				    array.forEach(sites, function(item, index){ //get the index of the site that failed to get an imageUrl 
				    	if (item.oid == site.oid) {
				    		deleteIndex = index;
				    		return true;
				    	};
				    });
				    resetSite(site.oid);
				    sites.splice(deleteIndex,1); //delete the site from the sites array
				    bufferSize = bufferSize - 1; //decrement the bufferSize otherwise we will never move to the first image
				} else {
					site[urlproperty] = response.url;
					if (show) {
						showImage(response.url);
						return;
					}
				}
				urlsToGet = urlsToGet - 1;
				if (urlsToGet === 0) {
					topic.publish("urlsPopulated");
				}
			}),function(error){
				console.log(error);
			});
		}

		function showImage(url){
			domAttr.set(dom.byId("geimage"), "src", url);
		}
		
		//sets the checkout_date value to NULL for sites which fail
		function resetSite(oid){
			deferred = script.get(restServerUrl + "roadless/services/set_site_failed?format=json", {
				query : {
					oid : oid
				},
				jsonp : "callback"
			});
			deferred.then(function(response) {
				console.log("Reset failed site: " + oid)
			});
		}
		function urlsPopulated() {
			if (sites.length === bufferSize) {
				moveImage(1);
			}
		}

		function moveImage(relativePos) {
			var siteImage, display;
			if (position === 0 && relativePos === -1) {
				return;
			}
			if (nextSiteRetrieved) {
				nextSiteRetrieved = false;
				populateSiteData(1);
			}
			position = position + relativePos;
			site = sites[position];
			console.log("Validating: {oid: " + site.oid + ", sceneid: " + site.sceneid + ", source: " + site.sceneid_source + "}");
			currentValidation = validations[0];
			moveActiveDiv(currentValidation);
			resetImage();
			if (site.url1 !== undefined) {
				showImage(site.url1); //sets the url property of the image src attribute
				if (site.hasOwnProperty("x")) {
					var centerPointProj = L.point(site.x, site.y);
					var centerPoint = L.CRS.EPSG3857.unproject(centerPointProj);
					contextMap.setView(centerPoint, OSM_DEFAULT_SCALE);
					addValidationSquare(imagerymap, centerPoint);
//					var metadata = getMetadata(centerPoint);
					imagerymap.setView(centerPoint, 15);
					addExtentToContextMap();
				}
				setLandCoverClass(site);
//				dom.byId("sensor").innerHTML = "<p>var sceneid = '" + site.sceneid + "';var validationPoint = [" + site.lng + "," + site.lat + "];";
//				dom.byId("imageInfo").innerHTML = site.sceneid_source;
				dom.byId("imageInfo").innerHTML = getSceneDate(site.sceneid);
				display = (site.hasOwnProperty("validated_class")) ? "block" : "none";
				domStyle.set("tickImage", {
					display : display
				});
			} else {//no more images in the queue - get some more
				dom.byId("actualClass").innerHTML = "images loading..";
				populateSiteData(bufferSize);
			};
		};

		//returns the validation square coordinates in latlng from the passed latlng point
		function getValidationSquare(centrePoint){
			var centrePointMercator = L.CRS.EPSG3857.project(centrePoint);
			var minx = centrePointMercator.x - (SQUARE_WIDTH / 2);
			var maxx = centrePointMercator.x + (SQUARE_WIDTH / 2);
			var miny = centrePointMercator.y - (SQUARE_WIDTH / 2);
			var maxy = centrePointMercator.y + (SQUARE_WIDTH / 2);
			var ll = L.CRS.EPSG3857.unproject(L.point(minx, miny));
			var ur = L.CRS.EPSG3857.unproject(L.point(maxx, maxy));
			return [[ll.lat, ll.lng],[ur.lat, ll.lng],[ur.lat, ur.lng],[ll.lat, ur.lng]];
		}
		
		//adds a polygon as the validation square to the map
		function addValidationSquare(_map, centrePoint){
			//get the validation square coordinates in latlng
			var validationSquare = getValidationSquare(centrePoint);
			var whiteSquareLayer = L.polygon(validationSquare,{color: '#fff', weight:1, fillOpacity:0, type:"validationSquare"});
			_map.eachLayer(function (layer) { //get the existing layer with the validation square and remove it
			    if (layer.hasOwnProperty("options")) {
			    	if (layer.options.hasOwnProperty("type")){
			    		if (layer.options.type == "validationSquare"){
			    			_map.removeLayer(layer);
			    			return true;
			    		}
			    	}
			    }
			});
			_map.addLayer(whiteSquareLayer);
		}
		
		//adds the extent of the high resolution map to the context map
		function addExtentToContextMap(){
			var boundsLL = imagerymap.getBounds();
			if (contextMap.getZoom()>8){
				var polygon = [boundsLL.getSouthWest(), boundsLL.getNorthWest(), boundsLL.getNorthEast(), boundsLL.getSouthEast()];
				var extentLayer = L.polygon(polygon, {type:"extentMap"});
			}else{
				var center = imagerymap.getCenter();
				var extentLayer = L.circleMarker(center, {type:"extentMap"});
				extentLayer.setRadius(2);
			}
			contextMap.eachLayer(function (layer) { //get the existing layer with the extent map and remove it
			    if (layer.hasOwnProperty("options")) {
			    	if (layer.options.hasOwnProperty("type")){
			    		if (layer.options.type == "extentMap"){
			    			contextMap.removeLayer(layer);
			    			return true;
			    		}
			    	}
			    }
			});
			contextMap.addLayer(extentLayer);
		}
		
		function getMetadata(centerPoint){
			if (registry.byId("togglebinglayer").value == 'on'){
				var location_string = centerPoint.lat + "," + centerPoint.lng;
				var deferred = script.get("http://dev.virtualearth.net/services/v1/Imagery/Metadata/Aerial/" + location_string + "?" ,{
					 query: {
						zl : 10,
						key : bingApiKey
					},
					jsonp : "callback"});
				deferred.then(function(response){
					if (response.resourceSets.resources.length > 0){
						var vintageStart = response.resourceSets.resources[0].vintageStart;
						var vintageEnd = response.resourceSets.resources[0].vintageEnd;
						dom.byId("highResImageInfo").innerHTML = vintageStart + " to " + vintageEnd;
					}else{
						dom.byId("highResImageInfo").innerHTML = "No image date";
					}
				});
			};
		}
		function getSceneDate(sceneid){
			var scenedate = dateFromDay(sceneid.substr(29,4), sceneid.substr(33,3));
			return locale.format(scenedate, {
				datePattern: "dd/MM/yyyy", selector: "date"
			});
		}
		function dateFromDay(year, day){
		  var date = new Date(year, 0); // initialize a date in `year-01-01`
		  return new Date(date.setDate(day)); // add the number of days
		}
		
		function getSceneSensor(site){
			var sceneSensor = "L" + site.sceneid.substring(10,11);
			return array.filter(sensors, function(sensor) {
				if (sensor.name === sceneSensor){
					return true;
				};				
			})[0];
		}
		
		function keydown(event) {
			switch (event.keyCode) {
			case (keys.RIGHT_ARROW) :
				validateCurrentImage();
				break;
			case (keys.LEFT_ARROW):
				validateCurrentImage();
				moveImage(-1);
				break;
			case (keys.UP_ARROW) :
				showSiteImage();
				resetImage();
				break;
			case (keys.DOWN_ARROW):
				showRGBImage();
				dom.byId("sensorBandInfo").innerHTML = "Up arrow to see the SWIR2, NIR, Red image";
				break;
			case (keys.SPACE):
				changeClass();
				break;
			case (keys.NUMPAD_PLUS):
				stretchImage(true);
				break;
			case (keys.NUMPAD_MINUS):
				stretchImage(false);
				break;
			};
		}

		function resetImage(){
			dom.byId("sensorBandInfo").innerHTML = "Down arrow to see the Red, Green, Blue image";
			stretch = 1;
		}
		
		function validateCurrentImage() {
			validateImage();
			if (currentValidation.name === "satelliteImageValidation"){
				currentValidation = validations[1];
				moveActiveDiv();
			}else{
				currentValidation = validations[0];
				showLoading();
				moveImage(1);
			}
		}

		function validateImage(){
			var validationClass = getMatchingValidationClass(dom.byId(currentValidation.classDiv).innerHTML);
			var deferred, validated_class = validationClass.class_id;
			var validation_property = currentValidation.name;
			sites[position][validation_property] = validated_class;
			deferred = script.get(restServerUrl + "roadless/services/set_site_validated", {
				query : {
					oid : sites[position].oid,
					validation_property : validation_property,
					validated_class: validated_class,
					username : username,
					highresimagedate : dom.byId("highResImageInfo").innerHTML 
				},
				jsonp : "callback"
			});
			deferred.then(function(response) {
				var result = response.records[0].set_site_validated;
				if (result) {
					getValidatedSiteCount();
				}
			});
			return deferred;
		}
		
		function setLandCoverClass(site) {
			if (site.hasOwnProperty("validated_class")) {
				setValidatedClass(site.validated_class);
			} else {
				setClassText(default_class);
			}
		}

		function setValidatedClass(validated_class) {
			setClassText(validated_class);
		}

		function getValidatedSiteCount() {
			var deferred;
			deferred = script.get(restServerUrl + "roadless/services/get_validated_site_count?format=json", {
				jsonp : "callback"
			});
			deferred.then(function(response) {
				dom.byId("validatedCount").innerHTML = response.records[0].get_validated_site_count + " points to be validated";
			});
			return deferred;
		}

		function setClassText(classText) {
			var classStr, color, textcolor = "white";
			var validationClass = getMatchingValidationClass(classText);
			domClass.remove(currentValidation.classDiv);
			domClass.add(currentValidation.classDiv, validationClass.css_class);
			dom.byId(currentValidation.classDiv).innerHTML = validationClass.label;
		}

		function changeClass() {
			var validationClass = validationClass = getMatchingValidationClass(dom.byId(currentValidation.classDiv).innerHTML);
//			if (currentValidation.name==="satelliteImageValidation"){
				setValidatedClass(validationClass.next_value);
//			}else{
//				if (validationClass.next_value===1){
//					setValidatedClass(2);
//				}else{
//					setValidatedClass(validationClass.class_id + 1);
//				}
//			}
		}

		function getMatchingValidationClass(classText) {
			var reg = new RegExp(/^\d+$/);
			if (reg.test(classText)) {
				var matchingClasses = validationClasses.filter(function(obj) {
					return obj.class_id === Number(classText);
				});
			} else {
				var matchingClasses = validationClasses.filter(function(obj) {
					return obj.label === classText;
				});
			}
			if (matchingClasses.length > 0) {
				return matchingClasses[0];
			} else {
				return;
			}
		}

		function showSiteImage(){
			if (site.hasOwnProperty("url1")){
				showImage(site.url1);
			}
		}
		
		function showRGBImage() {
			if (site.hasOwnProperty("url2")){
				showImage(site.url2);
			}else{
				showLoading();
				stretch = stretch * 1.5; //rgb images are darker so stretch to start with
				getSiteImageUrl(site, "Red,Green,Blue", "url2", true);
			};
		}

		function stretchImage(up){
			(up) ? stretch = stretch * 1.5 : stretch = stretch / 1.5;
			if (dom.byId("sensorBandInfo").innerHTML == "Up arrow to see the SWIR2, NIR, Red image"){ //currently viewing the red, green, blue
				showLoading();
				getSiteImageUrl(site, "Red,Green,Blue", "url2", true);
			}else{
				showLoading();
				getSiteImageUrl(site, "SWIR1,NIR,Red", "url1", true);				
			}
		}
		function openDirect() {
			window.open("http://andrewcottam.github.io/gee_spectral_library_builder/index.html?x=" + sites[position].x + "&y=" + sites[position].y + "&level=15&sceneid=" + sites[position].sceneid + "&bands=6,4,3");
		}

	});
});

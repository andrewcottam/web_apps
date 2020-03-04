/*jslint plusplus: true */
require(["dojo/dom-class", "esri/SpatialReference", "esri/geometry/Point", "esri/map", "dojo/dom-attr", "dojo/_base/lang", "dojo/Deferred", "dojo/keys", "dojo/topic", "dojo/_base/array", "dojo/dom-style", "dojo/dom", "dojox/gfx", "dojo/io-query", "dojo/dom-style", "dijit/registry", "dojo/on", "dojo/request/script", "dojo/ready", "dijit/form/Button"], function(domClass, SpatialReference, Point, Map, domAttr, lang, Deferred, keys, topic, array, domStyle, dom, gfx, ioQuery, domstyle, registry, on, script, ready, Button) {
	ready(function() {
		//bounding box size aligns the size of the GEE image with an ESRI tile scale 14
		var geeServerUrl, restServerUrl, position = -1, sites, imageSize = 400, bboxSize = 1910.925707126968, bufferSize = 10, urlsToGet, nextSiteRetrieved = true, map, imagerymap, validationClasses, site;
		map = new Map("mapDiv", {
			center : [-56.049, 38.485],
			zoom : 3,
			basemap : "streets"
		});
		imagerymap = new Map("mapDiv2", {
			center : [-56.049, 38.485],
			zoom : 14,
			basemap : "satellite"
		});
		restServerUrl = "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com:8081/python-rest-server/h05googleearthengine"; //ec2-default
		geeServerUrl = "https://geeImageServer.appspot.com";
		getValidationClasses();
		topic.subscribe("urlsPopulated", urlsPopulated);
		on(document, "keydown", keydown);
		on(dom.byId("geimage"), "load", hideLoading);
		var surface = gfx.createSurface("image", imageSize, imageSize);
		surface.createPath("M196 196L204 196L204 204L196 204Z").setStroke("#fff");
		surface = gfx.createSurface("image2", imageSize, imageSize);
		surface.createPath("M196 196L204 196L204 204L196 204Z").setStroke("#000");
		surface = gfx.createSurface("image3", imageSize, imageSize);
		surface.createPath("M196 196L204 196L204 204L196 204Z").setStroke("#fff");
		populateSiteData(bufferSize, 0);

		function hideLoading() {
			domStyle.set(dom.byId("loading"), "display", "none");
		}

		function showLoading() {
			domStyle.set(dom.byId("loading"), "display", "block");
		}

		function getValidationClasses() {
			var deferred;
			deferred = script.get(restServerUrl + "/especies/_get_gee_validation_landcovertypes?format=json", {
				jsonp : "callback"
			});
			deferred.then(function(response) {
				validationClasses = response.records;
			});
			return deferred;
		}

		function populateSiteData(count, oid) {
			var startoid = (oid === undefined) ? sites[sites.length - 1].oid : oid;
			urlsToGet = count;
			getSites(startoid, count).then(function() {
				var toGet = sites.slice(sites.length - count);
				array.forEach(toGet, function(site) {
					getSiteImageUrl(site, false);
				});
			});
		}

		function getSites(startFrom, records) {
			var deferred;
			deferred = script.get(restServerUrl + "/especies/_get_gee_validated_sites?format=json", {
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
			});
			return deferred;
		}

		function getSiteImageUrl(site, rgb) {
			var bbStr = (site.x - bboxSize) + "," + (site.y - bboxSize) + "," + (site.x + bboxSize) + "," + (site.y + bboxSize);
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
				bands: "SWIR2,NIR,Red"
			};
			if (rgb) delete params.bands; // bands are red,green,blue by default on the server
			script.get(geeServerUrl + "/ogc", {
				query : params,
				jsonp : "callback"
			}).then(lang.hitch(site, function(response) {
				if (response.url.search("Google Earth Engine Services Error") != -1) {
					var deleteIndex;
				    array.forEach(sites, function(item, index){ //get the index of the site that failed to get an imageUrl 
				    	if (item.oid == site.oid) {
				    		deleteIndex = index;
				    		return true;
				    	}
				    });
				    sites.splice(deleteIndex,1); //delete the site from the sites array
				    bufferSize = bufferSize - 1; //decrement the bufferSize otherwise we will never move to the first image
				} else {
					if (rgb) {
						domAttr.set(dom.byId("geimage"), "src", response.url);
						return;
					} else {
						lang.mixin(site, {
							'url' : response.url
						});
					}
				}
				urlsToGet = urlsToGet - 1;
				if (urlsToGet === 0) {
					topic.publish("urlsPopulated");
				}
			}));
		}

		function urlsPopulated() {
			if (sites.length === bufferSize) {
				moveImage(1);
			}
		}

		function moveImage(relativePos) {
			var display;
			if (position === 0 && relativePos === -1) {
				return;
			}
			if (nextSiteRetrieved) {
				nextSiteRetrieved = false;
				populateSiteData(1);
			}
			position = position + relativePos;
			site = sites[position];
			if (site.url !== undefined) {
				domAttr.set(dom.byId("geimage"), "src", site.url);
				if (site.hasOwnProperty("x")) {
					var centerPoint = new Point(site.x, site.y, new SpatialReference({
						wkid : 3857
					}));
					map.centerAt(centerPoint);
					imagerymap.centerAndZoom(centerPoint, 14);
					console.log("Center point x=" + centerPoint.x + " y=" + centerPoint.y);
					console.log("Extent of ArcGIS imagery: xmin=" + imagerymap.extent.xmin + " xmax=" + imagerymap.extent.xmax + " ymin=" + imagerymap.extent.ymin + " ymax=" + imagerymap.extent.ymax + " width=" + (imagerymap.extent.xmax - imagerymap.extent.xmin) + " height=" + (imagerymap.extent.ymax - imagerymap.extent.ymin) + " mapCenterX:" + imagerymap.extent.getCenter().x + "  mapCenterY:" + imagerymap.extent.getCenter().y);
					console.log("Site centroid x=" + site.x + " y=" + site.y);
					console.log("Bounding box for GEE img: xmin:" + (site.x - bboxSize) + " xmax=" + (site.x + bboxSize) + " ymin=" + (site.y - bboxSize) + " ymax=" + (site.y + bboxSize) + " width:" + (2 * bboxSize) + " height:" + (2 * bboxSize));
				}
				setLandCoverClass(site);
				display = (site.hasOwnProperty("validated_class")) ? "block" : "none";
				// dom.byId("sensor").innerHTML = site.sensor;
				domStyle.set("tickImage", {
					display : display
				});
			} else {//no more images in the queue - get some more
				dom.byId("predictedClass").innerHTML = "images loading..";
				populateSiteData(bufferSize);
			}
		}

		function keydown(event) {
			switch (event.keyCode) {
				case (keys.RIGHT_ARROW) :
					validateCurrentImage();
					moveImage(1);
					break;
				case (keys.LEFT_ARROW):
					validateCurrentImage();
					moveImage(-1);
					break;
				case (keys.UP_ARROW) :
					openDirect();
					break;
				case (keys.DOWN_ARROW):
					getRGBImage();
					break;
				case (keys.SPACE):
					changeClass();
					break;
			}
		}

		function validateCurrentImage() {
			var validationClass = getMatchingValidationClass(dom.byId("predictedClass").innerHTML);
			var deferred, validated_class = validationClass.class_id;
			showLoading();
			lang.mixin(sites[position], {
				"validated_class" : validated_class
			});
			// commented out on 7/4/17 as we dont want to actually post any data to the database
			// deferred = script.get(restServerUrl + "/especies/_set_gee_site_validated", {
			// 	query : {
			// 		oid : sites[position].oid,
			// 		actualclass : sites[position].validated_class,
			// 		username : 'andrew'
			// 	},
			// 	jsonp : "callback"
			// });
			// deferred.then(function(response) {
			// 	var result = response.records[0]._set_gee_site_validated;
			// 	if (result) {
			// 		getValidatedSiteCount();
			// 	}
			// });
			// return deferred;
		}

		function setLandCoverClass(site) {
			if (site.hasOwnProperty("validated_class")) {
				setValidatedClass(site.validated_class);
			} else {
				setClassText(site.predicted_class);
			}
		}

		function setValidatedClass(validated_class) {
			setClassText(validated_class);
		}

		// commented out on 7/4/17 - no longer posting results to the database
		// function getValidatedSiteCount() {
		// 	var deferred;
		// 	deferred = script.get(restServerUrl + "/especies/_get_gee_validated_site_count?format=json", {
		// 		jsonp : "callback"
		// 	});
		// 	deferred.then(function(response) {
		// 		dom.byId("validatedCount").innerHTML = response.records[0]._get_gee_validated_site_count + " validated";
		// 	});
		// 	return deferred;
		// }

		function setClassText(classText) {
			var validationClass = getMatchingValidationClass(classText);
			domClass.remove("predictedClass");
			domClass.add("predictedClass", validationClass.css_class);
			dom.byId("predictedClass").innerHTML = validationClass.label;
		}

		function changeClass() {
			var validationClass = getMatchingValidationClass(dom.byId("predictedClass").innerHTML);
			setValidatedClass(validationClass.next_value);
		}

		function getMatchingValidationClass(classText) {
			var matchingClasses;
			var reg = new RegExp(/^\d+$/);
			if (reg.test(classText)) {
				matchingClasses = validationClasses.filter(function(obj) {
					return obj.class_id === Number(classText);
				});
			} else {
				matchingClasses = validationClasses.filter(function(obj) {
					return obj.label === classText;
				});
			}
			if (matchingClasses.length > 0) {
				return matchingClasses[0];
			} else {
				return;
			}
		}

		function getRGBImage() {
			showLoading();
			getSiteImageUrl(site, true);
		}

		function openDirect() {
			window.open("https://andrewcottam.github.io/web_apps/gee_tools/spectral.html?x=" + sites[position].x + "&y=" + sites[position].y + "&level=14&sceneid=" + sites[position].sceneid + "&bands=6,4,3", "_test");
		}

	});
});

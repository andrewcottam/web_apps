require({
		async: true,
		baseUrl: "/", //we have to specify this otherwise it will use https://ajax.googleapis.com/ajax/libs/dojo/ as the baseUrl
		packages: [{
				name: "widgetsPath",
				location: "../../widgets"
			} //i.e. up 2 levels from index.html 
		]
	}, ["widgetsPath/ImageryTimeSlider", "dojo/_base/window", "dojo/io-query", "dojox/charting/plot2d/StackedColumns", "dojox/charting/axis2d/Default", "dojo/dom-style", "dojox/charting/Chart", "dojo/_base/lang", "dojo/request/script", "dojo/date/stamp", "dijit/registry", "dojo/ready", "dojo/parser", "dojo/_base/array", "dojo/on", "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dijit/form/CheckBox", "dojox/charting/axis2d/Default", "dojox/charting/plot2d/Columns"],
	function(ImageryTimeSlider, win, ioQuery, StackedColumns, Default, domStyle, Chart, lang, script, stamp, registry, ready, parser, array, on) {
		ready(function() {
			var map, imageryTimeSlider, mbLayer, transitionsLayer, p32occurrence, p1p2change, annualRecurrence, maxWaterExtent, seasonality, monthlyRecurrenceChart, yearlyClassificationsChart, queryObject, digitalGlobeLayer;
			var geeServerUrl = "https://geeImageServer.appspot.com";
			var digitialGlobeApiKey = "pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNpbmJscnhhZTBudmp0cWx3MXI5bWt0djgifQ.9DibR63tG-LY6FvjDLhCXg";
			//custom extent can be specified as follows: index.html?lat=15.4818&lng=-3.7372&zoom=12
			queryObject = ioQuery.queryToObject(win.doc.location.search.substring(1));
			parser.parse().then(function() {
				on(registry.byId("toggleMBbasemap"), "change", function(value) {
					(value) ? map.addLayer(mbLayer): map.removeLayer(mbLayer);
				});
				on(registry.byId("toggleDGbasemap"), "change", function(value) {
					(value) ? imageryTimeSlider.show(): imageryTimeSlider.hide();
				});
				on(registry.byId("toggleTransitions"), "change", function(value) {
					(value) ? map.addLayer(transitionsLayer): map.removeLayer(transitionsLayer);
				});
				on(registry.byId("togglep32occurrence"), "change", function(value) {
					(value) ? map.addLayer(p32occurrence): map.removeLayer(p32occurrence);
				});
				on(registry.byId("togglep1p2change"), "change", function(value) {
					(value) ? map.addLayer(p1p2change): map.removeLayer(p1p2change);
				});
				on(registry.byId("toggleannualRecurrence"), "change", function(value) {
					(value) ? map.addLayer(annualRecurrence): map.removeLayer(annualRecurrence);
				});
				on(registry.byId("togglemaxWaterExtent"), "change", function(value) {
					(value) ? map.addLayer(maxWaterExtent): map.removeLayer(maxWaterExtent);
				});
				on(registry.byId("toggleseasonality"), "change", function(value) {
					(value) ? map.addLayer(seasonality): map.removeLayer(seasonality);
				});
			});
			mbLayer = new L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
				attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
				maxZoom: 18,
				id: 'blishten.pnnbdo98',
				accessToken: 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg'
			});
			digitalGlobeLayer = new L.tileLayer('https://{s}.tiles.mapbox.com/v4/digitalglobe.nal0g75k/{z}/{x}/{y}.png?access_token=' + digitialGlobeApiKey, {
				minZoom: 1,
				maxZoom: 19,
				attribution: '(c) <a href="https://microsites.digitalglobe.com/interactive/basemap_vivid/">DigitalGlobe</a> , (c) OpenStreetMap, (c) Mapbox'
			});
			transitionsLayer = new L.tileLayer("https://storage.googleapis.com/global-surface-water/maptiles/transitions/{z}/{x}/{y}.png", {
				format: "image/png",
				maxZoom: 13,
				errorTileUrl: "images/transparent.png",
				attribution: "2016 EC JRC/Google"
			});
			p32occurrence = new L.tileLayer("https://storage.googleapis.com/global-surface-water/maptiles/occurrence/{z}/{x}/{y}.png", {
				format: "image/png",
				maxZoom: 13,
				errorTileUrl: "images/transparent.png",
				attribution: "2016 EC JRC/Google"
			});
			p1p2change = new L.tileLayer("https://storage.googleapis.com/global-surface-water/maptiles/change/{z}/{x}/{y}.png", {
				format: "image/png",
				maxZoom: 13,
				errorTileUrl: "images/transparent.png",
				attribution: "2016 EC JRC/Google"
			});
			annualRecurrence = new L.tileLayer("https://storage.googleapis.com/global-surface-water/maptiles/recurrence/{z}/{x}/{y}.png", {
				format: "image/png",
				maxZoom: 13,
				errorTileUrl: "images/transparent.png",
				attribution: "2016 EC JRC/Google"
			});
			maxWaterExtent = new L.tileLayer("https://storage.googleapis.com/global-surface-water/maptiles/extent/{z}/{x}/{y}.png", {
				format: "image/png",
				maxZoom: 13,
				errorTileUrl: "images/transparent.png",
				attribution: "2016 EC JRC/Google"
			});
			seasonality = new L.tileLayer("https://storage.googleapis.com/global-surface-water/maptiles/seasonality/{z}/{x}/{y}.png", {
				format: "image/png",
				maxZoom: 13,
				errorTileUrl: "images/transparent.png",
				attribution: "2016 EC JRC/Google"
			});
			map = L.map('map', {
				layers: [transitionsLayer],
				center: [16.02, -3.64],
				zoom: 12,
				loadingControl: true,
				fullscreenControl: true,
			});
			map.whenReady(function mapLoaded(e) {
				createMonthlyRecurrenceChart();
				createYearlyClassificationsChart();
				if (queryObject.lat !== undefined) {
					map.setView({
						lon: queryObject.lng,
						lat: queryObject.lat
					}, queryObject.zoom);
				};
				map.on("click", function(e) {
					getMonthlyRecurrence(e.latlng);
					getYearlyClassifications(e.latlng);
				});
				imageryTimeSlider = new ImageryTimeSlider({
					leafletMap: map,
					hideToEdge: true
				}, "ImageryTimeSliderDiv");
				imageryTimeSlider.startup();
			});

			function createGeeServerLayer(layerName) {
				var layer = L.nonTiledLayer.wms(geeServerUrl + "/ogc", {
					layers: layerName, // layers options: transitionClass, p32occurrence, p1p2change, annualRecurrence, maxWaterExtent, seasonality, sentinel2, landsat8
					format: 'image/png',
					attribution: "JRC Water Data"
				});
				return layer;
			}

			function createMonthlyRecurrenceChart() {
				monthlyRecurrenceChart = new Chart("monthlyRecurrenceChart", {
					title: "Monthly recurrence",
					titleFont: "normal normal normal 12pt Tahoma",
					titleGap: 10
				});
				monthlyRecurrenceChart.addPlot("default", {
					type: "StackedColumns",
					gap: 5
				});
				monthlyRecurrenceChart.addAxis("x", {
					title: "Month",
					majorLabels: true,
					minorTicks: false,
					majorTickStep: 1,
					titleOrientation: "away",
					titleGap: 9,
					titleFont: "normal normal normal 9pt Tahoma",
					labels: [{
						value: 1,
						text: "Jan"
					}, {
						value: 2,
						text: "Feb"
					}, {
						value: 3,
						text: "Mar"
					}, {
						value: 4,
						text: "Apr"
					}, {
						value: 5,
						text: "May"
					}, {
						value: 6,
						text: "Jun"
					}, {
						value: 7,
						text: "Jul"
					}, {
						value: 8,
						text: "Aug"
					}, {
						value: 9,
						text: "Sep"
					}, {
						value: 10,
						text: "Oct"
					}, {
						value: 11,
						text: "Nov"
					}, {
						value: 12,
						text: "Dec"
					}]
				});
				monthlyRecurrenceChart.addAxis("y", {
					min: 0,
					max: 1,
					vertical: true,
					fixLower: "major",
					fixUpper: "major",
					majorLabels: true,
					minorLabels: true,
					title: 'Recurrence',
					titleGap: 9,
					titleFont: "normal normal normal 9pt Tahoma"
				});
				monthlyRecurrenceChart.connectToPlot("default", function(evt) {
					var shape = evt.shape,
						type = evt.type;
					switch (type) {
						case "onclick":
							console.log("onclick");
							break;
						case "onmouseover":
							shape.moveToFront();
							shape.setStroke("#bbbbbb");
							break;
						case "onmouseout":
							shape.setStroke("#ffffff");
							break;
						default:
							break;
					}; //end switch statement
				}); //end connectToPlot
			};

			function createYearlyClassificationsChart() {
				yearlyClassificationsChart = new Chart("yearlyClassificationsChart", {
					title: "Yearly water class",
					titleFont: "normal normal normal 12pt Tahoma",
					titleGap: 10
				});
				yearlyClassificationsChart.addPlot("default", {
					type: "Columns"
				});
				yearlyClassificationsChart.addAxis("x", {
					title: "Year",
					majorLabels: true,
					minorTicks: false,
					majorTickStep: 1,
					rotation: -90,
					titleOrientation: "away",
					titleGap: 9,
					titleFont: "normal normal normal 9pt Tahoma",
					labels: [{
						value: 1,
						text: "1984"
					}, {
						value: 2,
						text: "1985"
					}, {
						value: 3,
						text: "1986"
					}, {
						value: 4,
						text: "1987"
					}, {
						value: 5,
						text: "1988"
					}, {
						value: 6,
						text: "1989"
					}, {
						value: 7,
						text: "1990"
					}, {
						value: 8,
						text: "1991"
					}, {
						value: 9,
						text: "1992"
					}, {
						value: 10,
						text: "1993"
					}, {
						value: 11,
						text: "1994"
					}, {
						value: 12,
						text: "1995"
					}, {
						value: 13,
						text: "1996"
					}, {
						value: 14,
						text: "1997"
					}, {
						value: 15,
						text: "1998"
					}, {
						value: 16,
						text: "1999"
					}, {
						value: 17,
						text: "2000"
					}, {
						value: 18,
						text: "2001"
					}, {
						value: 19,
						text: "2002"
					}, {
						value: 20,
						text: "2003"
					}, {
						value: 21,
						text: "2004"
					}, {
						value: 22,
						text: "2005"
					}, {
						value: 23,
						text: "2006"
					}, {
						value: 24,
						text: "2007"
					}, {
						value: 25,
						text: "2008"
					}, {
						value: 26,
						text: "2009"
					}, {
						value: 27,
						text: "2010"
					}, {
						value: 28,
						text: "2011"
					}, {
						value: 29,
						text: "2012"
					}, {
						value: 30,
						text: "2013"
					}, {
						value: 31,
						text: "2014"
					}, {
						value: 32,
						text: "2015"
					}]
				});
				yearlyClassificationsChart.addAxis("y", {
					min: 0,
					max: 1,
					vertical: true,
					fixLower: "major",
					fixUpper: "major",
					majorLabels: false,
					minorLabels: false,
					majorTicks: false,
					minorTicks: false,
					title: 'Water class',
					titleGap: 9,
					titleFont: "normal normal normal 9pt Tahoma"
				});
				yearlyClassificationsChart.connectToPlot("default", function(evt) {
					var shape = evt.shape,
						type = evt.type;
					switch (type) {
						case "onclick":
							console.log("onclick");
							break;
						case "onmouseover":
							shape.moveToFront();
							shape.setStroke("#bbbbbb");
							break;
						case "onmouseout":
							shape.setStroke("#ffffff");
							break;
						default:
							break;
					}; //end switch statement
				}); //end connectToPlot
			}

			function getMonthlyRecurrence(latLong) {
				domStyle.set("loading1", "display", "block");
				script.get(geeServerUrl + "/monthlyRecurrence", {
					query: {
						lng: latLong.lng,
						lat: latLong.lat
					},
					jsonp: "callback"
				}).then(lang.hitch(this, function(response) {
					var recurrenceData = [],
						obsData = [];
					array.forEach(response.records, function(record, index) {
						recurrenceData.push({
							x: index + 1,
							y: record.monthly_recurrence,
							fill: "#006AC2",
							stroke: "#ffffff"
						});
						obsData.push({
							x: index + 1,
							y: 1 - record.monthly_recurrence,
							fill: "#FFD5A7",
							stroke: "#ffffff"
						});
					});
					monthlyRecurrenceChart.addSeries("series1", {
						data: recurrenceData
					});
					monthlyRecurrenceChart.addSeries("series2", {
						data: obsData
					});
					monthlyRecurrenceChart.render();
					domStyle.set("loading1", "display", "none");
				}));
			}

			function getYearlyClassifications(latLong) {
				domStyle.set("loading2", "display", "block");
				script.get(geeServerUrl + "/yearlyClassifications", {
					query: {
						lng: latLong.lng,
						lat: latLong.lat
					},
					jsonp: "callback"
				}).then(lang.hitch(this, function(response) {
					var yearlyData = [];
					array.forEach(response.records, function(record, index) {
						var color, value = 1;
						switch (record.waterClass) {
							case 0:
								color = "none";
								value = 0; //dont show the bar
								break;
							case 1:
								color = "#FFD5A7"; //not water
								break;
							case 2:
								color = "#8ADBF0"; //seasonal
								break;
							case 3:
								color = "#006AC2"; //permanent
								break;
						}
						yearlyData.push({
							x: index + 1,
							y: value,
							fill: color,
							stroke: "#ffffff"
						});
					});
					yearlyClassificationsChart.addSeries("series1", {
						data: yearlyData
					});
					yearlyClassificationsChart.render();
					domStyle.set("loading2", "display", "none");
				}));
			}

			function extentChange(event) {
				console.log("extentChange (x=" + map.extent.getCenter().x + " y=" + map.extent.getCenter().y + ")");
				array.forEach(map.layerIds, function(item) {
					var layer = map.getLayer(item);
					if (layer.declaredClass === 'jrc/WaterLayer') {
						layer.set("extent", map.extent);
					};
				});
			}

			function getMap() {
				array.forEach(map.layerIds, function(item) {
					var layer = map.getLayer(item);
					if (layer.declaredClass === 'jrc/WaterLayer') {
						layer.refresh();
					};
				});
			}

		});
	});

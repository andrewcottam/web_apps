//widgets/ImageryTimeSlider.js
//UI widget that is used as a tool to show satellite imagery coming from Google Earth Engine. It has the following options:
//  showAllYears - set to true to show tics and labels for all years even those without imagery 
//  hideToEdge - to hide the widget to the edge of the leaflet map

define(["dojo/request/xhr", "dojo/Evented", "dijit/registry", "dojo/dom-attr", "dijit/_WidgetsInTemplateMixin", "dijit/Dialog", "dijit/focus", "dojo/_base/window", "dojo/keys", "dojo/html", "dojo/date", "dojo/date/locale", "dojo/dom", "dojo/dom-style", "dojo/dom-geometry", "dojo/dom-class", "dojo/_base/array", "dojo/dom-construct", "dojo/request/script", "dojo/_base/lang", "dojo/on", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./templates/ImageryTimeSlider.html", "dijit/form/Select", "dijit/form/NumberSpinner", "dijit/form/CheckBox", "../widgets/scripts/NonTiledLayer.js", "../widgets/scripts/NonTiledLayer.WMS.js", "../widgets/scripts/Control.Loading.js", "../widgets/scripts/L.Control.MousePosition.js", "../widgets/scripts/geeImageLayer.js"],
	function(xhr, Evented, registry, domAttr, _WidgetsInTemplateMixin, Dialog, focusUtil, win, keys, html, date, locale, dom, domStyle, domGeom, domClass, array, domConstruct, script, lang, on, declare, _WidgetBase, _TemplatedMixin, template) {
		return declare("ImageryTimeSlider", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
			templateString: template,
			baseClass: "imageryTimeSlider",
			geeServerUrl: "https://geeImageServer.appspot.com",
			sentinelHubUrlWFS: "https://services.sentinel-hub.com/v1/wfs/363b9a1a-de1b-4009-b1d2-ba935bea739e?",
			sentinelHubUrlWMS: "https://services.sentinel-hub.com/v1/wms/363b9a1a-de1b-4009-b1d2-ba935bea739e?showLogo=false",
			cloudMax: 10,
			bands: "Red,Green,Blue",
			stretch: 1,
			includeslc: 0, //set to 1 to also include Landsat 7 imagery with SLC-offset data
			layers: "all",
			hideToEdge: false,
			provider: "sentinelHub",
			unfilteredYearMonths: null,
			_setUnfilteredYearMonthsAttr: function(value) {
				this._set("unfilteredYearMonths", value);
				// console.info(value);
				this.yearMonthsSet();
			},
			postMixInProperties: function() {
				if (this.leafletMap !== undefined) {
					if (this.leafletMap.getBounds() !== undefined) {
						on.pausable(this.leafletMap, "moveend", lang.hitch(this, this.mapBoundsChanged));
					}
				}
			},
			postCreate: function() {
				domClass.add(win.body(), "claro"); //give the widget the claro class in case its not in the body
				var showImgNode = domConstruct.place("<img src='../widgets/images/left.png' id='showImg' title='Click to show imagery selector'>", win.body()); //create a node for the show imagery selector button
				on(showImgNode, "click", lang.hitch(this, this.show)); //add handling of clicking on the show imagery selector button
				on(dom.byId("sliderBar"), "click", lang.hitch(this, this.barClicked)); //add handling of clicking on the slider bar
				on(win.body(), "keydown", lang.hitch(this, this.keyDown)); //add handling of LEFT and RIGHT arrow presses and 
				if (this.leafletMap) { //position the slider
					var mapGeom = domGeom.position(this.leafletMap.getContainer()); //get the position of the dom for the leaflet map
					var thisGeom = domGeom.position(this.domNode); //get the position of this widgets dom
					domStyle.set(this.domNode, "left", mapGeom.x + ((mapGeom.w - thisGeom.w) / 2) + "px"); //put it in the middle of the map
					if (!this.height) {
						this.height = domGeom.position(this.domNode).h;
					}
					domStyle.set(this.domNode, "top", mapGeom.y + mapGeom.h - this.height - 5 + "px"); //5 pixels up from the bottom
					domConstruct.place(this.domNode, win.body()); //place this widget at the top level in case it is nested in the page (e.g. in Drupal panels)
					on(this.domNode, "mousedown", function() {
						console.log("mousedown");
					});
					on(this.domNode, "mousemove", lang.hitch(this, function(evt) {
						if (evt.buttons == 1) {
							console.debug("dragging");
							domStyle.set(this.domNode, "left", domStyle.get(this.domNode, "left") + evt.movementX + "px");
							domStyle.set(this.domNode, "top", domStyle.get(this.domNode, "top") + evt.movementY + "px");
							evt.preventDefault();
						}
					}));
				}
				this.show(); //this will make the initial call to get the imagery dates
			},
			mapBoundsChanged: function() { //refetch the images
				this.mapBounds = this.leafletMap.getBounds();
				var requestDates = true;
				if (this.previousBounds) {
					if (this.previousBounds.contains(this.mapBounds)&&(this.provider=="geeImagerServer")) { //if we are zooming within the current bounds we dont need to get the imagery dates again for the geeImageServer
						requestDates = false;
					}
				}
				if (requestDates) {
					if (domStyle.get("showImg", "display") == "none") { //only request dates if this imagery selector is currently visible
						this.requestDates();
					}
				}
				this.previousBounds = this.mapBounds;
			},
			requestDates: function() {
				this.disableSlider();
				html.set(dom.byId("yearMonth"), "Loading dates..");
				switch (this.provider) {
					case "sentinelHub":
						this.requestDates_sentinelHub();
						break;
					case "geeImagerServer":
						this.requestDates_geeImageServer();
						break;
				}
			},
			requestDates_geeImageServer: function() {
				var params = {
					srs: "EPSG:4326",
					bbox: this.mapBounds.getWest() + "," + this.mapBounds.getSouth() + "," + this.mapBounds.getEast() + "," + this.mapBounds.getNorth(),
					cloudmax: this.cloudMax,
					includeslc: this.includeslc,
					layers: this.layers,
				};
				script.get(this.geeServerUrl + "/getUniqueYearMonths", { //get the dates from the geeImagerServer API
					query: params,
					jsonp: "callback"
				}).then(lang.hitch(this, function(response) {
					if (response.records.length == 0) {
						this.noDatesReturned();
					}
					else {
						this.set("unfilteredYearMonths", response.records);
					}
				}), function(error) {
					console.log(error);
				});
			},
			requestDates_sentinelHub: function() {
				var params = {
					request: "GetFeature",
					srsname: "EPSG:4326",
					bbox: this.mapBounds.getSouth() + "," + this.mapBounds.getWest() + "," + this.mapBounds.getNorth() + "," + this.mapBounds.getEast(),
					time: "1984-01-01/2020-01-01", //TODO hard-coded with 2020 for now
					typenames: "TILE",
					maxcc: this.cloudMax,
					outputformat: "application/json",
				};
				xhr(this.sentinelHubUrlWFS, {
					query: params,
					handleAs: "json",
					sync: true,
					headers: {
						"X-Requested-With": null
					},
				}).then(lang.hitch(this, function(response) {
					var yearMonths = [];
					if (response.features.length > 0) {
						array.forEach(response.features, function(feature) {
							var yearMonth = feature.properties.date.substr(0, 7); //"2017-01"
							if (yearMonths.indexOf(yearMonth) == -1) {
								yearMonths.push(yearMonth);
							}
						});
						this.set("unfilteredYearMonths", yearMonths.reverse());
					}
					else {
						this.noDatesReturned();
					}
				}), function(err) {
					alert("Unable to get data from WFS");
				});
			},
			yearMonthsSet: function() { //the yearMonths may need filtering by month
				var monthFilterValue = this.monthSelector.value;
				if (monthFilterValue == "None") {
					this.yearMonths = this.unfilteredYearMonths;
				}
				else {
					this.yearMonths = array.filter(this.unfilteredYearMonths, function(item) {
						return item.slice(-2) == monthFilterValue;
					});
				}
				this.createSlider();
				if (this.yearMonths.indexOf(this.yearMonth) > -1) {
					this.setDate(this.yearMonth); //get the same year/month that is already mapped
				}
				else {
					this.setDate(this.yearMonths[this.yearMonths.length - 1]); //get the most recent image
				}
			},
			setDate: function(yearMonth) {
				this.yearMonth = yearMonth;
				this.requestImagery(yearMonth); //request the image
				html.set(dom.byId("yearMonth"), this.formatYearMonth(yearMonth)); //show the date
				this.activeDiv && domClass.replace(this.activeDiv, "data", "tdActive"); //reset the css to data for the last active div
				this.activeDiv = dom.byId(yearMonth);
				domClass.replace(this.activeDiv, "tdActive", "data"); //set the css to active td
				focusUtil.curNode && focusUtil.curNode.blur(); //take the focus off the map otherwise any keyboard events target the map
			},
			noDatesReturned: function() {
				//not implemented
			},
			createSlider: function() {
				//empty the existing doms
				domConstruct.empty("sliderBar");
				domConstruct.empty("sliderLabels");
				domConstruct.empty("sliderTics");
				//get all the year/months as yyyy-mm
				var yearMonths = this.getAllYearMonths();
				array.forEach(yearMonths, lang.hitch(this, function(item) {
					if ((array.indexOf(this.yearMonths, item) >= 0)) { //tds showing where there is imagery
						domConstruct.place("<td id='" + item + "' title='" + this.formatYearMonth(item) + "' class='data'>", "sliderBar"); //imagery present
					}
					else {
						domConstruct.place("<td class='nodata'>", "sliderBar"); //no imagery
					}
					if (item.slice(-2) == "01") { //year tics and labels
						var year = item.slice(0, 4);
						var hasData = array.some(this.yearMonths, function(item) {
							return item.slice(0, 4) == year;
						});
						var currentYear = new Date().getFullYear();
						if (hasData || this.showAllYears || Number(year) == 1984 || Number(year) == currentYear) { //show tics/labels if there is imagery, if showAllYears is true, or it is the first/last year
							domConstruct.place("<td class='sliderTic'></td>", "sliderTics");
							domConstruct.place("<td><div class='sliderLabel'>" + year + "</div></td>", "sliderLabels");
						}
						else {
							domConstruct.place("<td class='sliderNoTic'></td>", "sliderTics");
							domConstruct.place("<td></td>", "sliderLabels");
						}
					}
				}));
			},
			getAllYearMonths: function() {
				var years = [];
				var currentDate = new Date();
				var currentYear = currentDate.getFullYear();
				var currentMonth = currentDate.getMonth() + 1;
				for (var y = 1984; y <= currentYear; y++) {
					years.push(y);
				}
				//get all the year months
				var yearMonths = [];
				array.forEach(years, function(year) {
					for (var m = 1; m <= 12; m++) {
						yearMonths.push(year + "-" + ("0" + m).slice(-2));
					}
				});
				//get the current month
				return yearMonths.slice(0, (12 - currentMonth) * (-1));
			},
			barClicked: function(evt) { // set the imagery label to indicate the month and year, set the active div and request the imagery
				if (evt.target.id) { //if we have a year month
					this.setDate(evt.target.id);
				}
			},
			requestImagery: function(yearMonth) {
				var wmsParams;
				html.set(dom.byId("yearMonth"), "Loading image..");
				this.disableSlider();
				var yearPart = Number(yearMonth.substring(0, 4));
				var monthPart = Number(yearMonth.slice(-2));
				var startDate = new Date(yearPart, monthPart - 1, 1);
				var startDateF = locale.format(startDate, {
					selector: "date",
					datePattern: "yyyy-MM-dd"
				}); //in JavaScript, counting of months starts at 0
				var endDateF = locale.format(date.add(startDate, "month", 1), {
					selector: "date",
					datePattern: "yyyy-MM-dd"
				});
				switch (this.provider) {
					case "sentinelHub":
						wmsParams = this.getParams_sentinelHub(startDateF, endDateF);
						if (!this.imageLayer) {
							this.imageLayer = L.tileLayer.wms(this.sentinelHubUrlWMS, wmsParams);
							this.addLayer(this.imageLayer);
						}
						else {
							this.imageLayer.setParams(wmsParams);
						}
						break;
					case "geeImagerServer":
						wmsParams = this.getParams_geeImageServer(startDateF, endDateF);
						if (!this.imageLayer) { //add the layer if it is not already present
							this.imageLayer = new geeImageLayer(this.geeServerUrl + "/ogc", wmsParams);
							this.addLayer(this.imageLayer);
						}
						else {
							this.imageLayer.setParams(wmsParams);
						}
						break;
				}
			},
			addLayer: function(layer) {
				on(layer, "load", lang.hitch(this, function(response) {
					this.enableSlider(); //enable the slider when the image has loaded
				}));
				this.leafletMap.addLayer(layer);
			},
			getParams_geeImageServer: function(startDateF, endDateF) {
				var wmsParams = {
					layers: this.layers,
					startDate: startDateF,
					endDate: endDateF,
					cloudmax: this.cloudMax,
					bands: this.bands,
					stretch: this.stretch,
					includeslc: this.includeslc,
				};
				return wmsParams;
			},
			getParams_sentinelHub: function(startDateF, endDateF) {
				var wmsParams = {
					attribution: '&copy; <a href="http://www.sentinel-hub.com/" target="_blank">Sentinel Hub</a>',
					layers: 'TRUE_COLOR,OUTLINE,DATE',
					time: startDateF + "/" + endDateF + "/P1D",
					tileSize: 512,
					atmFilter: 'ATMCOR',
					gain: this.stretch,
					priority: 'leastCC',
					maxcc: this.cloudMax,
					preview: 0, //dont use pyramids
					// preview: 2, //use pre-generated pyramides when zoomed out
					bgcolor: "#cccccc",
				};
				return wmsParams;
			},
			formatYearMonth: function(yearMonth) { //gets the formatted year month from a yearMonth, e.g. 2004-06 -> June 2004
				var yearPart = Number(yearMonth.substring(0, 4));
				var monthPart = Number(yearMonth.slice(-2));
				var _date = new Date(yearPart, monthPart - 1, 1);
				var formattedDate = locale.format(_date, {
					selector: "date",
					datePattern: "MMM yyyy"
				});
				return formattedDate;
			},
			keyDown: function(evt) {
				var index = this.yearMonths.indexOf(this.yearMonth); //get the index of the current year month
				switch (evt.keyCode) {
					case (keys.RIGHT_ARROW):
						if (index < this.yearMonths.length - 1) {
							this.setDate(this.yearMonths[index + 1]);
						}
						break;
					case (keys.LEFT_ARROW):
						if (index > 0) {
							this.setDate(this.yearMonths[index - 1]);
						}
						break;
					case (keys.NUMPAD_PLUS):
						this.stretchImage(true);
						break;
					case (keys.NUMPAD_MINUS):
						this.stretchImage(false);
						break;
				}
			},
			showSettings: function(evt) {
				var value = (domStyle.get("ImageryTimeSliderControls", "display") == "block") ? "none" : "block";
				domStyle.set(dom.byId("ImageryTimeSliderControls"), "display", value);
				var image = (domStyle.get("ImageryTimeSliderControls", "display") == "block") ? "up.png" : "down.png";
				domAttr.set("configImg", "src", "../widgets/images/" + image);
			},
			bandsChanged: function(value) {
				this.bands = value;
				this.requestImagery(this.yearMonth);
			},
			cloudMaxChanged: function(value) {
				this.cloudMax = value;
				this.requestDates(); //get the unique month/years for the cloud max
			},
			stretchImage: function(up) {
				(up) ? this.stretch = this.stretch * 1.5: this.stretch = this.stretch / 1.5;
				this.requestImagery(this.yearMonth);
			},
			blurCloudMaxSpinner: function(evt) {
				switch (evt.keyCode) {
					case (keys.ENTER):
						focusUtil.curNode.blur();
						break;
				}
			},
			copernicusChanged: function(value) {
				this.layers = (value) ? "COPERNICUS/S2" : "all";
				this.requestDates();
			},
			slcChanged: function(value) {
				this.includeslc = (value) ? "1" : "0";
				this.requestDates();
			},
			monthChanged: function(value) {
				this.yearMonthsSet();
			},
			openInfo: function() {
				domClass.add(win.body(), "claro");
				var infoDialog = new Dialog({
					title: "Information",
					href: "../widgets/resources/imageControllerInfo.html",
					style: "width: 800px"
				});
				infoDialog.show();
			},
			hide: function() {
				domStyle.set(this.domNode, "display", "none");
				if (this.hideToEdge) { //show the show arrow at the right of the leaflet map
					var mapGeom = domGeom.position(this.leafletMap.getContainer()); //get the position of the dom for the leaflet map
					//show the open image
					domStyle.set("showImg", "display", "block");
					domStyle.set("showImg", "left", mapGeom.x + mapGeom.w - 16 + "px");
					domStyle.set("showImg", "top", mapGeom.y + mapGeom.h - 66 + "px");
					this.leafletMap.removeLayer(this.imageLayer); //remove the layer from the map
				}
				else {
					this.leafletMap.removeLayer(this.imageLayer); //remove the layer from the map
					delete this.imageLayer;
				}
				this.emit("hideImageryTimeSlider");
			},
			show: function() {
				domStyle.set("showImg", "display", "none");
				domStyle.set(this.domNode, "display", "block");
				this.imageLayer && this.leafletMap.addLayer(this.imageLayer); //add the layer if it is currently hidden
				this.mapBoundsChanged(); //this will make the call to get the dates
			},
			disableSlider: function() {
				array.forEach(registry.findWidgets(this.domNode), function(widget) {
					widget.set("disabled", true);
				});
				domStyle.set("slider", "opacity", "0.3");
				if (!dom.byId('blockingDiv')) {
					domConstruct.place("<div id='blockingDiv'></div", "slider");
				}
			},
			enableSlider: function() {
				array.forEach(registry.findWidgets(this.domNode), function(widget) {
					widget.set("disabled", false);
				});
				domStyle.set("slider", "opacity", "1");
				domConstruct.destroy("blockingDiv");
				//			domStyle.set(this.domNode, "cursor", "default");
			},
		});
	});

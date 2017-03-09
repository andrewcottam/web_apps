//widgets/ImageryTimeSlider.js
//UI widget that is used as a tool to show satellite imagery coming from Google Earth Engine. It has the following options:
//  showAllYears - set to true to show tics and labels for all years even those without imagery 

define(["dijit/registry", "dojo/dom-attr", "dijit/_WidgetsInTemplateMixin", "dijit/Dialog", "dijit/focus", "dojo/_base/window", "dojo/keys", "dojo/html", "dojo/date", "dojo/date/locale", "dojo/dom", "dojo/dom-style", "dojo/dom-geometry", "dojo/dom-class", "dojo/_base/array", "dojo/dom-construct", "dojo/request/script", "dojo/_base/lang", "dojo/on", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./templates/ImageryTimeSlider.html", "dijit/form/Select", "dijit/form/NumberSpinner", "dijit/form/CheckBox"], 
	function(registry, domAttr, _WidgetsInTemplateMixin, Dialog, focusUtil, win, keys, html, date, locale, dom, domStyle, domGeom, domClass, array, domConstruct, script, lang, on, declare, _WidgetBase, _TemplatedMixin, template) {
    return declare("ImageryTimeSlider", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        baseClass: "imageryTimeSlider",
		geeServerUrl: "https://geeImageServer.appspot.com",
        cloudMax: 10,
		bands: "Red,Green,Blue",
		stretch: 1,
        includeslc: 0,  //set to 1 to also include Landsat 7 imagery with SLC-offset data
		layers: "all",
		hideToEdge: false,
		postMixInProperties : function() {
			if (this.leafletMap!==undefined){
				if (this.leafletMap.getBounds()!==undefined){
					on.pausable(this.leafletMap, "moveend", lang.hitch(this, this.mapBoundsChanged));
				}
			}
		},
        postCreate: function(){
        	domClass.add(win.body(), "claro"); //give the widget the claro class in case its not in the body
			var showImgNode = domConstruct.place("<img src='../widgets/images/left.png' id='showImg' title='Click to show imagery selector'>", win.body()); //create a node for the show imagery selector button
			on(showImgNode, "click", lang.hitch(this, this.show)); //add handling of clicking on the show imagery selector button
        	on(dom.byId("sliderBar"), "click", lang.hitch(this, this.barClicked)); //add handling of clicking on the slider bar
        	on(win.body(), "keydown", lang.hitch(this, this.keyDown)); //add handling of LEFT and RIGHT arrow presses and 
			this.mapBoundsChanged(); //this will make the initial call
        },
		mapBoundsChanged: function(){ //refetch the images
			this.mapBounds = this.leafletMap.getBounds();
			if (domStyle.get("showImg", "display")=="none"){ //only request dates if this imagery selector is currently visible
				this.requestDates();
			}
		},
		requestDates: function(){
			this.disableSlider();
			var params = {
				srs : "EPSG:4326",
				bbox : this.mapBounds.getWest() + "," + this.mapBounds.getSouth() + "," + this.mapBounds.getEast() + "," + this.mapBounds.getNorth(),
			    cloudmax: this.cloudMax,
			    includeslc: this.includeslc,
			    layers: this.layers,
			};
			script.get(this.geeServerUrl + "/getUniqueYearMonths", { //get the dates from the geeImagerServer API
				query : params,
				jsonp : "callback"
			}).then(lang.hitch(this, function(response) {
				if (response.records.length==0){
					this.noDatesReturned();
				}else{
					this.unfilteredYearMonths = response.records;
					this.yearMonthsSet();
				}
			}),function(error){
				console.log(error);
			});    				
		},
		yearMonthsSet: function(){ //the yearMonths may need filtering by month
			var monthFilterValue = this.monthSelector.value;
			if (monthFilterValue == "None"){
				this.yearMonths = this.unfilteredYearMonths;
			}else{
				this.yearMonths = array.filter(this.unfilteredYearMonths, function(item){
					return item.slice(-2) == monthFilterValue;
				});
			}
			this.createSlider();
			this.setDate(this.yearMonths[this.yearMonths.length-1]);//get the most recent image
		},
		setDate: function(yearMonth){
			this.yearMonth = yearMonth;
			this.requestImagery(yearMonth); //request the image
			html.set(dom.byId("yearMonth"), this.formatYearMonth(yearMonth)); //show the date
			if (this.activeDiv){ //programmatically set the active node
				domClass.replace(this.activeDiv, "data", "tdActive"); //reset the css to data for the last active div
			}
			this.activeDiv = dom.byId(yearMonth);
			domClass.replace(this.activeDiv, "tdActive", "data"); //set the css to active td
		},
		noDatesReturned: function(){
			//not implemented
		},
		createSlider: function(){
			//empty the existing doms
			domConstruct.empty("sliderBar");
			domConstruct.empty("sliderLabels");
			domConstruct.empty("sliderTics");
			//get all the year/months as yyyy-mm
			var yearMonths = this.getAllYearMonths();
			array.forEach(yearMonths, lang.hitch(this, function(item){
				if ((array.indexOf(this.yearMonths, item)>=0)){ //tds showing where there is imagery
					domConstruct.place("<td id='" + item + "' title='" + this.formatYearMonth(item) + "' class='data'>", "sliderBar"); //imagery present
				}else{
					domConstruct.place("<td class='nodata'>", "sliderBar"); //no imagery
				}
				if (item.slice(-2)=="01"){ //year tics and labels
					var year = item.slice(0,4);
					var hasData = array.some(this.yearMonths, function(item){return item.slice(0,4) == year;});
					var currentYear = new Date().getFullYear();
				    if(hasData || this.showAllYears || Number(year)==1984 || Number(year)==currentYear){ //show tics/labels if there is imagery, if showAllYears is true, or it is the first/last year
				    	domConstruct.place("<td class='sliderTic'></td>", "sliderTics");
				    	domConstruct.place("<td><div class='sliderLabel'>" + year + "</div></td>", "sliderLabels");
				    }else{
				    	domConstruct.place("<td class='sliderNoTic'></td>", "sliderTics");
				    	domConstruct.place("<td></td>", "sliderLabels");
				    }
				}
			}));
        	if (this.leafletMap){ //position the slider
        		domStyle.set(this.domNode, "display", "block");
        		var mapGeom = domGeom.position(this.leafletMap.getContainer()); //get the position of the dom for the leaflet map
        		var thisGeom = domGeom.position(this.domNode); //get the position of this widgets dom
        		domStyle.set(this.domNode, "left", mapGeom.x + ((mapGeom.w - thisGeom.w)/2) + "px"); //put it in the middle of the map
        		if (!this.height){
        			this.height = domGeom.position(this.domNode).h;
        		}
        		domStyle.set(this.domNode, "top", mapGeom.y + mapGeom.h - this.height - 5 + "px"); //5 pixels up from the bottom
        		this.enableSlider();
        		domConstruct.place(this.domNode, win.body()); //place this widget at the top level in case it is nested in the page (e.g. in Drupal panels)
        	}
		},
		getAllYearMonths: function(){
			var years = [];
			var currentDate = new Date();
			var currentYear = currentDate.getFullYear();
			var currentMonth = currentDate.getMonth() + 1;
		    for (var y = 1984; y <= currentYear; y++) {
		    	years.push(y);
		    }
		    //get all the year months
		    var yearMonths = [];
		    array.forEach(years, function(year){
			    for (var m = 1; m <= 12; m++) {
			    	yearMonths.push(year + "-" + ("0" + m).slice(-2));
			    }
		    });
		    //get the current month
		    return yearMonths.slice(0, (12-currentMonth)*(-1));
		},
		barClicked: function(evt){ // set the imagery label to indicate the month and year, set the active div and request the imagery
			if (evt.target.id){ //if we have a year month
				this.setDate(evt.target.id);
			}
		},
		requestImagery: function(yearMonth){
			this.disableSlider();
			this.removeImageryLayer();
    		var yearPart = Number(yearMonth.substring(0,4));
    		var monthPart = Number(yearMonth.slice(-2));
    		var startDate = new Date(yearPart, monthPart - 1, 1);
    		var startDateF = locale.format(startDate, {selector: "date", datePattern: "yyyy-MM-dd"}); //in JavaScript, counting of months starts at 0
    		var endDateF = locale.format(date.add(startDate, "month", 1), {selector: "date", datePattern: "yyyy-MM-dd"});
			this.geeImageLayer = L.nonTiledLayer.wms(this.geeServerUrl + "/ogc", {
			    layers: this.layers, 	
			    format: 'image/png',	
			    startDate: startDateF,
			    endDate: endDateF,
			    cloudmax: this.cloudMax,
			    bands: this.bands,
			    stretch: this.stretch,
			    includeslc: this.includeslc,
			});
			this.leafletMap.addLayer(this.geeImageLayer);
            this.imageLoadHandler = on(this.geeImageLayer, "load", lang.hitch(this, this.enableSlider)); //enable the slider when the image has loaded
		},
		removeImageryLayer: function(){
   			if (this.geeImageLayer){
				this.leafletMap.removeLayer(this.geeImageLayer);
			}
		},
		formatYearMonth:function(yearMonth){//gets the formatted year month from a yearMonth, e.g. 2004-06 -> June 2004
    		var yearPart = Number(yearMonth.substring(0,4));
    		var monthPart = Number(yearMonth.slice(-2));
    		var _date = new Date(yearPart, monthPart - 1, 1);
			var formattedDate = locale.format(_date, {selector: "date", datePattern: "MMM yyyy"});
			return formattedDate;
		},
		keyDown: function(evt){
			var index = this.yearMonths.indexOf(this.yearMonth); //get the index of the current year month
			switch (evt.keyCode) {
				case (keys.RIGHT_ARROW) :
					if (index < this.yearMonths.length-1){
						this.setDate(this.yearMonths[index+1]);
					}
					break;
				case (keys.LEFT_ARROW):
					if (index > 0){
						this.setDate(this.yearMonths[index-1]);
					}
					break;
    			case (keys.NUMPAD_PLUS) :
    				this.stretchImage(true);
    				break;
    			case (keys.NUMPAD_MINUS) :
    				this.stretchImage(false);
    				break;
        		}
    	},
    	showSettings: function(evt){
    		var value = (domStyle.get("ImageryTimeSliderControls","display") == "block") ? "none" : "block";
    		domStyle.set(dom.byId("ImageryTimeSliderControls"), "display", value); 		
    		var image = (domStyle.get("ImageryTimeSliderControls","display") == "block") ? "up.png" : "down.png";
    		domAttr.set("configImg", "src", "../widgets/images/" + image); 		
    	},
		bandsChanged: function(value){
			this.bands = value;
			this.requestImagery(this.yearMonth);
		},
		cloudMaxChanged: function(value){
			this.cloudMax = value;
			this.requestDates(); //get the unique month/years for the cloud max
		},
		stretchImage: function(up){
			(up) ? this.stretch = this.stretch * 1.5 : this.stretch = this.stretch / 1.5;
			this.requestImagery(this.yearMonth);
		},
		blurCloudMaxSpinner: function(evt){
    		switch (evt.keyCode) {
			case (keys.ENTER) :
				focusUtil.curNode.blur();
				break;
    		}
		},
		copernicusChanged: function(value){
			this.layers = (value) ? "COPERNICUS/S2" : "all";
			this.requestDates();
		},
		slcChanged: function(value){
			this.includeslc = (value) ? "1" : "0";
			this.requestDates();
		},
		monthChanged: function(value){
			this.yearMonthsSet();
		},
   		openInfo: function(){
			domClass.add(win.body(), "claro");
			var infoDialog = new Dialog({
		        title: "Information",
		        href: "../widgets/resources/imageControllerInfo.html",
		        style: "width: 800px"
			});
			infoDialog.show();
		},
		hide: function(){
			domStyle.set(this.domNode, "display", "none");
			this.removeImageryLayer();
			if (this.hideToEdge){ //show the show arrow at the right of the leaflet map
				var mapGeom = domGeom.position(this.leafletMap.getContainer()); //get the position of the dom for the leaflet map
				//show the open image
				domStyle.set("showImg", "display", "block");
				domStyle.set("showImg", "left", mapGeom.x + mapGeom.w - 16 + "px");
				domStyle.set("showImg", "top", mapGeom.y + mapGeom.h - 66 + "px");
			}
		},
		show: function(){
			domStyle.set("showImg", "display", "none");
			domStyle.set(this.domNode, "display", "block");
			this.mapBoundsChanged(); //this will make the call to get the dates
		},
		disableSlider: function(){
			array.forEach(registry.findWidgets(this.domNode), function(widget){
				widget.set("disabled", true);
			});
			domStyle.set("slider", "opacity", "0.5");
			domConstruct.place("<div id='blockingDiv'></div","slider");
//			domStyle.set(this.domNode, "cursor", "wait");
		},
		enableSlider: function(){
			array.forEach(registry.findWidgets(this.domNode), function(widget){
				widget.set("disabled", false);
			});
			domStyle.set("slider", "opacity", "1");
			domConstruct.destroy("blockingDiv");
//			domStyle.set(this.domNode, "cursor", "default");
		},
    });
});
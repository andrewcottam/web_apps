//widgets/ImageryController.js
define(["dojo/dom-class", "dojox/widget/Standby", "dijit/registry", "dijit/focus", "dojo/dom-geometry", "dojo/html", "dojo/_base/window", "dojo/dom-attr", "dojo/date/locale", "dojo/date", "dojo/number", "dojo/dom", "dojo/keys", "dojo/dom-style", "dojo/dom-construct", "dojo/_base/array", "dojo/request/script", "dojo/_base/lang", "dojo/on", "dojo/_base/declare","dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./templates/ImageryController.html", "dijit/_WidgetsInTemplateMixin", "dijit/form/HorizontalSlider", "dijit/form/HorizontalRule", "dijit/form/HorizontalRuleLabels","dijit/form/Select","dijit/form/CheckBox","dijit/form/NumberSpinner", "dijit/Dialog"],
    function(domClass, Standby, registry, focusUtil, domGeom, html, win, domAttr, locale, date, number, dom, keys, domStyle, domConstruct, array, script, lang, on, declare, _WidgetBase, _TemplatedMixin, template, _WidgetsInTemplateMixin, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Select, CheckBox,NumberSpinner, Dialog){
        return declare("ImageryController", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        	templateString: template,
        	NO_DATE_SELECTED_STRING: "No date selected", 
    		geeServerUrl: "https://geeImageServer.appspot.com",
    		dateMode: "years",
    		currentDate: this.NO_DATE_SELECTED_STRING,
    		cloudMax: 10,
    		bands: "Red,Green,Blue",
    		stretch: 1,
    		monthPixelWidth: 1, //spacing between each hash mark for each month in pixels (1 or 2)
    		layers: "all",
    		paused: false,
    		monthFilter: undefined,
    		includeslc: "0", //set to 1 to also include Landsat 7 imagery with SLC-offset data
    		postMixInProperties : function() {
    			if (this.leafletMap!==undefined){
    				if (this.leafletMap.getBounds()!==undefined){
    					this.mapBoundsChanged(); //this will make the initial call
    					this.addMapBoundsChangedHandler();
    				};
    			};
    		},
    		addMapBoundsChangedHandler: function(){
				this.mapBoundsChangeHandler = on.pausable(this.leafletMap, "moveend", lang.hitch(this, this.mapBoundsChanged));
    		},
    		startup: function(){
    			//add the tooltip span to the document
    			this.tooltip = domConstruct.create("div", {id: "tooltip"}, win.body()); //create the dom node where we will place the slider - it will be the first child of the slider (a dojo-attach-point)
                this.mouseupHandler = on(win.body(), "mouseup", lang.hitch(this, this.dateChanged)); //capture the mouse up event for all nodes in case the user does mouse up outside the slider when changing the date
                this.bodyKeydownHandler = on(win.body(), "keydown", lang.hitch(this, this.changeStretch)); //for changing the stretch on the image
                on(dom.byId("pauseMapButton"), "click", lang.hitch(this, this.pauseClicked));
                on(dom.byId("showMonthsButton"), "click", lang.hitch(this, this.switchYearsMonths));
    		},
    		mapBoundsChanged: function(){ //refetch the images
    			this.mapBounds = this.leafletMap.getBounds();
    			this.getDates();
    		},
    		getDates: function(){ //gets the dates for the imagery for the current map bounds
    			if (this.standby){
    				this.standby.show();
    				domStyle.set(this.tooltip, "display", "none");
    				this.disableImageControllerControls();
    			};
				var params = {
					srs : "EPSG:4326",
					bbox : this.mapBounds.getWest() + "," + this.mapBounds.getSouth() + "," + this.mapBounds.getEast() + "," + this.mapBounds.getNorth(),
				    cloudmax: this.cloudMax,
				    includeslc: this.includeslc,
				    layers: this.layers,
				};
				if (this.noDatesMessage){ //hide the no dates message
					domStyle.set(this.noDatesMessage, "display", "none");
				};
				script.get(this.geeServerUrl + "/getUniqueYearMonths", { //get the dates from the geeImagerServer API
					query : params,
					jsonp : "callback"
				}).then(lang.hitch(this, function(response) {
					if (this.standby){
						this.standby.hide(); //hide the loading standby widget
					};
    				this.enableImageControllerControls(); //enable the image controller controls
					if (response.records.length==0){
						this.noDatesReturned();
					}else{
		    			domStyle.set(this.tooltip, "display", "block");
		    			domStyle.set(dom.byId("pauseDiv"), "display", "block");
						domStyle.set(this.slider, "display", "inline-block");
						this.yearMonths = response.records; //populate all of the yearMonths
						this.populateSliderInfo();
						this.createSlider();
    					focusUtil.focus(this.sliderWidget.focusNode);    				//set focus on the slider
					};
				}),function(error){
					console.log(error);
				});    				
    		},
    		populateSliderInfo: function(){
				this.years = this.getYearsWithImagery(); //populate all of the unique years with imagery
				if (this.dateMode == "years"){ //populate the other information that is needed to create the slider
					this.yearLabelCount = (Number(this.years[this.years.length-1]) - Number(this.years[0])) + 1; //i.e. the count of the year labels will be 1 more than the length of the years array
					this.sliderDiscreteValues = this.yearLabelCount;
					this.sliderDefaultValue = this.years[this.years.length-1]; //set the default value as the most recent year
				}else{
					this.yearLabelCount = (Number(this.years[this.years.length-1]) - Number(this.years[0])) + 2; //when showing months we also need to show the next year (i.e. 2017) because we have some months within 2016
					this.yearMonthLabels = this.getYearMonthLabels(); //build an array of all the year months between the start and end years, e.g. 1984-01 to 2016-12 to use for the year month tics and labels
					this.yearMonthValues = this.getYearMonthValues(); //these are the actual values of the slider widget that correspond to the labels in this.yearMonthLabels
					this.sliderDiscreteValues = this.yearMonthValues.length;
					var defaultYearMonth = this.yearMonths[this.yearMonths.length-1];
					this.sliderDefaultValue = this.yearMonthLabels.indexOf(defaultYearMonth); //set the default value as the most recent yearMonth
				};
				this.yearLabels = this.getYearLabels(); //build an array of all the year between the start and end years to use for the year tics and labels
				var labels = (this.dateMode === "years") ? this.yearLabels : this.yearMonthValues;
				this.sliderMin = labels[0]; //set the minimum 
				this.sliderMax = labels[labels.length-1];
    		},
    		getYearsWithImagery: function(){
    			var _years = [];
				array.forEach(this.yearMonths, lang.hitch(this,function(yearMonth){ //get all of the unique years
					var yearToTest = yearMonth.substring(0,4);
					if (_years.indexOf(Number(yearToTest))==-1){
						_years.push(Number(yearToTest));
					};
				}));
				return _years;
    		},
    		getYearLabels: function(){
    			var _allYears = [];
				for (i = 0; i < this.yearLabelCount; i++) {
					_allYears.push(Number(this.years[0]) + i);
				};
				return _allYears;
    		},
    		getYearMonthLabels: function(){
				var _allYearMonths = [];
				for (i = 0; i < this.yearLabelCount - 1; i++) { 
					for (j = 1; j < 13; j++) {
						_allYearMonths.push((Number(this.years[0]) + i) + "-" + number.format(j,{pattern:"00"}));
					};
				};
				return _allYearMonths;
    		},
    		getYearMonthValues: function(){
    			var _values = [];
    			for (i = 0; i < this.yearMonthLabels.length; i++) {
    				_values.push(i);
    			};
    			return _values;
    		},
    		createSlider: function(){
    			if (this.sliderWidget){ //we have to destroy the slider each time as the properties can only be set on creation
    				this.destroySlider();
    			}else{
    				domStyle.set("initialLoadingDiv", "display","none"); // hide the initial loading image
    				this.standby = new Standby({target: "imageryController", zIndex: 1000, duration: 100, color:"lightgray", image: "widgets/images/loading.gif"}); //create the loading widget
    				document.body.appendChild(this.standby.domNode);
    				this.standby.startup();    				
    			};
    			//create the slider
    			var sliderNode = domConstruct.create("div", {}, this.slider, "first"); //create the dom node where we will place the slider - it will be the first child of the slider (a dojo-attach-point)
    			this.sliderWidget = new HorizontalSlider({minimum: this.sliderMin, maximum: this.sliderMax, discreteValues: this.sliderDiscreteValues, showButtons: false, intermediateChanges: true}, sliderNode);
    			//add the years
                var yearTics = new HorizontalRule({container: "bottomDecoration", count: this.yearLabelCount, style: "height:5px;"}); //create the year tics
                var yearLabels = new HorizontalRuleLabels({container: "bottomDecoration", labels: this.yearLabels, labelStyle: "transform: rotate(270deg);transform-origin:0;top:7px"}); //create the year labels
                //add the months 
                var opacity = (this.dateMode !== "years") ? 1 : 0; //month tics wont be visible if years are selected
            	this.monthTics = new HorizontalRule({container: "topDecoration", count: this.sliderDiscreteValues, style: "height: 4px; opacity: " + opacity}); //month tics
            	this.sliderWidget.addChild(this.monthTics);
                //start up the widgets
                this.sliderWidget.addChild(yearTics);
                this.sliderWidget.addChild(yearLabels);
                this.sliderWidget.startup();
                //get the width of the slider based on having 2 pixels for each month
                domStyle.set(this.slider, "width", (((this.yearLabelCount - 1)*12*this.monthPixelWidth)+28) + "px"); //14px at each end of the slider
    			//add event handling
                this.moveSliderHandler = on(this.sliderWidget, "change", lang.hitch(this, this.moveSlider));
                this.keydownHandler = on(this.sliderWidget, "keydown", lang.hitch(this, this.keyDown));
                this.clickHandler = on(this.sliderWidget, "click", lang.hitch(this, this.mouseClick)); //we have to add this so that if the user clicks on the slider at a specific date, then AFTER the click the slider has moved and the sliderMove event will have the new slider position to show the tooltip
                //hide the tics and labels where there is no imagery
                this.hideYears(yearTics, yearLabels); //hide the year tics and labels where there is no imagery
                if (this.dateMode !== "years"){  
                	this.hideMonthTicsAndSetTitles(); //hide the month tics and set their titles
                };
                //set the default value if the user hasn't already set a date
                if (this.currentDate == this.NO_DATE_SELECTED_STRING){
                	this.sliderWidget.set("value", this.sliderDefaultValue);
                }else{
                	if (this.dateHasImagery(this.currentDate)==false){ // the current date that is set has no imagery in the new bounds so reset it
                		this.sliderWidget.set("value", this.sliderDefaultValue);
                	}else{
                		//the date is the same as it was before but we may have changed the cloud max or the show slc parameters so reload the imagery
                		this.sliderWidget.set("value", this.currentDate);
//                		this.requestImagery();
                	};
                };
    			this.dateChanged({}); //trigger the date change
    		},
    		hideMonthTicsAndSetTitles: function(){
				for (i = 0; i < this.yearMonthValues.length; i++) {
					if (this.yearMonths.indexOf(this.yearMonthLabels[i])==-1){
						domStyle.set(this.monthTics.domNode.childNodes[i], "display", "none");
					}else{
						if (this.monthFilter){
							if (Number(this.yearMonthLabels[i].substring(5)) == this.monthFilter){
								domAttr.set(this.monthTics.domNode.childNodes[i], "title", this.getFormattedSliderLabelFromValue(i));
							}else{
								domStyle.set(this.monthTics.domNode.childNodes[i], "display", "none");
							}
						}else{
							domAttr.set(this.monthTics.domNode.childNodes[i], "title", this.getFormattedSliderLabelFromValue(i));
						}
					};
				};
    		},
    		hideYears: function(yearTics, yearLabels){
				for (i = 0; i < this.yearLabelCount; i++) {
					if (this.years.indexOf(this.yearLabels[i])==-1){
						domStyle.set(yearTics.domNode.childNodes[i], "display", "none");
						domStyle.set(yearLabels.domNode.childNodes[i], "display", "none");
					};
				};
    		},
    		mouseClick: function(evt){
    			this.moveSlider(this.sliderWidget.value);
    		},
    		moveSlider: function(sliderValue){
    			var formattedDate = this.getFormattedSliderLabelFromValue(sliderValue);
				var position = domGeom.position(this.sliderWidget.sliderHandle, true);
				domStyle.set("tooltip", "left", position.x - 11 + "px");
				domStyle.set("tooltip", "top", position.y - 25 + "px");
			    html.set("tooltip", formattedDate);
    		},
    		dateHasImagery: function(sliderValue){ // the slider value will be between 1984 and 2016 if it is in years and between 0 and 384 if it is year/months
    			if (sliderValue < 1900){ //must be yearMonths
    				var yearMonth = this.yearMonthLabels[sliderValue]; // yearMonthLabels are the full range from '1984-01' to '2016-10'
    				var returnValue = (this.yearMonths.indexOf(yearMonth)==-1) ? false : true; //yearMonths are the year/months with actual data, e.g. '1998-03', '2014-12' etc.
    			}else{
    				var returnValue = (this.years.indexOf(sliderValue)==-1) ? false : true;
    			}
    			return returnValue;
    		},
    		keyDown: function(evt){
	        	if (this.dateHasImagery(this.sliderWidget.value)==false){ // the date that the user has moved to has no imagery so move to the next date
	    			switch (event.keyCode) {
	    			case (keys.RIGHT_ARROW) :
	    				var _date = this.getNextDateWithImagery(false);
	    				break;
	    			case (keys.LEFT_ARROW):
	    				var _date = this.getNextDateWithImagery(true);
	    				break;
	    			};
	    			this.sliderWidget.set("value", _date); //set the slider value
	        	}
    			this.dateChanged({}); //trigger the date change
	    	},
	    	changeStretch: function(evt){
        		switch (event.keyCode) {
    			case (keys.NUMPAD_PLUS) :
    				this.stretchImage(true);
    				break;
    			case (keys.NUMPAD_MINUS) :
    				this.stretchImage(false);
    				break;
        		};
        		this.dateChanged({}); //trigger the date change
	    	},
    		getNextDateWithImagery: function(toTheLeft){
    			if (this.dateMode == "years"){
    				var testArray = this.years.slice();
    				var currentDate = this.currentDate; //as a year value, eg. 1999
    			}else{ //year months
    				var testArray = this.yearMonths.slice();
    				var currentDate = this.getSliderLabelFromValue(this.currentDate); //as a year-month value, e.g. 1999-02
    			}
    			if (toTheLeft){
    				testArray.reverse();
    			}
    			var position = testArray.indexOf(currentDate);
    			if (testArray[position + 1]==undefined){ //i.e we are at the end of the array
    				var newSliderValue = this.currentDate;
    			}else{
    				var newSliderValue = (this.dateMode == "years") ? testArray[position + 1] : this.getValueFromSliderLabel(testArray[position + 1]);
    			}
    			return newSliderValue;
    		},
    		getSliderLabelFromValue: function(value){ //gets the yearMonth label from a value, e.g. 218 -> 2004-06
    			return this.yearMonthLabels[value];
    		},
    		getFormattedSliderLabelFromValue: function(value){ //gets the formatted yearMonth label from a value, e.g. 218 -> June 2004
    			if (value < 1900){ //if the value is < 1900 then it must be in yearMonths and not years
	    			var dateStr = this.yearMonthLabels[value];
	        		var yearPart = Number(dateStr.substring(0,4));
	        		var monthPart = Number(dateStr.substring(5,7));
	        		var _date = new Date(yearPart, monthPart - 1, 1);
	    			var formattedDate = locale.format(_date, {selector: "date", datePattern: "MMMM yyyy"});
	    			if (this.yearMonths.indexOf(dateStr)==-1){ //does the date have imagery?
	    				return formattedDate + " - No imagery available";
	    			}
	    			return formattedDate;
    			}else{
	    			if (this.years.indexOf(value)==-1){ //does the date have imagery?
	    				return String(value) + " - No imagery available";
	    			}else{
	    				return String(value);
	    			};
    			};
    		},
    		getValueFromSliderLabel: function(label){ //gets the value for the slider from the yearMonth, e.g. 2004-06 -> 218
    			return this.yearMonthLabels.indexOf(label);
    		},
    		destroySlider: function(){
                this.moveSliderHandler.remove();
                this.keydownHandler.remove();
                this.clickHandler.remove();
    			this.sliderWidget.destroy();
    		},
    		requestImagery: function(){
    			this.removeImageryLayer();
  				this.geeImageLayer = L.nonTiledLayer.wms(this.geeServerUrl + "/ogc", {
				    layers: this.layers, 	
				    format: 'image/png',	
				    startDate: this.startDate,
				    endDate: this.endDate,
				    cloudmax: this.cloudMax,
				    bands: this.bands,
				    stretch: this.stretch,
				    includeslc: this.includeslc,
				});
                on(this.geeImageLayer, "loading", lang.hitch(this, function(event){
                	this.showLoadingImage();
                }));
                on(this.geeImageLayer, "load", lang.hitch(this, function(event){
                  	this.hideLoadingImage();
                }));
				this.leafletMap.addLayer(this.geeImageLayer);
    		},
    		showLoadingImage : function(){
    			//not currently implemented
            	console.log("loading");
    		},
    		hideLoadingImage : function(){
    			//not currently implemented
            	console.log("loaded");
    		},
    		removeImageryLayer: function(){
       			if (this.geeImageLayer){
    				this.leafletMap.removeLayer(this.geeImageLayer);
    			};
    		},
    		noDatesReturned: function(){
    			domStyle.set(this.noDatesMessage, "display", "block");
    			domStyle.set(this.slider, "display", "none");
    			domStyle.set(this.tooltip, "display", "none");
    			domStyle.set(dom.byId("pauseDiv"), "display", "none");
    			registry.byId("bandsSelector").set("disabled", true);
    		},
    		dateChanged: function(evt){
    			var dateSliderValue = this.sliderWidget.value;
            	if (this.dateHasImagery(dateSliderValue)==false){ // the newDate has no imagery - so go back to the existing current date
            		this.sliderWidget.set("value", this.currentDate);
            		return;
            	}
            	if(dateSliderValue == this.currentDate){ //the mouse up was not triggered by the user changing the date on the slider
            		return;
            	};
            	this.currentDate = dateSliderValue;
            	//valid dates - fill in the start/end dates and get the imagery
            	if (this.dateMode == "years"){ //request imagery for a year
            		this.startDate = dateSliderValue + "-01-01";
            		this.endDate = (Number(dateSliderValue)+ 1) + "-01-01";
            	}else{
            		var _date = this.yearMonthLabels[dateSliderValue];
            		var yearPart = Number(_date.substring(0,4));
            		var monthPart = Number(_date.substring(5,7));
            		var startDate = new Date(yearPart, monthPart - 1, 1);
            		this.startDate = locale.format(startDate, {selector: "date", datePattern: "yyyy-MM-dd"}); //in JavaScript, counting of months starts at 0
            		this.endDate = locale.format(date.add(startDate, "month", 1), {selector: "date", datePattern: "yyyy-MM-dd"});
            	};
            	this.requestImagery(); 
    		},
    		cloudMaxChanged: function(value){
    			this.cloudMax = value;
    			var widget = registry.byId("cloudMaxSlider");
    			this.getDates(); //get the unique month/years for the cloud max
    		},
    		bandsChanged: function(value){
    			this.bands = value;
    			this.requestImagery();
    			focusUtil.focus(this.sliderWidget.focusNode); //set focus on the slider
    		},
    		switchYearsMonths: function(value){
    			this.dateMode = (this.dateMode == "yearMonths") ? "years" : "yearMonths";
    			this.populateSliderInfo();
    			if (this.dateMode=="years"){ //get the current month/year that is shown and convert it to a year
    				var _year = Number(this.yearMonthLabels[this.currentDate].substring(0,4));
    				this.previousMonthYear = this.currentDate;
    				var newDate = _year;
    				domAttr.set(dom.byId("showMonthsButton"), "src", "widgets/images/months_on.png"); //change the months image 
    				domAttr.set(dom.byId("showMonthsButton"), "title", "Show months"); //change the title of the months image
    			}else{ 
    				if (this.previousMonthYear == undefined){ //get the current year that is shown and get the first month in that year with imagery
	    				var filteredArray = array.filter(this.yearMonths, lang.hitch(this, function(item){
	    					return (item.substring(0,4) == String(this.currentDate));
	    				}));
	    				var newDate = this.yearMonthLabels.indexOf(filteredArray[0]);
    				}else{
    					if (this.yearMonthValues.indexOf(this.previousMonthYear)!=-1){
    						var newDate = this.previousMonthYear;	//the previous yearMonth value is still valid so use the previous value
    					}else{
    						var newDate = this.getValueFromSliderLabel(this.yearMonths[this.yearMonths.length-1]);   //the previous yearMonth value is no longer valid - the user must have changed a parameter so use the last value - so get the value for the last yearMonth
    					};
    				};
       				domAttr.set(dom.byId("showMonthsButton"), "src", "widgets/images/months_off.png"); //change the months image 
    				domAttr.set(dom.byId("showMonthsButton"), "title", "Hide months"); //change the title of the months image
    			};
    			this.sliderWidget.set("value", newDate);
    			this.dateChanged({});
				this.createSlider();
				focusUtil.focus(this.sliderWidget.focusNode);    				//set focus on the slider
    		},
    		pauseClicked: function(event){
    			this.paused = !this.paused;
    			if (this.paused){
    				this.removeImageryLayer();
    				this.mapBoundsChangeHandler.pause();
    				domAttr.set(dom.byId("pauseMapButton"), "src", "widgets/images/pause_on.png"); //change the pause image to red
    				domAttr.set(dom.byId("pauseMapButton"), "title", "Resume imagery"); //change the title of the pause image
    				this.disableControls();
    			}else{
    				this.mapBoundsChangeHandler.resume();
    				this.currentDate = this.NO_DATE_SELECTED_STRING;
    				this.mapBoundsChanged();
    				domAttr.set(dom.byId("pauseMapButton"), "src", "widgets/images/pause_off.png");
    				domAttr.set(dom.byId("pauseMapButton"), "title", "Pause imagery");
    				this.enableControls();
    			};
    		},
    		disableControls: function(){
    			array.forEach(registry.findWidgets(this.domNode), function(widget){
    				widget.set("disabled", true);
    			});
    			domStyle.set(this.tooltip, "display", "none");
    		},
    		enableControls: function(){
    			array.forEach(registry.findWidgets(this.domNode), function(widget){
    				widget.set("disabled", false);
    			});
    		},
    		disableImageControllerControls: function(){
    			array.forEach(registry.findWidgets(dom.byId("imageControllerControls")), function(widget){
    				widget.set("disabled", true);
    			});
    		},
    		enableImageControllerControls: function(){
    			array.forEach(registry.findWidgets(dom.byId("imageControllerControls")), function(widget){
    				widget.set("disabled", false);
    			});
    		},
    		stretchImage: function(up){
    			(up) ? this.stretch = this.stretch * 1.5 : this.stretch = this.stretch / 1.5;
				this.requestImagery();
    		},
    		blurCloudMaxSpinner: function(evt){
        		switch (event.keyCode) {
    			case (keys.ENTER) :
    				focusUtil.curNode.blur();
    				break;
        		};
    		},
    		slcChanged: function(value){
    			this.includeslc = (value) ? "1" : "0";
    			this.getDates();
    			this.requestImagery();
    		},
    		copernicusChanged: function(value){
    			this.layers = (value) ? "COPERNICUS/S2" : "all";
    			this.getDates();
    			this.requestImagery();
    		},
    		openInfo: function(){
    			domClass.add(win.body(), "claro");
    			var infoDialog = new Dialog({
			        title: "Information",
			        href: "widgets/resources/imageControllerInfo.html",
			        style: "width: 800px"
    			});
    			infoDialog.show();
    		}
     });
}); 
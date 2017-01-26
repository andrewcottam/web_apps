/*
Javascript Business Object file and UI Interaction file for the Birdlife Marine IBA mapper
This file works with the default.html file which contains all of the UI components for the mapper. All Dojo components are instantiated programmatically from this file and populated
using DataStore objects from ArcGIS Server 10.1 services.
*/

//global variables. some for Dojo AMD
var spcRecId, map, basemap, eezmap, eezactivemap, antarcticbasemap, arcticbasemap, speciesMapService, contextMapService, ibaMap, loading, geometryService, proj_pt, navToolbar, queryTask, query, clickevt, dojoarray, legendDijit;
//initial value of the spatial reference system is web mercator
var globalwkid = 102100;
//global Dojo AMD function
require(["dojo/ready", "dojo/io-query", "dojo/_base/window", "dojo/_base/array", "dojo/_base/connect", "dojo/dom", "dojo/dom-construct", "dojo/query", "dojo/dom-class", "dojo/dom-attr"], function(ready, ioQuery, win, array, on, dom, domConstruct, dojoquery, domClass, domAttr) {
	dojoarray = array;
	//hack to make the dojo array object available outside the require block
	// var queryParams = ioQuery.queryToObject(win.doc.location.search.slice(1));
	// spcRecId = queryParams["spcRecId"];
	// if (!spcRecId) {
	// spcRecId = 3959;
	// //default value
	// }
	ready(function() {//called when all of the UI components have been created and laid out
		dom.byId("mainWindow").style.visibility = "visible";
		//make the map window visible
		getFamilyList();
		//get the list of families
		getCountryList();
		//get the list of countries
		initialiseMap();
		//initialise the map - this gets all of the individual map layers
		geometryService = new esri.tasks.GeometryService("http://54.247.127.44/arcgis/rest/services/Utilities/Geometry/GeometryServer");
		//instantiate the geometry service which is used in reprojecting
		navToolbar = new esri.toolbars.Navigation(map);
		//instantiate the toolbar buttons
		dojoquery(".layerToggle").forEach(function(node, index, nodelist) {//iterate through the species checkboxes and add event handlers to update the layers visibilty when they are clicked
			on.connect(node, 'onclick', updateSpeciesLayersVisibility);
		});
		dojoquery(".layerToggleIBAs").forEach(function(node, index, nodelist) {//iterate through the IBAs checkboxes and add event handlers to update the layers visibilty when they are clicked
			on.connect(node, 'onclick', updateIBALayersVisibility);
		});
	});

	//creates a request for the family names from ArcGIS Server
	function getFamilyList() {
		var familyListQT = new esri.tasks.QueryTask("http://54.247.127.44/ArcGIS/rest/services/MarineIBAs/Species/MapServer/3");
		// get the family list table
		var familyListQ = new esri.tasks.Query();
		familyListQ.outFields = ["SpcRecID", "FamEng"];
		familyListQ.where = "OBJECTID>-1";
		familyListQT.execute(familyListQ, familyListRetrieved);
	}

	//creates a request for the species names from ArcGIS Server based on the currently selected family name
	function getSpeciesList(famEng) {
		var speciesFilteringSelect = dijit.byId('speciesSelect');
		if (speciesFilteringSelect) {//clear the currently selected item in the species drop down
			speciesFilteringSelect.reset();
		};
		if (famEng) {//if a family is selected get the list of species for that family
			var speciesListQT = new esri.tasks.QueryTask("http://54.247.127.44/ArcGIS/rest/services/MarineIBAs/Species/MapServer/3");
			// get the species list table
			var speciesListQ = new esri.tasks.Query();
			speciesListQ.outFields = ["SpcRecID", "ComName"];
			speciesListQ.where = "FamEng='" + famEng + "'";
			speciesListQT.execute(speciesListQ, speciesListRetrieved);
		} else {//if a family is not selected reset the species and IBA layers to show nothing
			//resetting the species lists
			speciesMapService.setDefaultLayerDefinitions();
			ibaMap.setDefaultLayerDefinitions();
		};
	}

	//creates a request for the country names from ArcGIS Server
	function getCountryList() {
		var countryListQT = new esri.tasks.QueryTask("http://54.247.127.44/arcgis/rest/services/MarineIBAs/EEZ/MapServer/0");
		// get the country list table
		var countryListQ = new esri.tasks.Query();
		countryListQ.outFields = ["DisplayName", "URLName"];
		countryListQ.where = "DisplayName is not null";
		countryListQT.execute(countryListQ, countryListRetrieved);
	}

	//asynchronous call-back function when the results of the country query are returned
	function countryListRetrieved(results) {
		var items = [];
		//add the country names to an array
		array.forEach(results.features, function(result) {
			items.push({
				id : result.attributes["URLName"],
				name : result.attributes["DisplayName"]
			});
		});
		//create a data store to hold the country information
		var store = new dojo.data.ItemFileReadStore({
			data : {
				identifier : "id",
				label : "name",
				items : items
			}
		});
		//instantiate a drop-down box to hold the country names
		var filteringSelect = new dijit.form.FilteringSelect({
			id : "countrySelect",
			name : "country",
			store : store,
			fetchProperties : {
				sort : [{
					attribute : "name",
					descending : false
				}]
			},
			onChange : function(newCtyUrlName) {//add an event handler when the selected country changes
				setCtyUrlName(newCtyUrlName);
			}
		}, "countrySelect");
	}

	//asynchronous call-back function when the results of the family query are returned
	function familyListRetrieved(results) {
		var items = [];
		var isPresent = false;
		//add the family names to an array - we only want unique values so search for the value first
		array.forEach(results.features, function(result) {
			array.forEach(items, function(item) {
				if (item.id == result.attributes["FamEng"]) {
					isPresent = true;
					return
				};
				isPresent = false;
			});
			if (!isPresent) {
				items.push({
					id : result.attributes["FamEng"],
					name : result.attributes["FamEng"]
				});
			};
		});
		//create a data store to hold the family information
		var store = new dojo.data.ItemFileReadStore({
			data : {
				identifier : "id",
				label : "name",
				items : items
			}
		});
		//instantiate a drop-down box to hold the family names
		var filteringSelect = new dijit.form.FilteringSelect({
			id : "familySelect",
			name : "familySelect",
			store : store,
			fetchProperties : {
				sort : [{
					attribute : "name",
					descending : false
				}]
			},
			onChange : function(newFamEng) {//add an event handler when the selected family changes
				getSpeciesList(newFamEng);
			}
		}, "familySelect");
		//instantiate a drop-down box to hold the species names - this will be empty to start with
		var filteringSelect2 = new dijit.form.FilteringSelect({
			id : "speciesSelect",
			name : "speciesSelect",
			fetchProperties : {
				sort : [{
					attribute : "name",
					descending : false
				}]
			},
			onChange : function(newSpcRecId) {//add an event handler when the selected species changes
				spcRecId = newSpcRecId;
				setSpeciesId();
			}
		}, "speciesSelect");
	}

	//asynchronous call-back function when the results of the species query are returned
	function speciesListRetrieved(results) {
		var items = [];
		//add the species names to an array
		array.forEach(results.features, function(result) {
			items.push({
				id : result.attributes["SpcRecID"],
				name : result.attributes["ComName"]
			});
		});
		//create a data store to hold the species information
		var store = new dojo.data.ItemFileReadStore({
			data : {
				identifier : "id",
				label : "name",
				items : items
			}
		});
		//populate the existing species drop-down box with the species list
		var filteringSelect = dijit.byId('speciesSelect');
		filteringSelect.set('store', store);
	}

	//initialise the map
	function initialiseMap() {
		//set the initial extent
		var initialExtent = new esri.geometry.Extent({
			"xmin" : -11828783.00118444,
			"ymin" : -5205055.878105974,
			"xmax" : 16329395.226614418,
			"ymax" : 9001224.450859955,
			"spatialReference" : {
				"wkid" : 102100
			}
		});
		loading = dom.byId("loadingImg");
		esri.config.defaults.map.slider = {
			right : "20px",
			top : "40px",
			width : null,
			height : "200px"
		};
		//set the valid zoom levels for the map
		lods = [{
			"level" : 0,
			"resolution" : 156543.033928,
			"scale" : 591657527.591555
		}, {
			"level" : 1,
			"resolution" : 78271.5169639999,
			"scale" : 295828763.795777
		}, {
			"level" : 2,
			"resolution" : 39135.7584820001,
			"scale" : 147914381.897889
		}, {
			"level" : 3,
			"resolution" : 19567.8792409999,
			"scale" : 73957190.948944
		}, {
			"level" : 4,
			"resolution" : 9783.93962049996,
			"scale" : 36978595.474472
		}, {
			"level" : 5,
			"resolution" : 4891.96981024998,
			"scale" : 18489297.737236
		}, {
			"level" : 6,
			"resolution" : 2445.98490512499,
			"scale" : 9244648.868618
		}, {
			"level" : 7,
			"resolution" : 1222.99245256249,
			"scale" : 4622324.434309
		}, {
			"level" : 8,
			"resolution" : 611.49622628138,
			"scale" : 2311162.217155
		}, {
			"level" : 9,
			"resolution" : 305.748113140558,
			"scale" : 1155581.108577
		}, {
			"level" : 10,
			"resolution" : 152.874056570411,
			"scale" : 577790.554289
		}];
		map = new esri.Map("map", {//create the map
			extent : initialExtent,
			lods : lods
		});
		on.connect(map, 'onUpdateStart', showLoading); //when any layers are loading show the loading icon
		on.connect(map, 'onUpdateEnd', hideLoading); //at the end of loading hide the loading icon
		on.connect(map, "onClick", executeQueryTask); //when the user clicks on the map, query the IBA layer
		on.connect(map, "onLayersAddResult", layersAdded); //at the end of the layers load, finalise the map
		on.connect(dijit.byId('contextSelect'), 'onChange', updateContextLayersVisibility); //when the context layer changes, update the visibility of the layer
		basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer");
		eezmap = new esri.layers.ArcGISDynamicMapServiceLayer("http://54.247.127.44/arcgis/rest/services/MarineIBAs/EEZ/MapServer");
		eezactivemap = new esri.layers.ArcGISDynamicMapServiceLayer("http://54.247.127.44/arcgis/rest/services/MarineIBAs/EEZ_ActiveCountry/MapServer", {
			opacity : 0.1
		});
		resetCountrySelection(); //initialise the country service
		antarcticbasemap = new esri.layers.ArcGISDynamicMapServiceLayer("http://54.247.127.44/ArcGIS/rest/services/MarineIBAs/BaseMapSouthPole/MapServer");
		arcticbasemap = new esri.layers.ArcGISDynamicMapServiceLayer("http://54.247.127.44/arcgis/rest/services/MarineIBAs/BaseMapNorthPole/MapServer");
		initialiseSpeciesMapService(); //initialise the species service, i.e. show no species to start with
		initialiseContextMapService(); //initialise the context service, i.e. show no contextural data to start with
		initialiseIBAMapService(); //initialise the species service, i.e. show all IBAs to start with
		initialiseQueryTask(); //initialise the query task
		map.addLayers([basemap, antarcticbasemap, arcticbasemap, eezmap, eezactivemap, contextMapService, speciesMapService, ibaMap]) //add all of the map layers
		antarcticbasemap.hide(); // hide the antarctic basemap
		arcticbasemap.hide(); // hide the arctic basemap
		var handle = on.connect(map, 'onLoad', function(theMap) { // when the browser window is resized, resize the map
			on.connect(dijit.byId('map'), 'resize', map, map.resize);
			on.disconnect(handle);
		});
	}

	// fired when any layer started to load
	function showLoading() {
		map.graphics.clear();
		map.infoWindow.hide();
		esri.show(loading);
		map.disableMapNavigation();
		// map.hideZoomSlider();
	}
	
	// fires when any layer has finished loading
	function hideLoading(error) {
		esri.hide(loading);
		map.enableMapNavigation();
		// map.showZoomSlider();
	}
	
	//add the species base map, set the species id (initially to nothing) and turn off all layers
	function initialiseSpeciesMapService() {
		speciesMapService = new esri.layers.ArcGISDynamicMapServiceLayer("http://54.247.127.44/ArcGIS/rest/services/MarineIBAs/Species/MapServer", {
			opacity : 0.8
		});
		var handle = on.connect(speciesMapService, 'onLoad', function(e) {
			setSpeciesId();
			//set no layers as visible by default
			speciesMapService.setVisibleLayers([-1]);
			// add the species map service under the context one
			on.disconnect(handle);
		});
	}

	// add the contextural layer and set no layers as visible
	function initialiseContextMapService() {
		contextMapService = new esri.layers.ArcGISDynamicMapServiceLayer("http://54.247.127.44/ArcGIS/rest/services/MarineIBAs/Context/MapServer", {
			opacity : 0.8
		});
		contextMapService.setVisibleLayers([-1]);
	}

	// add the IBAs service and set the IBA layer as visible
	function initialiseIBAMapService() {
		ibaMap = new esri.layers.ArcGISDynamicMapServiceLayer("http://54.247.127.44/arcgis/rest/services/MarineIBAs/IBAs/MapServer", {
			opacity : 0.8
		});
		var handle = on.connect(ibaMap, 'onLoad', function(e) {
			ibaMap.setVisibleLayers([0]);
			on.disconnect(handle);
		});
	}

	//called when the species is changed 
	// - updates the layer definitions for all layers in the species service
	// - runs a query to get the case studies for that species
	// - runs a query to get the siterecids of all of the ibas where the species triggers them
	function setSpeciesId() {
		var layerDefinitions = [];
		array.forEach(speciesMapService.layerInfos, function(result) {
			layerDefinitions[result.id] = "SPCRECID=" + spcRecId;
			speciesMapService.setLayerDefinitions(layerDefinitions);
		});
		var caseStudiesQT = new esri.tasks.QueryTask("http://54.247.127.44/ArcGIS/rest/services/MarineIBAs/Species/MapServer/2");
		var caseStudiesQ = new esri.tasks.Query();
		caseStudiesQ.outFields = ["CSID", "CSTitle", "CSChap"];
		caseStudiesQ.where = "SpcRecID=" + spcRecId;
		caseStudiesQT.execute(caseStudiesQ, caseStudiesRetrieved); //request the case studies
		domAttr.set(dom.byId("speciesFactsheetLink"), "href", "http://www.birdlife.org/datazone/speciesfactsheet.php?id=" + spcRecId); //set the url of the species factsheet link
		var sitRecIDQT = new esri.tasks.QueryTask("http://54.247.127.44/ArcGIS/rest/services/MarineIBAs/Species/MapServer/4"); //query task to get the ibas
		var sitRecIDQ = new esri.tasks.Query();
		sitRecIDQ.outFields = ["SitRecID"];
		sitRecIDQ.where = "SpcRecID=" + spcRecId;
		sitRecIDQT.execute(sitRecIDQ, sitRecIDRetrieved); //get the ibas for this species
	}

	//asynchronous call-back function when the results of the IBA query are returned - this function filters the IBA service by those IBAs
	function sitRecIDRetrieved(results) {
		var sitRecIDs = "";
		array.forEach(results.features, function(result) { //build up an 'in' clause for the iba layer
			sitRecIDs = sitRecIDs + "," + result.attributes["SitRecID"];
		});
		if (sitRecIDs.length > 0) { //set the layer definition on the IBA layer
			sitRecIDs = sitRecIDs.substr(1);
			ibaMap.setLayerDefinitions(["SitRecID in (" + sitRecIDs + ")"]);
		} else {
			ibaMap.setLayerDefinitions(["SitRecID in ()"]);
		}
	}

	//fires when the country changes - requests the bounding box of the selected country
	function setCtyUrlName(CtyUrlName) {
		domAttr.set(dom.byId("countryFactsheetLink"), "href", "http://www.birdlife.org/datazone/country/" + CtyUrlName);
		var ctryQT = new esri.tasks.QueryTask("http://54.247.127.44/arcgis/rest/services/MarineIBAs/EEZ/MapServer/0");
		dojo.connect(ctryQT, "onComplete", countryRetrieved); //add an event listener for the results of the bounding box request
		var ctryQ = new esri.tasks.Query();
		ctryQ.outFields = ["minx", "miny", "maxx", "maxy", "URLName"];
		ctryQ.where = "URLName='" + CtyUrlName + "'";
		ctryQT.execute(ctryQ); //get the bounding box of the country
	}

	//asynchronous call-back function when the results of the country bounding box are returned - sets the new map extent
	function countryRetrieved(results) {
		if (results.features.length > 0) { //if a bounding box is found
			var att = results.features[0].attributes;
			var extent = new esri.geometry.Extent(att.minx, att.miny, att.maxx, att.maxy, new esri.SpatialReference({ //create the new extent in web mercator
				wkid : 102100
			}));
			if (globalwkid != 102100) { //if the current projection is not web mercator, project the bounding box and set the new extent 
				var center = map.extent.getCenter(); //get the centre of the new extent
				var geometryDeferred = project(center, globalwkid); //get the bounding box in the new spatial reference system
				geometryDeferred.then(function(results) { //asynchronous call-back when the geometry has been projected
					if (isNaN(results[0].x) || isNaN(results[0].y)) {
						setFullExtent(); //if any of the points are invalid, zoom to full extent
						return;
					} else {
						calculateNewExtent(results[0], wkid); //calculate the new extent
					}
				});
			}
			map.setExtent(extent, true); //set the new extent
			var layerDefinitions = []; //clear existing country layer definitions
			layerDefinitions[0] = "URLName ='" + att.URLName + "'"; //set the layer definition of the active country service
			eezactivemap.setLayerDefinitions(layerDefinitions);
		}
	}

	//no longer used
	function featuresRetrieved(results) {
		if (results.features.length > 0) {
			var geometry = results.features[0];
			var extent = geometry.geometry.getExtent();
			map.setExtent(extent);
		}
	}

	//asynchronous call-back function fired when the case study information is retrieved
	function caseStudiesRetrieved(results) {
		var items = [];
		//add the case studies to an array
		array.forEach(results.features, function(result) {
			items.push({
				id : result.attributes["CSID"],
				title : result.attributes["CSTitle"],
				chapter : result.attributes["CSChap"]
			});
		});
		//create and populate a data store to hold the data
		var caseStudyStore = new dojo.data.ItemFileReadStore({
			data : {
				identifier : "id",
				label : "title",
				items : items
			}
		});
		//add event handlers which are fired when the Dojo grid rows are styled so that we can apply custom styling based on the type of case study
		dojo.connect(grid, "onStyleRow", function styleRowGrid(inRow) {
			if (items[inRow.index] != undefined) {
				switch (items[inRow.index]["chapter"][0]) {
					case "Introduction":
						inRow.customClasses = inRow.customClasses + " introduction";
						break;
					case "State":
						inRow.customClasses = inRow.customClasses + " state";
						break;
					case "Pressure":
						inRow.customClasses = inRow.customClasses + " pressure";
						break;
					case "Response":
						inRow.customClasses = inRow.customClasses + " response";
						break;
				}
			}
		});
		//set the data store property of the grid
		grid.setStore(caseStudyStore);
	}

	//fired when any of the species checkboxes are clicked - updates the layers visiblity
	function updateSpeciesLayersVisibility() {
		var inputs = dojoquery(".layerToggle");
		var visible = [];
		var layerToggle;
		array.forEach(inputs, function(domnode) {
			layerToggle = dijit.byId(domnode.firstChild.id);
			if (layerToggle.checked) {
				visible.push(layerToggle.value);
			}
		});
		if (visible.length === 0) {
			visible.push(-1);
		}
		speciesMapService.setVisibleLayers(visible);
		legendDijit.refresh();
	}

	//fired when the context layer changes - updates the layers visiblity
	function updateContextLayersVisibility(value) {
		var visible = [];
		visible.push(value);
		contextMapService.setVisibleLayers(visible);
		legendDijit.refresh();
	}

	//fired when the iba layer checkbox is clicked - updates the layers visiblity
	function updateIBALayersVisibility() {
		var inputs = dojoquery(".layerToggleIBAs");
		var visible = [];
		var layerToggle;
		array.forEach(inputs, function(domnode) {
			layerToggle = dijit.byId(domnode.firstChild.id);
			if (layerToggle.checked) {
				visible.push(layerToggle.value);
			}
		});
		if (visible.length === 0) {
			visible.push(-1);
		}
		ibaMap.setVisibleLayers(visible);
		legendDijit.refresh();
	}

	//when all of the layers are finished loading, create the legend with user-friendly names
	function layersAdded(results) {
		// {
		// layer : eezmap,
		// title : 'Country Information'
		// },
		var layerInfos = [{
			layer : speciesMapService,
			title : 'Species Information'
		}, {
			layer : contextMapService,
			title : 'Additional Layers'
		}, {
			layer : ibaMap,
			title : 'IBAs'
		}];
		legendDijit = new esri.dijit.Legend({
			map : map,
			layerInfos : layerInfos
		}, "legendDiv");
		legendDijit.startup();
	}

});

//fired when the user changes the map projection - turns on/off the appropriate base map, gets the new extent and sets it
function changeSRS(wkid) {
	globalwkid = wkid;
	switch (wkid) {
		case 3857:
			basemap.show();
			antarcticbasemap.hide();
			arcticbasemap.hide();
			break;
		case 102037:
			basemap.hide();
			antarcticbasemap.show();
			arcticbasemap.hide();
			break;
		case 102035:
			basemap.hide();
			antarcticbasemap.hide();
			arcticbasemap.show();
			break;
	}
	var center = map.extent.getCenter();
	var centerDeferred = project(center, wkid);
	centerDeferred.then(function(results) {
		if (isNaN(results[0].x) || isNaN(results[0].y)) {
			setFullExtent();
		} else {
			calculateNewExtent(results[0], wkid);
		}
	});
}

//zoom to full extent function
function setFullExtent() {
	var extent;
	switch (globalwkid) {
		case 3857:
			extent = basemap.fullExtent;
			break;
		case 102037:
			extent = antarcticbasemap.fullExtent;
			break;
		case 102035:
			extent = arcticbasemap.fullExtent;
			break;
	}
	setNewExtent(extent, globalwkid);
}

//called when the user moves to a new projection or selects a new country and projects the passed geometry to the new system using the ArcGIS Server 10.1 geometry service
function project(geometry, wkid) {
	var outSR = new esri.SpatialReference({
		wkid : wkid
	});
	var params = new esri.tasks.ProjectParameters();
	params.geometries = [geometry];
	params.outSR = outSR;
	return geometryService.project(params);
}

//calculates the new extent of the map, based on the centre point and current width/height
function calculateNewExtent(results, wkid) {
	var width = Math.abs(map.extent.xmax - map.extent.xmin);
	var height = Math.abs(map.extent.ymax - map.extent.ymin);
	if ((height === 0) || (width === 0) || (isNaN(height)) || (isNaN(width))) {
		setFullExtent();
		return;
	}
	var ll = new esri.geometry.Point(results.x - (width / 2), results.y - (height / 2), new esri.SpatialReference(wkid));
	var ur = new esri.geometry.Point(results.x + (width / 2), results.y + (height / 2), new esri.SpatialReference(wkid));
	if ((isNaN(ll.x)) || (isNaN(ll.y)) || (isNaN(ur.x)) || (isNaN(ur.y))) {
		setFullExtent();
		return;
	}
	var new_extent = new esri.geometry.Extent(ll.x, ll.y, ur.x, ur.y, new esri.SpatialReference(wkid));
	setNewExtent(new_extent, wkid);
}

//physically sets the new extent in the map
function setNewExtent(extent, wkid) {
	map.spatialReference = new esri.SpatialReference(wkid);
	map.setExtent(extent);
}

//initialises the map query task whcih retrieves information about the iba under the cursor
function initialiseQueryTask() {
	queryTask = new esri.tasks.QueryTask("http://54.247.127.44/ArcGIS/rest/services/MarineIBAs/IBAs/MapServer/0");
	query = new esri.tasks.Query();
	query.returnGeometry = true;
	query.outFields = ["SitRecID"];
}

//fires when the user clicks on the map - gets the matching features from the server and populates the info box
function executeQueryTask(evt) {
	query.geometry = evt.mapPoint;
	query.mapExtent = map.extent;
	clickevt = evt;
	queryTask.execute(query, function(fset) {
		if (fset.features.length === 1) {
			showFeature(fset.features[0]);
			getSpeciesPopData(fset.features[0].attributes.SitRecID);
		} else if (fset.features.length !== 0) {
			showFeatureSet(fset);
		}
	});
};

//requests information about the passed site to populate the info box
function getSpeciesPopData(SitRecID) {
	var popDataQT = new esri.tasks.QueryTask("http://54.247.127.44/ArcGIS/rest/services/MarineIBAs/Species/MapServer/4");
	var popDataQ = new esri.tasks.Query();
	popDataQ.outFields = ["URLName", "SitRecID", "SitInternational", "CtyBirdLifeName", "ibaStaDesc", "SitArea", "SpcRecID", "SpcHisCommonName", "SeaDesc", "SitCriPopProposed", "SitCriPopConfirmed", "SpcPopMax"];
	popDataQ.where = "SitRecID=" + SitRecID;
	popDataQT.execute(popDataQ, popDataReturned);
}

//asynchronous call-back function that is fired when the results of the iba query are retrieved - creates the content for the info box using the returned data
function popDataReturned(results) {
	var dataitems = [];
	var attr = results.features[0].attributes;
	var content = "<table style='width:100%' id='popTable'><tr><td colspan='5'>Country: <a href='http://www.birdlife.org/datazone/country/" + attr.URLName + "' target='_new'>" + attr.CtyBirdLifeName + "</a></td></tr><tr><td colspan='4'>IBA:    <a href='http://www.birdlife.org/datazone/sitefactsheet.php?id=" + attr.SitRecID + "' target='_new'>" + attr.SitInternational + "</a></td><td>" + attr.ibaStaDesc + "</td></tr><tr><td colspan='5'>Size:  " + (attr.SitArea / 100).toString() + "Km2</td></tr><tr><td colspan='5'></td></tr><tr><td>Species</td><td>Date present</td><td>Life-history stage</td><td>IBA Criteria</td><td>Pop Estimate</td></tr>";
	var ibaCriteriaAttribute = "";
	(attr.ibaStaDesc == 'confirmed') ? ibaCriteriaAttribute = "SitCriPopConfirmed" : ibaCriteriaAttribute = "SitCriPopProposed";
	dojoarray.forEach(results.features, function(result) { //iterate through the species and create a row for each
		content = content + "<tr><td><a href='http://www.birdlife.org/datazone/speciesfactsheet.php?id=" + result.attributes["SpcRecID"] + "' target='_new'>" + result.attributes["SpcHisCommonName"] + "</a></td><td>" + result.attributes["datepresent"] + "</td><td>" + result.attributes["SeaDesc"] + "</td><td>" + result.attributes[ibaCriteriaAttribute] + "</td><td>" + result.attributes["SpcPopMax"] + "</td></tr>";
	});
	content = content + "</table>";//finish the content
	map.infoWindow.setTitle("Important Bird Area"); //set the title of the info window
	map.infoWindow.setContent(content); //set the content of the info window
	map.infoWindow.resize(600, 200); //resize the info window
	(clickevt) ? map.infoWindow.show(clickevt.screenPoint, map.getInfoWindowAnchor(clickevt.screenPoint)) : null; //show the info window where the user clicked on the map
}

//highlight the feature that the user clicked on on the map
function showFeature(feature) {
	map.graphics.clear();
	var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 255, 0, 0.5]));
	feature.setSymbol(symbol);
	map.graphics.add(feature);
}

//called if the user query results in more than one feature selected
function showFeatureSet(fset) {
	map.graphics.clear();
	var screenPoint = clickevt.screenPoint;
	featureSet = fset;
	var numFeatures = featureSet.features.length;
	var title = "Important Bird Areas";
	for (var i = 0; i < numFeatures; i++) {
		var graphic = featureSet.features[i];
		content = content + "<a href='http://www.birdlife.org/datazone/sitefactsheet.php?id=" + attr.SitRecID + "' target='_new'>" + attr.NATNAME + "</a><br/>";
	}
	map.infoWindow.setTitle(title);
	map.infoWindow.setContent(content);
	map.infoWindow.show(screenPoint, map.getInfoWindowAnchor(clickevt.screenPoint));
}

//used in the case study box to provide a link to the case study in the birdlife datazone
function makeZoomButton(id) {
	var img = "<div dojoType='dijit.form.Button'><a href='http://www.birdlife.org/datazone/sowb/casestudy/" + id + "' target='_new' title='Birdlife Case Study'><img src='images/casestudy.png'></a></div>";
	return img;
}

//restores the active country service original layer definition - i.e. no country selected
function resetCountrySelection() {
	var layerDefinitions = [];
	layerDefinitions[0] = "CtyUrlName =''";
	eezactivemap.setLayerDefinitions(layerDefinitions);
}

//called when the user clicks on the reset button - resets all services and drop-down boxes
function reset() {
	resetCountrySelection();
	speciesMapService.setVisibleLayers([-1]);
	contextMapService.setVisibleLayers([-1]);
	dijit.byId('contextSelect').set('value', 6);
	dijit.byId('speciesHotspotsToggle').set('checked', false);
	dijit.byId('speciesRangeToggle').set('checked', false);
	dijit.byId('speciesSelect').reset();
	dijit.byId('familySelect').reset();
	dijit.byId('countrySelect').reset();
	grid.setStore(null);
}

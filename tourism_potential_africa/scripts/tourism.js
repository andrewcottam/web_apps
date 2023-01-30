require(["dojo/on", "esri/map", "esri/graphic", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/request", "dgrid/OnDemandGrid", "dojo/_base/Color", "esri/InfoTemplate", "dojo/_base/array", "esri/geometry/Point", "esri/SpatialReference", "esri/symbols/TextSymbol", "esri/symbols/Font", "dijit/registry", "dojo/ready", "dojo/Evented", "dojo/_base/declare", "dijit/form/Select", "dojo/parser", "dijit/form/CheckBox", "dijit/form/TextBox", "dijit/form/Button", "dojo/promise/all", "dojo/Deferred", "dojo/query", "dojo/dom", "dojo/dom-style", "dojo/dom-construct", "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dgrid/Selection", "dojo/store/Memory"], function(on, Map, Graphic, SimpleMarkerSymbol, SimpleLineSymbol, esriRequest, OnDemandGrid, Color, InfoTemplate, arrayUtil, Point, SpatialReference, TextSymbol, Font, registry, ready, Evented, declare, Select, parser, CheckBox, TextBox, Button, all, Deferred, query, dom, domStyle, domConstruct, BorderContainer, ContentPane, Selection, Memory) {
	ready(function() {
		console.log('parser.parse()');
		parser.parse();
		console.log('parser parsed');
		sitesGrid = declare([OnDemandGrid, Selection])({
			columns : [{
				field : "country",
				sortable : false
			}, {
				field : "name",
				sortable : false
			}, {
				field : "total_charisma",
				label : "total",
				sortable : false
			}, {
				field : "ln_charisma",
				label : "ln",
				sortable : false
			}, {
				field : "sqr_charisma",
				label : "sqr",
				sortable : false
			}, {
				field : "average_charisma",
				label : "avg",
				sortable : false
			}, {
				field : "species_richness",
				label : "rich",
				sortable : false
			}, {
				field : "total_red_list_status",
				label : "status",
				sortable : false
			}, {
				field : "total_charisma_score",
				label : "score",
				sortable : false
			}],
			selectionMode : "single",
			idProperty : "wdpa_id"
		}, "sitesGrid");
		console.log('sitesGrid created');
		speciesGrid = declare([OnDemandGrid, Selection])({
			columns : [{
				field : "commonname",
				label : "Common name"
			}, {
				field : "taxon",
				label : "Taxon"
			}, {
				field : "status",
				label : "Status"
			}, {
				field : "flickr_image_count",
				label : "Flickr image count"
			}, {
				field : "image_url",
				label : " ",
				renderCell : getSpeciesImageUrl
			}]
		}, "speciesGrid");
		console.log('speciesGrid grid created');
		map = new Map("map", {
			basemap : "topo",
			center : [17, 0],
			zoom : 4,
			sliderStyle : 'large'
		});
		console.log('map created');
		var deferred = new Deferred();
		//create a new deferred to track when the map is loaded so we can then start to create graphics
		on(map, 'Load', function() {
			deferred.resolve('mapLoaded');
		});
		var requestDeferred = requestData(20);
		//create a deferred to track when the data is returned from the server
		all([requestDeferred, deferred.promise]).then(initialise);
		//create a promise that gets resolved when both the data is loaded and the map is loaded
		on(sitesGrid, ".dgrid-header .dgrid-cell:click", headerClicked);
		sitesGrid.on("dgrid-select", rowSelected);
		on(registry.byId("refresh"), "click", refreshData);
		on(registry.byId("showimages"), "click", toggleShowImages);
		on(registry.byId("taxa_select"), "change", showSpecies);
		query("#statusFilterControls input").forEach(function(node) {
			on(node, "click", showSpecies);
		});
		console.log('events registered');
	});
	var map;
	var restServerUrl = "https://python-rest-server-ny43uciwwa-oc.a.run.app/python-rest-server/joint-research-centre";
	var sitesGrid;
	var speciesGrid;
	var currentRow;
	var showSpeciesImages = false;
	var tp_field = 'flickr_raw_sum_rank';
	var highlightSymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color([255, 0, 0]));
	var defaultSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([255, 0, 0, 0.25]));
	// declare a timer class
	var Timer = declare([Evented], {
		timeout : 750,
		start : function() {
			this.stop();
			this.emit("start", {});
			var self = this;
			this._handle = setInterval(function() {
				self.emit("tick", {});
			}, this.timeout);
		},
		stop : function() {
			if (this._handle) {
				clearInterval(this._handle);
				delete this._handle;
				this.emit("stop", {});
			}
		}
	});
	function initialise(all) {
		processResponse(all[0]);
		//get the response data from the first promise, i.e. the request data
	};
	function requestData(records) {
		console.log('requestData');
		requestDeferred = esriRequest({
			url : restServerUrl + "/especies/_get_tourism_ranks",
			content : {
				sortby : tp_field,
				limitto : records
			},
			handleAs : "json",
			callbackParamName : "callback"
		});
		return requestDeferred.promise;
		//return a promise to the callback
	};
	function processResponse(response) {
		console.log('data retrieved');
		sitesGrid.refresh();
		var store = new Memory({
			data : response.records,
			idProperty : "wdpa_id"
		});
		sitesGrid.setStore(store);
		map.graphics.clear();
		createMarkers(response.records);
		createLabels();
	};
	function refreshData() {
		var limitto = registry.byId("limitto_id_text").value;
		if (limitto > 100) {
			alert('Must not be greater than 100');
			return;
		};
		requestData(limitto).then(processResponse);
		//get the data and then process it
	};
	function headerClicked(event) {
		console.log('headerClicked');
		tp_field = event.target.field;
		refreshData();
	};
	function dataError(error) {
		console.log("Failed: ", error);
	};
	function createMarkers(records) {
		console.log('createMarkers');
		var infoTemplate = new InfoTemplate("${" + tp_field + "}: ${name}", "Total charisma: ${total_charisma}<br />Average Charisma: ${average_charisma}<br />Ln Charisma: ${ln_charisma}<br />Sqr Charisma: ${sqr_charisma}<br />Species Richness: ${species_richness}<br />Total Red List Score: ${total_red_list_status}<br />Total Charisma Score: ${total_charisma_score}<br />");
		map.graphics.setInfoTemplate(infoTemplate);
		arrayUtil.forEach(records, function(item) {
			var centroid = item.centroid.substr(6, item.centroid.length - 7).split(' ');
			var centroidPoint = new Point(centroid[0], centroid[1], new SpatialReference({
				wkid : 4326
			}));
			var marker = new Graphic(centroidPoint, defaultSymbol, item);
			map.graphics.add(marker);
		});
	};
	function createLabels() {
		console.log('createLabels');
		arrayUtil.forEach(map.graphics.graphics, function(graphic) {
			if ( typeof graphic.symbol !== 'undefined') {
				if (graphic.symbol.type != 'textsymbol') {
					var labelPoint = getLabelPoint(graphic.geometry);
					var textSymbol = new TextSymbol(graphic.attributes[tp_field]).setColor(new Color([0, 0, 0, 0.85])).setAlign(Font.ALIGN_START).setFont(new Font("10pt", Font.STYLE_BOLD, Font.VARIANT_NORMAL, Font.WEIGHT_NORMAL, "Verdana"));
					var labelGraphic = new Graphic(labelPoint, textSymbol, {
						anchorx : graphic.geometry.x,
						anchory : graphic.geometry.y
					});
					map.graphics.add(labelGraphic);
				};
			};
		});
		on(map, 'ExtentChange', moveLabels);
		// map.on(graphics,'mouseover',showPopup); THIS DOESNT WORK FOR SOME REASON SO RESORTING TO OLD FASHIONED dojo.connect
		// on(map.graphics,'mouseover',showPopup); OR THIS
		dojo.connect(map.graphics, "onMouseOver", showPopup);
		dojo.connect(map.graphics, "onMouseOut", hidePopup);
	};
	function getLabelPoint(anchorPoint) {
		console.log('getLabelPoint');
		var screenPoint = map.toScreen(anchorPoint);
		var labelPoint = new esri.geometry.Point(screenPoint.x + 3, screenPoint.y - 4);
		return map.toMap(labelPoint);
	};
	function moveLabels() {
		console.log('moveLabels');
		arrayUtil.forEach(map.graphics.graphics, function(label) {
			if ( typeof label.symbol !== 'undefined') {
				if (label.symbol.type == 'textsymbol') {
					var anchorPoint = new Point(label.attributes.anchorx, label.attributes.anchory, new SpatialReference({
						wkid : 4326
					}));
					var labelPoint = getLabelPoint(anchorPoint);
					label.setGeometry(labelPoint);
				};
			};
		});
	};
	function showPopup(event) {
		console.log('showPopup');
		var g = event.graphic;
		if ( typeof g.symbol !== 'undefined') {
			if (g.symbol.type != 'textsymbol') {
				map.infoWindow.setContent(g.getContent());
				map.infoWindow.setTitle(g.getTitle());
				map.infoWindow.show(event.screenPoint, map.getInfoWindowAnchor(event.screenPoint));
				wdpa_id = g.attributes["wdpa_id"];
				selectWdpa();
			};
		};
	};
	function hidePopup(event) {
		console.log('hidePopup');
		map.infoWindow.hide();
	};
	function selectWdpa() {
		console.log('selectWdpa');
		sitesGrid.clearSelection();
		var rowNum = sitesGrid.store.index[wdpa_id];
		console.log('scrolling to row ' + rowNum + ' with a scrollTo y of ' + (rowNum * sitesGrid.rowHeight));
		sitesGrid.scrollTo({
			x : 0,
			y : (rowNum * sitesGrid.rowHeight)
		});
		sitesGrid.select(wdpa_id);
		//this will only fire the select row event if the row is currently visible so we have to scroll to the row
	};
	function rowSelected(event) {
		console.log('rowSelected');
		currentRow = event.rows[0].data;
		showMarker(currentRow[tp_field]);
		showSpecies();
	};
	function showMarker(rank) {
		console.log('showMarker');
		arrayUtil.forEach(map.graphics.graphics, function(graphic) {
			if ( typeof graphic.symbol !== 'undefined') {
				if (graphic.symbol.type != 'textsymbol') {
					if (graphic.attributes[tp_field] == rank) {
						graphic.setSymbol(highlightSymbol);
						var timer = new Timer();
						timer.start();
						timer.on("tick", function() {
							graphic.setSymbol(defaultSymbol);
						});
					} else {
						graphic.setSymbol(defaultSymbol);
					}
				};
			};
		});
	};
	function showSpecies() {
		console.log('showSpecies');
		var taxongroup = registry.byId("taxa_select").value;
		var statuses = [];
		query("input:checked").forEach(function(node) {
			statuses.push(node.value);
		});
		requestSpeciesData(taxongroup, statuses).then(processSpeciesDataResponse);
	};
	function requestSpeciesData(taxongroup, statuses) {
		console.log('requestSpeciesData');
		requestDeferred = esriRequest({
			url : restServerUrl + "/especies/_get_pa_species_list_validated",
			content : {
				wdpa_id : currentRow["wdpa_id"],
				rlstatus : statuses.join(),
				taxongroup : taxongroup,
				fields : 'iucn_species_id,taxon,commonname,status,flickr_image_count'
			},
			handleAs : "json",
			callbackParamName : "callback"
		});
		return requestDeferred.promise;
		//return a promise to the callback
	};
	function processSpeciesDataResponse(response) {
		console.log('processSpeciesDataResponse');
		speciesGrid.refresh();
		speciesGrid.renderArray(response.records);
		dom.byId("speciesCount").innerHTML = response.records.length + " species for '" + currentRow['name'] + "'";
	};
	function toggleShowImages() {
		query("#showimages").forEach(function(node) {
			showSpeciesImages = node.checked;
		});
		showSpecies();
	};
	function getSpeciesImageUrl(object, value, node, options) {
		if (!showSpeciesImages)
			return;
		var node = domConstruct.create("div", {
			id : 'div' + object.iucn_species_id
		});
		var requestDeferred = esriRequest({
			url : "https://api.flickr.com/services/rest/?",
			content : {
				format : "json",
				method : "flickr.photos.search",
				text : object.taxon,
				api_key : "6d3e521646cdd1391a6dee32d8e54d62",
				per_page : "1"
			},
			handleAs : "json",
			callbackParamName : "jsoncallback"
		});
		requestDeferred.then(function(response) {
			var imgDiv = dom.byId("div" + object.iucn_species_id);
			var f = response.photos.photo[0];
			var anchor = domConstruct.create("a", {
				href : "http://www.flickr.com/photos/" + f["owner"] + "/" + f["id"],
				target : "_new",
				title : "Click to go to the Flickr page"
			}, imgDiv);
			var img = domConstruct.create("img", {
				src : "http://farm" + f["farm"] + ".staticflickr.com/" + f["server"] + "/" + f["id"] + "_" + f["secret"] + "_s.jpg"
			}, anchor);
		});
		return node;
	};
});

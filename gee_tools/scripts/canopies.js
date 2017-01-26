/*jslint plusplus: true */
require(
		["dojo/parser", "dojo/html", "dojo/dom-style", "dojo/dom-geometry", "dojox/gfx", "dojo/request/script", "dojo/dom-class",  "dojo/dom", "dojo/html","dojo/_base/array",  "dojo/_base/lang", "dojo/keys", "dojo/on", "dojo/ready", "dijit/form/Button", "dijit/Dialog", "dijit/form/TextBox" ],
		function(parser, html, domStyle, domGeom, gfx, script, domClass, dom,html, array, lang, keys, on, ready) {
			
			ready(function() {
				//constant definitions
				var OSM_DEFAULT_SCALE = 13;
				var AERIAL_IMAGERY_DEFAULT_SCALE = 20;
				var AERIAL_IMAGERY_WMS_SERVER = "http://ies-ows.jrc.ec.europa.eu/canhemon0";
				var LAYER_RGB_2012 = 'pt.ortophotos.2012.rgb';
				var LAYER_FALSE_COLOUR_2012 = 'pt.ortophotos.2012.ngr';
				var LAYER_RGB_2015 = 'pt.ortophotos.20151127.rgb';
				var LAYER_FALSE_COLOUR_2015 = 'pt.ortophotos.20151127.ngr';
				var REST_SERVER_URL = "http://dopa-services.jrc.ec.europa.eu/services/h05googleearthengine";
				var SHADOW_HTML = " (shadow)";
				var MAX_SITE_BUFFER = 40;
				var CROSSHAIRS_SIZE = 20;
				var DEFAULT_USERNAME = "Pieter Beck";
				//variable definitions
				var username = DEFAULT_USERNAME;
				var currentPosition = 0;
				var currentClass = 0;
				var currentClassDescription = "";
				var currentShadow = false;
				var sites, currentSite, falseColourMap2012, rgbMap2012, falseColourMap2015, rgbMap2015;
				var classLabels = ["NOT CLASSIFIED", "PINE", "YOUNG PINE","EUCALYPTUS", "DECIDUOUS", "DEAD TREE", "UNKNOWN TREE","OTHER VEGETATION","BARE SOIL","PAVED ROAD","DIRT ROAD","WATER","URBAN","OTHER"];
				var classes = [];
				array.forEach(classLabels, function(item, index){
					classes.push({_class:item, selected: false, id: index, next: index + 1});
				});
				classes[0].selected = true; //set the first class as selected
				classes[classes.length-1].next = 0; //set the next value of the last class as the first class
				parser.parse().then(function() {
					usernameDialog.on("execute", function(){
						username = usernameDialog.get("value").username;
					});
					usernameDialog.show();
				});
				//initialise the map
				initialiseMap();
				// add in event handling for when the user presses a key on the keyboard
				on(document, "keydown", keydown);
				//add the validation square
				addCrossHairs("rgbMapDiv");
				addCrossHairs("falseColourMapDiv");
				//get the sites
				getSites(0,10).then(function(){
					moveToCurrentSite(); //0 by default
				});
				
				//creates the map and adds the layers and event handlers
				function initialiseMap(){
					falseColourMap2012 = createMap("falseColour2012MapDiv", LAYER_FALSE_COLOUR_2012);
					rgbMap2012 = createMap("rgb2012MapDiv", LAYER_RGB_2012);
					falseColourMap2015 = createMap("falseColourMapDiv", LAYER_FALSE_COLOUR_2015);
					rgbMap2015 = createMap("rgbMapDiv", LAYER_RGB_2015);
					// when the aerialImagery map moves the context map will move to the same location
					rgbMap2015.on('moveend', function(event) {
						falseColourMap2012.panTo(rgbMap2015.getCenter());
						rgbMap2012.panTo(rgbMap2015.getCenter());
						falseColourMap2015.panTo(rgbMap2015.getCenter());
					});
					// when the aerialImagery map zooms the context map will zoom in the same way
					rgbMap2015.on('zoomend', function(event) {
						falseColourMap2012.setZoom(rgbMap2015.getZoom());
						rgbMap2012.setZoom(rgbMap2015.getZoom());
						falseColourMap2015.setZoom(rgbMap2015.getZoom());
					});
				}
				
				//creates the map and adds the passed layer
				function createMap(divID, layerName){
					var layer = createAerialLayer(layerName);
					// add the layer to the map
					var map = L.map(divID, {
						layers : [ layer ],
						zoom : AERIAL_IMAGERY_DEFAULT_SCALE,
						keyboard : false,
						scrollWheelZoom : "center",
						dragging: false,
					});
					map._layersMaxZoom = 30;
					// add the scale bar to the  map
					L.control.scale().addTo(map);
					return map;
				}
				
				//creates the aerial layer for the map
				function createAerialLayer(layer) {
					var aerialLayer = L.tileLayer.wms(
							AERIAL_IMAGERY_WMS_SERVER, {
								layers : layer,
								format : 'image/png',
								transparent : true,
								tiled: false,
								maxZoom : "24",
								maxNativeZoom: "22",
								uppercase: true,
							});
					return aerialLayer;
				};
				
				//creates the validation square on the rgb map using gfx
				function addCrossHairs(mapDivID){
					//create the canvas object
					var surface = gfx.createSurface(mapDivID, CROSSHAIRS_SIZE, CROSSHAIRS_SIZE);
					var path = surface.createPath().setStroke({color: "white", style: "ShortDash"});
					path.moveTo((CROSSHAIRS_SIZE/2),0).lineTo((CROSSHAIRS_SIZE/2),CROSSHAIRS_SIZE).moveTo(0,(CROSSHAIRS_SIZE/2)).lineTo(CROSSHAIRS_SIZE,(CROSSHAIRS_SIZE/2));
					//move it to the right place
					var position = domGeom.position(rgbMapDiv);
					domStyle.set(surface.rawNode, "top", (position.h/2) - (CROSSHAIRS_SIZE/2) + "px");
					domStyle.set(surface.rawNode, "left", (position.w/2) - (CROSSHAIRS_SIZE/2) + "px");
					domStyle.set(surface.rawNode, "z-index", "10000");
					domStyle.set(surface.rawNode, "position", "absolute");
				}
				
				//REST call to get the site information
				function getSites(startFrom, records) {
					var deferred;
					deferred = script.get(REST_SERVER_URL + "/especies/get_canopy_validated_sites", {
						query : {
							startfrom : startFrom,
							buffersize : records,
						},
						jsonp : "callback"
					});
					deferred.then(function(response) {
						if (sites === undefined) {
							sites = response.records;
						} else {
							if (sites.length > MAX_SITE_BUFFER){ // if we have more than the max site buffer sites then remove the first one
								sites = sites.slice(1);
							}
							sites.push(response.records[0]);
						}
					});
					return deferred;
				}

				//REST call to get the number of validated sites completed
				function getValidationCount(){
					var deferred;
					deferred = script.get(REST_SERVER_URL + "/especies/_get_canopies_validated_site_count", {
						jsonp : "callback"
					});
					deferred.then(function(response) {
						if (response) {
							var validatedCount = response.records[0]._get_canopies_validated_site_count;
							html.set("validatedCount", validatedCount + " points validated");
						}
					});
					return deferred;
				}
				
				//changes the UI to reflect the current site - i.e. moves the map, and sets the class label if there is already a class/shadow
				function gotoSite(site){
					//move the map to the site position
					var centerPointProj = L.point(site.x, site.y);
					var centerPoint = L.CRS.EPSG3857.unproject(centerPointProj);
					falseColourMap2015.setView(centerPoint, AERIAL_IMAGERY_DEFAULT_SCALE);
					rgbMap2015.setView(centerPoint, AERIAL_IMAGERY_DEFAULT_SCALE);
					//if the site has a class already (i.e. the user is moving backwards through the data
					if (site.hasOwnProperty("_class")) {
						selectClass(site._class);
						selectShadow(site.shadow);
					}else{
						selectClass(0); //reset the class
						selectShadow(0); //reset the shadow
					}
				}
				
				//saves the validation data, moves to the next site and loads 1 more site
				function moveToNextSite(){
					currentPosition += 1; //change the current position
					moveToCurrentSite(); //move the UI to the next site
					getSites(0,1); //get another site from the database
					getValidationCount(); //return the validation count to the UI
				}
				
				//moves to the previous site
				function moveToPreviousSite(){
					if (currentPosition > 0){
						currentPosition -= 1;
						moveToCurrentSite(); //move to the previous site in the UI
					}else{
						alert("No more previous sites");
					}
				}
				
				//saves the existing sites data and sets the new current site using the current position
				function moveToCurrentSite(){
					saveClass(); //save the data
					currentSite = sites[currentPosition];
					gotoSite(currentSite);
				}
				
				//saves the validation result to the database
				function saveClass(){
					if (currentSite==undefined){
						return;
					}
					currentSite.shadow = currentShadow; //save the shadow with the in-memory site data
					currentSite._class = currentClass; //save the _class with the in-memory site data
					var currentShadowInteger = currentShadow ? 1 : 0;
					var deferred = script.get(REST_SERVER_URL + "/especies/_set_canopies_site_validated", {
						query : {
							oid : currentSite._oid,
							validated_class: currentClassDescription,
							shadow: currentShadowInteger,
							username: username,
						},
						jsonp : "callback"
					});
					deferred.then(function(response) {
						var result = response.records[0]._set_canopies_site_validated;
						if (result) {
							//succeeded
						}else{
							//failed
						}
					});
				}
				
				//page-level keyboard handling
				function keydown(event) {
					switch (event.keyCode) {
					case (keys.RIGHT_ARROW):
						moveToNextSite();
						break;
					case (keys.LEFT_ARROW):
						moveToPreviousSite();
						break;
					case (keys.UP_ARROW):
						zoomIn();
						break;
					case (keys.DOWN_ARROW):
						toggleShadowClass();
						break;
					case (keys.SPACE):
						changeClass();
						break;
					case (keys.NUMPAD_PLUS):
						zoomIn();
						break;
					case (keys.NUMPAD_MINUS):
						zoomOut();
						break;
					};
				};
								
				//finds and sets the next class
				function changeClass() {
					var nextClassId = getNextClass();
					currentShadow = false;
					selectClass(nextClassId);
				};
				
				//sets the next class
				function selectClass(id){
					array.forEach(classes, function(item){
						item.selected = (item.id ===id);
						if (item.selected){
							html.set(dom.byId("actualClass"),item._class);
							currentClass = item.id;
							currentClassDescription = item._class;
							domClass.remove("actualClass");//clear any classes
							domClass.add("actualClass", item._class.replace(" ","_"));//set the css class
						};
					});
				};
				
				//returns the next class in the sequence
				function getNextClass(){
					var returnValue;
					array.some(classes, function(item){
						if (item.selected){
							returnValue = item.next;	
						};
					});
					return returnValue;
				};
				
				//sets the shadow value
				function selectShadow(shadow){
					var initialHTML = dom.byId("actualClass").innerHTML;
					var newHTML = (shadow) ? initialHTML + SHADOW_HTML : initialHTML.replace(SHADOW_HTML, "");
					currentShadow = shadow;
					html.set(dom.byId("actualClass"), newHTML);
				}
				
				//toggles between shadow/no shadow
				function toggleShadowClass(){
					selectShadow(!currentShadow);
				};
				
				//zoom in while maintaining the centre
				function zoomIn(){
					rgbMap2015.zoomIn();
				}
				
				//zoom out while maintaining the centre
				function zoomOut(){
					rgbMap2015.zoomOut();
				}
			});
		});
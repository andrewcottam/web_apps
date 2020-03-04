require({
	async : true,
	tlmSiblingOfDojo : false,
	baseUrl : "",
	packages : [{
		name : "jrc",
		location : "scripts"
	}, {
		name : "dgrid",
		location : "scripts/dgrid"
	}, {
		name : "put-selector",
		location : "scripts/put-selector"
	}, {
		name : "xstyle",
		location : "scripts/xstyle"
	}]
}, ["dojo/request/xhr", "dojo/dom-attr", "jrc/LoginBox", "dojo/io-query", "dijit/place", "dojo/dom-geometry", "dojo/mouse", "dojo/ready", "dojo/dom-attr", "dojo/aspect", "dojo/Deferred", "jrc/ConfirmDialog", "dojo/date/stamp", "dojo/dom-style", "dojo/promise/all", "dojo/date", "jrc/SpeciesBox", "jrc/GBIFOccurrenceBox", "dojo/_base/lang", "dojo/dom", "dijit/registry", "dojo/_base/window", "dojo/on", "dojo/parser", "dojo/request/script", "dojo/_base/array", "dojo/query", "dojo/dom-construct", "dijit/form/Select", "dijit/form/CheckBox", "dijit/form/TextBox", "dijit/form/Button", "dijit/layout/ContentPane", "dijit/layout/LayoutContainer"], function(xhr, domAttr, LoginBox, ioQuery, place, domGeom, mouse, ready, domAttr, aspect, Deferred, ConfirmDialog, stamp, domStyle, all, date, SpeciesBox, GBIFOccurrenceBox, lang, dom, registry, win, on, parser, script, array, query, domConstruct, Select, CheckBox, TextBox, Button) {
	ready(function() {
		var showimages, taxongroup, language, api_key, loginhandler, loggedIn, boundingbox, hoverNode, gbifOccurrenceBox, restServerUrl, queryObject, wdpa_id;
		queryObject = ioQuery.queryToObject(win.doc.location.search.substring(1));
		wdpa_id = queryObject.wdpaid;
		if (!wdpa_id) {
			alert('no wdpaid');
		}
		restServerUrl = "https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com:8080/python-rest-server/h05googleearthengine";
		parser.parse();
		setLanguage();
		setTaxonGroup();
		setShowImages();
		script.get(restServerUrl + "/especies/get_pa_info", {
			query : {
				wdpa_id : wdpa_id,
				fields : 'name,desig'
			},
			jsonp : "callback"
		}).then(function(response) {
			if (!response.metadata.success) {
				console.log('Unable to get a protected area name for wdpa_id =  ' + wdpa_id);
			} else {
				dom.byId('title').innerHTML = "Species for " + response.records[0].name + " (" + response.records[0].desig + ")";
			};
		});
		on(registry.byId("selectLanguage"), "change", function(value) {
			language = value;
			getData();
		});
		on(registry.byId("select1"), "change", function(value) {
			taxongroup = value;
			getData();
		});
		on(registry.byId("confirmChanges"), "click", setConfirm);
		on(registry.byId("showChecked"), "click", showCheckedClicked);
		on(registry.byId("showImages"), "click", showImagesClicked);
		on(registry.byId("validateAll"), "click", validateAll);
		on(registry.byId("unValidateAll"), "click", unValidateAll);
		on(window, "scroll", loadFlickrImages);
		logout();
		query("#statusFilterControls input").forEach(function(node) {
			on(node, "click", getData);
		});
		gbifOccurrenceBox = new GBIFOccurrenceBox({});
		gbifOccurrenceBox.startup();
		getData();

		function setLanguage() {
			language = (queryObject.language === undefined) ? "english" : queryObject.language;
			script.get(restServerUrl + "/especies/_get_commonname_languages", {
				query : {
					format : 'array',
					includemetadata : false
				},
				jsonp : "callback",
				preventCache : true
			}).then(function(response) {
				var select, options = [], selected;
				select = registry.byId("selectLanguage");
				select.set('disabled', false);
				array.forEach(response.records, function(item) {
					selected = (item[0] === language) ? true : false;
					options.push({
						'label' : item[0],
						'value' : item[0],
						'selected' : selected
					});
				});
				select.addOption(options);
				select.maxHeight = 200;
			});

		}

		function setTaxonGroup() {
			taxongroup = (queryObject.taxongroup === undefined) ? "All" : queryObject.taxongroup;
			registry.byId("select1").set("value", taxongroup);
		}

		function setShowImages() {
			showimages = (queryObject.showimages === undefined) ? 'true' : queryObject.showimages;
			registry.byId("showImages").set("checked", (showimages === "true"));
		}

		function getData(evt) {
			domStyle.set(win.body(), "cursor", "wait");
			var statuses = [];
			query("#statusFilterControls input:checked").forEach(function(node) {
				statuses.push(node.value);
			});
			script.get(restServerUrl + "/especies/get_pa_bbox", {
				query : {
					wdpa_id : wdpa_id,
					parseparams : false
				},
				jsonp : "callback",
				preventCache : true
			}).then(function(response) {
				boundingbox = response.records[0].get_pa_bbox;
			});
			// script.get(restServerUrl + "/especies/get_pa_centroid", {
			// query : {
			// wdpa_id : wdpa_id,
			// parseparams : false
			// },
			// jsonp : "callback",
			// preventCache : true
			// }).then(function(response) {
			// var centroid = response.records[0].get_pa_centroid;
			// x = parseFloat(centroid.substring(centroid.indexOf("(")+1,centroid.indexOf(")")).split(" ")[0]);
			// y = parseFloat(centroid.substring(centroid.indexOf("(")+1,centroid.indexOf(")")).split(" ")[1]);
			// });
			script.get(restServerUrl + "/especies/_get_pa_species_list_validated", {
				query : {
					wdpa_id : wdpa_id,
					rlstatus : statuses.join(),
					taxongroup : taxongroup,
					language1 : language,
					fields : 'iucn_species_id,taxon,commonname,status,validated',
					parseparams : false
				},
				jsonp : "callback",
				preventCache : true
			}).then(function(response) {
				domStyle.set(win.body(), "cursor", "default");
				if (!response.metadata.success) {
					alert('Unable to get a species list for this site. ' + response.metadata.error);
				} else {
					if (dom.byId('speciesList').children.length > 0) {
						array.map(registry.findWidgets(dom.byId('speciesList')), function(item) {
							if (item.declaredClass == 'jrc/SpeciesBox') {
								item.destroy();
							};
						});
					};
					domConstruct.empty("speciesList");
					array.forEach(response.records, function(item, index) {
						var obj = lang.mixin(item, {
							wdpa_id : wdpa_id,
							validation_date : "2000-01-01T00:00:00+01:00",
							current_user : api_key,
							autoUpdate : !dom.byId('confirmChanges').checked,
							readOnly : !loggedIn,
							showIfChecked : dom.byId('showChecked').checked,
							showImages : dom.byId('showImages').checked
						});
						var speciesBox = new SpeciesBox(obj);
						domConstruct.place(speciesBox.domNode, "speciesList");
						speciesBox.startup();
						on(speciesBox, "validationChanged", function(value) {
							setBatchControls();
						});
						on(speciesBox.domNode, mouse.enter, function(evt) {
							getGBIFData(evt);
						});
						setBatchControls();
					});
					dom.byId("speciescount").innerHTML = response.records.length + " species";
				};
			});
		};
		function setConfirm() {
			array.map(registry.findWidgets(dom.byId('speciesList')), function(item) {
				if (item.declaredClass == 'jrc/SpeciesBox') {
					item.autoUpdate = !dom.byId('confirmChanges').checked;
				};
			});
		};
		function showCheckedClicked() {
			array.map(registry.findWidgets(dom.byId('speciesList')), function(item) {
				if (item.declaredClass == 'jrc/SpeciesBox') {
					item.set("showIfChecked", dom.byId('showChecked').checked);
				};
			});
		};
		function showGBIFClicked() {
			array.map(registry.findWidgets(dom.byId('speciesList')), function(item) {
				if (item.declaredClass == 'jrc/SpeciesBox') {
					item.set("showIfChecked", dom.byId('showChecked').checked);
				};
			});
		};
		function showImagesClicked() {
			array.map(registry.findWidgets(dom.byId('speciesList')), function(item) {
				if (item.declaredClass == 'jrc/SpeciesBox') {
					item.set("showImages", dom.byId('showImages').checked);
				};
			});
			domConstruct.empty("speciesList");
			getData();
		};
		function validateAll() {
			(dom.byId('confirmChanges').checked) ? confirmBatchUpdate('check') : batchUpdate('check');
		};
		function unValidateAll() {
			(dom.byId('confirmChanges').checked) ? confirmBatchUpdate('uncheck') : batchUpdate('uncheck');
		};
		function confirmBatchUpdate(operation) {
			var MessageBox = {};
			MessageBox.confirm = function() {
				var confirmDialog = new ConfirmDialog({
					message : 'Are you sure you want to ' + operation + ' all these species?'
				});
				confirmDialog.startup();
				var deferred = new Deferred();
				var handler, handlers = [];
				var destroyDialog = function() {
					array.forEach(handlers, function(handler) {
						handler.remove();
					});
					delete handlers;
					confirmDialog.destroyRecursive();
				};
				handler = aspect.after(confirmDialog, "onExecute", function() {
					destroyDialog();
					deferred.resolve('MessageBox.Yes');
				});
				handlers.push(handler);
				handler = aspect.after(confirmDialog, "onCancel", function() {
					destroyDialog();
					deferred.reject('MessageBox.No');
				});
				handlers.push(handler);
				confirmDialog.show();
				return deferred;
			};
			MessageBox.confirm().then(lang.hitch(this, function() {
				batchUpdate(operation);
			}), lang.hitch(this, function() {
				console.log('Batch ' + operation + ' cancelled');
			}));
		};
		function batchUpdate(operation) {
			var speciesBoxesToProcess = array.filter(registry.findWidgets(dom.byId('speciesList')), function(item) {
				return ((item.checked != operation + 'ed') && (item.declaredClass == 'jrc/SpeciesBox'));
			});
			var speciesIds = array.map(speciesBoxesToProcess, function(item) {
				return item.iucn_species_id;
			}).join();
			if (speciesBoxesToProcess.length > 0) {
				var params;
				if (operation == 'uncheck') {
					params = {
						wdpa_id : wdpa_id,
						iucn_species_ids : speciesIds,
						validation_user : api_key
					};
				} else {
					params = {
						wdpa_id : wdpa_id,
						iucn_species_ids : speciesIds,
						validation_user : api_key,
						validation_date : stamp.toISOString(new Date()),
						validation_message : "Checked using the online species checker tool"
					};
				};
				domStyle.set(win.body(), "cursor", "wait");
				script.get(restServerUrl + "/especies/_set_species_validator_" + operation + "_all", {
					query : params,
					jsonp : "callback"
				}).then(function(response) {
					domStyle.set(win.body(), "cursor", "default");
					if (!response.metadata.success) {
						alert('Unable to process species for this site. ' + response.metadata.error);
					} else {
						array.forEach(response.records, function(item) {
							var matchingSpeciesBox = array.filter(speciesBoxesToProcess, function(speciesBox) {
								lang.mixin(item, {
									validated : (operation == 'uncheck') ? false : true
								});
								return speciesBox.iucn_species_id == item.iucn_species_id;
							});
							matchingSpeciesBox[0].updateAttributes(item);
						});
						(operation == 'check') ? registry.byId("validateAll").set("disabled", true) : registry.byId("unValidateAll").set("disabled", true);
						console.log(operation + 'ed ' + response.metadata.recordCount + ' records');
					};
				});
			};
		};
		function loadFlickrImages(event) {
			array.map(registry.findWidgets(dom.byId('speciesList')), function(item) {
				if (item.declaredClass == 'jrc/SpeciesBox') {
					item.isInViewport();
				};
			});
		};
		function showLoginForm() {
			var MessageBox = {};
			MessageBox.confirm = function() {
				var loginBox = new LoginBox({
				});
				loginBox.startup();
				var deferred = new Deferred();
				var handler, handlers = [];
				var destroyDialog = function() {
					array.forEach(handlers, function(handler) {
						handler.remove();
					});
					delete handlers;
					loginBox.destroyRecursive();
				};
				handler = aspect.after(loginBox, "onExecute", function() {
					deferred.resolve({
						username : loginBox.content.username.value,
						password : loginBox.content.password.value
					});
					destroyDialog();
				});
				handlers.push(handler);
				handler = aspect.after(loginBox, "onCancel", function() {
					deferred.reject("Login box cancelled");
					destroyDialog();
				});
				handlers.push(handler);
				loginBox.show();
				return deferred;
			};
			MessageBox.confirm().then(function(value) {
				domStyle.set(win.body(), "cursor", "wait");
				username = value.username;
				params = {
					username : username,
					password : value.password
				};
				script.get(restServerUrl + "/especies/_get_user_api_key", {
					query : params,
					jsonp : "callback"
				}).then(function(response) {
					domStyle.set(win.body(), "cursor", "default");
					if (!response.metadata.success) {
						alert('Unable to login. ' + response.metadata.error);
					} else {
						if (response.records.length == 1) {
							api_key = response.records[0]._get_user_api_key;
							login(username);
						} else {
							alert('Invalid user');
						};
					};
				});
			}, function(error) {
				console.log("Login form cancelled");
			});
		};
		function login(username) {
			loggedIn = true;
			console.log("Logged in as " + username);
			setBatchControls();
			registry.byId("validateAll").set("title", "Click to check all unchecked species");
			registry.byId("unValidateAll").set("title", "Click to uncheck all checked species");
			var loginlink = dojo.byId("loginLink");
			loginlink.innerHTML = username;
			loginlink.title = "Click here to log out";
			loginhandler.remove();
			on.once(loginlink, "click", function() {
				logout();
			});
			array.map(registry.findWidgets(dom.byId('speciesList')), function(item) {
				if (item.declaredClass == 'jrc/SpeciesBox') {
					item.readOnly = false;
					item.current_user = api_key;
				};
			});
		};
		function logout() {
			loggedIn = false;
			console.log("Logged out");
			setBatchControls();
			registry.byId("validateAll").set("title", "Login to check species");
			registry.byId("unValidateAll").set("title", "Login to check species");
			api_key = undefined;
			var loginlink = dojo.byId("loginLink");
			loginlink.innerHTML = "Login";
			loginlink.title = "Click here to log in";
			loginhandler = on(loginlink, "click", function() {
				showLoginForm();
			});
			array.map(registry.findWidgets(dom.byId('speciesList')), function(item) {
				if (item.declaredClass == 'jrc/SpeciesBox') {
					item.readOnly = true;
					item.current_user = undefined;
				};
			});
		};
		function setBatchControls() {
			if (loggedIn == false) {
				registry.byId("validateAll").set("disabled", true);
				registry.byId("unValidateAll").set("disabled", true);
				return;
			} else {
				registry.byId("validateAll").set("disabled", false);
				registry.byId("unValidateAll").set("disabled", false);
			};
			var checkedSpeciesBoxes = array.filter(registry.findWidgets(dom.byId('speciesList')), function(item) {
				if (item.declaredClass == 'jrc/SpeciesBox') {
					return item.checked == 'checked';
				};
			});
			(checkedSpeciesBoxes.length > 0) ? registry.byId("unValidateAll").set("disabled", false) : registry.byId("unValidateAll").set("disabled", true);
			var uncheckedSpeciesBoxes = array.filter(registry.findWidgets(dom.byId('speciesList')), function(item) {
				if (item.declaredClass == 'jrc/SpeciesBox') {
					return item.checked != 'checked';
				};
			});
			(uncheckedSpeciesBoxes.length > 0) ? registry.byId("validateAll").set("disabled", false) : registry.byId("validateAll").set("disabled", true);
		};
		function getGBIFData(evt) {
			if (!query("#showGBIF:input")[0].checked) {
				return;
			};
			var speciesBox = registry.byNode(evt.currentTarget);
			xhr("https://api.gbif.org/v1/species/match", {
				query : {
					name : speciesBox.taxon
				},
				sync : true,
				handleAs : "json",
				headers : {
					"X-Requested-With" : null
				}
			}).then(function(response) {
				hoverNode = evt.currentTarget;
				script.get("https://api.gbif.org/v1/occurrence/search", {
					query : {
						geometry : boundingbox,
						taxon_key : response.usageKey
					},
					jsonp : "callback"
				}).then(function(response) {
					gbifOccurrenceBox.destroy();
					gbifOccurrenceBox = new GBIFOccurrenceBox({
						records : response.results,
						boundingBox : boundingbox,
						wdpaid : wdpa_id
					});
					var position = domGeom.position(hoverNode, true);
					var domNode = domConstruct.place(gbifOccurrenceBox.domNode, hoverNode.parentNode);
					domStyle.set(domNode, "left", position.x + 158 + "px");
					domStyle.set(domNode, "top", position.y - 75 + "px");
					gbifOccurrenceBox.startup();
				}, function(err) {
					console.log(err);
				});
			}, function(err) {
				// Handle the error condition
			}, function(evt) {
				// Handle a progress event from the request if the
				// browser supports XHR2
			});
		};
	});
});

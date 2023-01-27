require({
	async : true,
	tlmSiblingOfDojo : false,
	baseUrl : "",
	packages : [{
		name : "jrc",
		location : "scripts"
	}]
}, ["dojo/_base/array", "dojo/_base/window", "dojo/io-query", "dojo/ready", "jrc/SimpleSpeciesBox", "dojo/_base/lang", "dojo/dom-construct", "dojo/dom", "dojo/on", "dojo/parser", "dijit/registry", "dojo/request/script", "dojo/_base/array", "dojo/query", "dijit/form/Select", "dijit/form/CheckBox", "dijit/form/Button", "dijit/form/RadioButton"], function(array, win, ioQuery, ready, SimpleSpeciesBox, lang, domConstruct, dom, on, parser, registry, script, arrayUtil, query) {
	ready(function() {
		parser.parse();
		var taxongroup, language, restServerUrl, queryObject;
		queryObject = ioQuery.queryToObject(win.doc.location.search.substring(1));
		restServerUrl = "https://python-rest-server-ny43uciwwa-oc.a.run.app/python-rest-server/jrc-database";
		setLanguage();
		setTaxonGroup();
		on(registry.byId("selectLanguage"), "change", function(value) {
			language = value;
			refetchData();
		});
		on(window, "scroll", loadFlickrImages);
		on(registry.byId("select1"), "change", refetchData);
		query("#statusFilterControls input").forEach(function(node) {
			on(node, "click", refetchData);
		});
		refetchData();

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
			taxongroup = (queryObject.taxongroup === undefined) ? "ll" : queryObject.taxongroup;
			registry.byId("select1").set("value", taxongroup);
		}

		function refetchData(evt) {
			var taxongroup = registry.byId("select1").value;
			var statuses = [];
			query("input:checked").forEach(function(node) {
				statuses.push(node.value);
			});
			script.get(restServerUrl + "/especies/_get_species_charisma", {
				query : {
					taxongroup : taxongroup,
					rlstatus : statuses.join(),
					language1 : language,
					fields : 'iucn_species_id,taxon,commonname,status,flickr_image_count'
				},
				jsonp : "callback"
			}).then(function(response) {
				domConstruct.empty("speciesList");
				arrayUtil.forEach(response.records, function(item, index) {
					var obj = lang.mixin(item, {
						position : index + 1
					});
					var speciesBox = new SimpleSpeciesBox(obj);
					domConstruct.place(speciesBox.domNode, "speciesList");
					speciesBox.startup();
				});
				dom.byId("feedback").innerHTML = response.records.length + " species";
			});
		};

		function loadFlickrImages(event) {
			arrayUtil.map(registry.findWidgets(dom.byId('speciesList')), function(speciesBox) {
				speciesBox.isInViewport();
			});
		};
	});
});

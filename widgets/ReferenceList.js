//widgets/ReferencesList.js
//UI widget that is used as a tool to show scientific references that match the passed protected area name coming from the Elsevier API (https://dev.elsevier.com/index.html). It has the following options:

define(["dijit/registry", "dojo/_base/lang", "dojo/_base/array", "dojo/request/xhr", "dojo/dom-construct", "./ReferenceBox", "dojo/_base/declare", "dojo/parser", "dojo/ready", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./templates/ReferenceList.html"],
	function(registry, lang, array, xhr, domConstruct, ReferenceBox, declare, parser, ready, _WidgetBase, _TemplatedMixin, template) {
		declare("ReferenceList", [_WidgetBase, _TemplatedMixin], {
			templateString: template,
			paname: "",
			_setPanameAttr: function(value) {
				this.destroyBoxes();
				this._set("paname", value);
				this.restRequest();
			},
			restRequest: function() {
				xhr("https://api.elsevier.com/content/search/scidir?", {
					query: {
						field: "prism:issn,prism:publicationName,dc:title,authors,prism:coverDisplayDate,pii,prism:teaser",
						//							subj: "390,391,39,42,392,393,394,395,187,396,213,86,87,90,116,118,172,17,88,89,101,102,103,125,128,148,163,188,218,219,484,92,117,127,215", //this is slow!!
						subj: "5,17",
						apiKey: "700793c78c8fb1d736eb7030bb874bda",
						httpAccept: "application/json",
						sort: "coverDate",
						query: "title(" + this.paname + ")",
					},
					handleAs: "json",
					sync: true,
					headers: {
						"X-Requested-With": null
					},
				}).then(lang.hitch(this, function(response) {
					this.results.innerHTML = "Total results: " + response["search-results"]["opensearch:totalResults"];
					var references = response["search-results"].entry;
					array.forEach(references, lang.hitch(this, function(reference) {
						var referenceBox = new ReferenceBox({
							reference: reference
						});
						referenceBox.startup();
						domConstruct.place(referenceBox.domNode, this.boxes);
					}));
				}), function(err) {
					alert("Error calling the Elsevier API: " + err.message);
					console.log(err);
				});
			},
			destroyBoxes: function() {
				//remove existing boxes 
				if (this.domNode !== null) {
					var existingBoxes = registry.findWidgets(this.domNode);
					array.forEach(existingBoxes, lang.hitch(this, function(box) {
						box.destroy();
					}));
				};
			},
		});
		ready(function() {
			parser.parse();
		});
	});

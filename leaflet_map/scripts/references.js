require({
		async: true,
		packages: [{
			name: "widgets",
			location: "/../../widgets"
		}]
	}, ["dijit/registry", "dojo/on", "widgets/ReferenceList", "dojo/parser", "dojo/ready", "dijit/form/TextBox"],
	function(registry, on, ReferenceList, parser, ready) {
		ready(function() {
			parser.parse().then(function() {
				on(searchBox, "keypress", function(e) {
					if (e.key == "Enter") {
						var widget = registry.byId("refList");
						widget.set("paname", this.value);
						widget.startup();
					}
				});
			});
		});
	});

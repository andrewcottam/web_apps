define(["dojo/_base/lang", "dojo/json", "dojo/request/script", "dojo/dom-style", "dojo/date/stamp", "dojo/date/locale", "dgrid/Grid", "dojo/store/Memory", "dojo/dom", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "dojo/text!species_validation_tool/templates/GBIFOccurrenceBox.html", "http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.js", "dijit/layout/ContentPane", "dijit/layout/LayoutContainer"], function(lang, JSON, script, domStyle, stamp, locale, Grid, Memory, dom, declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template) {
	return declare("jrc/GBIFOccurrenceBox", [_WidgetBase, _TemplatedMixin], {
		templateString : template,
		scientificName : "No records found",
		records : [],
		boundingBox : "POLYGON((116.46382 5.99952000000008,116.46382 6.49520000000007,116.76307 6.49520000000007,116.76307 5.99952000000008,116.46382 5.99952000000008))",
		postMixInProperties : function() {
			if (this.records.length > 0) {
				this.scientificName = this.records[0].scientificName;
			}
		},
		startup : function() {
			this.restServerUrl = "http://dopa-services.jrc.ec.europa.eu/services/";
			var boundingBoxArray, llx, lly, urx, ury, ll, ur, bounds, grid, testDate;
			boundingBoxArray = this.boundingBox.substring(this.boundingBox.indexOf("((") + 2, this.boundingBox.indexOf("))")).split(",");
			llx = parseFloat(boundingBoxArray[0].split(" ")[0]);
			lly = parseFloat(boundingBoxArray[0].split(" ")[1]);
			urx = parseFloat(boundingBoxArray[2].split(" ")[0]);
			ury = parseFloat(boundingBoxArray[2].split(" ")[1]);
			initialx = ((urx - llx) / 2) + llx;
			initialy = ((ury - lly) / 2) + lly;
			ll = new L.LatLng(lly, llx);
			ur = new L.LatLng(ury, urx);
			bounds = new L.LatLngBounds(ll, ur);
			this.map = L.map(this.mapAttachNode);
			initialzoom = this.map.getBoundsZoom(bounds);
			this.map.setView([initialy, initialx], initialzoom);
			L.tileLayer('http://{s}.tiles.mapbox.com/v3/blishten.ii637man/{z}/{x}/{y}.png', {
			}).addTo(this.map);
			script.get(this.restServerUrl + "/ibex/especies/_get_pa_geojson?wdpa_id=" + this.wdpaid, {
				jsonp : "callback"
			}).then(lang.hitch(this, function(response) {
				var geojson = JSON.parse(response.records[0]._get_pa_geojson);
				var geojsonFeature = {
					"type" : "Feature",
					"properties" : {
						"name" : "PA Boundary"
					},
					"geometry" : geojson
				};
				this.geojsonlayer = L.geoJson(geojsonFeature, {
					style : {
						"color" : "#333388",
						"weight" : 2,
						"opacity" : 0.65
					}
				}).addTo(this.map);
			}), function(err) {
				console.log(err);
			});
			if (this.records.length > 0) {
				for ( i = 0; i < this.records.length; i++) {
					L.marker([this.records[i].decimalLatitude, this.records[i].decimalLongitude]).addTo(this.map);
					if (this.records[i].eventDate) {
						encodedDate = this.records[i].eventDate;
						this.records[i].dateString = locale.format(new Date(stamp.fromISOString(encodedDate.substring(0,19))), {
							selector : "date",
							datePattern: "dd/MM/yyyy"
						});
					} else {
						if (this.records[i].occurrenceYear) {
							this.records[i].dateString = this.records[i].occurrenceYear;
						}
					}
				}
				grid = new Grid({
					columns : [{
						label : 'Key',
						field : 'key',
						renderCell : function(object, value, node, options) {
							node.innerHTML = "<a href='http://www.gbif.org/occurrence/" + value + "' target='gbif' title='Click to view the occurrence on the GBIF website'>" + value + "</a>";
						}
					}, {
						label : 'Location',
						field : 'locality'
					}, {
						label : 'Date',
						field : 'dateString'
					}]
				}, this.gridAttachNode);
				grid.renderArray(this.records);
				grid.startup();
			}
		},
		mouseLeave : function(event) {
			if (dom.isDescendant(event.relatedTarget, event.currentTarget)) {
				return;
			}
			this.hide();
		},
		hide : function() {
			domStyle.set(this.domNode, "display", "None");
		}
	});
});

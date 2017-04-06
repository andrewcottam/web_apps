define(["dojo/dom-style", "dojox/gfx", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "dojo/text!./templates/LegendCheckBox.html"], function(domStyle, gfx, declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template) {
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
		templateString : template,
		postCreate : function() {
			var surface = gfx.createSurface(this.surfaceElement, 10, 10);
			surface.createRect({
				width : 10,
				height : 10
			}).setStroke({
				style : "Solid",
				width : 1,
				color : "#fff"
			}).setFill(this.color);
		},
		_onChange : function(event) {
			var display = (!this.checked) ? "block" : "none";
			this.checked = !this.checked
		}
	});
});

define(["dojox/gfx", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "dojo/text!./templates/LegendBox.html"], function(gfx, declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template) {
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
		templateString : template,
		postCreate : function() {
			var surface = gfx.createSurface(this.surfaceElement, 20, 20);
			surface.createCircle({
				cx : 10,
				cy : 10,
				r : 6
			}).setStroke({
				style : "Solid",
				width : 1,
				color : "#fff"
			}).setFill(this.color);
		}
	});
});

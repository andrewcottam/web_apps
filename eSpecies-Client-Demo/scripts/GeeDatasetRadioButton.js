define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "dijit/form/RadioButton", "dojo/text!/eSpecies/templates/GeeDatasetRadioButton.html"], function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, RadioButton, template) {
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
		templateString : template,
		dataset : ""
	});
});

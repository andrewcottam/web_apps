define(["dojo/_base/lang", "dijit/_WidgetsInTemplateMixin", "dijit/Dialog", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!species_validation_tool/templates/ConfirmDialog.html"], function(lang, _WidgetsInTemplateMixin, Dialog, declare, _WidgetBase, _TemplatedMixin, template) {
	return declare(Dialog, {
		title : "Confirm",
		message : "Are you sure?",
		constructor : function(kwArgs) {
			lang.mixin(this, kwArgs);
			var message = this.message;
			var contentWidget = new (declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			templateString: template,
			message: message
			}));
			contentWidget.startup();
			this.content = contentWidget;
		},
		postCreate : function() {
			this.inherited(arguments);
			this.connect(this.content.cancelButton, "onClick", "onCancel");
		}
	});
});

define(["dojo/dom-attr", "dijit/_WidgetsInTemplateMixin", "dijit/Dialog", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./templates/LoginBox.html"], function(domAttr, _WidgetsInTemplateMixin, Dialog, declare, _WidgetBase, _TemplatedMixin, template) {
	return declare(Dialog, {
		title : "Login",
		constructor : function() {
			var contentWidget = new (declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			templateString: template
			}));
			contentWidget.startup();
			this.content = contentWidget;
		},
		postCreate : function() {
			this.inherited(arguments);
			this.connect(this.content.cancel, "onClick", "onCancel");
			this.connect(this.content.username, "onKeyUp", "setOKActive");
			this.connect(this.content.password, "onKeyUp", "setOKActive");
			this.connect(this.content.password, "onKeyPress", "_isreturn");
		},
		setOKActive : function() {
			this.content.login.set("disabled", this.content.username.value === "" && this.content.password.value === "");
		},
		_isreturn : function(event) {
			if (event.keyCode === 13) {
				this.onExecute();
			};
		}
	});
});

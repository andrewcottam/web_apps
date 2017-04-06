define(["dojo/dom-style", "dojo/Evented", "dojo/keys", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "dojo/text!./templates/EnterTextDialog.html"], function(domStyle, Evented, keys, declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template) {
	return declare([_WidgetBase, _TemplatedMixin, Evented], {
		templateString : template,
		_keypress : function(event) {
			if (event.keyCode === keys.ENTER) {
				this.okClicked();
			};
		},
		okClicked : function() {
			this.emit("created", {
				name : this.textInput.value
			});
			this.hide();
		},
		cancelClicked : function() {
			this.emit("cancelled", {});
			this.hide();
		},
		hide : function() {
			domStyle.set(this.domNode, 'display', 'none');
		}
	});
});

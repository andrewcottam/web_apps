define(["dojo/_base/lang", "dojo/Deferred", "dojo/_base/array"], function(lang, Deferred, array) {
    return {
        load: lang.hitch(this, function(id, require, callback) {
            //we will capture the required modules in a global variable - instantiate it if it is not already present
            if (!this.modules) {
                this.modules = [];
            }
            //set the properties of the current requested module - the deferred will be used to fire an asyncronous event when the module is loaded
            var thisModule = {
                id: id,
                deferred: new Deferred(),
            };
            //add this modules details to the list of modules
            this.modules.push(thisModule);
            //when the loading is complete return the value and move on to the next module
            thisModule.deferred.then(function(text) {
                callback(text);
                var nextModule;
                //iterate through the deferred chain until you get to one that hasn't been resolved
                array.some(this.modules, function(item) {
                    nextModule = item;
                    return !item.deferred.isResolved();
                });
                //load the next module
                require([nextModule.id], function(text) {
                    nextModule.deferred.resolve(text);
                });
            });
            //to start things off - request the first module
            if (this.modules.length === 1) {
                require([id], function(text) {
                    thisModule.deferred.resolve(text);
                });
            }
        }),
    };
});

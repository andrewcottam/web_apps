//class to handle the authorisation to google apis
// usage:
// var client = new GoogleApiClient();
// client.authorise('537433629273-q2f0on91cnsuuckkmtl0pbk24mkg6e3m.apps.googleusercontent.com', 'https://www.googleapis.com/auth/fusiontables https://www.googleapis.com/auth/fusiontables.readonly');
// client.request('fusiontables/v2/tables', {
//     maxResults: 100,
// }).then(function(response) {
//     console.log(response);
// })

define(["dojo/Deferred", "dojo/_base/lang", "dojo/_base/declare", "https://apis.google.com/js/platform.js", "https://apis.google.com/js/api.js"],
    function(Deferred, lang, declare) {
        return declare(null, {
            authorise: function(clientid, scope) {
                this.clientid = clientid,
                    this.scope = scope,
                    // Load the API's client and auth2 modules.
                    gapi.load('client:auth2', lang.hitch(this, this.modulesLoaded));
                this.authoriseDeferred = new Deferred(); //create a new deferred that will resolve when authorisation has finished
                return this.authoriseDeferred;
            },

            // google auth2 and client libraries loaded - request the authorisation for the client and scope
            modulesLoaded: function() {
                gapi.client.init({
                    'clientId': this.clientid,
                    'scope': this.scope,
                }).then(lang.hitch(this, function() {
                    // get the authorisation information
                    GoogleAuth = gapi.auth2.getAuthInstance();
                    // if necessary, prompt the user to grant permission for the application to access their data
                    GoogleAuth.signIn().then(lang.hitch(this, function() {
                        this.authoriseDeferred.resolve(true); //resolve the deferred
                    }, function(error) {
                        console.error("The user denied access");
                    }));
                }));
            },

            // user is authorised so make the api request
            request: function(url, params) {
                // create a new deferred that will resolve then the request completes
                this.requestDeferred = new Deferred();
                // if the authorisation flow has completed then call the url
                if (this.authoriseDeferred.isResolved()) {
                    this.makeRequest(url, params);
                }
                else { //wait for the authorisation flow to complete then call the url
                    this.authoriseDeferred.then(lang.hitch(this, function() {
                        this.makeRequest(url, params);
                    }));
                }
                return this.requestDeferred;
            },

            // physically make the request
            makeRequest: function(url, params) {
                gapi.client.request({
                    'method': 'GET',
                    'path': url,
                    'params': params
                }).then(lang.hitch(this, function(response) {
                    // write the reponse back 
                    this.requestDeferred.resolve(response);
                }));
            }
        });
    })

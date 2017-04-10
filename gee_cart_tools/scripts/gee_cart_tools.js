require(["dojo/dom", "dojo/html", "dojo/request/script", "dojo/parser", "dojo/ready", "dijit/layout/ContentPane", "dijit/layout/BorderContainer"],
    function(dom, html, script, parser, ready) {
        var geeImageServerUrl = "https://geeImageServer.appspot.com";
        ready(function() {
            parser.parse(); //startup any widgets in the page
            script.get(geeImageServerUrl + "/getCartTree", {
                jsonp: "callback"
            }).then(function(response) {
                var cart = (response) && (response.records);
                createCartTree(cart);
            });

            //load the client library for the google apis
            gapi.load('client', start);

            function start() {
                // 2. Initialize the JavaScript client library.
                gapi.client.init({
                    'clientId': '537433629273-q2f0on91cnsuuckkmtl0pbk24mkg6e3m.apps.googleusercontent.com',
                    'scope': 'https://www.googleapis.com/auth/fusiontables https://www.googleapis.com/auth/fusiontables.readonly',
                }).then(function() {
                    // 3. Initialize and make the API request.
                    return gapi.client.request({
                        'path': '/fusiontables/v2/tables/14hPdnqjG33cm1bF6fdkGRrgt1Sh1fpzXauO2NZ-5',
                    });
                }).then(function(response) {
                    console.log(response.result);
                }, function(reason) {
                    console.log('Error: ' + reason.result.error.message);
                });
            };
            
            function createCartTree(cart) {
                html.set(dom.byId("cartTreeAsR"), cart.tree);
            }
        });
    });

require({
        async: true,
        packages: [{
                name: "widgetsPath",
                location: "/../../widgets"
            } //i.e. up 2 levels from index.html 
        ]
    }, ["widgetsPath/googleApiClient", "dojo/dom", "dojo/html", "dojo/request/script", "dojo/parser", "dojo/ready", "dijit/layout/ContentPane", "dijit/layout/BorderContainer"],
    function(GoogleApiClient, dom, html, script, parser, ready) {
        var geeImageServerUrl = "https://geeImageServer.appspot.com";
        ready(function() {
            parser.parse().then(function() {

            }); //startup any widgets in the page

            script.get(geeImageServerUrl + "/getCartTree", {
                jsonp: "callback"
            }).then(function(response) {
                var cart = (response) && (response.records);
                createCartTree(cart);
            });

            function createCartTree(cart) {
                html.set(dom.byId("cartTreeAsR"), cart.tree);
                var client = new GoogleApiClient();
                client.authorise('537433629273-q2f0on91cnsuuckkmtl0pbk24mkg6e3m.apps.googleusercontent.com', 'https://www.googleapis.com/auth/fusiontables https://www.googleapis.com/auth/fusiontables.readonly');
                client.request('/fusiontables/v2/tables/14hPdnqjG33cm1bF6fdkGRrgt1Sh1fpzXauO2NZ-5').then(function(response) {
                    console.log(response);
                });
            }
        });
    });

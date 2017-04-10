require(["dojo/dom", "dojo/html", "dojo/request/script", "dojo/parser", "dojo/ready", "dijit/layout/ContentPane", "dijit/layout/BorderContainer"],
    function(dom, html, script, parser, ready) {
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

// <script src="https://apis.google.com/js/platform.js" async defer></script> <!-- Google Sign-In for Website Library-->
// <script src="https://apis.google.com/js/api.js"></script> <!-- Google API Javascript Client Library-->
// GoogleAuth, isAuthorized, currentApiRequest = {
//     'path': '/fusiontables/v2/tables/14hPdnqjG33cm1bF6fdkGRrgt1Sh1fpzXauO2NZ-5'
// };
// clientId: '537433629273-q2f0on91cnsuuckkmtl0pbk24mkg6e3m.apps.googleusercontent.com',
// scope: 'https://www.googleapis.com/auth/fusiontables https://www.googleapis.com/auth/fusiontables.readonly'
//     'path': '/fusiontables/v2/tables/14hPdnqjG33cm1bF6fdkGRrgt1Sh1fpzXauO2NZ-5'

            function createCartTree(cart) {
                html.set(dom.byId("cartTreeAsR"), cart.tree);
            }
        });
    });

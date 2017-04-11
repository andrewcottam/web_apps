require({
        async: true,
        packages: [{
                name: "widgetsPath",
                location: "/../../widgets"
            } //i.e. up 2 levels from index.html 
        ]
    }, ["dojo/_base/array", "dojox/charting/StoreSeries", "dojox/charting/Chart", "dojox/charting/axis2d/Default", "dojox/charting/plot2d/Scatter", "dojox/charting/themes/Julie", "dijit/form/Button", "dijit/registry", "dojo/_base/array", "dijit/form/Select", "dojo/store/Memory", "widgetsPath/googleApiClient", "dojo/dom", "dojo/html", "dojo/request/script", "dojo/parser", "dojo/ready", "dijit/layout/ContentPane", "dijit/layout/BorderContainer"],
    function(array, StoreSeries, Chart, Default, Scatter, Julie, Button, registry, array, Select, Memory, GoogleApiClient, dom, html, script, parser, ready) {
        var geeImageServerUrl = "https://geeImageServer.appspot.com";
        ready(function() {
            parser.parse().then(function() {
                var client = new GoogleApiClient();
                client.authorise('537433629273-q2f0on91cnsuuckkmtl0pbk24mkg6e3m.apps.googleusercontent.com', 'https://www.googleapis.com/auth/fusiontables https://www.googleapis.com/auth/fusiontables.readonly');
                // client.request('/fusiontables/v2/tables/14hPdnqjG33cm1bF6fdkGRrgt1Sh1fpzXauO2NZ-5').then(function(response) {
                //     console.log(response);
                // });
                client.request('fusiontables/v2/tables', {
                    maxResults: 100,
                }).then(populateFusionTableSelect);

                function populateFusionTableSelect(response) {
                    var fusionTablesStore = new Memory({
                        idProperty: "tableId",
                        data: response.result.items
                    });
                    // create Select widget, populating its options from the store
                    var select = new Select({
                        name: "fusionTablesStore",
                        store: fusionTablesStore,
                        style: "width: 200px;",
                        labelAttr: "name",
                        maxHeight: -1, // tells _HasDropDown to fit menu within viewport
                        onChange: fusionTableChanged,
                    }, dom.byId("fusionTables"));
                    select.startup();
                }

                function fusionTableChanged(value) {
                    client.request('fusiontables/v2/tables/' + value).then(getColumnNames);
                }

                function getColumnNames(response) {
                    if (response.result.columns) {
                        var filteredColumnNames = array.filter(response.result.columns, function(item) {
                            return item.name != "geometry";
                        });
                        var columnNamesStore = new Memory({
                            idProperty: "name",
                            data: filteredColumnNames
                        });
                        populateColumnNamesSelect(columnNamesStore);
                    };
                }

                function populateColumnNamesSelect(columnNamesStore) {
                    createColumnSelect("x", columnNamesStore);
                    createColumnSelect("y", columnNamesStore);
                    createGoButton();
                }

                function createColumnSelect(axis, columnNamesStore) {
                    if (registry.byId(axis + "ColumnName")) {
                        registry.byId(axis + "ColumnName").setStore(columnNamesStore);
                    }
                    else {
                        // create Select widget, populating its options from the store
                        var select = new Select({
                            name: axis + "ColumnNameSelect",
                            store: columnNamesStore,
                            style: "width: 200px;",
                            labelAttr: "name",
                            maxHeight: -1, // tells _HasDropDown to fit menu within viewport
                        }, dom.byId(axis + "ColumnName"));
                        select.startup();
                    }
                }

                function createGoButton() {
                    if (!registry.byId("goButton")) {
                        new Button({
                            label: "Go",
                            onClick: getData,
                        }, "goButton").startup();
                    }
                }

                function getData() {
                    var xColumnName = registry.byId("xColumnName").value;
                    var yColumnName = registry.byId("yColumnName").value;
                    var tableid = registry.byId("fusionTables").value;
                    client.request('fusiontables/v2/query', {
                        sql: 'select ' + xColumnName + ',' + yColumnName + ' from ' + tableid,
                    }).then(function(response) {
                        var records = [];
                        array.forEach(response.result.rows, function(item) {
                            records.push({
                                x: item[0],
                                y: item[1],
                            });
                        });
                        populateChart(records);
                    });
                }

                function populateChart(records) {
                    var c = new Chart("scatter");
                    c.addPlot("default", {
                            type: Scatter
                        })
                        .addAxis("x")
                        .addAxis("y")
                        .setTheme(Julie)
                        .addSeries("Points", records)
                        .render();
                }

            });

            script.get(geeImageServerUrl + "/getCartTree", {
                jsonp: "callback"
            }).then(function(response) {
                var cart = (response) && (response.records);
                createCartTree(cart);
            });

            function createCartTree(cart) {
                html.set(dom.byId("cartTreeAsR"), cart.tree);
            }
        });
    });

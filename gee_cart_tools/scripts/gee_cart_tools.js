require({
        async: true,
        packages: [{
                name: "widgetsPath",
                location: "/../../widgets"
            } //i.e. up 2 levels from index.html 
        ]
    }, ["dojox/charting/plot2d/Lines", "dojo/_base/lang", "dojo/_base/array", "dojox/charting/StoreSeries", "dojox/charting/Chart", "dojox/charting/axis2d/Default", "dojox/charting/plot2d/Scatter", "dojox/charting/themes/Julie", "dijit/form/Button", "dijit/registry", "dijit/form/Select", "dojo/store/Memory", "widgetsPath/googleApiClient", "dojo/dom", "dojo/html", "dojo/request/script", "dojo/parser", "dojo/ready", "dijit/layout/ContentPane", "dijit/layout/BorderContainer"],
    function(Lines, lang, array, StoreSeries, Chart, Default, Scatter, Julie, Button, registry, Select, Memory, GoogleApiClient, dom, html, script, parser, ready) {
        var geeImageServerUrl = "https://geeImageServer.appspot.com",
            columnNames = [], //simple array of column names in the fusion table
            classColumnName, //name of the column in the fusion table which has the class value
            scatterChart; //the chart widget
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
                            if (item.name != "geometry") {
                                columnNames.push(item.name); //add to the simple column names array
                            }
                            return item.name != "geometry"; //return the column object if it is not named 'geometry'
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
                    var xColumnName = registry.byId("xColumnName").value; //get the name of the x column from the select box
                    var yColumnName = registry.byId("yColumnName").value; //get the name of the y column from the select box
                    classColumnName = (array.indexOf(columnNames, "class") >= 0) ? "class" : null; // get the name of the class column if there is one
                    var tableid = registry.byId("fusionTables").value; // get the fusion table id
                    var sql = classColumnName ? 'select ' + xColumnName + ',' + yColumnName + ',class from ' + tableid : 'select ' + xColumnName + ',' + yColumnName + ' from ' + tableid;
                    client.request('fusiontables/v2/query', {
                        sql: sql,
                    }).then(function(response) {
                        drawChart(response);
                    });
                }

                function drawChart(response) {
                    var records = [],
                        series;
                    array.forEach(response.result.rows, function(item) {
                        if (item.length == 2) {
                            records.push({
                                x: item[0],
                                y: item[1],
                            })
                        }
                        else {
                            records.push({
                                x: item[0],
                                y: item[1],
                                _class: item[2],
                            })
                        }
                    });
                    if (scatterChart) { //we need to destroy the chart as the axes will have changed
                        scatterChart.destroy();
                    }
                    //create the new chart
                    scatterChart = new Chart("scatter");
                    var plot = scatterChart.addPlot("default", {
                            type: Scatter
                        }).addAxis("x", {
                            fixLower: "major",
                            fixUpper: "major",
                            title: response.result.columns[0],
                            titleOrientation: "away",
                        })
                        .addAxis("y", {
                            vertical: true,
                            fixLower: "major",
                            fixUpper: "major",
                            min: 0,
                            title: response.result.columns[1],
                        })
                        .setTheme(Julie);
                    // if we have a class column in the fusion table data then we need to split the data into series - one series for each class
                    if (classColumnName) {
                        series = getRecordsByClass(records);
                    }
                    else {
                        // only one class
                        series = [{
                            _class: "1",
                            records: records
                        }];
                    }
                    array.forEach(series, function(s) {
                        var fillColor = s._class == "0" ? "red" : "blue";
                        plot.addSeries("Class_" + s._class, s.records, {
                            stroke: {
                                color: fillColor
                            },
                            fill: fillColor,
                        });
                    });
                    plot.render();
                }

                function getRecordsByClass(records) {
                    //first get the unique class values
                    var uniqueClasses = [];
                    array.filter(records, function(item) {
                        if (uniqueClasses.indexOf(item._class) === -1) {
                            uniqueClasses.push(item._class);
                        }
                    });
                    var recordsByClass = [];
                    array.forEach(uniqueClasses, function(_class) {
                        var filtered = array.filter(records, function(item) {
                            if (item._class === _class) {
                                return true;
                            }
                        });
                        recordsByClass.push({
                            _class: _class,
                            records: filtered
                        });
                    });
                    return recordsByClass;
                }
            });

            script.get(geeImageServerUrl + "/getCartTree", {
                jsonp: "callback"
            }).then(function(response) {
                var cart = (response) && (response.records);
                createCartTree(cart);
            });

            function createCartTree(cart) {
                var cartObj = cartStringToObject(cart.tree);
                var chart1 = new Chart("scatter");
                chart1.addPlot("default", {
                    type: Lines
                });
                chart1.addAxis("x", {
                    min: 0,
                    max: 1
                });
                chart1.addAxis("y", {
                    vertical: true,
                    min: 0,
                    max: 200
                });
                array.forEach(cartObj, function(item, i) {
                    console.log(item.text);
                    var points = [];
                    if (item.split !== "root" && item.axisName !== "area_new_always_water") {
                        if (item.axisName === "ratio_new_to_permanent") {
                            points.push([{
                                x: item.splitAt,
                                y: 0
                            }, {
                                x: item.splitAt,
                                y: 200
                            }]);
                        }
                        else {
                            points.push([{
                                x: 0,
                                y: item.splitAt,
                            }, {
                                x: 1,
                                y: item.splitAt,
                            }]);
                        }
                        chart1.addSeries("node" + item.id, points[0]);
                        chart1.render();
                    }
                });
            }

            function cartStringToObject(cartString) {
                cartString = cartString.replace("1) root", " 1) root"); //hack to get the first node in which doesnt have a space before it
                var re = /( \d+\))/g;
                var nodeObjects = [];
                var nodes = cartString.split(re).slice(1);
                //iterate through the nodes and parse them to a javascript object
                array.forEach(nodes.slice(0, (nodes.length / 2) - 1), function(item, i) {
                    var nodeid = nodes[(i * 2)].substr(1, (nodes[(i * 2)].length) - 2);
                    var nodeContent = nodes[(i * 2) + 1].trim().replace(/\( /, "(").replace(/ \)/, ")").split(" ");
                    var axisName, splitAt, operator;
                    if (nodeContent[0] !== "root") {
                        var splitParams = nodeContent[0].split(/[<>]/);
                        axisName = splitParams[0];
                        if (splitParams[1].substr(0, 1) === "=") {
                            splitAt = splitParams[1].substr(1);
                            operator = "<=";
                        }
                        else {
                            splitAt = splitParams[1];
                            operator = ">";
                        }
                    }
                    else {
                        axisName = null;
                        splitAt = null;
                        operator = null;
                    }
                    var nodeContentObj = {
                        id: Number(nodeid),
                        operator: operator,
                        axisName: axisName,
                        splitAt: splitAt,
                        split: nodeContent[0],
                        n: nodeContent[1],
                        cost: nodeContent[2],
                        yval: nodeContent[3],
                        impurity: nodeContent[4],
                        text: nodes[(i * 2) + 1],
                    };
                    if (nodeContent.length === 6) {
                        lang.mixin(nodeContentObj, {
                            leaf: true
                        });
                    }
                    else {
                        lang.mixin(nodeContentObj, {
                            leaf: false
                        });
                    }
                    nodeObjects.push(nodeContentObj);
                });
                nodeObjects = nodeObjects.sort(compare);
                return nodeObjects;
            }

            function compare(a, b) {
                if (a.id < b.id)
                    return -1;
                if (a.id > b.id)
                    return 1;
                return 0;
            }
        });
    });

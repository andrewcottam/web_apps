/*global app*/
define(["dojo/topic", "dojo/on", "dojo/dom-style", "dojo/request/script", "dojo/_base/lang", "dojo/_base/array", "dojox/charting/Chart", "dojox/charting/plot2d/StackedColumns", "dojox/charting/axis2d/Default", "esri/geometry/webMercatorUtils"], function(topic, on, domStyle, script, lang, array, Chart, StackedColumns, Default, webMercatorUtils) {
  /*
   * Custom Javascript to be executed while the application is initializing goes here
   */
  var geeServerUrl = "https://geeImageServer.appspot.com";
  var monthlyRecurrenceChart, yearlyClassificationsChart;

  topic.subscribe("story-loaded-map", function(result) {
    if (app.map) {
      //remove the light class from the infowindow - this is added in the esri storymap for some reason and it hides the title
      $(app.map.infoWindow.domNode).removeClass("light");
      app.map.infoWindow.setContent("<div class='chartHolder'><img src='https://www.arcgis.com/sharing/rest/content/items/6e9b0cac8b61432fb4dc422840f18240/resources/loading__1523620657133.gif' class='loadingIcon' id='loading1'><div id='monthlyRecurrenceChart' class='chart'></div></div><div class='chartHolder'><img src='https://www.arcgis.com/sharing/rest/content/items/6e9b0cac8b61432fb4dc422840f18240/resources/loading__1523620657133.gif' class='loadingIcon' id='loading2'><div id='yearlyClassificationsChart' class='chart2'></div></div>");
      app.map.infoWindow.resize(370, 400);
      app.map.infoWindow.setTitle("Water history");
      createMonthlyRecurrenceChart();
      createYearlyClassificationsChart();
      if (!app.map.clickAttached) {
        app.map.clickAttached = on(app.map, "click", function(evt) {
          var ll = webMercatorUtils.xyToLngLat(evt.mapPoint.x, evt.mapPoint.y);
          var latlng = { lat: ll[1], lng: ll[0] };
          getMonthlyRecurrence(latlng);
          getYearlyClassifications(latlng);
          app.map.infoWindow.show(evt.screenPoint, app.map.getInfoWindowAnchor(evt.screenPoint));
        });
      }
    }
  });

  // The application is ready
  topic.subscribe("tpl-ready", function() {
    /*
     * Custom Javascript to be executed when the application is ready goes here
     */
  });

  function createMonthlyRecurrenceChart() {
    monthlyRecurrenceChart = new Chart("monthlyRecurrenceChart", {
      title: "Monthly",
      titleFont: "normal normal normal 8pt Tahoma",
      titleGap: 6
    });
    monthlyRecurrenceChart.addPlot("default", {
      type: "StackedColumns",
      gap: 5
    });
    monthlyRecurrenceChart.addAxis("x", {
      majorLabels: true,
      minorTicks: false,
      majorTickStep: 1,
      titleOrientation: "away",
      titleGap: 9,
      titleFont: "normal normal normal 9pt Tahoma",
      labels: [{
        value: 1,
        text: "Jan"
      }, {
        value: 2,
        text: "Feb"
      }, {
        value: 3,
        text: "Mar"
      }, {
        value: 4,
        text: "Apr"
      }, {
        value: 5,
        text: "May"
      }, {
        value: 6,
        text: "Jun"
      }, {
        value: 7,
        text: "Jul"
      }, {
        value: 8,
        text: "Aug"
      }, {
        value: 9,
        text: "Sep"
      }, {
        value: 10,
        text: "Oct"
      }, {
        value: 11,
        text: "Nov"
      }, {
        value: 12,
        text: "Dec"
      }]
    });
    monthlyRecurrenceChart.addAxis("y", {
      min: 0,
      max: 1,
      vertical: true,
      fixLower: "major",
      fixUpper: "major",
      majorLabels: true,
      minorLabels: true,
      title: 'Recurrence',
      titleGap: 9,
      titleFont: "normal normal normal 9pt Tahoma"
    });
    monthlyRecurrenceChart.connectToPlot("default", function(evt) {
      var shape = evt.shape,
        type = evt.type;
      switch (type) {
        case "onclick":
          console.log("onclick");
          break;
        case "onmouseover":
          shape.moveToFront();
          shape.setStroke("#bbbbbb");
          break;
        case "onmouseout":
          shape.setStroke("#ffffff");
          break;
        default:
          break;
      }; //end switch statement
    }); //end connectToPlot
  };

  function createYearlyClassificationsChart() {
    yearlyClassificationsChart = new Chart("yearlyClassificationsChart", {
      title: "Yearly",
      titleFont: "normal normal normal 8pt Tahoma",
      titleGap: 7
    });
    yearlyClassificationsChart.addPlot("default", {
      type: "Columns"
    });
    yearlyClassificationsChart.addAxis("x", {
      majorLabels: true,
      minorTicks: false,
      majorTickStep: 1,
      rotation: -90,
      titleOrientation: "away",
      titleGap: 9,
      titleFont: "normal normal normal 9pt Tahoma",
      labels: [{
        value: 1,
        text: "1984"
      }, {
        value: 2,
        text: "1985"
      }, {
        value: 3,
        text: "1986"
      }, {
        value: 4,
        text: "1987"
      }, {
        value: 5,
        text: "1988"
      }, {
        value: 6,
        text: "1989"
      }, {
        value: 7,
        text: "1990"
      }, {
        value: 8,
        text: "1991"
      }, {
        value: 9,
        text: "1992"
      }, {
        value: 10,
        text: "1993"
      }, {
        value: 11,
        text: "1994"
      }, {
        value: 12,
        text: "1995"
      }, {
        value: 13,
        text: "1996"
      }, {
        value: 14,
        text: "1997"
      }, {
        value: 15,
        text: "1998"
      }, {
        value: 16,
        text: "1999"
      }, {
        value: 17,
        text: "2000"
      }, {
        value: 18,
        text: "2001"
      }, {
        value: 19,
        text: "2002"
      }, {
        value: 20,
        text: "2003"
      }, {
        value: 21,
        text: "2004"
      }, {
        value: 22,
        text: "2005"
      }, {
        value: 23,
        text: "2006"
      }, {
        value: 24,
        text: "2007"
      }, {
        value: 25,
        text: "2008"
      }, {
        value: 26,
        text: "2009"
      }, {
        value: 27,
        text: "2010"
      }, {
        value: 28,
        text: "2011"
      }, {
        value: 29,
        text: "2012"
      }, {
        value: 30,
        text: "2013"
      }, {
        value: 31,
        text: "2014"
      }, {
        value: 32,
        text: "2015"
      }]
    });
    yearlyClassificationsChart.addAxis("y", {
      min: 0,
      max: 1,
      vertical: true,
      fixLower: "major",
      fixUpper: "major",
      majorLabels: false,
      minorLabels: false,
      majorTicks: false,
      minorTicks: false,
      title: 'Water class',
      titleGap: 9,
      titleFont: "normal normal normal 9pt Tahoma"
    });
    yearlyClassificationsChart.connectToPlot("default", function(evt) {
      var shape = evt.shape,
        type = evt.type;
      switch (type) {
        case "onclick":
          console.log("onclick");
          break;
        case "onmouseover":
          shape.moveToFront();
          shape.setStroke("#bbbbbb");
          break;
        case "onmouseout":
          shape.setStroke("#ffffff");
          break;
        default:
          break;
      }; //end switch statement
    }); //end connectToPlot
  }

  function getMonthlyRecurrence(latLong) {
    domStyle.set("loading1", "display", "block");
    script.get(geeServerUrl + "/monthlyRecurrence", {
      query: {
        lng: latLong.lng,
        lat: latLong.lat
      },
      jsonp: "callback"
    }).then(lang.hitch(this, function(response) {
      var recurrenceData = [],
        obsData = [];
      array.forEach(response.records, function(record, index) {
        recurrenceData.push({
          x: index + 1,
          y: record.monthly_recurrence,
          fill: "#006AC2",
          stroke: "#ffffff"
        });
        obsData.push({
          x: index + 1,
          y: 1 - (record.hasObs ? 0 : 1),
          fill: "#FFD5A7",
          stroke: "#ffffff"
        });
      });
      monthlyRecurrenceChart.addSeries("series1", {
        data: recurrenceData
      });
      monthlyRecurrenceChart.addSeries("series2", {
        data: obsData
      });
      monthlyRecurrenceChart.render();
      domStyle.set("loading1", "display", "none");
    }));
  }

  function getYearlyClassifications(latLong) {
    domStyle.set("loading2", "display", "block");
    script.get(geeServerUrl + "/yearlyClassifications", {
      query: {
        lng: latLong.lng,
        lat: latLong.lat
      },
      jsonp: "callback"
    }).then(lang.hitch(this, function(response) {
      var yearlyData = [];
      array.forEach(response.records, function(record, index) {
        var color, value = 1;
        switch (record.waterClass) {
          case 0:
            color = "none";
            value = 0; //dont show the bar
            break;
          case 1:
            color = "#FFD5A7"; //not water
            break;
          case 2:
            color = "#8ADBF0"; //seasonal
            break;
          case 3:
            color = "#006AC2"; //permanent
            break;
        }
        yearlyData.push({
          x: index + 1,
          y: value,
          fill: color,
          stroke: "#ffffff"
        });
      });
      yearlyClassificationsChart.addSeries("series1", {
        data: yearlyData
      });
      yearlyClassificationsChart.render();
      domStyle.set("loading2", "display", "none");
    }));
  }
});

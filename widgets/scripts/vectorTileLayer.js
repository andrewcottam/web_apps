/*global L*/
L.VectorTileLayer = L.VectorGrid.Protobuf.extend({
    statics: {
        CALLOUT_CIRCLE_RADIUS: 7,
        CALLOUT_LINE_LENGTH: 50,
    },
    defaultOptions: {
        continuous: true,
        debug: false,
    },
    initialize: function(url, tileoptions, options) {
        L.VectorGrid.Protobuf.prototype.initialize.call(this, url, tileoptions);
        L.Util.setOptions(this, this.defaultOptions);
        L.Util.setOptions(this, options);
    },
    onAdd: function(map) {
        L.VectorGrid.Protobuf.prototype.onAdd.call(this, map);
        //mouse events
        this.on("mousemove", function(evt) {
            if (this.options.continuous) {
                this.showPopup(evt);
            }
            else {
                //TODO implement timed popups 
            }
        });
        this.on("mouseout", this.removePopup);
        this.on("click", this.handleClick);
        //get the metrics for the vector tile provider when loaded - only in debug mode
        if (this.options.debug) {
            this.on("load", this.populateLayerMetrics);
        }
        //add a class attribute in the layer so we know which one it is in the DOM tree
        var el = this.getContainer();
        var id;
        switch (this._url) {
            case "https://free-{s}.tilehosting.com/data/v3/{z}/{x}/{y}.pbf.pict?key=UmmATPUongHdDmIicgs7":
                id = "OpenMapTiles";
                break;
            case "https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/{z}/{x}/{y}.mvt?access_token=pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg":
                id = "MapBox";
                break;
            case "https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.mvt?api_key=vector-tiles-VyYjZGS":
                id = "MapZen";
                break;
            case "https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{x}/{y}.pbf":
                id = "ESRI";
                break;
            default:
                id = "CustomVectorTile";
        }
        //set a simple text string as the provider name
        this.provider = id;
        L.DomUtil.addClass(el, id);
    },
    onRemove: function(map) {
        L.VectorGrid.Protobuf.prototype.onRemove.call(this, map);
    },
    showPopup: function(evt) {
        var text = "";
        //remove the existing popup
        if (this._map.popup) {
            this.removePopup(evt);
        }
        //show the callout
        this._map.popup = L.DomUtil.create("div", "popup"); //create the popup
        this._map.getPanes().overlayPane.appendChild(this._map.popup); //append it to the overlay pane
        if (this.options.debug) {
            L.DomUtil.setPosition(this._map.popup, L.point(evt.layerPoint.x + 10, evt.layerPoint.y + 10)); //position of the popup
            text = "<table><tr>";
            for (var prop in evt.layer.properties) { //iterate through the properties of the OSM feature 
                text += "<td>" + prop + "</td><td>" + evt.layer.properties[prop] + "</td></tr>"; //write the html text with the new value in
            }
            this._map.popup.innerHTML = text + "</table>";
            // evt.layer._path.style = "fill-opacity:1";
        }
        else {
            //get the text for the popup
            text = this.getPopupText(evt);
            this._map.popup.innerHTML = text; //set the html of the popup
            //style the border of the popup
            this._map.popup.style = "border:0.5px solid " + evt.layer.options.fillColor;
            //position the popup
            var popupWidth = Number(L.DomUtil.getStyle(this._map.popup, "width").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-left").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-right").replace("px", ""));
            var popupHeight = Number(L.DomUtil.getStyle(this._map.popup, "height").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-top").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-bottom").replace("px", ""));
            var xSign = ((L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS + L.VectorTileLayer.CALLOUT_LINE_LENGTH + popupWidth) > evt.layerPoint.x) ? 1 : -1;
            var x = (xSign == 1) ? (evt.layerPoint.x + L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS + L.VectorTileLayer.CALLOUT_LINE_LENGTH) : (evt.layerPoint.x - L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS - L.VectorTileLayer.CALLOUT_LINE_LENGTH - popupWidth);
            var y = (evt.layerPoint.y - popupHeight / 2);
            L.DomUtil.setPosition(this._map.popup, L.point(x, y)); //position of the popup
            //create the circle
            this._map.popup.circle = L.circleMarker(evt.latlng, {
                radius: L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS,
                color: evt.layer.options.fillColor,
                weight: .5,
                fillOpacity: 0,
            }).addTo(this._map);
            //create the line
            var latlngs = this.getLine(evt.containerPoint, xSign);
            this._map.popup.polyline = L.polyline(latlngs, {
                color: evt.layer.options.fillColor,
                weight: .5,
            }).addTo(this._map);
            //disable mouse events for the popup otherwise it will cause the mouseout event to keep firing if it gets in the way
            L.DomUtil.addClass(this._map.popup, "disableMouseEvents");
            L.DomUtil.addClass(this._map.popup.circle.getElement(), "disableMouseEvents");
            L.DomUtil.addClass(this._map.popup.polyline.getElement(), "disableMouseEvents");
        }
    },
    getLine: function(p, xSign) {
        var linePoints = [
            [p.x + (xSign * (L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS)), p.y],
            [p.x + (xSign * (L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS + L.VectorTileLayer.CALLOUT_LINE_LENGTH)), p.y]
        ];
        var latlngs = [];
        for (const point of linePoints) {
            latlngs.push(this._map.containerPointToLatLng(point));
        }
        return latlngs;
    },
    removePopup: function(evt) {
        var map = (this instanceof L.Map) ? this : this._map;
        if ((map) && (map.popup)) {
            if (map.popup.circle) {
                map.popup.circle.remove();
            }
            if (map.popup.polyline) {
                map.popup.polyline.remove();
            }
            L.DomUtil.remove(map.popup);
        }
    },
    getPopupText: function(evt) {
        var text = "";
        var properties = [];
        var propertyNames = [];
        var omitProps = ["sort_rank", "kind_detail", "id:right", "id:left", "source", "area", "min_zoom", "id", "osm_relation", "tier", "boundary", "ISO3"]; //exclude the following properties from appearing - these are Mapzen specific
        //add the kind property if it has been passed in as an option in the constructor
        if (this.options.hasOwnProperty("kind")) {
            evt.layer.properties.kind = this.options.kind;
        }
        for (var prop in evt.layer.properties) { //iterate through the properties of the OSM feature and populate the properties that are valid and that we want to show
            if (omitProps.indexOf(prop) == -1) { //omit certain system properties
                if (Object.values(properties).indexOf(evt.layer.properties[prop]) == -1) { //check that we havent already got the value
                    properties[prop] = evt.layer.properties[prop];
                    propertyNames.push(prop);
                }
            }
        }
        //order the property names
        this.moveElementToStart(propertyNames, "NAME");
        this.moveElementToStart(propertyNames, "name");
        this.moveElementToStart(propertyNames, "kind");
        for (let prop of propertyNames) { //iterate through the properties that we want to show and build the html for the popup
            var _class = " class='attr'";
            var value = properties[prop]; //get the value
            if (typeof(value) == "string") { //check the value is a string
                value = value.replace("_", " "); //replace any underscores
            }
            switch (prop) {
                case "kind":
                    _class = " class='kind'";
                    break;
                case "NAME":
                case "name":
                    _class = " class='name'";
                    break;
                case "DESIG":
                    value = "Designation: " + value;
                    break;
                case "IUCN_CAT":
                    value = "IUCN Category: " + value;
                    break;
                case "STATUS":
                    value = "Status: " + value;
                    break;
                default:
                    if (typeof(value) == "string") {
                        value = value.substr(0, 1).toUpperCase() + value.substr(1); //Sentence case
                    }
                    break;
            }
            text += "<div" + _class + ">" + value + "</div>"; //write the html text with the new value in
        }
        return text;
    },
    moveElementToStart: function(array, propertyName) {
        var pos = array.indexOf(propertyName);
        if (pos) {
            array.unshift(array[pos]);
            array.splice(pos + 1, 1);
        }
        return array;
    },
    //function to summarise the vector tiles for the current map extent in terms of the number of features and the classes that they contain
    populateLayerMetrics: function(evt) {
        var uniqueValues = [];
        var count = 0;
        for (var tileName in evt.target._vectorTiles) { //iterate through the tiles and get the unique layer names
            var tile = evt.target._vectorTiles[tileName]; //get the tile
            if (tile.hasOwnProperty("_layers")) { //if the tile has some geographic features
                count += Object.keys(tile._layers).length; //increment the count of features
            }
            if (tile.hasOwnProperty("_features")) { //features are NOT geometric features but the different classes that are assgned to specific layers, e.g. canal, farmland, hamlet, minor, primary, residential
                for (var className in tile._features) { //each class contains a single geographic feature and has the layer name, canal->layerName = 'waterway'
                    var classObj = tile._features[className]; //e.g. get the canal object
                    if (classObj.hasOwnProperty("layerName")) { //layers are how the vector tiles are delivered, e.g. boundary, building, landcover
                        var layerName = classObj.layerName; //get the layer that the class belongs to 
                        var uniqueValue = layerName + " | " + className;
                        if (Object.values(uniqueValues).indexOf(uniqueValue) == -1) { //check that we havent already got the layer
                            uniqueValues.push(uniqueValue);
                        }
                    }
                }
            }
        }
        console.debug(this.provider + ":");
        console.debug(uniqueValues.sort());
        console.debug("Total features: " + count);
    },
    handleClick: function(evt) {
        //if in debug mode the highlighted feature will be hidden
        if (this.options.debug) {
            evt.layer._path.style = "display: none";
        }
        //log the url of the vector tile that the clicked feature belongs to
        var c = evt.layer._renderer._tileCoord;
        // console.debug(evt.target._url.replace("{z}", c.z).replace("{x}", c.x).replace("{y}", c.y).replace("{s}", evt.target.options.subdomains));
        console.debug(evt.target._url.replace("{z}", c.z).replace("{x}", c.x).replace("{y}", c.y).replace("{s}", "1")); //seems to be just '1'
    },
});
L.vectorTileLayer = function(url, tileoptions, options) {
    return new L.VectorTileLayer(url, tileoptions, options);
};

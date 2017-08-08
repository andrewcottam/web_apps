/*global L*/
L.VectorTileLayer = L.VectorGrid.Protobuf.extend({
    statics: {
        CALLOUT_CIRCLE_RADIUS: 7,
        CALLOUT_LINE_LENGTH: 50,
    },
    defaultOptions: {
        continuous: true,
    },
    initialize: function(url, tileoptions, options) {
        L.VectorGrid.Protobuf.prototype.initialize.call(this, url, tileoptions);
        L.Util.setOptions(this, this.defaultOptions);
        L.Util.setOptions(this, options);
    },
    onAdd: function(map) {
        L.VectorGrid.Protobuf.prototype.onAdd.call(this, map);
        //event to capture the mouse over on this layer
        map.on("movestart", this.removePopup);
        this.on("mouseover", function(evt) {
            if (this.options.continuous) {
                this.showPopup(evt);
            }
            else {
                //TODO implement timed popups 
            }
        });
        var el = this.getContainer();
        var id;
        switch (this._url) {
            case "https://free-{s}.tilehosting.com/data/v3/{z}/{x}/{y}.pbf.pict?key=UmmATPUongHdDmIicgs7":
                id = "openmapsLayer";
                break;
            case "https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/{z}/{x}/{y}.mvt?access_token=pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg":
                id = "mapboxLayer";
                break;
            case "https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.mvt?api_key=vector-tiles-VyYjZGS":
                id = "mapzenLayer";
                break;
            case "https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{x}/{y}.pbf":
                id = "esriLayer";
                break;
            default:
                id = "customVectorTileLayer";
        }
        L.DomUtil.addClass(el, id);
    },
    onRemove: function(map) {
        L.VectorGrid.Protobuf.prototype.onRemove.call(this, map);
    },
    showPopup: function(evt) {
        //show the callout
        if (this._map.popup) {
            this.removePopup(evt);
        }
        this._map.popup = L.DomUtil.create("div", "popup"); //create the popup
        this._map.getPanes().overlayPane.appendChild(this._map.popup); //append it to the overlay pane
        //get the text for the popup
        var text = this.getPopupText(evt);
        this._map.popup.innerHTML = text; //set the html of the popup
        var popupWidth = Number(L.DomUtil.getStyle(this._map.popup, "width").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-left").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-right").replace("px", ""));
        var popupHeight = Number(L.DomUtil.getStyle(this._map.popup, "height").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-top").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-bottom").replace("px", ""));
        var xSign = ((L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS + L.VectorTileLayer.CALLOUT_LINE_LENGTH + popupWidth) > evt.layerPoint.x) ? 1 : -1;
        var x = (xSign == 1) ? (evt.layerPoint.x + L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS + L.VectorTileLayer.CALLOUT_LINE_LENGTH) : (evt.layerPoint.x - L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS - L.VectorTileLayer.CALLOUT_LINE_LENGTH - popupWidth);
        var y = (evt.layerPoint.y - popupHeight / 2);
        L.DomUtil.setPosition(this._map.popup, L.point(x, y)); //position of the popup
        //create the circle
        this._map.popup.circle = L.circleMarker(evt.latlng, {
            radius: L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS,
            color: "white",
            weight: 1.5,
            fillOpacity: 0,
        }).addTo(this._map);
        //create the line
        var p1 = evt.containerPoint;
        var linePoints = [
            [p1.x + (xSign * (L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS)), p1.y],
            [p1.x + (xSign * (L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS + L.VectorTileLayer.CALLOUT_LINE_LENGTH)), p1.y]
        ];
        var latlngs = [];
        for (const point of linePoints) {
            latlngs.push(this._map.containerPointToLatLng(point));
        }
        this._map.popup.polyline = L.polyline(latlngs, {
            color: 'white',
            weight: 1.5,
        }).addTo(this._map);
    },
    removePopup: function(evt) {
        var map = (this instanceof L.Map) ? this : this._map;
        L.DomUtil.remove(map.popup);
        map.popup.circle.remove();
        map.popup.polyline.remove();
    },
    getPopupText: function(evt) {
        var text = "";
        var properties = [];
        var propertyNames = [];
        var omitProps = ["sort_rank", "kind_detail", "id:right", "id:left", "source", "min_zoom", "id", "osm_relation", "area", "tier", "boundary", "ISO3"]; //exclude the following properties from appearing - these are Mapzen specific
        //add the kind property if it has been passed in as an option in the constructor
        if (this.options.hasOwnProperty("kind")) {
            evt.layer.properties.kind = this.options.kind;
        }
        for (var prop in evt.layer.properties) { //iterate through the properties of the OSM feature and populate the properties that are valid and that we want to show
            if (omitProps.indexOf(prop) == -1) { //omit certain system properties
                if (evt.layer.properties[prop]) { //check there is a value
                    if (typeof(evt.layer.properties[prop]) == "string") { //check the value is a string
                        if (Object.values(properties).indexOf(evt.layer.properties[prop]) == -1) { //check that we havent already got the value
                            properties[prop] = evt.layer.properties[prop];
                            propertyNames.push(prop);
                        }
                    }
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
            value = value.replace("_", " "); //replace any underscores
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
                    value = value.substr(0, 1).toUpperCase() + value.substr(1); //Sentence case
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
    }
});
L.vectorTileLayer = function(url, tileoptions, options) {
    return new L.VectorTileLayer(url, tileoptions, options);
};

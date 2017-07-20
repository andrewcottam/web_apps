/*global L*/
L.VectorTileLayer = L.VectorGrid.Protobuf.extend({
    statics: {
        CALLOUT_CIRCLE_RADIUS: 7,
        CALLOUT_LINE_LENGTH: 50,
    },
    defaultOptions: {
        continuous: true,
        callOut: false,
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
    },
    onRemove: function(map) {

    },
    showPopup: function(evt) {
        //show the callout
        // this.setFeatureStyle(evt.layer.properties.class, {
        // 	stroke: "#ffffff",
        // 		fill: "#ffffff",
        // });
        if (this._map.popup) {
            this.removePopup(evt);
        }
        this._map.popup = L.DomUtil.create("div", "popup"); //create the popup
        this._map.getPanes().overlayPane.appendChild(this._map.popup); //append it to the overlay pane
        this._map.popup.circle = L.circleMarker(evt.latlng, {
            radius: L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS,
            color: "white",
            weight: 1.5,
            fillOpacity: 0,
        });
        var p1 = evt.containerPoint;
        var linePoints = [
            [p1.x - L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS, p1.y],
            [p1.x - L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS - L.VectorTileLayer.CALLOUT_LINE_LENGTH, p1.y]
        ];
        if (this.options.callOut) {
            linePoints.push([p1.x - L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS - L.VectorTileLayer.CALLOUT_LINE_LENGTH, p1.y - L.VectorTileLayer.CALLOUT_LINE_LENGTH]);
        }
        var latlngs = [];
        for (const point of linePoints) {
            latlngs.push(this._map.containerPointToLatLng(point));
        }
        this._map.popup.circle.addTo(this._map);
        this._map.popup.polyline = L.polyline(latlngs, {
            color: 'white',
            weight: 1.5,
        }).addTo(this._map);
        //show the properties in the popup
        var text = "";
        var values = [];
        var omitProps = ["sort_rank", "kind_detail", "id:right", "id:left", "source", "min_zoom", "id", "osm_relation", "area", "tier", "boundary"]; //exclude the following properties from appearing - these are Mapzen specific
        for (var prop in evt.layer.properties) { //iterate through the properties of the OSM feature and populate the popup box with the values
            if (omitProps.indexOf(prop) == -1) { //omit certain system properties
                if (evt.layer.properties[prop]) { //check there is a value
                    if (typeof(evt.layer.properties[prop]) == "string") { //check the value is a string
                        var _class;
                        var value = evt.layer.properties[prop]; //get the value
                        if (values.indexOf(value) == -1) { //if the value doesnt already exist
                            values.push(value); //add it to the list
                            value = value.replace("_", " ");
                            if (prop == "kind") {
                                _class = " class='kind'";
                            }
                            else {
                                _class = " class='attr'";
                                value = value.substr(0, 1).toUpperCase() + value.substr(1); //Sentence case
                            }
                            text += "<div" + _class + ">" + value + "</div>"; //write the html text with the new value in
                        }
                    }
                }
            }
        }
        this._map.popup.innerHTML = text; //set the html of the popup
        var popupWidth = Number(L.DomUtil.getStyle(this._map.popup, "width").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-left").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-right").replace("px", ""));
        var popupHeight = Number(L.DomUtil.getStyle(this._map.popup, "height").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-top").replace("px", "")) + Number(L.DomUtil.getStyle(this._map.popup, "padding-bottom").replace("px", ""));
        var widthOffset = (this.options.callOut) ? popupWidth / 2 : popupWidth;
        var heightOffset = (this.options.callOut) ? (popupHeight + L.VectorTileLayer.CALLOUT_LINE_LENGTH) : popupHeight / 2;
        var x = evt.layerPoint.x - L.VectorTileLayer.CALLOUT_CIRCLE_RADIUS - L.VectorTileLayer.CALLOUT_LINE_LENGTH - widthOffset; //get the x position of the popup
        var y = evt.layerPoint.y - heightOffset; //get the y position of the popup
        L.DomUtil.setPosition(this._map.popup, L.point(x, y)); //position of the popup
    },
    removePopup: function(evt) {
        var map = (this instanceof L.Map) ? this : this._map;
        L.DomUtil.remove(map.popup);
        map.popup.circle.remove();
        map.popup.polyline.remove();
    },
});
L.vectorTileLayer = function(url, tileoptions, options) {
    return new L.VectorTileLayer(url, tileoptions, options);
};

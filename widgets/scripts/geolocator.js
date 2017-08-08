/*global L*/
L.Control.Geolocator = L.Control.extend({
    onAdd: function(map) {
        var div = L.DomUtil.create('div', 'geolocator');
        div.innerHTML = "<input id='geosearch' value='Enter search term'></input>";
        L.DomEvent.on(div, "click", function(evt) {
            div.innerHTML = "<input id='geosearch'></input>";
            document.getElementById("geosearch").focus();
        });
        L.DomEvent.on(div, "keypress", function(evt) {
            if (evt.key == "Enter") {
                console.log(document.getElementById("geosearch").value);
            }
        });
        return div;
    },
    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.geolocator = function(opts) {
    return new L.Control.Geolocator(opts);
}

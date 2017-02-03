require(["dojo/dom", "dojo/domReady!"],
    function(dom) {
        var mapboxToken = "pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg";
        var map = L.map('map');
        var layer = Tangram.leafletLayer({
            scene: 'sceneFiles/scene.yaml',
            events: {
                click: function(selection) {
                    clicked(selection);
                },
            },
            attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
        });
        layer.addTo(map);
        map.setView([1.6921, 15.0144], 14);
    });

function clicked(event) {
    if (event.feature) {
        if (event.feature.properties) {
            console.log(event.feature.properties);
        }
    }
}

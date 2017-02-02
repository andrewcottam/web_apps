require(["dojo/dom", "dojo/domReady!"],
    function(dom) {
        var map = L.map('map');
        var layer = Tangram.leafletLayer({
            scene: 'sceneFiles/bern.yaml',
            events: {
                click: function(selection) {
                    clicked(selection);
                },
            },
        });
        layer.addTo(map);
        map.setView([47, 7.5], 12);
    });

function clicked(event) {
    if (event.feature) {
        if (event.feature.properties) {
            console.log(event.feature.properties);
        }
    }
}

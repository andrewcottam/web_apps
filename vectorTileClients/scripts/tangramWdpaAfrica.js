var layer;
require(["dojo/dom", "dojo/domReady!"],
    function(dom) {
        var map = L.map('map');
        layer = Tangram.leafletLayer({
            scene: 'sceneFiles/tangramWdpaAfrica.yaml',
            events: {
                hover: function(selection) {
                    hovered(selection);
                },
                click: function(selection) {
                    clicked(selection);
                },
            },
        });
        layer.addTo(map);
        // map.setView([47, 7.5], 12); //bern
        // map.setView([-2.079, 21.36], 12); //salonga
        map.setView([-1.14, 15.51], 4); //congo
    });

function clicked(event) {
    layer.scene.config.layers.protected_areas.draw.polygons.color = "blue";
    layer.scene.updateConfig();
    if (event.feature) {
        if (event.feature.properties) {
            console.log(event.feature.properties);
        }
    }
}

function hovered(event) {
    if (event.feature) {
        if (event.feature.properties) {
            console.log(event.feature.properties);

        }
    }
}

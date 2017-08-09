var FILL_OPACITY = 0.2;
var OPACITY = 0.4;
var vectorTileStyling = {
    water: {
        fill: true,
        weight: 1,
        fillColor: '#06cccc',
        color: '#06cccc',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY,
    },
    boundaries: function(properties, zoom) {
        var style;
        switch (properties.kind_detail) {
            case 8:
                style = {
                    weight: 100,
                    fillColor: 'pink',
                    color: 'pink',
                    fillOpacity: FILL_OPACITY,
                    opacity: OPACITY
                };
                break;
            default:
                style = {
                    weight: 1,
                    fillColor: 'pink',
                    color: 'pink',
                    fillOpacity: FILL_OPACITY,
                    opacity: OPACITY
                };
                break;
        }
        return style;
    },
    waterway: {
        weight: 1,
        fillColor: '#2375e0',
        color: '#2375e0',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    landcover: {
        fill: true,
        weight: 1,
        fillColor: '#53e033',
        color: '#53e033',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY,
    },
    landuse: {
        fill: true,
        weight: 1,
        fillColor: '#e5b404',
        color: '#e5b404',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    // landuse_overlay: function(properties, zoom) { //mapbox
    //     var style;
    //     switch (properties.class) {
    //         case "wetland":
    //             style = {
    //                 fill: true,
    //                 weight: 1,
    //                 fillColor: '#06cccc',
    //                 color: '#06cccc',
    //                 fillOpacity: FILL_OPACITY,
    //                 opacity: OPACITY,
    //             };
    //             break;
    //         default:
    //             break;
    //     }
    // },
    landuse_overlay: {
        fill: true,
        weight: 1,
        fillColor: '#06cccc',
        color: '#06cccc',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY,
    },
    park: {
        fill: true,
        weight: 1,
        fillColor: '#84ea5b',
        color: '#84ea5b',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    boundary: {
        weight: 1,
        fillColor: '#c545d3',
        color: '#c545d3',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    aeroway: {
        weight: 1,
        fillColor: '#51aeb5',
        color: '#51aeb5',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    roads: function(properties, zoom) {
        var style;
        switch (properties.kind) {
            case "major_road":
                style = {
                    weight: 1,
                    fillColor: '#f2b648',
                    color: '#f2b648',
                    fillOpacity: FILL_OPACITY,
                    opacity: OPACITY,
                };
                break;
            default:
                style = {
                    weight: 1,
                    fillColor: '#f2b648',
                    color: '#f2b648',
                    fillOpacity: FILL_OPACITY,
                    opacity: OPACITY,
                };
                break;
        }
        return style;
    },
    road: function(properties, zoom) { //mapbox
        var style;
        switch (properties.kind) {
            case "major_road":
                style = {
                    weight: 1,
                    fillColor: '#f2b648',
                    color: '#f2b648',
                    fillOpacity: FILL_OPACITY,
                    opacity: OPACITY,
                };
                break;
            default:
                style = {
                    weight: 1,
                    fillColor: '#f2b648',
                    color: '#f2b648',
                    fillOpacity: FILL_OPACITY,
                    opacity: OPACITY,
                };
                break;
        }
        return style;
    },
    primary: { //mapbox
        weight: 1,
        fillColor: '#f2b648',
        color: '#f2b648',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY,
    },
    tunnel: { // mapbox only
        weight: 0.5,
        fillColor: '#f2b648',
        color: '#f2b648',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY,
        // 					dashArray: [4, 4]
    },
    bridge: { // mapbox only
        weight: 0.5,
        fillColor: '#f2b648',
        color: '#f2b648',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY,
        // 					dashArray: [4, 4]
    },
    transportation: { // openmaptiles only
        weight: 0.5,
        fillColor: '#f2b648',
        color: '#f2b648',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY,
        // 					dashArray: [4, 4]
    },
    transit: { // mapzen only
        weight: 0.5,
        fillColor: '#f2b648',
        color: '#f2b648',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY,
        // 					dashArray: [4, 4]
    },
    building: {
        fill: true,
        weight: 1,
        fillColor: '#2b2b2b',
        color: '#2b2b2b',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    water_name: {
        weight: 1,
        fillColor: '#022c5b',
        color: '#022c5b',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    transportation_name: {
        weight: 1,
        fillColor: '#bc6b38',
        color: '#bc6b38',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    place: {
        weight: 1,
        fillColor: '#f20e93',
        color: '#f20e93',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    housenumber: {
        weight: 1,
        fillColor: '#ef4c8b',
        color: '#ef4c8b',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    poi: {
        weight: 1,
        fillColor: '#3bb50a',
        color: '#3bb50a',
        fillOpacity: FILL_OPACITY,
        opacity: OPACITY
    },
    earth: [], //added by ac on 14/7/17 so that mouse over events can occur under this layer - this turns it off

    // Do not symbolize some stuff for mapbox
    country_label: [],
    marine_label: [],
    state_label: [],
    place_label: [],
    waterway_label: [],
    poi_label: [],
    road_label: [],
    housenum_label: [],


    // Do not symbolize some stuff for openmaptiles
    country_name: [],
    marine_name: [],
    state_name: [],
    place_name: [],
    waterway_name: [],
    poi_name: [],
    road_name: [],
    housenum_name: [],
};

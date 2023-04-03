import React, { useEffect, useState } from "react";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import Point from "@arcgis/core/geometry/Point.js";

//converts an hue/saturation/value value into red/green/blue
// input: h in [0,360] and s,v in [0,1] - output: r,g,b in [0,1]
// function hsv2rgb(h, s, v) {
//     let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
//     return [f(5) * 255, f(3) * 255, f(1) * 255];
// }

export default function TreeLayer(props) {

    //filters all graphics by the area and score
    function filterTrees(features, minArea, maxArea, minScore, maxScore) {
        // get the ids of the features that are within the range
        const filtered_features = features.filter(feature => {
            const p = feature.properties;
            return (p['area'] >= minArea && p['area'] <= maxArea && p['score'] >= minScore && p['score'] <= maxScore);
        });
        //get the feature ids to filter on
        const ids = filtered_features.map(feature => feature.properties.id);
        //iterate through the layers and set visible to true if the graphic ids are in the ids array
        var visibility;
        sub_layers.forEach(layer => {
            //iterate through the graphics
            layer.graphics.forEach(graphic => {
                visibility = (ids.includes(graphic.id)) ? true : false;
                //set the visibility on the graphic
                graphic.visible = visibility;
            });
        });
    }

    //creates a polygon geometry from the coordinates
    function createPolygon(coordinates) {
        const polygon = { type: "polygon", rings: coordinates };
        return new Polygon(polygon);
    }

    //creates a polygon graphic from the coordinates with the passed color, outline transparency, fill transparency and width
    function createPolygonGraphic(feature, coordinates, color, outline_transparency, fill_transparency, width) {
        //create the outline color for the graphic
        const outline_color = color.concat([outline_transparency]);
        //create the fill color for the graphic
        const fill_color = color.concat([fill_transparency]);
        //create the fill symbol
        const fillSymbol = { type: "simple-fill", color: fill_color, outline: { color: outline_color, width: width } };
        //create the polygon from the features geometry
        const polygon = createPolygon(coordinates);
        //create the graphic from the polygon
        const graphic = new Graphic({ id: feature.properties.id, geometry: polygon, symbol: fillSymbol });
        return graphic;
    }

    //creates the mask graphic
    function createMaskGraphic(feature, color) {
        //create the graphic for the polygon with an outline transparency of 0.5, a fill transparency of 0.4 and a width of 0.5
        const graphic = createPolygonGraphic(feature, feature.geometry.coordinates, color, 0.5, 0.3, 0.5);
        return graphic;
    }

    //creates the bounding box graphic
    function createBoundingBoxGraphic(feature, color) {
        //get the polygon
        const polygon = createPolygon(feature.geometry.coordinates);
        //get the bounding box coordinates
        const extent = polygon.extent;
        const bbox = [[extent.xmin, extent.ymin], [extent.xmin, extent.ymax], [extent.xmax, extent.ymax], [extent.xmax, extent.ymin], [extent.xmin, extent.ymin]];
        //create the graphic for the bounding box with an outline transparency of 0.5, a fill transparency of 0 and a width of 2
        const graphic = createPolygonGraphic(feature, bbox, color, 0.5, 0, 2);
        return graphic;
    }

    //creates graphic with a label
    function createTextGraphic(feature, bbox, color, text, position) {
        //get the extent of the bounding box
        const extent = bbox.geometry.extent;
        var point, xoffset, yoffset;
        switch (position) {
            case 'ul':
                //get a point at the top left
                point = new Point({ type: "point", latitude: extent.ymax, longitude: extent.xmin });
                xoffset = 9;
                yoffset = -7;
                break;
            case 'ur':
                //get a point at the top right
                point = new Point({ type: "point", latitude: extent.ymax, longitude: extent.xmax });
                xoffset = -14;
                yoffset = -7;
                break;
            case 'll':
                break;
            case 'lr':
                break;
            default:
            // code
        }
        let textSymbol = { type: "text", color: color, haloColor: "black", haloSize: "4px", text: text, xoffset: xoffset, yoffset: yoffset, font: { size: 8 } };
        const graphic = new Graphic({ id: feature.properties.id, geometry: point, symbol: textSymbol });
        return graphic;
    }

    //creates the graphics from the feature and adds them to the map graphics layer
    function createAllGraphics(feature) {
        //get the color from the passed color, e.g. '0,255,128' -> [0,255,128]
        var color = feature.properties.color.split(',');
        //create the mask graphic
        const mask = createMaskGraphic(feature, color);
        //add the mask to the masks graphics layer
        masks_layer.add(mask);
        //create the bounding box graphic
        const bbox = createBoundingBoxGraphic(feature, color);
        //add the bounding box to the boxes graphics layer
        boxes_layer.add(bbox);
        //create the score graphic
        color = [255, 255, 255];
        const score = createTextGraphic(feature, bbox, color, parseFloat(feature.properties.score.toFixed(2)) + "%", 'ul');
        //add the score to the scores graphics layer
        scores_layer.add(score);
        //create the area graphic
        const area = createTextGraphic(feature, bbox, color, parseInt(feature.properties.area, 10) + "m2", 'ur');
        //add the score to the scores graphics layer
        areas_layer.add(area);
    }

    //adds all the features as graphics to the map
    function createTreeGraphics(features) {
        features.forEach(feature => {
            if (feature.hasOwnProperty('geometry') && (!trees_created.includes(feature.properties.id))) {
                // create the tree graphics
                createAllGraphics(feature);
                // append the tree id to the trees_created array
                trees_created.push(feature.properties.id)
                setTrees_created(trees_created);
            }
        });
    }

    //removes all the graphics
    function removeTreeGraphics() {
        //iterate through the sub-layers and remove the graphics
        if (sub_layers) sub_layers.forEach(layer => { layer.removeAll() });
    }

    function createLayers(props) {
        // create a new graphics layer to add the tree crown masks onto
        const _masks_layer = new GraphicsLayer({ visible: false });
        const _boxes_layer = new GraphicsLayer({ visible: false });
        const _scores_layer = new GraphicsLayer({ visible: false });
        const _areas_layer = new GraphicsLayer({ visible: false });
        // create a convenience group of layers
        const _sub_lyrs = [_masks_layer, _boxes_layer, _scores_layer, _areas_layer];
        // add the layers to the map
        props.map.addMany(_sub_lyrs);
        // set the local state
        setMasks_layer(_masks_layer);
        setBoxes_layer(_boxes_layer);
        setScores_layer(_scores_layer);
        setAreas_layer(_areas_layer);
        setSub_layers(_sub_lyrs);
    }

    function setLayerVisibility(props) {
        // set the visibility of all layers
        sub_layers.forEach(layer => {
            layer.visible = props.visible;
        });
        // set the visibility for each layer
        boxes_layer.visible = props.show_boxes && props.visible;
        masks_layer.visible = props.show_masks && props.visible;
        scores_layer.visible = props.show_scores && props.visible;
        areas_layer.visible = props.show_areas && props.visible;
    }

    //local state
    const [sub_layers, setSub_layers] = useState(null);
    const [masks_layer, setMasks_layer] = useState(null);
    const [boxes_layer, setBoxes_layer] = useState(null);
    const [scores_layer, setScores_layer] = useState(null);
    const [areas_layer, setAreas_layer] = useState(null);
    const [trees_created, setTrees_created] = useState([]);

    useEffect(() => {
        // create the layers if they dont already exist
        if (props.map && !sub_layers) createLayers(props);
        if (props.feature_collection) {
            const trees = props.feature_collection.features;
            // create the graphics for all of the trees
            createTreeGraphics(trees);
            // set the visibility of layers
            setLayerVisibility(props);
            // filter the trees by area and score
            filterTrees(trees, props.area_range_value[0], props.area_range_value[1], props.score_range_value[0], props.score_range_value[1]);
        } else {
            // remove all the trees
            removeTreeGraphics();
            // reinitialise the trees_created array
            setTrees_created([]);
        }
    }, [props.map, props.feature_collection, props.visible, props.show_masks, props.show_boxes, props.show_scores, props.show_areas, props.area_range_value, props.score_range_value]);

    return <div></div>;

}

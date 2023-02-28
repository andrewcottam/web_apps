import React, { Component } from 'react';
import { loadModules } from 'esri-loader';

//converts an hue/saturation/value value into red/green/blue
// input: h in [0,360] and s,v in [0,1] - output: r,g,b in [0,1]
// function hsv2rgb(h, s, v) {
//     let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
//     return [f(5) * 255, f(3) * 255, f(1) * 255];
// }

class GeojsonLayer extends Component {
    constructor(props) {
        super(props);
        this.state = { feature_collection: null };
    }

    componentDidUpdate(prevProps) {
        //once the map has loaded, create an instance of the graphics layer and add it to the map
        if (this.props.map && !this.masks_layer) {
            //load the ESRI javascript libraries
            loadModules(["esri/layers/GraphicsLayer", 'esri/Graphic', "esri/geometry/Polygon", "esri/geometry/Point"]).then(([GraphicsLayer, Graphic, Polygon, Point]) => {
                //create a new graphics layer to add the tree crown masks onto
                this.masks_layer = new GraphicsLayer({visible: false });
                //create a new graphics layer to add the tree crown bounding boxes onto
                this.boxes_layer = new GraphicsLayer({visible: false });
                //create a new graphics layer to add the tree crown scores onto
                this.scores_layer = new GraphicsLayer({visible: false });
                //create a new graphics layer to add the tree crown areas onto
                this.areas_layer = new GraphicsLayer({visible: false });
                //create a convenience group of layers
                this.sub_layers = [this.masks_layer, this.boxes_layer, this.scores_layer, this.areas_layer];
                //add the layers to the map
                this.props.map.addMany(this.sub_layers);
                //save a reference to the Graphic constructor
                this.Graphic = Graphic;
                //save a reference to the Polygon constructor
                this.Polygon = Polygon;
                //save a reference to the Point constructor
                this.Point = Point;
            });
        }
        //if the react components visible property has changed, update each of the sub-layers visible property
        if (this.props.visible !== prevProps.visible) {
            this.sub_layers.forEach(layer => {layer.visible = this.props.visible});
            if (this.props.visible){
                //move the layers to the top - depending on when each class loaded, the graphics layer may not be at the top
                this.props.map.reorder(this.masks_layer, this.props.view.allLayerViews.length - 1);
                this.props.map.reorder(this.boxes_layer, this.props.view.allLayerViews.length - 1);
                this.props.map.reorder(this.scores_layer, this.props.view.allLayerViews.length - 1);
                this.props.map.reorder(this.areas_layer, this.props.view.allLayerViews.length - 1);
            }
        }
        //filter by layer - look for changes in visibility of the box, mask, score or area individual layers
        if (this.props.show_boxes !== prevProps.show_boxes) this.boxes_layer.visible = this.props.show_boxes;
        if (this.props.show_masks !== prevProps.show_masks) this.masks_layer.visible = this.props.show_masks;
        if (this.props.show_scores !== prevProps.show_scores) this.scores_layer.visible = this.props.show_scores;
        if (this.props.show_areas !== prevProps.show_areas) this.areas_layer.visible = this.props.show_areas;
        //filter the features by area if the value has changed
        if (this.props.area_range_value !== prevProps.area_range_value) {
            //filter the graphics using area values
            this.filter(this.features, 'area', this.props.area_range_value[0], this.props.area_range_value[1]);
        }
        //filter the features by score if the value has changed
        if (this.props.score_range_value !== prevProps.score_range_value) {
            //filter the graphics using score values
            this.filter(this.features, 'score', this.props.score_range_value[0], this.props.score_range_value[1]);
        }
    }

    //filters all graphics by the features property
    filter(features, feature_property, min, max){
        // get the ids of the features that are within the range
        const filtered_features = features.filter(feature => {
            return (feature.properties[feature_property] >= min && feature.properties[feature_property] <= max);
        });
        //get the feature ids to filter on
        const ids = filtered_features.map(feature => feature.properties.id);
        //iterate through the layers and set visible to true if the graphic ids are in the ids array
        var visibility;
        this.sub_layers.forEach(layer => {
            //iterate through the graphics
            layer.graphics.forEach(graphic => {
                visibility = (ids.includes(graphic.id)) ? true : false;
                //set the visibility on the graphic
                graphic.visible = visibility;
            });
        });
    }
    
    //creates a polygon geometry from the coordinates
    createPolygon(coordinates) {
        const polygon = { type: "polygon", rings: coordinates };
        return new this.Polygon(polygon);
    }

    //creates a polygon graphic from the coordinates with the passed color, outline transparency, fill transparency and width
    createPolygonGraphic(feature, coordinates, color, outline_transparency, fill_transparency, width) {
        //create the outline color for the graphic
        const outline_color = color.concat([outline_transparency]);
        //create the fill color for the graphic
        const fill_color = color.concat([fill_transparency]);
        //create the fill symbol
        const fillSymbol = { type: "simple-fill", color: fill_color, outline: { color: outline_color, width: width } };
        //create the polygon from the features geometry
        const polygon = this.createPolygon(coordinates);
        //create the graphic from the polygon
        const graphic = new this.Graphic({id: feature.properties.id, geometry: polygon, symbol: fillSymbol });
        return graphic;
    }

    //creates the mask graphic
    createMaskGraphic(feature, color) {
        //create the graphic for the polygon with an outline transparency of 0.5, a fill transparency of 0.4 and a width of 0.5
        const graphic = this.createPolygonGraphic(feature, feature.geometry.coordinates, color, 0.5, 0.3, 0.5);
        return graphic;
    }

    //creates the bounding box graphic
    createBoundingBoxGraphic(feature, color) {
        //get the polygon
        const polygon = this.createPolygon(feature.geometry.coordinates);
        //get the bounding box coordinates
        const extent = polygon.extent;
        const bbox = [[extent.xmin, extent.ymin],[extent.xmin, extent.ymax],[extent.xmax, extent.ymax],[extent.xmax, extent.ymin],[extent.xmin, extent.ymin]];
        //create the graphic for the bounding box with an outline transparency of 0.5, a fill transparency of 0 and a width of 2
        const graphic = this.createPolygonGraphic(feature, bbox, color, 0.5, 0, 2);
        return graphic;
    }

    //creates graphic with a label
    createTextGraphic(feature, bbox, color, text, position) {
        //get the extent of the bounding box
        const extent = bbox.geometry.extent;
        var point, xoffset, yoffset;
        switch (position) {
            case 'ul':
                //get a point at the top left
                point = new this.Point({ type: "point", latitude: extent.ymax, longitude: extent.xmin });
                xoffset = 9;
                yoffset = -7;
                break;
            case 'ur':
                //get a point at the top right
                point = new this.Point({ type: "point", latitude: extent.ymax, longitude: extent.xmax });
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
        const graphic = new this.Graphic({id: feature.properties.id, geometry: point, symbol: textSymbol });
        return graphic;
    }

    //creates the graphics from the feature and adds them to the map graphics layer
    createAllGraphics(feature) {
        //get the color from the passed color, e.g. '0,255,128' -> [0,255,128]
        var color = feature.properties.color.split(',');
        //create the mask graphic
        const mask = this.createMaskGraphic(feature, color);
        //add the mask to the masks graphics layer
        this.masks_layer.add(mask);
        //create the bounding box graphic
        const bbox = this.createBoundingBoxGraphic(feature, color);
        //add the bounding box to the boxes graphics layer
        this.boxes_layer.add(bbox);
        //create the score graphic
        color = [255,255,255];
        const score = this.createTextGraphic(feature, bbox, color, parseFloat(feature.properties.score.toFixed(2)) + "%", 'ul');
        //add the score to the scores graphics layer
        this.scores_layer.add(score);
        //create the area graphic
        const area = this.createTextGraphic(feature, bbox, color, parseInt(feature.properties.area, 10) + "m2", 'ur');
        //add the score to the scores graphics layer
        this.areas_layer.add(area);
    }

    //adds all the features as graphics to the map
    addFeaturesAsGraphics(features) {
        //set a local pointer to the features
        this.features = features;
        if (!this.already_rendered){
            //iterate through the features and create all the graphics for each one
            features.forEach(feature => {
                this.createAllGraphics(feature);
            });
            this.already_rendered = true;
        }
    }

    //removes all the graphics
    removeAllGraphics() {
        //iterate through the sub-layers and remove the graphics
        if (this.sub_layers) this.sub_layers.forEach(layer => {layer.removeAll()});
        this.already_rendered = false;
    }

    render() {
        const fc = this.props.feature_collection;
        //if there are no features but there are graphics then we need to clear the graphics
        if (!fc || (fc && fc.length === 0)) this.removeAllGraphics();
        //if there are features with geometries then add them as graphics
        if (fc && fc.features && fc.features.length > 0 && fc.features[0].hasOwnProperty('geometry') && this.Graphic) this.addFeaturesAsGraphics(fc.features);
        return (
            <div/>
        );
    }
}

export default GeojsonLayer;

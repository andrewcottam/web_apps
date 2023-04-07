import React, { useEffect, useState } from "react";
// esri components
import { when } from '@arcgis/core/core/reactiveUtils';
import WebTileLayer from "@arcgis/core/layers/WebTileLayer.js";

export default function WMTSLayer(props) {

    const wmtsLayer = WebTileLayer.createSubclass({

        //override the constructor to add custom behavior
        constructor: function (props) {
            // when the view is stationary
            when(() => props.view.stationary === true, () => {
                // map has stopped moving - clear the canvas
                if (this.visible) this._canvas_set(undefined);
                // when the layer has finished updating (i.e. all the tiles loaded)
                this.updating_handler = when(() => props.view.updating === false, () => {
                    //only render the canvas if the layer is visible
                    if (this.visible) this.render_canvas();
                });
            });
            //wire up an event handler that invalidates the canvas when the view extent changes and stops listening for network calls
            when(() => props.view.stationary === false, () => {
                if (this.updating_handler) this.updating_handler.remove();
            });
        },

        // render the individual tiles onto the canvas
        render_canvas: function () {
            // take a screenshot of the canvas
            this.view.takeScreenshot({ layers: [this] }).then(data => {
                //check the layer has finished loading the tile data
                const alpha = data.data.data[3];
                if (alpha !== 255) console.error("The tiled layer has not loaded properly before being sent for TCD. Results may be affected. Alpha value of " + alpha);
                // paint the image data onto the canvas
                const w = data.data.width;
                const h = data.data.height;
                this.canvas = document.createElement("canvas");
                this.canvas.width = w;
                this.canvas.height = h;
                this.context = this.canvas.getContext("2d");
                this.context.putImageData(data.data, 0, 0);
                // raise the state to pass the canvas to the client
                this._canvas_set()
            });
        },

        // when the canvas has been set, lift the state up to clients that use the image data
        _canvas_set() {
            if (this.canvas_set) this.canvas_set(this.canvas);
        },

        //returns the image data from the canvas context
        fetchImageDataFromCache: function () {
            if (this.context) return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        },

        //converts the colour image that is currently on the canvas to a black and white one
        imageToBlackAndWhite: function () {
            this.get_black_and_white_image = true;
            const imgData = this.fetchImageDataFromCache();
            for (var y = 0; y < this.canvas.height; y++) {
                for (var x = 0; x < this.canvas.width; x++) {
                    var i = (y * 4) * this.canvas.width + x * 4;
                    var avg = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
                    imgData.data[i] = avg;
                    imgData.data[i + 1] = avg;
                    imgData.data[i + 2] = avg;
                }
            }
            this.context.putImageData(imgData, 0, 0);
            //call the fetchImage to refresh the canvas with the new black and white image
            this.refresh();
        },

    });

    function createLayer(props) {
        const lyr = new wmtsLayer({
            urlTemplate: props.urlTemplate,
            view: props.view,
            canvas_set: props.canvas_set,
            visible: true,
            copyright: props.copyright,
        });
        // get the index of the first graphics layer - we will add the WMTSLayer underneath it
        const graphics_layer_index = props.view.allLayerViews.findIndex(l => l.declaredClass === 'esri.views.2d.layers.GraphicsLayerView2D');
        // add the layer underneath any graphic layers
        props.map.add(lyr, graphics_layer_index - 1);
        setLayer(lyr);
    }

    const [layer, setLayer] = useState(null);

    useEffect(() => {
        if (props.map && !layer && props.urlTemplate) createLayer(props);
        if (layer && props.b_and_w) layer.imageToBlackAndWhite();
        if (layer) layer.urlTemplate = props.urlTemplate;
        if (layer) layer.visible = props.visible;
    }, [props.map, props.visible, props.urlTemplate, props.b_and_w]);

    return <div></div>;

}
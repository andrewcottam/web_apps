import React, { useEffect, useState } from "react";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer.js";
import { when } from '@arcgis/core/core/reactiveUtils';

export default function WMTSLayer(props) {

    const wmtsLayer = WebTileLayer.createSubclass({

        //override the constructor to add custom behavior
        constructor: function (props) {
            // when the view is stationary
            when(() => props.view.stationary === true, () => {
                // map has stopped moving - clear the blob 
                if (this.visible) this.set_blob(undefined);
                // when the layer has finished updating (i.e. all the tiles loaded)
                this.updating_handler = when(() => props.view.updating === false, () => {
                    //only fire the tiles loaded if the layer is visible
                    if (this.visible) if (!this.blob) this.create_blob();
                });
            });
            //wire up an event handler that invalidates the blob when the view extent changes and stops listening for network calls
            when(() => props.view.stationary === false, () => {
                if (this.updating_handler) this.updating_handler.remove();
            });
        },

        //converts the canvas image data to a blob suitable for sending to the server for tcd
        create_blob: function () {
            //take a screenshot of the canvas
            this.view.takeScreenshot({ layers: [this] }).then(data => {
                //check the layer has finished loading the tile data
                const alpha = data.data.data[3];
                if (alpha !== 255) console.error("The tiled layer has not loaded properly before being sent for TCD. Results may be affected. Alpha value of " + alpha);
                //convert the ImageData into a Blob by using a canvas object
                const w = data.data.width;
                const h = data.data.height;
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.putImageData(data.data, 0, 0);
                //get the blob
                canvas.toBlob(blob => {
                    this.set_blob(blob);
                });
            });
        },

        //save the image data as a blob suitable for sending to the server for tcd
        set_blob(blob) {
            this.blob = blob;
            //call the blob_set method - this is a hook for clients to get the value of the blob
            if (this.blob_set) this.blob_set(blob);
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
            this.canvas.getContext("2d").putImageData(imgData, 0, 0);
            //call the fetchImage to refresh the canvas with the new black and white image
            this.refresh();
        },

    });

    function createLayer(props) {
        const lyr = new wmtsLayer({
            urlTemplate: props.urlTemplate,
            view: props.view,
            blob_set: props.blob_set,
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
        if (layer) layer.urlTemplate = props.urlTemplate;
        if (layer) layer.visible = props.visible;
    }, [props.map, props.visible, props.urlTemplate]);

    return <div></div>;

}
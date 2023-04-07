import React, { useEffect, useState } from "react";
// esri components
import esriRequest from "@arcgis/core/request";
import { when } from '@arcgis/core/core/reactiveUtils';
import BaseDynamicLayer from "@arcgis/core/layers/BaseDynamicLayer.js";

export default function GEELayer(props) {

    const geeLayer = BaseDynamicLayer.createSubclass({
        properties: {
            mapUrl: null,
            mapParameters: null
        },

        //override the constructor to add event handling
        constructor: function (props) {
            // when the view is stationary
            when(() => props.view.stationary === true, () => {
                //reset the canvas
                if (this.visible) this._canvas_set(undefined);
            });
        },

        // Override the getImageUrl() method to generate URL to an image for a given extent, width, and height.
        getImageUrl: function (extent, width, height) {
            const urlVariables = this._prepareQuery(this.mapParameters, extent, width, height);
            const queryString = this._joinUrlVariables(urlVariables);
            return this.mapUrl + "?" + queryString;
        },

        // Prepare query parameters for the URL to an image to be generated
        _prepareQuery: function (queryParameters, extent, width, height) {
            const wkid = extent.spatialReference.isWebMercator ? 3857 : extent.spatialReference.wkid;
            const replacers = { width: width, height: height, wkid: wkid, xmin: extent.xmin, xmax: extent.xmax, ymin: extent.ymin, ymax: extent.ymax };
            const urlVariables = this._replace({}, queryParameters, replacers);
            return urlVariables;
        },

        // replace the url variables with the application provided values
        _replace: (urlVariables, queryParameters, replacers) => {
            Object.keys(queryParameters).forEach((key) => {
                urlVariables[key] = Object.keys(replacers).reduce((previous, replacerKey) => {
                    return previous.replace("{" + replacerKey + "}", replacers[replacerKey]);
                },
                    queryParameters[key]
                );
            });
            return urlVariables;
        },

        // join the url parameters
        _joinUrlVariables: (urlVariables) => {
            return Object.keys(urlVariables).reduce((previous, key) => {
                return (
                    previous + (previous ? "&" : "") + key + "=" + urlVariables[key]);
            }, "");
        },

        // when the canvas has been set, lift the state up to clients that use the image data
        _canvas_set() {
            if (this.canvas_set) this.canvas_set(this.canvas);
        },

        //makes a request for an image from google earth engine using the url generated from getImageUrl
        fetchImageFromGEE: function (extent, width, height) {
            let url = this.getImageUrl(extent, width, height);
            return esriRequest(url, { responseType: "image" }).then((response) => {
                // draw the image onto the canvas - the image is an <img> html element that points to the image_url
                this.context.drawImage(response.data, 0, 0, width, height);
                // call the canvas method to indicate that the canvas has been rendered
                this._canvas_set();
                return this.canvas;
            });
        },

        //returns the image data from the canvas context
        fetchImageDataFromCache: function () {
            if (this.canvas) return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        },

        //converts the colour image that is currently on the canvas to a black and white one
        imageToBlackAndWhite: function () {
            if (this.canvas) {
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
            }
        },

        // Fetches images for given extent and size and returns the canvas
        fetchImage: function (extent, width, height) {
            //create a canvas if it doesnt already exist
            if (!this.canvas) {
                // create a canvas 
                this.canvas = document.createElement("canvas");
                this.context = this.canvas.getContext("2d");
                this.canvas.width = width;
                this.canvas.height = height;
            }
            //if we have already loaded the image from gee then the data is already on the canvas
            if (this.get_black_and_white_image) {
                return this.canvas;
            }
            else {
                //get the image from google earth engine
                return this.fetchImageFromGEE(extent, width, height);
            }
        }

    });

    function createLayer(props) {
        const lyr = new geeLayer({
            mapUrl: "https://google-earth-engine-server-ny43uciwwa-oc.a.run.app/ogc",
            mapParameters: {
                service: "WMS",
                request: "GetMap",
                format: "image/png",
                transparent: "TRUE",
                styles: "",
                version: "1.3.0",
                layers: props.layers,
                width: "{width}",
                height: "{height}",
                srs: "EPSG:{wkid}",
                bbox: "{xmin},{ymin},{xmax},{ymax}",
                bands: props.bands
            },
            view: props.view,
            canvas_set: props.canvas_set,
            visible: false,
            copyright: props.copyright
        });
        props.map.add(lyr);
        setLayer(lyr);
    }

    const [layer, setLayer] = useState(null);

    useEffect(() => {
        if (props.map && !layer) createLayer(props);
        if (layer) layer.visible = props.visible;
        if (layer && props.b_and_w) layer.imageToBlackAndWhite();
    }, [props.map, props.visible, props.b_and_w]);

    return <div></div>;
}
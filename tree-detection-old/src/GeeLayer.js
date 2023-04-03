import { Component } from 'react';
import esriConfig from "@arcgis/core/config";
import esriRequest from "@arcgis/core/request";
import BaseDynamicLayer from "@arcgis/core/layers/BaseDynamicLayer.js";
import * as watchUtils from "@arcgis/core/core/watchUtils.js";

class GeeLayer extends Component {
    componentDidUpdate(prevProps) {
        //once the map has loaded, create an instance of the geeLayer and add it to the map
        if (this.props.map && !this.layer) {
            //add the server to the trusted servers so that the credentials and cookies are passed to the server
            esriConfig.request.trustedServers.push("https://labs.restor.eco:8081");
            esriConfig.request.trustedServers.push("https://d50eafb1ad8c430796ecbee59f964ec3.vfs.cloud9.eu-central-1.amazonaws.com:8081"); //dev server
            const geeLayer = BaseDynamicLayer.createSubclass({
                properties: {
                    mapUrl: null,
                    mapParameters: null
                },

                //override the constructor to add event handling
                constructor: function (props) {
                    // when the view is stationary
                    watchUtils.whenTrue(props.view, "stationary", (e) => {
                        //reset the blob data
                        if (this.visible) this.set_blob(undefined);
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

                //save the image data as a blob suitable for sending to the server for tcd
                set_blob(blob) {
                    this.blob = blob;
                    //call the blob_set method - this is a hook for clients to get the value of the blob
                    if (this.blob_set) this.blob_set(blob);
                },

                //makes a request for an image from google earth engine using the url generated from getImageUrl
                fetchImageFromGEE: function (extent, width, height) {
                    let url = this.getImageUrl(extent, width, height);
                    return esriRequest(url, { responseType: "image" }).then((response) => {
                        //draw the image onto the canvas - the image is an <img> html element that points to the image_url
                        this.context.drawImage(response.data, 0, 0, width, height);
                        //save the image data as a blob suitable for sending to the server for tcd
                        this.canvas.toBlob(blob => {
                            this.set_blob(blob);
                        });
                        return this.canvas;
                    });
                },

                //returns the image data from the canvas context
                fetchImageDataFromCache: function () {
                    if (this.canvas) {
                        const cnx = this.canvas.getContext("2d");
                        return cnx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    }
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
                },

            });
            this.layer = new geeLayer({
                mapUrl: "https://google-earth-engine-server-ny43uciwwa-oc.a.run.app/ogc",
                mapParameters: {
                    service: "WMS",
                    request: "GetMap",
                    format: "image/png",
                    transparent: "TRUE",
                    styles: "",
                    version: "1.3.0",
                    layers: this.props.layers,
                    width: "{width}",
                    height: "{height}",
                    srs: "EPSG:{wkid}",
                    bbox: "{xmin},{ymin},{xmax},{ymax}",
                    bands: this.props.bands
                },
                view: this.props.view,
                blob_set: this.props.blob_set,
                visible: false,
                tcd_layer: true,
                copyright: this.props.copyright
            });
            this.props.map.add(this.layer);

        }
        //if the react components visible property has changed, update the layers visible property
        if (this.props.visible !== prevProps.visible) this.layer.visible = this.props.visible;
        //if the tcd has finished, show a black and white image
        // if ((this.props.detecting_tree_crowns !== prevProps.detecting_tree_crowns) && !this.props.detecting_tree_crowns) this.layer.imageToBlackAndWhite();
    }

    render() {
        return (
            <div />
        );
    }
}

export default GeeLayer;

import { Component } from 'react';
import { loadModules } from 'esri-loader';

class WaybackLayer extends Component {
    getLayer() {

    }
    componentDidUpdate(prevProps) {
        //once the map has loaded, create an instance of the layer and add it to the map
        if (this.props.map && !this.layer) {
            //load the ESRI javascript libraries
            loadModules(["esri/layers/WebTileLayer", "esri/layers/support/TileInfo", "esri/core/watchUtils"]).then(([WebTileLayer, TileInfo, watchUtils]) => {
                // create the ESRI tileInfo down to level 21
                // this.WaybackTileInfo = TileInfo.create({ scales: [591657527.591555, 295828763.7957775, 147914381.89788875, 73957190.94894437, 36978595.47447219, 18489297.737236094, 9244648.868618047, 4622324.434309023, 2311162.2171545117, 1155581.1085772559, 577790.5542886279, 288895.27714431396, 144447.63857215698, 72223.81928607849, 36111.909643039246, 18055.954821519623, 9027.977410759811, 4513.988705379906, 2256.994353, 1128.497176, 564.248588, 282.124294]});
                // create the ESRI tileInfo down to level 17
                this.WaybackTileInfo = TileInfo.create({ scales: [591657527.591555, 295828763.7957775, 147914381.89788875, 73957190.94894437, 36978595.47447219, 18489297.737236094, 9244648.868618047, 4622324.434309023, 2311162.2171545117, 1155581.1085772559, 577790.5542886279, 288895.27714431396, 144447.63857215698, 72223.81928607849, 36111.909643039246, 18055.954821519623, 9027.977410759811, 4513.988705379906]});
                this.waybackLayer = WebTileLayer.createSubclass({
                    //override the constructor to add custom attributes
                    constructor: function (props) {
                        // when the view is stationary
                        watchUtils.whenTrue(props.view, "stationary", (e) => {
                            // map has stopped moving - clear the blob 
                            if (this.visible) this.set_blob(undefined);
                            // when the layer has finished updating (i.e. all the tiles loaded)
                            this.updating_handler = watchUtils.whenFalse(props.view, "updating", (e) => {
                                //only fire the tiles loaded if the layer is visible
                                if (this.visible) if (!this.blob) this.create_blob();
                            });
                        });
                        //wire up an event handler that invalidates the blob when the view extent changes and stops listening for network calls
                        watchUtils.whenFalse(props.view, "stationary", (e) => {
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
            });
        }
        //if the react components visible property has changed, update the layers visible property
        if ((this.props.visible !== prevProps.visible) && this.layer) this.layer.visible = this.props.visible;
        //if the urlTemplate property has changed, update the urlTemplate
        if (this.props.urlTemplate !== prevProps.urlTemplate) {
            this.layer = new this.waybackLayer({
                urlTemplate: this.props.urlTemplate,
                view: this.props.view,
                blob_set: this.props.blob_set,
                visible: true,
                tcd_layer: true,
                copyright: this.props.copyright,
                id:'tcd_layer'
            });
            if (this.props.urlTemplate === 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/8249/{level}/{row}/{col}'){
                this.layer.tileInfo = this.WaybackTileInfo;                
            }
            //remove any existing tcd_layers
            let layer = this.props.map.findLayerById('tcd_layer');
            if (layer) this.props.map.remove(layer);
            //add the layer to the map
            this.props.map.add(this.layer,0);
        }
    }

    render() {
        return (
            <div />
        );
    }
}

export default WaybackLayer;

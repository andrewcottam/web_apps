import { Component } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
// import Checkbox from '@mui/material/Checkbox';
import Sync from '@mui/icons-material/Sync';
import {Map } from '@esri/react-arcgis';
import {loadModules } from 'esri-loader';
import GeojsonLayer from './GeojsonLayer.js'; // to hold the delineated tree crowns
import GeeLayer from './GeeLayer.js'; // for the imagery coming from google earth engine
import WaybackLayer from './WaybackLayer.js'; // for the imagery coming from esri wayback
import TreeCrownMetrics from './TreeCrownMetrics.js';

class UI extends Component {
    constructor(props) {
        super(props);
        // get the Cloud Run endpoint depending on which model is being specified in the queryparameter 'model'
        let url = new URL(document.URL);
        let query_params = url.searchParams;
        let revision_tag = (query_params.has('model')) ? query_params.get('model') : 'cambridge';
        this.SERVER = (document.location.hostname === 'localhost') ? "http://localhost:8081" : "https://" + revision_tag + "---tree-detection-server-ny43uciwwa-oc.a.run.app"; //gcp microservices
        this.GET_INSTANCES_IMAGE_ENDPOINT = this.SERVER + "/getInstancesImage";
        this.GET_INSTANCES_ENDPOINT = this.SERVER + "/getInstances";
        //state
        this.state = {
            image_url: null, //bound to the image html element in the ui that shows the instances image or the raw image
            detecting_tree_crowns: false, //true when waiting for the server to return the TCD results
            getting_dynamic_image: false, //true when waiting to get either an image from GEE or from a WebTile layer
            status_text: '',
            mode: 'static_image',
            show_crowns: true,
            show_boxes: true,
            show_masks: true,
            show_scores: true,
            show_areas: true,
            area_range_value: [0, 800],
            score_range_value: [0, 800],
            gee_copyright: '© 2014 WWF Aerial Survey of the Congo. WWF/NASA JPL/KfW/BMUB/BMZ',
            wms_copyright: 'Imagery from OpenAerialMap. Maxar Products. WorldView2 © 2021 Maxar Technologies.',
            // lng: 22.624934, lat: -1.781699, wms_endpoint: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/8249/{level}/{row}/{col}'
            // lng: 112.84350452926209, lat: -8.054735059174224, wms_endpoint: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/5314/{level}/{row}/{col}',
            lng: 112.84350452926209, lat: -8.054735059174224, wms_endpoint: 'https://tiles.openaerialmap.org/61b94e69b26de1000596d605/1/61b94e69b26de1000596d607/{z}/{x}/{y}' //java
        };
        //connect the map load event to set the state
        this.handleMapLoad = this.handleMapLoad.bind(this);
    }

    componentDidMount() {
        //load the ESRI javascript libraries
        loadModules(["esri/core/watchUtils", "esri/geometry/support/webMercatorUtils"]).then(([watchUtils, webMercatorUtils]) => {
            this.watchUtils = watchUtils;
            this.webMercatorUtils = webMercatorUtils;
        });
    }

    handleMapLoad(map, view) {
        this.setState({ map, view });
        this.watchUtils.whenTrue(view, "stationary", () => {
            if (view.extent) {
                this.ul = [view.extent.xmin, view.extent.ymax];
                this.lr = [view.extent.xmax, view.extent.ymin];
            }
        });
    }

    changeToGeeImage() {
        //move the map to the congo
        this.state.view.goTo({ center: [22.624934, -1.781699], zoom: 19 }).then(_ => {
            //set the state
            this.setState({ mode: 'gee_layer', status_text: 'Getting image from Google Earth Engine..', feature_collection: undefined });
        });
    }

    changeToMaxarImage() {
        //move the map to java
        this.state.view.goTo({ center: [ 112.84350452926209, -8.054735059174224], zoom: 18 }).then(_ => {
            //set the state
            this.setState({ mode: 'webtile_layer', status_text: 'Getting image from OpenAerialMap..', feature_collection: undefined, wms_endpoint:'https://tiles.openaerialmap.org/61b94e69b26de1000596d605/1/61b94e69b26de1000596d607/{z}/{x}/{y}' });
        });
    }

    changeToWaybackImage(){
        //move the map to northern ghana
        this.state.view.goTo({ center: [-2.503135, 10.064652], zoom: 18 }).then(_ => {
            //set the state
            this.setState({ mode: 'webtile_layer', status_text: 'Getting image from Wayback..', feature_collection: undefined, wms_endpoint:'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/8249/{level}/{row}/{col}' });
        });
    }

    startTCD() {
        this.setState({ detecting_tree_crowns: true, feature_collection: undefined });
    }

    //static image functions////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //called when the user clicks on the drone button
    openFilePicker(e) {
        this.setState({ mode: 'static_image' });
        this.inputElement.click();
    }

    //sets the properties of the image that the user has selected for TCD
    imageChosen(e) {
        this.raw_image_url = URL.createObjectURL(e.target.files[0]);
        this.selectedFile = e.target.files[0];
        //once the state has been set, send the image for processing
        this.setState({ image_url: this.raw_image_url }, this.processImage);
    }

    //posts the image data to the server for TCD
    processImage(response) {
        this.startTCD();
        const data = new FormData();
        //add the image binary data
        data.append('data', this.selectedFile);
        //post to the server
        axios.post(this.GET_INSTANCES_IMAGE_ENDPOINT, data, { withCredentials: true }).then(response => {
            //get the url to the classified image
            this.classified_image_url = this.SERVER + "/outputs/" + response.data.instances_image;
            //set the active image is classified to true
            this.active_image_is_classified = true;
            //set the url of the <img> element
            this.setState({ image_url: this.classified_image_url });
            //set a local variable to the feature collection that will actually be updated when the classified image loads
            this.fc = response.data.feature_collection;
        });
    }

    //called when the image (raw or classified) has been loaded into the html <img> element
    imageLoaded(e) {
        //if it is the classified image that has loaded then set the state to finished detecting tree crowns
        if (e.currentTarget.src.substr(0, 5) !== 'blob:') this.setState({ detecting_tree_crowns: false, feature_collection: this.fc });
    }

    //change between the raw image and the classified image
    switchImages() {
        if (this.active_image_is_classified) {
            this.setState({ image_url: this.raw_image_url });
        }
        else {
            this.setState({ image_url: this.classified_image_url });
        }
        this.active_image_is_classified = !this.active_image_is_classified;
    }

    //dynamic image functions////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //fired when a dynamic image has been created/cleared and the blob data has been saved in the layer
    blob_set(blob) {
        const dynamic_image_state = (blob) ? false : true;
        //set the state of the getting_dynamic_image
        this.setState({ getting_dynamic_image: dynamic_image_state });
        //set the state of the feature collection - if the blob is undefined then clear the feature collection 
        if (!blob) this.setState({ feature_collection: undefined });
        this.blob = blob;
    }

    //sends the dynamic image blob to the server to do tcd on it
    processDynamicImage() {
        return new Promise((resolve, reject) => {
            this.startTCD();
            const data = new FormData();
            //add the image binary data to the request
            data.append('data', this.blob);
            //get the upper right coordinate as a lat/long point
            const ul = this.webMercatorUtils.xyToLngLat(this.state.view.extent.xmin, this.state.view.extent.ymax);
            //get the lower left coordinate from the map extent
            const lr = this.webMercatorUtils.xyToLngLat(this.state.view.extent.xmax, this.state.view.extent.ymin);
            //add the upper left and lower right coordinates to the request
            data.append('ul', ul);
            data.append('lr', lr);
            //post to the server
            axios.post(this.GET_INSTANCES_ENDPOINT, data, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }).then(response => {
                //set the feature collection - this will draw the tree crowns
                this.setState({ feature_collection: response.data.instances_geojson, detecting_tree_crowns: false });
                resolve(response);
            });
        });
    }
    
    downloadInstances(){
        const file = new File([JSON.stringify(this.state.feature_collection)], 'tree_crowns.geojson', {
          type: 'text/plain',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(file);
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    //fired when the user clicks on the show crowns checkbox
    changeCrowns(evt) {
        this.setState({ show_crowns: evt.nativeEvent.srcElement.checked });
    }

    //fired when the user clicks on the show boxes checkbox
    changeBoxes(evt) {
        this.setState({ show_boxes: evt.nativeEvent.srcElement.checked });
    }

    //fired when the user clicks on the show masks checkbox
    changeMasks(evt) {
        this.setState({ show_masks: evt.nativeEvent.srcElement.checked });
    }

    //fired when the user clicks on the show scores checkbox
    changeScores(evt) {
        this.setState({ show_scores: evt.nativeEvent.srcElement.checked });
    }

    //fired when the user clicks on the show areas checkbox
    changeAreas(evt) {
        this.setState({ show_areas: evt.nativeEvent.srcElement.checked });
    }

    //fired when the area range sliders value changes
    change_area_range(evt, value) {
        this.setState({ area_range_value: value });
    }

    //fired when the score range sliders value changes
    change_score_range(evt, value) {
        this.setState({ score_range_value: value });
    }

    render() {
        return (
            <div className="maindiv">
                <table>
                    <tbody>
                        <tr>
                            <td className={'imageCell'}>
                                <input ref={input => this.inputElement = input} type="file" onChange={this.imageChosen.bind(this)} style={{'display':'none'}}/>
                                <img src={this.state.image_url} className={"image"} alt='drone' style={{width:"700px",height:"700px", 'display': (this.state.image_url && this.state.mode === 'static_image') ? 'block' : 'none'}} onLoad={this.imageLoaded.bind(this)}/>
                                <Map className={'esri_map'} onLoad={this.handleMapLoad} mapProperties={{ basemap: {portalItem: {id: "96cff8b8e48d45548833f19e29f09943"}}}} viewProperties={{center: [this.state.lng, this.state.lat], zoom: 19}}>
                            	    <GeeLayer detecting_tree_crowns={this.state.detecting_tree_crowns} blob_set={this.blob_set.bind(this)} visible={this.state.mode==='gee_layer'} layers={'WWF/carbon-maps/raw-data/imagery'} bands={"b1,b2,b3"} copyright={this.state.gee_copyright}/>
                            	    <GeojsonLayer feature_collection={this.state.feature_collection} visible={this.state.mode!=='static_image' && this.state.show_crowns} show_boxes={this.state.show_boxes} show_masks={this.state.show_masks} show_scores={this.state.show_scores} show_areas={this.state.show_areas} area_range_value={this.state.area_range_value} score_range_value={this.state.score_range_value}/>
                            	    <WaybackLayer blob_set={this.blob_set.bind(this)} visible={this.state.mode==='webtile_layer'} urlTemplate={this.state.wms_endpoint} copyright={this.state.wms_copyright}/>
                            	</Map>
                                <div className={'imageBackground'}></div>
                                {/* Detecting trees spinner */}
                                <div className="status_box" style={{ display: this.state.detecting_tree_crowns ? "block": "none" }} >
                                    <Sync sx={{ fontSize: 60 }} className={"spin"}/>
                                    <div className='status_text'>Detecting trees..</div>
                                    <div className='geeLoading' style={{ 'display': (this.state.mode !== 'static_image' && this.state.getting_dynamic_image) ? 'block' : 'none'}}>{this.state.status_text}</div>
                                </div>
                                {/* Loading imagery spinner */}
                                <div className="status_box" style={{ display: (this.state.mode !== 'static_image' && this.state.getting_dynamic_image) ? "block": "none" }} >
                                    <Sync sx={{ fontSize: 60 }} className={"spin"} style={{color: 'gray'}}/>
                                    <div className='geeLoading'>{this.state.status_text}</div>
                                </div>
                            </td>
                            <td className={'buttonCell'}>
                                <div>
                    	            <Button variant="contained" type="file" onClick={this.openFilePicker.bind(this)} disabled={this.state.getting_dynamic_image || this.state.detecting_tree_crowns} title='Upload drone image for tree detection'>Drone</Button>
                    	            <span className='span'></span>
                    	            <Button variant="contained" onClick={this.changeToGeeImage.bind(this)} disabled={this.state.getting_dynamic_image || this.state.detecting_tree_crowns} title='Use aerial imagery from Google Earth Engine for tree detection'>Aerial</Button>
                    	            <span className='span'></span>
                    	            <Button variant="contained" onClick={this.changeToMaxarImage.bind(this)} disabled={this.state.getting_dynamic_image || this.state.detecting_tree_crowns} title='Use Maxar WorldView2 imagery for tree detection'>Satelllite</Button>
                    	            <span className='span'></span>
                    	            <Button variant="contained" onClick={this.changeToWaybackImage.bind(this)} disabled={this.state.getting_dynamic_image || this.state.detecting_tree_crowns} title='Use ESRI Wayback for tree detection'>Wayback</Button>
                    	            <span className='span'></span>
                    	            <Button variant="contained" onClick={this.processDynamicImage.bind(this)} disabled={this.state.mode==='static_image' || this.state.getting_dynamic_image || this.state.detecting_tree_crowns} color='error' title='Start tree detection on the imagery'>Go</Button>
                    	            <span className='span'></span>
                                    <IconButton aria-label="delete" color="primary" onClick={this.downloadInstances.bind(this)} disabled={!this.state.feature_collection} title='Download the detected trees as Geojson'>
                                        <DownloadIcon />
                                    </IconButton>
                                    <TreeCrownMetrics mode={this.state.mode} feature_collection={this.state.feature_collection} changeCrowns={this.changeCrowns.bind(this)} changeBoxes={this.changeBoxes.bind(this)} changeMasks={this.changeMasks.bind(this)} changeScores={this.changeScores.bind(this)} changeAreas={this.changeAreas.bind(this)} show_crowns={this.state.show_crowns} show_boxes={this.state.show_boxes} show_masks={this.state.show_masks} show_scores={this.state.show_scores} show_areas={this.state.show_areas} change_area_range={this.change_area_range.bind(this)} area_range_value={this.state.area_range_value} score_range_value={this.state.score_range_value} change_score_range={this.change_score_range.bind(this)}/>
                                    <div className={'citation'}><i>Closed-canopy CNN model source:</i><div>Alejandro Coca-Castro, Matt Allen, 2021 <b>Tree crown detection (The Enviromental AI Book)</b>. http://acocac.github.io/environmental-ai-book/forest/modelling/forest-modelling-treecrown_deepforest.html Online; accessed Mon Nov 01 2021</div></div>
                                </div>
                	        </td>
                	   </tr>
            	   </tbody>
            	</table>
            </div>
        );
    }
}

export default UI;

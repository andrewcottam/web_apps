import { Component } from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Label, YAxis } from 'recharts';
import { AreaChart, Area, LineChart, Line, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { histogram } from "./Helpers.js";
import Box from '@mui/material/Box';
import Checkbox from './Checkbox.js';
import Slider from '@mui/material/Slider';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

class TreeCrownMetrics extends Component {

    //gets a histogram of the tree canopy area data
    getHistogram(feature_collection) {
        if (this.props.feature_collection && this.props.feature_collection.features) {
            const areas = this.props.feature_collection.features.map(feature => {
                return feature.properties.area;
            });
            const histo = histogram(areas);
            return histo.histogram.map((bin, i) => {
                return { area: ((i + 1) * histo.size), count: bin };
            });
        }
    }

    //gets the values for the slider based on the data in the feature_property
    get_slider_values(features, feature_property, slider_title, unit){
        const areas = features.map(feature => {return feature.properties[feature_property]});
        const max_value = parseInt(areas.sort(function(a, b){return a-b})[areas.length-1], 10) + 1;
        const marks = [ {value: 0, label: '0' + unit, }, { value: (max_value / 2), label: slider_title, }, { value: max_value, label: max_value + unit, } ];
        return({max: max_value, marks: marks});
    }
    
    render() {
        if (this.props.feature_collection && this.props.feature_collection.features) {
            //get the min/max values for the area slider and the marks
            const area_slider_values = this.get_slider_values(this.props.feature_collection.features, 'area', 'Tree crown area', "m2");
            //get the min/max values for the score slider and the marks
            const score_slider_values = this.get_slider_values(this.props.feature_collection.features, 'score', 'Score','');
            //see if we have area data for the tree crowns
            const include_histogram = this.props.feature_collection.features.length > 0 && this.props.feature_collection.features[0].hasOwnProperty('properties') && this.props.feature_collection.features[0].properties.hasOwnProperty('area');
            const tree_crowns = (include_histogram) ? this.getHistogram(this.props.feature_collection) : [];
            const bar_chart = (include_histogram) ?
                <BarChart width={400} height={250} data={tree_crowns} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} >
                    <XAxis dataKey="area" type="number" tick={{fontSize: 10}}>
                        <Label value="Canopy area (m2)" offset={0} position="insideBottom" style={{ fontSize: 12, fill: 'rgba(0, 0, 0, 0.87)' }}/>
                    </XAxis>
                    <YAxis tick={{fontSize: 10}}>
                        <Label value="Count" angle="-90" style={{ fontSize: 12, fill: 'rgba(0, 0, 0, 0.87)' }}/>
                    </YAxis>
                    <CartesianGrid stroke="#f5f5f5" />
                    <Bar dataKey="count" barSize={10} fill="#8884d8" isAnimationActive={false}/>
                </BarChart> 
                // <LineChart width={300} height={100} data={tree_crowns}>
                //     <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={1} />
                //     <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                //     <XAxis dataKey="area" />
                //     <YAxis dataKey="count" />
                // </LineChart>
                // <AreaChart width={300} height={100} data={tree_crowns}>
                //     <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={1} />
                //     <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                //     <XAxis dataKey="area" />
                //     <YAxis dataKey="count" />
                // </AreaChart>
                // null
                : null;
            const controls = (this.props.mode !== 'static_image' && this.props.feature_collection.features.length > 0) ? 
                <Box sx={{ width: 200 }} className='controls_container'>
                    <FormGroup>
                        <FormControlLabel control={<Switch checked={this.props.show_crowns} size="small" onChange={this.props.changeCrowns}/>} label="" />
                    </FormGroup>                                    
                    <div className='checkbox'>
                        <Checkbox id='show_crowns_cb' label='Crowns' checked={this.props.show_crowns} size="small" onChange={this.props.changeCrowns}/>  
                    </div>
                    <div>
                        <div className='checkbox_nested'>
                            <Checkbox id='show_boxes_cb' label='Boxes' checked={this.props.show_boxes} size="small" onChange={this.props.changeBoxes} disabled={!this.props.show_crowns}/>  
                        </div>
                        <div className='checkbox_nested'>
                            <Checkbox id='show_masks_cb' label='Masks' checked={this.props.show_masks} size="small" onChange={this.props.changeMasks} disabled={!this.props.show_crowns}/>  
                        </div>
                        <div className='checkbox_nested'>
                            <Checkbox id='show_scores_cb' label='Scores' checked={this.props.show_scores} size="small" onChange={this.props.changeScores} disabled={!this.props.show_crowns}/>  
                            <span className='slider_container'>
                                <Slider value={this.props.score_range_value} onChange={this.props.change_score_range} step={0.01} valueLabelDisplay="auto" size="small" max={1} style={{display: (this.props.show_crowns && this.props.show_scores) ? 'block' : 'none', marginBottom:'0px'}}/>
                            </span>
                        </div>
                        <div className='checkbox_nested'>
                            <Checkbox id='show_areas_cb' label='Areas' checked={this.props.show_areas} size="small" onChange={this.props.changeAreas} disabled={!this.props.show_crowns}/>  
                            <span className='slider_container'>
                                <Slider value={this.props.area_range_value} onChange={this.props.change_area_range} valueLabelDisplay="auto" size="small" max={area_slider_values.max} style={{display: (this.props.show_crowns && this.props.show_areas) ? 'block' : 'none', marginBottom:'0px'}}/>
                            </span>
                        </div>
                    </div>
                </Box>
                : null;
            return (
                <div className='tree_crown_outer'> 
                    <div className='trees_detected'><div className='trees_detected_count'>{this.props.feature_collection.features.length}</div> trees detected</div>
                    {bar_chart}
                    <div className='center'/>
                    {controls}
                </div>
            );
        }
        else {
            return <div/>;
        }
    }
}

export default TreeCrownMetrics;

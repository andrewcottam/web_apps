import { PathLayer } from '@deck.gl/layers';

// How many units of length are animated in 1 second - controls the number of blobs per second - the higher the number the longer the blobs
const ANIMATION_RATE = 0.0006;
const defaultProps = {
    dataTransform: { type: 'accessor', value: (data, _) => dataTransform(data) },
    getTimestamps: { type: 'accessor', value: d => d.waypoints.map(p => p.timestamp) },
    getPath: { type: 'accessor', value: d => d.waypoints.map(p => p.coordinates) },
    getColor: { type: 'accessor', value: [253, 128, 93] },
    widthMinPixels: { type: 'number', value: 4 },
    capRounded: { type: 'boolean', value: true },
    alphaFloor: { type: 'number', value: 0.3 }, // the lowest alpha value for the rendering 
    wavelength: { type: 'number', value: 5 }, // the length of the sine wave
    speed: { type: 'number', value: 30 } // the speed that the blobs move at
};

function dataTransform(data) {
    // transforms the geojson to data suitable for using in the TripsLayer descendent class
    const output_features = [];
    //iterate through the features
    data.features.forEach((feature) => {
        // initialise the output feature array
        let waypoints = [], coords = [], prevCoord = [], longDiff = 0, latDiff = 0, ts = 0, totalTime = 0;
        //iterate through the coordinates
        coords = feature.geometry.coordinates;
        coords.forEach((coord, j, arr) => {
            //get the previous coord if j > 0 and calculate the timestamp based on the distance
            if (j > 0) {
                prevCoord = arr[j - 1]
                longDiff = coord[0] - prevCoord[0];
                latDiff = coord[1] - prevCoord[1];
                ts = (Math.sqrt(longDiff ** 2 + latDiff ** 2)) / ANIMATION_RATE;
                totalTime += ts;
            }
            waypoints.push({ coordinates: coord, timestamp: totalTime });
        })
        output_features.push({ waypoints: waypoints });
    })
    return output_features;
}

export default class PowerLineLayer extends PathLayer {
    static layerName = 'PowerLineLayer';
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);
        this.state = { currentTime: 0 };
    }

    getShaders() {
        const shaders = super.getShaders();
        const speed = this.props.speed / 200;
        const w = this.props.wavelength.toFixed(1);
        shaders.inject = {
            'vs:#decl': `\
                attribute float instanceTimestamps;
                attribute float instanceNextTimestamps;
                varying float vTime;
            `,
            // Timestamp of the vertex
            'vs:#main-end': `\
                vTime = instanceTimestamps + (instanceNextTimestamps - instanceTimestamps) * vPathPosition.y / vPathLength;
            `,
            'fs:#decl': `\
                uniform float currentTime;
                varying float vTime;
            `,
            // Convert the time values to a sine wave that moves with the current time
            'fs:DECKGL_FILTER_COLOR': `\
                // color.a = ((abs(5.0 - mod(vTime + currentTime*speed, 10.0)))/4.0)+0.3;
                color.a = ((abs(` + w + ` - mod(vTime + currentTime*` + speed + `, ` + (w * 2).toFixed(1) + `)))/` + (w - 1).toFixed(1) + `)+` + this.props.alphaFloor + `;
            `
        };
        return shaders;
    }

    initializeState() {
        super.initializeState();
        const attributeManager = this.getAttributeManager();
        attributeManager.addInstanced({
            timestamps: {
                size: 1,
                accessor: 'getTimestamps',
                shaderAttributes: {
                    instanceTimestamps: {
                        vertexOffset: 0
                    },
                    instanceNextTimestamps: {
                        vertexOffset: 1
                    }
                }
            }
        });
        // start the animation
        this.animationid = window.requestAnimationFrame(this.animate); // start animation
        return () => window.cancelAnimationFrame(this.animationid);
    }

    animate = () => {
        this.animationid = window.requestAnimationFrame(this.animate);
        this.setState({ currentTime: this.animationid });
    };

    draw(params) {
        const { currentTime } = this.state;
        params.uniforms = { ...params.uniforms, currentTime };
        super.draw(params);
    }
}
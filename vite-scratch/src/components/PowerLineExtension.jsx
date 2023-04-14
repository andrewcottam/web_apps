import { LayerExtension } from '@deck.gl/core';

const defaultProps = {
    // Length of power line
    getLineLength: { type: 'accessor', value: 0 },
    // Frequency of the running light
    getFrequency: { type: 'accessor', value: 1 },
    // Speed of the running light
    animationSpeed: { type: 'number', min: 0, value: 1 },
    // Size of the blob
    tailLength: { type: 'number', min: 0, value: 1 }
}

// Shader definitions
const vsDeclaration = `
attribute float lineLength;
attribute float instanceFrequency;
varying float vLineLength;
varying float vFrequency;
`

const vsMain = `
vLineLength = lineLength;
vFrequency = instanceFrequency;
`

const vsColorFilter = `

`

const fsDeclaration = `
uniform float tailLength;
uniform float timestamp;
uniform float animationSpeed;
varying float vLineLength;
varying float vFrequency;
`

const fsColorFilter = `
// will be 1
float vArcLength = vLineLength/36398.67010386342;
// will be 0.5
float tripDuration = vArcLength / animationSpeed;
// will be 1.0
float flightInterval = 1.0 / vFrequency;
float r = mod(geometry.uv.x, flightInterval);
// 
float rMax = mod(fract(timestamp / tripDuration), flightInterval);
float rMin = rMax - tailLength / vArcLength;
// float alpha = (r > rMax ? 0.0 : smoothstep(rMin, rMax, r)) + smoothstep(rMin + flightInterval, rMax + flightInterval, r);
// if (alpha == 0.0) {
//   discard;
// }
float alpha = 1.0;
color.a *= alpha;
`

export default class PowerLineExtension extends LayerExtension {
    initializeState(params) {
        super.initializeState(params);
        if (this.getAttributeManager()) {
            const att_mngr = this.getAttributeManager()
            att_mngr.addInstanced({ lineLength: { size: 1, accessor: 'getLineLength', defaultValue: 1 } });
            // att_mngr.addInstanced({
            //     distanceTravelled: {
            //         size: 1, 
            //         update: (attribute) => {
            //             // calculate the distance travelled between the vertices of the line
            //             for (let i = 0; i < this.props.data.length; i++) {
            //                 const coords = this.props.data[i].geometry.coordinates;
            //                 for (let j = 1; j < coords; j++) {
            //                     const sp = coords[j-1];
            //                     const ep = coords[j];
            //                 }
            //             }

            //             // const vertices = _.sum(this.props.data.map((d) => d.timestamps.length));
            //             // const ranges = new Float32Array(vertices * 2);
            //             // let r = 0;
            //             // for (let i = 0; i < this.props.data.length; i++) {
            //             //     const tripStart = _.first(this.props.data[i].timestamps);
            //             //     const tripEnd = _.last(this.props.data[i].timestamps);

            //             //     this.props.data[i].timestamps.forEach(() => {
            //             //         ranges[r++] = tripStart;
            //             //         ranges[r++] = tripEnd;
            //             //     });
            //             // }
            //             attribute.value = ranges;
            //         },
            //     }
            // });
        }
    }

    getShaders() {
        const shaders = super.getShaders();
        return {
            ...super.getShaders(),
            inject: {
                'vs:#decl': vsDeclaration,
                'vs:#main-end': vsMain,
                'vs:DECKGL_FILTER_COLOR': vsColorFilter,
                'fs:#decl': fsDeclaration,
                'fs:DECKGL_FILTER_COLOR': fsColorFilter
            }
        }
    }

    draw(opts) {
        this.state.model.setUniforms({
            tailLength: this.props.tailLength,
            animationSpeed: this.props.animationSpeed,
            //number of seconds since midnight
            timestamp: (Date.now() / 1000) % 86400
        });
        super.draw(opts);
        // By default, the needsRedraw flag is cleared at each render. We want the layer to continue
        // refreshing.
        this.setNeedsRedraw();
    }
}

PowerLineExtension.layerName = 'PowerLineLayer';
PowerLineExtension.defaultProps = defaultProps;
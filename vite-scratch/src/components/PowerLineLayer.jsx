import { PathLayer } from '@deck.gl/layers';

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
// attribute float instanceFrequency;
// varying float vArcLength;
// varying float vFrequency;
`

const vsMain = `
// //this length depends on the zoom level and can be greater than 1
// vArcLength = distance(source, target);
// vFrequency = instanceFrequency;
`

const fsDeclaration = `
// uniform float tailLength;
// uniform float timestamp;
// uniform float animationSpeed;
// varying float vArcLength;
// varying float vFrequency;
`

const fsColorFilter = `
// //if vArcLength < 1 then tripDuration will be < 0.5 
// float tripDuration = vArcLength / animationSpeed;
// float flightInterval = 1.0 / vFrequency;
// float r = mod(geometry.uv.x, flightInterval);
// float rMax = mod(fract(timestamp / tripDuration), flightInterval);
// float rMin = rMax - tailLength / vArcLength;
// float alpha = (r > rMax ? 0.0 : smoothstep(rMin, rMax, r)) + smoothstep(rMin + flightInterval, rMax + flightInterval, r);
// if (alpha == 0.0) {
//   discard;
// }
// color.a *= alpha;
color.a *= 1.0;
`

export default class PowerLineLayer extends PathLayer {

    initializeState(params) {
        super.initializeState(params);
        this.getAttributeManager().addInstanced({
            instanceFrequency: {
                size: 1,
                accessor: 'getFrequency',
                defaultValue: 1
            },
        });
    }

    getShaders() {
        const shaders = super.getShaders();
        return {
            ...super.getShaders(),
            inject: {
                'vs:#decl': vsDeclaration,
                'vs:#main-end': vsMain,
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

PowerLineLayer.layerName = 'PowerLineLayer';
PowerLineLayer.defaultProps = defaultProps;
import { PathLayer } from '@deck.gl/layers';

const defaultProps = {
    currentTime: { type: 'number', value: 0, min: 0 },
    getTimestamps: { type: 'accessor', value: d => d.timestamps }
};

export default class ElectricLine extends PathLayer {
    static layerName = 'ElectricLine';
    static defaultProps = defaultProps;

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
                color.a = ((abs(` + w + ` - mod(vTime + currentTime*` + speed + `, ` + (w*2).toFixed(1) + `)))/` + (w-1).toFixed(1) + `)+` + this.props.alphaFloor + `;
            `
        };
        return shaders;
    }

    initializeState() {
        super.initializeState();
        super.dataTransform = function(data, previousdata){
            console.log('wibble')
        }
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
    }

    draw(params) {
        const { currentTime } = this.props;
        params.uniforms = {
            ...params.uniforms,
            currentTime
        };
        super.draw(params);
    }
}
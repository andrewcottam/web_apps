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
            // Fade the color (currentTime - 100%, end of trail - 0%)
            'fs:DECKGL_FILTER_COLOR': `\
                color.a = (mod(vTime + currentTime, 5.0)/4.0);
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
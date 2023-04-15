import { TripsLayer } from '@deck.gl/geo-layers';

export default class PowerLayer extends TripsLayer {
    /**
     * Data format:
     * [
     *   {
     *     waypoints: [
     *      {coordinates: [-122.3907988, 37.7664413], timestamp: 1554772579000}
     *      {coordinates: [-122.3908298,37.7667706], timestamp: 1554772579010}
     *       ...,
     *      {coordinates: [-122.4485672, 37.8040182], timestamp: 1554772580200}
     *     ]
     *   }
     * ]
     */
    initializeState(params) {
        super.initializeState(params);
    }

    getShaders() {
        const shaders = super.getShaders();
        return {
            ...super.getShaders()        }
    }

    draw(opts) {
        super.draw(opts);
    }

}

PowerLayer.layerName = 'PowerLayer';
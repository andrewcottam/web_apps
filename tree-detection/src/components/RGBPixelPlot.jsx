import React, { useState } from "react";
import DeckGL from '@deck.gl/react';
import { OrbitView } from '@deck.gl/core';
import { PointCloudLayer } from '@deck.gl/layers';
import { COORDINATE_SYSTEM } from '@deck.gl/core';

export default function RGBPixelPlot(props) {

    //local state
    const [layer, setLayer] = useState(null);
    const [view, setView] = useState(null);
    const [viewState, setViewState] = useState({});

    if (props.canvas && !layer) {
        const context = props.canvas.getContext("2d");
        // get the image pixel data as a 1 dimensional array (Uint8ClampedArray)
        const d = context.getImageData(0, 0, props.canvas.width, props.canvas.height).data;
        let data = []
        for (var i = 0; i < d.length; i += 4) {
            data.push({ position: d.slice(i, i + 2), normal: [-1, 0, 0], color: [255, 255, 0] });
        }
        // const data = [
        //     { position: [-122, 37.7, 12], normal: [1, 0, 0], color: [255, 255, 0] },
        //     { position: [122, 37, 14], normal: [1, 0, 0], color: [255, 0, 0] }
        // ]
        const lyr = new PointCloudLayer({
            id: 'point-cloud-layer',
            data,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            pointSize: 2,
            getPosition: d => d.position,
            getNormal: d => d.normal,
            getColor: d => d.color
        });
        const view = new OrbitView();
        setLayer(lyr);
        setView(view);
        setViewState({});
    }

    return <DeckGL layers={[layer]} view={view} width={600} height={600} viewState={viewState} />;
}
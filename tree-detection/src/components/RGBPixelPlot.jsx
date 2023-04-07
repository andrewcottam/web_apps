import React, { useState } from "react";
// deck.gl imports
import DeckGL from '@deck.gl/react';
import { OrbitView } from '@deck.gl/core';
import { PointCloudLayer } from '@deck.gl/layers';
import { COORDINATE_SYSTEM } from '@deck.gl/core';

export default function RGBPixelPlot(props) {

    //local state
    const [data, setData] = useState(null);
    const [viewState, setViewState] = useState({});

    if (props.canvas && !data) {
        const context = props.canvas.getContext("2d");
        // get the image pixel data as a 1 dimensional array (Uint8ClampedArray)
        const d = context.getImageData(0, 0, props.canvas.width, props.canvas.height).data;
        let _data = []
        // create the point cloud data
        for (var i = 0; i < d.length; i += 4) {
            _data.push({ position: d.slice(i, i + 2), normal: [-1, 0, 0], color: [0, 255, 0] });
        }
        setViewState({});
        setData(_data);
    }

    return <DeckGL width={600} height={600} initialViewState={viewState}>
        <PointCloudLayer id='point-cloud-layer' data={data} coordinateSystem={COORDINATE_SYSTEM.CARTESIAN} pointSize={2}/>
        <OrbitView />
    </DeckGL>
}
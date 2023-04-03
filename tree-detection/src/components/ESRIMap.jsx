import React, { useRef, useEffect, useState } from "react";
// esri components
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map.js";
//styles
import "../App.css";

export default function ESRIMap(props) {
    const [map, setMap] = useState(null);
    const [view, setView] = useState(null);
    const mapDiv = useRef(null);

    useEffect(() => {
        if (mapDiv.current) {
            const map = new Map(props.mapProperties);
            const view = new MapView({
                container: mapDiv.current,
                map: map,
                ...props.viewProperties
            });
            view.when(_ => {
                props.onLoad(map, view);
            })
            setMap(map);
            setView(view);
        }
    }, []);

    return <div className="esri_map" ref={mapDiv}>
        {
            React.Children.map(props.children, (child) =>
                React.cloneElement(child, { map: map, view: view })
            )
        }
    </div>;
}
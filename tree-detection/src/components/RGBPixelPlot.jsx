import React from "react";

export default function RGBPixelPlot(props) {
    if (props.canvas) {
        const context = props.canvas.getContext("2d");
        const image_data = context.getImageData(0, 0, props.canvas.width, props.canvas.height);
        console.log(image_data);
    }

    return <div></div>;
}
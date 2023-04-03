export function histogram(data) {
    var min = Infinity, max =-Infinity, size;
    data.sort();
    if (data.length === 1) {
        min = 0;
        max = data[0];
        size = 2;
    }else{
        if (data.length === 2) {
            min = data[0];
            max = data[1];
            size = (max-min) / 2;
        }else{
            size = 25;
            for (const item of data) {
                if (item < min) min = item;
                else if (item > max) max = item;
            }
        }
    }
    const bins = Math.ceil((max - min + 1) / size);
    const histogram = new Array(bins).fill(0);
    for (const item of data) {
        histogram[Math.floor((item - min) / size)]++;
    }
    // console.log(histogram);
    return {histogram: histogram, size: size};
}

//from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
//This code returns the coordinate of the _upper left_ (northwest-most)-point of the tile.

export function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}

export function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

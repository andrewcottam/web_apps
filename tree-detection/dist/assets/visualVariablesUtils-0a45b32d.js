import{ah as a,s as r}from"./index-4a807205.js";import{$ as i,L as s}from"./color-0771e239.js";function p(e){return i(e.minDataValue)&&i(e.maxDataValue)&&e.minSize!=null&&e.maxSize!=null?s.SIZE_MINMAX_VALUE:(e.expression&&e.expression==="view.scale"||e.valueExpression&&e.valueExpression==="$view.scale")&&Array.isArray(e.stops)?s.SIZE_SCALE_STOPS:(e.field!=null||e.expression&&e.expression!=="view.scale"||e.valueExpression&&e.valueExpression!=="$view.scale")&&(Array.isArray(e.stops)||"levels"in e&&e.levels)?s.SIZE_FIELD_STOPS:(e.field!=null||e.expression&&e.expression!=="view.scale"||e.valueExpression&&e.valueExpression!=="$view.scale")&&e.valueUnit!=null?s.SIZE_UNIT_VALUE:(a.getLogger("esri.views.2d.engine.webgl").error(new r("mapview-bad-type","Found invalid size VisualVariable",e)),s.NONE)}export{p as l};

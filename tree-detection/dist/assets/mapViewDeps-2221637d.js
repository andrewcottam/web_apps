import{f as re,n as De,U as Y,j as Ue,s as se,h as T,r as B,D as Ge,a as Ie,d as He,b as J,e as ne,c as Q,l as qe,g as ue,i as We,M as Ve,k as je,m as Xe,t as N,v as Ye,u as he,p as Ke,o as Je,q as Qe,w as ce,x as Ze,A as et,y as tt,z as _e,B as it,_ as pe,C as rt,E as st,F as nt,G as Z,H as at,I as fe,J as ot,K as lt}from"./index-5df536c7.js";import{i as dt,C as ut,b as ht,e as me,r as ct,t as _t,a as pt,_ as ft,J as mt,c as gt,d as vt,f as bt}from"./MagnifierPrograms-64bcf86f.js";import{u as ls,y as ds}from"./MagnifierPrograms-64bcf86f.js";import{c as Tt}from"./imageutils-53f8becb.js";import{t as xt,i as wt,o as ge,h as ve,r as yt}from"./Container-80adbe84.js";import{n as Et}from"./BufferPool-fa6961c3.js";import{T as S,E as q,S as ee}from"./color-57ca2c71.js";import{t as Rt,n as H,a as j,w as z,m as Bt}from"./WGLContainer-a2b5bb22.js";import{L as P}from"./enums-fb086c25.js";import{e as Ft,a as K}from"./ProgramTemplate-0cbba525.js";import{n as G}from"./programUtils-f05804ee.js";import{f as ae,E as oe,x as A,s as Ot}from"./VertexArrayObject-fa651786.js";import{R as g,E as V,F as le,O as te,I as ze,L as x,C as be,M as O,P as f,G as y,D as M,Y as D,V as U,B as Mt}from"./enums-64ab819c.js";import{o as Te,I as Pt}from"./RenderingContext-8f7403c7.js";import{b as Ct,x as St,N as At,B as Dt,C as Ut,I as W,J as It,Y as Ne,O as xe}from"./definitions-3ddd14a8.js";import{t as we}from"./VertexElementDescriptor-2925c6af.js";import{E as k}from"./Texture-d9a19edf.js";import{e as zt}from"./imageUtils-c2d0d1ae.js";import{a as hs}from"./GraphicsView2D-5978c507.js";import{i as _s}from"./GraphicContainer-86623243.js";import{t as ye}from"./requestImageUtils-bd588e57.js";import"./_commonjsHelpers-2f3e7994.js";import"./ExpandedCIM-12772ae5.js";import"./BidiEngine-836b7ef6.js";import"./GeometryUtils-53652037.js";import"./enums-55085e26.js";import"./MaterialKey-1ff97e80.js";import"./Rect-ea14f53a.js";import"./quantizationUtils-9763d180.js";import"./floatRGBA-6e8b4588.js";import"./rasterizingUtils-d96108f2.js";import"./GeometryUtils-dd03fc25.js";import"./Matcher-a3a0b259.js";import"./visualVariablesUtils-ab072646.js";import"./visualVariablesUtils-7f5c50f5.js";import"./tileUtils-c2f19f52.js";import"./TurboLine-530d7290.js";import"./earcut-61f7b102.js";import"./devEnvironmentUtils-5002a058.js";import"./CircularArray-95b23b6d.js";import"./webgl-debug-b1f7a2c5.js";import"./ComputedAttributeStorage-d5073179.js";import"./arcadeTimeUtils-a16f5bf3.js";import"./executionError-fb3f283a.js";import"./centroid-234cbe70.js";import"./utils-0f95c4a5.js";import"./StyleDefinition-fbc907c2.js";import"./config-1337d16e.js";import"./NestedMap-1b5db22e.js";import"./OrderIndependentTransparency-e1b3a745.js";import"./basicInterfaces-b7051eb1.js";import"./doublePrecisionUtils-e3c3d0d8.js";import"./normalizeUtilsSync-cf64a78d.js";import"./projectionSupport-2bdd481a.js";import"./json-48e3ea08.js";import"./AttributeStoreView-d08f887a.js";import"./TiledDisplayObject-c7008457.js";import"./schemaUtils-9ab66d11.js";import"./util-4349f39c.js";import"./BaseGraphicContainer-c7d5dab9.js";import"./FeatureContainer-8878f9d0.js";import"./TileContainer-223155e4.js";import"./vec3f32-ad1dc57f.js";async function Nt(l,e){const t=dt(l);if(t instanceof Error)throw t;await t.createImages(),re(e);const{frames:i,width:r,height:n}=t,s=document.createElement("canvas");s.width=r,s.height=n;const a=s.getContext("2d",{willReadFrequently:!0}),d=[],u=[];for(const o of i){u.push(De(o.delay||100));const h=o.imageElement;o.blendOp===0?a.globalCompositeOperation="copy":a.globalCompositeOperation="source-over";const c=o.disposeOp===2?a.getImageData(o.left,o.top,o.width,o.height):void 0;a.drawImage(h,o.left,o.top);const p=a.getImageData(0,0,r,n);d.push(p),o.disposeOp===0||(o.disposeOp===1?a.clearRect(o.left,o.top,o.width,o.height):o.disposeOp===2&&a.putImageData(c,o.left,o.top))}return{frameDurations:u,getFrame:o=>d[o],width:r,height:n}}const Lt=[137,80,78,71,13,10,26,10];function $t(l){const e=new Uint8Array(l);return!Lt.some((t,i)=>t!==e[i])}function kt(l){if(!$t(l))return!1;const e=new DataView(l),t=new Uint8Array(l);let i,r=8;do{const n=e.getUint32(r);if(i=String.fromCharCode.apply(String,Array.prototype.slice.call(t.subarray(r+4,r+8))),i==="acTL")return!0;r+=12+n}while(i!=="IEND"&&r<t.length);return!1}async function Gt(l,e){const t=ut(l),i=ht(t,!0),{width:r,height:n}=t.lsd,s=document.createElement("canvas");s.width=r,s.height=n;const a=s.getContext("2d",{willReadFrequently:!0}),d=[],u=[];for(const o of i){u.push(De(o.delay||100));const h=new ImageData(o.patch,o.dims.width,o.dims.height),c=Tt(h),p=o.disposalType===3?a.getImageData(o.dims.left,o.dims.top,o.dims.width,o.dims.height):void 0;a.drawImage(c,o.dims.left,o.dims.top);const m=a.getImageData(0,0,r,n);d.push(m),o.disposalType===1||(o.disposalType===2?a.clearRect(o.dims.left,o.dims.top,o.dims.width,o.dims.height):o.disposalType===3&&a.putImageData(p,o.dims.left,o.dims.top))}return{frameDurations:u,getFrame:o=>d[o],width:r,height:n}}const Ht=[71,73,70];function qt(l){const e=new Uint8Array(l);return!Ht.some((t,i)=>t!==e[i])}function Wt(l){if(!qt(l))return!1;const e=new DataView(l),t=e.getUint8(10);let i=13+(128&t?3*2**(1+(7&t)):0),r=0,n=!1;for(;!n;){switch(e.getUint8(i++)){case 33:if(!s())return!1;break;case 44:a();break;case 59:n=!0;break;default:return!1}if(r>1)return!0}function s(){switch(e.getUint8(i++)){case 249:d();break;case 1:u();break;case 254:o();break;case 255:h();break;default:return!1}return!0}function a(){r++,i+=8;const p=e.getUint8(i++);i+=128&p?3*2**(1+(7&p)):0,i++,c()}function d(){i++,i+=4,c()}function u(){r++,i++,i+=12,c()}function o(){c()}function h(){i++,i+=8,i+=3,c()}function c(){let p;for(;p=e.getUint8(i++);)i+=p}return!1}let Vt=class{constructor(){this._resourceMap=new Map,this._inFlightResourceMap=new Map,this.geometryEngine=null,this.geometryEnginePromise=null}destroy(){this._inFlightResourceMap.clear(),this._resourceMap.clear()}getResource(e){return this._resourceMap.get(e)??null}async fetchResource(e,t){const i=this._resourceMap.get(e);if(i)return{width:i.width,height:i.height};let r=this._inFlightResourceMap.get(e);return r?r.then(n=>({width:n.width,height:n.height})):(r=Xt(e,t),this._inFlightResourceMap.set(e,r),r.then(n=>(this._inFlightResourceMap.delete(e),this._resourceMap.set(e,n),{width:n.width,height:n.height}),()=>({width:0,height:0})))}deleteResource(e){this._inFlightResourceMap.delete(e),this._resourceMap.delete(e)}};async function jt(l,e){const t=window.URL.createObjectURL(l);try{const{data:i}=await Y(t,{...e,responseType:"image"});return i}catch(i){throw Ue(i)?i:new se("mapview-invalid-resource",`Could not fetch requested resource at ${t}`)}finally{window.URL.revokeObjectURL(t)}}async function Xt(l,e){const{arrayBuffer:t,mediaType:i}=await Yt(l,e),r=i==="image/png";return i==="image/gif"&&Wt(t)?Gt(t):r&&kt(t)?Nt(t,e):jt(new Blob([t],{type:i}),e)}async function Yt(l,e){let t;const i=";base64,";if(l.includes(i)){const r=l.indexOf(i),n=l.indexOf(i)+i.length,s=l.substring(n),a=atob(s),d=new Uint8Array(a.length);for(let u=0;u<a.length;u++)d[u]=a.charCodeAt(u);t={arrayBuffer:d.buffer,mediaType:l.substring(0,r).replace("data:","")}}else try{const r=await Y(l,{responseType:"array-buffer",...e});t={arrayBuffer:r.data,mediaType:r.getHeader("Content-Type")}}catch(r){if(!Ue(r))throw new se("mapview-invalid-resource",`Could not fetch requested resource at ${l}`)}return t}const Kt={background:{"background.frag":`#ifdef PATTERN
uniform lowp float u_opacity;
uniform lowp sampler2D u_texture;
varying mediump vec4 v_tlbr;
varying mediump vec2 v_tileTextureCoord;
#else
uniform lowp vec4 u_color;
#endif
#ifdef ID
varying mediump vec4 v_id;
#endif
void main() {
#ifdef PATTERN
mediump vec2 normalizedTextureCoord = mod(v_tileTextureCoord, 1.0);
mediump vec2 samplePos = mix(v_tlbr.xy, v_tlbr.zw, normalizedTextureCoord);
lowp vec4 color = texture2D(u_texture, samplePos);
gl_FragColor = u_opacity * color;
#else
gl_FragColor = u_color;
#endif
#ifdef ID
if (gl_FragColor.a < 1.0 / 255.0) {
discard;
}
gl_FragColor = v_id;
#endif
}`,"background.vert":`precision mediump float;
attribute vec2 a_pos;
#ifdef ID
uniform mediump vec4 u_id;
varying mediump vec4 v_id;
#endif
uniform highp mat3 u_dvsMat3;
uniform mediump float u_coord_range;
uniform mediump float u_depth;
#ifdef PATTERN
uniform mediump mat3 u_pattern_matrix;
varying mediump vec2 v_tileTextureCoord;
uniform mediump vec4 u_tlbr;
uniform mediump vec2 u_mosaicSize;
varying mediump vec4 v_tlbr;
#endif
void main() {
gl_Position = vec4((u_dvsMat3 * vec3(u_coord_range * a_pos, 1.0)).xy, u_depth, 1.0);
#ifdef PATTERN
v_tileTextureCoord = (u_pattern_matrix * vec3(a_pos, 1.0)).xy;
v_tlbr             = u_tlbr / u_mosaicSize.xyxy;
#endif
#ifdef ID
v_id = u_id / 255.0;
#endif
}`},circle:{"circle.frag":`precision lowp float;
varying lowp vec4 v_color;
varying lowp vec4 v_stroke_color;
varying mediump float v_blur;
varying mediump float v_stroke_width;
varying mediump float v_radius;
varying mediump vec2 v_offset;
#ifdef ID
varying mediump vec4 v_id;
#endif
void main()
{
mediump float dist = length(v_offset);
mediump float alpha = smoothstep(0.0, -v_blur, dist - 1.0);
lowp float color_mix_ratio = v_stroke_width < 0.01 ? 0.0 : smoothstep(-v_blur, 0.0, dist - v_radius / (v_radius + v_stroke_width));
gl_FragColor = alpha * mix(v_color, v_stroke_color, color_mix_ratio);
#ifdef ID
if (gl_FragColor.a < 1.0 / 255.0) {
discard;
}
gl_FragColor = v_id;
#endif
}`,"circle.vert":`precision mediump float;
attribute vec2 a_pos;
#pragma header
varying lowp vec4 v_color;
varying lowp vec4 v_stroke_color;
varying mediump float v_blur;
varying mediump float v_stroke_width;
varying mediump float v_radius;
varying mediump vec2 v_offset;
#ifdef ID
uniform mediump vec4 u_id;
varying mediump vec4 v_id;
#endif
uniform highp mat3 u_dvsMat3;
uniform highp mat3 u_displayMat3;
uniform mediump vec2 u_circleTranslation;
uniform mediump float u_depth;
uniform mediump float u_antialiasingWidth;
void main()
{
#pragma main
v_color = color * opacity;
v_stroke_color = stroke_color * stroke_opacity;
v_stroke_width = stroke_width;
v_radius = radius;
v_blur = max(blur, u_antialiasingWidth / (radius + stroke_width));
mediump vec2 offset = vec2(mod(a_pos, 2.0) * 2.0 - 1.0);
v_offset = offset;
#ifdef ID
v_id = u_id / 255.0;
#endif
mediump vec3 pos = u_dvsMat3 * vec3(a_pos * 0.5, 1.0) + u_displayMat3 * vec3((v_radius + v_stroke_width) * offset + u_circleTranslation, 0.0);
gl_Position = vec4(pos.xy, u_depth, 1.0);
}`},fill:{"fill.frag":`precision lowp float;
#ifdef PATTERN
uniform lowp sampler2D u_texture;
varying mediump vec2 v_tileTextureCoord;
varying mediump vec4 v_tlbr;
#endif
#ifdef ID
varying mediump vec4 v_id;
#endif
varying lowp vec4 v_color;
vec4 mixColors(vec4 color1, vec4 color2) {
float compositeAlpha = color2.a + color1.a * (1.0 - color2.a);
vec3 compositeColor = color2.rgb + color1.rgb * (1.0 - color2.a);
return vec4(compositeColor, compositeAlpha);
}
void main()
{
#ifdef PATTERN
mediump vec2 normalizedTextureCoord = fract(v_tileTextureCoord);
mediump vec2 samplePos = mix(v_tlbr.xy, v_tlbr.zw, normalizedTextureCoord);
lowp vec4 color = texture2D(u_texture, samplePos);
gl_FragColor = v_color[3] * color;
#else
gl_FragColor = v_color;
#endif
#ifdef ID
if (gl_FragColor.a < 1.0 / 255.0) {
discard;
}
gl_FragColor = v_id;
#endif
}`,"fill.vert":`precision mediump float;
attribute vec2 a_pos;
#pragma header
uniform highp mat3 u_dvsMat3;
uniform highp mat3 u_displayMat3;
uniform mediump float u_depth;
uniform mediump vec2 u_fillTranslation;
#ifdef PATTERN
#include <util/util.glsl>
uniform mediump vec2 u_mosaicSize;
uniform mediump float u_patternFactor;
varying mediump vec2 v_tileTextureCoord;
varying mediump vec4 v_tlbr;
#endif
#ifdef ID
uniform mediump vec4 u_id;
varying mediump vec4 v_id;
#endif
varying lowp vec4 v_color;
void main()
{
#pragma main
v_color = color * opacity;
#ifdef ID
v_id = u_id / 255.0;
#endif
#ifdef PATTERN
float patternWidth = nextPOT(tlbr.z - tlbr.x);
float patternHeight = nextPOT(tlbr.w - tlbr.y);
float scaleX = 1.0 / (patternWidth * u_patternFactor);
float scaleY = 1.0 / (patternHeight * u_patternFactor);
mat3 patterMat = mat3(scaleX, 0.0,    0.0,
0.0,    -scaleY, 0.0,
0.0,    0.0,    1.0);
v_tileTextureCoord = (patterMat * vec3(a_pos, 1.0)).xy;
v_tlbr             = tlbr / u_mosaicSize.xyxy;
#endif
vec3 pos = u_dvsMat3 * vec3(a_pos, 1.0) + u_displayMat3 * vec3(u_fillTranslation, 0.0);
gl_Position = vec4(pos.xy, u_depth, 1.0);
}`},icon:{"icon.frag":`precision mediump float;
uniform lowp sampler2D u_texture;
#ifdef SDF
uniform lowp vec4 u_color;
uniform lowp vec4 u_outlineColor;
#endif
varying mediump vec2 v_tex;
varying lowp float v_opacity;
varying mediump vec2 v_size;
varying lowp vec4 v_color;
#ifdef SDF
varying mediump flaot v_halo_width;
#endif
#ifdef ID
varying mediump vec4 v_id;
#endif
#include <util/encoding.glsl>
vec4 mixColors(vec4 color1, vec4 color2) {
float compositeAlpha = color2.a + color1.a * (1.0 - color2.a);
vec3 compositeColor = color2.rgb + color1.rgb * (1.0 - color2.a);
return vec4(compositeColor, compositeAlpha);
}
void main()
{
#ifdef SDF
lowp vec4 fillPixelColor = v_color;
float d = rgba2float(texture2D(u_texture, v_tex)) - 0.5;
const float softEdgeRatio = 0.248062016;
float size = max(v_size.x, v_size.y);
float dist = d * softEdgeRatio * size;
fillPixelColor *= clamp(0.5 - dist, 0.0, 1.0);
if (v_halo_width > 0.25) {
lowp vec4 outlinePixelColor = u_outlineColor;
const float outlineLimitRatio = (16.0 / 86.0);
float clampedOutlineSize = softEdgeRatio * min(v_halo_width, outlineLimitRatio * max(v_size.x, v_size.y));
outlinePixelColor *= clamp(0.5 - (abs(dist) - clampedOutlineSize), 0.0, 1.0);
gl_FragColor = v_opacity * mixColors(fillPixelColor, outlinePixelColor);
}
else {
gl_FragColor = v_opacity * fillPixelColor;
}
#else
lowp vec4 texColor = texture2D(u_texture, v_tex);
gl_FragColor = v_opacity * texColor;
#endif
#ifdef ID
if (gl_FragColor.a < 1.0 / 255.0) {
discard;
}
gl_FragColor = v_id;
#endif
}`,"icon.vert":`attribute vec2 a_pos;
attribute vec2 a_vertexOffset;
attribute vec4 a_texAngleRange;
attribute vec4 a_levelInfo;
attribute float a_opacityInfo;
#pragma header
#ifdef ID
uniform mediump vec4 u_id;
varying mediump vec4 v_id;
#endif
varying lowp vec4 v_color;
#ifdef SDF
varying mediump float v_halo_width;
#endif
uniform highp mat3 u_dvsMat3;
uniform highp mat3 u_displayMat3;
uniform highp mat3 u_displayViewMat3;
uniform mediump vec2 u_iconTranslation;
uniform vec2 u_mosaicSize;
uniform mediump float u_depth;
uniform mediump float u_mapRotation;
uniform mediump float u_level;
uniform lowp float u_keepUpright;
uniform mediump float u_fadeDuration;
varying mediump vec2 v_tex;
varying lowp float v_opacity;
varying mediump vec2 v_size;
const float C_OFFSET_PRECISION = 1.0 / 8.0;
const float C_256_TO_RAD = 3.14159265359 / 128.0;
const float C_DEG_TO_RAD = 3.14159265359 / 180.0;
const float tileCoordRatio = 1.0 / 8.0;
uniform highp float u_time;
void main()
{
#pragma main
v_color = color;
v_opacity = opacity;
#ifdef SDF
v_halo_width = halo_width;
#endif
float modded = mod(a_opacityInfo, 128.0);
float targetOpacity = (a_opacityInfo - modded) / 128.0;
float startOpacity = modded / 127.0;
float interpolatedOpacity = clamp(startOpacity + 2.0 * (targetOpacity - 0.5) * u_time / u_fadeDuration, 0.0, 1.0);
v_opacity *= interpolatedOpacity;
mediump float a_angle         = a_levelInfo[1];
mediump float a_minLevel      = a_levelInfo[2];
mediump float a_maxLevel      = a_levelInfo[3];
mediump vec2 a_tex            = a_texAngleRange.xy;
mediump float delta_z = 0.0;
mediump float rotated = mod(a_angle + u_mapRotation, 256.0);
delta_z += (1.0 - step(u_keepUpright, 0.0)) * step(64.0, rotated) * (1.0 - step(192.0, rotated));
delta_z += 1.0 - step(a_minLevel, u_level);
delta_z += step(a_maxLevel, u_level);
delta_z += step(v_opacity, 0.0);
vec2 offset = C_OFFSET_PRECISION * a_vertexOffset;
v_size = abs(offset);
#ifdef SDF
offset = (120.0 / 86.0) * offset;
#endif
mediump vec3 pos = u_dvsMat3 * vec3(a_pos, 1.0) + u_displayViewMat3 * vec3(size * offset, 0.0) + u_displayMat3 * vec3(u_iconTranslation, 0.0);
gl_Position = vec4(pos.xy, u_depth + delta_z, 1.0);
#ifdef ID
v_id = u_id / 255.0;
#endif
v_tex = a_tex.xy / u_mosaicSize;
}`},line:{"line.frag":`precision lowp float;
varying mediump vec2 v_normal;
varying highp float v_accumulatedDistance;
varying mediump float v_lineHalfWidth;
varying lowp vec4 v_color;
varying mediump float v_blur;
#if defined (PATTERN) || defined(SDF)
varying mediump vec4 v_tlbr;
varying mediump vec2 v_patternSize;
varying mediump float v_widthRatio;
uniform sampler2D u_texture;
uniform mediump float u_antialiasing;
#endif
#ifdef SDF
#include <util/encoding.glsl>
#endif
#ifdef ID
varying mediump vec4 v_id;
#endif
void main()
{
mediump float fragDist = length(v_normal) * v_lineHalfWidth;
lowp float alpha = clamp((v_lineHalfWidth - fragDist) / v_blur, 0.0, 1.0);
#ifdef PATTERN
mediump float relativeTexX = fract(v_accumulatedDistance / (v_patternSize.x * v_widthRatio));
mediump float relativeTexY = 0.5 + v_normal.y * v_lineHalfWidth / (v_patternSize.y * v_widthRatio);
mediump vec2 texCoord = mix(v_tlbr.xy, v_tlbr.zw, vec2(relativeTexX, relativeTexY));
lowp vec4 color = texture2D(u_texture, texCoord);
gl_FragColor = alpha * v_color[3] * color;
#elif defined(SDF)
mediump float relativeTexX = fract((v_accumulatedDistance * 0.5) / (v_patternSize.x * v_widthRatio));
mediump float relativeTexY =  0.5 + 0.25 * v_normal.y;
mediump vec2 texCoord = mix(v_tlbr.xy, v_tlbr.zw, vec2(relativeTexX, relativeTexY));
mediump float d = rgba2float(texture2D(u_texture, texCoord)) - 0.5;
float dist = d * (v_lineHalfWidth + u_antialiasing / 2.0);
gl_FragColor = alpha * clamp(0.5 - dist, 0.0, 1.0) * v_color;
#else
gl_FragColor = alpha * v_color;
#endif
#ifdef ID
if (gl_FragColor.a < 1.0 / 255.0) {
discard;
}
gl_FragColor = v_id;
#endif
}`,"line.vert":`precision mediump float;
attribute vec2 a_pos;
attribute vec4 a_extrude_offset;
attribute vec4 a_dir_normal;
attribute vec2 a_accumulatedDistance;
#pragma header
uniform highp mat3 u_dvsMat3;
uniform highp mat3 u_displayMat3;
uniform highp mat3 u_displayViewMat3;
uniform mediump float u_zoomFactor;
uniform mediump vec2 u_lineTranslation;
uniform mediump float u_antialiasing;
uniform mediump float u_depth;
varying mediump vec2 v_normal;
varying highp float v_accumulatedDistance;
const float scale = 1.0 / 31.0;
const mediump float tileCoordRatio = 8.0;
#if defined (SDF)
const mediump float sdfPatternHalfWidth = 15.5;
#endif
#if defined (PATTERN) || defined(SDF)
uniform mediump vec2 u_mosaicSize;
varying mediump vec4 v_tlbr;
varying mediump vec2 v_patternSize;
varying mediump float v_widthRatio;
#endif
#ifdef ID
uniform mediump vec4 u_id;
varying mediump vec4 v_id;
#endif
varying lowp vec4 v_color;
varying mediump float v_lineHalfWidth;
varying mediump float v_blur;
void main()
{
#pragma main
v_color = color * opacity;
v_blur = blur + u_antialiasing;
v_normal = a_dir_normal.zw * scale;
#if defined (PATTERN) || defined(SDF)
v_tlbr          = tlbr / u_mosaicSize.xyxy;
v_patternSize   = vec2(tlbr.z - tlbr.x, tlbr.y - tlbr.w);
#if defined (PATTERN)
v_widthRatio = width / v_patternSize.y;
#else
v_widthRatio = width / sdfPatternHalfWidth / 2.0;
#endif
#endif
v_lineHalfWidth = (width + u_antialiasing) * 0.5;
mediump vec2 dir = a_dir_normal.xy * scale;
mediump vec2 offset_ = a_extrude_offset.zw * scale * offset;
mediump vec2 dist = v_lineHalfWidth * scale * a_extrude_offset.xy;
mediump vec3 pos = u_dvsMat3 * vec3(a_pos + offset_ * tileCoordRatio / u_zoomFactor, 1.0) + u_displayViewMat3 * vec3(dist, 0.0) + u_displayMat3 * vec3(u_lineTranslation, 0.0);
gl_Position = vec4(pos.xy, u_depth, 1.0);
#if defined (PATTERN) || defined(SDF)
v_accumulatedDistance = a_accumulatedDistance.x * u_zoomFactor / tileCoordRatio + dot(dir, dist + offset_);
#endif
#ifdef ID
v_id = u_id / 255.0;
#endif
}`},outline:{"outline.frag":`varying lowp vec4 v_color;
varying mediump vec2 v_normal;
#ifdef ID
varying mediump vec4 v_id;
#endif
void main()
{
lowp float dist = abs(v_normal.y);
lowp float alpha = smoothstep(1.0, 0.0, dist);
gl_FragColor = alpha * v_color;
#ifdef ID
if (gl_FragColor.a < 1.0 / 255.0) {
discard;
}
gl_FragColor = v_id;
#endif
}`,"outline.vert":`attribute vec2 a_pos;
attribute vec2 a_offset;
attribute vec2 a_xnormal;
#pragma header
varying lowp vec4 v_color;
#ifdef ID
uniform mediump vec4 u_id;
varying mediump vec4 v_id;
#endif
uniform highp mat3 u_dvsMat3;
uniform highp mat3 u_displayMat3;
uniform mediump vec2 u_fillTranslation;
uniform mediump float u_depth;
uniform mediump float u_outline_width;
varying lowp vec2 v_normal;
const float scale = 1.0 / 15.0;
void main()
{
#pragma main
v_color = color * opacity;
#ifdef ID
v_id = u_id / 255.0;
#endif
v_normal = a_xnormal;
mediump vec2 dist = u_outline_width * scale * a_offset;
mediump vec3 pos = u_dvsMat3 * vec3(a_pos, 1.0) + u_displayMat3 * vec3(dist + u_fillTranslation, 0.0);
gl_Position = vec4(pos.xy, u_depth, 1.0);
}`},text:{"text.frag":`uniform lowp sampler2D u_texture;
varying lowp vec2 v_tex;
varying lowp vec4 v_color;
varying mediump float v_edgeWidth;
varying mediump float v_edgeDistance;
#ifdef ID
varying mediump vec4 v_id;
#endif
void main()
{
lowp float dist = texture2D(u_texture, v_tex).a;
mediump float alpha = smoothstep(v_edgeDistance - v_edgeWidth, v_edgeDistance + v_edgeWidth, dist);
gl_FragColor = alpha * v_color;
#ifdef ID
if (gl_FragColor.a < 1.0 / 255.0) {
discard;
}
gl_FragColor = v_id;
#endif
}`,"text.vert":`attribute vec2 a_pos;
attribute vec2 a_vertexOffset;
attribute vec4 a_texAngleRange;
attribute vec4 a_levelInfo;
attribute float a_opacityInfo;
#pragma header
varying lowp vec4 v_color;
#ifdef ID
uniform mediump vec4 u_id;
varying mediump vec4 v_id;
#endif
uniform highp mat3 u_dvsMat3;
uniform highp mat3 u_displayMat3;
uniform highp mat3 u_displayViewMat3;
uniform mediump vec2 u_textTranslation;
uniform vec2 u_mosaicSize;
uniform mediump float u_depth;
uniform mediump float u_mapRotation;
uniform mediump float u_level;
uniform lowp float u_keepUpright;
uniform mediump float u_fadeDuration;
varying lowp vec2 v_tex;
const float offsetPrecision = 1.0 / 8.0;
const mediump float edgePos = 0.75;
uniform mediump float u_antialiasingWidth;
varying mediump float v_edgeDistance;
varying mediump float v_edgeWidth;
uniform lowp float u_halo;
const float sdfFontScale = 1.0 / 24.0;
const float sdfPixel = 3.0;
uniform highp float u_time;
void main()
{
#pragma main
if (u_halo > 0.5)
{
v_color = halo_color * opacity;
halo_width *= sdfPixel;
halo_blur *= sdfPixel;
}
else
{
v_color = color * opacity;
halo_width = 0.0;
halo_blur = 0.0;
}
float modded = mod(a_opacityInfo, 128.0);
float targetOpacity = (a_opacityInfo - modded) / 128.0;
float startOpacity = modded / 127.0;
float interpolatedOpacity = clamp(startOpacity + 2.0 * (targetOpacity - 0.5) * u_time / u_fadeDuration, 0.0, 1.0);
v_color *= interpolatedOpacity;
mediump float a_angle       = a_levelInfo[1];
mediump float a_minLevel    = a_levelInfo[2];
mediump float a_maxLevel    = a_levelInfo[3];
mediump vec2 a_tex          = a_texAngleRange.xy;
mediump float a_visMinAngle    = a_texAngleRange.z;
mediump float a_visMaxAngle    = a_texAngleRange.w;
mediump float delta_z = 0.0;
mediump float angle = mod(a_angle + u_mapRotation, 256.0);
if (a_visMinAngle < a_visMaxAngle)
{
delta_z += (1.0 - step(u_keepUpright, 0.0)) * (step(a_visMaxAngle, angle) + (1.0 - step(a_visMinAngle, angle)));
}
else
{
delta_z += (1.0 - step(u_keepUpright, 0.0)) * (step(a_visMaxAngle, angle) * (1.0 - step(a_visMinAngle, angle)));
}
delta_z += 1.0 - step(a_minLevel, u_level);
delta_z += step(a_maxLevel, u_level);
delta_z += step(v_color[3], 0.0);
v_tex = a_tex.xy / u_mosaicSize;
#ifdef ID
v_id = u_id / 255.0;
#endif
v_edgeDistance = edgePos - halo_width / size;
v_edgeWidth = (u_antialiasingWidth + halo_blur) / size;
mediump vec3 pos = u_dvsMat3 * vec3(a_pos, 1.0) + sdfFontScale * u_displayViewMat3 * vec3(offsetPrecision * size * a_vertexOffset, 0.0) + u_displayMat3 * vec3(u_textTranslation, 0.0);
gl_Position = vec4(pos.xy, u_depth + delta_z, 1.0);
}`},util:{"encoding.glsl":`const vec4 rgba2float_factors = vec4(
255.0 / (256.0),
255.0 / (256.0 * 256.0),
255.0 / (256.0 * 256.0 * 256.0),
255.0 / (256.0 * 256.0 * 256.0 * 256.0)
);
float rgba2float(vec4 rgba) {
return dot(rgba, rgba2float_factors);
}`,"util.glsl":`float nextPOT(in float x) {
return pow(2.0, ceil(log2(abs(x))));
}`}};function Jt(l){let e=Kt;return l.split("/").forEach(t=>{e&&(e=e[t])}),e}const Qt=new Ft(Jt);function C(l){return Qt.resolveIncludes(l)}const Ee=l=>G({ID:l.id,PATTERN:l.pattern}),Zt={shaders:l=>({vertexShader:Ee(l)+C("background/background.vert"),fragmentShader:Ee(l)+C("background/background.frag")})},Re=l=>G({ID:l.id}),ei={shaders:l=>({vertexShader:Re(l)+C("circle/circle.vert"),fragmentShader:Re(l)+C("circle/circle.frag")})},Be=l=>G({ID:l.id,PATTERN:l.pattern}),ti={shaders:l=>({vertexShader:Be(l)+C("fill/fill.vert"),fragmentShader:Be(l)+C("fill/fill.frag")})},Fe=l=>G({ID:l.id}),ii={shaders:l=>({vertexShader:Fe(l)+C("outline/outline.vert"),fragmentShader:Fe(l)+C("outline/outline.frag")})},Oe=l=>G({ID:l.id,SDF:l.sdf}),ri={shaders:l=>({vertexShader:Oe(l)+C("icon/icon.vert"),fragmentShader:Oe(l)+C("icon/icon.frag")})},Me=l=>G({ID:l.id,PATTERN:l.pattern,SDF:l.sdf}),si={shaders:l=>({vertexShader:Me(l)+C("line/line.vert"),fragmentShader:Me(l)+C("line/line.frag")})},Pe=l=>G({ID:l.id}),ni={shaders:l=>({vertexShader:Pe(l)+C("text/text.vert"),fragmentShader:Pe(l)+C("text/text.frag")})};let ai=class{constructor(){this._programByKey=new Map}dispose(){this._programByKey.forEach(e=>e.dispose()),this._programByKey.clear()}getMaterialProgram(e,t,i){const r=t.key<<3|this._getMaterialOptionsValue(t.type,i);if(this._programByKey.has(r))return this._programByKey.get(r);const n=this._getProgramTemplate(t.type),{shaders:s}=n,{vertexShader:a,fragmentShader:d}=s(i),u=t.getShaderHeader(),o=t.getShaderMain(),h=a.replace("#pragma header",u).replace("#pragma main",o),c=e.programCache.acquire(h,d,t.getAttributeLocations());return this._programByKey.set(r,c),c}_getMaterialOptionsValue(e,t){switch(e){case P.BACKGROUND:{const i=t;return(i.pattern?1:0)<<1|(i.id?1:0)}case P.FILL:{const i=t;return(i.pattern?1:0)<<1|(i.id?1:0)}case P.OUTLINE:return t.id?1:0;case P.LINE:{const i=t;return(i.sdf?1:0)<<2|(i.pattern?1:0)<<1|(i.id?1:0)}case P.ICON:{const i=t;return(i.sdf?1:0)<<1|(i.id?1:0)}case P.CIRCLE:return t.id?1:0;case P.TEXT:return t.id?1:0;default:return 0}}_getProgramTemplate(e){switch(e){case P.BACKGROUND:return Zt;case P.CIRCLE:return ei;case P.FILL:return ti;case P.ICON:return ri;case P.LINE:return si;case P.OUTLINE:return ii;case P.TEXT:return ni;default:return null}}},Le=class{constructor(){this._initialized=!1}dispose(){this._program=T(this._program),this._vertexArrayObject=T(this._vertexArrayObject)}render(e,t,i,r){e&&(this._initialized||this._initialize(e),e.setBlendFunctionSeparate(g.ONE,g.ONE_MINUS_SRC_ALPHA,g.ONE,g.ONE_MINUS_SRC_ALPHA),e.bindVAO(this._vertexArrayObject),e.useProgram(this._program),t.setSamplingMode(i),e.bindTexture(t,0),this._program.setUniform1i("u_tex",0),this._program.setUniform1f("u_opacity",r),e.drawArrays(V.TRIANGLE_STRIP,0,4),e.bindTexture(null,0),e.bindVAO())}_initialize(e){if(this._initialized)return!0;const t=K(e,me);if(!t)return!1;const i=new Int8Array(16);i[0]=-1,i[1]=-1,i[2]=0,i[3]=0,i[4]=1,i[5]=-1,i[6]=1,i[7]=0,i[8]=-1,i[9]=1,i[10]=0,i[11]=1,i[12]=1,i[13]=1,i[14]=1,i[15]=1;const r=me.attributes,n=new ae(e,r,Rt,{geometry:oe.createVertex(e,le.STATIC_DRAW,i)});return this._program=t,this._vertexArrayObject=n,this._initialized=!0,!0}};const $e=l=>l===S.HITTEST||l===S.LABEL_ALPHA,oi=l=>($e(l)?1:0)|(l===S.HIGHLIGHT?2:0),li=({rendererInfo:l,drawPhase:e},t,i)=>`${t.getVariationHash()}-${oi(e)}-${l.getVariationHash()}-${B(i)&&i.join(".")}`,di=(l,e,t,i={})=>{if(i={...i,...e.getVariation(),...l.rendererInfo.getVariation(),highlight:l.drawPhase===S.HIGHLIGHT,id:$e(l.drawPhase)},B(t))for(const r of t)i[r]=!0;return i};let ui=class{constructor(e){this._rctx=e,this._programByKey=new Map}dispose(){this._programByKey.forEach(e=>e.dispose()),this._programByKey.clear()}getProgram(e,t=[]){const i=e.vsPath+"."+e.fsPath+JSON.stringify(t);if(this._programByKey.has(i))return this._programByKey.get(i);const r={...t.map(o=>typeof o=="string"?{name:o,value:!0}:o).reduce((o,h)=>({...o,[h.name]:h.value}),{})},{vsPath:n,fsPath:s,attributes:a}=e,d=Te(n,s,a,r),u=this._rctx.programCache.acquire(d.shaders.vertexShader,d.shaders.fragmentShader,d.attributes);if(!u)throw new Error("Unable to get program for key: ${key}");return this._programByKey.set(i,u),u}getMaterialProgram(e,t,i,r,n){const s=li(e,t,n);if(this._programByKey.has(s))return this._programByKey.get(s);const a=di(e,t,n,{ignoresSamplerPrecision:e.context.driverTest.ignoresSamplerPrecision.result}),d=Te(i,i,r,a),u=this._rctx.programCache.acquire(d.shaders.vertexShader,d.shaders.fragmentShader,d.attributes);if(!u)throw new Error("Unable to get program for key: ${key}");return this._programByKey.set(s,u),u}},hi=class{constructor(e,t){this._queue=[],this._context=e,this._refreshable=t}destroy(){this._queue=[]}enqueueTextureUpdate(e,t){const i=Ge(),r=e,n=St,s=Math.ceil(r.height/n);if(re(t),this._context.type===Ie.WEBGL1)this._queue.push({type:"no-chunk",request:e,resolver:i,options:t});else for(let a=0;a<s;a++){const d=a*n,u=a===s-1,o=u?r.height-n*a:n;this._queue.push({type:"chunk",request:e,resolver:i,chunk:a,chunkOffset:d,destHeight:o,chunkIsLast:u,options:t})}return He(t,a=>i.reject(a)),i.promise}upload(){let e=0;for(;this._queue.length;){const t=performance.now(),i=this._queue.shift();if(i){if(B(i.options.signal)&&i.options.signal.aborted)continue;switch(i.type){case"chunk":this._uploadChunk(i);break;case"no-chunk":this._uploadNoChunk(i)}const r=performance.now()-t;if(e+=r,e+r>=Ct)break}}this._queue.length&&this._refreshable.requestRender()}_uploadChunk(e){const{request:t,resolver:i,chunkOffset:r,chunkIsLast:n,destHeight:s}=e,{data:a,texture:d,width:u}=t;B(a)&&(d.updateData(0,0,r,u,s,a,r),n&&i.resolve())}_uploadNoChunk(e){const{request:t,resolver:i}=e,{data:r,texture:n}=t;n.setData(r),i.resolve()}};const ci=je(-.5,-.5);let _i=class{constructor(){this._centerNdc=J(),this._pxToNdc=J(),this._worldDimensionsPx=J(),this._mat3=ne(),this._initialized=!1}dispose(){this._program=T(this._program),this._quad=T(this._quad)}render(e,t){const{context:i}=e;return!!this._updateGeometry(e,t)&&(this._initialized||this._initialize(i),i.setDepthWriteEnabled(!1),i.setDepthTestEnabled(!1),i.setColorMask(!1,!1,!1,!1),i.setBlendingEnabled(!1),i.setStencilOp(te.KEEP,te.KEEP,te.REPLACE),i.setStencilFunction(ze.ALWAYS,1,255),i.setStencilTestEnabled(!0),i.useProgram(this._program),this._program.setUniformMatrix3fv("u_worldExtent",this._mat3),this._quad.draw(),this._quad.unbind(),!0)}_initialize(e){if(this._initialized)return;const t=K(e,ct);t&&(this._program=t,this._quad=new H(e,[0,0,1,0,0,1,1,1]),this._initialized=!0)}_updateGeometry(e,t){const{state:i,pixelRatio:r}=e,{size:n,rotation:s}=i,a=Math.round(n[0]*r),d=Math.round(n[1]*r);if(!i.spatialReference.isWrappable)return!1;const u=Xe(s),o=Math.abs(Math.cos(u)),h=Math.abs(Math.sin(u)),c=Math.round(a*o+d*h),p=Math.round(i.worldScreenWidth);if(c<=p)return!1;const m=a*h+d*o,b=p*r,E=(t.left-t.right)*r/a,v=(t.bottom-t.top)*r/d;Q(this._worldDimensionsPx,b,m,1),Q(this._pxToNdc,2/a,-2/d,1),Q(this._centerNdc,E,v,1);const _=this._mat3;return qe(_,this._centerNdc),ue(_,_,this._pxToNdc),s!==0&&We(_,_,u),ue(_,_,this._worldDimensionsPx),Ve(_,_,ci),!0}},pi=class extends j{constructor(){super(...arguments),this.defines=[],this._desc={vsPath:"fx/integrate",fsPath:"fx/integrate",attributes:new Map([["a_position",0]])}}dispose(){this._quad&&this._quad.dispose()}bind(){}unbind(){}draw(e,t){if(!(t!=null&&t.size))return;const{context:i,renderingOptions:r}=e;this._quad||(this._quad=new H(i,[0,0,1,0,0,1,1,1]));const n=i.getBoundFramebufferObject(),{x:s,y:a,width:d,height:u}=i.getViewport();t.bindTextures(i);const o=t.getBlock(At);if(N(o))return;const h=o.getFBO(i),c=o.getFBO(i,1);i.setViewport(0,0,t.size,t.size),this._computeDelta(e,c,r.labelsAnimationTime),this._updateAnimationState(e,c,h),i.bindFramebuffer(n),i.setViewport(s,a,d,u)}_computeDelta(e,t,i){const{context:r,painter:n,displayLevel:s}=e,a=n.materialManager.getProgram(this._desc,["delta"]);r.bindFramebuffer(t),r.setClearColor(0,0,0,0),r.clear(r.gl.COLOR_BUFFER_BIT),r.useProgram(a),a.setUniform1i("u_maskTexture",Dt),a.setUniform1i("u_sourceTexture",Ut),a.setUniform1f("u_timeDelta",e.deltaTime),a.setUniform1f("u_animationTime",i),a.setUniform1f("u_zoomLevel",Math.round(10*s)),this._quad.draw()}_updateAnimationState(e,t,i){const{context:r,painter:n}=e,s=n.materialManager.getProgram(this._desc,["update"]);r.bindTexture(t.colorTexture,1),r.useProgram(s),s.setUniform1i("u_sourceTexture",1),r.bindFramebuffer(i),r.setClearColor(0,0,0,0),r.clear(r.gl.COLOR_BUFFER_BIT),this._quad.draw()}};class Ce extends j{constructor(e){super(),this.name=this.constructor.name,this.defines=[e]}dispose(){}bind({context:e,painter:t}){this._prev=e.getBoundFramebufferObject();const{width:i,height:r}=e.getViewport(),n=t.getFbos(i,r).effect0;e.bindFramebuffer(n),e.setColorMask(!0,!0,!0,!0),e.setClearColor(0,0,0,0),e.clear(e.gl.COLOR_BUFFER_BIT)}unbind(){}draw(e,t){const{context:i,painter:r}=e,n=r.getPostProcessingEffects(t),s=i.getBoundFramebufferObject();for(const{postProcessingEffect:a,effect:d}of n)a.draw(e,s,d);i.bindFramebuffer(this._prev),i.setStencilTestEnabled(!1),r.blitTexture(i,s.colorTexture,x.NEAREST),i.setStencilTestEnabled(!0)}}let fi=class{constructor(){this._width=void 0,this._height=void 0,this._resources=null}dispose(){this._resources&&(this._resources.quadGeometry.dispose(),this._resources.quadVAO.dispose(),this._resources.highlightProgram.dispose(),this._resources.blurProgram.dispose(),this._resources=null)}preBlur(e,t){e.bindTexture(t,W),e.useProgram(this._resources.blurProgram),this._resources.blurProgram.setUniform4fv("u_direction",[1,0,1/this._width,0]),this._resources.blurProgram.setUniformMatrix4fv("u_channelSelector",xt),e.bindVAO(this._resources.quadVAO),e.drawArrays(V.TRIANGLE_STRIP,0,4),e.bindVAO()}finalBlur(e,t){e.bindTexture(t,W),e.useProgram(this._resources.blurProgram),this._resources.blurProgram.setUniform4fv("u_direction",[0,1,0,1/this._height]),this._resources.blurProgram.setUniformMatrix4fv("u_channelSelector",wt),e.bindVAO(this._resources.quadVAO),e.drawArrays(V.TRIANGLE_STRIP,0,4),e.bindVAO()}renderHighlight(e,t,i){e.bindTexture(t,W),e.useProgram(this._resources.highlightProgram),i.applyHighlightOptions(e,this._resources.highlightProgram),e.bindVAO(this._resources.quadVAO),e.setBlendingEnabled(!0),e.setBlendFunction(g.ONE,g.ONE_MINUS_SRC_ALPHA),e.drawArrays(V.TRIANGLE_STRIP,0,4),e.bindVAO()}_initialize(e,t,i){this._width=t,this._height=i;const r=oe.createVertex(e,le.STATIC_DRAW,new Int8Array([-1,-1,0,0,1,-1,1,0,-1,1,0,1,1,1,1,1]).buffer),n=new ae(e,new Map([["a_position",0],["a_texcoord",1]]),{geometry:[new we("a_position",2,be.BYTE,0,4),new we("a_texcoord",2,be.UNSIGNED_BYTE,2,4)]},{geometry:r}),s=K(e,_t),a=K(e,pt);e.useProgram(s),s.setUniform1i("u_texture",W),s.setUniform1i("u_shade",It),s.setUniform1f("u_sigma",ge),e.useProgram(a),a.setUniform1i("u_texture",W),a.setUniform1f("u_sigma",ge),this._resources={quadGeometry:r,quadVAO:n,highlightProgram:s,blurProgram:a}}setup(e,t,i){this._resources?(this._width=t,this._height=i):this._initialize(e,t,i)}};function Se(l,e,t){const i=new k(l,{target:O.TEXTURE_2D,pixelFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,width:e,height:t,samplingMode:x.LINEAR});return[i,new A(l,{colorTarget:D.TEXTURE,depthStencilTarget:U.STENCIL_RENDER_BUFFER},i)]}let mi=class{constructor(){this._width=void 0,this._height=void 0,this._resources=null}dispose(){this._resources&&(this._resources.sharedBlur1Tex.dispose(),this._resources.sharedBlur1Fbo.dispose(),this._resources.sharedBlur2Tex.dispose(),this._resources.sharedBlur2Fbo.dispose(),this._resources=Ye(this._resources))}_initialize(e,t,i){this._width=t,this._height=i;const[r,n]=Se(e,t,i),[s,a]=Se(e,t,i);this._resources={sharedBlur1Tex:r,sharedBlur1Fbo:n,sharedBlur2Tex:s,sharedBlur2Fbo:a}}setup(e,t,i){!this._resources||this._width===t&&this._height===i||this.dispose(),this._resources||this._initialize(e,t,i)}get sharedBlur1Tex(){return this._resources.sharedBlur1Tex}get sharedBlur1Fbo(){return this._resources.sharedBlur1Fbo}get sharedBlur2Tex(){return this._resources.sharedBlur2Tex}get sharedBlur2Fbo(){return this._resources.sharedBlur2Fbo}};const $=4,X=4/$;class gi extends j{constructor(){super(...arguments),this.defines=["highlight"],this._hlRenderer=new fi,this._width=void 0,this._height=void 0,this._boundFBO=null,this._hlSurfaces=new mi,this._adjustedWidth=void 0,this._adjustedHeight=void 0,this._blitRenderer=new Le}dispose(){var e,t;(e=this._hlSurfaces)==null||e.dispose(),(t=this._hlRenderer)==null||t.dispose(),this._boundFBO=null}bind(e){const{context:t,painter:i}=e,{width:r,height:n}=t.getViewport(),s=i.getFbos(r,n).effect0;this.setup(e,r,n),t.bindFramebuffer(s),t.setColorMask(!0,!0,!0,!0),t.setClearColor(0,0,0,0),t.clear(t.gl.COLOR_BUFFER_BIT)}unbind(){}setup({context:e},t,i){this._width=t,this._height=i;const r=t%$,n=i%$;t+=r<$/2?-r:$-r,i+=n<$/2?-n:$-n,this._adjustedWidth=t,this._adjustedHeight=i,this._boundFBO=e.getBoundFramebufferObject();const s=Math.round(t*X),a=Math.round(i*X);this._hlRenderer.setup(e,s,a),this._hlSurfaces.setup(e,s,a)}draw(e){const{context:t,highlightGradient:i}=e;if(!i)return;const r=t.getBoundFramebufferObject();t.setViewport(0,0,this._adjustedWidth*X,this._adjustedHeight*X),t.bindFramebuffer(this._hlSurfaces.sharedBlur1Fbo),t.setStencilTestEnabled(!1),t.setClearColor(0,0,0,0),t.clear(t.gl.COLOR_BUFFER_BIT),this._blitRenderer.render(t,r.colorTexture,x.NEAREST,1),t.setStencilTestEnabled(!1),t.setBlendingEnabled(!1),t.setColorMask(!1,!1,!1,!0),t.bindFramebuffer(this._hlSurfaces.sharedBlur2Fbo),t.setClearColor(0,0,0,0),t.clear(t.gl.COLOR_BUFFER_BIT),this._hlRenderer.preBlur(t,this._hlSurfaces.sharedBlur1Tex),t.bindFramebuffer(this._hlSurfaces.sharedBlur1Fbo),t.setClearColor(0,0,0,0),t.clear(t.gl.COLOR_BUFFER_BIT),this._hlRenderer.finalBlur(t,this._hlSurfaces.sharedBlur2Tex),t.bindFramebuffer(this._boundFBO),t.setBlendingEnabled(!0),t.setColorMask(!0,!0,!0,!0),t.setViewport(0,0,this._width,this._height),this._hlRenderer.renderHighlight(t,this._hlSurfaces.sharedBlur1Tex,i),this._boundFBO=null}}let vi=class extends j{constructor(){super(...arguments),this.name=this.constructor.name,this.defines=["hittest"]}dispose(){B(this._fbo)&&this._fbo.dispose()}createOptions({pixelRatio:e},t,i=Ne){if(!t.length)return null;const r=t.shift(),n=r.x,s=r.y;return this._outstanding=r,{type:"hittest",distance:i*e,position:[n,s]}}bind(e){const{context:t,attributeView:i}=e;if(!i.size)return;const r=i.getBlock(xe);if(N(r))return;const n=r.getFBO(t);t.setViewport(0,0,i.size,i.size),t.bindFramebuffer(n),t.setColorMask(!0,!0,!0,!0),t.setClearColor(0,0,0,0),t.clear(t.gl.COLOR_BUFFER_BIT|t.gl.DEPTH_BUFFER_BIT)}unbind(e){}draw(e){if(N(this._outstanding))return;const t=this._outstanding;this._outstanding=null,this._resolve(e,t.resolvers)}async _resolve(e,t){const{context:i,attributeView:r}=e,n=r.getBlock(xe);if(N(n))return void t.forEach(o=>o.resolve([]));const s=n.getFBO(i),a=new Uint8Array(s.width*s.height*4);try{await s.readPixelsAsync(0,0,s.width,s.height,f.RGBA,y.UNSIGNED_BYTE,a)}catch{return void t.forEach(h=>h.resolve([]))}const d=[];for(let o=0;o<a.length;o+=4){const h=a[o],c=a[o+3];h&&d.push({id:o/4,directHits:c})}d.sort((o,h)=>h.directHits===o.directHits?h.id-o.id:h.directHits-o.directHits);const u=d.map(o=>o.id);t.forEach(o=>o.resolve(u))}},bi=class extends j{constructor(){super(...arguments),this.name=this.constructor.name,this.defines=["id"],this._lastSize=0,this._boundFBO=null}dispose(){B(this._fbo)&&this._fbo.dispose()}bind({context:e,painter:t}){const{width:i,height:r}=e.getViewport();this._boundFBO=e.getBoundFramebufferObject();const n=t.getFbos(i,r).effect0;e.bindFramebuffer(n),e.setColorMask(!0,!0,!0,!0),e.setClearColor(0,0,0,0),e.clear(e.gl.COLOR_BUFFER_BIT)}unbind({context:e}){e.bindFramebuffer(this._boundFBO),this._boundFBO=null}draw(e,t,i=2*Ne){this._resolve(e,t,i)}async _resolve({context:e,state:t,pixelRatio:i},r,n){const s=e.getBoundFramebufferObject(),a=t.size[1]*i,d=Math.round(n*i),u=d/2,o=d/2;this._ensureBuffer(d),r.forEach(async(h,c)=>{const p=new Map,m=Math.floor(c.x*i-d/2),b=Math.floor(a-c.y*i-d/2);await s.readPixelsAsync(m,b,d,d,f.RGBA,y.UNSIGNED_BYTE,this._buf);for(let v=0;v<this._buf32.length;v++){const _=this._buf32[v];if(_!==4294967295&&_!==0){const I=v%d,w=d-Math.floor(v/d),R=(u-I)*(u-I)+(o-w)*(o-w),F=p.has(_)?p.get(_):4294967295;p.set(_,Math.min(R,F))}}const E=Array.from(p).sort((v,_)=>v[1]-_[1]).map(v=>v[0]);h.resolve(E),r.delete(c)})}_ensureBuffer(e){this._lastSize!==e&&(this._lastSize=e,this._buf=new Uint8Array(4*e*e),this._buf32=new Uint32Array(this._buf.buffer))}};const ie=5,Ti=[1,0],xi=[0,1],wi=[1,.8,.6,.4,.2],yi=[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];class Ei{constructor(){this._intensityFBO=null,this._compositeFBO=null,this._mipsFBOs=new Array(ie),this._nMips=ie,this._kernelSizeArray=[3,5,7,9,11],this._size=[0,0],this._programDesc={luminosityHighPass:{vsPath:"post-processing/pp",fsPath:"post-processing/bloom/luminosityHighPass",attributes:new Map([["a_position",0]])},gaussianBlur:{vsPath:"post-processing/pp",fsPath:"post-processing/bloom/gaussianBlur",attributes:new Map([["a_position",0]])},composite:{vsPath:"post-processing/pp",fsPath:"post-processing/bloom/composite",attributes:new Map([["a_position",0]])},blit:{vsPath:"post-processing/pp",fsPath:"post-processing/blit",attributes:new Map([["a_position",0]])}}}dispose(){if(this._quad=T(this._quad),this._intensityFBO=T(this._intensityFBO),this._compositeFBO=T(this._compositeFBO),this._mipsFBOs){for(let e=0;e<this._nMips;e++)this._mipsFBOs[e]&&(this._mipsFBOs[e].horizontal.dispose(),this._mipsFBOs[e].vertical.dispose());this._mipsFBOs=null}}draw(e,t,i){const{width:r,height:n}=t,{context:s,painter:a}=e,{materialManager:d}=a,u=s.gl,o=this._programDesc,{strength:h,radius:c,threshold:p}=i;this._quad||(this._quad=new H(s,[-1,-1,1,-1,-1,1,1,1])),this._createOrResizeResources(e,r,n),s.setStencilTestEnabled(!1),s.setBlendingEnabled(!0),s.setBlendFunction(g.ONE,g.ONE_MINUS_SRC_ALPHA),s.setStencilWriteMask(0);const m=this._quad;m.bind(),s.bindFramebuffer(this._intensityFBO);const b=d.getProgram(o.luminosityHighPass);s.useProgram(b),s.bindTexture(t.colorTexture,0),b.setUniform1i("u_texture",0),b.setUniform3fv("u_defaultColor",[0,0,0]),b.setUniform1f("u_defaultOpacity",0),b.setUniform1f("u_luminosityThreshold",p),b.setUniform1f("u_smoothWidth",.01);const E=[Math.round(r/2),Math.round(n/2)];s.setViewport(0,0,E[0],E[1]),s.setClearColor(0,0,0,0),s.clear(u.COLOR_BUFFER_BIT),m.draw(),s.setBlendingEnabled(!1);let v=this._intensityFBO.colorTexture;for(let w=0;w<this._nMips;w++){const R=d.getProgram(o.gaussianBlur,[{name:"radius",value:this._kernelSizeArray[w]}]);s.useProgram(R),s.bindTexture(v,w+1),R.setUniform1i("u_colorTexture",w+1),R.setUniform2fv("u_texSize",E),R.setUniform2fv("u_direction",Ti),s.setViewport(0,0,E[0],E[1]);const F=this._mipsFBOs[w];s.bindFramebuffer(F.horizontal),m.draw(),v=F.horizontal.colorTexture,s.bindFramebuffer(F.vertical),s.bindTexture(v,w+1),R.setUniform2fv("u_direction",xi),m.draw(),v=F.vertical.colorTexture,E[0]=Math.round(E[0]/2),E[1]=Math.round(E[1]/2)}s.setViewport(0,0,r,n);const _=d.getProgram(o.composite,[{name:"nummips",value:ie}]);s.bindFramebuffer(this._compositeFBO),s.useProgram(_),_.setUniform1f("u_bloomStrength",h),_.setUniform1f("u_bloomRadius",c),_.setUniform1fv("u_bloomFactors",wi),_.setUniform3fv("u_bloomTintColors",yi),s.bindTexture(this._mipsFBOs[0].vertical.colorTexture,1),_.setUniform1i("u_blurTexture1",1),s.bindTexture(this._mipsFBOs[1].vertical.colorTexture,2),_.setUniform1i("u_blurTexture2",2),s.bindTexture(this._mipsFBOs[2].vertical.colorTexture,3),_.setUniform1i("u_blurTexture3",3),s.bindTexture(this._mipsFBOs[3].vertical.colorTexture,4),_.setUniform1i("u_blurTexture4",4),s.bindTexture(this._mipsFBOs[4].vertical.colorTexture,5),_.setUniform1i("u_blurTexture5",5),m.draw(),s.bindFramebuffer(t),s.setBlendingEnabled(!0);const I=d.getProgram(o.blit);s.useProgram(I),s.bindTexture(this._compositeFBO.colorTexture,6),I.setUniform1i("u_texture",6),s.setBlendFunction(g.ONE,g.ONE),m.draw(),m.unbind(),s.setBlendFunction(g.ONE,g.ONE_MINUS_SRC_ALPHA),s.setStencilTestEnabled(!0)}_createOrResizeResources(e,t,i){const{context:r}=e;if(this._compositeFBO&&this._size[0]===t&&this._size[1]===i)return;this._size[0]=t,this._size[1]=i;const n=[Math.round(t/2),Math.round(i/2)];this._compositeFBO?this._compositeFBO.resize(t,i):this._compositeFBO=new A(r,{colorTarget:D.TEXTURE,depthStencilTarget:U.NONE,width:t,height:i}),this._intensityFBO?this._intensityFBO.resize(n[0],n[1]):this._intensityFBO=new A(r,{colorTarget:D.TEXTURE,depthStencilTarget:U.NONE,width:n[0],height:n[1]},{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.LINEAR,flipped:!1,width:n[0],height:n[1]});for(let s=0;s<this._nMips;s++)this._mipsFBOs[s]?(this._mipsFBOs[s].horizontal.resize(n[0],n[1]),this._mipsFBOs[s].vertical.resize(n[0],n[1])):this._mipsFBOs[s]={horizontal:new A(r,{colorTarget:D.TEXTURE,depthStencilTarget:U.NONE,width:n[0],height:n[1]},{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.LINEAR,flipped:!1,width:n[0],height:n[1]}),vertical:new A(r,{colorTarget:D.TEXTURE,depthStencilTarget:U.NONE,width:n[0],height:n[1]},{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.LINEAR,flipped:!1,width:n[0],height:n[1]})},n[0]=Math.round(n[0]/2),n[1]=Math.round(n[1]/2)}}const Ri=[1,0],Bi=[0,1];class Fi{constructor(){this._blurFBO=null,this._size=[0,0],this._programDesc={gaussianBlur:{vsPath:"post-processing/pp",fsPath:"post-processing/blur/gaussianBlur",attributes:new Map([["a_position",0]])},radialBlur:{vsPath:"post-processing/pp",fsPath:"post-processing/blur/radial-blur",attributes:new Map([["a_position",0]])},blit:{vsPath:"post-processing/pp",fsPath:"post-processing/blit",attributes:new Map([["a_position",0]])}}}dispose(){this._blurFBO&&(this._blurFBO.dispose(),this._blurFBO=null)}draw(e,t,i){const{context:r}=e,{type:n,radius:s}=i;if(s===0)return;this._createOrResizeResources(e),this._quad||(this._quad=new H(r,[-1,-1,1,-1,-1,1,1,1]));const a=this._quad;a.bind(),n==="blur"?this._gaussianBlur(e,t,s):this._radialBlur(e,t),a.unbind()}_gaussianBlur(e,t,i){const{context:r,state:n,painter:s,pixelRatio:a}=e,{size:d}=n,{materialManager:u}=s,o=this._programDesc,h=this._quad,c=[Math.round(a*d[0]),Math.round(a*d[1])],p=this._blurFBO,m=u.getProgram(o.gaussianBlur,[{name:"radius",value:Math.ceil(i)}]);r.useProgram(m),r.setBlendingEnabled(!1),r.bindFramebuffer(p),r.bindTexture(t.colorTexture,4),m.setUniform1i("u_colorTexture",4),m.setUniform2fv("u_texSize",c),m.setUniform2fv("u_direction",Ri),m.setUniform1f("u_sigma",i),h.draw(),r.bindFramebuffer(t),r.setStencilWriteMask(0),r.setStencilTestEnabled(!1),r.setDepthWriteEnabled(!1),r.setDepthTestEnabled(!1),r.bindTexture(p==null?void 0:p.colorTexture,5),m.setUniform1i("u_colorTexture",5),m.setUniform2fv("u_direction",Bi),h.draw(),r.setBlendingEnabled(!0),r.setBlendFunction(g.ONE,g.ONE_MINUS_SRC_ALPHA),r.setStencilTestEnabled(!0)}_radialBlur(e,t){const{context:i,painter:r}=e,{materialManager:n}=r,s=this._programDesc,a=this._quad,d=this._blurFBO;i.bindFramebuffer(d);const u=n.getProgram(s.radialBlur);i.useProgram(u),i.setBlendingEnabled(!1),i.bindTexture(t.colorTexture,4),u.setUniform1i("u_colorTexture",4),a.draw(),i.bindFramebuffer(t),i.setStencilWriteMask(0),i.setStencilTestEnabled(!1),i.setDepthWriteEnabled(!1),i.setDepthTestEnabled(!1),i.setBlendingEnabled(!0);const o=n.getProgram(s.blit);i.useProgram(o),i.bindTexture(d==null?void 0:d.colorTexture,5),o.setUniform1i("u_texture",5),i.setBlendFunction(g.ONE,g.ONE_MINUS_SRC_ALPHA),a.draw()}_createOrResizeResources(e){const{context:t,state:i,pixelRatio:r}=e,{size:n}=i,s=Math.round(r*n[0]),a=Math.round(r*n[1]);this._blurFBO&&this._size[0]===s&&this._size[1]===a||(this._size[0]=s,this._size[1]=a,this._blurFBO?this._blurFBO.resize(s,a):this._blurFBO=new A(t,{colorTarget:D.TEXTURE,depthStencilTarget:U.NONE,width:s,height:a},{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.LINEAR,flipped:!1,width:s,height:a}))}}class Oi{constructor(){this._layerFBOTexture=null,this._size=[0,0],this._programDesc={vsPath:"post-processing/pp",fsPath:"post-processing/filterEffect",attributes:new Map([["a_position",0]])}}dispose(){this._layerFBOTexture=T(this._layerFBOTexture)}draw(e,t,i){const{width:r,height:n}=t;this._createOrResizeResources(e,r,n);const{context:s,painter:a}=e,{materialManager:d}=a,u=this._programDesc,o=this._quad,h=i.colorMatrix;o.bind();const c=this._layerFBOTexture;s.bindFramebuffer(t),t.copyToTexture(0,0,r,n,0,0,c),s.setBlendingEnabled(!1),s.setStencilTestEnabled(!1);const p=d.getProgram(u);s.useProgram(p),s.bindTexture(c,2),p.setUniformMatrix4fv("u_coefficients",h),p.setUniform1i("u_colorTexture",2),o.draw(),s.setBlendingEnabled(!0),s.setBlendFunction(g.ONE,g.ONE_MINUS_SRC_ALPHA),s.setStencilTestEnabled(!0),o.unbind()}_createOrResizeResources(e,t,i){const{context:r}=e;this._layerFBOTexture&&this._size[0]===t&&this._size[1]===i||(this._size[0]=t,this._size[1]=i,this._layerFBOTexture?this._layerFBOTexture.resize(t,i):this._layerFBOTexture=new k(r,{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.LINEAR,flipped:!1,width:t,height:i}),this._quad||(this._quad=new H(r,[-1,-1,1,-1,-1,1,1,1])))}}const Mi=[1,0],Pi=[0,1];class Ci{constructor(){this._layerFBOTexture=null,this._horizontalBlurFBO=null,this._verticalBlurFBO=null,this._size=[0,0],this._quad=null,this._programDesc={blur:{vsPath:"post-processing/pp",fsPath:"post-processing/blur/gaussianBlur",attributes:new Map([["a_position",0]])},composite:{vsPath:"post-processing/pp",fsPath:"post-processing/drop-shadow/composite",attributes:new Map([["a_position",0]])},blit:{vsPath:"post-processing/pp",fsPath:"post-processing/blit",attributes:new Map([["a_position",0]])}}}dispose(){this._layerFBOTexture=T(this._layerFBOTexture),this._horizontalBlurFBO=T(this._horizontalBlurFBO),this._verticalBlurFBO=T(this._verticalBlurFBO)}draw(e,t,i){const{context:r,state:n,painter:s}=e,{materialManager:a}=s,d=this._programDesc,u=t.width,o=t.height,h=[Math.round(u),Math.round(o)],{blurRadius:c,offsetX:p,offsetY:m,color:b}=i,E=[he(p),he(m)];this._createOrResizeResources(e,u,o,h);const v=this._horizontalBlurFBO,_=this._verticalBlurFBO;r.setStencilWriteMask(0),r.setStencilTestEnabled(!1),r.setDepthWriteEnabled(!1),r.setDepthTestEnabled(!1);const I=this._layerFBOTexture;t.copyToTexture(0,0,u,o,0,0,I),this._quad||(this._quad=new H(r,[-1,-1,1,-1,-1,1,1,1])),r.setViewport(0,0,h[0],h[1]);const w=this._quad;w.bind(),r.setBlendingEnabled(!1);const R=a.getProgram(d.blur,[{name:"radius",value:Math.ceil(c)}]);r.useProgram(R),r.bindFramebuffer(v),r.bindTexture(t.colorTexture,4),R.setUniform1i("u_colorTexture",4),R.setUniform2fv("u_texSize",h),R.setUniform2fv("u_direction",Mi),R.setUniform1f("u_sigma",c),w.draw(),r.bindFramebuffer(_),r.bindTexture(v==null?void 0:v.colorTexture,5),R.setUniform1i("u_colorTexture",5),R.setUniform2fv("u_direction",Pi),w.draw(),r.bindFramebuffer(t),r.setViewport(0,0,u,o);const F=a.getProgram(d.composite);r.useProgram(F),r.bindTexture(_==null?void 0:_.colorTexture,2),F.setUniform1i("u_blurTexture",2),r.bindTexture(I,3),F.setUniform1i("u_layerFBOTexture",3),F.setUniform4fv("u_shadowColor",[b[3]*(b[0]/255),b[3]*(b[1]/255),b[3]*(b[2]/255),b[3]]),F.setUniformMatrix3fv("u_displayViewMat3",n.displayMat3),F.setUniform2fv("u_shadowOffset",E),w.draw(),r.setBlendingEnabled(!0),r.setStencilTestEnabled(!0),r.setBlendFunction(g.ONE,g.ONE_MINUS_SRC_ALPHA),w.unbind()}_createOrResizeResources(e,t,i,r){const{context:n}=e;this._horizontalBlurFBO&&this._size[0]===t&&this._size[1]===i||(this._size[0]=t,this._size[1]=i,this._horizontalBlurFBO?this._horizontalBlurFBO.resize(r[0],r[1]):this._horizontalBlurFBO=new A(n,{colorTarget:D.TEXTURE,depthStencilTarget:U.NONE,width:r[0],height:r[1]},{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.LINEAR,flipped:!1,width:r[0],height:r[1]}),this._verticalBlurFBO?this._verticalBlurFBO.resize(r[0],r[1]):this._verticalBlurFBO=new A(n,{colorTarget:D.TEXTURE,depthStencilTarget:U.NONE,width:r[0],height:r[1]},{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.LINEAR,flipped:!1,width:r[0],height:r[1]}),this._layerFBOTexture?this._layerFBOTexture.resize(t,i):this._layerFBOTexture=new k(n,{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.LINEAR,flipped:!1,width:t,height:i}))}}class Si{constructor(){this._size=[0,0],this._layerFBOTexture=null}dispose(){this._layerFBOTexture=T(this._layerFBOTexture)}draw(e,t,i){const{width:r,height:n}=t;this._createOrResizeResources(e,r,n);const{context:s,painter:a}=e,{amount:d}=i,u=s.gl,o=this._layerFBOTexture;s.bindFramebuffer(t),t.copyToTexture(0,0,r,n,0,0,o),s.setBlendingEnabled(!0),s.setStencilTestEnabled(!1),s.setDepthTestEnabled(!1),s.setClearColor(0,0,0,0),s.clear(u.COLOR_BUFFER_BIT),a.blitTexture(s,o,x.NEAREST,d)}_createOrResizeResources(e,t,i){const{context:r}=e;this._layerFBOTexture&&this._size[0]===t&&this._size[1]===i||(this._size[0]=t,this._size[1]=i,this._layerFBOTexture?this._layerFBOTexture.resize(t,i):this._layerFBOTexture=new k(r,{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.NEAREST,flipped:!1,width:t,height:i}))}}function Ai(l){switch(l){case"bloom":case"blur":case"opacity":case"drop-shadow":return l;default:return"colorize"}}const Di={colorize:()=>new Oi,blur:()=>new Fi,bloom:()=>new Ei,opacity:()=>new Si,"drop-shadow":()=>new Ci};class Ui{constructor(){this._effectMap=new Map}dispose(){this._effectMap.forEach(e=>e.dispose()),this._effectMap.clear()}getPostProcessingEffects(e){if(!e||e.length===0)return[];const t=[];for(const i of e){const r=Ai(i.type);let n=this._effectMap.get(r);n||(n=Di[r](),this._effectMap.set(r,n)),t.push({postProcessingEffect:n,effect:i})}return t}}class Ii{constructor(e,t){this.brushes=e,this.name=t.name,this.drawPhase=t.drawPhase||S.MAP,this._targetFn=t.target,this.effects=t.effects||[],this.enableDefaultDraw=t.enableDefaultDraw??(()=>!0)}render(e){const{context:t,profiler:i}=e,r=this._targetFn(),n=this.drawPhase&e.drawPhase;if(i.recordPassStart(this.name),n){this.enableDefaultDraw()&&this._doRender(e,r),i.recordPassEnd();for(const s of this.effects){if(!s.enable())continue;const a=s.apply,d=s.args&&s.args(),u=t.getViewport(),o=t.getBoundFramebufferObject(),h=e.passOptions;this._bindEffect(e,a,d),this._doRender(e,r,a.defines),this._drawAndUnbindEffect(e,a,u,o,h,d)}}}_doRender(e,t,i){if(N(t))return;const{profiler:r,context:n}=e;for(const s of this.brushes){if(r.recordBrushStart(s.name),B(s.brushEffect)){const a=n.getViewport(),d=n.getBoundFramebufferObject(),u=e.passOptions;this._bindEffect(e,s.brushEffect),this._drawWithBrush(s,e,t,i),this._drawAndUnbindEffect(e,s.brushEffect,a,d,u)}else this._drawWithBrush(s,e,t,i);r.recordBrushEnd()}}_drawWithBrush(e,t,i,r){Ke(i)?(e.prepareState(t,r),e.drawMany(t,i,r)):i.visible&&(e.prepareState(t,r),e.draw(t,i,r))}_bindEffect(e,t,i){const{profiler:r}=e;r.recordPassStart(this.name+"."+t.name),t.bind(e,i);const n=t.createOptions(e,i);e.passOptions=n}_drawAndUnbindEffect(e,t,i,r,n,s){const{profiler:a,context:d}=e;e.passOptions=n,a.recordBrushStart(t.name),t.draw(e,s),t.unbind(e,s),d.bindFramebuffer(r);const{x:u,y:o,width:h,height:c}=i;d.setViewport(u,o,h,c),a.recordBrushEnd(),a.recordPassEnd()}}function zi(l,e){switch(l){case q.LINE:return z.line;case q.TEXT:return z.text;case q.LABEL:return z.label;case q.FILL:return e===ee.DOT_DENSITY?z.dotDensity:z.fill;case q.MARKER:switch(e){case ee.HEATMAP:return z.heatmap;case ee.PIE_CHART:return z.pieChart;default:return z.marker}}}class Ni{constructor(e,t,i){this.context=e,this._blitRenderer=new Le,this._worldExtentClipRenderer=new _i,this._isClippedToWorldExtent=!1,this._brushCache=new Map,this._lastWidth=null,this._lastHeight=null,this._prevFBO=null,this._vtlMaterialManager=new ai,this._blendEffect=new ft,this._stencilBuf=null,this._fbos=null,this._fboPool=[],this._renderTarget=null,this.effects={highlight:new gi,hittest:new vi,hittestVTL:new bi,integrate:new pi,insideEffect:new Ce("inside"),outsideEffect:new Ce("outside")},this.materialManager=new ui(e),this.textureManager=new mt(t,i,e.type===Ie.WEBGL2),this.textureUploadManager=new hi(e,t),this._effectsManager=new Ui}get vectorTilesMaterialManager(){return this._vtlMaterialManager}getRenderTarget(){return this._renderTarget}setRenderTarget(e){this._renderTarget=e}getFbos(e,t){if(e!==this._lastWidth||t!==this._lastHeight){if(this._lastWidth=e,this._lastHeight=t,this._fbos){for(const s in this._fbos)this._fbos[s].resize(e,t);return this._fbos}const i={target:O.TEXTURE_2D,pixelFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,samplingMode:x.NEAREST,wrapMode:M.CLAMP_TO_EDGE,width:e,height:t},r={colorTarget:D.TEXTURE,depthStencilTarget:U.DEPTH_STENCIL_RENDER_BUFFER},n=new Ot(this.context,{width:e,height:t,internalFormat:Mt.DEPTH_STENCIL});this._stencilBuf=n,this._fbos={output:new A(this.context,r,i,n),blend:new A(this.context,r,i,n),effect0:new A(this.context,r,i,n)}}return this._fbos}acquireFbo(e,t){let i;i=this._fboPool.length>0?this._fboPool.pop():new A(this.context,{colorTarget:D.TEXTURE,depthStencilTarget:U.DEPTH_STENCIL_RENDER_BUFFER},{target:O.TEXTURE_2D,pixelFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,samplingMode:x.NEAREST,wrapMode:M.CLAMP_TO_EDGE,width:e,height:t},this._stencilBuf);const r=i.descriptor;return r.width===e&&r.height===t||i.resize(e,t),i}releaseFbo(e){this._fboPool.push(e)}getSharedStencilBuffer(){return this._stencilBuf}beforeRenderLayers(e,t=null){const{width:i,height:r}=e.getViewport();this._prevFBO=e.getBoundFramebufferObject();const n=this.getFbos(i,r);if(e.bindFramebuffer(n==null?void 0:n.output),e.setColorMask(!0,!0,!0,!0),B(t)){const{r:s,g:a,b:d,a:u}=t.color;e.setClearColor(u*s/255,u*a/255,u*d/255,u)}else e.setClearColor(0,0,0,0);e.setDepthWriteEnabled(!0),e.setClearDepth(1),e.clear(e.gl.COLOR_BUFFER_BIT|e.gl.DEPTH_BUFFER_BIT),e.setDepthWriteEnabled(!1)}beforeRenderLayer(e,t,i){var u;const{context:r,blendMode:n,effects:s,requireFBO:a,drawPhase:d}=e;if(a||Ae(d,n,s,i))r.bindFramebuffer((u=this._fbos)==null?void 0:u.blend),r.setColorMask(!0,!0,!0,!0),r.setClearColor(0,0,0,0),r.setDepthWriteEnabled(!0),r.setClearDepth(1),r.clear(r.gl.COLOR_BUFFER_BIT|r.gl.DEPTH_BUFFER_BIT),r.setDepthWriteEnabled(!1);else{const o=this._getOutputFBO();r.bindFramebuffer(o)}r.setDepthWriteEnabled(!1),r.setDepthTestEnabled(!1),r.setStencilTestEnabled(!0),r.setClearStencil(t),r.setStencilWriteMask(255),r.clear(r.gl.STENCIL_BUFFER_BIT)}compositeLayer(e,t){const{context:i,blendMode:r,effects:n,requireFBO:s,drawPhase:a}=e;if(s||Ae(a,r,n,t)){B(n)&&n.length>0&&a===S.MAP&&this._applyEffects(e,n);const d=this._getOutputFBO();i.bindFramebuffer(d),i.setStencilTestEnabled(!1),i.setStencilWriteMask(0),i.setBlendingEnabled(!0),i.setBlendFunctionSeparate(g.ONE,g.ONE_MINUS_SRC_ALPHA,g.ONE,g.ONE_MINUS_SRC_ALPHA),i.setColorMask(!0,!0,!0,!0);const u=N(r)||a===S.HIGHLIGHT?"normal":r,o=this._fbos;o!=null&&o.blend.colorTexture&&this._blendEffect.draw(e,o.blend.colorTexture,x.NEAREST,u,t)}}renderLayers(e){e.bindFramebuffer(this._prevFBO);const t=this._getOutputFBO();t&&(e.setDepthTestEnabled(!1),e.setStencilWriteMask(0),this._isClippedToWorldExtent?(e.setStencilTestEnabled(!0),e.setStencilFunction(ze.EQUAL,1,255)):e.setStencilTestEnabled(!1),this.blitTexture(e,t.colorTexture,x.NEAREST))}prepareDisplay(e,t,i){const{context:r}=e;if(r.bindFramebuffer(this._prevFBO),r.setColorMask(!0,!0,!0,!0),B(t)){const{r:n,g:s,b:a,a:d}=t.color;r.setClearColor(d*n/255,d*s/255,d*a/255,d)}else r.setClearColor(0,0,0,0);r.setStencilWriteMask(255),r.setClearStencil(0),r.clear(r.gl.COLOR_BUFFER_BIT|r.gl.STENCIL_BUFFER_BIT),this._isClippedToWorldExtent=this._worldExtentClipRenderer.render(e,i)}dispose(){if(this.materialManager.dispose(),this.textureManager.dispose(),this.textureUploadManager.destroy(),this._blitRenderer=T(this._blitRenderer),this._worldExtentClipRenderer=T(this._worldExtentClipRenderer),this._brushCache&&(this._brushCache.forEach(e=>e.dispose()),this._brushCache.clear(),this._brushCache=null),this._fbos)for(const e in this._fbos)this._fbos[e]&&this._fbos[e].dispose();for(const e of this._fboPool)e.dispose();if(this._fboPool.length=0,this.effects)for(const e in this.effects)this.effects[e]&&this.effects[e].dispose();this._effectsManager.dispose(),this._vtlMaterialManager=T(this._vtlMaterialManager),this._prevFBO=null}getBrush(e,t){const i=zi(e,t);let r=this._brushCache.get(i);return r===void 0&&(r=new i,this._brushCache.set(i,r)),r}renderObject(e,t,i,r){const n=z[i];if(!n)return;let s=this._brushCache.get(n);s===void 0&&(s=new n,this._brushCache.set(n,s)),s.prepareState(e,r),s.draw(e,t,r)}renderObjects(e,t,i,r){const n=z[i];if(!n)return;let s=this._brushCache.get(n);s===void 0&&(s=new n,this._brushCache.set(n,s)),s.drawMany(e,t,r)}registerRenderPass(e){const t=e.brushes.map(i=>(this._brushCache.has(i)||this._brushCache.set(i,new i),this._brushCache.get(i)));return new Ii(t,e)}blitTexture(e,t,i,r=1){e.setBlendingEnabled(!0),e.setBlendFunctionSeparate(g.ONE,g.ONE_MINUS_SRC_ALPHA,g.ONE,g.ONE_MINUS_SRC_ALPHA),e.setColorMask(!0,!0,!0,!0),this._blitRenderer.render(e,t,i,r)}getPostProcessingEffects(e){return this._effectsManager.getPostProcessingEffects(e)}_getOutputFBO(){var e;return this._renderTarget!=null?this._renderTarget:((e=this._fbos)==null?void 0:e.output)??null}_applyEffects(e,t){var s;const i=(s=this._fbos)==null?void 0:s.blend;if(!i)return;const{context:r}=e,n=this._effectsManager.getPostProcessingEffects(t);for(const{postProcessingEffect:a,effect:d}of n)r.bindFramebuffer(i),a.draw(e,i,d)}}function Ae(l,e,t,i){return l!==S.HIGHLIGHT&&(i!==1||B(e)&&e!=="normal"||B(t)&&t.length>0)}const Li=2e3;class ss extends ve{constructor(e,t){super(),this._trash=new Set,this._renderRemainingTime=0,this._lastFrameRenderTime=0,this.renderRequested=!1,this.stage=this,this._stationary=!0;const{canvas:i=document.createElement("canvas"),alpha:r=!0,stencil:n=!0,contextOptions:s={}}=t;this._canvas=i;const a=Je("2d",i,{alpha:r,antialias:!1,depth:!0,stencil:n});this.context=new Pt(Qe(a)??null,s),this.resourceManager=new Vt,this.painter=new Ni(this.context,this,this.resourceManager),ce("esri-2d-profiler")&&(this._debugOutput=document.createElement("div"),this._debugOutput.setAttribute("style","margin: 24px 64px; position: absolute; color: red;"),e.appendChild(this._debugOutput));const d=()=>this._highlightGradient;this._renderParameters={drawPhase:0,state:this.state,pixelRatio:window.devicePixelRatio,stationary:!1,globalOpacity:1,blendMode:null,deltaTime:-1,time:0,inFadeTransition:!1,effects:null,context:this.context,painter:this.painter,timeline:t.timeline||new Ze,renderingOptions:t.renderingOptions,requestRender:()=>this.requestRender(),allowDelayedRender:!1,requireFBO:!1,profiler:new gt(this.context,this._debugOutput),dataUploadCounter:0,get highlightGradient(){return d()}},this._taskHandle=et({render:u=>this.renderFrame(u)}),this._taskHandle.pause(),this._lostWebGLContextHandle=tt(i,"webglcontextlost",()=>{this.emit("webgl-error",{error:new se("webgl-context-lost")})}),this._bufferPool=new Et,i.setAttribute("style","width: 100%; height:100%; display:block;"),e.appendChild(i)}destroy(){var e,t,i;this.removeAllChildren(),this._emptyTrash(),this._taskHandle=_e(this._taskHandle),this._lostWebGLContextHandle=_e(this._lostWebGLContextHandle),(e=this._canvas.parentNode)==null||e.removeChild(this._canvas),(i=(t=this._debugOutput)==null?void 0:t.parentNode)==null||i.removeChild(this._debugOutput),this._bufferPool.destroy(),this.resourceManager.destroy(),this.painter.dispose(),this.context.dispose(),this._canvas=null}get background(){return this._background}set background(e){this._background=e,this.requestRender()}get bufferPool(){return this._bufferPool}get renderingOptions(){return this._renderingOptions}set renderingOptions(e){this._renderingOptions=e,this.requestRender()}get state(){return this._state}set state(e){this._state=e,this.requestRender()}get stationary(){return this._stationary}set stationary(e){this._stationary!==e&&(this._stationary=e,this.requestRender())}trashDisplayObject(e){this._trash.add(e),this.requestRender()}untrashDisplayObject(e){return this._trash.delete(e)}requestRender(){this._renderRemainingTime=Li,this.renderRequested||(this.renderRequested=!0,this.emit("will-render"),this._taskHandle.resume())}renderFrame(e){const t=this._lastFrameRenderTime?e.time-this._lastFrameRenderTime:0;this._renderRemainingTime-=t,this._renderRemainingTime<=0&&this._taskHandle.pause(),this._lastFrameRenderTime=e.time,this.renderRequested=!1,this._renderParameters.state=this._state,this._renderParameters.stationary=this.stationary,this._renderParameters.pixelRatio=window.devicePixelRatio,this._renderParameters.globalOpacity=1,this._renderParameters.time=e.time,this._renderParameters.deltaTime=e.deltaTime,this._renderParameters.effects=null,this.processRender(this._renderParameters),this._emptyTrash(),this.emit("post-render")}_createTransforms(){return{dvs:ne()}}renderChildren(e){for(const t of this.children)t.beforeRender(e);this._renderChildren(this.children,e);for(const t of this.children)t.afterRender(e)}_renderChildren(e,t){const i=this.context;this.painter.textureUploadManager.upload(),i.resetInfo(),t.profiler.recordStart("drawLayers"),t.dataUploadCounter=0,t.drawPhase=S.MAP,this.painter.beforeRenderLayers(i,this.background);for(const r of e)r.processRender(t);this.painter.prepareDisplay(t,this.background,this.state.padding),this.painter.renderLayers(i),t.drawPhase=S.HIGHLIGHT,this.painter.beforeRenderLayers(i);for(const r of e)r.processRender(t);if(this.painter.renderLayers(i),this._isLabelDrawPhaseRequired(e)){t.drawPhase=S.LABEL,this.painter.beforeRenderLayers(i);for(const r of e)r.processRender(t);this.painter.renderLayers(i)}if(ce("esri-tiles-debug")){t.drawPhase=S.DEBUG,this.painter.beforeRenderLayers(i);for(const r of e)r.processRender(t);this.painter.renderLayers(i)}t.profiler.recordEnd("drawLayers"),i.logInfo()}doRender(e){const t=this.context,{state:i,pixelRatio:r}=e;this._resizeCanvas(e),t.setViewport(0,0,r*i.size[0],r*i.size[1]),t.setDepthWriteEnabled(!0),t.setStencilWriteMask(255),super.doRender(e)}async takeScreenshot(e){const{framebufferWidth:t,framebufferHeight:i}={framebufferWidth:Math.round(this.state.size[0]*e.resolutionScale),framebufferHeight:Math.round(this.state.size[1]*e.resolutionScale)},r=e.resolutionScale,n=this.context,s=this._state.clone();if(e.rotation!=null){const m=s.viewpoint;s.viewpoint.rotation=e.rotation,s.viewpoint=m}const a={...this._renderParameters,drawPhase:null,globalOpacity:1,stationary:!0,state:s,pixelRatio:r,time:performance.now(),deltaTime:0,blendMode:null,effects:null,inFadeTransition:!1},d=new A(n,{colorTarget:D.TEXTURE,depthStencilTarget:U.DEPTH_STENCIL_RENDER_BUFFER,width:t,height:i}),u=n.getBoundFramebufferObject(),o=n.getViewport();n.bindFramebuffer(d),n.setViewport(0,0,t,i),this._renderChildren(e.children,a);const h=this._readbackScreenshot(d,{...e.cropArea,y:i-(e.cropArea.y+e.cropArea.height)});n.bindFramebuffer(u),n.setViewport(o.x,o.y,o.width,o.height),this.requestRender();const c=await h;let p;return e.outputScale===1?p=c:(p=new ImageData(Math.round(c.width*e.outputScale),Math.round(c.height*e.outputScale)),it(c,p,!0)),p}async _readbackScreenshot(e,t){const i=zt(t.width,t.height,document.createElement("canvas"));return await e.readPixelsAsync(t.x,t.y,t.width,t.height,f.RGBA,y.UNSIGNED_BYTE,new Uint8Array(i.data.buffer)),i}_resizeCanvas(e){const t=this._canvas,i=t.style,{state:{size:r},pixelRatio:n}=e,s=r[0],a=r[1],d=Math.round(s*n),u=Math.round(a*n);t.width===d&&t.height===u||(t.width=d,t.height=u),i.width=s+"px",i.height=a+"px"}_emptyTrash(){for(;this._trash.size>0;){const e=Array.from(this._trash);this._trash.clear();for(const t of e)t.processDetach()}}_isLabelDrawPhaseRequired(e){let t=!1;for(const i of e){if(!(i instanceof ve)){t=t||!1;break}if(i.hasLabels)return!0;t=t||this._isLabelDrawPhaseRequired(i.children)}return t}}async function $i(l){const e=pe(()=>import("./mask-svg-023bbc42.js"),[]),t=pe(()=>import("./overlay-svg-d62383f3.js"),[]),i=ye((await e).default,{signal:l}),r=ye((await t).default,{signal:l}),n={mask:await i,overlay:await r};return re(l),n}class ns extends yt{constructor(){super(),this._handles=new rt,this._resourcePixelRatio=1,this.visible=!1}destroy(){this._handles=st(this._handles),this._disposeRenderResources(),this._resourcesTask=nt(this._resourcesTask)}get background(){return this._background}set background(e){this._background=e,this.requestRender()}get magnifier(){return this._magnifier}set magnifier(e){this._magnifier=e,this._handles.removeAll(),this._handles.add([Z(()=>e.version,()=>{this.visible=e.visible&&B(e.position)&&e.size>0,this.requestRender()},at),Z(()=>[e.maskUrl,e.overlayUrl],()=>this._reloadResources()),Z(()=>e.size,()=>{this._disposeRenderResources(),this.requestRender()})])}_createTransforms(){return{dvs:ne()}}doRender(e){var de;const t=e.context;if(!this._resourcesTask)return void this._reloadResources();if(e.drawPhase!==S.MAP||!this._canRender())return;this._updateResources(e);const i=this._magnifier;if(N(i.position))return;const r=e.pixelRatio,n=i.size*r,s=1/i.factor,a=Math.ceil(s*n);this._readbackTexture.resize(a,a);const{size:d}=e.state,u=r*d[0],o=r*d[1],h=.5*a,c=.5*a,p=fe(r*i.position.x,h,u-h-1),m=fe(o-r*i.position.y,c,o-c-1);t.setBlendingEnabled(!0);const b=p-h,E=m-c,v=this._readbackTexture;t.bindTexture(v,0),t.gl.copyTexImage2D(v.descriptor.target,0,v.descriptor.pixelFormat,b,E,a,a,0);const _=(de=this.background)==null?void 0:de.color,I=_?[_.a*_.r/255,_.a*_.g/255,_.a*_.b/255,_.a]:[1,1,1,1],w=(p+i.offset.x*r)/u*2-1,R=(m-i.offset.y*r)/o*2-1,F=n/u*2,ke=n/o*2,L=this._program;t.bindVAO(this._vertexArrayObject),t.bindTexture(this._overlayTexture,6),t.bindTexture(this._maskTexture,7),t.useProgram(L),L.setUniform4fv("u_background",I),L.setUniform1i("u_readbackTexture",0),L.setUniform1i("u_overlayTexture",6),L.setUniform1i("u_maskTexture",7),L.setUniform4f("u_drawPos",w,R,F,ke),L.setUniform1i("u_maskEnabled",i.maskEnabled?1:0),L.setUniform1i("u_overlayEnabled",i.overlayEnabled?1:0),t.setStencilTestEnabled(!1),t.setColorMask(!0,!0,!0,!0),t.drawArrays(V.TRIANGLE_STRIP,0,4),t.bindVAO()}_canRender(){return this.mask&&this.overlay&&this._magnifier!=null}_reloadResources(){this._resourcesTask&&this._resourcesTask.abort();const e=B(this._magnifier)?this._magnifier.maskUrl:null,t=B(this._magnifier)?this._magnifier.overlayUrl:null;this._resourcesTask=ot(async i=>{const r=N(e)||N(t)?$i(i):null,n=B(e)?Y(e,{responseType:"image",signal:i}).then(u=>u.data):r.then(u=>u.mask),s=B(t)?Y(t,{responseType:"image",signal:i}).then(u=>u.data):r.then(u=>u.overlay),[a,d]=await Promise.all([n,s]);this.mask=a,this.overlay=d,this._disposeRenderResources(),this.requestRender()})}_disposeRenderResources(){this._readbackTexture=T(this._readbackTexture),this._overlayTexture=T(this._overlayTexture),this._maskTexture=T(this._maskTexture),this._vertexArrayObject=T(this._vertexArrayObject),this._program=T(this._program)}_updateResources(e){if(e.pixelRatio!==this._resourcePixelRatio&&this._disposeRenderResources(),this._readbackTexture)return;const t=e.context;this._resourcePixelRatio=e.pixelRatio;const i=Math.ceil(this._magnifier.size*e.pixelRatio);this._program=vt(t);const r=new Uint16Array([0,1,0,0,1,1,1,0]),n=bt.attributes;this._vertexArrayObject=new ae(t,n,Bt,{geometry:oe.createVertex(t,le.STATIC_DRAW,r)}),this.overlay.width=i,this.overlay.height=i,this._overlayTexture=new k(t,{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.NEAREST,flipped:!0,preMultiplyAlpha:!lt(this.overlay.src)||!e.context.driverTest.svgPremultipliesAlpha.result},this.overlay),this.mask.width=i,this.mask.height=i,this._maskTexture=new k(t,{target:O.TEXTURE_2D,pixelFormat:f.ALPHA,internalFormat:f.ALPHA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.NEAREST,flipped:!0},this.mask);const s=1/this._magnifier.factor;this._readbackTexture=new k(t,{target:O.TEXTURE_2D,pixelFormat:f.RGBA,internalFormat:f.RGBA,dataType:y.UNSIGNED_BYTE,wrapMode:M.CLAMP_TO_EDGE,samplingMode:x.LINEAR,flipped:!1,width:Math.ceil(s*i),height:Math.ceil(s*i)})}}export{_s as GraphicContainer,hs as GraphicsView2D,ls as LabelManager,ns as MagnifierView2D,ds as MapViewNavigation,ss as Stage};

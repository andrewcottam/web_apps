import{L as e,N as o,P as p}from"./index-4a807205.js";import m from"./FeatureLayerView2D-607218df.js";import"./Container-ea6e334e.js";import"./definitions-3ddd14a8.js";import"./enums-64ab819c.js";import"./Texture-1a30fe9d.js";import"./LayerView-72603a99.js";import"./schemaUtils-e62aa4bb.js";import"./color-0771e239.js";import"./enums-55085e26.js";import"./VertexElementDescriptor-2925c6af.js";import"./utils-8feb0f11.js";import"./MaterialKey-4a7341db.js";import"./visualVariablesUtils-0a45b32d.js";import"./ExpandedCIM-dbf79054.js";import"./BidiEngine-836b7ef6.js";import"./GeometryUtils-53652037.js";import"./Rect-ea14f53a.js";import"./quantizationUtils-3fe3a8e9.js";import"./floatRGBA-b693da66.js";import"./util-3eb89f06.js";import"./floorFilterUtils-080a7cd2.js";import"./popupUtils-6b6d1340.js";import"./RefreshableLayerView-077e072c.js";const s=t=>{let r=class extends t{get availableFields(){return this.layer.fieldsIndex.fields.map(a=>a.name)}};return e([o()],r.prototype,"layer",void 0),e([o({readOnly:!0})],r.prototype,"availableFields",null),r=e([p("esri.views.layers.OGCFeatureLayerView")],r),r};let i=class extends s(m){supportsSpatialReference(t){return this.layer.serviceSupportsSpatialReference(t)}};i=e([p("esri.views.2d.layers.OGCFeatureLayerView2D")],i);const P=i;export{P as default};

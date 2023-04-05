import{L as d,P as u,G as y,H as m,w as h,r as c,co as b}from"./index-4a807205.js";import g from"./FeatureLayerView2D-607218df.js";import"./Container-ea6e334e.js";import"./definitions-3ddd14a8.js";import"./enums-64ab819c.js";import"./Texture-1a30fe9d.js";import"./LayerView-72603a99.js";import"./schemaUtils-e62aa4bb.js";import"./color-0771e239.js";import"./enums-55085e26.js";import"./VertexElementDescriptor-2925c6af.js";import"./utils-8feb0f11.js";import"./MaterialKey-4a7341db.js";import"./visualVariablesUtils-0a45b32d.js";import"./ExpandedCIM-dbf79054.js";import"./BidiEngine-836b7ef6.js";import"./GeometryUtils-53652037.js";import"./Rect-ea14f53a.js";import"./quantizationUtils-3fe3a8e9.js";import"./floatRGBA-b693da66.js";import"./util-3eb89f06.js";import"./floorFilterUtils-080a7cd2.js";import"./popupUtils-6b6d1340.js";import"./RefreshableLayerView-077e072c.js";function f(i,e){return!i.visible||i.minScale!==0&&e>i.minScale||i.maxScale!==0&&e<i.maxScale}let a=class extends g{initialize(){this.addHandles([y(()=>this.view.scale,()=>this._update(),m)],"constructor")}isUpdating(){var o;const i=this.layer.sublayers.some(p=>p.renderer!=null),e=this._commandsQueue.updating,s=this._updatingRequiredFieldsPromise!=null,t=!this._proxy||!this._proxy.isReady,r=this._pipelineIsUpdating,n=this.tileRenderer==null||((o=this.tileRenderer)==null?void 0:o.updating),l=i&&(e||s||t||r||n);return h("esri-2d-log-updating")&&console.log(`Updating FLV2D: ${l}
  -> hasRenderer ${i}
  -> hasPendingCommand ${e}
  -> updatingRequiredFields ${s}
  -> updatingProxy ${t}
  -> updatingPipeline ${r}
  -> updatingTileRenderer ${n}
`),l}_injectOverrides(i){let e=super._injectOverrides(i);const s=this.view.scale,t=this.layer.sublayers.filter(n=>f(n,s)).map(n=>n.subtypeCode);if(!t.length)return e;e=c(e)?e:new b().toJSON();const r=`NOT ${this.layer.subtypeField} IN (${t.join(",")})`;return e.where=e.where?`(${e.where}) AND (${r})`:r,e}_setLayersForFeature(i){const e=this.layer.fieldsIndex.get(this.layer.subtypeField),s=i.attributes[e.name],t=this.layer.sublayers.find(r=>r.subtypeCode===s);i.layer=i.sourceLayer=t}_createSchemaConfig(){const i={subtypeField:this.layer.subtypeField,sublayers:Array.from(this.layer.sublayers).map(r=>({featureReduction:null,geometryType:this.layer.geometryType,labelingInfo:r.labelingInfo,labelsVisible:r.labelsVisible,renderer:r.renderer,subtypeCode:r.subtypeCode,orderBy:null}))},e=this.layer.sublayers.map(r=>r.subtypeCode).join(","),s=this.layer.sublayers.length?`${this.layer.subtypeField} IN (${e})`:"1=2";let t=this.layer.definitionExpression?this.layer.definitionExpression+" AND ":"";return t+=s,{...super._createSchemaConfig(),...i,definitionExpression:t}}};a=d([u("esri.views.2d.layers.SubtypeGroupLayerView2D")],a);const z=a;export{z as default};

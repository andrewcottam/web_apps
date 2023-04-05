import{ip as a,L as m,P as l,cT as p}from"./index-4a807205.js";import{n as h}from"./BitmapTileContainer-063043bc.js";import{o as c}from"./BaseTileRenderer-c5185c70.js";import"./Bitmap-66c382dd.js";import"./Container-ea6e334e.js";import"./definitions-3ddd14a8.js";import"./enums-64ab819c.js";import"./Texture-1a30fe9d.js";import"./TiledDisplayObject-87075907.js";import"./WGLContainer-1db3a62f.js";import"./VertexArrayObject-7655e429.js";import"./VertexElementDescriptor-2925c6af.js";import"./color-0771e239.js";import"./enums-55085e26.js";import"./ProgramTemplate-f85801a3.js";import"./MaterialKey-4a7341db.js";import"./utils-8feb0f11.js";import"./StyleDefinition-fbc907c2.js";import"./config-1337d16e.js";import"./GeometryUtils-dd03fc25.js";import"./earcut-61f7b102.js";import"./TileContainer-fbec3845.js";class d{constructor(){this.gradient=null,this.height=512,this.intensities=null,this.width=512}render(i){a(i,512,this.intensities,this.gradient,this.minDensity,this.maxDensity)}}let o=class extends c{constructor(t){super(t),this._intensityInfo={minDensity:0,maxDensity:0},this.type="heatmap",this.featuresView={attributeView:{initialize:()=>{},requestUpdate:()=>{}},requestRender:()=>{}},this._container=new h(t.tileInfoView)}createTile(t){const i=this._container.createTile(t);return this.tileInfoView.getTileCoords(i.bitmap,t),i.bitmap.resolution=this.tileInfoView.getTileResolution(t),i}onConfigUpdate(){const t=this.layer.renderer;if(t.type==="heatmap"){const{minDensity:i,maxDensity:s,colorStops:n}=t;this._intensityInfo.minDensity=i,this._intensityInfo.maxDensity=s,this._gradient=p(n),this.tiles.forEach(r=>{const e=r.bitmap.source;e&&(e.minDensity=i,e.maxDensity=s,e.gradient=this._gradient,r.bitmap.invalidateTexture())})}}hitTest(){return Promise.resolve([])}install(t){t.addChild(this._container)}uninstall(t){this._container.removeAllChildren(),t.removeChild(this._container)}disposeTile(t){this._container.removeChild(t),t.destroy()}supportsRenderer(t){return t&&t.type==="heatmap"}onTileData(t){const i=this.tiles.get(t.tileKey);if(!i)return;const s=t.intensityInfo,{minDensity:n,maxDensity:r}=this._intensityInfo,e=i.bitmap.source||new d;e.intensities=s&&s.matrix||null,e.minDensity=n,e.maxDensity=r,e.gradient=this._gradient,i.bitmap.source=e,this._container.addChild(i),this._container.requestRender(),this.requestUpdate()}onTileError(t){console.error(t)}lockGPUUploads(){}unlockGPUUploads(){}fetchResource(t,i){return console.error(t),Promise.reject()}};o=m([l("esri.views.2d.layers.features.tileRenderers.HeatmapTileRenderer")],o);const j=o;export{j as default};
import{aA as i,aH as n,L as r,N as s,aF as l,P as o}from"./index-4fcbad66.js";import{f as h,u as d}from"./LayerView-bc9a22d1.js";import"./Container-3ec87975.js";import"./definitions-3ddd14a8.js";import"./enums-64ab819c.js";import"./Texture-131f3bd0.js";let t=class extends h(d){constructor(e){super(e),this.layerViews=new i}set layerViews(e){this._set("layerViews",n(e,this._get("layerViews")))}get updatingProgress(){return this.layerViews.length===0?1:this.layerViews.reduce((e,a)=>e+a.updatingProgress,0)/this.layerViews.length}attach(){this._updateStageChildren(),this.addAttachHandles(this.layerViews.on("after-changes",()=>this._updateStageChildren()))}detach(){this.container.removeAllChildren()}update(e){}moveStart(){}viewChange(){}moveEnd(){}_updateStageChildren(){this.container.removeAllChildren(),this.layerViews.forEach((e,a)=>this.container.addChildAt(e.container,a))}};r([s({cast:l})],t.prototype,"layerViews",null),r([s({readOnly:!0})],t.prototype,"updatingProgress",null),t=r([o("esri.views.2d.layers.KnowledgeGraphLayerView2D")],t);const m=t;export{m as default};
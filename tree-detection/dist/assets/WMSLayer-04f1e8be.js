import{cb as Le,bl as W,aG as L,G as he,aK as P,jP as Pe,aA as K,L as o,N as u,ap as N,ee as Ae,P as ge,iw as Ue,s as _e,r as v,b2 as I,a0 as Me,t as $,cO as je,iq as Te,i_ as Ce,is as qe,ir as Be,ak as Ve,al as We,am as ke,bY as De,ao as Ge,ba as se,U as X,it as Xe,ae as He,kZ as Je,ax as Qe,k_ as ze,aB as Ke,aE as Ye,a4 as Ze,a9 as et,cE as tt,bg as H,j4 as rt,h7 as nt,ar as st,as as it,k$ as at}from"./index-4a807205.js";import{o as Q}from"./crsUtils-3bab3d8c.js";import{l as ie}from"./ExportWMSImageParameters-3d3942a9.js";var q;let ot=0,h=q=class extends Le(Ue){constructor(e){super(e),this.dimensions=null,this.fullExtents=null,this.legendUrl=null,this.legendEnabled=!0,this.layer=null,this.maxScale=0,this.minScale=0,this.parent=null,this.popupEnabled=!1,this.queryable=!1,this.sublayers=null,this.spatialReferences=null,this.addHandles([W(()=>this.sublayers,"after-add",({item:t})=>{t.parent=this,t.layer=this.layer},L),W(()=>this.sublayers,"after-remove",({item:t})=>{t.layer=t.parent=null},L),he(()=>this.sublayers,(t,r)=>{if(r)for(const n of r)n.layer=n.parent=null;if(t)for(const n of t)n.parent=this,n.layer=this.layer},L)])}get description(){return this._get("description")}set description(e){this._set("description",e)}get fullExtent(){return this._get("fullExtent")}set fullExtent(e){this._set("fullExtent",e)}readExtent(e,t){return(e=t.extent)?P.fromJSON(e):null}get id(){return this._get("id")??ot++}set id(e){this._set("id",e)}readLegendUrl(e,t){return(t==null?void 0:t.legendUrl)??(t==null?void 0:t.legendURL)??null}get effectiveScaleRange(){const{minScale:e,maxScale:t}=this;return{minScale:e,maxScale:t}}get name(){return this._get("name")}set name(e){this._set("name",e)}castSublayers(e){return Pe(K.ofType(q),e)}get title(){return this._get("title")}set title(e){this._set("title",e)}get visible(){return this._get("visible")}set visible(e){this._setAndNotifyLayer("visible",e)}clone(){var t,r;const e=new q;return this.hasOwnProperty("description")&&(e.description=this.description),this.hasOwnProperty("fullExtent")&&(e.fullExtent=this.fullExtent.clone()),this.hasOwnProperty("fullExtents")&&(e.fullExtents=((t=this.fullExtents)==null?void 0:t.map(n=>n.clone()))??null),this.hasOwnProperty("legendUrl")&&(e.legendUrl=this.legendUrl),this.hasOwnProperty("legendEnabled")&&(e.legendEnabled=this.legendEnabled),this.hasOwnProperty("layer")&&(e.layer=this.layer),this.hasOwnProperty("name")&&(e.name=this.name),this.hasOwnProperty("parent")&&(e.parent=this.parent),this.hasOwnProperty("queryable")&&(e.queryable=this.queryable),this.hasOwnProperty("sublayers")&&(e.sublayers=this.sublayers&&this.sublayers.map(n=>n.clone())),this.hasOwnProperty("spatialReferences")&&(e.spatialReferences=(r=this.spatialReferences)==null?void 0:r.map(n=>n)),this.hasOwnProperty("visible")&&(e.visible=this.visible),this.hasOwnProperty("title")&&(e.title=this.title),e}_setAndNotifyLayer(e,t){const r=this.layer;this._get(e)!==t&&(this._set(e,t),r&&r.emit("wms-sublayer-update",{propertyName:e,id:this.id}))}};o([u()],h.prototype,"description",null),o([u({readOnly:!0})],h.prototype,"dimensions",void 0),o([u({value:null})],h.prototype,"fullExtent",null),o([N("fullExtent",["extent"])],h.prototype,"readExtent",null),o([u()],h.prototype,"fullExtents",void 0),o([u({type:Number,json:{write:{enabled:!1,overridePolicy:()=>({ignoreOrigin:!0,enabled:!0})}}})],h.prototype,"id",null),o([u({type:String,json:{origins:{"web-document":{read:{source:["legendUrl","legendURL"]},write:{target:"legendUrl",ignoreOrigin:!0}}},read:{source:"legendURL"},write:{ignoreOrigin:!0}}})],h.prototype,"legendUrl",void 0),o([N(["web-document"],"legendUrl")],h.prototype,"readLegendUrl",null),o([u({value:!0,type:Boolean,json:{read:{source:"showLegend"},write:{target:"showLegend"},origins:{"web-map":{read:!1,write:!1},"web-scene":{read:!1,write:!1}}}})],h.prototype,"legendEnabled",void 0),o([u()],h.prototype,"layer",void 0),o([u()],h.prototype,"maxScale",void 0),o([u()],h.prototype,"minScale",void 0),o([u({readOnly:!0})],h.prototype,"effectiveScaleRange",null),o([u({type:String,value:null,json:{read:{source:"name"},write:{ignoreOrigin:!0}}})],h.prototype,"name",null),o([u()],h.prototype,"parent",void 0),o([u({type:Boolean,json:{read:{source:"showPopup"},write:{ignoreOrigin:!0,target:"showPopup"}}})],h.prototype,"popupEnabled",void 0),o([u({type:Boolean,json:{write:{ignoreOrigin:!0}}})],h.prototype,"queryable",void 0),o([u()],h.prototype,"sublayers",void 0),o([Ae("sublayers")],h.prototype,"castSublayers",null),o([u({type:[Number],json:{read:{source:"spatialReferences"}}})],h.prototype,"spatialReferences",void 0),o([u({type:String,value:null,json:{write:{ignoreOrigin:!0}}})],h.prototype,"title",null),o([u({type:Boolean,value:!0,json:{read:{source:"defaultVisibility"}}})],h.prototype,"visible",null),h=q=o([ge("esri.layers.support.WMSSublayer")],h);const z=h,C={84:4326,83:4269,27:4267};function lt(e){if(!e)return null;const t={idCounter:-1};typeof e=="string"&&(e=new DOMParser().parseFromString(e,"text/xml"));const r=e.documentElement;if(r.nodeName==="ServiceExceptionReport"){const b=Array.prototype.slice.call(r.childNodes).map(U=>U.textContent).join(`\r
`);throw new _e("wmslayer:wms-capabilities-xml-is-not-valid","The server returned errors when the WMS capabilities were requested.",b)}const n=x("Capability",r),s=x("Service",r),l=n&&x("Request",n);if(!n||!s||!l)return null;const a=x("Layer",n);if(!a)return null;const m=r.nodeName==="WMS_Capabilities"||r.nodeName==="WMT_MS_Capabilities"?r.getAttribute("version"):"1.3.0",i=S("Title",s,"")||S("Name",s,""),y=S("AccessConstraints",s,""),p=/^none$/i.test(y)?"":y,f=S("Abstract",s,""),d=parseInt(S("MaxWidth",s,"5000"),10),w=parseInt(S("MaxHeight",s,"5000"),10),E=oe(l,"GetMap"),A=ae(l,"GetMap"),g=j(a,m,t);if(!g)return null;let Y,k=0;const Se=Array.prototype.slice.call(n.childNodes),Ee=g.sublayers??[],D=b=>{b!=null&&Ee.push(b)};Se.forEach(b=>{b.nodeName==="Layer"&&(k===0?Y=b:(k===1&&g.name&&(g.name="",D(j(Y,m,t))),D(j(b,m,t))),k++)});let F=g.sublayers,G=g.extent;const Ne=g.fullExtents??[];if(F||(F=[]),F.length===0&&F.push(g),!G){const b=new P(F[0].extent);g.extent=b.toJSON(),G=g.extent}const Ie=g.spatialReferences.length>0?g.spatialReferences:be(g),Z=ae(l,"GetFeatureInfo"),Fe=Z?oe(l,"GetFeatureInfo"):null,ee=xe(F),Oe=g.minScale||0,Re=g.maxScale||0,te=g.dimensions??[],$e=ee.reduce((b,U)=>b.concat(U.dimensions??[]),[]),re=te.concat($e).filter(ve);let ne=null;if(re.length){const b=re.map(U=>{const{extent:_}=U;return ct(_)?_.map(T=>T.getTime()):_==null?void 0:_.map(T=>[T.min.getTime(),T.max.getTime()])}).flat(2).filter(v);ne={startTimeField:null,endTimeField:null,trackIdField:void 0,timeExtent:[Math.min(...b),Math.max(...b)]}}return{copyright:p,description:f,dimensions:te,extent:G,fullExtents:Ne,featureInfoFormats:Fe,featureInfoUrl:Z,mapUrl:A,maxWidth:d,maxHeight:w,maxScale:Re,minScale:Oe,layers:ee,spatialReferences:Ie,supportedImageFormatTypes:E,timeInfo:ne,title:i,version:m}}function ut(e){const t=e.filter(r=>r.popupEnabled&&r.name&&r.queryable);return t.length?t.map(({name:r})=>r).join():null}function be(e){if(e.spatialReferences.length>0)return e.spatialReferences;if(e.sublayers)for(const t of e.sublayers){const r=be(t);if(r.length>0)return r}return[]}function xe(e){var r;let t=[];for(const n of e)t.push(n),(r=n.sublayers)!=null&&r.length&&(t=t.concat(xe(n.sublayers)),delete n.sublayers);return t}function B(e,t,r){return t.getAttribute(e)??r}function pt(e,t,r,n){const s=x(e,r);return s?B(t,s,n):n}function x(e,t){for(let r=0;r<t.childNodes.length;r++){const n=t.childNodes[r];if(we(n)&&n.nodeName===e)return n}return null}function V(e,t){if(t==null)return[];const r=[];for(let n=0;n<t.childNodes.length;n++){const s=t.childNodes[n];we(s)&&s.nodeName===e&&r.push(s)}return r}function S(e,t,r){var n;return((n=x(e,t))==null?void 0:n.textContent)??r}function M(e,t,r){if(!e)return null;const n=parseFloat(e.getAttribute("minx")),s=parseFloat(e.getAttribute("miny")),l=parseFloat(e.getAttribute("maxx")),a=parseFloat(e.getAttribute("maxy"));let m,i,y,p;r?(m=isNaN(s)?-Number.MAX_VALUE:s,i=isNaN(n)?-Number.MAX_VALUE:n,y=isNaN(a)?Number.MAX_VALUE:a,p=isNaN(l)?Number.MAX_VALUE:l):(m=isNaN(n)?-Number.MAX_VALUE:n,i=isNaN(s)?-Number.MAX_VALUE:s,y=isNaN(l)?Number.MAX_VALUE:l,p=isNaN(a)?Number.MAX_VALUE:a);const f=new I({wkid:t});return new P({xmin:m,ymin:i,xmax:y,ymax:p,spatialReference:f})}function ae(e,t){const r=x(t,e);if(r){const n=x("DCPType",r);if(n){const s=x("HTTP",n);if(s){const l=x("Get",s);if(l){let a=pt("OnlineResource","xlink:href",l,null);if(a)return a.indexOf("&")===a.length-1&&(a=a.substring(0,a.length-1)),mt(a,["service","request"])}}}}return null}function oe(e,t){const r=V("Operation",e);if(!r.length)return V("Format",x(t,e)).map(({textContent:s})=>s).filter(v);const n=[];for(const s of r)if(s.getAttribute("name")===t){const l=V("Format",s);for(const{textContent:a}of l)a!=null&&n.push(a)}return n}function le(e,t,r){const n=x(t,e);if(!n)return r;const{textContent:s}=n;if(s==null||s==="")return r;const l=Number(s);return isNaN(l)?r:l}function j(e,t,r){if(!e)return null;const n={id:r.idCounter++,fullExtents:[],parentLayerId:null,queryable:e.getAttribute("queryable")==="1",spatialReferences:[],sublayers:null},s=x("LatLonBoundingBox",e),l=x("EX_GeographicBoundingBox",e);let a=null;s&&(a=M(s,4326)),l&&(a=new P(0,0,0,0,new I({wkid:4326})),a.xmin=parseFloat(S("westBoundLongitude",l,"0")),a.ymin=parseFloat(S("southBoundLatitude",l,"0")),a.xmax=parseFloat(S("eastBoundLongitude",l,"0")),a.ymax=parseFloat(S("northBoundLatitude",l,"0"))),s||l||(a=new P(-180,-90,180,90,new I({wkid:4326}))),n.minScale=le(e,"MaxScaleDenominator",0),n.maxScale=le(e,"MinScaleDenominator",0);const m=["1.0.0","1.1.0","1.1.1"].includes(t)?"SRS":"CRS";return Array.prototype.slice.call(e.childNodes).forEach(i=>{var y;if(i.nodeName==="Name")n.name=i.textContent||"";else if(i.nodeName==="Title")n.title=i.textContent||"";else if(i.nodeName==="Abstract")n.description=i.textContent||"";else if(i.nodeName==="BoundingBox"){const p=i.getAttribute(m);if(p&&p.indexOf("EPSG:")===0){const d=parseInt(p.substring(5),10);d===0||isNaN(d)||a||(a=t==="1.3.0"?M(i,d,Q(d)):M(i,d))}const f=p&&p.indexOf(":");if(f&&f>-1){let d=parseInt(p.substring(f+1,p.length),10);d===0||isNaN(d)||(d=C[d]?C[d]:d);const w=t==="1.3.0"?M(i,d,Q(d)):M(i,d);w&&n.fullExtents&&n.fullExtents.push(w)}}else if(i.nodeName===m)(((y=i.textContent)==null?void 0:y.split(" "))??[]).forEach(p=>{const f=p.includes(":")?parseInt(p.split(":")[1],10):parseInt(p,10);if(f!==0&&!isNaN(f)){const d=C[f]?C[f]:f;n.spatialReferences.includes(d)||n.spatialReferences.push(d)}});else if(i.nodeName!=="Style"||n.legendURL){if(i.nodeName==="Layer"){const p=j(i,t,r);p&&(p.parentLayerId=n.id,n.sublayers||(n.sublayers=[]),n.sublayers.push(p))}}else{const p=x("LegendURL",i);if(p){const f=x("OnlineResource",p);f&&(n.legendURL=f.getAttribute("xlink:href"))}}}),n.extent=a==null?void 0:a.toJSON(),n.dimensions=V("Dimension",e).filter(i=>i.getAttribute("name")&&i.getAttribute("units")&&i.textContent).map(i=>{const y=i.getAttribute("name"),p=i.getAttribute("units"),f=i.textContent,d=i.getAttribute("unitSymbol")??void 0,w=i.getAttribute("default")??void 0,E=B("default",i,"0")!=="0",A=B("nearestValue",i,"0")!=="0",g=B("current",i,"0")!=="0";return ve({name:y,units:p})?{name:"time",units:"ISO8601",extent:ce(f),default:ce(w),multipleValues:E,nearestValue:A,current:g}:dt({name:y,units:p})?{name:"elevation",units:p,extent:ue(f),unitSymbol:d,default:ue(w),multipleValues:E,nearestValue:A}:{name:y,units:p,extent:pe(f),unitSymbol:d,default:pe(w),multipleValues:E,nearestValue:A}}),n}function ct(e){return Array.isArray(e)&&e.length>0&&e[0]instanceof Date}function we(e){return e.nodeType===Node.ELEMENT_NODE}function dt(e){return/^elevation$/i.test(e.name)&&/^(epsg|crs):\d+$/i.test(e.units)}function ve(e){return/^time$/i.test(e.name)&&/^iso8601$/i.test(e.units)}function mt(e,t){const r=[],n=Me(e);for(const s in n.query)n.query.hasOwnProperty(s)&&(t.includes(s.toLowerCase())||r.push(s+"="+n.query[s]));return n.path+(r.length?"?"+r.join("&"):"")}function ue(e){if(!e)return;const t=e.includes("/"),r=e.split(",");return t?r.map(n=>{const s=n.split("/");return s.length<2?null:{min:parseFloat(s[0]),max:parseFloat(s[1]),resolution:s.length>=3&&s[2]!=="0"?parseFloat(s[2]):void 0}}).filter(v):r.map(n=>parseFloat(n))}function pe(e){if(!e)return;const t=e.includes("/"),r=e.split(",");return t?r.map(n=>{const s=n.split("/");return s.length<2?null:{min:s[0],max:s[1],resolution:s.length>=3&&s[2]!=="0"?s[2]:void 0}}).filter(v):r}function ce(e){if(!e)return;const t=e.includes("/"),r=e.split(",");return t?r.map(n=>{const s=n.split("/");return s.length<2?null:{min:new Date(s[0]),max:new Date(s[1]),resolution:s.length>=3&&s[2]!=="0"?ft(s[2]):void 0}}).filter(v):r.map(n=>new Date(n))}function ft(e){const t=/(?:p(\d+y|\d+(?:.|,)\d+y)?(\d+m|\d+(?:.|,)\d+m)?(\d+d|\d+(?:.|,)\d+d)?)?(?:t(\d+h|\d+(?:.|,)\d+h)?(\d+m|\d+(?:.|,)\d+m)?(\d+s|\d+(?:.|,)\d+s)?)?/i,r=e.match(t);return r?{years:O(r[1]),months:O(r[2]),days:O(r[3]),hours:O(r[4]),minutes:O(r[5]),seconds:O(r[6])}:null}function O(e){if(!e)return 0;const t=/(?:\d+(?:.|,)\d+|\d+)/,r=e.match(t);if(!r)return 0;const n=r[0].replace(",",".");return Number(n)}function R(e){return e.toISOString().replace(/\.[0-9]{3}/,"")}const de=new Set([102100,3857,102113,900913]),yt=new Set([3395,54004]);function ht(e,t){let r=e.wkid;return $(t)?r:(r!=null&&t.includes(r)||!e.latestWkid||(r=e.latestWkid),r!=null&&de.has(r)?t.find(n=>de.has(n))||t.find(n=>yt.has(n))||102100:r)}const J=new je({bmp:"image/bmp",gif:"image/gif",jpg:"image/jpeg",png:"image/png",svg:"image/svg+xml"},{ignoreUnknown:!1});function me(e){return e==="text/html"}function fe(e){return e==="text/plain"}let c=class extends Te(Ce(qe(Be(Ve(We(ke(it))))))){constructor(...e){super(...e),this.allSublayers=new De({getCollections:()=>[this.sublayers],getChildrenFunction:t=>t.sublayers}),this.customParameters=null,this.customLayerParameters=null,this.copyright=null,this.description=null,this.dimensions=null,this.fullExtent=null,this.fullExtents=null,this.featureInfoFormats=null,this.featureInfoUrl=null,this.fetchFeatureInfoFunction=null,this.imageFormat=null,this.imageMaxHeight=2048,this.imageMaxWidth=2048,this.imageTransparency=!0,this.legendEnabled=!0,this.mapUrl=null,this.isReference=null,this.operationalLayerType="WMS",this.spatialReference=null,this.spatialReferences=null,this.sublayers=null,this.type="wms",this.url=null,this.version=null,this.addHandles([W(()=>this.sublayers,"after-add",({item:t})=>{t.parent=t.layer=this},L),W(()=>this.sublayers,"after-remove",({item:t})=>{t.layer=t.parent=null},L),he(()=>this.sublayers,(t,r)=>{if(r)for(const n of r)n.layer=n.parent=null;if(t)for(const n of t)n.parent=n.layer=this},L)])}normalizeCtorArgs(e,t){return typeof e=="string"?{url:e,...t}:e}load(e){const t=v(e)?e.signal:null;return this.addResolvingPromise(this.loadFromPortal({supportedTypes:["WMS"]},e).catch(Ge).then(()=>this._fetchService(t))),Promise.resolve(this)}readFullExtentFromItemOrMap(e,t){const r=t.extent;return r?new P({xmin:r[0][0],ymin:r[0][1],xmax:r[1][0],ymax:r[1][1]}):null}writeFullExtent(e,t){t.extent=[[e.xmin,e.ymin],[e.xmax,e.ymax]]}get featureInfoFormat(){return $(this.featureInfoFormats)?null:this.featureInfoFormats.find(me)??this.featureInfoFormats.find(fe)??null}set featureInfoFormat(e){v(e)?(me(e)||fe(e))&&this._override("featureInfoFormat",e):(this.revert("featureInfoFormat","service"),this._clearOverride("featureInfoFormat"))}readImageFormat(e,t){const r=t.supportedImageFormatTypes;return r&&r.includes("image/png")?"image/png":r&&r[0]}readSpatialReferenceFromItemOrDocument(e,t){return new I(t.spatialReferences[0])}writeSpatialReferences(e,t){var n;const r=(n=this.spatialReference)==null?void 0:n.wkid;e&&r?(t.spatialReferences=e.filter(s=>s!==r),t.spatialReferences.unshift(r)):t.spatialReferences=e}readSublayersFromItemOrMap(e,t,r){return ye(t.layers,r,t.visibleLayers)}readSublayers(e,t,r){return ye(t.layers,r)}writeSublayers(e,t,r,n){var a,m;t.layers=[];const s=new Map,l=e.flatten(({sublayers:i})=>i??[]);for(const i of l)if(typeof((a=i.parent)==null?void 0:a.id)=="number"){const y=s.get(i.parent.id);y!=null?y.push(i.id):s.set(i.parent.id,[i.id])}for(const i of l){const y={sublayer:i,...n},p=i.write({parentLayerId:typeof((m=i.parent)==null?void 0:m.id)=="number"?i.parent.id:-1},y);if(s.has(i.id)&&(p.sublayerIds=s.get(i.id)),!i.sublayers&&i.name){const f=i.write({},y);delete f.id,t.layers.push(f)}}t.visibleLayers=l.filter(({visible:i,sublayers:y})=>i&&!y).map(({name:i})=>i).toArray()}createExportImageParameters(e,t,r,n){const s=(n==null?void 0:n.pixelRatio)??1,l=se({extent:e,width:t})*s,a=new ie({layer:this,scale:l}),{xmin:m,ymin:i,xmax:y,ymax:p,spatialReference:f}=e,d=ht(f,this.spatialReferences),w=this.version==="1.3.0"&&Q(d)?`${i},${m},${p},${y}`:`${m},${i},${y},${p}`,E=a.toJSON();return{bbox:w,[this.version==="1.3.0"?"crs":"srs"]:d==null||isNaN(d)?void 0:"EPSG:"+d,...E}}async fetchImage(e,t,r,n){var p,f;const s=this.mapUrl,l=this.createExportImageParameters(e,t,r,n);if(!l.layers){const d=document.createElement("canvas");return d.width=t,d.height=r,d}const a=(p=n==null?void 0:n.timeExtent)==null?void 0:p.start,m=(f=n==null?void 0:n.timeExtent)==null?void 0:f.end,i=v(a)&&v(m)?a.getTime()===m.getTime()?R(a):`${R(a)}/${R(m)}`:void 0,y={responseType:"image",query:this._mixCustomParameters({width:t,height:r,...l,time:i,...this.refreshParameters}),signal:n==null?void 0:n.signal};return X(s??"",y).then(d=>d.data)}async fetchImageBitmap(e,t,r,n){var f,d;const s=this.mapUrl??"",l=this.createExportImageParameters(e,t,r,n);if(!l.layers){const w=document.createElement("canvas");return w.width=t,w.height=r,w}const a=(f=n==null?void 0:n.timeExtent)==null?void 0:f.start,m=(d=n==null?void 0:n.timeExtent)==null?void 0:d.end,i=v(a)&&v(m)?a.getTime()===m.getTime()?R(a):`${R(a)}/${R(m)}`:void 0,y={responseType:"blob",query:this._mixCustomParameters({width:t,height:r,...l,time:i,...this.refreshParameters}),signal:n==null?void 0:n.signal},{data:p}=await X(s,y);return Xe(p,s)}fetchFeatureInfo(e,t,r,n,s){const l=se({extent:e,width:t}),a=new ie({layer:this,scale:l}),m=ut(a.visibleSublayers);if($(this.featureInfoUrl)||$(m))return Promise.resolve([]);if($(this.fetchFeatureInfoFunction)&&$(this.featureInfoFormat))return Promise.resolve([]);const i=this.version==="1.3.0"?{I:n,J:s}:{x:n,y:s},y={query_layers:m,request:"GetFeatureInfo",info_format:this.featureInfoFormat,feature_count:25,width:t,height:r,...i},p={...this.createExportImageParameters(e,t,r),...y},f=this._mixCustomParameters(p);return v(this.fetchFeatureInfoFunction)?this.fetchFeatureInfoFunction(f):this._defaultFetchFeatureInfoFunction(He(this.featureInfoUrl,f))}findSublayerById(e){return this.allSublayers.find(t=>t.id===e)}findSublayerByName(e){return this.allSublayers.find(t=>t.name===e)}serviceSupportsSpatialReference(e){return Je(this.url)||this.spatialReferences!=null&&this.spatialReferences.some(t=>{const r=t===900913?I.WebMercator:new I({wkid:t});return Qe(r,e)})}_defaultFetchFeatureInfoFunction(e){const t=document.createElement("iframe");t.src=ze(e),t.style.border="none",t.style.margin="0",t.style.width="100%",t.setAttribute("sandbox","");const r=new Ke({title:this.title,content:t}),n=new Ye({sourceLayer:this,popupTemplate:r});return Promise.resolve([n])}async _fetchService(e){if(!this.resourceInfo){const{path:t,query:r}=this.parsedUrl??{};r!=null&&r.service&&(r.SERVICE=r.service,delete r.service),r!=null&&r.request&&(r.REQUEST=r.request,delete r.request);const{data:n}=await X(t??"",{query:{SERVICE:"WMS",REQUEST:"GetCapabilities",...r,...this.customParameters},responseType:"xml",signal:e});this.resourceInfo=lt(n)}if(this.parsedUrl){const t=new Ze(this.parsedUrl.path),{httpsDomains:r}=et.request;t.scheme!=="https"||t.port&&t.port!=="443"||!t.host||r.includes(t.host)||r.push(t.host)}this.read(this.resourceInfo,{origin:"service"})}_mixCustomParameters(e){if(!this.customLayerParameters&&!this.customParameters)return e;const t={...this.customParameters,...this.customLayerParameters};for(const r in t)e[r.toLowerCase()]=t[r];return e}};function gt(e,t){return e.some(r=>{for(const n in r)if(at(r,n,null,t))return!0;return!1})}function ye(e,t,r){e=e??[];const n=new Map;e.every(l=>l.id==null)&&(e=tt(e)).forEach((l,a)=>l.id=a);for(const l of e){const a=new z;a.read(l,t),r&&!r.includes(a.name)&&(a.visible=!1),n.set(a.id,a)}const s=[];for(const l of e){const a=l.id!=null?n.get(l.id):null;if(a)if(l.parentLayerId!=null&&l.parentLayerId>=0){const m=n.get(l.parentLayerId);if(!m)continue;m.sublayers||(m.sublayers=new K),m.sublayers.push(a)}else s.push(a)}return s}o([u({readOnly:!0})],c.prototype,"allSublayers",void 0),o([u({json:{type:Object,write:!0}})],c.prototype,"customParameters",void 0),o([u({json:{type:Object,write:!0}})],c.prototype,"customLayerParameters",void 0),o([u({type:String,json:{write:!0}})],c.prototype,"copyright",void 0),o([u()],c.prototype,"description",void 0),o([u({readOnly:!0})],c.prototype,"dimensions",void 0),o([u({json:{type:[[Number]],read:{source:"extent"},write:{target:"extent"},origins:{"web-document":{write:{ignoreOrigin:!0}},"portal-item":{write:{ignoreOrigin:!0}}}}})],c.prototype,"fullExtent",void 0),o([N(["web-document","portal-item"],"fullExtent",["extent"])],c.prototype,"readFullExtentFromItemOrMap",null),o([H(["web-document","portal-item"],"fullExtent",{extent:{type:[[Number]]}})],c.prototype,"writeFullExtent",null),o([u()],c.prototype,"fullExtents",void 0),o([u({type:String,json:{write:{ignoreOrigin:!0}}})],c.prototype,"featureInfoFormat",null),o([u({type:[String],readOnly:!0})],c.prototype,"featureInfoFormats",void 0),o([u({type:String,json:{write:{ignoreOrigin:!0}}})],c.prototype,"featureInfoUrl",void 0),o([u()],c.prototype,"fetchFeatureInfoFunction",void 0),o([u({type:String,json:{origins:{"web-document":{default:"image/png",type:J.jsonValues,read:{reader:J.read,source:"format"},write:{writer:J.write,target:"format"}}}}})],c.prototype,"imageFormat",void 0),o([N("imageFormat",["supportedImageFormatTypes"])],c.prototype,"readImageFormat",null),o([u({type:Number,json:{read:{source:"maxHeight"},write:{target:"maxHeight"}}})],c.prototype,"imageMaxHeight",void 0),o([u({type:Number,json:{read:{source:"maxWidth"},write:{target:"maxWidth"}}})],c.prototype,"imageMaxWidth",void 0),o([u()],c.prototype,"imageTransparency",void 0),o([u(rt)],c.prototype,"legendEnabled",void 0),o([u({type:["show","hide","hide-children"]})],c.prototype,"listMode",void 0),o([u({type:String,json:{write:{ignoreOrigin:!0}}})],c.prototype,"mapUrl",void 0),o([u({type:Boolean,json:{read:!1,write:{enabled:!0,overridePolicy:()=>({enabled:!1})}}})],c.prototype,"isReference",void 0),o([u({type:["WMS"]})],c.prototype,"operationalLayerType",void 0),o([u()],c.prototype,"resourceInfo",void 0),o([u({type:I,json:{origins:{service:{read:{source:"extent.spatialReference"}}},write:!1}})],c.prototype,"spatialReference",void 0),o([N(["web-document","portal-item"],"spatialReference",["spatialReferences"])],c.prototype,"readSpatialReferenceFromItemOrDocument",null),o([u({type:[nt],json:{read:!1,origins:{service:{read:!0},"web-document":{read:!1,write:{ignoreOrigin:!0}},"portal-item":{read:!1,write:{ignoreOrigin:!0}}}}})],c.prototype,"spatialReferences",void 0),o([H(["web-document","portal-item"],"spatialReferences")],c.prototype,"writeSpatialReferences",null),o([u({type:K.ofType(z),json:{write:{target:"layers",overridePolicy(e,t,r){if(gt(this.allSublayers,r))return{ignoreOrigin:!0}}}}})],c.prototype,"sublayers",void 0),o([N(["web-document","portal-item"],"sublayers",["layers","visibleLayers"])],c.prototype,"readSublayersFromItemOrMap",null),o([N("service","sublayers",["layers"])],c.prototype,"readSublayers",null),o([H("sublayers",{layers:{type:[z]},visibleLayers:{type:[String]}})],c.prototype,"writeSublayers",null),o([u({json:{read:!1},readOnly:!0,value:"wms"})],c.prototype,"type",void 0),o([u(st)],c.prototype,"url",void 0),o([u({type:String,json:{write:{ignoreOrigin:!0}}})],c.prototype,"version",void 0),c=o([ge("esri.layers.WMSLayer")],c);const vt=c;export{vt as default};

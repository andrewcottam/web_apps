import{aY as w,U as T,ea as L,s as m,cE as O,bI as D,eb as q,cP as N,G as $,ah as P,a1 as C,j as A,ec as U,a2 as j,a7 as x,ed as E,L as v,N as b,ee as k,aM as J,bD as I,ef as M,P as B,aI as F}from"./index-4a807205.js";const Y={type:w,json:{origins:{service:{read:{source:["tileInfo","minScale","maxScale","minLOD","maxLOD"],reader:R}}}}};function R(e,i,a,t){if(!e)return null;const{minScale:l,maxScale:n,minLOD:o,maxLOD:r}=i;if(o!=null&&r!=null)return t&&t.ignoreMinMaxLOD?w.fromJSON(e):w.fromJSON({...e,lods:e.lods.filter(({level:h})=>h!=null&&h>=o&&h<=r)});if(l!==0&&n!==0){const h=u=>Math.round(1e4*u)/1e4,s=l?h(l):1/0,c=n?h(n):-1/0;return w.fromJSON({...e,lods:e.lods.filter(u=>{const f=h(u.scale);return f<=s&&f>=c})})}return w.fromJSON(e)}class y{constructor(){this.location={left:0,top:0,width:0,height:0},this._allAvailability="unknown",this.byteSize=40}getAvailability(i,a){if(this._allAvailability!=="unknown")return this._allAvailability;const t=(i-this.location.top)*this.location.width+(a-this.location.left),l=t%8,n=t>>3,o=this._tileAvailabilityBitSet;return n<0||n>o.length?"unknown":o[n]&1<<l?"available":"unavailable"}_updateFromData(i){const a=this.location.width,t=this.location.height;let l=!0,n=!0;const o=Math.ceil(a*t/8),r=new Uint8Array(o);let h=0;for(let s=0;s<i.length;s++){const c=s%8;i[s]?(n=!1,r[h]|=1<<c):l=!1,c===7&&++h}n?this._allAvailability="unavailable":l?this._allAvailability="available":(this._allAvailability="unknown",this._tileAvailabilityBitSet=r,this.byteSize+=r.length)}static fromDefinition(i,a){const t=i.service.request||T,{row:l,col:n,width:o,height:r}=i,h={query:{f:"json"}};return a=a?{...h,...a}:h,t(G(i),a).then(s=>s.data).catch(s=>{if(s&&s.details&&s.details.httpStatus===422)return{location:{top:l,left:n,width:o,height:r},valid:!0,data:L(o*r,0)};throw s}).then(s=>{if(s.location&&(s.location.top!==l||s.location.left!==n||s.location.width!==o||s.location.height!==r))throw new m("tilemap:location-mismatch","Tilemap response for different location than requested",{response:s,definition:{top:l,left:n,width:o,height:r}});return y.fromJSON(s)})}static fromJSON(i){y._validateJSON(i);const a=new y;return a.location=Object.freeze(O(i.location)),a._updateFromData(i.data),Object.freeze(a)}static _validateJSON(i){if(!i||!i.location)throw new m("tilemap:missing-location","Location missing from tilemap response");if(i.valid===!1)throw new m("tilemap:invalid","Tilemap response was marked as invalid");if(!i.data)throw new m("tilemap:missing-data","Data missing from tilemap response");if(!Array.isArray(i.data))throw new m("tilemap:data-mismatch","Data must be an array of numbers");if(i.data.length!==i.location.width*i.location.height)throw new m("tilemap:data-mismatch","Number of data items does not match width/height of tilemap")}}function S(e){return`${e.level}/${e.row}/${e.col}/${e.width}/${e.height}`}function G(e){let i;if(e.service.type==="vector-tile")i=`${e.service.url}/tilemap/${e.level}/${e.row}/${e.col}/${e.width}/${e.height}`;else{const t=e.service.tileServers;i=`${t&&t.length?t[e.row%t.length]:e.service.url}/tilemap/${e.level}/${e.row}/${e.col}/${e.width}/${e.height}`}const a=e.service.query;return a&&(i=`${i}?${a}`),i}var d;let p=d=class extends D(F){constructor(e){super(e),this._pendingTilemapRequests={},this._availableLevels={},this.levels=5,this.cacheByteSize=2*q.MEGABYTES,this.request=T,this._prefetchingEnabled=!0}initialize(){this._tilemapCache=new N(this.cacheByteSize),this.addHandles([$(()=>{const{layer:e}=this;return[e==null?void 0:e.parsedUrl,e==null?void 0:e.tileServers,e==null?void 0:e.apiKey,e==null?void 0:e.customParameters]},()=>this._initializeTilemapDefinition()),$(()=>{var e,i;return(i=(e=this.layer)==null?void 0:e.tileInfo)==null?void 0:i.lods},e=>this._initializeAvailableLevels(e),J)]),this._initializeTilemapDefinition()}castLevels(e){return e<=2?(P.getLogger(this.declaredClass).error("Minimum levels for Tilemap is 3, but got ",e),3):e}get size(){return 1<<this.levels}fetchTilemap(e,i,a,t){if(!this._availableLevels[e])return Promise.reject(new m("tilemap-cache:level-unavailable",`Level ${e} is unavailable in the service`));const l=this._tmpTilemapDefinition,n=this._tilemapFromCache(e,i,a,l);if(n)return Promise.resolve(n);const o=t&&t.signal;return t={...t,signal:null},new Promise((r,h)=>{C(o,()=>h(I()));const s=S(l);let c=this._pendingTilemapRequests[s];if(!c){c=y.fromDefinition(l,t).then(f=>(this._tilemapCache.put(s,f,f.byteSize),f));const u=()=>delete this._pendingTilemapRequests[s];this._pendingTilemapRequests[s]=c,c.then(u,u)}c.then(r,h)})}getAvailability(e,i,a){if(!this._availableLevels[e])return"unavailable";const t=this._tilemapFromCache(e,i,a,this._tmpTilemapDefinition);return t?t.getAvailability(i,a):"unknown"}fetchAvailability(e,i,a,t){return this._availableLevels[e]?this.fetchTilemap(e,i,a,t).catch(l=>l).then(l=>{if(l instanceof y){const n=l.getAvailability(i,a);if(n==="unavailable")throw new m("tile-map:tile-unavailable","Tile is not available",{level:e,row:i,col:a});return n}if(A(l))throw l;return"unknown"}):Promise.reject(new m("tilemap-cache:level-unavailable",`Level ${e} is unavailable in the service`))}fetchAvailabilityUpsample(e,i,a,t,l){t.level=e,t.row=i,t.col=a;const n=this.layer.tileInfo;n.updateTileInfo(t);const o=this.fetchAvailability(e,i,a,l).catch(r=>{if(A(r))throw r;if(n.upsampleTile(t))return this.fetchAvailabilityUpsample(t.level,t.row,t.col,t);throw r});return this._fetchAvailabilityUpsamplePrefetch(t.id,e,i,a,l,o),o}async _fetchAvailabilityUpsamplePrefetch(e,i,a,t,l,n){if(!this._prefetchingEnabled||e==null)return;const o=`prefetch-${e}`;if(this.handles.has(o))return;const r=new AbortController;n.then(()=>r.abort(),()=>r.abort());let h=!1;const s={remove(){h||(h=!0,r.abort())}};if(this.handles.add(s,o),await U(10,r.signal).catch(()=>{}),h||(h=!0,this.handles.remove(o)),j(r))return;const c=new M(e,i,a,t),u={...l,signal:r.signal},f=this.layer.tileInfo;for(let z=0;d._prefetches.length<d._maxPrefetch&&f.upsampleTile(c);++z){const g=this.fetchAvailability(c.level,c.row,c.col,u);d._prefetches.push(g);const _=()=>{d._prefetches.removeUnordered(g)};g.then(_,_)}}_initializeTilemapDefinition(){var t;if(!this.layer.parsedUrl)return;const{parsedUrl:e,apiKey:i,customParameters:a}=this.layer;this._tilemapCache.clear(),this._tmpTilemapDefinition={service:{url:e.path,query:x({...e.query,...a,token:i??((t=e.query)==null?void 0:t.token)}),tileServers:this.layer.tileServers,request:this.request,type:this.layer.type},width:this.size,height:this.size,level:0,row:0,col:0}}_tilemapFromCache(e,i,a,t){t.level=e,t.row=i-i%this.size,t.col=a-a%this.size;const l=S(t);return this._tilemapCache.get(l)}_initializeAvailableLevels(e){this._availableLevels={},e&&e.forEach(i=>this._availableLevels[i.level]=!0)}get test(){const e=this;return{get prefetchingEnabled(){return e._prefetchingEnabled},set prefetchingEnabled(i){e._prefetchingEnabled=i},hasTilemap:(i,a,t)=>!!e._tilemapFromCache(i,a,t,e._tmpTilemapDefinition)}}};p._maxPrefetch=4,p._prefetches=new E({initialSize:d._maxPrefetch}),v([b({constructOnly:!0,type:Number})],p.prototype,"levels",void 0),v([k("levels")],p.prototype,"castLevels",null),v([b({readOnly:!0,type:Number})],p.prototype,"size",null),v([b({constructOnly:!0,type:Number})],p.prototype,"cacheByteSize",void 0),v([b({constructOnly:!0})],p.prototype,"layer",void 0),v([b({constructOnly:!0})],p.prototype,"request",void 0),p=d=v([B("esri.layers.support.TilemapCache")],p);export{R as n,Y as r,p as z};

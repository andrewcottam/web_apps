import{fp as h,s as i,r as a,U as d,i2 as b,i3 as w,d2 as v,_ as z,et as _,i4 as g}from"./index-5df536c7.js";let s=y();function y(){return new h(50)}function I(){s=y()}function P(e,r){if(e.type==="icon")return l(e,r);if(e.type==="object")return f(e,r);throw new i("symbol3d:unsupported-symbol-layer","computeLayerSize only works with symbol layers of type Icon and Object")}async function O(e,r){if(e.type==="icon")return j(e,r);if(e.type==="object")return B(e,r);throw new i("symbol3d:unsupported-symbol-layer","computeLayerSize only works with symbol layers of type Icon and Object")}async function l(e,r){var t,n;if((t=e.resource)!=null&&t.href)return L(e.resource.href).then(o=>[o.width,o.height]);if((n=e.resource)!=null&&n.primitive)return a(r)?[r,r]:[256,256];throw new i("symbol3d:invalid-symbol-layer","symbol layers of type Icon must have either an href or a primitive resource")}function j(e,r){return l(e,r).then(t=>{if(e.size==null)return t;const n=t[0]/t[1];return n>1?[e.size,e.size/n]:[e.size*n,e.size]})}function L(e){return d(e,{responseType:"image"}).then(r=>r.data)}function f(e,r){return S(e,r).then(t=>b(t))}async function B(e,r){const t=await f(e,r);return w(t,e)}async function S(e,r){var n;if(!e.isPrimitive){const o=v((n=e.resource)==null?void 0:n.href),u=s.get(o);if(u!==void 0)return u;const m=await z(()=>import("./objectResourceUtils-a7d5d5df.js").then(p=>p.o),["assets/objectResourceUtils-a7d5d5df.js","assets/devEnvironmentUtils-5002a058.js","assets/index-5df536c7.js","assets/index-308b4aa0.css","assets/mat3f64-221ce671.js","assets/mat4f64-1413b4a7.js","assets/BufferView-6dbb0b7c.js","assets/vec33-d6ebf3f2.js","assets/DefaultMaterial_COLOR_GAMMA-a1b4b46e.js","assets/types-e1c0a5bf.js","assets/enums-64ab819c.js","assets/Version-fb21d522.js","assets/quat-8d5f3518.js","assets/quatf64-3363c48e.js","assets/resourceUtils-71fe9113.js","assets/basicInterfaces-b7051eb1.js","assets/Indices-15a00de2.js","assets/NestedMap-1b5db22e.js","assets/requestImageUtils-bd588e57.js","assets/Util-97e89cd8.js","assets/sphere-f6241429.js","assets/VertexAttribute-15d1866a.js","assets/OrderIndependentTransparency-e1b3a745.js","assets/Texture-d9a19edf.js","assets/VertexArrayObject-fa651786.js","assets/VertexElementDescriptor-2925c6af.js","assets/InterleavedLayout-367f9553.js","assets/vec3f32-ad1dc57f.js","assets/doublePrecisionUtils-e3c3d0d8.js","assets/symbolColorUtils-873bf5f2.js"]),c=await m.fetch(o,{disableTextures:!0});return s.put(o,c.referenceBoundingBox),c.referenceBoundingBox}let t=null;if(e.resource&&e.resource.primitive&&(t=_(g(e.resource.primitive)),a(r)))for(let o=0;o<t.length;o++)t[o]*=r;return t?Promise.resolve(t):Promise.reject(new i("symbol:invalid-resource","The symbol does not have a valid resource"))}export{I as clearBoundingBoxCache,l as computeIconLayerResourceSize,P as computeLayerResourceSize,O as computeLayerSize,f as computeObjectLayerResourceSize};
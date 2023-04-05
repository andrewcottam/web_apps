import{ah as y,l5 as m,_ as h,l6 as w,t as v,s as d,l7 as b,gF as x,l8 as _,l9 as F,la as E}from"./index-4a807205.js";const p=y.getLogger("esri.layers.support.labelFormatUtils"),g={type:"simple",evaluate:()=>null},V={getAttribute:(a,n)=>a.field(n)};async function $(a,n,e){if(!a||!a.symbol||!n)return g;const l=a.where,u=m(a),o=l?await h(()=>import("./WhereClause-3a302db5.js").then(r=>r.W),["assets/WhereClause-3a302db5.js","assets/index-4a807205.js","assets/index-308b4aa0.css","assets/executionError-fb3f283a.js"]):null;let i;if(u.type==="arcade"){const r=await w(u.expression,e,n);if(v(r))return g;i={type:"arcade",evaluate(s){try{const t=r.evaluate({$feature:"attributes"in s?r.repurposeFeature(s):s});if(t!=null)return t.toString()}catch{p.error(new d("arcade-expression-error","Encountered an error when evaluating label expression for feature",{feature:s,expression:u}))}return null},needsHydrationToEvaluate:()=>F(u.expression)==null}}else i={type:"simple",evaluate:r=>u.expression.replace(/{[^}]*}/g,s=>{const t=s.slice(1,-1),c=n.get(t);if(!c)return s;let f=null;return"attributes"in r?r&&r.attributes&&(f=r.attributes[c.name]):f=r.field(c.name),f==null?"":L(f,c)})};if(l){let r;try{r=o.WhereClause.create(l,n)}catch(t){return p.error(new d("bad-where-clause","Encountered an error when evaluating where clause, ignoring",{where:l,error:t})),g}const s=i.evaluate;i.evaluate=t=>{const c="attributes"in t?void 0:V;try{if(r.testFeature(t,c))return s(t)}catch(f){p.error(new d("bad-where-clause","Encountered an error when evaluating where clause for feature",{where:l,feature:t,error:f}))}return null}}return i}function L(a,n){if(a==null)return"";const e=n.domain;if(e){if(e.type==="codedValue"||e.type==="coded-value"){const u=a;for(const o of e.codedValues)if(o.code===u)return o.name}else if(e.type==="range"){const u=+a,o="range"in e?e.range[0]:e.minValue,i="range"in e?e.range[1]:e.maxValue;if(o<=u&&u<=i)return e.name}}let l=a;return n.type==="date"||n.type==="esriFieldTypeDate"?l=b(l,E("short-date")):x(n)&&(l=_(+l)),l||""}export{$ as createLabelFunction,L as formatField};

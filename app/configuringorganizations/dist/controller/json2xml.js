$.extend({json2xml:function(e,t){t=t||{};n();var r=p(e);return r;function n(){if(t.escapeMode===undefined){t.escapeMode=true}t.attributePrefix=t.attributePrefix||"_";t.arrayAccessForm=t.arrayAccessForm||"none";t.emptyNodeForm=t.emptyNodeForm||"text";if(t.enableToStringFunc===undefined){t.enableToStringFunc=true}t.arrayAccessFormPaths=t.arrayAccessFormPaths||[];if(t.skipEmptyTextNodesForObj===undefined){t.skipEmptyTextNodesForObj=true}if(t.stripWhitespaces===undefined){t.stripWhitespaces=true}t.datetimeAccessFormPaths=t.datetimeAccessFormPaths||[]}function i(e,r,n,i){var a="<"+(e!=null&&e.__prefix!=null?e.__prefix+":":"")+r;if(n!=null){for(var f=0;f<n.length;f++){var u=n[f];var o=e[u];if(t.escapeMode)o=c(o);a+=" "+u.substr(t.attributePrefix.length)+"='"+o+"'"}}if(!i)a+=">";else a+="/>";return a}function a(e,t){return"</"+(e.__prefix!=null?e.__prefix+":":"")+t+">"}function f(e,t){return e.indexOf(t,e.length-t.length)!==-1}function u(e){return e.prefix}function c(e){if(typeof e=="string")return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;");else return e}function o(e){return e.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&#x2F;/g,"/")}function s(e,r){if(t.arrayAccessForm=="property"&&f(r.toString(),"_asArray")||r.toString().indexOf(t.attributePrefix)==0||r.toString().indexOf("__")==0||e[r]instanceof Function)return true;else return false}function l(e){var t=0;if(e instanceof Object){for(var r in e){if(s(e,r))continue;t++}}return t}function p(e){var t="";var r=l(e);if(r>0){for(var n in e){if(s(e,n))continue;var f=e[n];var u=d(f);if(f==null||f==undefined){t+=i(f,n,u,true)}else if(f instanceof Object){if(f instanceof Array){t+=_(f,n,u)}else if(f instanceof Date){t+=i(f,n,u,false);t+=f.toISOString();t+=a(f,n)}else{var c=l(f);if(c>0||f.__text!=null||f.__cdata!=null){t+=i(f,n,u,false);t+=p(f);t+=a(f,n)}else{t+=i(f,n,u,true)}}}else{t+=i(f,n,u,false);t+=x(f);t+=a(f,n)}}}t+=x(e);return t}function d(e){var r=[];if(e instanceof Object){for(var n in e){if(n.toString().indexOf("__")==-1&&n.toString().indexOf(t.attributePrefix)==0){r.push(n)}}}return r}function g(e){var r="";if(e.__cdata!=null){r+="<![CDATA["+e.__cdata+"]]>"}if(e.__text!=null){if(t.escapeMode)r+=c(e.__text);else r+=e.__text}return r}function x(e){var r="";if(e instanceof Object){r+=g(e)}else if(e!=null){if(t.escapeMode)r+=c(e);else r+=e}return r}function _(e,t,r){var n="";if(e.length==0){n+=i(e,t,r,true)}else{for(var f=0;f<e.length;f++){n+=i(e[f],t,d(e[f]),false);n+=p(e[f]);n+=a(e[f],t)}}return n}}});
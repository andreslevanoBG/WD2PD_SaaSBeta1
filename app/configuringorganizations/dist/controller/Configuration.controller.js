sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/core/Fragment","sap/ui/model/json/JSONModel","./json2xml","sap/m/MessageBox"],function(e,t,a,r,s){"use strict";return e.extend("shapein.ConfiguringOrganizations.controller.Configuration",{onInit:function(){var e=this.getOwnerComponent().getModel();this.getView().setModel(e,"Base64");var t=this;e.attachBatchRequestCompleted(function(a){var r=a.getParameter("requests");for(var s=0;s<r.length;s++){if(r[s].url=="Subscription_Settings"){t.readBase64(e)}}})},readBase64:function(e){var t=this;var a="/Configurations";var r=new sap.ui.model.Filter("pck_code",sap.ui.model.FilterOperator.EQ,"SYN_ORG");e.read(a,{filters:[r],success:function(e,a){var r;if(e.results.length!==0){var s=t._convertBase64toXML(e.results[0].value);var o=$.parseXML(s);r=t.transformXML2JSON(o)}else{r=t.createJSON()}var i=t.getJsonModel(r);t.getView().setModel(i,"ModelJSON");var n=t.formatCountryLogic(i);t.getView().setModel(n,"CountryLogic")}})},transformXML2JSON:function(e){var t=this.createJSON();var a=e.childNodes;var r=a[0].childNodes;var s=r[0].childNodes;var o=s[0].childNodes;var i=o[0].childNodes;var n=i[0].childNodes;var l=n[0].childNodes;for(var g=0;g<l.length;g++){var d=l[g].childNodes;if(d.length!=0){var c=l[g].getAttribute("secuence")*1;if(d[0].childNodes.length!==0){var u=d[0].childNodes[0].textContent}else{u=" "}if(d[1].childNodes.length!==0){var _=d[1].childNodes[0].textContent}else{_=" "}if(d[2].childNodes.length!==0){var f=d[2].childNodes[0].textContent}else{f=" "}t.global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.push({usage_public:u,type_data_primary:_,type_reference:f,_secuence:c})}}var v=n[1].childNodes;for(var h=0;h<v.length;h++){var p=v[h].childNodes;if(p.length!==0){var w=v[0].id;if(p[0].childNodes.length!=0){var y=p[0].childNodes[0].textContent}else{y=" "}if(p[1].childNodes.length!=0){var b=p[1].childNodes[0].textContent}else{b=" "}if(p[2].childNodes.length!=0){var m=p[2].childNodes[0].textContent}else{m=" "}t.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country.push({address1:y,address2:b,address3:m,_id:w})}}var N=i[1].childNodes;var M=N[0].childNodes;for(var V=0;V<M.length;V++){var I=M[V].id;if(M[V].childNodes.length!==0){var C=M[V].childNodes[0].textContent;t.global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.push({_id:I,__text:C})}}var S=s[1].childNodes;var P=S[0].childNodes;var O=P[0].childNodes[0].textContent;t.global_configuration.web_services.ws_get_organizations.request_filter.include_inactive_orgs=O;var x=s[2].childNodes;var D=x[0].childNodes;var A=D[0].childNodes;var J=A[0].childNodes;for(var k=0;k<J.length;k++){var z=J[k].childNodes;if(z.length!=0){var L=J[k].getAttribute("secuence")*1;if(z[0].childNodes.length!==0){var T=z[0].childNodes[0].textContent}else{T=" "}if(z[1]!==undefined){var B=z[1].childNodes[0].textContent}else{B=" "}if(z[2]!==undefined){var R=z[2].childNodes[0].textContent}else{R=" "}t.global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.push({usage_public:T,type_data_primary:B,type_reference:R,_secuence:L})}}var K=r[1].childNodes;var U=K[0].childNodes;for(var E=0;E<U.length;E++){var F=U[E].childNodes;if(F.length!=0){if(F[0].childNodes.length!==0){var q=F[0].childNodes[0].textContent}else{q=" "}if(F[1].childNodes.length!==0){var X=F[1].childNodes[0].textContent}else{X=" "}if(F[2].childNodes.length!==0){var j=F[2].childNodes[0].textContent}else{j=" "}}t.global_configuration.transformations.organization_code.transformation.push({characters:q,separator:X,replace_by:j})}return t},createJSON:function(){var e={global_configuration:{web_services:{ws_get_locations:{mappings:{address_data:{filters:{filter:[]},country_logic:{country:[]}},zip_code:{default_values:{country:[]}}}},ws_get_organizations:{request_filter:{include_inactive_orgs:"False"}},ws_get_workers:{mappings:{email:{filters:{filter:[]}}}}},transformations:{organization_code:{transformation:[]}}}};return e},_convertBase64toXML:function(e){var t=window.atob(e);return t},getJsonModel:function(e){var t=new a;t.oData=e;return t},formatCountryLogic:function(e){var t=new a;var r=[];var s=e.getData();for(var o=0;o<s.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country.length;o++){r.push({country:s.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[o]._id,field:"Address 1",value:s.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[o].address1});r.push({country:s.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[o]._id,field:"Address 2",value:s.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[o].address2});r.push({country:s.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[o]._id,field:"Address 3",value:s.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[o].address3})}t.oData=r;return t},booleanTrans:function(e){if(e==="True"){return true}else{return false}},booleanTransOp:function(e){if(e==="True"){return false}else{return true}},addRow_zipcode:function(e){var t=this.getView().getModel("ModelJSON");if(t.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.length===undefined){t.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country=[{_id:"",__text:""}]}else{t.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.push({_id:"",__text:""})}this.getView().getModel("ModelJSON").refresh()},deleteRow_zipcode:function(e){var t=this.getView().getModel("ModelJSON");var a=this.getView().byId("table0_1603812570312");var r=a.getSelectedItems();if(r.length!==0){for(var s=0;s<r.length;s++){var o=r[s];var i=o.oBindingContexts.ModelJSON.getProperty();for(var n=0;n<t.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.length;n++){if(t.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country[n]===i){t.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.splice(n,1);this.getView().getModel("ModelJSON").refresh()}}}}else{sap.m.MessageToast.show("Please, select a row to delete.")}},addRow_email:function(e){var t=this.getView().getModel("ModelJSON");if(t.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.length==undefined){t.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter=[{usage_public:"",type_data_primary:"",type_reference:"",_secuence:""}]}else{t.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.push({usage_public:"",type_data_primary:"",type_reference:"",_secuence:""})}this.getView().getModel("ModelJSON").refresh()},deleteRow_email:function(e){var t=this.getView().getModel("ModelJSON");var a=this.getView().byId("table0_1603812787387");var r=a.getSelectedItems();if(r.length!=0){for(var s=0;s<r.length;s++){var o=r[s];var i=o.oBindingContexts.ModelJSON.getProperty();for(var n=0;n<t.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.length;n++){if(t.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter[n]==i){t.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.splice(n,1);this.getView().getModel("ModelJSON").refresh()}}}}else{sap.m.MessageToast.show("Please, select a row to delete.")}},addRow_address:function(e){var t=this.getView().getModel("ModelJSON");if(t.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.length==undefined){t.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter=[{business_site_address:"",address_format_type:"",_secuence:""}]}else{t.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.push({business_site_address:"",address_format_type:"",_secuence:""})}this.getView().getModel("ModelJSON").refresh()},deleteRow_address:function(e){var t=this.getView().getModel("ModelJSON");var a=this.getView().byId("table0");var r=a.getSelectedItems();if(r.length!=0){for(var s=0;s<r.length;s++){var o=r[s];var i=o.oBindingContexts.ModelJSON.getProperty();for(var n=0;n<t.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.length;n++){if(t.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter[n]==i){t.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.splice(n,1);this.getView().getModel("ModelJSON").refresh()}}}}else{sap.m.MessageToast.show("Please, select a row to delete.")}},addRow_country:function(e){var t;var a=this.getView().byId("combo03423").getSelectedItem();if(a!==null){var r=this.getView().getModel("CountryLogic");var s=this.getView().byId("table0_copy").getItems();if(s.length!==0){for(var o=0;o<s.length;o++){if(s[o].getAggregation("cells")!==null){var i=s[o].getAggregation("cells")[0].getProperty("text");if(i===a.getProperty("key")){sap.m.MessageToast.show("This country is already selected.");t=false;break}else{t=true}}}}else{t=true}if(t){r.oData.push({country:a.getProperty("key"),field:"Address 1",value:""});r.oData.push({country:a.getProperty("key"),field:"Address 2",value:""});r.oData.push({country:a.getProperty("key"),field:"Address 3",value:""});this.getView().getModel("CountryLogic").refresh()}}else{sap.m.MessageToast.show("Please, select a country to add.")}},deleteRow_country:function(e){var t=this.getView().getModel("CountryLogic");var a=this.getView().byId("table0_copy");var r=a.getSelectedItems();if(r.length!=0){for(var s=0;s<r.length;s++){var o=r[s];var i=o.oBindingContexts.CountryLogic.getProperty();for(var n=0;n<t.getData().length;n++){if(t.getData()[n].country==i.country){[1,2,3].forEach(function(e){t.getData().splice(n,1)});this.getView().getModel("CountryLogic").refresh();break}}}}else{sap.m.MessageToast.show("Please, select a row to delete.")}},addRow_trans:function(e){var t=this.getView().getModel("ModelJSON");if(t.getData().global_configuration.transformations.organization_code.transformation.length==undefined){t.getData().global_configuration.transformations.organization_code.transformation=[{characters:" ",separator:" ",replace_by:" ",_secuence:null}]}else{t.getData().global_configuration.transformations.organization_code.transformation.push({characters:" ",separator:" ",replace_by:" ",_secuence:null})}this.getView().getModel("ModelJSON").refresh()},deleteRow_trans:function(e){var t=this.getView().getModel("ModelJSON");var a=this.getView().byId("table1");var r=a.getSelectedItems();if(r.length!=0){for(var s=0;s<r.length;s++){var o=r[s];var i=o.oBindingContexts.ModelJSON.getProperty();for(var n=0;n<t.getData().global_configuration.transformations.organization_code.transformation.length;n++){if(t.getData().global_configuration.transformations.organization_code.transformation[n]==i){t.getData().global_configuration.transformations.organization_code.transformation.splice(n,1);this.getView().getModel("ModelJSON").refresh()}}}}else{sap.m.MessageToast.show("Please, select a row to delete.")}},handleUploadComplete:function(e){var t=e.getParameter("response");if(t){var a="";var r=/^\[(\d\d\d)\]:(.*)$/.exec(t);if(r[1]=="200"){a="Return Code: "+r[1]+"\n"+r[2]+"(Upload Success)";e.getSource().setValue("")}else{a="Return Code: "+r[1]+"\n"+r[2]+"(Upload Error)"}MessageToast.show(a)}},handleUploadPress:function(){var e=this.byId("fileUploader");e.upload()},buildAddressChk:function(e){var a=this.getView();var r=this;var s=e.getSource().getParent().getAggregation("cells")[2].getProperty("value");this.countryLogic=s;var o=this.getView().byId("table0_copy").getItems();for(var i=0;i<o.length;i++){if(e.getSource().getParent().getBindingContextPath()===o[i].getBindingContextPath()){this.countryLogicIndex=i}}if(!this.byId("buildAddressChk")){t.load({id:a.getId(),name:"shapein.ConfiguringOrganizations.view.buildAddressChk",controller:this}).then(function(e){a.addDependent(e);e.open();a().byId("area210").setValue(r.countryLogic)})}else{this.byId("buildAddressChk").open();this.byId("area210").setValue(this.countryLogic)}},onCloseBuildAddressChk:function(e){var t=this.getView().byId("area210").getValue();var a=this.getView().byId("table0_copy").getItems();for(var r=0;r<a.length;r++){if(this.countryLogicIndex==r){}}this.byId("buildAddressChk").close()},onAcceptBuildAddressChk:function(e){var t=this.getView().byId("area210").getValue();var a=this.getView().byId("table0_copy").getItems();for(var r=0;r<a.length;r++){if(this.countryLogicIndex==r){a[this.countryLogicIndex].getAggregation("cells")[2].setValue(t)}}this.byId("buildAddressChk").close()},addOption:function(){var e=this.getView().byId("table13423").getSelectedItems();for(var t=0;t<e.length;t++){var a=e[t].getAggregation("cells")[0];var r="{"+a.getProperty("text")+"}";var s=this.getView().byId("area210").getValue();s=s+r;this.getView().byId("area210").setValue(s)}this.getView().byId("table13423").removeSelections()},deleteOption:function(){var e=this.getView().byId("area210").getValue();e="";this.getView().byId("area210").setValue(e);this.getView().byId("table13423").removeSelections()},saveConfiguration:function(e){var t=[];var a=this.validation2Save();if(a){t=this.getUpdatedArray();var r=this.transformToBase64(t);var s=this.getView().getModel("Base64");var o={value:r};var i="/Configurations(pck_code='SYN_ORG',conf_code='SCE-CONFIG')";s.update(i,o,{success:function(e,t){sap.m.MessageToast.show("Organizations Configurations updated.")},error:function(e,t){sap.m.MessageToast.show("Data can not be updated. Please try again")}})}else{sap.m.MessageToast.show("There is a field with wrong value.")}},getUpdatedArray:function(){var e=this.createJSON();var t;if(this.getView().byId("rb001").getProperty("selected")){t="True"}else{t="False"}e.global_configuration.web_services.ws_get_organizations.request_filter.include_inactive_orgs=t;var a=this.getView().byId("table0").getItems();for(var r=0;r<a.length;r++){var s=a[r].getAggregation("cells");var o=s[0].getProperty("selectedKey");var i=s[1].getProperty("selectedKey");var n=s[2].getProperty("selectedKey");var l=s[3].getProperty("value").replace("_"," ")*1;e.global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.push({usage_public:o,type_data_primary:i,type_reference:n,_secuence:l})}var g=this.getView().byId("table0_copy").getItems();var d=[];for(var c=0;c<g.length;c++){if(g[c].getAggregation("cells")!==null){var u=g[c].getAggregation("cells");var _=u[0].getProperty("text");var f=u[2].getProperty("value");d.push(f);if(d.length===3){e.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country.push({address1:d[0],address2:d[1],address3:d[2],_id:_});d=[]}}}var v=this.getView().byId("table0_1603812570312").getItems();for(var h=0;h<v.length;h++){var p=v[h].getAggregation("cells");var w=p[0].getProperty("selectedKey");var y=p[1].getProperty("value");e.global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.push({_id:w,__text:y})}var b=this.getView().byId("table0_1603812787387").getItems();for(var c=0;c<b.length;c++){var m=b[c].getAggregation("cells");var N=m[0].getProperty("selectedKey");var M=m[1].getProperty("selectedKey");var V=m[2].getProperty("selectedKey");var I=m[3].getProperty("value").replace("_"," ")*1;e.global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.push({usage_public:N,type_data_primary:M,type_reference:V,_secuence:I})}var C=this.getView().byId("table1").getItems();for(var S=0;S<C.length;S++){var P=C[S].getAggregation("cells");var O=P[0].getProperty("value");var x=P[1].getProperty("value");var D=P[2].getProperty("value");e.global_configuration.transformations.organization_code.transformation.push({characters:O,separator:x,replace_by:D})}return e},transformToBase64:function(e){var t;var a=$.json2xml(e);var t=window.btoa(a);return t},validateCountryZipCode:function(e){var t=this;var a=this.getView().byId("table0_1603812570312").getItems();var r=e.getParameters().selectedItem.getProperty("key");var s=e.getParameters().id;s=s.substring(s.length-2);s=s.replace("-","")*1;for(var o=0;o<a.length;o++){var i=a[o].getAggregation("cells")[0].getProperty("selectedKey");if(r===i&&o!==s){e.getSource().setValueState("Error");break}else{e.getSource().setValueState("None")}}},validation2Save:function(){var e=true;var t=this.getView().byId("table0_1603812570312").getItems();for(var a=0;a<t.length;a++){var r=t[a].getAggregation("cells")[0].getValueState();if(r==="Error"){e=false;break}else{e=true}}return e}})});
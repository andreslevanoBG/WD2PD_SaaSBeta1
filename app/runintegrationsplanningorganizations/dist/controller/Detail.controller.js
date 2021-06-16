sap.ui.define(["./BaseController","sap/ui/model/json/JSONModel","../model/formatter","sap/m/library","sap/ui/core/Fragment"],function(e,t,a,i,n){"use strict";var r=i.URLHelper;return e.extend("shapein.RunIntegrationPlanningOrganizations.controller.Detail",{formatter:a,adataOld:{},oldKey:"",_formFragments:null,onInit:function(){var e=new t({busy:false,delay:0,lineItemListTitle:this.getResourceBundle().getText("detailLineItemTableHeading")});this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched,this);this.setModel(e,"detailView");this.oSemanticPage=this.byId("detailPage");this.oEditAction=this.byId("editAction");this.oDeleteAction=this.byId("deleteAction");this.showCustomActions(false);var a=new t({execute:true,begda:"2020-01-01",endda:"9999-12-31",periodicity_type:"W",ontime:false,periodicity_values:"2-4-6",time_frecuency:"1m",time_start:"00:00:00",time_end:"23:59:00",time_zone:"UTC"});this.setModel(a,"newPlan");var i=new t;var n=[];var r={};for(var s=0;s<31;s++){var r={};r.text=s+1;r.key=r.text;n.push(r)}i.setData(n);this.setModel(new t,"adata");this.setModel(i,"days");this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));this.createFragmentsData()},onExit:function(){this._formFragments["DisplayData"].destroy();this._formFragments["ChangeData"].destroy();this._formFragments=null},createFragmentsData:function(){var e="DisplayData";this._formFragments=[];var t="shapein.RunIntegrationPlanningOrganizations.view.fragment."+e;n.load({id:"displayData",name:t,controller:this}).then(function(t){this.getView().addDependent(t);this._formFragments[e]=t;this._toggleButtonsAndView(false)}.bind(this));var a="ChangeData";var i="shapein.RunIntegrationPlanningOrganizations.view.fragment."+a;n.load({id:"changeData",name:i,controller:this}).then(function(e){this.getView().addDependent(e);var t=function(e){var t=e.text;return new sap.m.Token({key:t,text:t})};this._formFragments[a]=e}.bind(this))},onSendEmailPress:function(){var e=this.getModel("detailView");r.triggerEmail(null,e.getProperty("/shareSendEmailSubject"),e.getProperty("/shareSendEmailMessage"))},onShareInJamPress:function(){var e=this.getModel("detailView"),t=sap.ui.getCore().createComponent({name:"sap.collaboration.components.fiori.sharing.dialog",settings:{object:{id:location.href,share:e.getProperty("/shareOnJamTitle")}}});t.open()},onListUpdateFinished:function(e){var t,a=e.getParameter("total"),i=this.getModel("detailView");if(this.byId("lineItemsList").getBinding("items").isLengthFinal()){if(a){t=this.getResourceBundle().getText("detailLineItemTableHeadingCount",[a])}else{t=this.getResourceBundle().getText("detailLineItemTableHeading")}i.setProperty("/lineItemListTitle",t)}},_onObjectMatched:function(e){var t=e.getParameter("arguments").objectId;this.getModel("appView").setProperty("/layout","TwoColumnsMidExpanded");this.getModel().metadataLoaded().then(function(){var e=this.getModel().createKey("Integration_Pck_Planning",{uuid:t});this._bindView("/"+e)}.bind(this))},_bindView:function(e){var t=this.getModel("detailView");t.setProperty("/busy",false);this.getView().bindElement({path:e,events:{change:this._onBindingChange.bind(this),dataRequested:function(){t.setProperty("/busy",true)},dataReceived:function(){t.setProperty("/busy",false)}}})},_onBindingChange:function(){var e=this.getView(),t=e.getElementBinding();if(!t.getBoundContext()){this.getRouter().getTargets().display("detailObjectNotFound");this.getOwnerComponent().oListSelector.clearMasterListSelection();return}var a=t.getPath(),i=this.getResourceBundle(),n=e.getModel().getObject(a),r=n.uuid,s=n.uuid,o=this.getModel("detailView");if(n.enable){this.oldKey="A"}else{this.oldKey="U"}var l=this.getOwnerComponent().getModel();var u=this.getView().getModel("adata");var d=this;o.refresh();l.read(a,{urlParameters:{$expand:"adata"},success:function(e,t){var a=e.adata.results;delete e.__metadata;var i={};var n={};i.orgsTopLevel=[];n.orgsTopLevel=[];a.forEach(function(e){delete e.__metadata;switch(e.level2){case"TIME_ZONE":i.time_zone=e.value;i.time_zone_uuid=e.uuid;i.planning_uuid=e.planning_uuid;n.time_zone=e.value;n.time_zone_uuid=e.uuid;n.planning_uuid=e.planning_uuid;break;case"INITIAL_DATE_FROM":i.initial_date_from=e.value;i.initial_date_from_uuid=e.uuid;n.initial_date_from=e.value;n.initial_date_from_uuid=e.uuid;break;case"RETRO_CHG_EFFECTIVE_FROM":i.retro_effec_from=e.value;i.retro_effec_from_uuid=e.uuid;n.retro_effec_from=e.value;n.retro_effec_from_uuid=e.uuid;break;case"FUTURE_CHG_UPDATED_FROM":n.fut_upd_from=e.value;n.fut_upd_from_uuid=e.uuid;i.fut_upd_from=e.value;i.fut_upd_from_uuid=e.uuid;break;case"NEXT_UPDATED_FROM":i.next_upd_from=e.value;i.next_upd_from_uuid=e.uuid;n.next_upd_from=e.value;n.next_upd_from_uuid=e.uuid;break;case"REFERENCE_ID":i.ref_id=e.value;i.ref_id_uuid=e.uuid;n.ref_id=e.value;n.ref_id_uuid=e.uuid;break;case"SUPERVISORY-PD_PARENT":var t={};t.organization=e.value;t.pd_parent=e.value2;t.Uuid=e.uuid;i.orgsTopLevel.push(t);n.orgsTopLevel.push(t);break;default:}});d.adataOld=n;u.setData(i);o.setProperty("/busy",false)},error:function(e){o.setProperty("/busy",false)}});if(this._formFragments!==null){var g=this._formFragments["ChangeData"];if(g){this._toggleButtonsAndView(false)}}this.getOwnerComponent().oListSelector.selectAListItem(a);this.showCustomActions(false);this.oEditAction.setVisible(true);var c=a+"/last_execution";var p=l.getProperty(c);if(p===null){this.oDeleteAction.setVisible(true)}else{this.oDeleteAction.setVisible(false)}this.byId("segButton").setEnabled(false);this.byId("comDisplay").setVisible(true);this.byId("comChange").setVisible(false);o.setProperty("/saveAsTileTitle",i.getText("shareSaveTileAppTitle",[s]));o.setProperty("/shareOnJamTitle",s);o.setProperty("/shareSendEmailSubject",i.getText("shareSendEmailObjectSubject",[r]));o.setProperty("/shareSendEmailMessage",i.getText("shareSendEmailObjectMessage",[s,r,location.href]))},addRow_toplevelA:function(e){var t=this.getView().getModel("adata");var a=t.getData();var i={organization:"",pd_parent:""};a.orgsTopLevel.push(i);t.setData(a);t.refresh()},deleteRow_toplevelA:function(e){var t=this.getView().getModel("adata");var a=n.byId("changeData","tableOrgs4");var i=a.getSelectedItem();if(i){var r=i.getBindingContext("adata").getPath();var s=parseInt(r.substr(r.length-1));t.getData().orgsTopLevel.splice(s,1);t.refresh()}else{sap.m.MessageToast.show("Please, select a row to delete.")}},_onMetadataLoaded:function(){var e=this.getView().getBusyIndicatorDelay(),t=this.getModel("detailView"),a=this.byId("lineItemsList"),i=a.getBusyIndicatorDelay();t.setProperty("/delay",0);t.setProperty("/lineItemTableDelay",0);a.attachEventOnce("updateFinished",function(){t.setProperty("/lineItemTableDelay",i)});t.setProperty("/busy",true);t.setProperty("/delay",e);this.byId("edit").setEnabled(true)},_getFormFragment:function(e){var t=this._formFragments[e];if(t){return t}},_showFormFragment:function(e){var t=this.byId("icontabData");var a=t.getContent();var i=this.getView().createId("bar");if(a[0].getId()!==i){var n=a[0].getId();t.removeContent(n)}var r=this._getFormFragment(e);t.insertContent(r)},handleEditPress:function(){this._toggleButtonsAndView(true)},_toggleButtonsAndView:function(e){var t=this.getView();t.byId("edit").setVisible(!e);t.byId("save").setVisible(e);t.byId("cancel").setVisible(e);this._showFormFragment(e?"ChangeData":"DisplayData")},handleCancelPress:function(){var e=this.getView().getModel();var t=this.getView().getModel("adata");var a=Object.assign({},this.adataOld);t.setData(a);t.refresh();this._toggleButtonsAndView(false)},_validateInputEditA:function(e){var t="None";var a=false;var i=e.getBinding("value");var n=e.getValue();if(n==""){t="Error";a=true}e.setValueState(t);return a},handleSavePress:function(e){var t=this.getView().getModel("adata");var a=t.getData();var i=this.getOwnerComponent().getModel();var r=this.getView().createId("changeData");var s=this.getView(),o=[n.byId("changeData","dp1"),n.byId("changeData","dp2"),n.byId("changeData","dp3"),n.byId("changeData","dp4")],l=false;o.forEach(function(e){l=this._validateInputEditA(e)||l},this);if(l){sap.m.MessageBox.alert("A validation error has occurred.");return}var u="Are you sure you want to update a Organizations Planning Adata?";var d=this;var g=new sap.m.Dialog({title:"Confirmation",type:"Message",content:new sap.m.Text({text:u}),beginButton:new sap.m.Button({text:"Yes",press:function(){var e=d.getModel("detailView");e.setProperty("/busy",true);var r=t.getProperty("/planning_uuid");r=d.byId("title").getText();var s="/Integration_Pck_Planning_Adata";i.setDeferredGroups(["updateGroup"]);var o={};var l=s+"("+a.time_zone_uuid+")";o.uuid=a.time_zone_uuid;o.value=a.time_zone;i.update(l,o,{groupId:"updateGroup"});var u={};var c=s+"("+a.next_upd_from_uuid+")";u.uuid=a.next_upd_from_uuid;u.value=a.next_upd_from;i.update(c,u,{groupId:"updateGroup"});var p={};p.uuid=a.initial_date_from_uuid;var h=s+"("+p.uuid+")";p.value=a.initial_date_from;i.update(h,p,{groupId:"updateGroup"});var f={};f.uuid=a.fut_upd_from_uuid;var v=s+"("+f.uuid+")";f.value=a.fut_upd_from;i.update(v,f,{groupId:"updateGroup"});var m={};m.uuid=a.retro_effec_from_uuid;var y=s+"("+m.uuid+")";m.value=a.retro_effec_from;i.update(y,m,{groupId:"updateGroup"});var _={};_.uuid=a.ref_id_uuid;var b=s+"("+_.uuid+")";_.value=a.ref_id;i.update(b,_,{groupId:"updateGroup"});var P=n.byId("changeData","tableOrgs4");var I=P.getItems();var w="/Integration_Pck_Planning_Adata";for(var V=0;V<I.length;V++){var M=d.adataOld.orgsTopLevel.find(function(e){return e.organization===I[V].getCells()[0].getValue()});if(!M){var D={};D.planning_uuid=r;D.level1="MAPPING_ORGS_TOP_LEVEL";D.level2="SUPERVISORY-PD_PARENT";D.value=I[V].getCells()[0].getValue();D.value2=I[V].getCells()[1].getValue();i.create(w,D,{groupId:"updateGroup"})}}for(var C=0;C<d.adataOld.orgsTopLevel.length;C++){var S=I.find(function(e){return e.getCells()[0].getValue()===d.adataOld.orgsTopLevel[C].organization});if(!S){var T={};var B=s+"("+d.adataOld.orgsTopLevel[C].Uuid+")";i.remove(B,T,{groupId:"updateGroup"})}}d._toggleButtonsAndView(false);i.submitChanges({groupId:"updateGroup",success:d.successUpdateBatch.bind(d),error:d.errorUpdateBatch});g.close()}}),endButton:new sap.m.Button({text:"No",press:function(){g.close()}}),afterClose:function(){g.destroy()}});g.open()},successUpdateBatch:function(e,t){sap.m.MessageToast.show("Adata updated succesfully.");var a=this.getModel("detailView");a.setProperty("/busy",false);this._onBindingChange()},errorUpdateBatch:function(e){var t=this.getModel("detailView");t.setProperty("/busy",false);sap.m.MessageToast.show("Error")},onCloseDetailPress:function(){this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen",false);this.getOwnerComponent().oListSelector.clearMasterListSelection();this.getRouter().navTo("master")},onAddPlanD:function(){var e={execute:true,begda:"2020-01-01",endda:"9999-12-31",periodicity_type:"W",ontime:false,periodicity_values:"2-4-6",time_frecuency:"1m",time_start:"00:00:00",time_end:"23:59:00",time_zone:"UTC"};var t=this.getModel("newPlan");t.setData(e);if(!this.byId("PlanningD")){n.load({id:this.getView().getId(),name:"shapein.RunIntegrationPlanningOrganizations.view.fragment.Planning",controller:this}).then(function(e){this.getView().addDependent(e);e.addStyleClass(this.getOwnerComponent().getContentDensityClass());this.byId("createBut").setVisible(true);this.byId("saveBut").setVisible(false);e.setTitle("New Planning D");e.open()}.bind(this))}else{this.byId("createBut").setVisible(true);this.byId("saveBut").setVisible(false);this.byId("PlanningD").setTitle("New Planning D");this.byId("PlanningD").open()}},cancelPlan:function(e){var t=e.getSource().getParent();t.close()},selExecute:function(e){var t=e.getParameter("selectedIndex");var a=this.getModel("newPlan");if(t==0){a.setProperty("/execute",true)}else{a.setProperty("/execute",false)}},changeBegda:function(e){var t=e.getParameter("value");var a=e.getSource();var i="None";if(t==""){i="Error"}a.setValueState(i);var n=this.getModel("newPlan");n.setProperty("/begda",t)},changeEndda:function(e){var t=e.getParameter("value");var a=e.getSource();var i="None";if(t==""){i="Error"}a.setValueState(i);var n=this.getModel("newPlan");n.setProperty("/endda",t)},selectCheck:function(e){var t=e.getSource();var a=t.getText();var i=this.getModel("newPlan");var n=i.getProperty("/periodicity_values");var r=n.split("-");var s=e.getParameter("selected");if(s){r.push(t.getName())}else{var o=r.indexOf(t.getName());if(o!==-1){r.splice(o,1)}}r.sort();var l=r.join("-");i.setProperty("/periodicity_values",l);var u=this.byId("days").getItems();var d=false;u.forEach(function(e){if(e.getSelected()){d=true}});if(d){u.forEach(function(e){e.setValueState("None")})}},handleSelectionFinish:function(e){var t=e.getParameter("selectedItems");var a=[];for(var i=0;i<t.length;i++){a.push(t[i].getKey())}a.sort();var n=a.join("-");var r=this.getModel("newPlan");r.setProperty("/periodicity_valuesM",n)},deletePlanD:function(e){var t=e.getSource().getParent().getParent().getBindingContext().getPath();var a=this.getView().getModel();var i="Are you sure?";var n=this;var r=new sap.m.Dialog({title:"Confirmation",type:"Message",content:new sap.m.Text({text:i}),beginButton:new sap.m.Button({text:"Yes",press:function(){a.remove(t,{success:function(e,t){sap.m.MessageToast.show("Planning D deleted succesfully.")},error:function(e){sap.m.MessageToast.show("Error")}});r.close()}}),endButton:new sap.m.Button({text:"No",press:function(){r.close()}}),afterClose:function(){r.destroy()}});r.open()},changePeriodType:function(e){var t=e.getParameter("selectedItem");var a=this.byId("days").getItems();if(t.getKey()=="D"){this.byId("MC1").setValueState("None");a.forEach(function(e){e.setValueState("None")})}else if(t.getKey()=="W"){this.byId("MC1").setValueState("None")}else if(t.getKey()=="M"){a.forEach(function(e){e.setValueState("None")})}},handleSelectionChange:function(e){var t=e.getSource();var a="None";var i=t.getSelectedKeys();if(i.length>0){t.setValueState(a)}},timeChange:function(e){var t=e.getParameter("value");var a=e.getSource();var i="None";if(t==""){i="Error"}a.setValueState(i)},editPlanD:function(e){var t=e.getSource().getParent().getParent().getBindingContext().getPath();var a=this.getView().getModel();var i=t+"/execute";var r=a.getProperty(i);i=t+"/begda";var s=a.getProperty(i);var o=String(s.getMonth()+1);if(o<10){o="0"+String(o)}var l=String(s.getDate());if(l<10){l="0"+String(l)}var u=s.getFullYear()+"-"+o+"-"+l;i=t+"/endda";var d=a.getProperty(i);var g=String(d.getMonth()+1);if(g<10){g="0"+String(g)}var c=String(d.getDate());if(c<10){c="0"+String(c)}var p=d.getFullYear()+"-"+g+"-"+c;i=t+"/periodicity_type";var h=a.getProperty(i);i=t+"/time_frecuency";var f=a.getProperty(i);i=t+"/time_measure";var v=a.getProperty(i);f=String(f)+v;i=t+"/periodicity_values";var m=a.getProperty(i);i=t+"/time_zone";var y=a.getProperty(i);i=t+"/time_start";var _=a.getProperty(i);var b=sap.ui.core.format.DateFormat.getTimeInstance({pattern:"HH:mm:ss"});var P=new Date(0).getTimezoneOffset()*60*1e3;var I=b.format(new Date(_.ms+P));i=t+"/time_end";var w=a.getProperty(i);var V=b.format(new Date(w.ms+P));var M={path:t,execute:r,begda:u,endda:p,periodicity_type:h,ontime:false,periodicity_values:m,time_frecuency:f,time_start:I,time_end:V,time_zone:y};var D=this.getModel("newPlan");D.setData(M);if(!this.byId("PlanningD")){n.load({id:this.getView().getId(),name:"shapein.RunIntegrationPlanningOrganizations.view.fragment.Planning",controller:this}).then(function(e){this.getView().addDependent(e);e.addStyleClass(this.getOwnerComponent().getContentDensityClass());this.byId("createBut").setVisible(false);this.byId("saveBut").setVisible(true);e.setTitle("Edit Planning D");e.open()}.bind(this))}else{this.byId("createBut").setVisible(false);this.byId("saveBut").setVisible(true);this.byId("PlanningD").setTitle("Edit Planning D");this.byId("PlanningD").open()}},_validateInput:function(e){var t="None";var a=false;var i=e.getBinding("value");var n=e.getValue();if(n==""){t="Error";a=true}e.setValueState(t);return a},execPlan:function(e){var t=this.getView(),a=[t.byId("begda"),t.byId("endda"),t.byId("TP1"),t.byId("TP2")],i=false;a.forEach(function(e){i=this._validateInput(e)||i},this);if(i){sap.m.MessageBox.alert("A validation error has occurred.")}else{if(this.byId("periodType").getSelectedItem().getKey()=="M"){var n=this.byId("MC1").getSelectedKeys();if(n.length==0){this.byId("MC1").setValueState("Error");sap.m.MessageBox.alert("A validation error has occurred.");return}else{this.byId("MC1").setValueState("None")}}else if(this.byId("periodType").getSelectedItem().getKey()=="W"){var r=this.byId("days").getItems();var s=false;r.forEach(function(e){if(e.getSelected()){s=true}});if(!s){r.forEach(function(e){e.setValueState("Error")});sap.m.MessageBox.alert("A validation error has occurred.");return}}var o=e.getSource().getParent();var l=e.getSource().getText();var u="Are you sure?";var d=this;var g=new sap.m.Dialog({title:"Confirmation",type:"Message",content:new sap.m.Text({text:u}),beginButton:new sap.m.Button({text:"Yes",press:function(){var e=d.byId("title").getText();var t=d.getModel("newPlan");var a=t.getProperty("/begda");var i=t.getProperty("/endda");var n=t.getProperty("/time_zone");var r=d.byId("TP1").getDateValue();var s=r.getHours();if(s<10){s="0"+String(s)}var u=r.getMinutes();if(u<10){u="0"+String(u)}var c=r.getSeconds();if(c<10){c="0"+String(c)}var p=s+":"+u+":"+c;var h=d.byId("TP2").getDateValue();s=h.getHours();if(s<10){s="0"+String(s)}u=h.getMinutes();if(u<10){u="0"+String(u)}c=h.getSeconds();if(c<10){c="0"+String(c)}var f=s+":"+u+":"+c;var v=t.getProperty("/execute");var m=t.getProperty("/path");var y=t.getProperty("/periodicity_type");if(y=="W"){var _=t.getProperty("/periodicity_values")}else if(y=="M"){var _=t.getProperty("/periodicity_valuesM")}else{var _=""}var b=t.getProperty("/ontime");if(!b){var P=t.getProperty("/time_frecuency");var I=P.substr(-1);var w=parseInt(P.substr(0,P.length-1))}else{}var V={planning_uuid:e,seqno:2,execute:v,begda:a,endda:i,periodicity_type:y,periodicity_values:_,time_frecuency:w,time_measure:I,time_start:p,time_end:f,time_zone:n};var M=d.getOwnerComponent().getModel();o.setBusy(true);if(l=="Create"){M.create("/Integration_Pck_Planning_D",V,{headers:{"Content-Type":"application/json",Accept:"application/json"},success:function(e,t){o.setBusy(false);o.close();sap.m.MessageToast.show("Planning D created succesfully.")},error:function(e){o.setBusy(false);o.close();sap.m.MessageToast.show("Error")}})}else if(l=="Save"){M.update(m,V,{headers:{"Content-Type":"application/json",Accept:"application/json"},success:function(e,t){o.setBusy(false);o.close();sap.m.MessageToast.show("Planning D saved succesfully.")},error:function(e){o.setBusy(false);o.close();sap.m.MessageToast.show("Error")}})}g.close()}}),endButton:new sap.m.Button({text:"No",press:function(){g.close()}}),afterClose:function(){g.destroy()}});g.open()}},onEdit:function(){this.showCustomActions(true);this.byId("segButton").setEnabled(true);this.byId("comDisplay").setVisible(false);this.byId("comChange").setVisible(true);this.oSemanticPage.setHeaderExpanded(true);this.oEditAction.setVisible(false);this.oDeleteAction.setVisible(false)},onDelete:function(){var e=this.getView().getBindingContext().getPath();var t=this.getOwnerComponent().getModel();var a="Are you sure?";var i=this;var n=new sap.m.Dialog({title:"Confirmation",type:"Message",content:new sap.m.Text({text:a}),beginButton:new sap.m.Button({text:"Yes",press:function(){t.remove(e,{success:function(e,t){var a=(new sap.ui.getCore).getEventBus();var n=i.byId("title").getText();a.publish("Detail","Delete_Plan",{Number:n});sap.m.MessageToast.show("Planning deleted succesfully.")},error:function(e){sap.m.MessageToast.show("Error")}});n.close()}}),endButton:new sap.m.Button({text:"No",press:function(){n.close()}}),afterClose:function(){n.destroy()}});n.open()},onSave:function(){this.showCustomActions(false);this.oEditAction.setVisible(true);this.byId("segButton").setEnabled(false);this.byId("comDisplay").setVisible(true);this.byId("comChange").setVisible(false);var e=this;var t=this.getView().getBindingContext().getPath();var a=this.getOwnerComponent().getModel();var i=this.getView().getBindingContext().getPath();var n=i+"/last_execution";var r=a.getProperty(n);if(r===null){this.oDeleteAction.setVisible(true)}else{this.oDeleteAction.setVisible(false)}var s=false;if(this.byId("segButton").getSelectedKey()=="A"){s=true}var o=this.byId("comChange").getValue();var l={comments:o,enable:s};a.update(t,l,{headers:{"Content-Type":"application/json",Accept:"application/json"},success:function(t,a){e.oldKey=e.byId("segButton").getSelectedKey();sap.m.MessageBox.alert("Successfully saved!")},error:function(e){sap.m.MessageToast.show("Error")}})},onCancel:function(){this.showCustomActions(false);this.byId("segButton").setSelectedKey(this.oldKey);this.byId("segButton").setEnabled(false);this.byId("comDisplay").setVisible(true);this.byId("comChange").setVisible(false);this.oEditAction.setVisible(true);var e=this.getOwnerComponent().getModel();var t=this.getView().getBindingContext().getPath();var a=t+"/last_execution";var i=e.getProperty(a);if(i===null){this.oDeleteAction.setVisible(true)}else{this.oDeleteAction.setVisible(false)}},showCustomActions:function(e){this.byId("saveAction").setVisible(e);this.byId("cancelAction").setVisible(e)},toggleFullScreen:function(){var e=this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen",!e);if(!e){this.getModel("appView").setProperty("/previousLayout",this.getModel("appView").getProperty("/layout"));this.getModel("appView").setProperty("/layout","MidColumnFullScreen")}else{this.getModel("appView").setProperty("/layout",this.getModel("appView").getProperty("/previousLayout"))}}})});
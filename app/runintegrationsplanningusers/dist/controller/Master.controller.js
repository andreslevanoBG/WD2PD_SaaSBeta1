sap.ui.define(["./BaseController","sap/ui/model/json/JSONModel","sap/ui/core/routing/History","sap/ui/model/Filter","sap/ui/model/Sorter","sap/ui/model/FilterOperator","sap/m/GroupHeaderListItem","sap/ui/Device","sap/ui/core/Fragment","../model/formatter"],function(e,t,a,n,r,i,s,o,l,u){"use strict";var c=sap.ui.core.format.DateFormat.getDateInstance({pattern:"YYYY-MM-ddTHH:mm:ss"});return e.extend("shapein.RunIntegrationPlanningUsers.controller.Master",{formatter:u,onInit:function(){var e=this.byId("list"),a=this._createViewModel(),n=e.getBusyIndicatorDelay();this._oList=e;this._oListFilterState={aFilter:[],aSearch:[]};var r=sap.ui.getCore().getEventBus();r.subscribe("Detail","Delete_Plan",this._delete_Plan,this);this.setModel(a,"masterView");e.attachEventOnce("updateFinished",function(){a.setProperty("/delay",n)});this.getView().addEventDelegate({onBeforeFirstShow:function(){this.getOwnerComponent().oListSelector.setBoundMasterList(e)}.bind(this)});this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched,this);this.getRouter().attachBypassed(this.onBypassed,this);this.setModel(new t,"newExec");var i={fromUpd:new Date(1900,0,1),toUpd:new Date,fromEffec:new Date(1900,0),toEffec:new Date};var s=this.getView().getModel("newExec");s.setData(i);var o=this.getOwnerComponent().getModel("timezones");o.setSizeLimit(1e3)},onUpdateFinished:function(e){this._updateListItemCount(e.getParameter("total"))},onSearch:function(e){if(e.getParameters().refreshButtonPressed){this.onRefresh();return}this._oListFilterState.aFilter=[new n("pck_code",i.EQ,"SYN_USER")];var t=e.getParameter("query");if(t){this._oListFilterState.aSearch=[new n("comments",i.Contains,t)]}else{this._oListFilterState.aSearch=[]}this._applyFilterSearch()},_delete_Plan:function(e,t,a){if(t==="Delete_Plan"){var n=a.Number;var r=this._oList.getItems();var i=this.getOwnerComponent().getModel();for(var s=0;s<r.length;s++){var o=r[s].getTitle();if(o!==n){var l=r[s];this._oList.setSelectedItem(l,true);var u={listItem:l,selected:true};var c=l.getBindingContext().getPath();this.getOwnerComponent().oListSelector.selectAListItem(c);this._oList.fireSelectionChange(u);break}}}},onRefresh:function(){this._oList.getBinding("items").refresh()},onOpenViewSettings:function(e){var t="filter";if(e.getSource()instanceof sap.m.Button){var a=e.getSource().getId();if(a.match("sort")){t="sort"}else if(a.match("group")){t="group"}}if(!this.byId("viewSettingsDialog")){l.load({id:this.getView().getId(),name:"shapein.RunIntegrationPlanningUsers.view.ViewSettingsDialog",controller:this}).then(function(e){this.getView().addDependent(e);e.addStyleClass(this.getOwnerComponent().getContentDensityClass());e.open(t)}.bind(this))}else{this.byId("viewSettingsDialog").open(t)}},onConfirmViewSettingsDialog:function(e){this._applySortGroup(e)},_applySortGroup:function(e){var t=e.getParameters(),a,n,i=[];a=t.sortItem.getKey();n=t.sortDescending;i.push(new r(a,n));this._oList.getBinding("items").sort(i)},onSelectionChange:function(e){var t=e.getSource(),a=e.getParameter("selected");if(!(t.getMode()==="MultiSelect"&&!a)){this._showDetail(e.getParameter("listItem")||e.getSource())}},onBypassed:function(){this._oList.removeSelections(true)},createGroupHeader:function(e){return new s({title:e.text,upperCase:false})},onNavBack:function(){var e=a.getInstance().getPreviousHash(),t=sap.ushell.Container.getService("CrossApplicationNavigation");if(e!==undefined||!t.isInitialNavigation()){history.go(-1)}else{t.toExternal({target:{shellHash:"#Shell-home"}})}},_createViewModel:function(){return new t({isFilterBarVisible:false,filterBarLabel:"",delay:0,title:this.getResourceBundle().getText("masterTitleCount",[0]),noDataText:this.getResourceBundle().getText("masterListNoDataText"),sortBy:"uuid",groupBy:"None"})},_onMasterMatched:function(){this.getModel("appView").setProperty("/layout","OneColumn")},_showDetail:function(e){var t=!o.system.phone;this.getModel("appView").setProperty("/layout","TwoColumnsMidExpanded");this.getRouter().navTo("object",{objectId:e.getBindingContext().getProperty("uuid")},t)},_updateListItemCount:function(e){var t;if(this._oList.getBinding("items").isLengthFinal()){t=this.getResourceBundle().getText("masterTitleCount",[e]);this.getModel("masterView").setProperty("/title",t)}},_applyFilterSearch:function(){var e=this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),t=this.getModel("masterView");this._oList.getBinding("items").filter(e,"Application");if(e.length!==0){t.setProperty("/noDataText",this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"))}else if(this._oListFilterState.aSearch.length>0){t.setProperty("/noDataText",this.getResourceBundle().getText("masterListNoDataText"))}},_updateFilterBar:function(e){var t=this.getModel("masterView");t.setProperty("/isFilterBarVisible",this._oListFilterState.aFilter.length>0);t.setProperty("/filterBarLabel",this.getResourceBundle().getText("masterFilterBarText",[e]))},cancelOnDemand:function(e){var t=e.getSource().getParent();t.close()},_validateInput:function(e){var t="None";var a=false;var n=e.getValue();if(n==""){t="Error";a=true}e.setValueState(t);return a},changeDatesDemand:function(e){var t=e.getParameter("value");var a=e.getSource();var n="None";if(t==""){n="Error"}else{}a.setValueState(n)},execOnDemand:function(e){var t=this.getView(),a=[t.byId("DTP11"),t.byId("DTP12"),t.byId("DTP13"),t.byId("DTP14")],n=false;a.forEach(function(e){n=this._validateInput(e)||n},this);if(n){sap.m.MessageBox.alert("A validation error has occurred.");return}if(a[0].getDateValue()>a[1].getDateValue()){sap.m.MessageBox.alert("Date 'Updated To' is earlier than 'Updated From'.");a[1].setValueState("Error");return}if(a[2].getDateValue()>a[3].getDateValue()){sap.m.MessageBox.alert("Date 'Effective To' is earlier than 'Effective From'.");a[1].setValueState("Error");return}var r="Are you sure you want to execute this integration on Demand?";var i=this;var s=e.getSource().getParent();var o=new sap.m.Dialog({title:"Confirmation",type:"Message",content:new sap.m.Text({text:r}),beginButton:new sap.m.Button({text:"Yes",press:function(){var e=i.getModel("newExec");var t=e.getProperty("/fromUpd");var a=e.getProperty("/toUpd");var n=e.getProperty("/fromEffec");var r=e.getProperty("/toEffec");var l=i.byId("multiInput2").getTokens();var u=[];for(var g=0;g<l.length;g++){var d=l[g].getText();u.push(d)}t=c.format(t);a=c.format(a);n=c.format(n);r=c.format(r);var p={test_mode:"False",transaction_log:{time_zone:"CET",updated_from:t,updated_to:a,effective_from:n,effective_to:r},workers:{reference_id:"Employee_ID",workers_list:u}};var h=JSON.stringify(p);var f="/CPI-WD2PD_Dest/md/users_sync/ondemand";if(i.getOwnerComponent().settings){var m=i.getOwnerComponent().settings.find(e=>e.code==="Customer-Code");var v=i.getOwnerComponent().settings.find(e=>e.code==="Customer-Client_Id");var y=i.getOwnerComponent().settings.find(e=>e.code==="Customer-Scope");var _={url:f,method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json","Customer-Code":m.value,"Customer-Client_Id":v.value,"Customer-Scope":y.value},data:h};$.ajax(_).done(function(e,t,a){var n=e;var r=t;var i=a;if(t=="success"){var s="Execution On Demand "+e.uuid_exec+" executed.";sap.m.MessageToast.show(s)}}).fail(function(e,t,a){var n=e;var r=t;var i=a})}o.close();s.close()}}),endButton:new sap.m.Button({text:"No",press:function(){o.close()}}),afterClose:function(){o.destroy()}});o.open()},createPlan:function(e){if(!this.byId("newPlan")){l.load({id:this.getView().getId(),name:"shapein.RunIntegrationPlanningUsers.view.fragment.NewPlanning",controller:this}).then(function(e){this.getView().addDependent(e);e.addStyleClass(this.getOwnerComponent().getContentDensityClass());var t=function(e){var t=e.text;return new sap.m.Token({key:t,text:t})};e.open()}.bind(this))}else{this.byId("newPlan").open()}},_validateInputNewP:function(e){var t="None";var a=false;var n=e.getBinding("value");var r=e.getValue();if(r==""){t="Error";a=true}e.setValueState(t);return a},execNewPlan:function(e){var t=this.getView(),a=[t.byId("Comments"),t.byId("DTP1"),t.byId("DTP2"),t.byId("DTP3")],n=false;if(this.byId("ProcessType").getSelectedKey()==="I"){a.forEach(function(e){n=this._validateInputNewP(e)||n},this)}if(n){sap.m.MessageBox.alert("A validation error has occurred.");return}var r=a[0].getValue();var i="Are you sure you want to create a Users Planning?";var s=this;var o=e.getSource().getParent();var l=new sap.m.Dialog({title:"Confirmation",type:"Message",content:new sap.m.Text({text:i}),beginButton:new sap.m.Button({text:"Yes",press:function(){var e=s.byId("SegBut").getSelectedKey();var t=false;if(e=="A"){t=true}var a=s.byId("ProcessType").getSelectedKey();var n={pck_code:"SYN_USER",type:"D",enable:t,processing_type:a,comments:r};var i=s.getOwnerComponent().getModel();o.setBusy(true);i.create("/Integration_Pck_Planning",n,{headers:{"Content-Type":"application/json",Accept:"application/json"},success:function(e,t){o.setBusy(false);o.close();s.createDataBatch(e.uuid,e.processing_type);sap.m.MessageToast.show("Planning created succesfully.")},error:function(e){o.setBusy(false);o.close();sap.m.MessageToast.show("Error")}});l.close()}}),endButton:new sap.m.Button({text:"No",press:function(){l.close()}}),afterClose:function(){l.destroy()}});l.open()},createDataBatch:function(e,t){var a=e;var n="/Integration_Pck_Planning_Adata";var r=this.getOwnerComponent().getModel();r.setDeferredGroups(["createGroup"]);var i={};if(t=="I"){i.planning_uuid=a;i.level1="WS_GET_WORKERS";i.level2="TIME_ZONE";i.value=this.byId("TimeZone").getSelectedKey();i.value2=null;r.create(n,i,{groupId:"createGroup"});var s={};s.planning_uuid=a;s.level1="WS_GET_WORKERS";s.level2="NEXT_UPDATED_FROM";s.value="";s.value2=null;r.create(n,s,{groupId:"createGroup"});var o={};o.planning_uuid=a;o.level1="WS_GET_WORKERS";o.level2="INITIAL_DATE_FROM";o.value=this.byId("DTP1").getValue();o.value2=null;r.create(n,o,{groupId:"createGroup"});var l={};l.planning_uuid=a;l.level1="WS_GET_WORKERS";l.level2="RETRO_CHG_EFFECTIVE_FROM";l.value=this.byId("DTP2").getValue();l.value2=null;r.create(n,l,{groupId:"createGroup"});var u={};u.planning_uuid=a;u.level1="WS_GET_WORKERS";u.level2="FUTURE_CHG_UPDATED_FROM";u.value=this.byId("DTP3").getValue();u.value2=null;r.create(n,u,{groupId:"createGroup"});r.submitChanges({groupId:"createGroup",success:this.successCreateBatch,error:this.errorCreateBatch})}},successCreateBatch:function(e,t){var a=0},errorCreateBatch:function(e){var t=0},changeTypeProcessing:function(e){var t=e.getParameter("selectedItem").getKey();var a=this.getView();var n=a.byId("SimpleFormChange480_12");if(t=="R"){n.getAggregation("form").getAggregation("formContainers")[1].setVisible(false)}else{n.getAggregation("form").getAggregation("formContainers")[1].setVisible(true)}},cancelNewPlan:function(e){var t=e.getSource().getParent();t.close()},newOnDemand:function(e){if(!this.byId("ondemand")){l.load({id:this.getView().getId(),name:"shapein.RunIntegrationPlanningUsers.view.fragment.OnDemand",controller:this}).then(function(e){this.getView().addDependent(e);e.addStyleClass(this.getOwnerComponent().getContentDensityClass());var t=function(e){var t=e.text;return new sap.m.Token({key:t,text:t})};this.getView().byId("multiInput2").addValidator(t);e.open()}.bind(this))}else{this.byId("ondemand").open()}}})});
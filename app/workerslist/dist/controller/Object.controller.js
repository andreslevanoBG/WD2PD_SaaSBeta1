sap.ui.define(["./BaseController","sap/ui/model/json/JSONModel","../model/formatter","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/core/Fragment","sap/ui/model/Sorter","sap/m/MessageBox"],function(e,t,i,a,s,n,r,o){"use strict";return e.extend("shapein.WorkersList.controller.Object",{formatter:i,fromDatePreviousValue:"",toDatePreviousValue:"",onInit:function(){var e,i=new t({busy:true,delay:0});this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched,this);e=this.getView().getBusyIndicatorDelay();this.setModel(i,"objectView");this.getOwnerComponent().getModel().metadataLoaded().then(function(){i.setProperty("/delay",e)});this.setModel(new t,"data");this._oTableFilterState={aFilter:[],aSearch:[]}},onShareInJamPress:function(){var e=this.getModel("objectView"),t=sap.ui.getCore().createComponent({name:"sap.collaboration.components.fiori.sharing.dialog",settings:{object:{id:location.href,share:e.getProperty("/shareOnJamTitle")}}});t.open()},_onObjectMatched:function(e){var t=e.getParameter("arguments").objectId;this.getModel().metadataLoaded().then(function(){var e=this.getModel().createKey("Workers",{uuid:t});this._bindView("/"+e)}.bind(this))},_bindView:function(e){var t=this.getModel("objectView"),i=this.getModel();this.getView().bindElement({path:e,events:{change:this._onBindingChange.bind(this),dataRequested:function(){i.metadataLoaded().then(function(){t.setProperty("/busy",true)})},dataReceived:function(){t.setProperty("/busy",false)}}})},_onBindingChange:function(){var e=this.getView(),t=this.getModel("objectView"),i=e.getElementBinding();if(!i.getBoundContext()){this.getRouter().getTargets().display("objectNotFound");return}var a=i.getPath(),s=this.getResourceBundle(),n=e.getBindingContext().getObject(),r=n.uuid,o=n.firstname;var l=this.getOwnerComponent().getModel();var g=this.getView().getModel("items");var u=this;t.refresh();l.read(a,{urlParameters:{$expand:"integ_items/integration"},success:function(e,i){var a=e.integ_items.results;delete e.__metadata;var s=0;var n=0;a.forEach(function(e){delete e.__metadata;if(e.status_code=="S"){s++}else{n++}if(e.integration){if(e.integration.status_code!="R"){e.duration=String((e.integration.timestamp_end.getTime()-e.integration.timestamp_start.getTime())/1e3)+" secs"}else{e.duration="0 secs"}}});e.integ_items=null;e.integ_items=a;g.setData(e);t.setProperty("/busy",false);u.getView().byId("tabfSuc").setCount(s);u.getView().byId("tabfErr").setCount(n)},error:function(e){t.setProperty("/busy",false)}});this.addHistoryEntry({title:this.getResourceBundle().getText("objectTitle")+" - "+o,icon:"sap-icon://enter-more",intent:"#WorkersList-display&/Workers/"+r});t.setProperty("/saveAsTileTitle",s.getText("saveAsTileTitle",[o]));t.setProperty("/shareOnJamTitle",o);t.setProperty("/shareSendEmailSubject",s.getText("shareSendEmailObjectSubject",[r]));t.setProperty("/shareSendEmailMessage",s.getText("shareSendEmailObjectMessage",[o,r,location.href]))},onOpenViewSettings:function(e){var t="filter";if(e.getSource()instanceof sap.m.Button){var i=e.getSource().getId();if(i.match("sort")){t="sort"}else if(i.match("group")){t="group"}}if(!this.byId("viewSettingsDialogDetail")){n.load({id:this.getView().getId(),name:"shapein.WorkersList.view.ViewSettingsDialogDetail",controller:this}).then(function(e){this.getView().addDependent(e);e.addStyleClass(this.getOwnerComponent().getContentDensityClass());e.open(t)}.bind(this))}else{this.byId("viewSettingsDialogDetail").open(t)}},changeDates:function(e){var t=this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();var i=this.byId("viewSettingsDialogDetail").getFilterItems()[0];var a=t.getContent()[1].getValue();var s=t.getContent()[3].getValue();if(a==""&&s==""){i.setFilterCount(0);i.setSelected(false)}else{i.setFilterCount(1);i.setSelected(true)}},searchFilters:function(){var e=[],t=[],i=[];var n=this.getView().getModel("items");if(this.byId("viewSettingsDialogDetail")){e=this.byId("viewSettingsDialogDetail").getFilterItems();var r=this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();var o=r.getContent()[1].getValue();var l=r.getContent()[3].getValue();var g=r.getContent()[1].getDateValue();var u=r.getContent()[3].getDateValue();this.fromDatePreviousValue=o;this.toDatePreviousValue=l;if(o!==""){var d=o.substring(0,4)+"-"+o.substring(5,7)+"-"+o.substring(8,10)+"T"+o.substring(11,13)+":"+o.substring(14,16)+":"+o.substring(17,19)+"Z"}if(l!==""){var c=l.substring(0,4)+"-"+l.substring(5,7)+"-"+l.substring(8,10)+"T"+l.substring(11,13)+":"+l.substring(14,16)+":"+l.substring(17,19)+"Z"}if(c&&!d){t.push(new a([new a("timestamp_start",s.LE,u)],true))}else if(d&&!c){t.push(new a([new a("timestamp_start",s.GE,g)],true))}else if(d&&c){t.push(new a([new a("timestamp_start",s.LE,u),new a("timestamp_start",s.GE,g)],true))}var h=this.byId("viewSettingsDialogDetail").getSortItems();var m;h.forEach(function(e){if(e.getSelected()){m=e}});var p=this.byId("viewSettingsDialogDetail").getSortDescending()}var f=this.getView().byId("iconTab").getSelectedKey();if(f=="Suc"){t.push(new a("status_code",s.EQ,"S"))}else if(f=="Err"){t.push(new a("status_code",s.EQ,"E"))}var v=this.getView().byId("search").getValue();if(v!==""){t.push(new a("integ_id",s.Contains,v))}this._oTableFilterState.aFilter=t;this._applyFilterSearch();if(this.byId("viewSettingsDialogDetail")){this._applySortGroup(m,p)}},handleMessagePopoverPress:function(e){var t=e.getSource().getParent().getBindingContext("items").getPath();var i=this.getView().getModel("items");t=t+"/error_message";var a=this.b64DecodeUnicode(i.getProperty(t));if(a!=""&&a){var s=JSON.parse(a);var n=s["errors"][0].message;o.error(n)}else{o.error("Message empty")}},_applyFilterSearch:function(){var e=this._oTableFilterState.aSearch.concat(this._oTableFilterState.aFilter);this.getView().byId("lineItemsList").getBinding("items").filter(e,"Application")},_applySortGroup:function(e,t){var i,a,s=[];i=e.getKey();a=t;s.push(new r(i,a));var n=this.getView().byId("lineItemsList").getBinding("items");n.sort(s)},handleCancel:function(){var e=this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();var t=this.byId("viewSettingsDialogDetail").getFilterItems()[0],i=e.getContent()[1],a=e.getContent()[3];i.setValue(this.fromDatePreviousValue);a.setValue(this.toDatePreviousValue);if(this.fromDatePreviousValue!==""||this.toDatePreviousValue!==""){t.setFilterCount(1);t.setSelected(true)}else{t.setFilterCount(0);t.setSelected(false)}},handleResetFilters:function(){var e=this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();var t=this.byId("viewSettingsDialogDetail").getFilterItems()[0],i=e.getContent()[1],a=e.getContent()[3];i.setValue("");a.setValue("");t.setFilterCount(0);t.setSelected(false)},b64DecodeUnicode:function(e){return decodeURIComponent(atob(e).split("").map(function(e){return"%"+("00"+e.charCodeAt(0).toString(16)).slice(-2)}).join(""))},onDataDialogPress:function(e){var t=e.getSource().getParent().getBindingContext("items").getPath();var i=this.getView().getModel("items");t=t+"/request";var a=i.getProperty(t);var s=this.b64DecodeUnicode(a);var n=JSON.parse(s);var r=Object.entries(n);var o=[];var l=this.getView().getModel("data");r.forEach(function(e){var t={};if(e[0]==="registration_references"){var i=Object.entries(e[1]);i.forEach(function(e){var t={};t.Name=e[0].toString().replaceAll("_"," ");t.Value=e[1];o.push(t)})}else if(e[0]==="custom_fields"){var a=Object.entries(e[1]);a.forEach(function(e){var t={};t.Name=e[1].code.toString().replaceAll("_"," ");t.Value=e[1].value;t.key="Data";t.Icon="sap-icon://database";o.push(t)})}else{t.Name=e[0].toString().replaceAll("_"," ");t.Value=e[1];o.push(t)}});l.setData(o);if(!this.oDataDialog){this.oDataDialog=new sap.m.Dialog({title:"Data Details",contentWidth:"550px",contentHeight:"300px",resizable:true,content:new sap.m.List({items:{path:"data>/",template:new sap.m.StandardListItem({title:"{data>Name}",info:"{data>Value}",infoState:"Information"})}}),endButton:new sap.m.Button({text:"OK",press:function(){this.oDataDialog.close()}.bind(this)})});this.getView().addDependent(this.oDataDialog)}this.oDataDialog.open()}})});
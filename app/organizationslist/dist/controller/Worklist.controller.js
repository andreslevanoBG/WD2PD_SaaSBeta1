sap.ui.define(["./BaseController","sap/ui/model/json/JSONModel","../model/formatter","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/core/Fragment","sap/ui/model/Sorter"],function(e,t,i,s,a,r,l){"use strict";return e.extend("shapein.OrganizationsList.controller.Worklist",{formatter:i,oFormatYyyymmdd:null,fromDatePreviousValue:"",toDatePreviousValue:"",fromLastPreviousValue:"",toLastPreviousValue:"",onInit:function(){this.oFormatYyyymmdd=sap.ui.core.format.DateFormat.getInstance({pattern:"dd.MM.yyyy",calendarType:sap.ui.core.CalendarType.Gregorian});var e,i;this._aTableSearchState=[];this._oTableFilterState={aFilter:[],aSearch:[]};e=new t({worklistTableTitle:this.getResourceBundle().getText("worklistTableTitle"),saveAsTileTitle:this.getResourceBundle().getText("saveAsTileTitle",this.getResourceBundle().getText("worklistViewTitle")),shareOnJamTitle:this.getResourceBundle().getText("worklistTitle"),shareSendEmailSubject:this.getResourceBundle().getText("shareSendEmailWorklistSubject"),shareSendEmailMessage:this.getResourceBundle().getText("shareSendEmailWorklistMessage",[location.href]),tableNoDataText:this.getResourceBundle().getText("tableNoDataText"),tableBusyDelay:0});this.setModel(e,"worklistView");this.addHistoryEntry({title:this.getResourceBundle().getText("worklistViewTitle"),icon:"sap-icon://table-view",intent:"#OrganizationsList-display"},true)},onUpdateFinished:function(e){var t,i=e.getSource(),s=e.getParameter("total");if(s&&i.getBinding("items").isLengthFinal()){t=this.getResourceBundle().getText("worklistTableTitleCount",[s])}else{t=this.getResourceBundle().getText("worklistTableTitle")}this.getModel("worklistView").setProperty("/worklistTableTitle",t)},onOpenViewSettings:function(e){var t="filter";if(e.getSource()instanceof sap.m.Button){var i=e.getSource().getId();if(i.match("sort")){t="sort"}else if(i.match("group")){t="group"}}if(!this.byId("viewSettingsDialog")){r.load({id:this.getView().getId(),name:"shapein.OrganizationsList.view.ViewSettingsDialog",controller:this}).then(function(e){this.getView().addDependent(e);e.addStyleClass(this.getOwnerComponent().getContentDensityClass());e.open(t)}.bind(this))}else{this.byId("viewSettingsDialog").open(t)}},searchFilters:function(e){var t=[],i=[],r=[];if(this.byId("viewSettingsDialog")){t=this.byId("viewSettingsDialog").getFilterItems();var l=this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();var n=l.getContent()[1].getValue();var o=l.getContent()[3].getValue();this.fromDatePreviousValue=n;this.toDatePreviousValue=o;if(n!==""){var g=n.substring(0,4)+"-"+n.substring(5,7)+"-"+n.substring(8,10)+"T"+n.substring(11,13)+":"+n.substring(14,16)+":"+n.substring(17,19)+"Z"}if(o!==""){var u=o.substring(0,4)+"-"+o.substring(5,7)+"-"+o.substring(8,10)+"T"+o.substring(11,13)+":"+o.substring(14,16)+":"+o.substring(17,19)+"Z"}if(u&&!g){i.push(new s([new s("last_timestamp",a.LE,u)],true))}else if(g&&!u){i.push(new s([new s("last_timestamp",a.GE,g)],true))}else if(g&&u){i.push(new s([new s("last_timestamp",a.LE,u),new s("last_timestamp",a.GE,g)],true))}else{}var h=this.byId("viewSettingsDialog").getFilterItems()[1].getCustomControl();var d=h.getContent()[1].getValue();var c=h.getContent()[3].getValue();this.fromLastPreviousValue=d;this.toLastPreviousValue=c;if(d!==""&&c==""){i.push(new s([new s("lastname",a.GE,d),new s("firstname",a.GE,d)],false))}else if(d==""&&c!==""){i.push(new s([new s("lastname",a.LE,c),new s("firstname",a.LE,c)],false))}else if(d!==""&&c!==""){i.push(new s([new s("lastname",a.BT,d,c),new s("firstname",a.BT,d,c)],false))}var m=[];t.forEach(function(e){if(e.getKey()!=="last_timestamp"&&e.getKey()!=="lastname"){m.push(new s(e.getParent().getKey(),a.EQ,e.getKey()))}});if(m.length>0){i.push(new s(m,false))}var f=this.byId("viewSettingsDialog").getSortItems();var v;f.forEach(function(e){if(e.getSelected()){v=e}});var w=this.byId("viewSettingsDialog").getSortDescending()}var S=this.getView().byId("iconTab").getSelectedKey();if(S=="Suc"){i.push(new s("last_status",a.EQ,"S"))}else if(S=="Err"){i.push(new s("last_status",a.EQ,"E"))}var b=this.getView().byId("searchField").getValue();this._oTableFilterState.aFilter=i;this._applyFilterSearch();if(this.byId("viewSettingsDialog")){this._applySortGroup(v,w)}},changeDates:function(e){var t=this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();var i=this.byId("viewSettingsDialog").getFilterItems()[0];var s=t.getContent()[1].getValue();var a=t.getContent()[3].getValue();if(s==""&&a==""){i.setFilterCount(0);i.setSelected(false)}else{i.setFilterCount(1);i.setSelected(true)}},changeLast:function(e){var t=this.byId("viewSettingsDialog").getFilterItems()[1].getCustomControl();var i=this.byId("viewSettingsDialog").getFilterItems()[1];var s=t.getContent()[1].getValue();var a=t.getContent()[3].getValue();if(s==""&&a==""){i.setFilterCount(0);i.setSelected(false)}else{i.setFilterCount(1);i.setSelected(true)}},_applySortGroup:function(e,t){var i,s,a=[];i=e.getKey();s=t;a.push(new l(i,s));var r=this.byId("table").getBinding("items");r.sort(a)},_applyFilterSearch:function(){var e=this._oTableFilterState.aSearch.concat(this._oTableFilterState.aFilter),t=this.getModel("worklistView");this.byId("table").getBinding("items").filter(e,"Application");if(e.length!==0){t.setProperty("/tableNoDataText",this.getResourceBundle().getText("worklistNoDataWithSearchText"))}else if(this._oTableFilterState.aSearch.length>0){t.setProperty("/noDataText",this.getResourceBundle().getText("masterListNoDataText"))}},handleResetFilters:function(){var e=this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();var t=this.byId("viewSettingsDialog").getFilterItems()[0],i=e.getContent()[1],s=e.getContent()[3];i.setValue("");s.setValue("");t.setFilterCount(0);t.setSelected(false);var a=this.byId("viewSettingsDialog").getFilterItems()[1].getCustomControl();var r=this.byId("viewSettingsDialog").getFilterItems()[1],l=a.getContent()[1],n=a.getContent()[3];l.setValue("");n.setValue("");r.setFilterCount(0);r.setSelected(false)},handleCancel:function(){var e=this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();var t=this.byId("viewSettingsDialog").getFilterItems()[0],i=e.getContent()[1],s=e.getContent()[3];i.setValue(this.fromDatePreviousValue);s.setValue(this.toDatePreviousValue);if(this.fromDatePreviousValue!==""||this.toDatePreviousValue!==""){t.setFilterCount(1);t.setSelected(true)}else{t.setFilterCount(0);t.setSelected(false)}var a=this.byId("viewSettingsDialog").getFilterItems()[1].getCustomControl();var r=this.byId("viewSettingsDialog").getFilterItems()[1],l=a.getContent()[1],n=a.getContent()[3];l.setValue(this.fromLastPreviousValue);n.setValue(this.toLastPreviousValue);if(this.fromLastPreviousValue!==""||this.toLastPreviousValue!==""){r.setFilterCount(1);r.setSelected(true)}else{r.setFilterCount(0);r.setSelected(false)}},onPress:function(e){this._showObject(e.getSource())},onSearch:function(e){if(e.getParameters().refreshButtonPressed){this.onRefresh()}else{var t=e.getParameter("query");this._oTableFilterState.aSearch=[];if(t&&t.length>0){this._oTableFilterState.aSearch.push(new s([new s("name",a.Contains,t),new s("external_id",a.Contains,t),new s("corporate_name",a.Contains,t)],false))}}this._applyFilterSearch()},onRefresh:function(){var e=this.byId("table");e.getBinding("items").refresh()},_showObject:function(e){this.getRouter().navTo("object",{objectId:e.getBindingContext().getProperty("uuid")})},_applySearch:function(e){var t=this.byId("table"),i=this.getModel("worklistView");t.getBinding("items").filter(e,"Application");if(e.length!==0){i.setProperty("/tableNoDataText",this.getResourceBundle().getText("worklistNoDataWithSearchText"))}}})});
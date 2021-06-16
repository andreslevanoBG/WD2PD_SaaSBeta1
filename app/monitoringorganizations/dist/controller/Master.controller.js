sap.ui.define(["./BaseController","sap/ui/model/json/JSONModel","sap/ui/core/routing/History","sap/ui/model/Filter","sap/ui/model/Sorter","sap/ui/model/FilterOperator","sap/m/GroupHeaderListItem","sap/ui/Device","sap/ui/core/Fragment","../model/formatter"],function(e,t,i,s,a,r,o,n,l,u){"use strict";return e.extend("shapein.MonitoringOrganizations.controller.Master",{formatter:u,oFormatYyyymmdd:null,fromDatePreviousValue:"",toDatePreviousValue:"",numItems1PreviousValue:0,numItems2PreviousValue:0,onInit:function(){this.oFormatYyyymmdd=sap.ui.core.format.DateFormat.getInstance({pattern:"dd.MM.yyyy",calendarType:sap.ui.core.CalendarType.Gregorian});var e=this.byId("list"),t=this._createViewModel(),i=e.getBusyIndicatorDelay();this._oList=e;this._oListFilterState={aFilter:[],aSearch:[]};this.setModel(t,"masterView");e.attachEventOnce("updateFinished",function(){t.setProperty("/delay",i)});this.getView().addEventDelegate({onBeforeFirstShow:function(){this.getOwnerComponent().oListSelector.setBoundMasterList(e)}.bind(this)});this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched,this);this.getRouter().attachBypassed(this.onBypassed,this);t.setProperty("/isFilterBarVisible",true);t.setProperty("/filterBarLabel","Past 24 Hours");var s=this;var a=this.getOwnerComponent().getModel();var r="/Integration_Pck_Planning";var o=[];var n=new sap.ui.model.Filter({path:"pck_code",operator:sap.ui.model.FilterOperator.EQ,value1:"SYN_ORG"});o.push(n);var l=new sap.ui.model.Filter({path:"enable",operator:sap.ui.model.FilterOperator.EQ,value1:true});o.push(l);var u=new sap.ui.model.Filter({path:"processing_type",operator:sap.ui.model.FilterOperator.EQ,value1:"R"});o.push(u);a.read(r,{urlParameters:{$expand:"adata"},filters:o,success:function(e,t){var i=e.results;var a=[];i.forEach(function(e){e.adata.results.forEach(function(e){if(e.level1=="MAPPING_ORGS_TOP_LEVEL"&&e.level2=="SUPERVISORY-PD_PARENT"){var t={};t.organization=e.value;t.pd_parent=e.value2;a.push(t)}})});var r=s.multiDimensionalUnique(a);s.getOwnerComponent().oMappings=r},error:function(e){}})},multiDimensionalUnique:function(e){var t=[];var i={};for(var s=0,a=e.length;s<a;s++){var r=JSON.stringify(e[s]);if(i[r]){continue}t.push(e[s]);i[r]=true}return t},onUpdateFinished:function(e){this._updateListItemCount(e.getParameter("total"))},onSearch:function(e){if(e.getParameters().refreshButtonPressed){this.onRefresh();return}var t=e.getParameter("query");if(t){this._oListFilterState.aSearch=[new s("id",r.Contains,t)];this._oListFilterState.aSearch.push(new s("pck_code",r.EQ,"SYN_ORG"))}else{this._oListFilterState.aSearch=[];this._oListFilterState.aSearch.push(new s("pck_code",r.EQ,"SYN_ORG"))}this._applyFilterSearch()},onRefresh:function(){this._oList.getBinding("items").refresh()},onOpenViewSettings:function(e){var t="filter";if(e.getSource()instanceof sap.m.Button){var i=e.getSource().getId();if(i.match("sort")){t="sort"}else if(i.match("group")){t="group"}}if(!this.byId("viewSettingsDialog")){l.load({id:this.getView().getId(),name:"shapein.MonitoringOrganizations.view.ViewSettingsDialog",controller:this}).then(function(e){this.getView().addDependent(e);e.addStyleClass(this.getOwnerComponent().getContentDensityClass());e.open(t)}.bind(this))}else{this.byId("viewSettingsDialog").open(t)}},onOpenFilterSettings:function(e){var t="filter";if(e.getSource()instanceof sap.m.Button){var i=e.getSource().getId();if(i.match("sort")){t="sort"}else if(i.match("group")){t="group"}}if(!this.byId("viewFiltersDialog")){l.load({id:this.getView().getId(),name:"shapein.MonitoringOrganizations.view.FiltersDialog",controller:this}).then(function(e){this.getView().addDependent(e);e.addStyleClass(this.getOwnerComponent().getContentDensityClass());e.open(t)}.bind(this))}else{this.byId("viewFiltersDialog").open(t)}},date2digits:function(e){if(e<10){return"0"+e}return e},onConfirmViewSettingsDialog:function(e){var t=e.getParameters().filterItems,i=[],a=[];var o=this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();var n=o.getContent()[1].getValue();var l=o.getContent()[3].getValue();this.fromDatePreviousValue=n;this.toDatePreviousValue=l;var u=o.getContent()[1].getDateValue();var g=o.getContent()[3].getDateValue();var h=this.getModel("masterView");if(n!==""){var d=u.getUTCFullYear();var m=u.getUTCMonth()+1;m=this.date2digits(m);var p=u.getUTCDate();p=this.date2digits(p);var c=u.getUTCHours();c=this.date2digits(c);var v=u.getUTCMinutes();v=this.date2digits(v);var f=u.getUTCSeconds();f=this.date2digits(f);var y=d+"-"+m+"-"+p+"T"+c+":"+v+":"+f+"Z"}if(l!==""){var S=g.getUTCFullYear();var C=g.getUTCMonth()+1;C=this.date2digits(C);var F=g.getUTCDate();F=this.date2digits(F);var w=g.getUTCHours();w=this.date2digits(w);var I=g.getUTCMinutes();I=this.date2digits(I);var V=g.getUTCSeconds();V=this.date2digits(V);var D=S+"-"+C+"-"+F+"T"+w+":"+I+":"+V+"Z"}if(D&&!y){i.push(new s([new s("timestamp_start",r.LE,D)],true));var _=this.oFormatYyyymmdd.format(o.getContent()[3].getDateValue());_="Processes to "+_;this._updateFilterBar(_)}else if(y&&!D){i.push(new s([new s("timestamp_start",r.GE,y)],true));var _=this.oFormatYyyymmdd.format(o.getContent()[1].getDateValue());_="Processes from "+_;this._updateFilterBar(_)}else if(y&&D){i.push(new s([new s("timestamp_start",r.LE,D),new s("timestamp_start",r.GE,y)],true));var _=this.oFormatYyyymmdd.format(o.getContent()[1].getDateValue());var P=this.oFormatYyyymmdd.format(o.getContent()[3].getDateValue());_="Processes between "+_+" - "+P;this._updateFilterBar(_)}else{this._updateFilterBar("Past 24 Hours")}var b=[];t.forEach(function(e){if(e.getKey()!=="timestamp_start"&&e.getKey()!=="numberOfItems"){b.push(new s(e.getParent().getKey(),r.EQ,e.getKey()))}});if(b.length>0){i.push(new s(b,false))}i.push(new s([new s("pck_code",r.EQ,"SYN_ORG")],true));var B=this.byId("viewSettingsDialog").getFilterItems()[2].getCustomControl();var L=parseInt(B.getValue());var M=parseInt(B.getValue2());if(L>M){var T=L;L=M;M=T}this.numItems1PreviousValue=L;this.numItems2PreviousValue=M;if(M!==0){if(M==B.getMax()){i.push(new s([new s("numberOfItems",r.GE,L),new s("numberOfItems",r.LE,9999999)],true))}else{i.push(new s([new s("numberOfItems",r.GE,L),new s("numberOfItems",r.LE,M)],true))}}this._oListFilterState.aFilter=i;this._applyFilterSearch();this._applySortGroup(e)},_applySortGroup:function(e){var t=e.getParameters(),i,s,r=[];i=t.sortItem.getKey();s=t.sortDescending;r.push(new a(i,s));var o=this._oList.getBinding("items");o.sort(r)},onSelectionChange:function(e){var t=e.getSource(),i=e.getParameter("selected");if(!(t.getMode()==="MultiSelect"&&!i)){this._showDetail(e.getParameter("listItem")||e.getSource())}},onBypassed:function(){this._oList.removeSelections(true)},createGroupHeader:function(e){return new o({title:e.text,upperCase:false})},onNavBack:function(){var e=i.getInstance().getPreviousHash(),t=sap.ushell.Container.getService("CrossApplicationNavigation");if(e!==undefined||!t.isInitialNavigation()){history.go(-1)}else{t.toExternal({target:{shellHash:"#Shell-home"}})}},_createViewModel:function(){return new t({isFilterBarVisible:false,filterBarLabel:"",delay:0,title:this.getResourceBundle().getText("masterTitleCount",[0]),noDataText:this.getResourceBundle().getText("masterListNoDataText"),sortBy:"reference_id",groupBy:"None"})},_onMasterMatched:function(){this.getModel("appView").setProperty("/layout","OneColumn")},_showDetail:function(e){var t=!n.system.phone;this.getModel("appView").setProperty("/layout","TwoColumnsMidExpanded");this.getRouter().navTo("object",{objectId:e.getBindingContext().getProperty("id")},t)},_updateListItemCount:function(e){var t;if(this._oList.getBinding("items").isLengthFinal()){t=this.getResourceBundle().getText("masterTitleCount",[e]);this.getModel("masterView").setProperty("/title",t)}},_applyFilterSearch:function(){var e=this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),t=this.getModel("masterView");this._oList.getBinding("items").filter(e,"Application");if(e.length!==0){t.setProperty("/noDataText",this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"))}else if(this._oListFilterState.aSearch.length>0){t.setProperty("/noDataText",this.getResourceBundle().getText("masterListNoDataText"))}},_updateFilterBar:function(e){var t=this.getModel("masterView");t.setProperty("/isFilterBarVisible",true);t.setProperty("/filterBarLabel",e)},changeDates:function(e){var t=this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();var i=this.byId("viewSettingsDialog").getFilterItems()[0];var s=t.getContent()[1].getValue();var a=t.getContent()[3].getValue();if(s==""&&a==""){i.setFilterCount(0);i.setSelected(false)}else{i.setFilterCount(1);i.setSelected(true)}},changeSlider:function(e){var t=this.byId("viewSettingsDialog").getFilterItems()[2].getCustomControl();var i=this.byId("viewSettingsDialog").getFilterItems()[2];var s=parseInt(t.getValue());var a=parseInt(t.getValue2());if(s==0&&s==0){i.setFilterCount(0);i.setSelected(false)}else{i.setFilterCount(1);i.setSelected(true)}},handleCancel:function(){var e=this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();var t=this.byId("viewSettingsDialog").getFilterItems()[0],i=e.getContent()[1],s=e.getContent()[3];var a=this.byId("viewSettingsDialog").getFilterItems()[2].getCustomControl();var r=this.byId("viewSettingsDialog").getFilterItems()[2];i.setValue(this.fromDatePreviousValue);s.setValue(this.toDatePreviousValue);a.setValue(this.numItems1PreviousValue);a.setValue2(this.numItems2PreviousValue);if(this.fromDatePreviousValue!==""||this.toDatePreviousValue!==""){t.setFilterCount(1);t.setSelected(true)}else{t.setFilterCount(0);t.setSelected(false)}if(this.numItems1PreviousValue!==0||this.numItems2PreviousValue!==0){r.setFilterCount(1);r.setSelected(true)}else{r.setFilterCount(0);r.setSelected(false)}},handleResetFilters:function(){var e=this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();var t=this.byId("viewSettingsDialog").getFilterItems()[0],i=e.getContent()[1],s=e.getContent()[3];i.setValue("");s.setValue("");t.setFilterCount(0);t.setSelected(false);var a=this.byId("viewSettingsDialog").getFilterItems()[2].getCustomControl();var r=this.byId("viewSettingsDialog").getFilterItems()[2];a.setValue(0);a.setValue2(0);r.setFilterCount(0);r.setSelected(false)}})});
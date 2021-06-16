sap.ui.define(["./BaseController","sap/ui/model/json/JSONModel","../model/formatter","sap/ui/model/Filter","sap/ui/model/FilterOperator"],function(e,t,i,r,s){"use strict";return e.extend("workerslist.controller.Worklist",{formatter:i,onInit:function(){var e;this._aTableSearchState=[];e=new t({worklistTableTitle:this.getResourceBundle().getText("worklistTableTitle"),shareOnJamTitle:this.getResourceBundle().getText("worklistTitle"),shareSendEmailSubject:this.getResourceBundle().getText("shareSendEmailWorklistSubject"),shareSendEmailMessage:this.getResourceBundle().getText("shareSendEmailWorklistMessage",[location.href]),tableNoDataText:this.getResourceBundle().getText("tableNoDataText")});this.setModel(e,"worklistView")},onUpdateFinished:function(e){var t,i=e.getSource(),r=e.getParameter("total");if(r&&i.getBinding("items").isLengthFinal()){t=this.getResourceBundle().getText("worklistTableTitleCount",[r])}else{t=this.getResourceBundle().getText("worklistTableTitle")}this.getModel("worklistView").setProperty("/worklistTableTitle",t)},onPress:function(e){this._showObject(e.getSource())},onNavBack:function(){history.go(-1)},onSearch:function(e){if(e.getParameters().refreshButtonPressed){this.onRefresh()}else{var t=[];var i=e.getParameter("query");if(i&&i.length>0){t=[new r("firstname",s.Contains,i)]}this._applySearch(t)}},onRefresh:function(){var e=this.byId("table");e.getBinding("items").refresh()},_showObject:function(e){var t=this;e.getBindingContext().requestCanonicalPath().then(function(i){t.getRouter().navTo("object",{objectId_Old:e.getBindingContext().getProperty("uuid"),objectId:i.slice("/Workers".length)})})},_applySearch:function(e){var t=this.byId("table"),i=this.getModel("worklistView");t.getBinding("items").filter(e,"Application");if(e.length!==0){i.setProperty("/tableNoDataText",this.getResourceBundle().getText("worklistNoDataWithSearchText"))}}})});
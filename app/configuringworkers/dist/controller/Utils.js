sap.ui.define(["sap/m/MessageToast"],function(e){"use strict";var t={ranking:{Initial:0,Default:1024,Before:function(e){return e+1024},Between:function(e,t){return(e+t)/2},After:function(e){return e/2}},getAvailableProductsTable:function(e){return e.getOwnerComponent().getRootControl().byId("list0")},getSelectedProductsTable:function(e){return e.getOwnerComponent().getRootControl().byId("selectedProducts").byId("table")},getSelectedItemContext:function(t,n){var r=t.getSelectedItems();var o=r[0];if(!o){e.show("Please select a row!");return}var u=o.getBindingContext();if(u&&n){var i=t.indexOfItem(o);n(u,i,t)}return u}};return t});
sap.ui.define(["sap/ui/model/json/JSONModel","sap/ui/core/UIComponent","sap/ui/Device","./model/models","./controller/ErrorHandler"],function(e,t,s,i,n){"use strict";return t.extend("shapein.TemplatesConfiguration.Component",{metadata:{manifest:"json"},init:function(){t.prototype.init.apply(this,arguments);this._oErrorHandler=new n(this);this.setModel(i.createDeviceModel(),"device");this.setModel(i.createFLPModel(),"FLP");this.getRouter().initialize();var s=new e;this.setModel(s,"templates");var o=new e;this.setModel(o,"templates_pers");var a=new e;this.setModel(a,"template");var r=new e;this.setModel(r,"BProcess");var l=new e;this.setModel(l,"header");var d=new e;this.setModel(d,"jerarquia");var h=new e;this.setModel(h,"xsd");var p=new e;this.setModel(p,"doctypes");var c=new e;this.setModel(c,"planning");var v=new e;this.setModel(v,"filters");var u=new e;this.setModel(u,"attributes");var M=new e;this.setModel(M,"editAttr");var w=new e;this.setModel(w,"checkMap");var g=new e;this.setModel(g,"signature");var y=new e;this.setModel(y,"signer");var C=new e;this.setModel(C,"bpt");var f=new e;this.setModel(f,"signtypes");var m=new e;this.setModel(m,"globalVar");var S=new e;this.setModel(S,"globalVari");var b=new e;this.setModel(b,"planningRep");var D=new e;D.setSizeLimit(4e3);this.setModel(D,"BProcessWD");var _=new e;this.setModel(_,"RawModel");this.getSubscriptionSettings()},destroy:function(){this._oErrorHandler.destroy();t.prototype.destroy.apply(this,arguments)},getContentDensityClass:function(){if(this._sContentDensityClass===undefined){if(document.body.classList.contains("sapUiSizeCozy")||document.body.classList.contains("sapUiSizeCompact")){this._sContentDensityClass=""}else if(!s.support.touch){this._sContentDensityClass="sapUiSizeCompact"}else{this._sContentDensityClass="sapUiSizeCozy"}}return this._sContentDensityClass},getSubscriptionSettings:function(){var e=this;var t=this.getModel();var s="/Subscription_Settings";var i=[];t.read(s,{success:function(t,s){var n=t.results;for(var o=0;o<n.length;o++){var a={code:n[o].code,value:n[o].value};i.push(a)}e.settings=i},error:function(t){e.settings=i}})}})});
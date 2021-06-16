// if(location.host.indexOf("studio")>-1){
//     //to make it work in app studio
//     sap.ui.getCore().loadLibrary("ui5lab.wl.pdf", "shapein.TemplatesConfiguration/libs/ui5lab/wl/pdf");
// }else{
//     //to make it work in central approuter
//     sap.ui.getCore().loadLibrary("ui5lab.wl.pdf", "shapein.TemplatesConfiguration/libs/ui5lab/wl/pdf");
// }

// jQuery.sap.registerModulePath("ui5lab.wl.pdf", "/libs/ui5lab/wl/pdf");

sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"./model/models",
	"./controller/ErrorHandler"
], function (JSONModel, UIComponent, Device, models, ErrorHandler) {
	"use strict";

	return UIComponent.extend("shapein.TemplatesConfiguration.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this function, the FLP and device models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");

			// create the views based on the url/hash
			this.getRouter().initialize();

			var oModel = new JSONModel();
			this.setModel(oModel, "templates");
			var oModel11 = new JSONModel();
			this.setModel(oModel11, "templates_pers");
			var oModel2 = new JSONModel();
			this.setModel(oModel2, "template");
			var oModel3 = new JSONModel();
			this.setModel(oModel3, "BProcess");
			var oModel4 = new JSONModel();
			this.setModel(oModel4, "header");
			var oModel5 = new JSONModel();
			this.setModel(oModel5, "jerarquia");
			var oModel6 = new JSONModel();
			this.setModel(oModel6, "xsd");
			var oModel7 = new JSONModel();
			this.setModel(oModel7, "doctypes");
			var oModel8 = new JSONModel();
			this.setModel(oModel8, "planning");
			var oModel9 = new JSONModel();
			this.setModel(oModel9, "filters");
			var oModel10 = new JSONModel();
			this.setModel(oModel10, "attributes");
			var oModel12 = new JSONModel();
			this.setModel(oModel12, "editAttr");
			var oModel13 = new JSONModel();
			this.setModel(oModel13, "checkMap");
			var oModel14 = new JSONModel();
			this.setModel(oModel14, "signature");
			var oModel15 = new JSONModel();
			this.setModel(oModel15, "signer");
			var oModel16 = new JSONModel();
			this.setModel(oModel16, "bpt");
			var oModel17 = new JSONModel();
			this.setModel(oModel17, "signtypes");
			var oModel18 = new JSONModel();
			this.setModel(oModel18, "globalVar");
			var oModel19 = new JSONModel();
			this.setModel(oModel19, "globalVari");
			var oModel20 = new JSONModel();
			this.setModel(oModel20, "planningRep");
			var oModel21 = new JSONModel();
			oModel21.setSizeLimit(4000);
			this.setModel(oModel21, "BProcessWD");
			var oRawModel = new JSONModel();
			this.setModel(oRawModel, "RawModel");

			this.getSubscriptionSettings();
		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ErrorHandler is destroyed.
		 * @public
		 * @override
		 */
		destroy: function () {
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				// eslint-disable-next-line sap-no-proprietary-browser-api
				if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},

		getSubscriptionSettings: function () {
			var that = this;
			var oModel = this.getModel();
			var sPath = "/Subscription_Settings";
			var settings = [];
			oModel.read(sPath, {
				success: function (oData, oResponse) {
					var res = oData.results;
					for (var i = 0; i < res.length; i++) {
						var setting = {
							code: res[i].code,
							value: res[i].value
						};
						settings.push(setting);
					}
					that.settings = settings;
				},
				error: function (oError) {
					that.settings = settings;
				}
			});
		}

	});

});
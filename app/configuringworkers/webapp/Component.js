sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"shapein/ConfiguringWorkers/model/models"
], function (JSONModel, UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("shapein.ConfiguringWorkers.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			this.getSubscriptionSettings();
			// enable routing
			this.getRouter().initialize();


			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
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
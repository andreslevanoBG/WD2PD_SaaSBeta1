sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("shapein.TemplatesConfiguration.controller.App", {

		/* Al instanciar el objeto */
		onInit: function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");
			fnSetAppNotBusy = function () {};
			this.getOwnerComponent().getModel().metadataLoaded().
			then(fnSetAppNotBusy);
			this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this.fill_Business_Process();
			var oModel = this.getOwnerComponent().getModel();
			var that = this;
			oModel.attachBatchRequestCompleted(function (oEvent) {
				var requests = oEvent.getParameter('requests');
				for (var i = 0; i < requests.length; i++) {
					if (requests[i].url == "Subscription_Settings") {
						that.call_Templates();
					}
				}
			});
		},

		/* Recuperamos las templates que hay configuradas en persistencia */
		call_Templates: function () {
			var oViewModel = this.getModel("appView");
			var oModel = this.getOwnerComponent().getModel();
			var oPersTempModel = this.getOwnerComponent().getModel("templates_pers");
			var that = this;
			var sPath = "/Di_Template";
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "planning"
				},
				success: function (oData, oResponse) {
					var results = oData.results;
					delete oData.__metadata;
					oPersTempModel.setData(results);
					oPersTempModel.refresh();
					that.call_Templates_Pd();
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});

		},

		/* Recuperamos los Business Process cargados en persistencia */
		fill_Business_Process: function () {
			var oModel = this.getOwnerComponent().getModel();
			var BPMode = this.getOwnerComponent().getModel("BProcess");
			var that = this;
			var sPath = "/Di_Business_Process";
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "templates"
				},
				success: function (oData, oResponse) {
					var results = oData.results;
					delete oData.__metadata;
					for (var i = 0; i < results.length; i++) {
						results[i].templates = results[i].templates.results;
					}
					BPMode.setData(results);
				},
				error: function (oError) {}
			});
		},

		/* Recuperamos las templates de PeopleDoc y cruzamos con las existentes en persistencia
			para generar el modelo a mostrar en el listado  */
		call_Templates_Pd: function () {
			var oPersTempModel = this.getOwnerComponent().getModel("templates_pers");
			var templates = oPersTempModel.getData();
			var oViewModel = this.getModel("appView");
			var oModel = this.getOwnerComponent().getModel("templates");
			var url = "/CPI-WD2PD_Dest/di/templates/templates_pd";
			if (this.getOwnerComponent().settings) {
				var cuscode = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Code");
				var cusclientid = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Client_Id");
				var cusscope = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Scope");
				jQuery.ajax({
					url: url,
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Customer-Code', cuscode.value);
						xhr.setRequestHeader('Customer-Client_Id', cusclientid.value);
						xhr.setRequestHeader('Customer-Scope', cusscope.value);
					},
					type: "GET",
					dataType: "json",
					success: function (results) {
						for (var i = 0; i < results.length; i++) {
							var act_version = String(results[i].active_version);
							var temp = templates.find(template => template.template_id === results[i].id && template.template_version === act_version);
							if (temp) {
								results[i].planned = "";
								if (temp.planning) {
									if (temp.planning.enable) {
										results[i].planned = "X";
									}
								}
								results[i].active = temp.active;
								results[i].exist_pers = "X";
								results[i].exist_PD = "X";
								results[i].uuid = temp.uuid;
							} else {
								results[i].planned = "";
								results[i].active = false;
								results[i].exist_pers = "";
								results[i].exist_PD = "X";
								results[i].uuid = "";
							}
						}
						for (var j = 0; j < templates.length; j++) {
							var act_version = String(templates[j].template_version);
							var temp = results.find(template => template.id === templates[j].template_id && template.active_version == act_version);
							if (!temp) {
								var result = {};
								result.planned = "";
								if (templates[j].planning) {
									if (templates[j].planning.enable) {
										result.planned = "X";
									}
								}
								result.active_version = templates[j].template_version;
								result.active = templates[j].active;
								result.exist_pers = "X";
								result.description = templates[j].description;
								result.id = templates[j].template_id;
								result.locale = templates[j].language;
								result.title = templates[j].doc_title;
								result.format = templates[j].format;
								result.updated_at = templates[j].updated_at;
								result.exist_PD = "";
								results.push(result);
							}
						}
						oModel.setData(results);
						oModel.refresh();
						oViewModel.setProperty("/busy", false);
					},
					error: function (e) {
						oViewModel.setProperty("/busy", false);
					}
				});
			}
		},
	});

});
/*global X2JS:true */

sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/xml/XMLModel",
	"../model/formatter",
	"../libs/x2js/xml2json",
	"sap/ui/core/Fragment",
	"sap/ui/core/routing/History"
], function (BaseController, JSONModel, XMLModel, formatter, xml2json, Fragment, History) {
	"use strict";

	var oIndex = 1;
	var oQuery;

	return BaseController.extend("shapein.TemplatesConfiguration.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0
				});
			this.template_id = "";
			this.format = "";
			this.updated_at = "";
			this.template_version = "";
			this.template_language = "";
			this.selectedVar = "";
			this.selectedVarMeta = "";
			this.selectedAttr = "";
			this.description = "";
			this.oldBP = "";
			this.partiallySel = false;
			this.partiallySelMeta = false;
			this.oldKey = "";
			this.oldDType = "";
			this.oldTitle = "";
			this.exist_plan = "";
			this.exist_plan_Rep = "";
			this.editIndex = 0;
			this.oldExpDate = "";
			this.stepCoordenates = 1;
			this.buttonIdSel = "";
			this.pathButtonSel = "";
			this.code_id_filled = "";
			this.sourceGVEdit = "";
			this.oldFilters = [];
			this.oSemanticPage = this.byId("pageSemantic");
			// this.oEditAction = this.byId("editAction");
			// this.oDeleteAction = this.byId("deleteAction");
			this.showCustomActions(false);

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			var templateMod = this.getModel("template");
			this.getView().setModel(templateMod, "template");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			var oModelXML = new XMLModel();

			// oModelXML.loadData("data/Workday-Human_Resources.xml");
			// var oThat = this;
			// oModelXML.attachRequestCompleted(function (oEvent) {
			// 	var xml2json = new X2JS();
			// 	var json = xml2json.xml2json(oEvent.getSource().getData());
			// 	var oModel1 = new JSONModel();
			// 	oModel1.setData(json);
			// 	oThat.getView().setModel(oModel1, "ModelTreeTable");
			// });

			var daysModel = new JSONModel();
			var data = [];
			var item = {};
			for (var i = 0; i < 31; i++) {
				var item = {};
				item.text = i + 1;
				item.key = item.text;
				data.push(item);
			}
			item = {};
			item.text = "Last Day";
			item.key = "last_day";
			data.push(item);
			daysModel.setData(data);

			this.setModel(daysModel, "days");

			//	this.setModel(newPlanModel, "newPlan");
			var oModelTime = this.getOwnerComponent().getModel("timezones");
			oModelTime.setSizeLimit(1000);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("objectView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			this.initModels();
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", true);
			var sObjectId = oEvent.getParameter("arguments").objectId;
			var version = oEvent.getParameter("arguments").version;
			//var sVersion = oEvent.getParameter("arguments").version;
			// this.getModel().metadataLoaded().then( function() {
			var sObjectPath = "templates/" + sObjectId + "," + version;
			var oTempModel = this.getModel("templates");
			var templates = oTempModel.getData();

			if (!Array.isArray(templates)) {
				//	this.sleep(20000);
				this.sleep(7000).then(() => {
					this._bindView(sObjectId, version);
				});
			} else {
				this._bindView(sObjectId, version);
			}
			//	this._bindView(sObjectId);
			// }.bind(this));
		},

		sleep: function (ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function (sObjectId, version) {
			var oViewModel = this.getModel("objectView"),
				oTempModel = this.getModel("templates"),
				oHeaderModel = this.getModel("header"),
				oDataModel = this.getModel("template"),
				oFilterModel = this.getModel("filters"),
				oAttrModel = this.getModel("attributes"),
				oPlanModel = this.getModel("planning"),
				oPlanModelRep = this.getModel("planningRep"),
				oSignatureModel = this.getModel("signature"),
				oGlobalVar = this.getModel("globalVar"),
				oDocTypesModel = this.getModel("doctypes");
			var templates = oTempModel.getData();
			//var temp = templates.find(template => template.id === sObjectId );
			var act_version = String(version);
			var temp = templates.find(template => template.id === sObjectId && template.active_version == act_version);

			this.template_id = temp.id;
			this.template_version = temp.active_version;
			this.template_language = temp.locale;
			this.format = temp.format;
			this.updated_at = temp.updated_at;
			this.description = temp.description;
			var oModel = this.getOwnerComponent().getModel();

			var that = this;
			//this.getView().byId("lineItemsList").setBusy(true);
			//	oViewModel.setProperty("/busy", true);
			var aFilter = [];
			var templateFil = new sap.ui.model.Filter("template_id", sap.ui.model.FilterOperator.EQ, temp.id);
			var templateVers = new sap.ui.model.Filter("template_version", sap.ui.model.FilterOperator.EQ, temp.active_version);
			aFilter.push(templateFil);
			aFilter.push(templateVers);
			oViewModel.refresh();
			var head = {};
			var sPath = "/Di_Template";
			oModel.read(sPath, {
				// urlParameters: {
				// 	"$expand": "business_process, mappings"
				// },
				filters: aFilter,
				success: function (oData, oResponse) {
					var results = oData.results[0];
					delete oData.__metadata;
					//	oHeaderModel.setData(results);
					//	oHeaderModel.refresh();
					if (results) {
						var sPath1 = sPath + "(guid'" + results.uuid + "')"
						head.uuid = results.uuid;
						head.id = results.template_id;
						head.version = results.template_version;
						head.description = temp.description;
						head.language = temp.locale;
						head.signature = results.signature;
						head.active = results.active;
						head.deprecated = results.deprecated;
						if (head.active) {
							that.oldKey = "A";
						} else {
							that.oldKey = "I";
						}
						head.doc_type = results.doc_type_id;
						that.oldDocType = results.doc_type_id;
						head.title = results.doc_title;
						var BPData = that.getOwnerComponent().getModel("BProcess").getData();
						if (Array.isArray(BPData)) {
							var bp_name = BPData.find(bp => bp.bpt_id === results.bpt_id);
							head.business_process_text = bp_name.name;
						}
						head.business_process = results.bpt_id;
						that.oldBP = head.business_process;
						that.oldTitle = head.title;
						that.oldDType = head.doc_type;
						oHeaderModel.setData(head);
						oHeaderModel.refresh();
						oModel.read(sPath1, {
							urlParameters: {
								"$expand": "business_process,pages,mappings,sign_cfg,planning/integs_plan_d,planning/adata,planning_rep/integs_plan_d,planning_rep/adata,attributes/values_attr"
							},
							success: function (oData2, oResponse2) {
								var results2 = oData2;
								var planning = results2.planning;
								var planning_rep = results2.planning_rep;
								var sign_conf = results2.sign_cfg;
								if (planning) {
									that.exist_plan = "X";
									if (planning.enable) {
										planning.enable = "A";
									} else {
										planning.enable = "U";
									}
									planning.adata = results2.planning.adata.results;
									planning.plan_d = results2.planning.integs_plan_d.results[0];
									sPath1 = sPath + "/begda";
									var begdaD = planning.plan_d.begda;
									var month = String(begdaD.getMonth() + 1);
									if (month < 10) {
										month = "0" + String(month);
									}
									var days = String(begdaD.getDate());
									if (days < 10) {
										days = "0" + String(days);
									}
									var begda = begdaD.getFullYear() + "-" + month + "-" + days;
									planning.plan_d.begda = begda;
									var enddaD = planning.plan_d.endda;
									var month2 = String(enddaD.getMonth() + 1);
									if (month2 < 10) {
										month2 = "0" + String(month2);
									}
									var days2 = String(enddaD.getDate());
									if (days2 < 10) {
										days2 = "0" + String(days2);
									}
									var endda = enddaD.getFullYear() + "-" + month2 + "-" + days2;
									planning.plan_d.endda = endda;
									var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
										pattern: "HH:mm:ss"
									});
									var offsetms = new Date(0).getTimezoneOffset() * 60 * 1000;
									var time_start = timeFormat.format(new Date(planning.plan_d.time_start.ms + offsetms));
									planning.plan_d.time_start = time_start;
									var time_end = timeFormat.format(new Date(planning.plan_d.time_end.ms + offsetms));
									planning.plan_d.time_end = time_end;
									planning.plan_d.time_frecuency = planning.plan_d.time_frecuency + planning.plan_d.time_measure;
									var item = {};
									planning.adata.forEach(function (entry) {
										delete entry.__metadata;
										switch (entry.level2) {
										case "TIME_ZONE":
											item.time_zone = entry.value;
											item.time_zone_uuid = entry.uuid;
											item.planning_uuid = entry.planning_uuid;
											break;
										case "INITIAL_DATE_FROM":
											item.initial_date_from = entry.value;
											item.initial_date_from_uuid = entry.uuid;

											break;
										case "RETRO_CHG_EFFECTIVE_FROM":
											item.retro_effec_from = entry.value;
											item.retro_effec_from_uuid = entry.uuid;
											break;
										case "FUTURE_CHG_UPDATED_FROM":
											item.fut_upd_from = entry.value;
											item.fut_upd_from_uuid = entry.uuid;
											break;
										case "NEXT_UPDATED_FROM":
											item.next_upd_from = entry.value;
											item.next_upd_from_uuid = entry.uuid;
											break;

										default:
										}
									});
									planning.adata = item;
								} else {
									that.exist_plan = "";
									var datanewPlan = {
										execute: true,
										begda: "2020-01-01",
										endda: "9999-12-31",
										periodicity_type: "W",
										ontime: false,
										periodicity_values: "2-4-6",
										time_frecuency: "1m",
										//	time_measure: "m",
										time_start: "00:00:00",
										time_end: "23:59:00",
										time_zone: "UTC"
									};
									planning = {
										comments: "",
										enable: "U",
									};
									planning.plan_d = datanewPlan;
									planning.adata = [];
									// TODO no existe planning aún
								}
								if (planning_rep) {
									that.exist_plan_Rep = "X";
									if (planning_rep.enable) {
										planning_rep.enable = "A";
									} else {
										planning_rep.enable = "U";
									}
									//planning_rep.adata = results2.planning_rep.adata.results;
									planning_rep.plan_d = results2.planning_rep.integs_plan_d.results[0];
									sPath1 = sPath + "/begda";
									var begdaD = planning_rep.plan_d.begda;
									var month = String(begdaD.getMonth() + 1);
									if (month < 10) {
										month = "0" + String(month);
									}
									var days = String(begdaD.getDate());
									if (days < 10) {
										days = "0" + String(days);
									}
									var begda = begdaD.getFullYear() + "-" + month + "-" + days;
									planning_rep.plan_d.begda = begda;
									var enddaD = planning_rep.plan_d.endda;
									var month2 = String(enddaD.getMonth() + 1);
									if (month2 < 10) {
										month2 = "0" + String(month2);
									}
									var days2 = String(enddaD.getDate());
									if (days2 < 10) {
										days2 = "0" + String(days2);
									}
									var endda = enddaD.getFullYear() + "-" + month2 + "-" + days2;
									planning_rep.plan_d.endda = endda;
									var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
										pattern: "HH:mm:ss"
									});
									var offsetms = new Date(0).getTimezoneOffset() * 60 * 1000;
									var time_start = timeFormat.format(new Date(planning_rep.plan_d.time_start.ms + offsetms));
									planning_rep.plan_d.time_start = time_start;
									var time_end = timeFormat.format(new Date(planning_rep.plan_d.time_end.ms + offsetms));
									planning_rep.plan_d.time_end = time_end;
									planning_rep.plan_d.time_frecuency = planning_rep.plan_d.time_frecuency + planning_rep.plan_d.time_measure;
									var item = {};
									// planning_rep.adata.forEach(function (entry) {
									// 	delete entry.__metadata;
									// 	switch (entry.level2) {
									// 	case "TIME_ZONE":
									// 		item.time_zone = entry.value;
									// 		item.time_zone_uuid = entry.uuid;
									// 		item.planning_uuid = entry.planning_uuid;
									// 		break;
									// 	case "INITIAL_DATE_FROM":
									// 		item.initial_date_from = entry.value;
									// 		item.initial_date_from_uuid = entry.uuid;

									// 		break;
									// 	case "RETRO_CHG_EFFECTIVE_FROM":
									// 		item.retro_effec_from = entry.value;
									// 		item.retro_effec_from_uuid = entry.uuid;
									// 		break;
									// 	case "FUTURE_CHG_UPDATED_FROM":
									// 		item.fut_upd_from = entry.value;
									// 		item.fut_upd_from_uuid = entry.uuid;
									// 		break;
									// 	case "NEXT_UPDATED_FROM":
									// 		item.next_upd_from = entry.value;
									// 		item.next_upd_from_uuid = entry.uuid;
									// 		break;

									// 	default:
									// 	}
									// });
									// planning_rep.adata = item;
								} else {
									that.exist_plan_Rep = "";
									var datanewPlan = {
										execute: true,
										begda: "2020-01-01",
										endda: "9999-12-31",
										periodicity_type: "W",
										ontime: false,
										periodicity_values: "2-4-6",
										time_frecuency: "1m",
										//	time_measure: "m",
										time_start: "00:00:00",
										time_end: "23:59:00",
										time_zone: "UTC"
									};
									planning_rep = {
										comments: "",
										enable: "U"
									};
									planning_rep.plan_d = datanewPlan;
									//planning_rep.adata = [];
									// TODO no existe planning aún
								}
								var attributes = results2.attributes.results;
								var atrData = [];
								var filData = [];
								if (attributes) {
									for (var j = 0; j < attributes.length; j++) {
										var attr = {
											uuid: attributes[j].uuid,
											name: attributes[j].name,
											description: attributes[j].description,
											path: attributes[j].xpath,
											sign: attributes[j].sign
										};
										atrData.push(attr);
										for (var l = 0; l < attributes[j].values_attr.results.length; l++) {
											var filter = {
												uuid: attributes[j].values_attr.results[l].uuid,
												attr_uuid: attributes[j].uuid,
												name: attributes[j].name,
												description: attributes[j].description,
												path: attributes[j].xpath,
												value: attributes[j].values_attr.results[l].value
											};
											filData.push(filter);
											var oldValues = Object.assign({}, filter);
											that.oldFilters.push(oldValues);
										}
									}
								}
								//	that.oldFilters = Array.from(filData);
								//	var filData2 = Array.from(filData);
								//let oldValues = Object.assign({}, filData);
								//let oldVal = Object.values(oldValues);
								//that.oldFilters = [...oldVal];
								//	that.oldFilters = jQuery.extend({}, oldVal);
								if (sign_conf) {
									var signData = JSON.parse(sign_conf.json_cfg);
									signData.uuid = sign_conf.uuid;
									//		var arrayValues = Object.entries(sign_conf);
								} else {
									var signData = {};
									signData.uuid = "";
									signData.signers = [];
								}
								oSignatureModel.setData(signData);
								oSignatureModel.refresh();
								oFilterModel.setData(filData);
								oFilterModel.refresh();
								oAttrModel.setData(atrData);
								oAttrModel.refresh();
								oPlanModel.setData(planning);
								oPlanModel.refresh();
								oPlanModelRep.setData(planning_rep);
								oPlanModelRep.refresh();
								var g_variables = [];
								var mappings = [];
								var metadata = [];
								for (var j = 0; j < results2.mappings.results.length; j++) {
									if (results2.mappings.results[j].mapping_object == "TEMPL_MAPP") {
										mappings.push(results2.mappings.results[j]);
									} else if (results2.mappings.results[j].mapping_object == "GLOBAL_VAR") {
										g_variables.push(results2.mappings.results[j]);
									} else if (results2.mappings.results[j].mapping_object == "DOCID_META") {
										metadata.push(results2.mappings.results[j]);
									}
								}
								results2.mappings = mappings;
								results2.metadata = metadata;
								oGlobalVar.setData(g_variables);
								oGlobalVar.refresh();
								results2.business_process = results2.business_process.results;
								delete oData2.__metadata;
								that.call_Template_details(results2, temp, "");

							},
							error: function (oError) {
								oViewModel.setProperty("/busy", false);
							}
						});
					} else {
						// var results2 = {
						// 	mappings: [],
						// };
						// that.call_Template_details(results2, temp);

						//	var url = "/CPI-WD2PD-Deep/templates/template/detail";
						var url = "/CPI-WD2PD_Dest/di/templates/template/detail";
						var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
						var langu = sCurrentLocale + "-" + sCurrentLocale;
						url = url + "?Template-Id=" + temp.id + "&Template-Version=" + temp.active_version + "&Template-Language=" + langu;
						// var entorno = 'DEV';
						// if (entorno == 'DEV') {
						// 	var cuscode = "C000000001";
						// 	var cusclientid = "15ff0365-5b0c-420e-bb14-bcf28b458374";
						// 	var cusscope = "cf0f8bd6-4d5c-4ea5-827d-22898796ce68";
						// }
						// if (entorno == 'TEST') {
						// 	var cuscode = "T000000001";
						// 	var cusclientid = "e4f496b6-4c9b-4d03-9665-86d13349b046";
						// 	var cusscope = "f0adfc99-7fea-42d7-9439-46a4c9de4742";
						// }
						if (that.getOwnerComponent().settings) {
							//this.settings = await this.getSubscriptionSettings();

							var cuscode = that.getOwnerComponent().settings.find(setting => setting.code === "Customer-Code");
							var cusclientid = that.getOwnerComponent().settings.find(setting => setting.code === "Customer-Client_Id");
							var cusscope = that.getOwnerComponent().settings.find(setting => setting.code === "Customer-Scope");

							jQuery.ajax({
								url: url,
								beforeSend: function (xhr) {
									xhr.setRequestHeader('Customer-Code', cuscode.value);
									xhr.setRequestHeader('Customer-Client_Id', cusclientid.value);
									xhr.setRequestHeader('Customer-Scope', cusscope.value);
									xhr.setRequestHeader('Template-Return-Preview', true);
								},
								type: "GET",
								dataType: "json",
								success: function (results) {
									oDocTypesModel.setData(results.employee_doctypes_assigned);
									oDocTypesModel.refresh();
									if (results.pages_preview) {
										for (var i = 0; i < results.pages_preview.length; i++) {
											results.pages_preview[i].base64 = "data:image/png;base64," + results.pages_preview[i].base64;
										}
									} else {
										results.pages_preview = [];
									}
									//results.variables = [];
									for (var j = 0; j < results.variables.length; j++) {
										//	var variablePers = resultsPers.mappings.find(mapping => mapping.variable === results.variables[j].slug);
										//	if (variablePers) {
										results.variables[j].path = "";
										results.variables[j].map = "";
										//	results.variables[j].uuid = variablePers.uuid;
									}

									results.id = temp.id;
									results.description = temp.description;
									results.title = temp.title;
									results.updated_at = temp.updated_at;
									results.deprecated = temp.deprecated;
									results.base64 = "";
									oDataModel.setData(results);
									oDataModel.refresh();
									oViewModel.setProperty("/busy", false);
									var scount = results.variables.length;
									that.getView().byId("tabMap").setCount(scount);
									that.configNewTemp();
								},
								error: function (e) {
									oViewModel.setProperty("/busy", false);
									var mensaje = JSON.parse(e.responseText).message_error.substring(66);
									sap.m.MessageToast.show(mensaje);
								}
							});
						}
					}
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});

		},

		refreshObjectsTemplate: function (uuidTemp, mapCop, metaCop) {
			var oViewModel = this.getModel("objectView"),
				oTempModel = this.getModel("templates"),
				oHeaderModel = this.getModel("header"),
				oDataModel = this.getModel("template"),
				oFilterModel = this.getModel("filters"),
				oAttrModel = this.getModel("attributes"),
				oPlanModel = this.getModel("planning"),
				oPlanModelRep = this.getModel("planningRep"),
				oSignatureModel = this.getModel("signature"),
				oGlobalVar = this.getModel("globalVar"),
				oDocTypesModel = this.getModel("doctypes");
			var oModel = this.getOwnerComponent().getModel();
			var templates = oTempModel.getData();
			var sPath = "/Di_Template";
			var that = this;
			var sPath1 = sPath + "(guid'" + uuidTemp + "')"
			oModel.read(sPath1, {
				urlParameters: {
					"$expand": "business_process,mappings,sign_cfg,planning/integs_plan_d,planning/adata,planning_rep/integs_plan_d,planning_rep/adata,attributes/values_attr"
				},
				success: function (oData2, oResponse2) {
					var results2 = oData2;
					var planning = results2.planning;
					var planning_rep = results2.planning_rep;
					var sign_conf = results2.sign_cfg;
					if (planning) {
						that.exist_plan = "X";
						if (planning.enable) {
							planning.enable = "A";
						} else {
							planning.enable = "U";
						}
						planning.adata = results2.planning.adata.results;
						planning.plan_d = results2.planning.integs_plan_d.results[0];
						sPath1 = sPath + "/begda";
						var begdaD = planning.plan_d.begda;
						var month = String(begdaD.getMonth() + 1);
						if (month < 10) {
							month = "0" + String(month);
						}
						var days = String(begdaD.getDate());
						if (days < 10) {
							days = "0" + String(days);
						}
						var begda = begdaD.getFullYear() + "-" + month + "-" + days;
						planning.plan_d.begda = begda;
						var enddaD = planning.plan_d.endda;
						var month2 = String(enddaD.getMonth() + 1);
						if (month2 < 10) {
							month2 = "0" + String(month2);
						}
						var days2 = String(enddaD.getDate());
						if (days2 < 10) {
							days2 = "0" + String(days2);
						}
						var endda = enddaD.getFullYear() + "-" + month2 + "-" + days2;
						planning.plan_d.endda = endda;
						planning.plan_d.time_frecuency = planning.plan_d.time_frecuency + planning.plan_d.time_measure;
						var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
							pattern: "HH:mm:ss"
						});
						var offsetms = new Date(0).getTimezoneOffset() * 60 * 1000;
						var time_start = timeFormat.format(new Date(planning.plan_d.time_start.ms + offsetms));
						planning.plan_d.time_start = time_start;
						var time_end = timeFormat.format(new Date(planning.plan_d.time_end.ms + offsetms));
						planning.plan_d.time_end = time_end;
						var item = {};
						planning.adata.forEach(function (entry) {
							delete entry.__metadata;
							switch (entry.level2) {
							case "TIME_ZONE":
								item.time_zone = entry.value;
								item.time_zone_uuid = entry.uuid;
								item.planning_uuid = entry.planning_uuid;
								break;
							case "INITIAL_DATE_FROM":
								item.initial_date_from = entry.value;
								item.initial_date_from_uuid = entry.uuid;

								break;
							case "RETRO_CHG_EFFECTIVE_FROM":
								item.retro_effec_from = entry.value;
								item.retro_effec_from_uuid = entry.uuid;
								break;
							case "FUTURE_CHG_UPDATED_FROM":
								item.fut_upd_from = entry.value;
								item.fut_upd_from_uuid = entry.uuid;
								break;
							case "NEXT_UPDATED_FROM":
								item.next_upd_from = entry.value;
								item.next_upd_from_uuid = entry.uuid;
								break;

							default:
							}
						});
						planning.adata = item;
					} else {
						that.exist_plan = "";
						var datanewPlan = {
							execute: true,
							begda: "2020-01-01",
							endda: "9999-12-31",
							periodicity_type: "W",
							ontime: false,
							periodicity_values: "2-4-6",
							time_frecuency: "1m",
							//	time_measure: "m",
							time_start: "00:00:00",
							time_end: "23:59:00",
							time_zone: "UTC"
						};
						planning = {
							comments: "",
							enable: "U",
						};
						planning.plan_d = datanewPlan;
						planning.adata = [];
						// TODO no existe planning aún
					}
					if (planning_rep) {
						that.exist_plan_Rep = "X";
						if (planning_rep.enable) {
							planning_rep.enable = "A";
						} else {
							planning_rep.enable = "U";
						}
						planning_rep.adata = results2.planning_rep.adata.results;
						planning_rep.plan_d = results2.planning_rep.integs_plan_d.results[0];
						sPath1 = sPath + "/begda";
						var begdaD = planning_rep.plan_d.begda;
						var month = String(begdaD.getMonth() + 1);
						if (month < 10) {
							month = "0" + String(month);
						}
						var days = String(begdaD.getDate());
						if (days < 10) {
							days = "0" + String(days);
						}
						var begda = begdaD.getFullYear() + "-" + month + "-" + days;
						planning_rep.plan_d.begda = begda;
						planning_rep.plan_d.time_frecuency = planning_rep.plan_d.time_frecuency + planning_rep.plan_d.time_measure;
						var enddaD = planning_rep.plan_d.endda;
						var month2 = String(enddaD.getMonth() + 1);
						if (month2 < 10) {
							month2 = "0" + String(month2);
						}
						var days2 = String(enddaD.getDate());
						if (days2 < 10) {
							days2 = "0" + String(days2);
						}
						var endda = enddaD.getFullYear() + "-" + month2 + "-" + days2;
						planning_rep.plan_d.endda = endda;
						var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
							pattern: "HH:mm:ss"
						});
						var offsetms = new Date(0).getTimezoneOffset() * 60 * 1000;
						var time_start = timeFormat.format(new Date(planning_rep.plan_d.time_start.ms + offsetms));
						planning_rep.plan_d.time_start = time_start;
						var time_end = timeFormat.format(new Date(planning_rep.plan_d.time_end.ms + offsetms));
						planning_rep.plan_d.time_end = time_end;
						var item = {};
						planning_rep.adata.forEach(function (entry) {
							delete entry.__metadata;
							switch (entry.level2) {
							case "TIME_ZONE":
								item.time_zone = entry.value;
								item.time_zone_uuid = entry.uuid;
								item.planning_uuid = entry.planning_uuid;
								break;
							case "INITIAL_DATE_FROM":
								item.initial_date_from = entry.value;
								item.initial_date_from_uuid = entry.uuid;

								break;
							case "RETRO_CHG_EFFECTIVE_FROM":
								item.retro_effec_from = entry.value;
								item.retro_effec_from_uuid = entry.uuid;
								break;
							case "FUTURE_CHG_UPDATED_FROM":
								item.fut_upd_from = entry.value;
								item.fut_upd_from_uuid = entry.uuid;
								break;
							case "NEXT_UPDATED_FROM":
								item.next_upd_from = entry.value;
								item.next_upd_from_uuid = entry.uuid;
								break;

							default:
							}
						});
						planning_rep.adata = item;
					} else {
						that.exist_plan_Rep = "";
						var datanewPlan = {
							execute: true,
							begda: "2020-01-01",
							endda: "9999-12-31",
							periodicity_type: "W",
							ontime: false,
							periodicity_values: "2-4-6",
							time_frecuency: "1m",
							//	time_measure: "m",
							time_start: "00:00:00",
							time_end: "23:59:00",
							time_zone: "UTC"
						};
						planning_rep = {
							comments: "",
							enable: "U"
						};
						planning_rep.plan_d = datanewPlan;
						planning_rep.adata = [];
						// TODO no existe planning aún
					}
					var attributes = results2.attributes.results;
					var atrData = [];
					var filData = [];
					if (attributes) {
						for (var j = 0; j < attributes.length; j++) {
							var attr = {
								uuid: attributes[j].uuid,
								name: attributes[j].name,
								description: attributes[j].description,
								path: attributes[j].xpath,
								sign: attributes[j].sign
							};
							atrData.push(attr);
							for (var l = 0; l < attributes[j].values_attr.results.length; l++) {
								var filter = {
									uuid: attributes[j].values_attr.results[l].uuid,
									attr_uuid: attributes[j].uuid,
									name: attributes[j].name,
									description: attributes[j].description,
									path: attributes[j].xpath,
									value: attributes[j].values_attr.results[l].value
								};
								filData.push(filter);
							}
						}
					}
					if (sign_conf) {
						var signData = JSON.parse(sign_conf.json_cfg);
						signData.uuid = sign_conf.uuid;
						//		var arrayValues = Object.entries(sign_conf);
					} else {
						var signData = {};
						signData.uuid = "";
						signData.signers = [];
					}
					oSignatureModel.setData(signData);
					oSignatureModel.refresh();
					oFilterModel.setData(filData);
					oFilterModel.refresh();
					oAttrModel.setData(atrData);
					oAttrModel.refresh();
					oPlanModel.setData(planning);
					oPlanModel.refresh();
					oPlanModelRep.setData(planning_rep);
					oPlanModelRep.refresh();
					var g_variables = [];
					var mappings = [];
					var metadata = [];
					for (var j = 0; j < results2.mappings.results.length; j++) {
						if (results2.mappings.results[j].mapping_object == "TEMPL_MAPP") {
							mappings.push(results2.mappings.results[j]);
						} else if (results2.mappings.results[j].mapping_object == "GLOBAL_VAR") {
							g_variables.push(results2.mappings.results[j]);
						} else if (results2.mappings.results[j].mapping_object == "DOCID_META") {
							metadata.push(results2.mappings.results[j]);
						}
					}
					results2.mappings = mappings;
					results2.metadata = metadata;
					oGlobalVar.setData(g_variables);
					oGlobalVar.refresh();
					results2.business_process = results2.business_process.results;
					delete oData2.__metadata;
					//	var temp = templates.find(template => template.id === that.template_id);
					var temp = templates.find(template => template.id === that.template_id && template.active_version == that.template_version);

					// var temp = {};
					// temp.id = that.template_id;
					// temp.active_version = that.template_version;
					// temp.locale = that.template_language;
					// temp.description = that.description;
					if (mapCop && metaCop) {
						that.call_Template_details(results2, temp, "X", "X", uuidTemp);
					} else if (mapCop && !metaCop) {
						that.call_Template_details(results2, temp, "X", "", uuidTemp);
					} else if (!mapCop && metaCop) {
						that.call_Template_details(results2, temp, "", "X", uuidTemp);
					} else {
						that.call_Template_details(results2, temp, "", "");
					}

				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});

		},

		getSubscriptionSettings: async function () {
			var oModel = this.getOwnerComponent().getModel();
			var sPath = "/Subscription_Settings";
			var settings = [];
			oModel.read(sPath, {
				success: function (oData, oResponse) {
					var res = oData.results;
					for (var i = 0; i < res.length; i++) {
						var setting = {
							code: res[i].code,
							value: res[i].value
						}
						settings.push(setting);
					}
					return settings;
				},
				error: function (oError) {
					return settings;
				}
			})
		},

		checkMappings: function (oEvent) {
			this.byId("tableChecks").setBusy(true);
			var dialogcheckMap = oEvent.getSource().getParent();
			var aInputs = [
					//	oView.byId("BusinessProcess"),
					this.byId("CheckEmployee")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			// if (this.byId("ProcessType").getSelectedKey() === "I") {
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				this.byId("tableChecks").setBusy(false);
				return;
			}
			var oDataModel = this.getModel("template");
			var checkMapModel = this.getModel("checkMap");
			var ckeckMapData = checkMapModel.getData();
			var variables = oDataModel.getData().variables;
			var mappings = [];
			var that = this;
			for (var i = 0; i < ckeckMapData.length; i++) {
				if (ckeckMapData[i].path != "") {
					var item = {
						variable: ckeckMapData[i].variable,
						mapping: ckeckMapData[i].path,
						source: ckeckMapData[i].source,
						mapping_object: "TEMPL_MAPP"
					}
					mappings.push(item);
				}
			}
			//var url = "/CPI-WD2PD-Deepv2/templates/template/mapping_test";
			var url = "/CPI-WD2PD_Dest/di/templates/template/mapping_test";
			// var entorno = 'DEV';
			// if (entorno == 'DEV') {
			// 	var cuscode = "C000000001";
			// 	var cusclientid = "15ff0365-5b0c-420e-bb14-bcf28b458374";
			// 	var cusscope = "cf0f8bd6-4d5c-4ea5-827d-22898796ce68";
			// }
			// if (entorno == 'TEST') {
			// 	var cuscode = "T000000001";
			// 	var cusclientid = "e4f496b6-4c9b-4d03-9665-86d13349b046";
			// 	var cusscope = "f0adfc99-7fea-42d7-9439-46a4c9de4742";
			// }
			if (this.getOwnerComponent().settings) {
				//this.settings = await this.getSubscriptionSettings();

				var cuscode = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Code");
				var cusclientid = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Client_Id");
				var cusscope = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Scope");
				var employee_id = aInputs[0].getValue();
				var data = {
					"mockdata": {
						"employee_id": employee_id,
						"ws_response": null
					},
					"mapping": mappings
				};
				var datajson = JSON.stringify(data);
				//	var datajson = JSON.stringify({"mockdata":{"employee_id":"21602","ws_response":null},"mapping":[{"variable":"firstName","mapping":"/Get_Workers_Response/Response_Data/Worker/Worker_Data/Personal_Data/Name_Data/Legal_Name_Data/Name_Detail_Data/First_Name","mapping_object":"TEMPL_MAPP"}]});
				jQuery.ajax({
					url: url,
					type: "POST",
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Customer-Code', cuscode.value);
						xhr.setRequestHeader('Customer-Client_Id', cusclientid.value);
						xhr.setRequestHeader('Customer-Scope', cusscope.value);
					},
					dataType: "json",
					contentType: "application/json",
					data: datajson,
					success: function (results) {
						var checkMaps = [];
						for (var i = 0; i < results.mapping_result.length; i++) {
							var map = ckeckMapData.find(mapData => mapData.variable === results.mapping_result[i].variable);
							var item = {
								variable: results.mapping_result[i].variable,
								error: "",
								value: results.mapping_result[i].value,
								path: map.path,
								source: map.source
							};
							checkMaps.push(item);
						}
						for (var i = 0; i < results.mapping_error.length; i++) {
							var mapEr = ckeckMapData.find(mapData => mapData.variable === results.mapping_result[i].variable);
							var item_error = {
								variable: results.mapping_error[i].variable,
								error: "X",
								value: results.mapping_error[i].value,
								path: mapEr.path,
								source: mapEr.source
							};
							checkMaps.push(item_error);
						}
						checkMapModel.setData(checkMaps);
						checkMapModel.refresh();
						that.byId("tableChecks").setBusy(false);
						//dialogcheckMap.close();
					},
					error: function (error) {
						var variables = ckeckMapData;
						var mappings = [];
						for (var i = 0; i < variables.length; i++) {
							if (variables[i].path != "") {
								var item = {
									variable: variables[i].variable,
									error: "C",
									path: variables[i].path,
									source: variables[i].source,
									value: ""
								}
								mappings.push(item);
							}
						}
						checkMapModel.setData(mappings);
						checkMapModel.refresh();
						//sap.m.MessageToast.show("Error Check Mappings");
						var mensaje = JSON.parse(error.responseText).message_error.substring(66);
						sap.m.MessageToast.show(mensaje);
						that.byId("tableChecks").setBusy(false);
						//dialogcheckMap.close();
					}
				});
			}

		},

		call_Template_details: function (resultsPers, temp, mapCop, metaCop, uuidTemp) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel("template"),
				oHeaderModel = this.getModel("header"),
				oDocTypesModel = this.getModel("doctypes"),
				oSignTypesModel = this.getModel("signtypes");
			var that = this;
			var head = oHeaderModel.getData();
			//	var url = "/CPI-WD2PD-Deep/templates/template/detail";
			var url = "/CPI-WD2PD_Dest/di/templates/template/detail";
			var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
			var langu = sCurrentLocale + "-" + sCurrentLocale;
			url = url + "?Template-Id=" + temp.id + "&Template-Version=" + temp.active_version + "&Template-Language=" + langu;
			// var entorno = 'DEV';
			// if (entorno == 'DEV') {
			// 	var cuscode = "C000000001";
			// 	var cusclientid = "15ff0365-5b0c-420e-bb14-bcf28b458374";
			// 	var cusscope = "cf0f8bd6-4d5c-4ea5-827d-22898796ce68";
			// }
			// if (entorno == 'TEST') {
			// 	var cuscode = "T000000001";
			// 	var cusclientid = "e4f496b6-4c9b-4d03-9665-86d13349b046";
			// 	var cusscope = "f0adfc99-7fea-42d7-9439-46a4c9de4742";
			// }
			if (this.getOwnerComponent().settings) {
				//this.settings = await this.getSubscriptionSettings();
				var sendPage = false;
				if (resultsPers.pages.results.length == 0) {
					sendPage = true;
				}
				var cuscode = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Code");
				var cusclientid = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Client_Id");
				var cusscope = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Scope");
				jQuery.ajax({
					url: url,
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Customer-Code', cuscode.value);
						xhr.setRequestHeader('Customer-Client_Id', cusclientid.value);
						xhr.setRequestHeader('Customer-Scope', cusscope.value);
						xhr.setRequestHeader('Template-Return-Preview', sendPage);
					},
					type: "GET",
					dataType: "json",
					success: function (results) {
						oDocTypesModel.setData(results.employee_doctypes_assigned);
						oDocTypesModel.refresh();
						if (resultsPers.sign_cfg) {
							var signData = JSON.parse(resultsPers.sign_cfg.json_cfg);
							var signtypefound = results.signature_types.find(stype => stype.id === signData.signature_type);
							if (!signtypefound) {
								var newsigntype = {
									id: "",
									title: "",
									backend_code: "",
									delegation: false
								}
								results.signature_types.unshift(newsigntype);
							}
							//		var arrayValues = Object.entries(sign_conf);
						}
						oSignTypesModel.setData(results.signature_types);
						oSignTypesModel.refresh();
						var DTData = results.employee_doctypes_assigned;
						var metadata = [];
						if (Array.isArray(DTData)) {
							var dt_name = DTData.find(dt => dt.id === resultsPers.doc_type_id);
							if (dt_name) {
								head.doc_type_text = dt_name.label;
								oHeaderModel.setData(head);
								oHeaderModel.refresh();
								//	for (var i = 0; i < DTData.length; i++) {
								if (dt_name.metadata && Array.isArray(dt_name.metadata)) {
									for (var j = 0; j < dt_name.metadata.length; j++) {
										dt_name.metadata[j].dtype_id = dt_name.id;
										metadata.push(dt_name.metadata[j]);
									}
								}
							}
						}
						results.metadata = metadata;
						oDocTypesModel.refresh();
						if (sendPage) {
							if (results.pages_preview) {
								for (var i = 0; i < results.pages_preview.length; i++) {
									results.pages_preview[i].base64 = "data:image/png;base64," + results.pages_preview[i].base64;
								}
							} else {
								results.pages_preview = [];
							}
						} else {
							results.pages_preview = resultsPers.pages.results;
							results.pages_preview.sort(function (a, b) {
								return a.page - b.page
							});
							if (results.pages_preview) {
								for (var i = 0; i < results.pages_preview.length; i++) {
									results.pages_preview[i].base64 = results.pages_preview[i].content;
									delete results.pages_preview[i].content;
									//		//var particiones = results.pages_preview[i].base64.match(/.{1,5000}/g);
								}
							} else {
								results.pages_preview = [];
							}
						}

						if (resultsPers.mappings) {
							for (var j = 0; j < results.variables.length; j++) {
								var variablePers = resultsPers.mappings.find(mapping => mapping.variable === results.variables[j].slug);
								if (variablePers) {
									results.variables[j].source = variablePers.source;
									results.variables[j].path = variablePers.mapping;
									if (results.variables[j].path === "") {
										results.variables[j].map = "";
									} else {
										results.variables[j].map = "X";
									}
									//	results.variables[j].uuid = variablePers.uuid;
								} else {
									results.variables[j].path = "";
									results.variables[j].map = "";
									results.variables[j].source = "";
								}
							}
						}
						if (resultsPers.metadata) {
							for (var j = 0; j < results.metadata.length; j++) {
								var metadataPers = resultsPers.metadata.find(meta => meta.variable === results.metadata[j].code);
								if (metadataPers) {
									results.metadata[j].source = metadataPers.source;
									results.metadata[j].path = metadataPers.mapping;
									if (results.metadata[j].path === "") {
										results.metadata[j].map = "";
									} else {
										results.metadata[j].map = "X";
									}
									//	results.variables[j].uuid = variablePers.uuid;
								} else {
									results.metadata[j].path = "";
									results.metadata[j].map = "";
									results.metadata[j].source = "";
								}
							}
						}
						results.id = temp.id;
						results.description = temp.description;
						results.title = temp.title;
						results.updated_at = temp.updated_at;
						results.deprecated = temp.deprecated;
						results.base64 = "";
						oDataModel.setData(results);
						oDataModel.refresh();
						oViewModel.setProperty("/busy", false);
						var scount = results.variables.length;
						that.getView().byId("tabMap").setCount(scount);
						if (mapCop === "X") {
							that.deleteOldMappingsCreateMappings(uuidTemp, "X");
						}
						if (metaCop === "X") {
							that.deleteOldMappingsCreateMappingsMeta(uuidTemp, "X");
						}
						if (that.byId("tablemeta").getBusy()) {
							that.byId("tablemeta").setBusy(false);
						}
						if (sendPage) {
							that.createPagesBatch(resultsPers.uuid);
						}

					},
					error: function (e) {
						oViewModel.setProperty("/busy", false);
					}
				});
			}

		},

		openValues: function (oEvent) {
			var property = oEvent.getSource().getParent().getBindingContext("attributes").getPath() + "/name";
			var attribute_name = this.getView().getModel("attributes").getProperty(property);
			var property2 = oEvent.getSource().getParent().getBindingContext("attributes").getPath() + "/uuid";
			this.selectedAttr = this.getView().getModel("attributes").getProperty(property2);
			var oFilterModel = this.getModel("filters");
			var oFilter1 = new sap.ui.model.Filter("attr_uuid", sap.ui.model.FilterOperator.EQ, this.selectedAttr);
			var filtersData = oFilterModel.getData();
			if (!this.byId("manageValues")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.manageValues",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					this.byId("tableFilHeader").setText(attribute_name);
					this.byId("tablefil").getBinding("items").filter([oFilter1]);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("tablefil").getBinding("items").filter([oFilter1]);
				this.byId("tableFilHeader").setText(attribute_name);
				this.byId("manageValues").open();
			}
		},

		addSigner: function (oEvent) {
			var oSignerModel = this.getModel("signer");
			var signerData = oSignerModel.getData();
			signerData = {
				type: "organization"
			};
			oSignerModel.setData(signerData);
			oSignerModel.refresh();
			if (!this.byId("newSigner")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.newSigner",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				//	var checkMapModel = this.getModel("checkMap");
				//	checkMapModel.setData([]);
				// this.byId("CheckEmployee").setValue("");
				// this.byId("CheckEmployee").setValueState("None");
				this.byId("newSigner").open();
			}
		},

		displaySigner: function (oEvent) {
			var oSignerModel = this.getModel("signer");
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("signature").getPath();
			var signatModel = this.getView().getModel("signature");
			var signer = signatModel.getProperty(sPath);
			oSignerModel.setData(signer);
			oSignerModel.refresh();

			if (!this.byId("dispSigner")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.dispSigner",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					var item = this.byId("Signature_Type_Dis").getItemByKey(signer.type);
					var params = {
						selectedItem: item
					};
					this.byId("Signature_Type_Dis").fireChange(params);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				//	var checkMapModel = this.getModel("checkMap");
				//	checkMapModel.setData([]);
				// this.byId("CheckEmployee").setValue("");
				// this.byId("CheckEmployee").setValueState("None");
				var item = this.byId("Signature_Type_Dis").getItemByKey(signer.type);
				var params = {
					selectedItem: item
				};
				this.byId("Signature_Type_Dis").fireChange(params);
				this.byId("dispSigner").open();
			}
		},

		editSigner: function (oEvent) {
			var oSignerModel = this.getModel("signer");
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("signature").getPath();
			var signatModel = this.getModel("signature");
			var signatData = signatModel.getData();
			//	let signer = signatModel.getProperty(sPath);
			//let signer = signatData.signers[0];
			let signer = Object.assign({}, signatModel.getProperty(sPath));
			oSignerModel.setData(signer);
			oSignerModel.refresh();
			var sPaths = sPath.split('/');
			var indice = parseInt(sPaths[sPaths.length - 1]);
			this.editIndex = indice;

			if (!this.byId("editSigne")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.editSigne",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					var item = this.byId("Signature_Type_Edit").getItemByKey(signer.type);
					var params = {
						selectedItem: item
					};
					this.byId("Signature_Type_Edit").fireChange(params);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				//	var checkMapModel = this.getModel("checkMap");
				//	checkMapModel.setData([]);
				// this.byId("CheckEmployee").setValue("");
				// this.byId("CheckEmployee").setValueState("None");
				var item = this.byId("Signature_Type_Edit").getItemByKey(signer.type);
				var params = {
					selectedItem: item
				};
				this.byId("Signature_Type_Edit").fireChange(params);
				this.byId("editSigne").open();
			}
		},

		onCheckMap: function (oEvent) {
			var checkMapModel = this.getModel("checkMap");
			var ckeckMapData = checkMapModel.getData();
			var oDataModel = this.getModel("template");
			var variables = oDataModel.getData().variables;
			var mappings = [];
			var that = this;
			for (var i = 0; i < variables.length; i++) {
				if (variables[i].path != "") {
					var item = {
						variable: variables[i].slug,
						path: variables[i].path,
						source: variables[i].source,
						error: "C",
						value: ""
					}
					mappings.push(item);
				}
			}
			checkMapModel.setData(mappings);
			checkMapModel.refresh();
			if (!this.byId("checkMap")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.checkMappings",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.setTitle("Check Mappings");
					this.byId("tableChecks").setNoDataText("No Mapping Checks");
					oDialog.open();
				}.bind(this));
			} else {
				//	var checkMapModel = this.getModel("checkMap");
				//	checkMapModel.setData([]);
				this.byId("CheckEmployee").setValue("");
				this.byId("CheckEmployee").setValueState("None");
				this.byId("checkMap").setTitle("Check Mappings");
				this.byId("tableChecks").setNoDataText("No Mapping Checks");
				this.byId("checkMap").open();
			}
		},

		onCheckMapMeta: function (oEvent) {
			var checkMapModel = this.getModel("checkMap");
			var ckeckMapData = checkMapModel.getData();
			var oDataModel = this.getModel("template");
			var metadata = oDataModel.getData().metadata;
			var metadatas = [];
			var that = this;
			for (var i = 0; i < metadata.length; i++) {
				if (metadata[i].path != "") {
					var item = {
						variable: metadata[i].code,
						path: metadata[i].path,
						source: metadata[i].source,
						error: "C",
						value: ""
					}
					metadatas.push(item);
				}
			}
			checkMapModel.setData(metadatas);
			checkMapModel.refresh();
			if (!this.byId("checkMap")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.checkMappings",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					this.byId("tableChecks").setNoDataText("No Metadata Checks");
					oDialog.setTitle("Check Metadata");
					oDialog.open();
				}.bind(this));
			} else {
				//	var checkMapModel = this.getModel("checkMap");
				//	checkMapModel.setData([]);
				this.byId("CheckEmployee").setValue("");
				this.byId("CheckEmployee").setValueState("None");
				this.byId("checkMap").setTitle("Check Metadata");
				this.byId("tableChecks").setNoDataText("No Metadata Checks");
				this.byId("checkMap").open();
			}
		},

		pressPage: function (oEvent) {
			this.byId("cancelBtnCoord").setVisible(false);
			var src = oEvent.getSource().getSrc();
			var page = oEvent.getSource().getParent().getActivePage();
			var splits = page.split('-');
			var indice = parseInt(splits[splits.length - 1]);
			var page = indice + 1;
			//	this.byId("imagePage").setSrc(src);
			this.byId("carouselContainerCoordenates").setVisible(false);
			var num_pages = this.byId("carouselContainerCoordenates").getPages().length;
			if (page == num_pages) {
				//	sap.m.MessageToast.show("Last page");
				page = "";
			}
			this.byId("imagePage").setVisible(true);
			var imag = this.byId("imagePage");
			this.stepCoordenates = 2;
			this.byId("ScrollCoordenates").scrollTo(0, 0);
			this.byId("messageCoord").setText("2. Click in lower left corner field sign.")
			imag.setSrc(src);
			var oSignerModel = this.getModel("signer");
			var signerData = oSignerModel.getData();
			var item = {
				page: page
			};
			signerData.generate_pdf_sign_field = Object.assign({}, item);
			oSignerModel.setData(signerData);
			oSignerModel.refresh();
			//sap.m.MessageToast.show("pagina: " +  page);

		},

		selectCoordenates: function (oEvent) {
			//var src = oEvent.getSource().getSrc();
			//	var id = oEvent.getSource().getId();
			var that = this;

			if (!this.byId("imagen")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.imageSign",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					var that = this;
					var imag = this.byId("imagePage");
					imag.addEventDelegate({
						onAfterRendering: function () {
							imag.$().click(function (e) {
								var step = that.stepCoordenates;
								var oSignerModel = that.getModel("signer");
								var signerData = oSignerModel.getData();
								if (step == 2) {
									var offset = $(this).offset();
									var relativeX = (e.pageX - offset.left);
									var relativeY = (e.pageY - offset.top);
									var llx = Math.round(relativeX);
									var lly = Math.round(this.height - relativeY);
									that.stepCoordenates = 3;
									that.byId("ScrollCoordenates").scrollTo(0, 0);
									that.byId("messageCoord").setText("3. Click in upper right corner field sign.")
									signerData.generate_pdf_sign_field.llx = llx;
									signerData.generate_pdf_sign_field.lly = lly;
									oSignerModel.setData(signerData);
									oSignerModel.refresh();
									//sap.m.MessageToast.show(llx + ':' + lly);

									//alert();
								} else if (step == 3) {
									var offset = $(this).offset();
									var relativeX = (e.pageX - offset.left);
									var relativeY = (e.pageY - offset.top);

									var urx = Math.round(relativeX);
									var ury = Math.round(this.height - relativeY);
									//	sap.m.MessageToast.show(llx + ':' + lly);
									that.stepCoordenates = 1;
									$(".position").val("afaf");
									that.byId("carouselContainerCoordenates").setVisible(true);
									that.byId("imagePage").setVisible(false);
									that.byId("imagePage").setSrc("");
									that.byId("messageCoord").setText("1. Click to select Page to sign.");
									signerData.generate_pdf_sign_field.urx = urx;
									signerData.generate_pdf_sign_field.ury = ury;
									oSignerModel.setData(signerData);
									oSignerModel.refresh();
									var dialog = that.byId("imagen");
									dialog.close();
								}
								//	$(".position").val("afaf");
							});
						}
					});
					//this.byId("ScrollCoordenates").scrollTo(0, 0);
					var mesStrip = this.byId("messageCoord");
					var scroll = this.byId("ScrollCoordenates");
					if (scroll) {
						jQuery.sap.delayedCall(0, null, function () {
							//Scroll to the newly added item
							scroll.scrollToElement(mesStrip);
						});

					}
					//	var imag = this.byId("imagePage");
					//	this.byId("imagePage").setSrc(src);
					oDialog.open();
				}.bind(this));
			} else {
				//	this.byId("imagePage").setSrc(src);
				var paginas = this.byId("carouselContainerCoordenates").getPages();
				this.byId("carouselContainerCoordenates").setActivePage(paginas[0]);
				this.byId("cancelBtnCoord").setVisible(true);
				this.byId("imagen").open();
				//this.byId("ScrollCoordenates").scrollTo(0, 0);
				var mesStrip = this.byId("messageCoord");
				var scroll = this.byId("ScrollCoordenates");
				if (scroll) {
					scroll.scrollToElement(mesStrip);
				}
			}
		},

		cancelImage: function (oEvent) {
			this.byId("carouselContainerCoordenates").setVisible(true);
			this.byId("imagePage").setVisible(false);
			this.byId("imagePage").setSrc("");
			this.stepCoordenates = 1;
			var dialogNewAttr = oEvent.getSource().getParent();
			dialogNewAttr.close();
		},

		// onBeforeRendering: function () {
		// 	var imag = this.byId("imagePage");
		// 	imag.addEventDelegate({
		// 		onAfterRendering: function () {

		// 			imag.$().click(function (e) {
		// 				var offset = $(this).offset();
		// 				var relativeX = (e.pageX - offset.left);
		// 				var relativeY = (e.pageY - offset.top);
		// 				alert(relativeX + ':' + relativeY);
		// 				$(".position").val("afaf");
		// 			});
		// 		}
		// 	});
		// },

		onAddAttr: function (oEvent) {
			if (!this.byId("newAttribute")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.newAttribute",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("NameAttribu").setValue("");
				this.byId("DescAttribu").setValue("");
				this.byId("PathAttribu").setValue("");
				this.byId("NameAttribu").setValueState("None");
				this.byId("DescAttribu").setValueState("None");
				this.byId("PathAttribu").setValueState("None");
				this.byId("newAttribute").open();
			}
		},

		onAddGlobalVar: function (oEvent) {
			var oGVModel = this.getModel("globalVari");
			var GVData = oGVModel.getData();
			var action = "";
			var buttonId = oEvent.getSource().getId();
			if (buttonId.match("addGlobalVar")) {
				action = "New";
				GVData = {
					variable: '',
					mapping_type: 'EXPRE',
					mapping: ''
				};
				this.sourceGVEdit = "";
				oGVModel.setData(GVData);
				oGVModel.refresh();
			} else {
				action = "Edit";
				var oGVarModel = this.getModel("globalVar");
				var sPath = oEvent.getSource().getParent().getParent().getBindingContext("globalVar").getPath();
				var sPathSourc = sPath + "/source";
				var GVarData = oGVarModel.getData();
				this.sourceGVEdit = oGVarModel.getProperty(sPathSourc);
				var globalVariable = Object.assign({}, oGVarModel.getProperty(sPath));
				oGVModel.setData(globalVariable);
				oGVModel.refresh();
			}
			if (!this.byId("globalVariable")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.globalVar",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					if (action == "New") {
						this.byId("Name_GV").setEnabled(true);
						oDialog.setTitle("New Global Variable");
						this.byId("btonAddGV").setVisible(true);
						this.byId("btonEditGV").setVisible(false);
					} else {
						this.byId("Name_GV").setEnabled(false);
						oDialog.setTitle("Edit Global Variable");
						this.byId("btonEditGV").setVisible(true);
						this.byId("btonAddGV").setVisible(false);
					}
					oDialog.open();
				}.bind(this));
			} else {
				// this.byId("NameAttribu").setValue("");
				// this.byId("DescAttribu").setValue("");
				// this.byId("PathAttribu").setValue("");
				// this.byId("NameAttribu").setValueState("None");
				// this.byId("DescAttribu").setValueState("None");
				// this.byId("PathAttribu").setValueState("None");
				if (action == "New") {
					this.byId("Name_GV").setEnabled(true);
					this.byId("globalVariable").setTitle("New Global Variable");
					this.byId("btonAddGV").setVisible(true);
					this.byId("btonEditGV").setVisible(false);
				} else {
					this.byId("Name_GV").setEnabled(false);
					this.byId("globalVariable").setTitle("Edit Global Variable");
					this.byId("btonEditGV").setVisible(true);
					this.byId("btonAddGV").setVisible(false);
				}
				this.byId("globalVariable").open();
			}
		},

		cancelGVar: function (oEvent) {
			var dialogNewGV = oEvent.getSource().getParent();
			dialogNewGV.close();
		},

		execEditGV: function (oEvent) {
			var aInputs = [
					//	oView.byId("BusinessProcess"),
					this.byId("Name_GV"),
					this.byId("Value_GV")
					//	oView.byId("SegButAct")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			// if (this.byId("ProcessType").getSelectedKey() === "I") {
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			var that = this;
			var oGlobalVariModel = this.getModel("globalVari");
			var editData = oGlobalVariModel.getData();
			var uuid_GV = editData.uuid;
			var text = "Are you sure to edit this global variable?";
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = "/Di_Template_Mappings(guid'" + uuid_GV + "')";
			var name = this.byId("Name_GV").getValue();
			var path = this.byId("Value_GV").getValue();
			var type = this.byId("Type_GV").getSelectedKey();
			var sourceGV = null;
			if (type === "XPATH") {
				sourceGV = this.byId("Source_GV").getValue();
			}
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var data = {
				variable: name,
				mapping_object: "GLOBAL_VAR",
				mapping_type: type,
				template_uuid: uuidtemp,
				source: sourceGV,
				mapping: path
			};
			var oModel = that.getOwnerComponent().getModel();
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oModel.update(sPath, data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								that.refreshGlobalVar(uuidtemp);
								that.byId("globalVariable").close();
								sap.m.MessageToast.show("Global Variable updated!!");
							},
							error: function (oError) {
								sap.m.MessageToast.show("Error");
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();

		},

		addNewGV: function (oEvent) {
			var oGlobalVarModel = this.getModel("globalVar");
			var oGlobalVarData = oGlobalVarModel.getData();
			var aInputs = [
					//	oView.byId("BusinessProcess"),
					this.byId("Name_GV"),
					this.byId("Value_GV")
					//	oView.byId("SegButAct")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			// if (this.byId("ProcessType").getSelectedKey() === "I") {
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			var new_variable = aInputs[0].getValue();
			var var_exist = oGlobalVarData.find(GV => GV.variable === new_variable);
			if (var_exist) {
				sap.m.MessageBox.alert("A global variable with that name already exists.");
				return;
			}
			var letterNumber = /^[0-9a-zA-Z-_]+$/;
			if (new_variable.match(letterNumber)) {

			} else {
				sap.m.MessageBox.alert("Only can use alphanumeric characters and _");
				return;
			}

			var that = this;
			var name = this.byId("Name_GV").getValue();
			var path = this.byId("Value_GV").getValue();
			var type = this.byId("Type_GV").getSelectedKey();
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sourceGV = null;
			if (type === "XPATH") {
				sourceGV = this.byId("Source_GV").getValue();
			}
			var data = {
				variable: name,
				mapping_object: "GLOBAL_VAR",
				mapping_type: type,
				template_uuid: uuidtemp,
				source: sourceGV,
				mapping: path
			};
			var oModel = that.getOwnerComponent().getModel();
			var text = "Are you sure to create a new global variable?";
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oModel.create("/Di_Template_Mappings", data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								that.refreshGlobalVar(uuidtemp);
								that.byId("globalVariable").close();
								sap.m.MessageToast.show("Global Variable created!!");
							},
							error: function (oError) {
								sap.m.MessageToast.show("Error");
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();

		},

		createNewAttr: function (oEvent) {
			var aInputs = [
					//	oView.byId("BusinessProcess"),
					this.byId("NameAttribu"),
					this.byId("DescAttribu"),
					this.byId("PathAttribu")
					//	oView.byId("SegButAct")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			// if (this.byId("ProcessType").getSelectedKey() === "I") {
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			var that = this;
			var name = this.byId("NameAttribu").getValue();
			var description = this.byId("DescAttribu").getValue();
			var path = this.byId("PathAttribu").getValue();
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var data = {
				name: name,
				description: description,
				template_uuid: uuidtemp,
				sign: "I",
				xpath: path
			};
			var oModel = that.getOwnerComponent().getModel();
			var text = "Are you sure to create a new attribute?";
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oModel.create("/Di_Template_Worker_Attr", data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								that.refreshAttribFilters(uuidtemp);
								that.byId("newAttribute").close();
								sap.m.MessageToast.show("Attribute created!!");
							},
							error: function (oError) {
								sap.m.MessageToast.show("Error");
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();

		},

		closeDisplaySigner: function (oEvent) {
			var dialogDisplaySigner = oEvent.getSource().getParent();
			dialogDisplaySigner.close();
		},

		cancelNewSigner: function (oEvent) {
			var fields = [
				this.byId("Reg_Reference"),
				this.byId("Tech_Id"),
				this.byId("Email_address"),
				this.byId("Phone_number"),
				this.byId("First_name"),
				this.byId("Last_name"),
				this.byId("Language_Sign"),
				this.byId("Sign_Order"),
				this.byId("Pdf_Sign_Field")
			];
			fields.forEach(function (field) {
				field.setValueState("None");
			});
			var dialogNewSigner = oEvent.getSource().getParent();
			dialogNewSigner.close();
		},

		cancelEditSigner: function (oEvent) {
			var fields = [
				this.byId("Reg_Reference_Edit"),
				this.byId("Tech_Id_Edit"),
				this.byId("Email_address_Edit"),
				this.byId("Phone_number_Edit"),
				this.byId("First_name_Edit"),
				this.byId("Last_name_Edit"),
				this.byId("Language_Sign_Edit"),
				this.byId("Sign_Order_Edit"),
				this.byId("Pdf_Sign_Field_Edit")
			];
			fields.forEach(function (field) {
				field.setValueState("None");
			});
			var dialogEditSigner = oEvent.getSource().getParent();
			dialogEditSigner.close();
		},

		cancelNewAttr: function (oEvent) {
			var dialogNewAttr = oEvent.getSource().getParent();
			dialogNewAttr.close();
		},

		cancelEditAttr: function (oEvent) {
			var dialogEditAttr = oEvent.getSource().getParent();
			dialogEditAttr.close();
		},

		cancelCheckMap: function (oEvent) {
			var dialogcheckMap = oEvent.getSource().getParent();
			dialogcheckMap.close();
		},

		refreshGlobalVar: function (temp_uuid) {
			var oGlobalVarModel = this.getModel("globalVar");
			var sPath = "/Di_Template";
			var sPath1 = sPath + "(guid'" + temp_uuid + "')";
			var oModel = this.getOwnerComponent().getModel();
			oModel.read(sPath1, {
				urlParameters: {
					"$expand": "mappings"
				},
				success: function (oData2, oResponse2) {
					var results2 = oData2;
					var g_variables = [];
					for (var j = 0; j < results2.mappings.results.length; j++) {
						if (results2.mappings.results[j].mapping_object == "GLOBAL_VAR") {
							g_variables.push(results2.mappings.results[j]);
						}
					}
					oGlobalVarModel.setData(g_variables);
					oGlobalVarModel.refresh();
				},
				error: function (oError) {
					//	oViewModel.setProperty("/busy", false);
				}
			});
		},

		refreshAttribFilters: function (temp_uuid) {
			var oFilterModel = this.getModel("filters"),
				oAttrModel = this.getModel("attributes");
			var sPath = "/Di_Template";
			var sPath1 = sPath + "(guid'" + temp_uuid + "')";
			var oModel = this.getOwnerComponent().getModel()
			var that = this;
			that.oldFilters = [];
			oModel.read(sPath1, {
				urlParameters: {
					"$expand": "attributes/values_attr"
				},
				success: function (oData2, oResponse2) {
					var results2 = oData2;
					var attributes = results2.attributes.results;
					var atrData = [];
					var filData = [];
					if (attributes) {
						for (var j = 0; j < attributes.length; j++) {
							var attr = {
								uuid: attributes[j].uuid,
								name: attributes[j].name,
								description: attributes[j].description,
								path: attributes[j].xpath,
								sign: attributes[j].sign
							};
							atrData.push(attr);
							for (var l = 0; l < attributes[j].values_attr.results.length; l++) {
								var filter = {
									uuid: attributes[j].values_attr.results[l].uuid,
									attr_uuid: attributes[j].uuid,
									name: attributes[j].name,
									description: attributes[j].description,
									path: attributes[j].xpath,
									value: attributes[j].values_attr.results[l].value
								};
								filData.push(filter);
								var oldValues = Object.assign({}, filter);
								that.oldFilters.push(oldValues);
							}
						}
					}
					//	that.oldFilters = Array.from(filData);
					//	var filData2 = Array.from(filData);
					//	var oldValues = Object.assign({}, filData);
					//	var oldVal = Object.values(oldValues);
					//	that.oldFilters = [...oldVal];
					//	that.oldFilters = jQuery.extend({}, oldVal);
					//that.oldFilters = Object.assign({}, filData);
					//that.oldFilters = [...filData];
					oFilterModel.setData(filData);
					oFilterModel.refresh();
					oAttrModel.setData(atrData);
					oAttrModel.refresh();
				},
				error: function (oError) {
					//	oViewModel.setProperty("/busy", false);
				}
			});
		},

		initModels: function (oEvent) {
			this.getView().getModel("template").setData();
			this.getView().getModel("template").refresh();
			this.getView().getModel("header").setData();
			this.getView().getModel("header").refresh();
			this.getView().getModel("doctypes").setData();
			this.getView().getModel("doctypes").refresh();
			this.getView().getModel("planning").setData();
			this.getView().getModel("planning").refresh();
			this.getView().getModel("filters").setData();
			this.getView().getModel("filters").refresh();
			this.getView().getModel("attributes").setData();
			this.getView().getModel("attributes").refresh();
		},

		onAddFilter: function (oEvent) {
			var itemsModel = this.getModel("filters");
			var dataFil = itemsModel.getData();
			var filter = {
				uuid: "",
				attr_uuid: this.selectedAttr,
				value: ""
			};
			dataFil.push(filter);
			itemsModel.setData(dataFil);
			itemsModel.refresh();
		},

		arraysEquals: function (array1, array2) {
			// if the other array is a falsy value, return
			if (!array2)
				return false;

			// compare lengths - can save a lot of time 
			if (array1.length != array2.length)
				return false;

			for (var i = 0, l = array1.length; i < l; i++) {
				// Check if we have nested arrays
				if (array1[i] instanceof Array && array2[i] instanceof Array) {
					// recurse into the nested arrays
					if (!array1[i].equals(array2[i]))
						return false;
				} else if (array1[i].value !== array2[i].value) {
					// Warning - two different object instances will never be equal: {x:20} != {x:20}
					return false;
				}
			}
			return true;
		},

		closeManageAttr: function (oEvent) {
			var oFilterModel = this.getModel("filters");
			var filtersData = oFilterModel.getData();
			//	var arrayOld = Object.values(this.oldFilters);
			var iguales = this.arraysEquals(this.oldFilters, filtersData);
			var dialogManage = oEvent.getSource().getParent();
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var text = "You will lose unsaved values, do you want to continue?";
			var oViewModel = this.getModel("objectView");
			var that = this;
			var head = {};
			if (!iguales) {
				var dialog = new sap.m.Dialog({
					title: 'Confirmation',
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: 'Yes',
						press: function () {
							that.refreshAttribFilters(uuidtemp);
							dialog.close();
							dialogManage.close();
						}
					}),
					endButton: new sap.m.Button({
						text: 'No',
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
			} else {
				that.refreshAttribFilters(uuidtemp);
				dialogManage.close();
			}

		},

		cancelNewFilter: function (oEvent) {
			var dialogNewFilter = oEvent.getSource().getParent();
			dialogNewFilter.close();
		},

		editAttr: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("attributes").getPath();
			var itemsModel = this.getView().getModel("attributes");
			var editAttrModel = this.getModel("editAttr");
			var oModel = this.getView().getModel();
			var sPath2 = sPath + "/uuid";
			var uuid = itemsModel.getProperty(sPath2);
			sPath2 = sPath + "/description";
			var description = itemsModel.getProperty(sPath2);
			sPath2 = sPath + "/name";
			var name = itemsModel.getProperty(sPath2);
			sPath2 = sPath + "/path";
			var path = itemsModel.getProperty(sPath2);
			var dataEdit = {
				uuid: uuid,
				name: name,
				description: description,
				path: path
			};
			editAttrModel.setData(dataEdit);
			editAttrModel.refresh();
			if (!this.byId("editAttribute")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.editAttribute",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("editAttribute").open();
				this.byId("NameAttribuEdit").setValueState("None");
				this.byId("DescAttribuEdit").setValueState("None");
				this.byId("PathAttribuEdit").setValueState("None");
			}
		},

		saveEditAttr: function (oEvent) {
			var aInputs = [
					//	oView.byId("BusinessProcess"),
					this.byId("NameAttribuEdit"),
					this.byId("DescAttribuEdit"),
					this.byId("PathAttribuEdit")
					//	oView.byId("SegButAct")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			// if (this.byId("ProcessType").getSelectedKey() === "I") {
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}

			var that = this;
			var editAttrModel = this.getModel("editAttr");
			var editData = editAttrModel.getData();
			var oModel = this.getView().getModel();
			var uuid_attr = editData.uuid;
			var description = editData.description;
			var name = editData.name;
			var path = editData.path;
			var dataEdit = {
				name: name,
				description: description,
				xpath: path
			};
			var oModel = that.getOwnerComponent().getModel();
			var text = "Are you sure to edit this attribute?";
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = "/Di_Template_Worker_Attr(guid'" + uuid_attr + "')";
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oModel.update(sPath, dataEdit, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								that.refreshAttribFilters(uuidtemp);
								that.byId("editAttribute").close();
								sap.m.MessageToast.show("Attribute updated!!");
							},
							error: function (oError) {
								sap.m.MessageToast.show("Error");
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		editFil: function (oEvent) {
			oEvent.getSource().getParent().getParent().getCells()[0].setEnabled(true);
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("filters").getPath();
			var itemsModel = this.getModel("filters");
			// var editFilModel = this.getModel("editFilter");
			// var oModel = this.getView().getModel();
			var sPath2 = sPath + "/uuid";
			var uuid = itemsModel.getProperty(sPath2);
			sPath2 = sPath + "/name";
			var name = itemsModel.getProperty(sPath2);
			sPath2 = sPath + "/value";
			var value = itemsModel.getProperty(sPath2);
			var dataEdit = {
				uuid: uuid,
				name: name,
				value: value
			};
			// editAttrModel.setData(dataEdit);
			// editAttrModel.refresh();
			// if (!this.byId("editAttribute")) {
			// 	Fragment.load({
			// 		id: this.getView().getId(),
			// 		name: "shapein.TemplatesConfiguration.view.fragments.editAttribute",
			// 		controller: this
			// 	}).then(function (oDialog) {
			// 		// connect dialog to the root view of this component (models, lifecycle)
			// 		this.getView().addDependent(oDialog);
			// 		oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			// 		oDialog.open();
			// 	}.bind(this));
			// } else {
			// 	this.byId("editAttribute").open();
			// }
		},

		deleteAttr: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("attributes").getPath();
			var itemsModel = this.getView().getModel("attributes");
			var oModel = this.getView().getModel();
			var sPath2 = sPath + "/uuid";
			var uuid = itemsModel.getProperty(sPath2);
			var sPath1 = "/Di_Template_Worker_Attr(guid'" + uuid + "')";
			var text = "Are you sure to delete this attribute?";
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oModel.remove(sPath1, {
							success: function (oData, response) {
								//var but = oEvent.getSource();
								that.refreshAttribFilters(uuidtemp);
								sap.m.MessageToast.show("Attribute deleted succesfully.");
							},
							error: function (oError) {
								sap.m.MessageToast.show("Error");
							}
						});
						dialog.close();

					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		execCopyTemp: function (oEvent) {
			var dialogCopyTemp = oEvent.getSource().getParent();
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var uuidtocopy = this.byId("selTemplate").getSelectedKey();
			var mapCop = this.byId("copMap").getSelected();
			var metaCop = this.byId("copMeta").getSelected();
			var varCop = this.byId("copVar").getSelected();
			var planCop = this.byId("copPlan").getSelected();
			var planRCop = this.byId("copPlanR").getSelected();
			var signCop = this.byId("copSign").getSelected();
			var attCop = this.byId("copAtt").getSelected();
			var that = this;
			var oViewModel = this.getModel("objectView");
			var oModel = this.getOwnerComponent().getModel();
			var text =
				"Are you sure to copy these Objects in this Template?\n All existing objects from the template will be deleted and replaced by those from the other template.";
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				state: 'Warning',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						//var attr_uuid = String(attr_uuid);
						oModel.callFunction(
							"/copy_template_config", {
								method: "GET",
								urlParameters: {
									uuid_new: uuidtemp,
									uuid_to_copy: uuidtocopy,
									mappings: mapCop,
									metadata: metaCop,
									variables: varCop,
									planning: planCop,
									planning_rep: planRCop,
									sign_conf: signCop,
									worker_attr: attCop
								},
								success: function (oData, response) {
									if (mapCop && metaCop) {
										that.refreshObjectsTemplate(uuidtemp, "X", "X");
									} else if (mapCop && !metaCop) {
										that.refreshObjectsTemplate(uuidtemp, "X", "");
									} else if (!mapCop && metaCop) {
										that.refreshObjectsTemplate(uuidtemp, "", "X");
									} else {
										that.refreshObjectsTemplate(uuidtemp, "", "");
									}
									dialogCopyTemp.close();
									oViewModel.setProperty("/busy", false);
									sap.m.MessageToast.show("Objects copied successfully");
								},
								error: function (oError) {
									dialogCopyTemp.close();
									oViewModel.setProperty("/busy", false);
									sap.m.MessageToast.show("Error");
								}
							});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();

		},

		deletePlanningRep: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var oPlanModelRep = this.getModel("planningRep");
			var that = this;
			var oViewModel = this.getModel("objectView");
			var oModel = this.getOwnerComponent().getModel();
			var text = "Are you sure to delete this Reprocessing Planning?";
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						//var attr_uuid = String(attr_uuid);
						oModel.callFunction(
							"/delete_planning_repro", {
								method: "GET",
								urlParameters: {
									uuid: uuidtemp
								},
								success: function (oData, response) {
									that.exist_plan_Rep = "";
									var datanewPlan = {
										execute: true,
										begda: "2020-01-01",
										endda: "9999-12-31",
										periodicity_type: "W",
										ontime: false,
										periodicity_values: "2-4-6",
										time_frecuency: "1m",
										//	time_measure: "m",
										time_start: "00:00:00",
										time_end: "23:59:00",
										time_zone: "UTC"
									};
									var planning_rep = {
										comments: "",
										enable: "U"
									};
									planning_rep.plan_d = datanewPlan;
									planning_rep.adata = [];
									oPlanModelRep.setData(planning_rep);
									oPlanModelRep.refresh();
									oViewModel.setProperty("/busy", false);
									sap.m.MessageToast.show("Reprocessing Planning deleted!");
								},
								error: function (oError) {
									oViewModel.setProperty("/busy", false);
									sap.m.MessageToast.show("Error");
								}
							});
						dialog.close();

					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		onCopyConfig: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidTemp = oHeaderModel.getData().uuid;
			if (!this.byId("copyConfigTemp")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.copyTemplate",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					var items = this.byId("selTemplate").getItems();
					for (var i = 0; i < items.length; i++) {
						if (items[i].getKey() == uuidTemp) {
							items[i].setEnabled(false);
						} else {
							items[i].setEnabled(true);
						}
					}
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("copyConfigTemp").open();
				this.byId("copPlan").setSelected(false);
				this.byId("copPlanR").setSelected(false);
				this.byId("copMap").setSelected(false);
				this.byId("copMeta").setSelected(false);
				this.byId("copVar").setSelected(false);
				this.byId("copAtt").setSelected(false);
				this.byId("copSign").setSelected(false);
				var items = this.byId("selTemplate").getItems();
				for (var i = 0; i < items.length; i++) {
					if (items[i].getKey() == uuidTemp) {
						items[i].setEnabled(false);
					} else {
						items[i].setEnabled(true);
					}
				}
			}
		},

		cancelCopyTemp: function (oEvent) {
			var dialogCopyTemp = oEvent.getSource().getParent();
			dialogCopyTemp.close();
		},

		deleteGlobalVar: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("globalVar").getPath();
			var itemsModel = this.getView().getModel("globalVar");
			var oModel = this.getView().getModel();
			var sPath2 = sPath + "/uuid";
			var uuid = itemsModel.getProperty(sPath2);
			var sPath1 = "/Di_Template_Mappings(guid'" + uuid + "')";
			var text = "Are you sure to delete this global variable?";
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oModel.remove(sPath1, {
							success: function (oData, response) {
								//var but = oEvent.getSource();
								that.refreshGlobalVar(uuidtemp);
								sap.m.MessageToast.show("Global Variable deleted succesfully.");
							},
							error: function (oError) {
								sap.m.MessageToast.show("Error");
							}
						});
						dialog.close();

					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		deleteSigner: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("signature").getPath();
			var sPaths = sPath.split('/');
			var indice = parseInt(sPaths[sPaths.length - 1]);
			var itemsModel = this.getView().getModel("signature");
			var dataSign = itemsModel.getData();
			var text = "Are you sure to delete this signer?";
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						// oModel.remove(sPath1, {
						// 	success: function (oData, response) {
						// 		//var but = oEvent.getSource();
						// 		that.refreshAttribFilters(uuidtemp);
						// 		sap.m.MessageToast.show("Attribute deleted succesfully.");
						// 	},
						// 	error: function (oError) {
						// 		sap.m.MessageToast.show("Error");
						// 	}
						// });
						dataSign.signers.splice(indice, 1);
						itemsModel.setData(dataSign);
						itemsModel.refresh();
						sap.m.MessageToast.show("Signer deleted succesfully.");
						dialog.close();

					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		configNewTemp: function (oEvent) {
			// load asynchronous XML fragment
			if (!this.byId("newTemp")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.newTemplateConfig",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("newTemp").open();
			}
		},

		onSaveValues: function (oEvent) {
			var text = "Are you sure you want to save these values?";
			var oViewModel = this.getModel("objectView");
			var that = this;
			var head = {};
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oViewModel.setProperty("/busy", true);
						var attr_uuid = that.selectedAttr;
						that.deleteOldValuesCreateValues(attr_uuid);
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		saveSettingsSign: function () {
			var oSignTypesModel = this.getModel("signtypes");
			var singTypesData = oSignTypesModel.getData();
			var oSignatureModel = this.getModel("signature");
			var signData = oSignatureModel.getData();
			var signers = signData.signers;
			var typeSign = this.getView().byId("SignType").getSelectedKey();
			var oView = this.getView(),
				aInputs = [
					//oView.byId("SignType"),
					oView.byId("SignTitle"),
					oView.byId("SignReason"),
					oView.byId("SignLocation"),
					oView.byId("ExpDate")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			if (oView.byId("SignType").getSelectedKey() === "") {
				oView.byId("SignType").setValueState("Error");
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			} else {
				oView.byId("SignType").setValueState("None");
			}

			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			if (signers.length < 1) {
				sap.m.MessageBox.alert("You have not entered any signer.");
				return;
			}
			var typeSignData = singTypesData.find(styp => styp.id === typeSign);
			var signerOrg = "";
			for (var i = 0; i < signers.length; i++) {
				if (signers[i].type == "organization") {
					if (signerOrg == "X") {
						var texto = "There can only be one signer of type 'organization'."
						sap.m.MessageBox.alert(texto);
						return;
					}
					signerOrg = "X";
				}
				if (typeSignData) {
					if (typeSignData.backend_code == "docusign_protect_and_sign") { //OPENTRUST
						if (!signers[i].generate_pdf_sign_field) {
							var texto = "Signer with 'Sign Field' " + signers[i].pdf_sign_field +
								" does not have the coordinates informed. Please edit it."
							sap.m.MessageBox.alert(texto);
							return;
						}
						if (signers[i].role_name) {
							delete signers[i].role_name;
						}
					} else if (typeSignData.backend_code == "docusign") { //DOCUSIGN
						if (!signers[i].role_name) {
							//	var texto = "Signer with 'Sign Field' " + signers[i].pdf_sign_field + " does not have the role informed. Please edit it."
							//	sap.m.MessageBox.alert(texto);
							//	return;
						}
						if (signers[i].generate_pdf_sign_field) {
							delete signers[i].generate_pdf_sign_field;
						}
					}
				}
			}
			if (typeSignData) {
				if (typeSignData.delegation && signerOrg == "") {
					var texto = "An 'organization' type signatory must be present in the signers."
					sap.m.MessageBox.alert(texto);
					return;

				}
			}
			var oSignModel = this.getModel("signature");
			var uuidconfsign = oSignModel.getData().uuid;
			var text = "Are you sure you want to save these signature settings?";
			var oViewModel = this.getModel("objectView");
			var that = this;
			var head = {};
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oViewModel.setProperty("/busy", true);
						if (uuidconfsign && uuidconfsign != "") {
							that.deleteOldConfSignature(uuidconfsign);
						} else {
							that.createNewConfSignature();
						}
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		deleteOldConfSignature: function (signconfuuid) {
			var that = this;
			var oViewModel = this.getModel("objectView");
			var oModel = this.getOwnerComponent().getModel();
			//var attr_uuid = String(attr_uuid);
			oModel.callFunction(
				"/delete_conf_signature", {
					method: "GET",
					urlParameters: {
						uuid: signconfuuid
					},
					success: function (oData, response) {
						that.createNewConfSignature();
					},
					error: function (oError) {
						oViewModel.setProperty("/busy", false);
					}
				});
		},

		createNewConfSignature: function () {
			var oSignatureModel = this.getModel("signature");
			var signData = oSignatureModel.getData();
			var signers = signData.signers;
			var oViewModel = this.getModel("objectView");
			var oView = this.getView(),
				aInputs = [
					oView.byId("SignType"),
					oView.byId("SignTitle"),
					oView.byId("SignReason"),
					oView.byId("SignLocation"),
					oView.byId("ExpDate"),
					oView.byId("SignMessage"),
				];
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var oModel = this.getOwnerComponent().getModel();
			var data = {
				signature_type: aInputs[0].getSelectedKey(),
				title: aInputs[1].getValue(),
				reason: aInputs[2].getValue(),
				location: aInputs[3].getValue(),
				expiration_date: aInputs[4].getValue(),
				message: aInputs[5].getValue(),
				signers: signers
			};
			var datajson = JSON.stringify(data);
			oViewModel.setProperty("/busy", false);
			var newConfig = {
				template_uuid: uuidtemp,
				api_version: "v1",
				json_cfg: datajson
			};

			oModel.create("/Di_Template_Sign_Cfg", newConfig, {
				headers: {
					"Content-Type": "application/json",
					'Accept': 'application/json'
				},
				success: function (oData, response) {
					//var but = oEvent.getSource();
					var results = oData;
					var signData = JSON.parse(results.json_cfg);
					signData.uuid = results.uuid;
					oSignatureModel.setData(signData);
					oSignatureModel.refresh();
					sap.m.MessageToast.show("Signature Configuration saved succesfully.");

				},
				error: function (oError) {

					//	dialogNewTemp.close();
					sap.m.MessageToast.show("Error");
				}
			});

		},

		selectSMS: function (oEvent) {
			var selNot = this.byId("checkSMSnot").getSelected();
			var selAut = this.byId("checkSMSau").getSelected();
			if (selNot || selAut) {
				this.byId("Phone_number").setRequired(true);
			} else {
				this.byId("Phone_number").setRequired(false);
			}
		},

		selectSMS_Edit: function (oEvent) {
			var selNot = this.byId("checkSMSnot_Edit").getSelected();
			var selAut = this.byId("checkSMSau_Edit").getSelected();
			if (selNot || selAut) {
				this.byId("Phone_number_Edit").setRequired(true);
			} else {
				this.byId("Phone_number_Edit").setRequired(false);
			}
		},

		deleteOldValuesCreateValues: function (attr_uuid) {
			var that = this;
			var oViewModel = this.getModel("objectView");
			var oModel = this.getOwnerComponent().getModel();
			var attr_uuid = String(attr_uuid);
			oModel.callFunction(
				"/delete_attr_values", {
					method: "GET",
					urlParameters: {
						uuid: attr_uuid
					},
					success: function (oData, response) {
						that.createBatchAttrValues(attr_uuid);
					},
					error: function (oError) {
						oViewModel.setProperty("/busy", false);
					}
				});
		},

		deleteFil: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("filters").getPath();
			var itemsModel = this.getView().getModel("filters");
			var dataFil = itemsModel.getData();
			var indice = parseInt(sPath.substr(1));
			var oModel = this.getView().getModel();
			var sPath2 = sPath + "/uuid";
			var uuid = itemsModel.getProperty(sPath2);
			var sPath1 = "/Di_Template_Worker_Attr_Values(guid'" + uuid + "')";
			var text = "Are you sure to delete this value?";
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						if (uuid == "") {
							dataFil.splice(indice, 1);
							itemsModel.setData(dataFil);
							itemsModel.refresh();
						} else {
							oModel.remove(sPath1, {
								success: function (oData, response) {
									//var but = oEvent.getSource();
									that.refreshAttribFilters(uuidtemp);
									sap.m.MessageToast.show("Value deleted succesfully.");
								},
								error: function (oError) {
									sap.m.MessageToast.show("Error");
								}
							});
						}
						dialog.close();

					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		createBatchAttrValues: function (attr_uuid) {
			var oModel = this.getOwnerComponent().getModel();
			var oDataModel = this.getModel("filters");
			var values = oDataModel.getData();
			var sPath = "/Di_Template_Worker_Attr_Values";
			oModel.setDeferredGroups(["createGroupVal"]);
			var that = this;
			for (var i = 0; i < values.length; i++) {
				if (values[i].attr_uuid !== attr_uuid) {
					continue;
				}
				var oData = {};
				oData.attr_uuid = attr_uuid;
				oData.value = values[i].value;
				oModel.create(sPath, oData, {
					groupId: "createGroupVal"
				});
			}
			oModel.submitChanges({
				groupId: "createGroupVal",
				success: that.successCreateBatchVal.bind(that),
				error: that.errorCreateBatchVal.bind(that)
			});
		},

		successCreateBatchVal: function (oData, response) {
			sap.m.MessageToast.show("Values updated succesfully.");
			var oViewModel = this.getModel("objectView");
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			this.refreshAttribFilters(uuidtemp);
			oViewModel.setProperty("/busy", false);
			//	this._onBindingChange();
		},

		errorCreateBatchVal: function (oError) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			sap.m.MessageToast.show("Error");

		},

		onSaveMap: function (oEvent) {
			var text = "Are you sure you want to save these mappings?";
			var oViewModel = this.getModel("objectView");
			var that = this;
			var head = {};
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oViewModel.setProperty("/busy", true);
						var template_uuid = that.byId("template_uuid").getText();
						that.deleteOldMappingsCreateMappings(template_uuid, "");
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		onSaveMeta: function (oEvent) {
			var text = "Are you sure you want to save these metadata mappings?";
			var oViewModel = this.getModel("objectView");
			var that = this;
			var head = {};
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oViewModel.setProperty("/busy", true);
						var template_uuid = that.byId("template_uuid").getText();
						that.deleteOldMappingsCreateMappingsMeta(template_uuid, "");
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		deleteOldMappingsCreateMappings: function (template_uuid, copy) {
			var that = this;
			var oViewModel = this.getModel("objectView");
			var oModel = this.getOwnerComponent().getModel();
			var temp_uuid = String(template_uuid);
			oModel.callFunction(
				"/delete_mappings", {
					method: "GET",
					urlParameters: {
						uuid: temp_uuid
					},
					success: function (oData, response) {
						that.createBatchMappings(template_uuid, copy);
					},
					error: function (oError) {
						if (copy == "") {
							oViewModel.setProperty("/busy", false);
						}

					}
				});
		},

		deleteOldMappingsCreateMappingsMeta: function (template_uuid, copy) {
			var that = this;
			var oViewModel = this.getModel("objectView");
			var oModel = this.getOwnerComponent().getModel();
			var temp_uuid = String(template_uuid);
			oModel.callFunction(
				"/delete_mappings_meta", {
					method: "GET",
					urlParameters: {
						uuid: temp_uuid
					},
					success: function (oData, response) {
						that.createBatchMappingsMeta(template_uuid, copy);
					},
					error: function (oError) {
						if (copy == "") {
							oViewModel.setProperty("/busy", false);
						}

					}
				});
		},

		createBatchMappings: function (template_uuid, copy) {
			var oModel = this.getOwnerComponent().getModel();
			var oDataModel = this.getModel("template");
			var mappings = oDataModel.getData().variables;
			var sPath = "/Di_Template_Mappings";
			oModel.setDeferredGroups(["createGroup"]);
			//	var template_uuid = this.byId("template_uuid").getText();
			var that = this;
			for (var i = 0; i < mappings.length; i++) {
				var oData = {};
				oData.template_uuid = template_uuid;
				oData.variable = mappings[i].slug;
				if (mappings[i].path == null) {
					mappings[i].path = "";
				}
				oData.mapping = mappings[i].path;
				oData.mapping_object = "TEMPL_MAPP"; //TODO chequear metadatos tb
				oData.mapping_type = "XPATH";
				oData.source = mappings[i].source;
				oData.required = mappings[i].required;
				oData.vartype = mappings[i].type_id;
				oModel.create(sPath, oData, {
					groupId: "createGroup"
				});
			}
			if (copy == "X") {
				oModel.submitChanges({
					groupId: "createGroup",
					success: that.successUpdateBatchMCopy.bind(that),
					error: that.errorUpdateBatchCopy
				});
			} else {
				oModel.submitChanges({
					groupId: "createGroup",
					success: that.successUpdateBatchM.bind(that),
					error: that.errorUpdateBatch
				});
			}
		},

		createBatchMappingsMeta: function (template_uuid, copy) {
			var oModel = this.getOwnerComponent().getModel();
			var oDataModel = this.getModel("template");
			var mappings = oDataModel.getData().metadata;
			var sPath = "/Di_Template_Mappings";
			oModel.setDeferredGroups(["createGroup"]);
			//	var template_uuid = this.byId("template_uuid").getText();
			var that = this;
			for (var i = 0; i < mappings.length; i++) {
				var oData = {};
				oData.template_uuid = template_uuid;
				oData.variable = mappings[i].code;
				if (mappings[i].path == null) {
					mappings[i].path = "";
				}
				oData.mapping = mappings[i].path;
				oData.mapping_object = "DOCID_META"; //TODO chequear metadatos tb
				oData.mapping_type = "XPATH";
				oData.required = mappings[i].required;
				oData.source = mappings[i].source;
				oData.vartype = mappings[i].type_id;
				oModel.create(sPath, oData, {
					groupId: "createGroup"
				});
			}
			if (copy == "X") {
				oModel.submitChanges({
					groupId: "createGroup",
					success: that.successUpdateBatchMCopyMeta.bind(that),
					error: that.errorUpdateBatchCopyMeta
				});
			} else {
				oModel.submitChanges({
					groupId: "createGroup",
					success: that.successUpdateBatchMMeta.bind(that),
					error: that.errorUpdateBatchMeta
				});
			}
		},

		successUpdateBatchMCopy: function (oData, response) {

			//	this._onBindingChange();
		},

		errorUpdateBatchCopy: function (oError) {

			sap.m.MessageToast.show("Error");

		},

		successUpdateBatchM: function (oData, response) {
			sap.m.MessageToast.show("Mappings updated succesfully.");
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			//	this._onBindingChange();
		},

		errorUpdateBatch: function (oError) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			sap.m.MessageToast.show("Error");

		},

		successUpdateBatchMCopyMeta: function (oData, response) {

			//	this._onBindingChange();
		},

		errorUpdateBatchCopyMeta: function (oError) {

			sap.m.MessageToast.show("Error");

		},

		successUpdateBatchMMeta: function (oData, response) {
			sap.m.MessageToast.show("Metadata Mappings updated succesfully.");
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			//	this._onBindingChange();
		},

		errorUpdateBatchMeta: function (oError) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			sap.m.MessageToast.show("Error");

		},

		execNewSigner: function (oEvent) {
			var oSignatureModel = this.getModel("signature");
			var signData = oSignatureModel.getData();
			var oSignTypesModel = this.getModel("signtypes");
			var singTypesData = oSignTypesModel.getData();
			var oSignerModel = this.getModel("signer");
			var signerData = oSignerModel.getData();
			var fields = [
				this.byId("Reg_Reference"),
				this.byId("Tech_Id"),
				this.byId("Email_address"),
				this.byId("Phone_number"),
				this.byId("First_name"),
				this.byId("Last_name"),
				this.byId("Language_Sign"),
				this.byId("Sign_Order"),
				this.byId("Pdf_Sign_Field")
			];
			var fields_req = [];
			var bValidationError = false;
			for (var i = 0; i < fields.length; i++) {
				if (fields[i].getRequired()) {
					fields_req.push(fields[i]);
				} else {
					fields[i].setValueState("None");
				}
			}
			fields_req.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			var typeSign = this.byId("SignType").getSelectedKey();
			var typeSignData = singTypesData.find(styp => styp.id === typeSign);
			if (typeSignData) {
				if (typeSignData.backend_code == "docusign_protect_and_sign") { //OPENTRUST
					//	if (typeSign == "sage-ind") {
					var llx = this.byId("llx").getValue();
					if (llx == "") {
						sap.m.MessageBox.alert("You must select the coordinates of the sign field.");
						return;
					}
				}
			}
			var fields_vis = [];
			var item = {};
			for (var i = 0; i < fields.length; i++) {
				if (fields[i].getVisible()) {
					if (i != 6) {
						if (fields[i].getValue() != "") {
							var path = fields[i].getBinding("value").getPath();
							path = path.substring(1);
							item[path] = fields[i].getValue();
						}
					} else {
						var path = fields[i].getBinding("selectedKey").getPath();
						path = path.substring(1);
						item[path] = fields[i].getSelectedKey();
					}
				}
			}
			var coord_item = {};
			coord_item.page = this.byId("sfpage").getValue();
			coord_item.llx = this.byId("llx").getValue();
			coord_item.lly = this.byId("lly").getValue();
			coord_item.urx = this.byId("upx").getValue();
			coord_item.ury = this.byId("upy").getValue();
			item.generate_pdf_sign_field = Object.assign({}, coord_item);
			var type = this.byId("Signature_Type").getSelectedKey();
			item.type = type;
			var smsnot = this.byId("checkSMSnot").getSelected();
			item.with_sms_notification = smsnot;
			var smsau = this.byId("checkSMSau").getSelected();
			item.with_sms_authentication = smsau;
			var send = this.byId("checkSMSsend").getSelected();
			item.send_signed_document = send;
			signData.signers.push(item);
			oSignatureModel.setData(signData);
			oSignatureModel.refresh();
			var dialogNewSigner = oEvent.getSource().getParent();
			dialogNewSigner.close();

		},

		execEditSigner: function (oEvent) {
			var indice = this.editIndex;
			var oSignatureModel = this.getModel("signature");
			var signData = oSignatureModel.getData();
			var oSignerModel = this.getModel("signer");
			var signerData = oSignerModel.getData();
			var oSignTypesModel = this.getModel("signtypes");
			var singTypesData = oSignTypesModel.getData();
			var fields = [
				this.byId("Reg_Reference_Edit"),
				this.byId("Tech_Id_Edit"),
				this.byId("Email_address_Edit"),
				this.byId("Phone_number_Edit"),
				this.byId("First_name_Edit"),
				this.byId("Last_name_Edit"),
				this.byId("Language_Sign_Edit"),
				this.byId("Sign_Order_Edit"),
				this.byId("Pdf_Sign_Field_Edit")
			];
			var fields_req = [];
			var bValidationError = false;
			for (var i = 0; i < fields.length; i++) {
				if (fields[i].getRequired()) {
					fields_req.push(fields[i]);
				}
			}
			fields_req.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			var typeSign = this.byId("SignType").getSelectedKey();
			var typeSignData = singTypesData.find(styp => styp.id === typeSign);
			if (typeSignData) {
				if (typeSignData.backend_code == "docusign_protect_and_sign") { //OPENTRUST
					//	if (typeSign == "sage-ind") {
					var llx = this.byId("llx_Edit").getValue();
					if (llx == "") {
						sap.m.MessageBox.alert("You must select the coordinates of the sign field.");
						return;
					}
				}
			}
			var fields_vis = [];
			var item = {};
			for (var i = 0; i < fields.length; i++) {
				if (fields[i].getVisible()) {
					if (i != 6) {
						if (fields[i].getValue() != "") {
							var path = fields[i].getBinding("value").getPath();
							path = path.substring(1);
							item[path] = fields[i].getValue();
						}
					} else {
						var path = fields[i].getBinding("selectedKey").getPath();
						path = path.substring(1);
						item[path] = fields[i].getSelectedKey();
					}
				}
			}
			var coord_item = {};
			coord_item.page = this.byId("sfpage_Edit").getValue();
			coord_item.llx = this.byId("llx_Edit").getValue();
			coord_item.lly = this.byId("lly_Edit").getValue();
			coord_item.urx = this.byId("upx_Edit").getValue();
			coord_item.ury = this.byId("upy_Edit").getValue();
			item.generate_pdf_sign_field = Object.assign({}, coord_item);
			var type = this.byId("Signature_Type_Edit").getSelectedKey();
			item.type = type;
			var smsnot = this.byId("checkSMSnot_Edit").getSelected();
			item.with_sms_notification = smsnot;
			var smsau = this.byId("checkSMSau_Edit").getSelected();
			item.with_sms_authentication = smsau;
			var send = this.byId("checkSMSsend_Edit").getSelected();
			item.send_signed_document = send;
			signData.signers[indice] = Object.assign({}, item);
			//signData.signers[indice] = item;
			oSignatureModel.setData(signData);
			oSignatureModel.refresh();
			var dialogNewSigner = oEvent.getSource().getParent();
			dialogNewSigner.close();

		},

		changeExpDate: function (oEvent) {
			var value = parseInt(oEvent.getParameter("value"));
			if ((value > 365 || value < 1) && value != "") {
				oEvent.getSource().setValue(this.oldExpDate);
			} else {
				this.oldExpDate = value;
			}
		},

		execNewTemp: function (oEvent) {
			var oFilterModel = this.getModel("filters"),
				oAttrModel = this.getModel("attributes"),
				oPlanModel = this.getModel("planning"),
				oPlanModelRep = this.getModel("planningRep"),
				oGlobalVarModel = this.getModel("globalVar"),
				oSignatureModel = this.getModel("signature");
			// VALIDACIONES TODO
			var oView = this.getView(),
				aInputs = [
					//oView.byId("BusinessProcess"),
					oView.byId("DocTitle"),
					//	oView.byId("SegButAct")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			// if (this.byId("ProcessType").getSelectedKey() === "I") {
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			var bp = oView.byId("BusinessProcess").getSelectedKey();
			if (bp == "") {
				sap.m.MessageBox.alert("Business Process Type is required.");
				return;
			}
			//var segB = oView.byId("SegButAct").getSelectedKey();
			var active = false;
			//	if (segB == 'A') {
			//		active = true;
			//	}
			var segSig = oView.byId("SegButSig").getSelectedKey();
			var signature = false;
			if (segSig == 'A') {
				signature = true;
			}
			var title = oView.byId("DocTitle").getValue();
			var doctype = oView.byId("Doc_Types").getSelectedKey();
			if (doctype == "") {
				sap.m.MessageBox.alert("Document Type is required.");
				return;
			}
			var text = "Are you sure you want to save this Template Configuration?";
			var that = this;
			var head = {};
			var dialogNewTemp = oEvent.getSource().getParent();
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						var data = {
							template_id: that.template_id,
							template_version: String(that.template_version),
							bpt_id: bp,
							format: that.format,
							updated_at: that.updated_at,
							deprecated: false,
							description: that.description,
							doc_type_id: doctype,
							doc_title: title,
							active: active,
							signature: signature,
							language: that.template_language
						};
						var oModel = that.getOwnerComponent().getModel();
						dialogNewTemp.setBusy(true);
						oModel.create("/Di_Template", data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								//var but = oEvent.getSource();
								var results = oData;
								dialogNewTemp.setBusy(false);
								dialogNewTemp.close();
								head.uuid = results.uuid;
								head.id = results.template_id;
								var temp = {};
								temp.id = head.id;
								temp.active_version = results.template_version;
								results.mappings = [];
								results.metadata = [];
								results.sign_cfg = null;
								head.version = results.template_version;
								head.description = that.description;
								head.active = results.active;
								head.deprecated = results.deprecated;
								if (head.active) {
									that.oldKey = "A";
								} else {
									that.oldKey = "I";
								}
								head.doc_type = results.doc_type_id;
								head.title = results.doc_title;
								head.signature = results.signature;
								head.language = results.language;
								var BPData = that.getOwnerComponent().getModel("BProcess").getData();
								var bp_name = BPData.find(bp => bp.bpt_id === results.bpt_id);
								head.business_process_text = bp_name.name;
								var DTData = that.getOwnerComponent().getModel("doctypes").getData();
								var dt_name = DTData.find(dt => dt.id === results.doc_type_id);
								head.doc_type_text = dt_name.label;
								head.business_process = results.bpt_id;
								that.oldBP = head.business_process;
								that.oldTitle = head.title;
								that.oldDType = head.doc_type;
								var oHeaderModel = that.getModel("header");
								oHeaderModel.setData(head);
								oHeaderModel.refresh();
								//results.mappings = [];
								var atrData = [];
								var filData = [];
								var signData = {};
								signData.uuid = "";
								signData.signers = [];
								that.exist_plan = "";
								that.exist_plan_Rep = "";
								var datanewPlan = {
									execute: true,
									begda: "2020-01-01",
									endda: "9999-12-31",
									periodicity_type: "W",
									ontime: false,
									periodicity_values: "2-4-6",
									time_frecuency: "1m",
									//	time_measure: "m",
									time_start: "00:00:00",
									time_end: "23:59:00",
									time_zone: "UTC"
								};
								var planning = {
									comments: ""
								};
								planning.plan_d = datanewPlan;
								planning.adata = [];
								oSignatureModel.setData(signData);
								var g_var = [];
								oGlobalVarModel.setData(g_var);
								oGlobalVarModel.refresh();
								oSignatureModel.refresh();
								oFilterModel.setData(filData);
								oFilterModel.refresh();
								oAttrModel.setData(atrData);
								oAttrModel.refresh();
								oPlanModel.setData(planning);
								oPlanModel.refresh();
								oPlanModelRep.setData(planning);
								oPlanModelRep.refresh();
								that.call_Template_details(results, temp);
								that.createPagesBatch(head.uuid);
								//that.createDataBatch(oData.uuido, oData.processing_type);
								sap.m.MessageToast.show("Template Configuration created succesfully.");

							},
							error: function (oError) {
								dialogNewTemp.setBusy(false);
								//	dialogNewTemp.close();
								sap.m.MessageToast.show("Error");
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'No',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();

		},

		cancelNewTemp: function (oEvent) {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("overview", true);
			}
			var dialogNewTemp = oEvent.getSource().getParent();
			dialogNewTemp.close();
		},

		onEdit: function () {
			this.showCustomActions(true);
			this.byId("segButton").setEnabled(true);
			//	this.byId("BPdisplay").setVisible(false);
			this.byId("titleDisplay").setVisible(false);
			this.byId("titleChange").setVisible(true);
			this.byId("DTdisplay").setVisible(false);
			//this.byId("labelBP").setVisible(true);
			this.byId("labelDT").setVisible(true);
			//	this.byId("BusinessProcessH").setVisible(true);
			this.byId("DocTypesH").setVisible(true);
			this.oSemanticPage.setHeaderExpanded(true);
			this.oEditAction.setVisible(false);
			//this.oDeleteAction.setVisible(false);
		},

		onSaveBP: function () {
			var oHeaderModel = this.getModel("header");
			var dataHeader = oHeaderModel.getData();
			var uuid = dataHeader.uuid;
			var that = this;
			var path = "/Di_Template";
			var sPath1 = path + "(guid'" + uuid + "')"
			var oModel = this.getOwnerComponent().getModel();
			var bpt_id = this.byId("BusinessProcessH").getSelectedKey();
			var data = {
				bpt_id: bpt_id
			};
			oModel.update(sPath1, data, {
				headers: {
					"Content-Type": "application/json",
					'Accept': 'application/json'
				},
				success: function (oData, response) {
					//var but = oEvent.getSource();
					// planDialog.setBusy(false);
					// planDialog.close();
					//dataHeader.active = oData.active;
					var BPData = that.getOwnerComponent().getModel("BProcess").getData();
					var bp_name = BPData.find(bp => bp.bpt_id === oData.bpt_id);
					dataHeader.business_process_text = bp_name.name;
					oHeaderModel.setData(dataHeader);
					oHeaderModel.refresh();
					sap.m.MessageBox.alert("Business Process successfully saved!");

				},
				error: function (oError) {
					// planDialog.setBusy(false);
					// planDialog.close();
					sap.m.MessageToast.show("Error");

				}
			});

		},

		onSaveConfTemplate: function () {
			var oHeaderModel = this.getModel("header");
			var templateModel = this.getModel("template");
			var tempDataMetadata = templateModel.getData().metadata;
			var dataHeader = oHeaderModel.getData();
			var uuid = dataHeader.uuid;
			var that = this;
			var path = "/Di_Template";
			var sPath1 = path + "(guid'" + uuid + "')"
			var oModel = this.getOwnerComponent().getModel();
			var enabled = false;
			if (this.byId("segButton2").getSelectedKey() == "A") {
				enabled = true;
			}
			var signature = false;
			if (this.byId("segButton3").getSelectedKey() == "A") {
				signature = true;
			}
			var doc_type_id = this.byId("DocTypesH").getSelectedKey();
			var title = this.byId("titleChange").getValue();
			var data = {
				doc_type_id: doc_type_id,
				doc_title: title,
				active: enabled,
				signature: signature
			};
			var delMeta = false;
			for (var l = 0; l < tempDataMetadata.length; l++) {
				if (tempDataMetadata[l].path != "") {
					delMeta = true;
					break;
				}
			}
			if (doc_type_id !== that.oldDocType && delMeta) {
				var text = "If you change the document type, the associated metadata mappings will be deleted. Do you want to continue?";
				//var oViewModel = this.getModel("objectView");
				var dialog = new sap.m.Dialog({
					title: 'Confirmation',
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: 'Yes',
						press: function () {
							that.saveConfTempConf(data, enabled, uuid, signature, "X");
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: 'No',
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
			} else {
				if (doc_type_id !== that.oldDocType) {
					that.saveConfTempConf(data, enabled, uuid, signature, "X");
				} else {
					that.saveConfTempConf(data, enabled, uuid, signature, "");
				}
			}
		},

		saveConfTempConf: function (data, enabled, uuid, signature, changeDocType) {
			var oModel = this.getOwnerComponent().getModel();
			var that = this;
			if (enabled) {
				oModel.callFunction(
					"/can_be_activated", {
						method: "GET",
						urlParameters: {
							uuid: uuid,
							sign: signature
						},
						success: function (oData, response) {
							var result = oData.value;
							if (result == "") {
								that.saveConfigTemplate(data, changeDocType);
							} else {
								var text = "This template cannot be activated. \n\ " + result;
								sap.m.MessageBox.error(text);
							}
						},
						error: function (oError) {
							sap.m.MessageToast.show("Error");
						}
					});

			} else {
				this.saveConfigTemplate(data, changeDocType);
			}
		},

		onSelectIconTabHeader: function (oEvent) {
			var tabSel = oEvent.getParameter("key");
			if (tabSel == "GlobalVariables") {
				this.byId("tableGlobalVar").setVisible(true);
				this.byId("tableMetadata").setVisible(false);
			} else if (tabSel == "Metadata") {
				this.byId("tableGlobalVar").setVisible(false);
				this.byId("tableMetadata").setVisible(true);
			}
		},

		saveConfigTemplate: function (data, changeDocType) {
			var oHeaderModel = this.getModel("header"),
				oSignatureModel = this.getModel("signature");
			var dataHeader = oHeaderModel.getData();
			var uuid = dataHeader.uuid;
			var that = this;
			var path = "/Di_Template";
			var sPath1 = path + "(guid'" + uuid + "')"
			var oModel = this.getOwnerComponent().getModel();
			var oSignModel = this.getModel("signature");
			var uuidconfsign = oSignModel.getData().uuid;
			if (!data.signature && uuidconfsign && uuidconfsign != "") {
				var text = "Saving the template settings will clear the signature settings. Do you want to continue?";
				//var oViewModel = this.getModel("objectView");
				var that = this;
				var head = {};
				var dialog = new sap.m.Dialog({
					title: 'Confirmation',
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: 'Yes',
						press: function () {
							oModel.update(sPath1, data, {
								headers: {
									"Content-Type": "application/json",
									'Accept': 'application/json'
								},
								success: function (oData, response) {
									//var but = oEvent.getSource();
									// planDialog.setBusy(false);
									// planDialog.close();
									dataHeader.active = oData.active;
									dataHeader.signature = oData.signature;
									var DTData = that.getOwnerComponent().getModel("doctypes").getData();
									var dt_name = DTData.find(dt => dt.id === oData.doc_type_id);
									dataHeader.doc_type_text = dt_name.label;
									dataHeader.doc_type = oData.doc_type_id;
									that.oldDocType = oData.doc_type_id;
									oHeaderModel.setData(dataHeader);
									oHeaderModel.refresh();
									var signData = {};
									signData.uuid = "";
									signData.signers = [];
									oSignatureModel.setData(signData);
									oSignatureModel.refresh();
									dialog.close();
									sap.m.MessageBox.alert("Configuration successfully saved!");
									if (changeDocType == "X") {
										that.byId("tablemeta").setBusy(true);
										that.refreshObjectsTemplate(uuid, "");
									}

								},
								error: function (oError) {
									// planDialog.setBusy(false);
									// planDialog.close();
									dialog.close();
									sap.m.MessageToast.show("Error");

								}
							});
						}
					}),
					endButton: new sap.m.Button({
						text: 'No',
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
			} else {
				oModel.update(sPath1, data, {
					headers: {
						"Content-Type": "application/json",
						'Accept': 'application/json'
					},
					success: function (oData, response) {
						//var but = oEvent.getSource();
						// planDialog.setBusy(false);
						// planDialog.close();
						dataHeader.active = oData.active;
						dataHeader.signature = oData.signature;
						var DTData = that.getOwnerComponent().getModel("doctypes").getData();
						var dt_name = DTData.find(dt => dt.id === oData.doc_type_id);
						dataHeader.doc_type_text = dt_name.label;
						dataHeader.doc_type = oData.doc_type_id;
						that.oldDocType = oData.doc_type_id;
						oHeaderModel.setData(dataHeader);
						oHeaderModel.refresh();
						sap.m.MessageBox.alert("Configuration successfully saved!");
						if (changeDocType == "X") {
							that.byId("tablemeta").setBusy(true);
							that.refreshObjectsTemplate(uuid, "");
						}

					},
					error: function (oError) {
						// planDialog.setBusy(false);
						// planDialog.close();
						sap.m.MessageToast.show("Error");

					}
				});
			}
		},

		onUpdatePlanTemplate: function (plan_uuid, proc_type, reproc) {
			var oHeaderModel = this.getModel("header");
			var dataHeader = oHeaderModel.getData();
			var uuid = dataHeader.uuid;
			var that = this;
			var path = "/Di_Template";
			var sPath1 = path + "(guid'" + uuid + "')"
			var oModel = this.getOwnerComponent().getModel();
			if (reproc == "X") {
				var data = {
					planning_rep_uuid: plan_uuid
				};
			} else {
				var data = {
					planning_uuid: plan_uuid
				};
			}
			oModel.update(sPath1, data, {
				headers: {
					"Content-Type": "application/json",
					'Accept': 'application/json'
				},
				success: function (oData, response) {
					if (reproc == "X") {
						var oPlanModel = that.getModel("planningRep");
						var planuuid = oPlanModel.setProperty("/uuid", oData.planning_uuid);
						oPlanModel.refresh();
						that.exist_plan_Rep = "X";
						that.createDataBatch(plan_uuid, proc_type, "X");
					} else {
						var oPlanModel = that.getModel("planning");
						var planuuid = oPlanModel.setProperty("/uuid", oData.planning_uuid);
						oPlanModel.refresh();
						that.exist_plan = "X";
						that.createDataBatch(plan_uuid, proc_type, "");
					}
				},
				error: function (oError) {
					// planDialog.setBusy(false);
					// planDialog.close();
					sap.m.MessageToast.show("Error");

				}
			});

		},

		onCancel: function () {
			this.showCustomActions(false);
			this.byId("segButton").setSelectedKey(this.oldKey);
			//	this.byId("BusinessProcessH").setSelectedKey(this.oldBP);
			this.byId("titleChange").setValue(this.oldTitle);
			this.byId("DocTypesH").setSelectedKey(this.oldDType);
			this.byId("segButton").setEnabled(false);
			//	this.byId("BPdisplay").setVisible(true);
			//	this.byId("labelBP").setVisible(false);
			this.byId("BusinessProcessH").setVisible(false);
			this.byId("titleDisplay").setVisible(true);
			this.byId("titleChange").setVisible(false);
			this.byId("DTdisplay").setVisible(true);
			this.byId("labelDT").setVisible(false);
			this.byId("DocTypesH").setVisible(false);
			this.oEditAction.setVisible(true);
		},

		showCustomActions: function (bShow) {
			// this.byId("saveAction").setVisible(bShow);
			// this.byId("cancelAction").setVisible(bShow);
		},

		onSearch: function (oEvent) {
			var sFilterPattern = oEvent.getParameter("query");
			var searchFieldId = oEvent.getSource().getId();
			if (searchFieldId.match("searchField2")) {
				this.byId("searchField").setValue(sFilterPattern);
				var list = this.getView().byId("tablemap2");
			} else {
				this.byId("searchField2").setValue(sFilterPattern);
				var list = this.getView().byId("tablemap");
			}
			sFilterPattern = sFilterPattern.toLowerCase();
			var list = this.getView().byId("tablemap");
			var items = list.getBinding("items");
			var list2 = this.getView().byId("tablemap2");
			var items2 = list2.getBinding("items");
			var mapped = this.byId("Mapped").getSelected();
			if (mapped) {
				var oFilter1 = new sap.ui.model.Filter("slug", sap.ui.model.FilterOperator.Contains, sFilterPattern);
				var oFilter2 = new sap.ui.model.Filter("map", sap.ui.model.FilterOperator.EQ, "");
				items.filter([oFilter1, oFilter2]);
				items2.filter([oFilter1, oFilter2]);
			} else {
				var oFilter1 = new sap.ui.model.Filter("slug", sap.ui.model.FilterOperator.Contains, sFilterPattern);
				items.filter([oFilter1]);
				items2.filter([oFilter1]);
			}
		},

		onSearchMeta: function (oEvent) {
			var sFilterPattern = oEvent.getParameter("query");
			var searchFieldId = oEvent.getSource().getId();
			this.byId("searchField2").setValue(sFilterPattern);
			var list = this.getView().byId("tablemeta");

			sFilterPattern = sFilterPattern.toLowerCase();
			var list = this.getView().byId("tablemeta");
			var items = list.getBinding("items");
			var mapped = this.byId("MappedMeta").getSelected();
			if (mapped) {
				var oFilter1 = new sap.ui.model.Filter("code", sap.ui.model.FilterOperator.Contains, sFilterPattern);
				var oFilter2 = new sap.ui.model.Filter("map", sap.ui.model.FilterOperator.EQ, "");
				items.filter([oFilter1, oFilter2]);
			} else {
				var oFilter1 = new sap.ui.model.Filter("code", sap.ui.model.FilterOperator.Contains, sFilterPattern);
				items.filter([oFilter1]);
			}
		},

		onSearchGlobalVar: function (oEvent) {
			var sFilterPattern = oEvent.getParameter("query");
			var searchFieldId = oEvent.getSource().getId();
			var list = this.getView().byId("tableGlobalVar");
			sFilterPattern = sFilterPattern.toLowerCase();
			var items = list.getBinding("items");
			var oFilter1 = new sap.ui.model.Filter("variable", sap.ui.model.FilterOperator.Contains, sFilterPattern);
			items.filter([oFilter1]);
		},

		noMapped: function (oEvent) {
			var checkBox = oEvent.getSource().getId();
			var select = oEvent.getParameter("selected");
			var partselect = oEvent.getSource().getPartiallySelected();
			if (select && this.partiallySel) {
				oEvent.getSource().setSelected(false);
				this.partiallySel = false;
			} else if (!select && !this.partiallySel) {
				oEvent.getSource().setSelected(true);
				oEvent.getSource().setPartiallySelected(true);
				this.partiallySel = true;
			}
			if (checkBox.match("Mapped2")) {
				var sel = this.byId("Mapped2").getSelected();
				var parsel = this.byId("Mapped2").getPartiallySelected();
				this.byId("Mapped").setSelected(sel);
				this.byId("Mapped").setPartiallySelected(parsel);
			} else {
				var sel = this.byId("Mapped").getSelected();
				var parsel = this.byId("Mapped").getPartiallySelected();
				this.byId("Mapped2").setSelected(sel);
				this.byId("Mapped2").setPartiallySelected(parsel);
			}
			var sFilterPattern = this.byId("searchField").getValue();
			sFilterPattern = sFilterPattern.toLowerCase();
			var items = this.getView().byId("tablemap").getBinding("items");
			var items2 = this.getView().byId("tablemap2").getBinding("items");
			if (sel && parsel) {
				var oFilter1 = new sap.ui.model.Filter("slug", sap.ui.model.FilterOperator.Contains, sFilterPattern);
				var oFilter2 = new sap.ui.model.Filter("map", sap.ui.model.FilterOperator.EQ, "");
				items.filter([oFilter1, oFilter2]);
				items2.filter([oFilter1, oFilter2]);
			} else if (sel && !parsel) {
				var oFilter1 = new sap.ui.model.Filter("slug", sap.ui.model.FilterOperator.Contains, sFilterPattern);
				var oFilter2 = new sap.ui.model.Filter("map", sap.ui.model.FilterOperator.NE, "");
				items.filter([oFilter1, oFilter2]);
				items2.filter([oFilter1, oFilter2]);
			} else {
				var oFilter1 = new sap.ui.model.Filter("slug", sap.ui.model.FilterOperator.Contains, sFilterPattern);
				items.filter([oFilter1]);
				items2.filter([oFilter1]);
			}
		},

		noMappedMeta: function (oEvent) {
			var checkBox = oEvent.getSource().getId();
			var select = oEvent.getParameter("selected");
			var partselect = oEvent.getSource().getPartiallySelected();
			if (select && this.partiallySelMeta) {
				oEvent.getSource().setSelected(false);
				this.partiallySelMeta = false;
			} else if (!select && !this.partiallySelMeta) {
				oEvent.getSource().setSelected(true);
				oEvent.getSource().setPartiallySelected(true);
				this.partiallySelMeta = true;
			}
			var sel = this.byId("MappedMeta").getSelected();
			var parsel = this.byId("MappedMeta").getPartiallySelected();
			var sFilterPattern = this.byId("searchFieldMeta").getValue();
			sFilterPattern = sFilterPattern.toLowerCase();
			var items = this.getView().byId("tablemeta").getBinding("items");
			if (sel && parsel) {
				var oFilter1 = new sap.ui.model.Filter("code", sap.ui.model.FilterOperator.Contains, sFilterPattern);
				var oFilter2 = new sap.ui.model.Filter("map", sap.ui.model.FilterOperator.EQ, "");
				items.filter([oFilter1, oFilter2]);
			} else if (sel && !parsel) {
				var oFilter1 = new sap.ui.model.Filter("code", sap.ui.model.FilterOperator.Contains, sFilterPattern);
				var oFilter2 = new sap.ui.model.Filter("map", sap.ui.model.FilterOperator.NE, "");
				items.filter([oFilter1, oFilter2]);
			} else {
				var oFilter1 = new sap.ui.model.Filter("code", sap.ui.model.FilterOperator.Contains, sFilterPattern);
				items.filter([oFilter1]);
			}
		},

		applySearchPattern: function (oItem, sFilterPattern) {
			if (sFilterPattern == "") {
				return true;
			}
			if ((oItem.getCells()[0].getText() && oItem.getCells()[0].getText().toLowerCase().indexOf(sFilterPattern) != -1)) {
				return true;
			}
			return false;
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.code,
				sObjectName = oObject.text;

			oViewModel.setProperty("/busy", false);
			// Add the object page to the flp routing history
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("objectTitle") + " - " + sObjectName,
				icon: "sap-icon://enter-more",
				intent: "#Worker-TemplateConfig&/Countries/" + sObjectId
			});

		},
		changePeriodType: function (oEvent) {
			var selItem = oEvent.getParameter("selectedItem");
			var itemsCheck = this.getView().byId("days").getItems();
			if (selItem.getKey() == "D") {
				this.byId("MC1").setValueState("None");
				itemsCheck.forEach(function (item) {
					item.setValueState("None");
				});
			} else if (selItem.getKey() == "W") {
				this.byId("MC1").setValueState("None");
			} else if (selItem.getKey() == "M") {
				itemsCheck.forEach(function (item) {
					item.setValueState("None");
				});
			}
		},
		changePeriodTypeRep: function (oEvent) {
			var selItem = oEvent.getParameter("selectedItem");
			var itemsCheck = this.getView().byId("daysRep").getItems();
			if (selItem.getKey() == "D") {
				this.byId("MC1Rep").setValueState("None");
				itemsCheck.forEach(function (item) {
					item.setValueState("None");
				});
			} else if (selItem.getKey() == "W") {
				this.byId("MC1Rep").setValueState("None");
			} else if (selItem.getKey() == "M") {
				itemsCheck.forEach(function (item) {
					item.setValueState("None");
				});
			}
		},

		selExecute: function (oEvent) {
			var index = oEvent.getParameter("selectedIndex");
			var oPlanModel = this.getModel("planning")
			var pland = oPlanModel.getProperty("/plan_d");
			if (index == 0) {
				//	NewPlanModel.setProperty("/execute", true);
				pland.execute = true;
			} else {
				//NewPlanModel.setProperty("/execute", false);
				pland.execute = false
			}
		},

		changeBegda: function (oEvent) {
			var value = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			var sValueState = "None";
			if (value == "") {
				sValueState = "Error";
			}
			oInput.setValueState(sValueState);
			var oPlanModel = this.getModel("planning")
			var pland = oPlanModel.getProperty("/plan_d");
			pland.begda = value;
			//NewPlanModel.setProperty("/begda", value);
		},

		changeEndda: function (oEvent) {
			var value = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			var sValueState = "None";
			if (value == "") {
				sValueState = "Error";
			}
			oInput.setValueState(sValueState);
			var oPlanModel = this.getModel("planning")
			var pland = oPlanModel.getProperty("/plan_d");
			pland.endda = value;
		},

		changeBegdaRep: function (oEvent) {
			var value = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			var sValueState = "None";
			if (value == "") {
				sValueState = "Error";
			}
			oInput.setValueState(sValueState);
			var oPlanModel = this.getModel("planningRep")
			var pland = oPlanModel.getProperty("/plan_d");
			pland.begda = value;
			//NewPlanModel.setProperty("/begda", value);
		},

		changeEnddaRep: function (oEvent) {
			var value = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			var sValueState = "None";
			if (value == "") {
				sValueState = "Error";
			}
			oInput.setValueState(sValueState);
			var oPlanModel = this.getModel("planningRep")
			var pland = oPlanModel.getProperty("/plan_d");
			pland.endda = value;
		},

		handleSelectionChange: function (oEvent) {
			var oInput = oEvent.getSource();
			var sValueState = "None";
			var selKeys = oInput.getSelectedKeys();
			if (selKeys.length > 0) {
				oInput.setValueState(sValueState);
			}
		},

		onChangeView: function (oEvent) {
			var vis1 = this.byId("ScrollCont").getVisible();
			var vis2 = this.byId("DynamicSideContent").getVisible();
			if (vis1) {
				this.byId("ScrollCont").setVisible(false);
			} else {
				this.byId("ScrollCont").setVisible(true);
			}
			if (vis2) {
				this.byId("DynamicSideContent").setVisible(false);
			} else {
				this.byId("DynamicSideContent").setVisible(true);
			}
		},

		timeChange: function (oEvent) {
			var value = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			var sValueState = "None";
			if (value == "") {
				sValueState = "Error";
			}
			oInput.setValueState(sValueState);
		},

		selectCheck: function (oEvent) {
			var source = oEvent.getSource();
			var text = source.getText();
			var oPlanModel = this.getModel("planning")
			var pland = oPlanModel.getProperty("/plan_d");
			var periodValues = pland.periodicity_values;

			//	var NewPlanModel = this.getModel("newPlan");
			//	var periodValues = NewPlanModel.getProperty("/periodicity_values");
			var arrayDays = periodValues.split("-");
			var sel = oEvent.getParameter("selected");
			if (sel) {
				arrayDays.push(source.getName());
			} else {
				var i = arrayDays.indexOf(source.getName());
				if (i !== -1) {
					arrayDays.splice(i, 1);
				}
			}
			arrayDays.sort();
			var strValues = arrayDays.join("-");
			//	NewPlanModel.setProperty("/periodicity_values", strValues);
			pland.periodicity_values = strValues;
			var itemsCheck = this.byId("days").getItems();
			var selected = false;
			itemsCheck.forEach(function (item) {
				if (item.getSelected()) {
					selected = true;
				}
			});
			if (selected) {
				itemsCheck.forEach(function (item) {
					item.setValueState("None");
				});
			}
		},

		selectCheckRep: function (oEvent) {
			var source = oEvent.getSource();
			var text = source.getText();
			var oPlanModel = this.getModel("planningRep")
			var pland = oPlanModel.getProperty("/plan_d");
			var periodValues = pland.periodicity_values;

			//	var NewPlanModel = this.getModel("newPlan");
			//	var periodValues = NewPlanModel.getProperty("/periodicity_values");
			var arrayDays = periodValues.split("-");
			var sel = oEvent.getParameter("selected");
			if (sel) {
				arrayDays.push(source.getName());
			} else {
				var i = arrayDays.indexOf(source.getName());
				if (i !== -1) {
					arrayDays.splice(i, 1);
				}
			}
			arrayDays.sort();
			var strValues = arrayDays.join("-");
			//	NewPlanModel.setProperty("/periodicity_values", strValues);
			pland.periodicity_values = strValues;
			var itemsCheck = this.byId("daysRep").getItems();
			var selected = false;
			itemsCheck.forEach(function (item) {
				if (item.getSelected()) {
					selected = true;
				}
			});
			if (selected) {
				itemsCheck.forEach(function (item) {
					item.setValueState("None");
				});
			}
		},

		handleSelectionFinish: function (oEvent) {
			var items = oEvent.getParameter("selectedItems");
			var itemsSel = [];
			for (var i = 0; i < items.length; i++) {
				itemsSel.push(items[i].getKey());
			}
			itemsSel.sort();
			var strValues = itemsSel.join("-");
			//var NewPlanModel = this.getModel("newPlan");
			//NewPlanModel.setProperty("/periodicity_valuesM", strValues);

			var oPlanModel = this.getModel("planning")
			var pland = oPlanModel.getProperty("/plan_d");
			pland.periodicity_valuesM = strValues;
		},
		handleSelectionFinishRep: function (oEvent) {
			var items = oEvent.getParameter("selectedItems");
			var itemsSel = [];
			for (var i = 0; i < items.length; i++) {
				itemsSel.push(items[i].getKey());
			}
			itemsSel.sort();
			var strValues = itemsSel.join("-");
			//var NewPlanModel = this.getModel("newPlan");
			//NewPlanModel.setProperty("/periodicity_valuesM", strValues);

			var oPlanModel = this.getModel("planningRep")
			var pland = oPlanModel.getProperty("/plan_d");
			pland.periodicity_valuesM = strValues;
		},

		convertTZ: function (date, tzString) {
			return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
				timeZone: tzString
			}));
		},

		savePlanning: function (oEvent) {
			// VALIDACIONES TODO
			var oPlanModel = this.getModel("planning");
			var oViewModel = this.getModel("objectView");
			var oView = this.getView(),
				aInputs = [
					oView.byId("Comments"),
					oView.byId("DTP1"),
					oView.byId("DTP2"),
					oView.byId("DTP3"),
					//	oView.byId("DTP4"),
					oView.byId("begda"),
					oView.byId("endda"),
					oView.byId("TP1"),
					oView.byId("TP2")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
			} else {
				if (this.byId("periodType").getSelectedItem().getKey() == "M") {
					var selKeys = this.byId("MC1").getSelectedKeys();
					if (selKeys.length == 0) {
						this.byId("MC1").setValueState("Error");
						sap.m.MessageBox.alert("A validation error has occurred.");
						return;
					} else {
						this.byId("MC1").setValueState("None");
					}
				} else if (this.byId("periodType").getSelectedItem().getKey() == "W") {
					var itemsCheck = this.byId("days").getItems();
					var selected = false;
					itemsCheck.forEach(function (item) {
						if (item.getSelected()) {
							selected = true;
						}
					});
					if (!selected) {
						itemsCheck.forEach(function (item) {
							item.setValueState("Error");
						});
						sap.m.MessageBox.alert("A validation error has occurred.");
						return;
					}

				}
				var timezone = oView.byId("TimeZone").getSelectedKey();
				var date = new Date();
				var dateConvert = this.convertTZ(date, timezone);
				var date1 = aInputs[1].getDateValue();
				if (date1 >= dateConvert) {
					aInputs[1].setValueState("Error");
					sap.m.MessageBox.alert("The selected date must be less than the current date in the selected timezone.");
					return;
				} else {
					aInputs[1].setValueState("None");
				}
				var date2 = aInputs[2].getDateValue();
				if (date2 >= dateConvert) {
					aInputs[2].setValueState("Error");
					sap.m.MessageBox.alert("The selected date must be less than the current date in the selected timezone.");
					return;
				} else {
					aInputs[2].setValueState("None");
				}
				var date3 = aInputs[3].getDateValue();
				if (date3 >= dateConvert) {
					aInputs[3].setValueState("Error");
					sap.m.MessageBox.alert("The selected date must be less than the current date in the selected timezone.");
					return;
				} else {
					aInputs[3].setValueState("None");
				}

				var comments = aInputs[0].getValue();
				var text = "Are you sure you want to save the Job Planning?";
				var that = this;
				var dialogNewPlan = oEvent.getSource().getParent();
				var dialog = new sap.m.Dialog({
					title: 'Confirmation',
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: 'Yes',
						press: function () {
							var selKey = that.byId("SegBut").getSelectedKey();
							var enable = false;
							if (selKey == "A") {
								enable = true;
							}
							var data = {
								pck_code: "DI_TEMPLG",
								type: "D",
								enable: enable,
								processing_type: "I",
								comments: comments
							};
							var oModel = that.getOwnerComponent().getModel();
							oViewModel.setProperty("/busy", true);
							if (that.exist_plan !== "X") {
								oModel.create("/Integration_Pck_Planning", data, {
									headers: {
										"Content-Type": "application/json",
										'Accept': 'application/json'
									},
									success: function (oData, response) {
										//var but = oEvent.getSource();
										//	oViewModel.setProperty("/busy", false);
										that.onUpdatePlanTemplate(oData.uuid, oData.processing_type, "");
										//	sap.m.MessageToast.show("Planning created succesfully.");

									},
									error: function (oError) {
										oViewModel.setProperty("/busy", false);
										sap.m.MessageToast.show("Error");
									}
								});
							} else {
								var planuuid = oPlanModel.getProperty("/uuid");
								var sPath = "/Integration_Pck_Planning(guid'" + planuuid + "')";
								oModel.update(sPath, data, {
									headers: {
										"Content-Type": "application/json",
										'Accept': 'application/json'
									},
									success: function (oData, response) {
										//var but = oEvent.getSource();
										//	oViewModel.setProperty("/busy", false);
										that.updateDataBatch(oData.uuid, oData.processing_type, "");
										//	sap.m.MessageToast.show("Planning created succesfully.");

									},
									error: function (oError) {
										oViewModel.setProperty("/busy", false);
										sap.m.MessageToast.show("Error");
									}
								});

							}
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: 'No',
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});

				dialog.open();
			}

		},

		savePlanningRep: function (oEvent) {
			// VALIDACIONES TODO
			var oPlanModel = this.getModel("planningRep");
			var oViewModel = this.getModel("objectView");
			var oView = this.getView(),
				aInputs = [
					oView.byId("CommentsRep"),
					// oView.byId("DTP1Rep"),
					// oView.byId("DTP2Rep"),
					// oView.byId("DTP3Rep"),
					oView.byId("begdaRep"),
					oView.byId("enddaRep"),
					oView.byId("TP1Rep"),
					oView.byId("TP2Rep")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
			} else {
				if (this.byId("periodTypeRep").getSelectedItem().getKey() == "M") {
					var selKeys = this.byId("MC1Rep").getSelectedKeys();
					if (selKeys.length == 0) {
						this.byId("MC1Rep").setValueState("Error");
						sap.m.MessageBox.alert("A validation error has occurred.");
						return;
					} else {
						this.byId("MC1Rep").setValueState("None");
					}
				} else if (this.byId("periodTypeRep").getSelectedItem().getKey() == "W") {
					var itemsCheck = this.byId("daysRep").getItems();
					var selected = false;
					itemsCheck.forEach(function (item) {
						if (item.getSelected()) {
							selected = true;
						}
					});
					if (!selected) {
						itemsCheck.forEach(function (item) {
							item.setValueState("Error");
						});
						sap.m.MessageBox.alert("A validation error has occurred.");
						return;
					}

				}

				var comments = aInputs[0].getValue();
				var text = "Are you sure you want to save the Job Reprocessing Planning?";
				var that = this;
				var dialogNewPlan = oEvent.getSource().getParent();
				var dialog = new sap.m.Dialog({
					title: 'Confirmation',
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: 'Yes',
						press: function () {
							var selKey = that.byId("SegButRep").getSelectedKey();
							var enable = false;
							if (selKey == "A") {
								enable = true;
							}
							var data = {
								pck_code: "DI_TEMPLG",
								type: "D",
								enable: enable,
								processing_type: "R",
								comments: comments
							};
							var oModel = that.getOwnerComponent().getModel();
							oViewModel.setProperty("/busy", true);
							if (that.exist_plan_Rep !== "X") {
								oModel.create("/Integration_Pck_Planning", data, {
									headers: {
										"Content-Type": "application/json",
										'Accept': 'application/json'
									},
									success: function (oData, response) {
										//var but = oEvent.getSource();
										//	oViewModel.setProperty("/busy", false);
										that.onUpdatePlanTemplate(oData.uuid, oData.processing_type, "X");
										//	sap.m.MessageToast.show("Planning created succesfully.");

									},
									error: function (oError) {
										oViewModel.setProperty("/busy", false);
										sap.m.MessageToast.show("Error");
									}
								});
							} else {
								var planuuid = oPlanModel.getProperty("/uuid");
								var sPath = "/Integration_Pck_Planning(guid'" + planuuid + "')";
								oModel.update(sPath, data, {
									headers: {
										"Content-Type": "application/json",
										'Accept': 'application/json'
									},
									success: function (oData, response) {
										//var but = oEvent.getSource();
										//	oViewModel.setProperty("/busy", false);
										that.updateDataBatch(oData.uuid, oData.processing_type, "X");
										//	sap.m.MessageToast.show("Planning created succesfully.");

									},
									error: function (oError) {
										oViewModel.setProperty("/busy", false);
										sap.m.MessageToast.show("Error");
									}
								});

							}
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: 'No',
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});

				dialog.open();
			}

		},

		createDataPlanning: function (planUuid, reproc) {
			if (reproc == "X") {
				var oPlanModel = this.getModel("planningRep")
			} else {
				var oPlanModel = this.getModel("planning")
			}
			var pland = oPlanModel.getProperty("/plan_d");
			var uuid = planUuid;
			//var NewPlanModel = that.getModel("newPlan");
			var begda = pland.begda;
			var endda = pland.endda;
			var timezone = pland.time_zone;
			if (reproc == "X") {
				var tp1 = this.byId("TP1Rep").getDateValue();
			} else {
				var tp1 = this.byId("TP1").getDateValue();
			}
			var hours = tp1.getHours();
			if (hours < 10) {
				hours = "0" + String(hours);
			}
			var minutes = tp1.getMinutes();
			if (minutes < 10) {
				minutes = "0" + String(minutes);
			}
			var seconds = tp1.getSeconds();
			if (seconds < 10) {
				seconds = "0" + String(seconds);
			}
			var timeS = hours + ":" + minutes + ":" + seconds;
			//	var timeE = NewPlanModel.getProperty("/time_end");
			if (reproc == "X") {
				var tp2 = this.byId("TP2Rep").getDateValue();
			} else {
				var tp2 = this.byId("TP2").getDateValue();
			}
			hours = tp2.getHours();
			if (hours < 10) {
				hours = "0" + String(hours);
			}
			minutes = tp2.getMinutes();
			if (minutes < 10) {
				minutes = "0" + String(minutes);
			}
			seconds = tp2.getSeconds();
			if (seconds < 10) {
				seconds = "0" + String(seconds);
			}
			var timeE = hours + ":" + minutes + ":" + seconds;
			//	var execute = pland.execute;
			var execute = true;
			var periodType = pland.periodicity_type;
			if (periodType == "W") {
				var periodicity_values = pland.periodicity_values;
			} else if (periodType == "M") {
				var periodicity_values = pland.periodicity_valuesM;
			} else {
				var periodicity_values = "";
			}
			var onTime = pland.ontime;
			if (!onTime) {
				var timefrec = pland.time_frecuency;
				var unit = timefrec.substr(-1);
				var time = parseInt(timefrec.substr(0, timefrec.length - 1));
			} else {
				//TODO
			}
			var data = {
				planning_uuid: uuid,
				seqno: 2,
				execute: execute,
				begda: begda,
				endda: endda,
				periodicity_type: periodType,
				periodicity_values: periodicity_values,
				time_frecuency: time,
				time_measure: unit,
				time_start: timeS,
				time_end: timeE,
				time_zone: timezone
			};
			return data;
		},

		createDataBatch: function (planUuid, processing_type, reproc) {
			var planning_uuid = planUuid;
			var sPath = "/Integration_Pck_Planning_Adata";
			var oModel = this.getOwnerComponent().getModel();
			oModel.setDeferredGroups(["createGroup"]);
			var that = this;
			var oData = {};
			//			if (processing_type == "I") {
			oData.planning_uuid = planning_uuid;
			oData.level1 = "WS_GET_WORKERS";
			oData.level2 = "TIME_ZONE";
			if (reproc !== "X") {
				oData.value = this.byId("TimeZone").getSelectedKey();
				oData.value2 = null;
				oModel.create(sPath, oData, {
					groupId: "createGroup"
				});

				var oData2 = {};
				oData2.planning_uuid = planning_uuid;
				oData2.level1 = "WS_GET_WORKERS";
				oData2.level2 = "NEXT_UPDATED_FROM";
				//oData2.value = this.byId("DTP4").getValue();
				oData2.value = "";
				oData2.value2 = null;
				oModel.create(sPath, oData2, {
					groupId: "createGroup"
				});
				var oData3 = {};
				oData3.planning_uuid = planning_uuid;
				oData3.level1 = "WS_GET_WORKERS";
				oData3.level2 = "INITIAL_DATE_FROM";

				oData3.value = this.byId("DTP1").getValue();

				oData3.value2 = null;
				oModel.create(sPath, oData3, {
					groupId: "createGroup"
				});
				var oData4 = {};
				oData4.planning_uuid = planning_uuid;
				oData4.level1 = "WS_GET_WORKERS";
				oData4.level2 = "RETRO_CHG_EFFECTIVE_FROM";

				oData4.value = this.byId("DTP2").getValue();

				oData4.value2 = null;
				oModel.create(sPath, oData4, {
					groupId: "createGroup"
				});
				var oData5 = {};
				oData5.planning_uuid = planning_uuid;
				oData5.level1 = "WS_GET_WORKERS";
				oData5.level2 = "FUTURE_CHG_UPDATED_FROM";

				oData5.value = this.byId("DTP3").getValue();
				oData5.value2 = null;
				oModel.create(sPath, oData5, {
					groupId: "createGroup"
				});
			}
			var dataPlan = that.createDataPlanning(planUuid, reproc);
			oModel.create("/Integration_Pck_Planning_D", dataPlan, {
				groupId: "createGroup"
			});

			oModel.submitChanges({
				groupId: "createGroup",
				success: this.successCreateBatch.bind(that),
				error: this.errorCreateBatch.bind(that)
			});
		},

		createPagesBatch: function (uuidTemp) {
			var sPath = "/Di_Template_Page_Content";
			var oModel = this.getOwnerComponent().getModel();
			oModel.setDeferredGroups(["createPages"]);
			var that = this;
			var pages = this.getModel("template").getData().pages_preview;
			for (var i = 0; i < pages.length; i++) {
				var item = {};
				item.template_uuid = uuidTemp;
				item.page = i + 1;
				item.content = pages[i].base64;
				oModel.create(sPath, item, {
					groupId: "createPages"
				});
			}
			oModel.submitChanges({
				groupId: "createPages",
				success: this.successCreatePages.bind(that),
				error: this.errorCreatePages.bind(that)
			});
		},
		successCreatePages: function (oData) {
			var a = 0;
		},

		errorCreatePages: function (error) {
			var a = 0;
		},

		updateDataBatch: function (planUuid, processing_type, reproc) {
			var planning_uuid = planUuid;
			var that = this;
			if (reproc == "X") {
				var oPlanModel = this.getModel("planningRep")
			} else {
				var oPlanModel = this.getModel("planning")
			}
			var oModel = this.getOwnerComponent().getModel();
			oModel.setDeferredGroups(["updateGroup"]);
			if (reproc !== "X") {
				var sPath = "/Integration_Pck_Planning_Adata";
				var adata = oPlanModel.getProperty("/adata");

				var oData = {};
				var sPath1 = sPath + "(" + adata.time_zone_uuid + ")";
				oData.uuid = adata.time_zone_uuid;
				oData.value = adata.time_zone;
				oModel.update(sPath1, oData, {
					groupId: "updateGroup"
				});
				// var oData2 = {};
				// var sPath2 = sPath + "(" + adata.next_upd_from_uuid + ")";
				// oData2.uuid = adata.next_upd_from_uuid;
				// oData2.value = adata.next_upd_from;
				// oModel.update(sPath2, oData2, {
				// 	groupId: "updateGroup"
				// });
				var oData3 = {};
				oData3.uuid = adata.initial_date_from_uuid;
				var sPath3 = sPath + "(" + oData3.uuid + ")";
				oData3.value = adata.initial_date_from;
				oModel.update(sPath3, oData3, {
					groupId: "updateGroup"
				});
				var oData4 = {};
				oData4.uuid = adata.fut_upd_from_uuid;
				var sPath4 = sPath + "(" + oData4.uuid + ")";
				oData4.value = adata.fut_upd_from;
				oModel.update(sPath4, oData4, {
					groupId: "updateGroup"
				});
				var oData5 = {};
				oData5.uuid = adata.retro_effec_from_uuid;
				var sPath5 = sPath + "(" + oData5.uuid + ")";
				oData5.value = adata.retro_effec_from;
				oModel.update(sPath5, oData5, {
					groupId: "updateGroup"
				});
			}
			var pland = oPlanModel.getProperty("/plan_d");
			var dataPlan = that.createDataPlanning(planUuid, reproc);
			var sPathPlan = "/Integration_Pck_Planning_D(guid'" + pland.uuid + "')";
			oModel.update(sPathPlan, dataPlan, {
				groupId: "updateGroup"
			});
			oModel.submitChanges({
				groupId: "updateGroup",
				success: that.successUpdateBatchP.bind(that),
				error: that.errorUpdateBatch
			});
		},

		successUpdateBatchP: function (oData, response) {
			sap.m.MessageToast.show("Planning updated succesfully.");
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			//	this._onBindingChange();
		},

		errorUpdateBatch: function (oError) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			sap.m.MessageToast.show("Error");

		},

		successCreateBatch: function (oData, response) {
			//TODO
			sap.m.MessageToast.show("Planning created succesfully.");
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
		},

		errorCreateBatch: function (oError) {
			//TODO
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			sap.m.MessageToast.show("Error");
		},

		_validateInputNewP: function (oInput) {
			var sValueState = "None";
			var bValidationError = false;
			var oBinding = oInput.getBinding("value");
			var value = oInput.getValue();
			if (value == "") {
				sValueState = "Error";
				bValidationError = true;
			}
			oInput.setValueState(sValueState);
			return bValidationError;
		},

		changeSignType_Dis: function (oEvent) {
			var item_selected = oEvent.getParameter("selectedItem");
			var singType = item_selected.getKey();
			var fields = [
				this.byId("Reg_Reference_Dis"),
				this.byId("Tech_Id_Dis"),
				this.byId("Email_address_Dis"),
				this.byId("Phone_number_Dis"),
				this.byId("First_name_Dis"),
				this.byId("Last_name_Dis"),
				this.byId("Language_Sign_Dis"),
				this.byId("checkSMSnot_Dis"),
				this.byId("checkSMSau_Dis"),
				this.byId("Language_label_Dis")
			];
			switch (singType) {
			case 'organization':
				fields[0].setRequired(false);
				fields[1].setRequired(false);
				fields[0].setVisible(false);
				fields[1].setVisible(false);
				fields[2].setRequired(true);
				fields[2].setVisible(true);
				fields[3].setRequired(false);
				fields[4].setRequired(false);
				fields[5].setRequired(false);
				fields[6].setRequired(false);
				fields[3].setVisible(false);
				fields[4].setVisible(false);
				fields[5].setVisible(false);
				fields[6].setVisible(false);
				fields[7].setVisible(false);
				fields[8].setVisible(false);
				fields[7].setSelected(false);
				fields[8].setSelected(false);
				fields[9].setVisible(false);
				break;
			case 'employee':
				fields[0].setRequired(true);
				fields[1].setRequired(false);
				fields[0].setVisible(true);
				fields[1].setVisible(false);
				fields[2].setRequired(false);
				fields[2].setVisible(false);
				fields[3].setRequired(false);
				fields[4].setRequired(false);
				fields[5].setRequired(false);
				fields[6].setRequired(false);
				fields[3].setVisible(true);
				fields[4].setVisible(false);
				fields[5].setVisible(false);
				fields[6].setVisible(false);
				fields[7].setVisible(true);
				fields[8].setVisible(true);
				fields[9].setVisible(false);
				break;
			case 'manager':
				fields[0].setRequired(false);
				fields[1].setRequired(true);
				fields[0].setVisible(false);
				fields[1].setVisible(true);
				fields[2].setRequired(false);
				fields[2].setVisible(false);
				fields[3].setRequired(false);
				fields[4].setRequired(false);
				fields[5].setRequired(false);
				fields[6].setRequired(false);
				fields[3].setVisible(true);
				fields[4].setVisible(false);
				fields[5].setVisible(false);
				fields[6].setVisible(false);
				fields[7].setVisible(true);
				fields[8].setVisible(true);
				fields[9].setVisible(false);
				break;
			case 'external':
				fields[0].setRequired(false);
				fields[1].setRequired(false);
				fields[0].setVisible(false);
				fields[1].setVisible(false);
				fields[2].setRequired(true);
				fields[2].setVisible(true);
				fields[3].setRequired(false);
				fields[4].setRequired(true);
				fields[5].setRequired(true);
				fields[6].setRequired(false);
				fields[3].setVisible(true);
				fields[4].setVisible(true);
				fields[5].setVisible(true);
				fields[6].setVisible(true);
				fields[7].setVisible(true);
				fields[8].setVisible(true);
				fields[9].setVisible(true);
				break;
			default:
				break;
			}
		},

		changeSignType: function (oEvent) {
			var item_selected = oEvent.getParameter("selectedItem");
			var singType = item_selected.getKey();
			var fields = [
				this.byId("Reg_Reference"),
				this.byId("Tech_Id"),
				this.byId("Email_address"),
				this.byId("Phone_number"),
				this.byId("First_name"),
				this.byId("Last_name"),
				this.byId("Language_Sign"),
				this.byId("checkSMSnot"),
				this.byId("checkSMSau"),
				this.byId("Language_label")
			];
			switch (singType) {
			case 'organization':
				fields[0].setRequired(false);
				fields[1].setRequired(false);
				fields[0].setVisible(false);
				fields[1].setVisible(false);
				fields[2].setRequired(true);
				fields[2].setVisible(true);
				fields[3].setRequired(false);
				fields[4].setRequired(false);
				fields[5].setRequired(false);
				fields[6].setRequired(false);
				fields[3].setVisible(false);
				fields[4].setVisible(false);
				fields[5].setVisible(false);
				fields[6].setVisible(false);
				fields[7].setVisible(false);
				fields[8].setVisible(false);
				fields[7].setSelected(false);
				fields[8].setSelected(false);
				fields[9].setVisible(false);
				break;
			case 'employee':
				fields[0].setRequired(true);
				fields[1].setRequired(false);
				fields[0].setVisible(true);
				fields[1].setVisible(false);
				fields[2].setRequired(false);
				fields[2].setVisible(false);
				fields[3].setRequired(false);
				fields[4].setRequired(false);
				fields[5].setRequired(false);
				fields[6].setRequired(false);
				fields[3].setVisible(true);
				fields[4].setVisible(false);
				fields[5].setVisible(false);
				fields[6].setVisible(false);
				fields[7].setVisible(true);
				fields[8].setVisible(true);
				fields[9].setVisible(false);
				break;
			case 'manager':
				fields[0].setRequired(false);
				fields[1].setRequired(true);
				fields[0].setVisible(false);
				fields[1].setVisible(true);
				fields[2].setRequired(false);
				fields[2].setVisible(false);
				fields[3].setRequired(false);
				fields[4].setRequired(false);
				fields[5].setRequired(false);
				fields[6].setRequired(false);
				fields[3].setVisible(true);
				fields[4].setVisible(false);
				fields[5].setVisible(false);
				fields[6].setVisible(false);
				fields[7].setVisible(true);
				fields[8].setVisible(true);
				fields[9].setVisible(false);
				break;
			case 'external':
				fields[0].setRequired(false);
				fields[1].setRequired(false);
				fields[0].setVisible(false);
				fields[1].setVisible(false);
				fields[2].setRequired(true);
				fields[2].setVisible(true);
				fields[3].setRequired(false);
				fields[4].setRequired(true);
				fields[5].setRequired(true);
				fields[6].setRequired(false);
				fields[3].setVisible(true);
				fields[4].setVisible(true);
				fields[5].setVisible(true);
				fields[6].setVisible(true);
				fields[7].setVisible(true);
				fields[8].setVisible(true);
				fields[9].setVisible(true);
				break;
			default:
				break;
			}
		},

		changeSignType_Edit: function (oEvent) {
			var item_selected = oEvent.getParameter("selectedItem");
			var singType = item_selected.getKey();
			var fields = [
				this.byId("Reg_Reference_Edit"),
				this.byId("Tech_Id_Edit"),
				this.byId("Email_address_Edit"),
				this.byId("Phone_number_Edit"),
				this.byId("First_name_Edit"),
				this.byId("Last_name_Edit"),
				this.byId("Language_Sign_Edit"),
				this.byId("checkSMSnot_Edit"),
				this.byId("checkSMSau_Edit"),
				this.byId("Language_label_Edit")
			];
			switch (singType) {
			case 'organization':
				fields[0].setRequired(false);
				fields[1].setRequired(false);
				fields[0].setVisible(false);
				fields[1].setVisible(false);
				fields[2].setRequired(true);
				fields[2].setVisible(true);
				fields[3].setRequired(false);
				fields[4].setRequired(false);
				fields[5].setRequired(false);
				fields[6].setRequired(false);
				fields[3].setVisible(false);
				fields[4].setVisible(false);
				fields[5].setVisible(false);
				fields[6].setVisible(false);
				fields[7].setVisible(false);
				fields[8].setVisible(false);
				fields[7].setSelected(false);
				fields[8].setSelected(false);
				fields[9].setVisible(false);
				break;
			case 'employee':
				fields[0].setRequired(true);
				fields[1].setRequired(false);
				fields[0].setVisible(true);
				fields[1].setVisible(false);
				fields[2].setRequired(false);
				fields[2].setVisible(false);
				fields[3].setRequired(false);
				fields[4].setRequired(false);
				fields[5].setRequired(false);
				fields[6].setRequired(false);
				fields[3].setVisible(true);
				fields[4].setVisible(false);
				fields[5].setVisible(false);
				fields[6].setVisible(false);
				fields[7].setVisible(true);
				fields[8].setVisible(true);
				fields[9].setVisible(false);
				break;
			case 'manager':
				fields[0].setRequired(false);
				fields[1].setRequired(true);
				fields[0].setVisible(false);
				fields[1].setVisible(true);
				fields[2].setRequired(false);
				fields[2].setVisible(false);
				fields[3].setRequired(false);
				fields[4].setRequired(false);
				fields[5].setRequired(false);
				fields[6].setRequired(false);
				fields[3].setVisible(true);
				fields[4].setVisible(false);
				fields[5].setVisible(false);
				fields[6].setVisible(false);
				fields[7].setVisible(true);
				fields[8].setVisible(true);
				fields[9].setVisible(true);
				break;
			case 'external':
				fields[0].setRequired(false);
				fields[1].setRequired(false);
				fields[0].setVisible(false);
				fields[1].setVisible(false);
				fields[2].setRequired(true);
				fields[2].setVisible(true);
				fields[3].setRequired(false);
				fields[4].setRequired(true);
				fields[5].setRequired(true);
				fields[6].setRequired(false);
				fields[3].setVisible(true);
				fields[4].setVisible(true);
				fields[5].setVisible(true);
				fields[6].setVisible(true);
				fields[7].setVisible(true);
				fields[8].setVisible(true);
				fields[9].setVisible(true);
				break;
			default:
				break;
			}
		},

		onSearchAttr: function (oEvent) {
			var sFilterPattern = oEvent.getParameter("query");
			sFilterPattern = sFilterPattern.toLowerCase();
			var list = this.getView().byId("tableAtt");
			var items = list.getBinding("items");
			var oFilter1 = new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sFilterPattern);
			items.filter([oFilter1]);
			//items2.filter([oFilter1]);
		},

		pathAtributte: function (oObject) {
			this.buttonIdSel = oObject.getSource().getId();
			this.pathButtonSel = "";
			if (this.code_id_filled === "WD-WORKERS") {
				this.openGetPath();
			} else {
				this.code_id_filled = "WD-WORKERS";
				this.fill_Parser("GET_WORKERS_35.2");
			}
		},

		selectSource: function (oObject) {
			this.buttonIdSel = oObject.getSource().getId();
			if (this.buttonIdSel.match("ButPathAttri") || this.buttonIdSel.match("ButPathEditAttri")) {
				this.pathButtonSel = "";
			} else if (this.buttonIdSel.match("pathGlobVar")) {
				this.pathButtonSel = "";
				if (this.sourceGVEdit != "") {
					var source = this.sourceGVEdit;
				}
			} else {
				this.pathButtonSel = oObject.getSource().getParent().getBindingContext("template").getPath();
				var sourcePath = oObject.getSource().getParent().getBindingContext("template").getPath() + "/source";
				var source = this.getView().getModel("template").getProperty(sourcePath);
			}
			if (!this.byId("selSource")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.sourceXsd",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					if (source) {
						this.byId("sourXsdPath").setSelectedKey(source);
					}
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("selSource").open();
				if (source) {
					this.byId("sourXsdPath").setSelectedKey(source);
				}
			}
		},

		selecSource: function (oEvent) {
			var pathXsd = this.byId("sourXsdPath").getSelectedItem().getBindingContext().getPath() + "/xsd_id";
			var pathCode = this.byId("sourXsdPath").getSelectedItem().getBindingContext().getPath() + "/code";
			var oModel = this.getOwnerComponent().getModel();
			var xsd_id = oModel.getProperty(pathXsd);
			var code = oModel.getProperty(pathCode);
			var dialogSelSource = oEvent.getSource().getParent();
			if (code == this.code_id_filled) {
				dialogSelSource.close();
				this.openGetPath();
			} else {
				this.code_id_filled = code;
				dialogSelSource.setBusy(true);
				this.fill_Parser(xsd_id);
			}

		},

		cancelSelSource: function (oEvent) {
			var dialogSelSource = oEvent.getSource().getParent();
			dialogSelSource.close();
		},

		fill_Parser: function (xsd_id) {
			//var selParser = oObject.getSource().getParent().getParent().getCells()[2].getSelectedKey();
			var oModel = this.getOwnerComponent().getModel();
			var BPMode = this.getOwnerComponent().getModel("jerarquia");
			var XSDModel = this.getOwnerComponent().getModel("xsd");
			var that = this;
			var aFilter = [];
			var xsdFil = new sap.ui.model.Filter("xsd_id", sap.ui.model.FilterOperator.EQ, xsd_id);
			aFilter.push(xsdFil);
			var sPath = "/Di_Parser_Xsd_Definition";
			oModel.read(sPath, {
				filters: aFilter,
				success: function (oData, oResponse) {
					var results = oData.results;
					delete oData.__metadata;
					var oRawModel = that.getModel("RawModel");
					oRawModel.setData(results);
					var tree = that.pasaratree(results);
					XSDModel.setData(tree);
					BPMode.setData({
						nodeRoot: {
							nodes: tree
						}
					});
					BPMode.refresh();
					var dialogSelSource = that.byId("selSource");
					if (dialogSelSource) {
						that.byId("selSource").setBusy(false);
						that.byId("selSource").close();
					}
					that.openGetPath();
				},
				error: function (oError) {
					var dialogSelSource = that.byId("selSource");
					if (dialogSelSource) {
						that.byId("selSource").setBusy(false);
						that.byId("selSource").close();
					}
					sap.m.MessageToast.show("Error Load XSD");
					//	oViewModel.setProperty("/busy", false);
				}
			});
		},

		pasaratree: function (array, parent, tree) {

			tree = typeof tree !== 'undefined' ? tree : [];
			parent = typeof parent !== 'undefined' ? parent : {
				node_id: 0
			};
			var nodes = array.filter(function (child) {
				if (child.parent_id === parent.node_id) { //&& child.node_type !== "attribute"
					return true;
				} else {
					return false;
				}
				//	return child.parent_id === parent.node_id;
			});
			var that = this;
			if (nodes.length > 0) {
				if (parent.node_id === 0) {
					tree = nodes;
				} else {
					parent['nodes'] = nodes;
				}
				nodes.forEach(function (child) {
					that.pasaratree(array, child);
				});
			}
			return tree;
		},

		openGetPath: function () {
			var buttonId = this.buttonIdSel;
			var path = this.pathButtonSel;
			var oView = this.getView();
			var vThat = this;
			var mapping_var = "";
			var metadata_var = "";
			var edit = "";
			var oModel = this.getOwnerComponent().getModel();
			var path2 = "/Di_Template_Mapping_Sources('" + this.code_id_filled + "')/text";
			var title1 = oModel.getProperty(path2);
			//var title1 = this.code_id_filled;
			var globalVar = "";
			if (buttonId.match("ButPathAttri")) {
				var pat = this.byId("PathAttribu").getValue();
			} else if (buttonId.match("ButPathEditAttri")) {
				var pat = this.byId("PathAttribuEdit").getValue();
				edit = "X";
			} else if (buttonId.match("pathGlobVar")) {
				var pat = this.byId("Value_GV").getValue();
				globalVar = "X";
			} else if (buttonId.match("pathMeta")) {
				metadata_var = "X";
				var property = path + "/code";
				var property2 = path + "/path";
				this.selectedVarMeta = this.getView().getModel("template").getProperty(property);
				var pat = this.getView().getModel("template").getProperty(property2);
			} else {
				mapping_var = "X";
				var property = path + "/slug";
				var property2 = path + "/path";
				this.selectedVar = this.getView().getModel("template").getProperty(property);
				var pat = this.getView().getModel("template").getProperty(property2);
			}

			// create dialog lazily
			if (!this.byId("treeTable")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.treeTable",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.addStyleClass(vThat.getOwnerComponent().getContentDensityClass());
					if (mapping_var == "X") {
						var title = title1 + ": " + vThat.selectedVar;
						oDialog.setTitle(title);
						vThat.byId("BtnAccept").setVisible(true);
						vThat.byId("BtnAccept2").setVisible(false);
						vThat.byId("BtnAccept3").setVisible(false);
						vThat.byId("BtnAccept4").setVisible(false);
						vThat.byId("BtnAccept5").setVisible(false);

					} else if (metadata_var == "X") {
						var title = title1 + ": " + vThat.selectedVarMeta;
						oDialog.setTitle(title);
						vThat.byId("BtnAccept").setVisible(false);
						vThat.byId("BtnAccept2").setVisible(false);
						vThat.byId("BtnAccept3").setVisible(false);
						vThat.byId("BtnAccept4").setVisible(false);
						vThat.byId("BtnAccept5").setVisible(true);
					} else if (globalVar == "X") {
						var title = title1;
						oDialog.setTitle(title);
						vThat.byId("BtnAccept").setVisible(false);
						vThat.byId("BtnAccept2").setVisible(false);
						vThat.byId("BtnAccept3").setVisible(false);
						vThat.byId("BtnAccept4").setVisible(true);
						vThat.byId("BtnAccept5").setVisible(false);
					} else {
						var title = title1;
						oDialog.setTitle(title);
						if (edit != "X") {
							vThat.byId("BtnAccept2").setVisible(true);
							vThat.byId("BtnAccept").setVisible(false);
							vThat.byId("BtnAccept3").setVisible(false);
							vThat.byId("BtnAccept4").setVisible(false);
							vThat.byId("BtnAccept5").setVisible(false);
						} else {
							vThat.byId("BtnAccept3").setVisible(true);
							vThat.byId("BtnAccept").setVisible(false);
							vThat.byId("BtnAccept2").setVisible(false);
							vThat.byId("BtnAccept4").setVisible(false);
							vThat.byId("BtnAccept5").setVisible(false);
						}
					}
					oDialog.open();
					var oTreeTable = vThat.byId("TreeTableBasic1");
					oTreeTable.expandToLevel(3);
					var oInput = vThat.byId("pathTextArea");
					oInput.setValue(pat);
				});
			} else {
				if (mapping_var == "X") {
					var title = title1 + ": " + vThat.selectedVar;
					this.byId("treeTable").setTitle(title);
					this.byId("BtnAccept").setVisible(true);
					this.byId("BtnAccept2").setVisible(false);
					this.byId("BtnAccept3").setVisible(false);
					this.byId("BtnAccept4").setVisible(false);
					this.byId("BtnAccept5").setVisible(false);
				} else if (metadata_var == "X") {
					var title = title1 + ": " + vThat.selectedVarMeta;
					this.byId("treeTable").setTitle(title);
					this.byId("BtnAccept").setVisible(false);
					this.byId("BtnAccept2").setVisible(false);
					this.byId("BtnAccept3").setVisible(false);
					this.byId("BtnAccept4").setVisible(false);
					this.byId("BtnAccept5").setVisible(true);
				} else if (globalVar == "X") {
					var title = title1;
					this.byId("treeTable").setTitle(title);
					this.byId("BtnAccept").setVisible(false);
					this.byId("BtnAccept2").setVisible(false);
					this.byId("BtnAccept3").setVisible(false);
					this.byId("BtnAccept4").setVisible(true);
					this.byId("BtnAccept5").setVisible(false);
				} else {
					if (edit != "X") {
						this.byId("BtnAccept2").setVisible(true);
						this.byId("BtnAccept").setVisible(false);
						this.byId("BtnAccept3").setVisible(false);
						this.byId("BtnAccept4").setVisible(false);
						this.byId("BtnAccept5").setVisible(false);
					} else {
						this.byId("BtnAccept3").setVisible(true);
						this.byId("BtnAccept2").setVisible(false);
						this.byId("BtnAccept").setVisible(false);
						this.byId("BtnAccept4").setVisible(false);
						this.byId("BtnAccept5").setVisible(false);
					}
					var title = title1;
					this.byId("treeTable").setTitle(title);
				}
				this.byId("treeTable").open();
				var oInput = vThat.byId("pathTextArea");
				oInput.setValue(pat);
			}
		},
		onCloseTableTree: function (oObject) {
			var oInput = this.byId("pathTextArea");
			var oClear = "";
			oInput.setValue(oClear);
			this.byId("treeTable").close();
		},
		// filterNode: function (oEvent) {
		// 	var sQuery = oEvent.getParameter("query");
		// 	var BPMode = this.getOwnerComponent().getModel("jerarquia");
		// 	var XSDModel = this.getOwnerComponent().getModel("xsd");
		// 	//const input = XSDModel.getData();
		// 	const array = [...XSDModel.getData()];

		// 	// var oFilterDescription = new sap.ui.model.Filter("_name",
		// 	// 	sap.ui.model.FilterOperator.StartsWith, sQuery);

		// 	// var oView = this.getView();
		// 	// var oTreeTable = oView.byId("TreeTableBasic1");
		// 	// var aTreeTableRows = oTreeTable.getBinding("rows");
		// 	// oTreeTable.expandToLevel(4);
		// 	// aTreeTableRows.filter([oFilterDescription]);
		// 	var res = array.filter(function f(o) {
		// 		if (o.fieldname.includes(sQuery)) return true
		// 		if (o.nodes) {
		// 			return (o.nodes = o.nodes.filter(f)).length
		// 		}
		// 	});
		// 	BPMode.setData({
		// 		nodeRoot: {
		// 			nodes: res
		// 		}
		// 	});

		// },

		applySearch1: function () {
			var oIndexArray = this.getView().getModel("SearchIndex").getData();

			var oView = this.getView();
			var oTreeTable = oView.byId("TreeTableBasic1");

			oIndex++;
			if (oIndex < oIndexArray.length) {
				var auxIndex = oIndexArray[oIndex];

				oTreeTable.setSelectedIndex(auxIndex);
				oTreeTable.setFirstVisibleRow(auxIndex);
				//oIndex++;
				sap.m.MessageToast.show("Search :" + (oIndex + 1) + "/" + oIndexArray.length);

			} else {
				//sap.m.MessageToast.show("No more coincidence for the requested search.");
				oIndex--;
				sap.m.MessageToast.show("No further matches for this search string.");
			}
		},

		applySearch2: function () {
			var oIndexArray = this.getView().getModel("SearchIndex").getData();

			var oView = this.getView();
			var oTreeTable = oView.byId("TreeTableBasic1");

			oIndex--;
			if (oIndex > -1) {
				var auxIndex = oIndexArray[oIndex];

				oTreeTable.setSelectedIndex(auxIndex);
				oTreeTable.setFirstVisibleRow(auxIndex);
				//oIndex--;
				sap.m.MessageToast.show("Search :" + (oIndex + 1) + "/" + oIndexArray.length);

			} else {
				//sap.m.MessageToast.show("No more coincidence for the requested search.");
				oIndex++;
				sap.m.MessageToast.show("No further matches for this search string.");
			}
		},

		matchRuleShort: function (str, rule) {
			var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
			return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
		},

		filterNode1: function (oEvent) {
			var sQuery = oEvent.getParameter("query");
			oQuery = sQuery;

			var oView = this.getView();
			var oTreeTable = oView.byId("TreeTableBasic1");
			//var oTreeModel = this.getView().getModel("ModelTreeTable").getData();
			//var oRawModel = this.getView().getModel("RawModel").getProperty("/value/");
			var oRawData = this.getModel("RawModel").getData();
			oTreeTable.expandToLevel(15);
			var oIndexArray = [];

			for (var i = 0; i < oRawData.length; i++) {
				var oContext = oTreeTable.getContextByIndex(i);
				if (oContext) {
					//if (this.matchRuleShort(oContext.getObject().fieldname.toLowerCase(), sQuery.toLowerCase())) {
					//	oIndexArray.push(i);
					//}
					if (oContext.getObject().fieldname.toLowerCase().includes(sQuery.toLowerCase())) {
						oIndexArray.push(i);
					}
				}
			}

			if (oIndexArray.length !== 0) {
				var oSearchIndex = new JSONModel();
				oSearchIndex.setData(oIndexArray);
				this.getView().setModel(oSearchIndex, "SearchIndex");

				oTreeTable.setSelectedIndex(oIndexArray[0]);
				oTreeTable.setFirstVisibleRow(oIndexArray[0]);
				oIndex = 0;

				sap.m.MessageToast.show("Search :" + (oIndex + 1) + "/" + oIndexArray.length);

			} else {
				if (sQuery !== "") {
					var oIndex2Clear = [];
					var oModel2Clear = new JSONModel();
					oModel2Clear.setData(oIndex2Clear);
					this.getView().setModel(oModel2Clear, "SearchIndex");

					//sap.m.MessageToast.show('No coincidence for this criteria.');
					sap.m.MessageToast.show('No match for this search string.');
				}
			}
		},

		filterNode: function (oEvent) {
			var sQuery = oEvent.getParameter("query");
			oQuery = sQuery;

			// var oFilterDescription = new sap.ui.model.Filter("fieldname",
			// 	sap.ui.model.FilterOperator.Contains, sQuery);

			var oView = this.getView();
			var oTreeTable = oView.byId("TreeTableBasic1");
			//var aTreeTableRows = oTreeTable.getBinding("rows");
			//aTreeTableRows.filter([oFilterDescription]);

			var oTest = this.getView().getModel("jerarquia").getData();

			oTreeTable.expandToLevel(15);
			var oIndexArray = [];
			//var oArray = this.getView().getModel("RawModel").getProperty("/value/");
			var oArray = this.getModel("RawModel").getData();
			for (var i = 0; i < oArray.length; i++) {
				if (oArray[i].fieldname.includes(sQuery) && sQuery != "") {
					oIndexArray.push(oArray[i].node_id);
				}
			}

			if (oIndexArray.length != 0) {
				var oSearchIndex = new JSONModel();
				oSearchIndex.setData(oIndexArray);
				this.getView().setModel(oSearchIndex, "SearchIndex");

				var auxIndex = oIndexArray[0] - 2;
				if (auxIndex < 0) {
					auxIndex = 0;
				}

				while (auxIndex != -1) {
					var oContext = oTreeTable.getContextByIndex(auxIndex);
					if (oContext.getObject().fieldname.includes(sQuery)) {
						oTreeTable.setSelectedIndex(auxIndex);
						oTreeTable.setFirstVisibleRow(auxIndex);
						oIndex = 1;
						break;
					} else {
						auxIndex = auxIndex - 1;
					}
				}

			} else {
				if (sQuery != "") {
					sap.m.MessageToast.show('No coincidence for this criteria.');
				}
			}
		},

		onMap: function (oEvent) {
			var oInput = this.getView().byId("pathTextArea");
			var oNewPath = oInput.getValue();
			var data = this.getModel("template").getData();
			var variable = data.variables.find(variable => variable.slug === this.selectedVar);
			variable.path = oNewPath;
			variable.source = this.code_id_filled;
			this.getModel("template").setData(data);
			this.getModel("template").refresh();
			this.byId("treeTable").close();
		},

		onMap5: function (oEvent) {
			var oInput = this.getView().byId("pathTextArea");
			var oNewPath = oInput.getValue();
			var data = this.getModel("template").getData();
			var variable = data.metadata.find(metadata => metadata.code === this.selectedVarMeta);
			variable.path = oNewPath;
			variable.source = this.code_id_filled;
			this.getModel("template").setData(data);
			this.getModel("template").refresh();
			this.byId("treeTable").close();
		},

		onMap2: function (oEvent) {
			var oInput = this.getView().byId("pathTextArea");
			var oNewPath = oInput.getValue();
			this.byId("PathAttribu").setValue(oNewPath);
			this.byId("treeTable").close();
		},

		onMap3: function (oEvent) {
			var oInput = this.getView().byId("pathTextArea");
			var oNewPath = oInput.getValue();
			this.byId("PathAttribuEdit").setValue(oNewPath);
			this.byId("treeTable").close();
		},

		onMap4: function (oEvent) {
			var oInput = this.getView().byId("pathTextArea");
			var oNewPath = oInput.getValue();
			this.byId("Value_GV").setValue(oNewPath);
			this.byId("Source_GV").setValue(this.code_id_filled);
			this.byId("treeTable").close();
		},

		onCollapseAll: function () {
			var oTreeTable = this.byId("TreeTableBasic1");
			oTreeTable.collapseAll();
		},

		onCollapseSelection: function () {
			var oTreeTable = this.byId("TreeTableBasic1");
			oTreeTable.collapse(oTreeTable.getSelectedIndices());
		},

		onExpandFirstLevel: function () {
			var oTreeTable = this.byId("TreeTableBasic1");
			oTreeTable.expandToLevel(1);
		},
		onExpandSelection: function (oEvent) {
			var oTreeTable = this.byId("TreeTableBasic1");
			oTreeTable.expand(oTreeTable.getSelectedIndices());
			var oIndex = oTreeTable.getSelectedIndex();
			var oPath = oTreeTable.getRows()[oIndex].oBindingContexts.ModelTreeTable1.sPath;
			var oInput = this.getView().byId("input0");
			oInput.setValue(oPath);
		},

		onExpandAll: function (oEvent) {
			var oView = this.getView();
			var oTreeTable = oView.byId("TreeTableBasic1");
			oTreeTable.expandToLevel(15);
		},
		getPath: function (oEvent) {
			var oTreeTable = this.byId("TreeTableBasic1");
			var oIndex = oTreeTable.getSelectedIndex();
			if (oIndex === -1) {
				sap.m.MessageToast.show('Please, select a node to get the path.');
			} else {
				var oPath = oTreeTable.getContextByIndex(oIndex).getPath();
				var oSplit = oPath.split("/");
				var oNewPath = "/";
				var oRoot = "/";
				var oText;
				for (var i = 1; i < oSplit.length; i++) {
					if (/^\d+$/.test(oSplit[i])) {
						oRoot = oRoot + oSplit[i] + "/";
						oText = this.getView().getModel("jerarquia").getProperty(oRoot + "fieldname");
						oNewPath = oNewPath + oText + "/";
					} else {
						//oNewPath = oNewPath + oSplit[i] + "/";
						oRoot = oRoot + oSplit[i] + "/";
					}
				}
				oNewPath = oNewPath.slice(0, -1);

				//	var oInput = this.getView().byId("pathInput");
				var oInput = this.getView().byId("pathTextArea");
				var oOldPath = oInput.getValue();
				oNewPath = oOldPath + oNewPath;
				oInput.setValue(oNewPath);
				// var data = this.getModel("template").getData();
				// var variable = data.variables.find(variable => variable.slug === this.selectedVar);
				// variable.path = oNewPath;
				// this.getModel("template").setData(data);
				// this.getModel("template").refresh();
			}
		},

	});

});
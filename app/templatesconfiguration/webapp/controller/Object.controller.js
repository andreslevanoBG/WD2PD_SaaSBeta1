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

		/* Al instanciar el objeto */
		onInit: function () {
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
			this.pages_pre = [];
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
			this.typeGVEdit = "";
			this.oldFilters = [];
			this.oSemanticPage = this.byId("pageSemantic");
			this.showCustomActions(false);
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			var templateMod = this.getModel("template");
			this.getView().setModel(templateMod, "template");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			var oModelXML = new XMLModel();
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
			var text = this.getResourceBundle().getText("lastDay");
			item.text = text;
			item.key = "last_day";
			data.push(item);
			daysModel.setData(data);
			this.setModel(daysModel, "days");
			var oModelTime = this.getOwnerComponent().getModel("timezones");
			oModelTime.setSizeLimit(1000);
		},

		/* Evento al matchear el objeto seleccionado */
		_onObjectMatched: function (oEvent) {
			this.initModels();
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", true);
			var sObjectId = oEvent.getParameter("arguments").objectId;
			var version = oEvent.getParameter("arguments").version;
			var sObjectPath = "templates/" + sObjectId + "," + version;
			var oTempModel = this.getModel("templates");
			var templates = oTempModel.getData();
			if (!Array.isArray(templates)) {
				this.sleep(7000).then(() => {
					this._bindView(sObjectId, version);
				});
			} else {
				this._bindView(sObjectId, version);
			}
		},

		/* Función para esperar unos segundos */
		sleep: function (ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		},

		/* Bindeamos la vista al objeto seleccionado con sus detalles */
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
				oDocTypesModel = this.getModel("doctypes"),
				oPagesModel = this.getModel("pages");
			var templates = oTempModel.getData();
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
			var aFilter = [];
			var templateFil = new sap.ui.model.Filter("template_id", sap.ui.model.FilterOperator.EQ, temp.id);
			var templateVers = new sap.ui.model.Filter("template_version", sap.ui.model.FilterOperator.EQ, temp.active_version);
			aFilter.push(templateFil);
			aFilter.push(templateVers);
			oViewModel.refresh();
			var head = {};
			var sPath = "/Di_Template";
			/* Recuperamos la info de la template seleccionada de persistencia 
			con todos los objetos asociados */
			oModel.read(sPath, {
				filters: aFilter,
				success: function (oData, oResponse) {
					var results = oData.results[0];
					delete oData.__metadata;
					if (results) {
						that.byId("carouselContainer").setBusy(true);
						that.byId("carouselContainer").setShowPageIndicator(false);
						that.pages_pre = [];
						oModel.callFunction(
							"/get_pages", {
								method: "GET",
								urlParameters: {
									uuidtemp: results.uuid,
									pack: 0
								},
								success: that.successGetPages.bind(that),
								error: that.errorGetPages.bind(that)
							});

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
								"$expand": "business_process,mappings,sign_cfg,planning/integs_plan_d,planning/adata,planning_rep/integs_plan_d,planning_rep/adata,attributes/values_attr"
							},
							//groupId: "hoadkldfla", 
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
								}
								if (planning_rep) {
									that.exist_plan_Rep = "X";
									if (planning_rep.enable) {
										planning_rep.enable = "A";
									} else {
										planning_rep.enable = "U";
									}
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
										time_start: "00:00:00",
										time_end: "23:59:00",
										time_zone: "UTC"
									};
									planning_rep = {
										comments: "",
										enable: "U"
									};
									planning_rep.plan_d = datanewPlan;
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
								if (sign_conf) {
									var signData = JSON.parse(sign_conf.json_cfg);
									signData.uuid = sign_conf.uuid;
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
						/* Si no existe la template configurada */
						var url = "/CPI-WD2PD_Dest/di/templates/template/detail";
						var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
						var langu = sCurrentLocale + "-" + sCurrentLocale;
						url = url + "?Template-Id=" + temp.id + "&Template-Version=" + temp.active_version + "&Template-Language=" + langu;
						if (that.getOwnerComponent().settings) {
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
									var pages_pre = [];
									if (results.pages_preview) {
										for (var i = 0; i < results.pages_preview.length; i++) {
											var item = {};
											item.content = "data:image/png;base64," + results.pages_preview[i].base64;
											item.page = results.pages_preview[i].page;
											//results.pages_preview[i].base64 = "data:image/png;base64," + results.pages_preview[i].base64;
											pages_pre.push(item);
										}
										delete results.pages_preview;
									} else {
										//	results.pages_preview = [];
									}
									if (results.variables && Array.isArray(results.variables)) {
										for (var j = 0; j < results.variables.length; j++) {
											results.variables[j].path = "";
											results.variables[j].map = "";
											results.variables[j].type = "";
											results.variables[j].source = "";
											results.variables[j].metadata = "";
										}
										var scount = results.variables.length;
									} else {
										var scount = 0;
									}
									results.id = temp.id;
									results.description = temp.description;
									results.title = temp.title;
									results.updated_at = temp.updated_at;
									results.deprecated = temp.deprecated;
									results.base64 = "";
									var pag = {
										pages: pages_pre
									};
									oPagesModel.setData(pag);
									oPagesModel.refresh();
									oDataModel.setData(results);
									oDataModel.refresh();
									oViewModel.setProperty("/busy", false);
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

		successGetPages: function (oData) {
			var nextPack = oData.get_pages.next_pack;
			var uuidtemp = oData.get_pages.uuidtemp;
			var oModel = this.getOwnerComponent().getModel();
			var oPagesModel = this.getModel("pages");
			var that = this;
			if (nextPack == 0) {
				var pages_pre = oData.get_pages.pages;
				var pages_load = oPagesModel.getData();
				if (that.pages_pre.length == 0) {
					var pages_load = {};
					pages_load.pages = pages_pre;
					that.pages_pre = pages_pre;
				} else {
					that.pages_pre = that.pages_pre.concat(pages_pre);
					var pages_load = {};
					pages_load.pages = that.pages_pre;
				}
				pages_load.pages.sort(function (a, b) {
					return a.page - b.page
				});
				oPagesModel.setData(pages_load);
				oPagesModel.refresh();
				that.byId("carouselContainer").setBusy(false);
				that.byId("carouselContainer").setShowPageIndicator(true);
			} else {
				var pages_pre = oData.get_pages.pages;
				//var pages_load = oPagesModel.getData();
				if (that.pages_pre.length == 0) {
					var pages_load = {};
					pages_load.pages = pages_pre;
					that.pages_pre = pages_pre;
					oPagesModel.setData(pages_load);
					oPagesModel.refresh();
				} else {
					//	var new_pages = pages_load.pages.concat(pages_pre);
					that.pages_pre = that.pages_pre.concat(pages_pre);
					//pages_load.pages = new_pages;
				}
				//	pages_load.pages.sort(function (a, b) {
				//		return a.page - b.page
				//	});

				oModel.callFunction(
					"/get_pages", {
						method: "GET",
						urlParameters: {
							uuidtemp: uuidtemp,
							pack: nextPack
						},
						success: that.successGetPages.bind(that),
						error: that.errorGetPages.bind(that)
					});
			}
		},

		errorGetPages: function (oData) {

		},

		/* Al refrescar los objetos asociadas a la template */
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
					var temp = templates.find(template => template.id === that.template_id && template.active_version == that.template_version);
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

		/* Obtenemos los datos del cliente para poder llamar a CPI */
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

		/* Llamamos a CPI para chequear los valores de los mapeos para algún ejemplo */
		checkMappings: function (oEvent) {
			this.byId("tableChecks").setBusy(true);
			var dialogcheckMap = oEvent.getSource().getParent();
			var aInputs = [
					this.byId("CheckEmployee")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
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
						mapping_type: ckeckMapData[i].type,
						metadata: ckeckMapData[i].metadata,
						mapping_object: "TEMPL_MAPP"
					}
					mappings.push(item);
				}
			}
			var url = "/CPI-WD2PD_Dest/di/templates/template/mapping_test";
			if (this.getOwnerComponent().settings) {
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
								source: map.source,
								metadata: map.metadata,
								type: map.type
							};
							checkMaps.push(item);
						}
						for (var i = 0; i < results.mapping_error.length; i++) {
							var mapEr = ckeckMapData.find(mapData => mapData.variable === results.mapping_error[i].variable);
							var item_error = {
								variable: results.mapping_error[i].variable,
								error: "X",
								value: results.mapping_error[i].value,
								path: mapEr.path,
								source: mapEr.source,
								metadata: mapEr.metadata,
								type: mapEr.type
							};
							checkMaps.push(item_error);
						}
						checkMapModel.setData(checkMaps);
						checkMapModel.refresh();
						that.byId("tableChecks").setBusy(false);
					},
					error: function (error) {
						var variables = ckeckMapData;
						var mappings = [];
						if (variables && Array.isArray(variables)) {
							for (var i = 0; i < variables.length; i++) {
								if (variables[i].path != "") {
									var item = {
										variable: variables[i].variable,
										error: "C",
										path: variables[i].path,
										source: variables[i].source,
										metadata: variables[i].metadata,
										type: variables[i].type,
										value: ""
									}
									mappings.push(item);
								}
							}
						}
						checkMapModel.setData(mappings);
						checkMapModel.refresh();
						var mensaje = JSON.parse(error.responseText).message_error.substring(66);
						sap.m.MessageToast.show(mensaje);
						that.byId("tableChecks").setBusy(false);
					}
				});
			}

		},

		/* Recuperamos de PeopleDoc las templates activas y las cruzamos con las templates
		configuradas en persistencia */
		call_Template_details: function (resultsPers, temp, mapCop, metaCop, uuidTemp, newTemp) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel("template"),
				oHeaderModel = this.getModel("header"),
				oDocTypesModel = this.getModel("doctypes"),
				oSignTypesModel = this.getModel("signtypes");
			if (newTemp == "X") {
				this.pages_pre = Object.assign({}, oDataModel.getData().pages_preview);
			}
			var that = this;
			var head = oHeaderModel.getData();
			var url = "/CPI-WD2PD_Dest/di/templates/template/detail";
			var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
			var langu = sCurrentLocale + "-" + sCurrentLocale;
			url = url + "?Template-Id=" + temp.id + "&Template-Version=" + temp.active_version + "&Template-Language=" + langu;
			if (this.getOwnerComponent().settings) {
				var sendPage = false;
				// if (newTemp != "X") {
				// 	if (resultsPers.pages.results) {
				// 		if (resultsPers.pages.results.length == 0) {
				// 			sendPage = true;
				// 		}
				// 	} else {
				// 		sendPage = true;
				// 	}
				// }
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
						//if (newTemp === "X") {
						//	var pages = that.getModel("template").getData().pages_preview;
						//	results.pages_preview = that.pages_pre;
						//}
						// if (sendPage) {
						// 	if (results.pages_preview) {
						// 		for (var i = 0; i < results.pages_preview.length; i++) {
						// 			results.pages_preview[i].base64 = "data:image/png;base64," + results.pages_preview[i].base64;
						// 		}
						// 	} else {
						// 		results.pages_preview = [];
						// 	}
						// } else if (newTemp === "X") {
						// 	//var pages = that.getModel("template").getData().pages_preview;
						// 	results.pages_preview = that.pages_pre;
						// } else {
						// 	if (resultsPers.pages.results) {
						// 		results.pages_preview = resultsPers.pages.results;
						// 		results.pages_preview.sort(function (a, b) {
						// 			return a.page - b.page
						// 		});
						// 		if (results.pages_preview) {
						// 			for (var i = 0; i < results.pages_preview.length; i++) {
						// 				results.pages_preview[i].base64 = results.pages_preview[i].content;
						// 				delete results.pages_preview[i].content;
						// 			}
						// 		} else {
						// 			results.pages_preview = [];
						// 		}
						// 	}
						// }
						if (resultsPers.mappings) {
							if (results.variables && Array.isArray(results.variables)) {
								for (var j = 0; j < results.variables.length; j++) {
									var variablePers = resultsPers.mappings.find(mapping => mapping.variable === results.variables[j].slug);
									if (variablePers) {
										results.variables[j].source = variablePers.source;
										results.variables[j].type = variablePers.mapping_type;
										results.variables[j].metadata = variablePers.metadata;
										results.variables[j].path = variablePers.mapping;
										if (results.variables[j].path === "") {
											results.variables[j].map = "";
										} else {
											results.variables[j].map = "X";
										}
									} else {
										results.variables[j].path = "";
										results.variables[j].map = "";
										results.variables[j].source = "";
										results.variables[j].type = "";
										results.variables[j].metadata = "";
									}
								}
								var scount = results.variables.length;
							} else {
								var scount = 0;
							}
						}
						if (resultsPers.metadata) {
							if (results.metadata && Array.isArray(results.metadata)) {
								for (var j = 0; j < results.metadata.length; j++) {
									var metadataPers = resultsPers.metadata.find(meta => meta.variable === results.metadata[j].code);
									if (metadataPers) {
										results.metadata[j].source = metadataPers.source;
										results.metadata[j].type = metadataPers.mapping_type;
										results.metadata[j].metadata = metadataPers.metadata;
										results.metadata[j].path = metadataPers.mapping;
										if (results.metadata[j].path === "") {
											results.metadata[j].map = "";
										} else {
											results.metadata[j].map = "X";
										}
									} else {
										results.metadata[j].path = "";
										results.metadata[j].map = "";
										results.metadata[j].source = "";
										results.metadata[j].type = "";
										results.metadata[j].metadata = "";
									}
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

		/* Abrimos el dialog para la gestión de los valores de los filtors */
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

		/* Al querer añadir un nuevo firmante en la configuración de la firma */
		addSigner: function (oEvent) {
			var oSignatureModel = this.getModel("signature");
			var signData = oSignatureModel.getData();
			var signers = signData.signers;
			var order = signers.length + 1;
			var oSignerModel = this.getModel("signer");
			var signerData = oSignerModel.getData();
			signerData = {
				type: "organization",
				signing_order: order
			};
			oSignerModel.setData(signerData);
			oSignerModel.refresh();
			if (!this.byId("newSigner")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.newSigner",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("newSigner").open();
			}
		},

		/* Al querer visualizar los datos de un firmante configurado */
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
				var item = this.byId("Signature_Type_Dis").getItemByKey(signer.type);
				var params = {
					selectedItem: item
				};
				this.byId("Signature_Type_Dis").fireChange(params);
				this.byId("dispSigner").open();
			}
		},

		/* Al querer editar los datos de un firmante configurado */
		editSigner: function (oEvent) {
			var oSignerModel = this.getModel("signer");
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("signature").getPath();
			var signatModel = this.getModel("signature");
			var signatData = signatModel.getData();
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
				var item = this.byId("Signature_Type_Edit").getItemByKey(signer.type);
				var params = {
					selectedItem: item
				};
				this.byId("Signature_Type_Edit").fireChange(params);
				this.byId("editSigne").open();
			}
		},

		/* Abrimos el pop-up para hacer gestionar el chequeo de los mapeos de variables */
		onCheckMap: function (oEvent) {
			var checkMapModel = this.getModel("checkMap");
			var ckeckMapData = checkMapModel.getData();
			var oDataModel = this.getModel("template");
			var variables = oDataModel.getData().variables;
			var mappings = [];
			var that = this;
			if (variables && Array.isArray(variables)) {
				for (var i = 0; i < variables.length; i++) {
					//	if (variables[i].path != "" && variables[i].type != "CTE") {
					if (variables[i].path != "") {
						var item = {
							variable: variables[i].slug,
							path: variables[i].path,
							source: variables[i].source,
							type: variables[i].type,
							metadata: variables[i].metadata,
							error: "C",
							value: ""
						}
						mappings.push(item);
					}
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
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					var text1 = this.getResourceBundle().getText("checkMap");
					oDialog.setTitle(text1);
					var text2 = this.getResourceBundle().getText("noMapCheck");
					this.byId("tableChecks").setNoDataText(text2);
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("CheckEmployee").setValue("");
				this.byId("CheckEmployee").setValueState("None");
				var text1 = this.getResourceBundle().getText("checkMap");
				this.byId("checkMap").setTitle(text1);
				var text2 = this.getResourceBundle().getText("noMapCheck");
				this.byId("tableChecks").setNoDataText(text2);
				this.byId("checkMap").open();
			}
		},

		/* Abrimos el pop-up para hacer gestionar el chequeo de los mapeos de metadatas */
		onCheckMapMeta: function (oEvent) {
			var checkMapModel = this.getModel("checkMap");
			var ckeckMapData = checkMapModel.getData();
			var oDataModel = this.getModel("template");
			var metadata = oDataModel.getData().metadata;
			var metadatas = [];
			var that = this;
			for (var i = 0; i < metadata.length; i++) {
				//	if (metadata[i].path != "" && metadata[i].type != "CTE") {
				if (metadata[i].path != "") {
					var item = {
						variable: metadata[i].code,
						path: metadata[i].path,
						source: metadata[i].source,
						type: metadata[i].type,
						metadata: metadata[i].metadata,
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
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					var text2 = this.getResourceBundle().getText("noMetaCheck");
					this.byId("tableChecks").setNoDataText(text2);
					var text1 = this.getResourceBundle().getText("checkMeta");
					oDialog.setTitle(text1);
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("CheckEmployee").setValue("");
				this.byId("CheckEmployee").setValueState("None");
				var text1 = this.getResourceBundle().getText("checkMap");
				this.byId("checkMap").setTitle(text1);
				var text2 = this.getResourceBundle().getText("noMapCheck");
				this.byId("tableChecks").setNoDataText(text2);
				this.byId("checkMap").open();
			}
		},

		/* Al seleccionar la página de la template sobre la que se quiere firmar */
		pressPage: function (oEvent) {
			this.byId("cancelBtnCoord").setVisible(false);
			var src = oEvent.getSource().getSrc();
			var page = oEvent.getSource().getParent().getActivePage();
			var splits = page.split('-');
			var indice = parseInt(splits[splits.length - 1]);
			var page = indice + 1;
			this.byId("carouselContainerCoordenates").setVisible(false);
			var num_pages = this.byId("carouselContainerCoordenates").getPages().length;
			if (page == num_pages) {
				page = "";
			}
			this.byId("imagePage").setVisible(true);
			var imag = this.byId("imagePage");
			this.stepCoordenates = 2;
			this.byId("ScrollCoordenates").scrollTo(0, 0);
			var text2 = this.getResourceBundle().getText("step2Coord");
			this.byId("messageCoord").setText(text2);
			imag.setSrc(src);
			var oSignerModel = this.getModel("signer");
			var signerData = oSignerModel.getData();
			var item = {
				page: page
			};
			signerData.generate_pdf_sign_field = Object.assign({}, item);
			oSignerModel.setData(signerData);
			oSignerModel.refresh();
		},

		/* Al seleccionar las coordenadas de las esquinas de la zona sobre las que irá la firma en la template */
		selectCoordenates: function (oEvent) {
			var that = this;
			if (!this.byId("imagen")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.imageSign",
					controller: this
				}).then(function (oDialog) {
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
									var text3 = that.getResourceBundle().getText("step3Coord");
									that.byId("messageCoord").setText(text3);
									signerData.generate_pdf_sign_field.llx = llx;
									signerData.generate_pdf_sign_field.lly = lly;
									oSignerModel.setData(signerData);
									oSignerModel.refresh();
								} else if (step == 3) {
									var offset = $(this).offset();
									var relativeX = (e.pageX - offset.left);
									var relativeY = (e.pageY - offset.top);
									var urx = Math.round(relativeX);
									var ury = Math.round(this.height - relativeY);
									that.stepCoordenates = 1;
									$(".position").val("afaf");
									that.byId("carouselContainerCoordenates").setVisible(true);
									that.byId("imagePage").setVisible(false);
									that.byId("imagePage").setSrc("");
									var text1 = that.getResourceBundle().getText("step1Coord");
									that.byId("messageCoord").setText(text1);
									signerData.generate_pdf_sign_field.urx = urx;
									signerData.generate_pdf_sign_field.ury = ury;
									oSignerModel.setData(signerData);
									oSignerModel.refresh();
									var dialog = that.byId("imagen");
									dialog.close();
								}
							});
						}
					});
					var mesStrip = this.byId("messageCoord");
					var scroll = this.byId("ScrollCoordenates");
					if (scroll) {
						jQuery.sap.delayedCall(0, null, function () {
							scroll.scrollToElement(mesStrip);
						});

					}
					oDialog.open();
				}.bind(this));
			} else {
				var paginas = this.byId("carouselContainerCoordenates").getPages();
				this.byId("carouselContainerCoordenates").setActivePage(paginas[0]);
				this.byId("cancelBtnCoord").setVisible(true);
				this.byId("imagen").open();
				var mesStrip = this.byId("messageCoord");
				var scroll = this.byId("ScrollCoordenates");
				if (scroll) {
					scroll.scrollToElement(mesStrip);
				}
			}
		},

		/* Al cancelar la selección de la zona para firmar */
		cancelImage: function (oEvent) {
			this.byId("carouselContainerCoordenates").setVisible(true);
			this.byId("imagePage").setVisible(false);
			this.byId("imagePage").setSrc("");
			this.stepCoordenates = 1;
			var dialogNewAttr = oEvent.getSource().getParent();
			dialogNewAttr.close();
		},

		/* Al querer añadir un nuevo atributo */
		onAddAttr: function (oEvent) {
			if (!this.byId("newAttribute")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.newAttribute",
					controller: this
				}).then(function (oDialog) {
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

		/* Al querer añadir una nueva variable global, abrir pop-up de gestión */
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
					mapping_type2: 'EXPRE',
					mapping: ''
				};
				this.sourceGVEdit = "";
				this.typeGVEdit = "";
				oGVModel.setData(GVData);
				oGVModel.refresh();
			} else {
				action = "Edit";
				var oGVarModel = this.getModel("globalVar");
				var sPath = oEvent.getSource().getParent().getParent().getBindingContext("globalVar").getPath();
				var sPathSourc = sPath + "/source";
				var sPathSourc2 = sPath + "/mapping_type";
				var GVarData = oGVarModel.getData();
				this.sourceGVEdit = oGVarModel.getProperty(sPathSourc);
				this.typeGVEdit = oGVarModel.getProperty(sPathSourc2);
				var globalVariable = Object.assign({}, oGVarModel.getProperty(sPath));
				if (globalVariable.mapping_type == "LVA" || globalVariable.mapping_type == "CTE") {
					globalVariable.mapping_type2 = "XPATH";
				} else {
					globalVariable.mapping_type2 = globalVariable.mapping_type;
				}
				oGVModel.setData(globalVariable);
				oGVModel.refresh();
			}
			if (!this.byId("globalVariable")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.globalVar",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					if (action == "New") {
						this.byId("Name_GV").setEnabled(true);
						oDialog.setTitle("New Global Variable");
						var text = this.getResourceBundle().getText("newGloVar");
						oDialog.setTitle(text);
						this.byId("btonAddGV").setVisible(true);
						this.byId("btonEditGV").setVisible(false);
					} else {
						this.byId("Name_GV").setEnabled(false);
						var text = this.getResourceBundle().getText("editGloVar");
						oDialog.setTitle(text);
						this.byId("btonEditGV").setVisible(true);
						this.byId("btonAddGV").setVisible(false);
					}
					oDialog.open();
				}.bind(this));
			} else {
				if (action == "New") {
					this.byId("Name_GV").setEnabled(true);
					var text = this.getResourceBundle().getText("newGloVar");
					this.byId("globalVariable").setTitle(text);
					this.byId("btonAddGV").setVisible(true);
					this.byId("btonEditGV").setVisible(false);
				} else {
					this.byId("Name_GV").setEnabled(false);
					var text = this.getResourceBundle().getText("editGloVar");
					this.byId("globalVariable").setTitle(text);
					this.byId("btonEditGV").setVisible(true);
					this.byId("btonAddGV").setVisible(false);
				}
				this.byId("globalVariable").open();
			}
		},

		/* Cancelar la gestión de la variable global */
		cancelGVar: function (oEvent) {
			var dialogNewGV = oEvent.getSource().getParent();
			dialogNewGV.close();
		},

		/* Al editar una variable global */
		execEditGV: function (oEvent) {
			var aInputs = [
					this.byId("Name_GV"),
					this.byId("Value_GV")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
				return;
			}
			var that = this;
			var oGlobalVariModel = this.getModel("globalVari");
			var editData = oGlobalVariModel.getData();
			var uuid_GV = editData.uuid;
			var text = this.getResourceBundle().getText("sureGloVar");
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = "/Di_Template_Mappings(guid'" + uuid_GV + "')";
			var name = this.byId("Name_GV").getValue();
			var path = this.byId("Value_GV").getValue();
			var type = this.byId("Type_GV").getSelectedKey();
			var sourceGV = null;
			var metadataGV = null;
			if (type === "XPATH") {
				sourceGV = this.byId("Source_GV").getValue();
				if (sourceGV == "") {
					sourceGV = null;
				}
				var typeGV = editData.type;
				if (typeGV == 'LVA') {
					metadataGV = editData.metadata;
				}
			} else {
				typeGV = type;
			}
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var data = {
				variable: name,
				mapping_object: "GLOBAL_VAR",
				mapping_type: typeGV,
				template_uuid: uuidtemp,
				source: sourceGV,
				metadata: metadataGV,
				required: false,
				mapping: path
			};
			var oModel = that.getOwnerComponent().getModel();
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						oModel.update(sPath, data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								that.refreshGlobalVar(uuidtemp);
								that.byId("globalVariable").close();
								var text = that.getResourceBundle().getText("gloVarUpd");
								sap.m.MessageToast.show(text);
							},
							error: function (oError) {
								var text = that.getResourceBundle().getText("error");
								sap.m.MessageToast.show(text);
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al añadir una nueva variable global */
		addNewGV: function (oEvent) {
			var oGlobalVarModel = this.getModel("globalVar");
			var oGlobalVarData = oGlobalVarModel.getData();
			var oGlobalVariModel = this.getModel("globalVari");
			var oGlobalVariData = oGlobalVariModel.getData();
			var aInputs = [
					this.byId("Name_GV"),
					this.byId("Value_GV")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
				return;
			}
			var new_variable = aInputs[0].getValue();
			var var_exist = oGlobalVarData.find(GV => GV.variable === new_variable);
			if (var_exist) {
				var text = this.getResourceBundle().getText("gloVarExist");
				sap.m.MessageBox.alert(text);
				return;
			}
			var letterNumber = /^[0-9a-zA-Z-_]+$/;
			if (new_variable.match(letterNumber)) {

			} else {
				var text = this.getResourceBundle().getText("alpha");
				sap.m.MessageBox.alert(text);
				return;
			}
			var that = this;
			var name = this.byId("Name_GV").getValue();
			var path = this.byId("Value_GV").getValue();
			var type = this.byId("Type_GV").getSelectedKey();
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sourceGV = null;
			var metadataGV = null;
			if (type === "XPATH") {
				sourceGV = this.byId("Source_GV").getValue();
				if (sourceGV == "") {
					sourceGV = null;
				}
				var typeGV = oGlobalVariData.type;
				if (typeGV == 'LVA') {
					metadataGV = oGlobalVariData.metadata;
				}
			} else {
				typeGV = type;
			}
			var data = {
				variable: name,
				mapping_object: "GLOBAL_VAR",
				mapping_type: typeGV,
				template_uuid: uuidtemp,
				source: sourceGV,
				metadata: metadataGV,
				required: false,
				mapping: path
			};
			var oModel = that.getOwnerComponent().getModel();
			var text = that.getResourceBundle().getText("sureNewGloVar");
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						oModel.create("/Di_Template_Mappings", data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								that.refreshGlobalVar(uuidtemp);
								that.byId("globalVariable").close();
								var text = that.getResourceBundle().getText("gloVarCrea");
								sap.m.MessageToast.show(text);
							},
							error: function (oError) {
								var text = that.getResourceBundle().getText("error");
								sap.m.MessageToast.show(text);
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al crear un nuevo atributo de la template */
		createNewAttr: function (oEvent) {
			var aInputs = [
					this.byId("NameAttribu"),
					this.byId("DescAttribu"),
					this.byId("PathAttribu")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
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
			var text = that.getResourceBundle().getText("sureAttCrea");
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						oModel.create("/Di_Template_Worker_Attr", data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								that.refreshAttribFilters(uuidtemp);
								that.byId("newAttribute").close();
								var text = that.getResourceBundle().getText("attCrea");
								sap.m.MessageToast.show(text);
							},
							error: function (oError) {
								var text = that.getResourceBundle().getText("error");
								sap.m.MessageToast.show(text);
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al cerrar la visualización de los datos de un firmante */
		closeDisplaySigner: function (oEvent) {
			var dialogDisplaySigner = oEvent.getSource().getParent();
			dialogDisplaySigner.close();
		},

		/* Al cancelar la gestión de un nuevo firmante */
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

		/* Al cancelar de la edición de un firmante */
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

		/* Al cancelar la gestión de un nuevo atributo */
		cancelNewAttr: function (oEvent) {
			var dialogNewAttr = oEvent.getSource().getParent();
			dialogNewAttr.close();
		},

		/* Al cancelar la edición de un atributo */
		cancelEditAttr: function (oEvent) {
			var dialogEditAttr = oEvent.getSource().getParent();
			dialogEditAttr.close();
		},

		/* Al cancelar el chequeo de mapeos */
		cancelCheckMap: function (oEvent) {
			var dialogcheckMap = oEvent.getSource().getParent();
			dialogcheckMap.close();
		},

		/* Al refrescar las variables globales asociadas a la template */
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
				error: function (oError) {}
			});
		},

		/* Al refrescar los atributos asociados a una template */
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
					oFilterModel.setData(filData);
					oFilterModel.refresh();
					oAttrModel.setData(atrData);
					oAttrModel.refresh();
				},
				error: function (oError) {}
			});
		},

		/* Inicialización de los modelos asociados una template */
		initModels: function (oEvent) {
			var paginas = this.byId("carouselContainer").getPages();
			if (paginas[0]) {
				this.byId("carouselContainer").setActivePage(paginas[0]);
			}
			this.getView().getModel("pages").setData({
				pages: []
			});
			this.getView().getModel("pages").refresh();
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

		/* Al añadir un nuevo filtro para un atributo */
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

		/* Comparación de dos arrays */
		arraysEquals: function (array1, array2) {
			if (!array2)
				return false;
			if (array1.length != array2.length)
				return false;
			for (var i = 0, l = array1.length; i < l; i++) {
				if (array1[i] instanceof Array && array2[i] instanceof Array) {
					if (!array1[i].equals(array2[i]))
						return false;
				} else if (array1[i].value !== array2[i].value) {
					return false;
				}
			}
			return true;
		},

		/* Al cerrar la gestión de los atributos, indicando si se guardan los cambios */
		closeManageAttr: function (oEvent) {
			var oFilterModel = this.getModel("filters");
			var filtersData = oFilterModel.getData();
			var iguales = this.arraysEquals(this.oldFilters, filtersData);
			var dialogManage = oEvent.getSource().getParent();
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var text = this.getResourceBundle().getText("loseValues");
			var oViewModel = this.getModel("objectView");
			var that = this;
			var head = {};
			if (!iguales) {
				var tit = this.getResourceBundle().getText("confi");
				var yes = this.getResourceBundle().getText("yes");
				var no = this.getResourceBundle().getText("no");
				var dialog = new sap.m.Dialog({
					title: tit,
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: yes,
						press: function () {
							that.refreshAttribFilters(uuidtemp);
							dialog.close();
							dialogManage.close();
						}
					}),
					endButton: new sap.m.Button({
						text: no,
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

		/* Al cancelar la creación de un nuevo filtro */
		cancelNewFilter: function (oEvent) {
			var dialogNewFilter = oEvent.getSource().getParent();
			dialogNewFilter.close();
		},

		/* Al querer editar un atributo */
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

		/* Al guardar los cambios en la edición de un atributo */
		saveEditAttr: function (oEvent) {
			var aInputs = [
					this.byId("NameAttribuEdit"),
					this.byId("DescAttribuEdit"),
					this.byId("PathAttribuEdit")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
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
			var text = that.getResourceBundle().getText("sureEditAtt");
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = "/Di_Template_Worker_Attr(guid'" + uuid_attr + "')";
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						oModel.update(sPath, dataEdit, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								that.refreshAttribFilters(uuidtemp);
								that.byId("editAttribute").close();
								var text1 = that.getResourceBundle().getText("attUpd");
								sap.m.MessageToast.show(text1);
							},
							error: function (oError) {
								var text = that.getResourceBundle().getText("error");
								sap.m.MessageToast.show(text);
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al editar un filtro */
		editFil: function (oEvent) {
			oEvent.getSource().getParent().getParent().getCells()[0].setEnabled(true);
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("filters").getPath();
			var itemsModel = this.getModel("filters");
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
		},

		/* Al borrar un determinado atributo */
		deleteAttr: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("attributes").getPath();
			var itemsModel = this.getView().getModel("attributes");
			var oModel = this.getView().getModel();
			var sPath2 = sPath + "/uuid";
			var uuid = itemsModel.getProperty(sPath2);
			var sPath1 = "/Di_Template_Worker_Attr(guid'" + uuid + "')";
			var text = this.getResourceBundle().getText("sureAttDele");
			var that = this;
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						oModel.remove(sPath1, {
							success: function (oData, response) {
								that.refreshAttribFilters(uuidtemp);
								var text1 = that.getResourceBundle().getText("attDele");
								sap.m.MessageToast.show(text1);
							},
							error: function (oError) {
								var text = that.getResourceBundle().getText("error");
								sap.m.MessageToast.show(text);
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al ejecutar el copiado de unos determinados objetos de una template a otra */
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
			var text = that.getResourceBundle().getText("sureCopyTemp");
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				state: 'Warning',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
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
									var text1 = that.getResourceBundle().getText("copySucc");
									sap.m.MessageToast.show(text1);
								},
								error: function (oError) {
									dialogCopyTemp.close();
									oViewModel.setProperty("/busy", false);
									var text = that.getResourceBundle().getText("error");
									sap.m.MessageToast.show(text);
								}
							});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al querer borrar una planificación de reprocesamiento */
		deletePlanningRep: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var oPlanModelRep = this.getModel("planningRep");
			var that = this;
			var oViewModel = this.getModel("objectView");
			var oModel = this.getOwnerComponent().getModel();
			var text = that.getResourceBundle().getText("sureDelRep");
			var that = this;
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
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
									var text = that.getResourceBundle().getText("repPlanDel");
									sap.m.MessageToast.show(text);
								},
								error: function (oError) {
									oViewModel.setProperty("/busy", false);
									var text = that.getResourceBundle().getText("error");
									sap.m.MessageToast.show(text);
								}
							});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al querer copiar configuraciones de templates, abrimos el pop-up para su gestión */
		onCopyConfig: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidTemp = oHeaderModel.getData().uuid;
			if (!this.byId("copyConfigTemp")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.copyTemplate",
					controller: this
				}).then(function (oDialog) {
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

		/* Al cancelar el copiado de objetos entre templates */
		cancelCopyTemp: function (oEvent) {
			var dialogCopyTemp = oEvent.getSource().getParent();
			dialogCopyTemp.close();
		},

		/* Al borrar una variable global */
		deleteGlobalVar: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("globalVar").getPath();
			var itemsModel = this.getView().getModel("globalVar");
			var oModel = this.getView().getModel();
			var sPath2 = sPath + "/uuid";
			var uuid = itemsModel.getProperty(sPath2);
			var sPath1 = "/Di_Template_Mappings(guid'" + uuid + "')";
			var text = this.getResourceBundle().getText("sureDelGloVar");
			var that = this;
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						oModel.remove(sPath1, {
							success: function (oData, response) {
								that.refreshGlobalVar(uuidtemp);
								var text = that.getResourceBundle().getText("gloVarDel");
								sap.m.MessageToast.show(text);
							},
							error: function (oError) {
								var text = that.getResourceBundle().getText("error");
								sap.m.MessageToast.show(text);
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al borrar un firmante de la configuración de la firma */
		deleteSigner: function (oEvent) {
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("signature").getPath();
			var sPaths = sPath.split('/');
			var indice = parseInt(sPaths[sPaths.length - 1]);
			var itemsModel = this.getView().getModel("signature");
			var dataSign = itemsModel.getData();
			var text = this.getResourceBundle().getText("sureDelSigner");
			var that = this;
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						for (var i = indice + 1; i < dataSign.signers.length; i++) {
							dataSign.signers[i].signing_order = dataSign.signers[i].signing_order - 1;
						}
						dataSign.signers.splice(indice, 1);
						itemsModel.setData(dataSign);
						itemsModel.refresh();
						var text1 = that.getResourceBundle().getText("delSigner");
						sap.m.MessageToast.show(text1);
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al abrir una template que existe en People Doc pero no la tenemos configurada en persistencia */
		configNewTemp: function (oEvent) {
			if (!this.byId("newTemp")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.newTemplateConfig",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("newTemp").open();
			}
		},

		/* Al salvar los valores asignados a los filtros de un atributo */
		onSaveValues: function (oEvent) {
			var text = this.getResourceBundle().getText("sureSaveVal");
			var oViewModel = this.getModel("objectView");
			var that = this;
			var head = {};
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						oViewModel.setProperty("/busy", true);
						var attr_uuid = that.selectedAttr;
						that.deleteOldValuesCreateValues(attr_uuid);
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al guardar toda la configuración de la firma */
		saveSettingsSign: function () {
			var oSignTypesModel = this.getModel("signtypes");
			var singTypesData = oSignTypesModel.getData();
			var oSignatureModel = this.getModel("signature");
			var signData = oSignatureModel.getData();
			var signers = signData.signers;
			var typeSign = this.getView().byId("SignType").getSelectedKey();
			var oView = this.getView(),
				aInputs = [
					oView.byId("SignTitle"),
					oView.byId("SignReason"),
					oView.byId("SignLocation"),
					oView.byId("ExpDate")
				],
				bValidationError = false;
			if (oView.byId("SignType").getSelectedKey() === "") {
				oView.byId("SignType").setValueState("Error");
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
				return;
			} else {
				oView.byId("SignType").setValueState("None");
			}
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
				return;
			}
			if (signers.length < 1) {
				var text = this.getResourceBundle().getText("noEntSigner");
				sap.m.MessageBox.alert(text);
				return;
			}
			var typeSignData = singTypesData.find(styp => styp.id === typeSign);
			var signerOrg = "";
			for (var i = 0; i < signers.length; i++) {
				if (signers[i].type == "organization") {
					if (signerOrg == "X") {
						var texto = this.getResourceBundle().getText("onlySignerOrg");
						sap.m.MessageBox.alert(texto);
						return;
					}
					signerOrg = "X";
					if (signers[i].signing_order > 1) {
						var texto = this.getResourceBundle().getText("FirstSignerOrg");
						sap.m.MessageBox.alert(texto);
						return;
					}
				}
				if (typeSignData) {
					if (typeSignData.backend_code == "docusign_protect_and_sign") { //OPENTRUST
						if (!signers[i].generate_pdf_sign_field) {
							var text1 = this.getResourceBundle().getText("signer1");
							var text2 = this.getResourceBundle().getText("signer2");
							var texto = text1 + " " + signers[i].pdf_sign_field + " " + text2;
							sap.m.MessageBox.alert(texto);
							return;
						}
						if (signers[i].role_name) {
							delete signers[i].role_name;
						}
					} else if (typeSignData.backend_code == "docusign") { //DOCUSIGN
						if (!signers[i].role_name) {}
						if (signers[i].generate_pdf_sign_field) {
							delete signers[i].generate_pdf_sign_field;
						}
					}
				}
			}
			if (typeSignData) {
				if (typeSignData.delegation && signerOrg == "") {
					var texto = this.getResourceBundle().getText("orgSigner");
					sap.m.MessageBox.alert(texto);
					return;
				}
			}
			var oSignModel = this.getModel("signature");
			var uuidconfsign = oSignModel.getData().uuid;
			var text = this.getResourceBundle().getText("sureSaveSign");
			var oViewModel = this.getModel("objectView");
			var that = this;
			var head = {};
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
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
					text: no,
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

		/* Borramos la configuración anterior de la fima */
		deleteOldConfSignature: function (signconfuuid) {
			var that = this;
			var oViewModel = this.getModel("objectView");
			var oModel = this.getOwnerComponent().getModel();
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

		/* Subir firmantes en el orden */
		moveUp: function (oEvent) {
			var oTable = this.byId("tableSigners");
			var oSignatureModel = this.getModel("signature");
			var signData = oSignatureModel.getData();
			var signers = signData.signers;
			var selectedItem = oTable.getSelectedItem();
			var orderPath = selectedItem.getBindingContext("signature").getPath() + "/signing_order";
			var order = parseInt(this.getView().getModel("signature").getProperty(orderPath));
			if (order > 1) {
				signers[order - 2].signing_order = order;
				signers[order - 1].signing_order = order - 1;
				var temp = signers[order - 2];
				signers[order - 2] = signers[order - 1];
				signers[order - 1] = temp;
				oTable.removeSelections();
				var items = oTable.getItems();
				var itemId = items[order - 2].getId();
				oTable.setSelectedItemById(itemId);
			}
			oSignatureModel.setData(signData);
		},

		/* Bajar firmantes en el orden */
		moveBottom: function (oEvent) {
			var oTable = this.byId("tableSigners");
			var oSignatureModel = this.getModel("signature");
			var signData = oSignatureModel.getData();
			var signers = signData.signers;
			var selectedItem = oTable.getSelectedItem();
			var orderPath = selectedItem.getBindingContext("signature").getPath() + "/signing_order";
			var order = parseInt(this.getView().getModel("signature").getProperty(orderPath));
			if (order < signers.length) {
				signers[order - 1].signing_order = order + 1;
				signers[order].signing_order = order;
				var temp = signers[order - 1];
				signers[order - 1] = signers[order];
				signers[order] = temp;
				oTable.removeSelections();
				var items = oTable.getItems();
				var itemId = items[order].getId();
				oTable.setSelectedItemById(itemId);
			}
			oSignatureModel.setData(signData);
		},

		/* Creamos nueva configuración de la firma */
		createNewConfSignature: function () {
			var oSignatureModel = this.getModel("signature");
			var signData = oSignatureModel.getData();
			var signers = signData.signers;
			var that = this;
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
					var results = oData;
					var signData = JSON.parse(results.json_cfg);
					signData.uuid = results.uuid;
					oSignatureModel.setData(signData);
					oSignatureModel.refresh();
					var text = that.getResourceBundle().getText("signConfSave");
					sap.m.MessageToast.show(text);
				},
				error: function (oError) {
					var text = that.getResourceBundle().getText("error");
					sap.m.MessageToast.show(text);
				}
			});

		},

		/* Gestionamos los datos necesarios de firmantes, en este caso según seleccione las opciones de SMS */
		selectSMS: function (oEvent) {
			var selNot = this.byId("checkSMSnot").getSelected();
			var selAut = this.byId("checkSMSau").getSelected();
			if (selNot || selAut) {
				this.byId("Phone_number").setRequired(true);
			} else {
				this.byId("Phone_number").setRequired(false);
			}
		},

		/* Gestionamos la posibilidad de la edición del número de teléfono */
		selectSMS_Edit: function (oEvent) {
			var selNot = this.byId("checkSMSnot_Edit").getSelected();
			var selAut = this.byId("checkSMSau_Edit").getSelected();
			if (selNot || selAut) {
				this.byId("Phone_number_Edit").setRequired(true);
			} else {
				this.byId("Phone_number_Edit").setRequired(false);
			}
		},

		/* Borrar los valores de un atributo de la template */
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

		/*Al borrar un valor asignado a un atributo de la template */
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
			var text = this.getResourceBundle().getText("sureDelFil");
			var that = this;
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						if (uuid == "") {
							dataFil.splice(indice, 1);
							itemsModel.setData(dataFil);
							itemsModel.refresh();
						} else {
							oModel.remove(sPath1, {
								success: function (oData, response) {
									that.refreshAttribFilters(uuidtemp);
									var text = that.getResourceBundle().getText("valDele");
									sap.m.MessageToast.show(text);
								},
								error: function (oError) {
									var text = that.getResourceBundle().getText("error");
									sap.m.MessageToast.show(text);
								}
							});
						}
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Creamos un Batch para crear todos los valores asociados a un atributo */
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

		/* Creación de los valores de forma exitosa */
		successCreateBatchVal: function (oData, response) {
			var text = this.getResourceBundle().getText("valUpdSuc");
			sap.m.MessageToast.show(text);
			var oViewModel = this.getModel("objectView");
			var oHeaderModel = this.getModel("header");
			var uuidtemp = oHeaderModel.getData().uuid;
			this.refreshAttribFilters(uuidtemp);
			oViewModel.setProperty("/busy", false);
		},

		/* Error en la creación de los valores */
		errorCreateBatchVal: function (oError) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			var text = this.getResourceBundle().getText("error");
			sap.m.MessageToast.show(text);
		},

		/* Al guardar los mapeos de las variables */
		onSaveMap: function (oEvent) {
			var text = this.getResourceBundle().getText("sureSaveMapp");
			var oViewModel = this.getModel("objectView");
			var that = this;
			var head = {};
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						oViewModel.setProperty("/busy", true);
						var template_uuid = that.byId("template_uuid").getText();
						that.deleteOldMappingsCreateMappings(template_uuid, "");
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al guardar los mapeos de los metadatas */
		onSaveMeta: function (oEvent) {
			var text = this.getResourceBundle().getText("sureSaveMeta");
			var oViewModel = this.getModel("objectView");
			var that = this;
			var head = {};
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						oViewModel.setProperty("/busy", true);
						var template_uuid = that.byId("template_uuid").getText();
						that.deleteOldMappingsCreateMappingsMeta(template_uuid, "");
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Borramos los mapeos de variables existenes para crear los nuevos */
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

		/* Borramos los mapeos de metadatas existenes para crear los nuevos */
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

		/* Creamos un Batch para grabar todos los mapeos de variables */
		createBatchMappings: function (template_uuid, copy) {
			var oModel = this.getOwnerComponent().getModel();
			var oDataModel = this.getModel("template");
			var mappings = oDataModel.getData().variables;
			var sPath = "/Di_Template_Mappings";
			oModel.setDeferredGroups(["createGroup"]);
			var that = this;
			for (var i = 0; i < mappings.length; i++) {
				var oData = {};
				oData.template_uuid = template_uuid;
				oData.variable = mappings[i].slug;
				if (mappings[i].path == null) {
					mappings[i].path = "";
				}
				oData.mapping = mappings[i].path;
				oData.mapping_object = "TEMPL_MAPP";
				//	oData.mapping_type = "XPATH";
				oData.mapping_type = mappings[i].type;
				oData.metadata = mappings[i].metadata;
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

		/* Creamos un Batch para grabar todos los mapeos de metadatas */
		createBatchMappingsMeta: function (template_uuid, copy) {
			var oModel = this.getOwnerComponent().getModel();
			var oDataModel = this.getModel("template");
			var mappings = oDataModel.getData().metadata;
			var sPath = "/Di_Template_Mappings";
			oModel.setDeferredGroups(["createGroup"]);
			var that = this;
			for (var i = 0; i < mappings.length; i++) {
				var oData = {};
				oData.template_uuid = template_uuid;
				oData.variable = mappings[i].code;
				if (mappings[i].path == null) {
					mappings[i].path = "";
				}
				oData.mapping = mappings[i].path;
				oData.mapping_object = "DOCID_META";
				//	oData.mapping_type = "XPATH";
				oData.mapping_type = mappings[i].type;
				oData.metadata = mappings[i].metadata;
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

		successUpdateBatchMCopy: function (oData, response) {},

		errorUpdateBatchCopy: function (oError) {
			var text = that.getResourceBundle().getText("error");
			sap.m.MessageToast.show(text);
		},

		successUpdateBatchM: function (oData, response) {
			var text = this.getResourceBundle().getText("updMappSuc");
			sap.m.MessageToast.show(text);
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
		},

		errorUpdateBatch: function (oError) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			var text = this.getResourceBundle().getText("error");
			sap.m.MessageToast.show(text);

		},

		successUpdateBatchMCopyMeta: function (oData, response) {},

		errorUpdateBatchCopyMeta: function (oError) {
			var text = this.getResourceBundle().getText("error");
			sap.m.MessageToast.show(text);
		},

		successUpdateBatchMMeta: function (oData, response) {
			var text = this.getResourceBundle().getText("updMetaSuc");
			sap.m.MessageToast.show(text);
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
		},

		errorUpdateBatchMeta: function (oError) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			var text = that.getResourceBundle().getText("error");
			sap.m.MessageToast.show(text);
		},

		/* Guardamos la creación de un nuevo firmante */
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
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
				return;
			}
			var typeSign = this.byId("SignType").getSelectedKey();
			var typeSignData = singTypesData.find(styp => styp.id === typeSign);
			if (typeSignData) {
				if (typeSignData.backend_code == "docusign_protect_and_sign") { //OPENTRUST
					var llx = this.byId("llx").getValue();
					if (llx == "") {
						var text = this.getResourceBundle().getText("selCoordenates");
						sap.m.MessageBox.alert(text);
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

		/* Grabamos la edición de un firmante */
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
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
				return;
			}
			var typeSign = this.byId("SignType").getSelectedKey();
			var typeSignData = singTypesData.find(styp => styp.id === typeSign);
			if (typeSignData) {
				if (typeSignData.backend_code == "docusign_protect_and_sign") { //OPENTRUST
					var llx = this.byId("llx_Edit").getValue();
					if (llx == "") {
						var text = this.getResourceBundle().getText("selCoordenates");
						sap.m.MessageBox.alert(text);
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
			oSignatureModel.setData(signData);
			oSignatureModel.refresh();
			var dialogNewSigner = oEvent.getSource().getParent();
			dialogNewSigner.close();
		},

		/* Gestión sobre el cambio de la fecha en firmante */
		changeExpDate: function (oEvent) {
			var value = parseInt(oEvent.getParameter("value"));
			if ((value > 365 || value < 1) && value != "") {
				oEvent.getSource().setValue(this.oldExpDate);
			} else {
				this.oldExpDate = value;
			}
		},

		/* Grabar un nueva configuración de template */
		execNewTemp: function (oEvent) {
			var oFilterModel = this.getModel("filters"),
				oAttrModel = this.getModel("attributes"),
				oPlanModel = this.getModel("planning"),
				oPlanModelRep = this.getModel("planningRep"),
				oGlobalVarModel = this.getModel("globalVar"),
				oSignatureModel = this.getModel("signature");
			var oView = this.getView(),
				aInputs = [
					oView.byId("DocTitle"),
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
				return;
			}
			var bp = oView.byId("BusinessProcess").getSelectedKey();
			if (bp == "") {
				var text = this.getResourceBundle().getText("busProcReq");
				sap.m.MessageBox.alert(text);
				return;
			}
			var active = false;
			var segSig = oView.byId("SegButSig").getSelectedKey();
			var signature = false;
			if (segSig == 'A') {
				signature = true;
			}
			var title = oView.byId("DocTitle").getValue();
			var doctype = oView.byId("Doc_Types").getSelectedKey();
			if (doctype == "") {
				var text = this.getResourceBundle().getText("docTypeReq");
				sap.m.MessageBox.alert(text);
				return;
			}
			var texto = this.getResourceBundle().getText("sureSaveTemp");
			var that = this;
			var head = {};
			var dialogNewTemp = oEvent.getSource().getParent();
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: texto
				}),
				beginButton: new sap.m.Button({
					text: yes,
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
								that.call_Template_details(results, temp, "", "", "", "X");
								that.createPagesBatch(head.uuid);
								var text = that.getResourceBundle().getText("tempConfCrea");
								sap.m.MessageToast.show(text);
							},
							error: function (oError) {
								dialogNewTemp.setBusy(false);
								var text = that.getResourceBundle().getText("error");
								sap.m.MessageToast.show(text);
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Cancelación de un proceso de configuración una nueva template */
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
			this.byId("titleDisplay").setVisible(false);
			this.byId("titleChange").setVisible(true);
			this.byId("DTdisplay").setVisible(false);
			this.byId("labelDT").setVisible(true);
			this.byId("DocTypesH").setVisible(true);
			this.oSemanticPage.setHeaderExpanded(true);
			this.oEditAction.setVisible(false);
		},

		/* Al salvar el business process type */
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
					var BPData = that.getOwnerComponent().getModel("BProcess").getData();
					var bp_name = BPData.find(bp => bp.bpt_id === oData.bpt_id);
					dataHeader.business_process_text = bp_name.name;
					oHeaderModel.setData(dataHeader);
					oHeaderModel.refresh();
					var text = that.getResourceBundle().getText("busProcSaveSuc");
					sap.m.MessageToast.show(text);
				},
				error: function (oError) {
					var text = that.getResourceBundle().getText("error");
					sap.m.MessageToast.show(text);
				}
			});

		},

		/* Guardar la configuración de la template */
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
				var text = that.getResourceBundle().getText("contChangDoc");
				var tit = this.getResourceBundle().getText("confi");
				var yes = this.getResourceBundle().getText("yes");
				var no = this.getResourceBundle().getText("no");
				var dialog = new sap.m.Dialog({
					title: tit,
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: yes,
						press: function () {
							that.saveConfTempConf(data, enabled, uuid, signature, "X");
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: no,
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

		/* Chequeos a la hora de guardar la configuración de una template */
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
							if (oData.value) {
								var result = oData.value;
							} else {
								var result = oData;
							}
							if (result == "") {
								that.saveConfigTemplate(data, changeDocType);
							} else {
								var text1 = that.getResourceBundle().getText("tempNotAct");
								var text = text1 + " \n\ " + result;
								sap.m.MessageBox.error(text);
							}
						},
						error: function (oError) {
							var text = that.getResourceBundle().getText("error");
							sap.m.MessageToast.show(text);
						}
					});
			} else {
				this.saveConfigTemplate(data, changeDocType);
			}
		},

		/* Gestión al seleccionar la icon Tab Bar */
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

		/* Al guardar la configuración de la firma de la template */
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
				var text = this.getResourceBundle().getText("clearSignSett");
				var that = this;
				var head = {};
				var tit = this.getResourceBundle().getText("confi");
				var yes = this.getResourceBundle().getText("yes");
				var no = this.getResourceBundle().getText("no");
				var dialog = new sap.m.Dialog({
					title: tit,
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: yes,
						press: function () {
							oModel.update(sPath1, data, {
								headers: {
									"Content-Type": "application/json",
									'Accept': 'application/json'
								},
								success: function (oData, response) {
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
									var text = that.getResourceBundle().getText("confSucSave");
									sap.m.MessageBox.alert(text);
									if (changeDocType == "X") {
										that.byId("tablemeta").setBusy(true);
										that.refreshObjectsTemplate(uuid, "");
									}
								},
								error: function (oError) {
									dialog.close();
									var text = that.getResourceBundle().getText("error");
									sap.m.MessageToast.show(text);
								}
							});
						}
					}),
					endButton: new sap.m.Button({
						text: no,
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
						dataHeader.active = oData.active;
						dataHeader.signature = oData.signature;
						var DTData = that.getOwnerComponent().getModel("doctypes").getData();
						var dt_name = DTData.find(dt => dt.id === oData.doc_type_id);
						dataHeader.doc_type_text = dt_name.label;
						dataHeader.doc_type = oData.doc_type_id;
						that.oldDocType = oData.doc_type_id;
						oHeaderModel.setData(dataHeader);
						oHeaderModel.refresh();
						var text = that.getResourceBundle().getText("confSucSave");
						sap.m.MessageBox.alert(text);
						if (changeDocType == "X") {
							that.byId("tablemeta").setBusy(true);
							that.refreshObjectsTemplate(uuid, "");
						}
					},
					error: function (oError) {
						var text = that.getResourceBundle().getText("error");
						sap.m.MessageToast.show(text);
					}
				});
			}
		},

		/* Al guardar la planificación de una template */
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
					var text = that.getResourceBundle().getText("error");
					sap.m.MessageToast.show(text);
				}
			});
		},

		/* */
		onCancel: function () {
			this.showCustomActions(false);
			this.byId("segButton").setSelectedKey(this.oldKey);
			this.byId("titleChange").setValue(this.oldTitle);
			this.byId("DocTypesH").setSelectedKey(this.oldDType);
			this.byId("segButton").setEnabled(false);
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

		/* Al buscar mapeos de variables*/
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

		/* Al buscar mapeos de metadatas */
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

		/* Al buscar variables globales */
		onSearchGlobalVar: function (oEvent) {
			var sFilterPattern = oEvent.getParameter("query");
			var searchFieldId = oEvent.getSource().getId();
			var list = this.getView().byId("tableGlobalVar");
			sFilterPattern = sFilterPattern.toLowerCase();
			var items = list.getBinding("items");
			var oFilter1 = new sap.ui.model.Filter("variable", sap.ui.model.FilterOperator.Contains, sFilterPattern);
			items.filter([oFilter1]);
		},

		/* Al filtrar en los mapeos de variables por lo mapeado o no mapeado */
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

		/* Al filtrar en los mapeos de metadatas por lo mapeado o no mapeado */
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

		/*Aplicamos el patrón de búsqueda */
		applySearchPattern: function (oItem, sFilterPattern) {
			if (sFilterPattern == "") {
				return true;
			}
			if ((oItem.getCells()[0].getText() && oItem.getCells()[0].getText().toLowerCase().indexOf(sFilterPattern) != -1)) {
				return true;
			}
			return false;
		},

		/* Al cambiar el template a visualizar */
		_onBindingChange: function () {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.code,
				sObjectName = oObject.text;
			oViewModel.setProperty("/busy", false);
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("objectTitle") + " - " + sObjectName,
				icon: "sap-icon://enter-more",
				intent: "#Worker-TemplateConfig&/Countries/" + sObjectId
			});
		},

		/* Al cambiar el periodo en la planificación */
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

		/* Al cambiar el periodo en la planificación de reprocesamiento */
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

		/* Gestionamos cambios en la planificación */
		selExecute: function (oEvent) {
			var index = oEvent.getParameter("selectedIndex");
			var oPlanModel = this.getModel("planning")
			var pland = oPlanModel.getProperty("/plan_d");
			if (index == 0) {
				pland.execute = true;
			} else {
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

		handleSelectionFinish: function (oEvent) {
			var items = oEvent.getParameter("selectedItems");
			var itemsSel = [];
			for (var i = 0; i < items.length; i++) {
				itemsSel.push(items[i].getKey());
			}
			itemsSel.sort();
			var strValues = itemsSel.join("-");
			var oPlanModel = this.getModel("planning")
			var pland = oPlanModel.getProperty("/plan_d");
			pland.periodicity_valuesM = strValues;
		},

		/* Gestionamos cambios en la planificación de reprocesamiento */
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

		selectCheckRep: function (oEvent) {
			var source = oEvent.getSource();
			var text = source.getText();
			var oPlanModel = this.getModel("planningRep")
			var pland = oPlanModel.getProperty("/plan_d");
			var periodValues = pland.periodicity_values;
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

		handleSelectionFinishRep: function (oEvent) {
			var items = oEvent.getParameter("selectedItems");
			var itemsSel = [];
			for (var i = 0; i < items.length; i++) {
				itemsSel.push(items[i].getKey());
			}
			itemsSel.sort();
			var strValues = itemsSel.join("-");
			var oPlanModel = this.getModel("planningRep")
			var pland = oPlanModel.getProperty("/plan_d");
			pland.periodicity_valuesM = strValues;
		},

		/* Al seleccionar el cambio de Vista en la pestaña de los mapeos de variables */
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

		/* Convertimos a Time Zone local */
		convertTZ: function (date, tzString) {
			return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
				timeZone: tzString
			}));
		},

		/* Guardamos la planificación de la template */
		savePlanning: function (oEvent) {
			var oPlanModel = this.getModel("planning");
			var oViewModel = this.getModel("objectView");
			var oView = this.getView(),
				aInputs = [
					oView.byId("Comments"),
					oView.byId("DTP1"),
					oView.byId("DTP2"),
					oView.byId("DTP3"),
					oView.byId("begda"),
					oView.byId("endda"),
					oView.byId("TP1"),
					oView.byId("TP2")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
			} else {
				if (this.byId("periodType").getSelectedItem().getKey() == "M") {
					var selKeys = this.byId("MC1").getSelectedKeys();
					if (selKeys.length == 0) {
						this.byId("MC1").setValueState("Error");
						var text = this.getResourceBundle().getText("valError");
						sap.m.MessageBox.alert(text);
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
						var text = this.getResourceBundle().getText("valError");
						sap.m.MessageBox.alert(text);
						return;
					}
				}
				var timezone = oView.byId("TimeZone").getSelectedKey();
				var date = new Date();
				var dateConvert = this.convertTZ(date, timezone);
				var date1 = aInputs[1].getDateValue();
				if (date1 >= dateConvert) {
					aInputs[1].setValueState("Error");
					var text = this.getResourceBundle().getText("dateLess");
					sap.m.MessageBox.alert(text);
					return;
				} else {
					aInputs[1].setValueState("None");
				}
				var date2 = aInputs[2].getDateValue();
				if (date2 >= dateConvert) {
					aInputs[2].setValueState("Error");
					var text = this.getResourceBundle().getText("dateLess");
					sap.m.MessageBox.alert(text);
					return;
				} else {
					aInputs[2].setValueState("None");
				}
				var date3 = aInputs[3].getDateValue();
				if (date3 >= dateConvert) {
					aInputs[3].setValueState("Error");
					var text = this.getResourceBundle().getText("dateLess");
					sap.m.MessageBox.alert(text);
					return;
				} else {
					aInputs[3].setValueState("None");
				}
				var comments = aInputs[0].getValue();
				var text = this.getResourceBundle().getText("saveJobPlan");
				var that = this;
				var dialogNewPlan = oEvent.getSource().getParent();
				var tit = this.getResourceBundle().getText("confi");
				var yes = this.getResourceBundle().getText("yes");
				var no = this.getResourceBundle().getText("no");
				var dialog = new sap.m.Dialog({
					title: tit,
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: yes,
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
										that.onUpdatePlanTemplate(oData.uuid, oData.processing_type, "");
									},
									error: function (oError) {
										oViewModel.setProperty("/busy", false);
										var text = that.getResourceBundle().getText("error");
										sap.m.MessageToast.show(text);
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
										that.updateDataBatch(oData.uuid, oData.processing_type, "");
									},
									error: function (oError) {
										oViewModel.setProperty("/busy", false);
										var text = that.getResourceBundle().getText("error");
										sap.m.MessageToast.show(text);
									}
								});
							}
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: no,
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

		/* Guardamos la planificación de reprocesamiento de la template */
		savePlanningRep: function (oEvent) {
			var oPlanModel = this.getModel("planningRep");
			var oViewModel = this.getModel("objectView");
			var oView = this.getView(),
				aInputs = [
					oView.byId("CommentsRep"),
					oView.byId("begdaRep"),
					oView.byId("enddaRep"),
					oView.byId("TP1Rep"),
					oView.byId("TP2Rep")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(text);
			} else {
				if (this.byId("periodTypeRep").getSelectedItem().getKey() == "M") {
					var selKeys = this.byId("MC1Rep").getSelectedKeys();
					if (selKeys.length == 0) {
						this.byId("MC1Rep").setValueState("Error");
						var text = this.getResourceBundle().getText("valError");
						sap.m.MessageBox.alert(text);
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
						var text = this.getResourceBundle().getText("valError");
						sap.m.MessageBox.alert(text);
						return;
					}
				}
				var comments = aInputs[0].getValue();
				var text = this.getResourceBundle().getText("saveJobRepPlan");
				var that = this;
				var dialogNewPlan = oEvent.getSource().getParent();
				var tit = this.getResourceBundle().getText("confi");
				var yes = this.getResourceBundle().getText("yes");
				var no = this.getResourceBundle().getText("no");
				var dialog = new sap.m.Dialog({
					title: tit,
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: yes,
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
										that.onUpdatePlanTemplate(oData.uuid, oData.processing_type, "X");
									},
									error: function (oError) {
										oViewModel.setProperty("/busy", false);
										var text = that.getResourceBundle().getText("error");
										sap.m.MessageToast.show(text);
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
										that.updateDataBatch(oData.uuid, oData.processing_type, "X");
									},
									error: function (oError) {
										oViewModel.setProperty("/busy", false);
										var text = that.getResourceBundle().getText("error");
										sap.m.MessageToast.show(text);
									}
								});
							}
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: no,
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

		/* Creamos los datos para el modelo de planificación */
		createDataPlanning: function (planUuid, reproc) {
			if (reproc == "X") {
				var oPlanModel = this.getModel("planningRep")
			} else {
				var oPlanModel = this.getModel("planning")
			}
			var pland = oPlanModel.getProperty("/plan_d");
			var uuid = planUuid;
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

		/* Creamos el batch para cargar todos los datos asociados a la entidad aData de la planificación */
		createDataBatch: function (planUuid, processing_type, reproc) {
			var planning_uuid = planUuid;
			var sPath = "/Integration_Pck_Planning_Adata";
			var oModel = this.getOwnerComponent().getModel();
			oModel.setDeferredGroups(["createGroup"]);
			var that = this;
			var oData = {};
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

		/* Creamos el batch para cargar todas las páginas de la template */
		createPagesBatch: function (uuidTemp) {
			var sPath = "/Di_Template_Page_Content";
			var oModel = this.getOwnerComponent().getModel();
			oModel.setDeferredGroups([]);
			var that = this;
			var idGroup = uuidTemp + "-";
			var pages = this.getModel("pages").getData().pages;
			if (pages && Array.isArray(pages)) {
				var total = 0;
				var pack = 0;
				var mas_env = false;
				var pages_env = [];
				var idGroupN = idGroup + pack;
				oModel.setDeferredGroups(oModel.getDeferredGroups().concat([idGroupN]));
				for (var i = 0; i < pages.length; i++) {
					var size = new Blob([pages[i].content]).size;
					total = total + size;
					var item = {};
					item.template_uuid = uuidTemp;
					item.page = pages[i].page;
					item.content = pages[i].content;
					oModel.create(sPath, item, {
						groupId: idGroupN
					});
					if (total > 40000000) {
						total = 0;
						pack++;
						if (i < pages.length - 1) {
							var idGroupN = idGroup + pages[i].page;
							oModel.setDeferredGroups(oModel.getDeferredGroups().concat([idGroupN]));
						}
					}
				}
			}

			// while (pages.length > 0)
			// 	groupPages.push(pages.splice(0, size));

			// for (var i = 0; i < groupPages.length; i++) {
			// 	var idGroupN = idGroup + i;
			// 	oModel.setDeferredGroups(oModel.getDeferredGroups().concat([idGroupN]));
			// 	for (var j = 0; j < groupPages[i].length; j++) {
			// 		var item = {};
			// 		item.template_uuid = uuidTemp;
			// 		item.page = groupPages[i][j].page;
			// 		item.content = groupPages[i][j].content;
			// 		oModel.create(sPath, item, {
			// 			groupId: idGroupN
			// 		});
			// 	}
			// }
			oModel.submitChanges({
				groupId: oModel.getDeferredGroups()[0],
				success: this.successCreatePages.bind(that),
				error: this.errorCreatePages.bind(that)
			});

		},
		successCreatePages: function (oData) {
			var a = 0;
			var that = this;
			var oModel = this.getOwnerComponent().getModel();
			var groups = oModel.getDeferredGroups();
			if (oData.__batchResponses) {
				var num_page = oData.__batchResponses[0].__changeResponses[0].data.page;
				var uuidTemp = oData.__batchResponses[0].__changeResponses[0].data.template_uuid;
				//var group = Math.floor(num_page / 5) + 1;
				//var idGroup = groups[group];
				for (var i = 0; i < groups.length; i++) {
					var aux = oData.__batchResponses[0].__changeResponses.length - 1;
					var lastpage = String(oData.__batchResponses[0].__changeResponses[aux].data.page);
					var long = -lastpage.length;
					var comp = groups[i].slice(long);
					if (comp == lastpage) {
						var idGroup = groups[i];
						break;
					}
				}
				if (idGroup) {
					oModel.submitChanges({
						groupId: idGroup,
						success: this.successCreatePages.bind(that),
						error: this.errorCreatePages.bind(that)
					});
				} else {

				}
			}
		},

		errorCreatePages: function (error) {
			var a = 0;
		},

		/* Creamos el batch para actualizar todos los datos asociados a la entidad aData de la planificación */
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
			var text = this.getResourceBundle().getText("planUpdSuc");
			sap.m.MessageToast.show(text);
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
		},

		errorUpdateBatch: function (oError) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			var text = this.getResourceBundle().getText("error");
			sap.m.MessageToast.show(text);

		},

		successCreateBatch: function (oData, response) {
			//TODO
			var text = this.getResourceBundle().getText("planCreaSuc");
			sap.m.MessageToast.show(text);
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
		},

		errorCreateBatch: function (oError) {
			//TODO
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);
			var text = this.getResourceBundle().getText("error");
			sap.m.MessageToast.show(text);
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

		/* Al cambiar el tipo de Firma para la visualización */
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

		/* Al cambiar el tipo de Firma para la creación */
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

		/* Al cambiar el tipo de Firma para la edición */
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

		/*Al buscar atributos en el listado */
		onSearchAttr: function (oEvent) {
			var sFilterPattern = oEvent.getParameter("query");
			sFilterPattern = sFilterPattern.toLowerCase();
			var list = this.getView().byId("tableAtt");
			var items = list.getBinding("items");
			var oFilter1 = new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sFilterPattern);
			items.filter([oFilter1]);
		},

		/* Tener el cuenta la fuente de datos para mostrar el xsd */
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

		/* Limpiar un mapeo */
		clearMap: function (oObject) {
			var path = oObject.getSource().getParent().getBindingContext("template").getPath();
			var oModel = this.getModel("template");
			var path2 = path + "/map";
			oModel.setProperty(path2, "");
			path2 = path + "/metadata";
			oModel.setProperty(path2, "");
			path2 = path + "/path";
			oModel.setProperty(path2, "");
			path2 = path + "/type";
			oModel.setProperty(path2, "");
			path2 = path + "/source";
			oModel.setProperty(path2, "");
			path2 = path + "/map";
			oModel.setProperty(path2, "");
			oModel.refresh();
		},

		/* Al seleccionar una fuente para el xsd */
		selectSource: function (oObject) {
			this.buttonIdSel = oObject.getSource().getId();
			if (this.buttonIdSel.match("ButPathAttri") || this.buttonIdSel.match("ButPathEditAttri")) {
				this.pathButtonSel = "";
			} else if (this.buttonIdSel.match("pathGlobVar")) {
				this.pathButtonSel = "";
				if (this.typeGVEdit != "" || this.sourceGVEdit != "") {
					var type = this.typeGVEdit;
					var source = this.sourceGVEdit;
					var value = this.byId("Value_GV").getValue();
				}
			} else {
				this.pathButtonSel = oObject.getSource().getParent().getBindingContext("template").getPath();
				var sourcePath = oObject.getSource().getParent().getBindingContext("template").getPath() + "/source";
				var source = this.getView().getModel("template").getProperty(sourcePath);
				var typePath = oObject.getSource().getParent().getBindingContext("template").getPath() + "/type";
				var type = this.getView().getModel("template").getProperty(typePath);
				var valPath = oObject.getSource().getParent().getBindingContext("template").getPath() + "/path";
				var value = this.getView().getModel("template").getProperty(valPath);
			}
			if (!this.byId("selSource")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.sourceXsd",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					if (type == "CTE") {
						this.byId("constSource").setSelected(true);
						this.byId("valueCte").setVisible(true);
						this.byId("sourXsdPath").setEnabled(false);
						this.byId("valueCte").setValue(value);
					} else {
						this.byId("constSource").setSelected(false);
						this.byId("valueCte").setVisible(false);
						this.byId("valueCte").setValue("");
						this.byId("sourXsdPath").setEnabled(true);
						if (source) {
							this.byId("sourXsdPath").setSelectedKey(source);
						}
					}
					oDialog.open();
				}.bind(this));
			} else {
				if (type == "CTE") {
					this.byId("constSource").setSelected(true);
					this.byId("valueCte").setVisible(true);
					this.byId("sourXsdPath").setEnabled(false);
					this.byId("valueCte").setValue(value);
				} else {
					this.byId("constSource").setSelected(false);
					this.byId("valueCte").setVisible(false);
					this.byId("valueCte").setValue("");
					this.byId("sourXsdPath").setEnabled(true);
					if (source) {
						this.byId("sourXsdPath").setSelectedKey(source);
					}
				}
				this.byId("selSource").open();
			}
		},

		/* Al seleccionar una fuente para el xsd */
		selecSource: function (oEvent) {
			var pathXsd = this.byId("sourXsdPath").getSelectedItem().getBindingContext().getPath() + "/xsd_id";
			var pathCode = this.byId("sourXsdPath").getSelectedItem().getBindingContext().getPath() + "/code";
			var pathType = this.byId("sourXsdPath").getSelectedItem().getBindingContext().getPath() + "/type";
			var oModel = this.getOwnerComponent().getModel();
			var xsd_id = oModel.getProperty(pathXsd);
			var code = oModel.getProperty(pathCode);
			var type = oModel.getProperty(pathType);
			if (this.byId("constSource").getSelected()) {
				type = "CTE";
			}
			var dialogSelSource = oEvent.getSource().getParent();
			if (type == 'XSD') {
				if (code == this.code_id_filled) {
					dialogSelSource.close();
					this.openGetPath();
				} else {
					this.code_id_filled = code;
					dialogSelSource.setBusy(true);
					this.fill_Parser(xsd_id);
				}
			} else if (type == 'LVA') {
				dialogSelSource.setBusy(true);
				this.fill_List_Values(code);
			} else {
				//constantes
				this.fill_cte();
			}
		},

		fill_cte: function () {
			var buttonId = this.buttonIdSel;
			var path = this.pathButtonSel;
			var vThat = this;
			var valu = this.byId("valueCte").getValue();
			if (buttonId.match("pathGlobVar")) {
				var oGlobalVariModel = this.getModel("globalVari");
				var oGlobalVariData = oGlobalVariModel.getData();
				oGlobalVariData.type = "CTE";
				oGlobalVariData.metadata = null;
				oGlobalVariData.source = null;
				oGlobalVariData.required = false;
				oGlobalVariModel.setData(oGlobalVariData);
				this.byId("Value_GV").setValue(valu);
				this.byId("Source_GV").setValue("");
				oGlobalVariModel.refresh();
				this.byId("selSource").close();
			} else if (buttonId.match("pathMeta")) {
				var data = this.getModel("template").getData();
				var property = path + "/code";
				this.selectedVarMeta = this.getView().getModel("template").getProperty(property);
				var metadata = data.metadata.find(metada => metada.slug === this.selectedVarMeta);
				metadata.path = valu;
				metadata.source = null;
				metadata.type = "CTE";
				metadata.metadata = null;
				this.getModel("template").setData(data);
				this.getModel("template").refresh();
				this.byId("selSource").close();
			} else {
				var data = this.getModel("template").getData();
				var property = path + "/slug";
				this.selectedVar = this.getView().getModel("template").getProperty(property);
				var variable = data.variables.find(variable => variable.slug === this.selectedVar);
				variable.path = valu;
				variable.source = null;
				variable.type = "CTE";
				variable.metadata = null;
				this.getModel("template").setData(data);
				this.getModel("template").refresh();
				this.byId("selSource").close();
			}
		},

		/* Cerrar el popup de seleccionar valor del listado para mapeo*/
		closeSelectLVs: function () {
			this.byId("selectLVs").close();
		},

		/* Recuperar los Custom Fields de persistencia */
		fill_List_Values: function (lvaid) {
			var aFilter = [];
			var listFil = new sap.ui.model.Filter("lvaid", sap.ui.model.FilterOperator.EQ, lvaid);
			var oModel = this.getOwnerComponent().getModel();
			var LVModel = this.getOwnerComponent().getModel("LValues");
			var that = this;
			var sPath = "/Di_List_Values";
			aFilter.push(listFil);
			oModel.read(sPath, {
				filters: aFilter,
				success: function (oData, oResponse) {
					var results = oData.results;
					delete oData.__metadata;
					LVModel.setData(results);
					LVModel.refresh();
					var dialogSelSource = that.byId("selSource");
					if (dialogSelSource) {
						that.byId("selSource").setBusy(false);
						that.byId("selSource").close();
					}
					that.openSelectList();
				},
				error: function (oError) {}
			});
		},

		/* Recuperar los Custom Fields de persistencia */
		openSelectList: function () {
			var buttonId = this.buttonIdSel;
			var path = this.pathButtonSel;
			var mapping_var = "";
			var metadata_var = "";
			var edit = "";
			var globalVar = "";
			var vThat = this;
			if (buttonId.match("ButPathAttri")) {} else if (buttonId.match("ButPathEditAttri")) {
				edit = "X";
			} else if (buttonId.match("pathGlobVar")) {
				globalVar = "X";
			} else if (buttonId.match("pathMeta")) {
				metadata_var = "X";
			} else {
				mapping_var = "X";
			}
			if (!this.byId("selectLVs")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.selectLVs",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					vThat.byId("tableSelLVs").removeSelections();
					var items = vThat.byId("tableSelLVs").getItems();
					if (mapping_var == "X") {
						vThat.byId("BtnSelList1").setVisible(true);
						vThat.byId("BtnSelList2").setVisible(false);
						vThat.byId("BtnSelList3").setVisible(false);
						vThat.byId("BtnSelList4").setVisible(false);
						vThat.byId("BtnSelList5").setVisible(false);
						var property = path + "/path";
						var valList = vThat.getView().getModel("template").getProperty(property);
					} else if (metadata_var == "X") {
						vThat.byId("BtnSelList1").setVisible(false);
						vThat.byId("BtnSelList2").setVisible(false);
						vThat.byId("BtnSelList3").setVisible(false);
						vThat.byId("BtnSelList4").setVisible(false);
						vThat.byId("BtnSelList5").setVisible(true);
						var property = path + "/path";
						var valList = vThat.getView().getModel("template").getProperty(property);
					} else if (globalVar == "X") {
						vThat.byId("BtnSelList1").setVisible(false);
						vThat.byId("BtnSelList2").setVisible(false);
						vThat.byId("BtnSelList3").setVisible(false);
						vThat.byId("BtnSelList4").setVisible(true);
						vThat.byId("BtnSelList5").setVisible(false);
						var valList = vThat.byId("Value_GV").getValue();
					} else {
						if (edit != "X") {
							vThat.byId("BtnSelList2").setVisible(true);
							vThat.byId("BtnSelList1").setVisible(false);
							vThat.byId("BtnSelList3").setVisible(false);
							vThat.byId("BtnSelList4").setVisible(false);
							vThat.byId("BtnSelList").setVisible(false);
						} else {
							vThat.byId("BtnSelList3").setVisible(true);
							vThat.byId("BtnSelList1").setVisible(false);
							vThat.byId("BtnSelList2").setVisible(false);
							vThat.byId("BtnSelList4").setVisible(false);
							vThat.byId("BtnSelList5").setVisible(false);
						}
					}
					for (var i = 0; i < items.length; i++) {
						var pathIt = items[i].getBindingContext("LValues").getPath() + "/text";
						var valueIt = vThat.getModel("LValues").getProperty(pathIt);
						if (valueIt == valList) {
							vThat.byId("tableSelLVs").setSelectedItem(items[i]);
							break;
						}
					}
					oDialog.open();
				}.bind(this));
			} else {
				vThat.byId("tableSelLVs").removeSelections();
				var items = vThat.byId("tableSelLVs").getItems();
				if (mapping_var == "X") {
					vThat.byId("BtnSelList1").setVisible(true);
					vThat.byId("BtnSelList2").setVisible(false);
					vThat.byId("BtnSelList3").setVisible(false);
					vThat.byId("BtnSelList4").setVisible(false);
					vThat.byId("BtnSelList5").setVisible(false);
					var property = path + "/path";
					var valList = vThat.getView().getModel("template").getProperty(property);
				} else if (metadata_var == "X") {
					vThat.byId("BtnSelList1").setVisible(false);
					vThat.byId("BtnSelList2").setVisible(false);
					vThat.byId("BtnSelList3").setVisible(false);
					vThat.byId("BtnSelList4").setVisible(false);
					vThat.byId("BtnSelList5").setVisible(true);
					var property = path + "/path";
					var valList = vThat.getView().getModel("template").getProperty(property);
				} else if (globalVar == "X") {
					vThat.byId("BtnSelList1").setVisible(false);
					vThat.byId("BtnSelList2").setVisible(false);
					vThat.byId("BtnSelList3").setVisible(false);
					vThat.byId("BtnSelList4").setVisible(true);
					vThat.byId("BtnSelList5").setVisible(false);
					var valList = vThat.byId("Value_GV").getValue();
				} else {
					if (edit != "X") {
						vThat.byId("BtnSelList2").setVisible(true);
						vThat.byId("BtnSelList1").setVisible(false);
						vThat.byId("BtnSelList3").setVisible(false);
						vThat.byId("BtnSelList4").setVisible(false);
						vThat.byId("BtnSelList").setVisible(false);
					} else {
						vThat.byId("BtnSelList3").setVisible(true);
						vThat.byId("BtnSelList1").setVisible(false);
						vThat.byId("BtnSelList2").setVisible(false);
						vThat.byId("BtnSelList4").setVisible(false);
						vThat.byId("BtnSelList5").setVisible(false);
					}
				}
				for (var i = 0; i < items.length; i++) {
					var pathIt = items[i].getBindingContext("LValues").getPath() + "/text";
					var valueIt = vThat.getModel("LValues").getProperty(pathIt);
					if (valueIt == valList) {
						vThat.byId("tableSelLVs").setSelectedItem(items[i]);
						break;
					}
				}
				this.byId("selectLVs").open();
			}
		},

		/*Al seleccionar mapear a valor constante */
		selectConst: function (oEvent) {
			var selected = oEvent.getParameter("selected");
			if (selected) {
				this.byId("valueCte").setVisible(true);
				this.byId("sourXsdPath").setEnabled(false);
			} else {
				this.byId("valueCte").setVisible(false);
				this.byId("sourXsdPath").setEnabled(true);
			}
		},

		/*Al seleccionar un valor del listado de valores */
		selectLVs: function (oEvent) {
			var oTable = this.getView().byId("tableSelLVs");
			var selItem = oTable.getSelectedItem();
			var buttonId = oEvent.getSource().getId();
			var obj = "";
			var path = this.pathButtonSel;
			if (buttonId.match("BtnSelList1")) {
				obj = "MAP";
			} else if (buttonId.match("BtnSelList5")) {
				obj = "META";
			} else if (buttonId.match("BtnSelList4")) {
				obj = "GV";
			} else if (buttonId.match("BtnSelList2")) {
				obj = "Attr";
			} else if (buttonId.match("BtnSelList3")) {
				obj = "AttrEdit";
			}
			if (selItem) {
				var pathCode = selItem.getBindingContext("LValues").getPath() + "/lvaid";
				var code_sel = this.getView().getModel("LValues").getProperty(pathCode);
				var pathValue = selItem.getBindingContext("LValues").getPath() + "/value";
				var value_sel = this.getView().getModel("LValues").getProperty(pathValue);
				var pathText = selItem.getBindingContext("LValues").getPath() + "/text";
				var text_sel = this.getView().getModel("LValues").getProperty(pathText);
				if (obj == "MAP") {
					var data = this.getModel("template").getData();
					var property = path + "/slug";
					this.selectedVar = this.getView().getModel("template").getProperty(property);
					var variable = data.variables.find(variable => variable.slug === this.selectedVar);
					variable.path = text_sel;
					variable.source = code_sel;
					variable.type = "LVA";
					var meta = {
						lvaid: code_sel,
						value: value_sel
					};
					variable.metadata = JSON.stringify(meta);
					this.getModel("template").setData(data);
					this.getModel("template").refresh();
					this.byId("selectLVs").close();
				} else if (obj == "META") {
					var data = this.getModel("template").getData();
					var property = path + "/code";
					this.selectedVarMeta = this.getView().getModel("template").getProperty(property);
					var metadata = data.metadata.find(metada => metada.code === this.selectedVarMeta);
					metadata.path = text_sel;
					metadata.source = code_sel;
					metadata.type = "LVA";
					var meta = {
						lvaid: code_sel,
						value: value_sel
					};
					metadata.metadata = JSON.stringify(meta);
					this.getModel("template").setData(data);
					this.getModel("template").refresh();
					this.byId("selectLVs").close();
				} else if (obj == "GV") {
					var oGlobalVariModel = this.getModel("globalVari");
					var oGlobalVariData = oGlobalVariModel.getData();
					oGlobalVariData.type = "LVA";
					var meta = {
						lvaid: code_sel,
						value: value_sel
					};
					oGlobalVariData.metadata = JSON.stringify(meta);
					oGlobalVariData.source = code_sel;
					oGlobalVariModel.setData(oGlobalVariData);
					this.byId("Value_GV").setValue(text_sel);
					this.byId("Source_GV").setValue(code_sel);
					oGlobalVariModel.refresh();
					this.byId("selectLVs").close();
				} else if (obj == "Attr") {

					// var oInput = this.getView().byId("pathTextArea");
					// var oNewPath = oInput.getValue();
					// this.byId("PathAttribu").setValue(oNewPath);
					// this.byId("treeTable").close();

				} else if (obj == "AttrEdit") {
					// var oInput = this.getView().byId("pathTextArea");
					// var oNewPath = oInput.getValue();
					// this.byId("PathAttribuEdit").setValue(oNewPath);
					// this.byId("treeTable").close();

				}
			} else {
				// no item seleccionado
			}
		},

		/* Cancelar la selección de la fuente del xsd */
		cancelSelSource: function (oEvent) {
			var dialogSelSource = oEvent.getSource().getParent();
			dialogSelSource.close();
		},

		/* Recuperamos los datos del xsd pertinente */
		fill_Parser: function (xsd_id) {
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
					var text = that.getResourceBundle().getText("errorLoad");
					sap.m.MessageToast.show(text);
				}
			});
		},

		/* Formatear el xsd para que se pueda visualizar bien en el componente */
		pasaratree: function (array, parent, tree) {
			tree = typeof tree !== 'undefined' ? tree : [];
			parent = typeof parent !== 'undefined' ? parent : {
				node_id: 0
			};
			var nodes = array.filter(function (child) {
				if (child.parent_id === parent.node_id) {
					return true;
				} else {
					return false;
				}
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

		/* Abrimos el pop-up para la visualización del xsd y gestionar los mapeos */
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
			if (!this.byId("treeTable")) {
				Fragment.load({
					id: oView.getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.treeTable",
					controller: this
				}).then(function (oDialog) {
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

		/* Operaciones para la gestión del componente para los mapeos desde el xsd */
		onCloseTableTree: function (oObject) {
			var oInput = this.byId("pathTextArea");
			var oClear = "";
			oInput.setValue(oClear);
			this.byId("treeTable").close();
		},

		applySearch1: function () {
			var oIndexArray = this.getView().getModel("SearchIndex").getData();
			var oView = this.getView();
			var oTreeTable = oView.byId("TreeTableBasic1");
			oIndex++;
			if (oIndex < oIndexArray.length) {
				var auxIndex = oIndexArray[oIndex];
				oTreeTable.setSelectedIndex(auxIndex);
				oTreeTable.setFirstVisibleRow(auxIndex);
				var text = this.getResourceBundle().getText("searchDot");
				sap.m.MessageToast.show(text + (oIndex + 1) + "/" + oIndexArray.length);
			} else {
				oIndex--;
				var text = this.getResourceBundle().getText("noMatches");
				sap.m.MessageToast.show(text);
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
				var text = this.getResourceBundle().getText("searchDot");
				sap.m.MessageToast.show(text + (oIndex + 1) + "/" + oIndexArray.length);

			} else {
				oIndex++;
				var text = this.getResourceBundle().getText("noMatches");
				sap.m.MessageToast.show(text);
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
			var oRawData = this.getModel("RawModel").getData();
			oTreeTable.expandToLevel(15);
			var oIndexArray = [];
			for (var i = 0; i < oRawData.length; i++) {
				var oContext = oTreeTable.getContextByIndex(i);
				if (oContext) {
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
				var text = this.getResourceBundle().getText("searchDot");
				sap.m.MessageToast.show(text + (oIndex + 1) + "/" + oIndexArray.length);
			} else {
				if (sQuery !== "") {
					var oIndex2Clear = [];
					var oModel2Clear = new JSONModel();
					oModel2Clear.setData(oIndex2Clear);
					this.getView().setModel(oModel2Clear, "SearchIndex");
					var text = this.getResourceBundle().getText("noMatch");
					sap.m.MessageToast.show(text);
				}
			}
		},

		filterNode: function (oEvent) {
			var sQuery = oEvent.getParameter("query");
			oQuery = sQuery;
			var oView = this.getView();
			var oTreeTable = oView.byId("TreeTableBasic1");
			var oTest = this.getView().getModel("jerarquia").getData();
			oTreeTable.expandToLevel(15);
			var oIndexArray = [];
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
					var text = this.getResourceBundle().getText("noCoinc");
					sap.m.MessageToast.show(text);
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
			variable.type = 'XPATH';
			variable.metadata = '';
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
			variable.type = 'XPATH';
			variable.metadata = '';
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
			var oGlobalVariModel = this.getModel("globalVari");
			var oGlobalVariData = oGlobalVariModel.getData();
			oGlobalVariData.type = "XPATH";
			oGlobalVariData.metadata = "";
			oGlobalVariData.source = this.code_id_filled;
			var oInput = this.getView().byId("pathTextArea");
			var oNewPath = oInput.getValue();
			this.byId("Value_GV").setValue(oNewPath);
			this.byId("Source_GV").setValue(this.code_id_filled);
			this.byId("treeTable").close();
			oGlobalVariModel.setData(oGlobalVariData);
			oGlobalVariModel.refresh();
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
				var text = this.getResourceBundle().getText("selecNode");
				sap.m.MessageToast.show(text);
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
						oRoot = oRoot + oSplit[i] + "/";
					}
				}
				oNewPath = oNewPath.slice(0, -1);
				var oInput = this.getView().byId("pathTextArea");
				var oOldPath = oInput.getValue();
				oNewPath = oOldPath + oNewPath;
				oInput.setValue(oNewPath);
			}
		},
	});
});
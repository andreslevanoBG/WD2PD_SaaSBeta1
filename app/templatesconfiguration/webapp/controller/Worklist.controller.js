sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/ui/model/FilterOperator",
	"./App.controller"
], function (BaseController, JSONModel, formatter, Filter, Fragment, FilterOperator, App) {
	"use strict";

	return BaseController.extend("shapein.TemplatesConfiguration.controller.Worklist", {

		formatter: formatter,

		/* Al instanciar el objeto */
		onInit: function () {
			this.firstDisplay = "X";
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			this._aTableSearchState = [];
			this._oTableFilterState = [];
			this.keyList = "";
			var router = this.getOwnerComponent().getRouter();
			var target = router.getTarget("worklist");
			target.attachDisplay(this.onDisplay, this);
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				saveAsTileTitle: this.getResourceBundle().getText("saveAsTileTitle", this.getResourceBundle().getText("worklistViewTitle")),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "worklistView");
			oTable.attachEventOnce("updateFinished", function () {
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("worklistViewTitle"),
				icon: "sap-icon://table-view",
				intent: "#Worker-TemplateConfig"
			}, true);
		},

		/* Al finalizar la carga de los datos del modelo del listado */
		onUpdateFinished: function (oEvent) {
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/* Al seleccionar un elemento del listado */
		onPress: function (oEvent) {
			this._showObject(oEvent.getSource());
		},

		/* Al cerrar el dialog de la gestión de Business Process Types */
		closeManageBPs: function (oEvent) {
			var dialogManageBPs = oEvent.getSource().getParent();
			dialogManageBPs.close();
		},

		/* Al cerrar el dialog de la gestión de Custom fields */
		closeManageLVs: function (oEvent) {
			var dialogManageLVs = oEvent.getSource().getParent();
			dialogManageLVs.close();
		},

		/* Evento que saltal al mostrar la vista Worklist */
		onDisplay: function (oEvent) {
			if (this.firstDisplay == "X") {
				this.firstDisplay = "";
			} else {
				this.refresh();
			}
		},

		/* Refrescamos el modelo de datos del listado */
		refresh: function () {
			var oViewModel = this.getModel("appView");
			var oModel = this.getOwnerComponent().getModel();
			var oPersTempModel = this.getOwnerComponent().getModel("templates_pers");
			var that = this;
			this.byId("table").setBusy(true);
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
					that.byId("table").setBusy(false);
				}
			});

		},

		/* Al seleccionar el borrado de una template */
		deleteTemplate: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("templates").getPath();
			var itemsModel = this.getView().getModel("templates");
			var sPath2 = sPath + "/uuid";
			var uuid = itemsModel.getProperty(sPath2);
			var that = this;
			var text = this.getResourceBundle().getText("sureDelete");
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
						that.deleteTempConfirm(uuid);
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

		/* Al confirmar el borrado de una template */
		deleteTempConfirm: function (uuid) {
			var oModel = this.getOwnerComponent().getModel();
			this.byId("table").setBusy(true);
			var that = this;
			oModel.callFunction(
				"/delete_complete_template", {
					method: "GET",
					urlParameters: {
						uuid: uuid
					},
					success: function (oData, response) {
						if (oData.value) {
							sap.m.MessageToast.show(oData.value);
						} else {
							sap.m.MessageToast.show(oData);
						}
						that.refresh();
						that.byId("table").setBusy(false);
					},
					error: function (oError) {
						that.byId("table").setBusy(false);
						var err = that.getResourceBundle().getText("error");
						sap.m.MessageToast.show(err);
					}
				});
		},

		/* Recuperamos las templates de PeopleDoc */
		call_Templates_Pd: function () {
			var oPersTempModel = this.getOwnerComponent().getModel("templates_pers");
			var templates = oPersTempModel.getData();
			var oViewModel = this.getModel("appView");
			var oModel = this.getOwnerComponent().getModel("templates");
			var url = "/CPI-WD2PD_Dest/di/templates/templates_pd";
			var that = this;
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
						that.byId("table").setBusy(false);
					},
					error: function (e) {
						that.byId("table").setBusy(false);
					}
				});
			}
		},

		/* Al seleccionar la sincronización de Business Process Types */
		onSyncBP: function (oEvent) {
			var that = this;
			var text = this.getResourceBundle().getText("syncBpt");
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
						that.onSyncBPConfirm();
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

		/* Al seleccionar la sincronización de Business Process Types */
		onSyncLV: function (oEvent) {
			var that = this;
			var text1 = this.getResourceBundle().getText("syncLVs1");
			var text2 = this.getResourceBundle().getText("syncLVs2");
			var text3 = oEvent.getSource().getText().substring(5);
			var text = text1 + " " + text3 + " " + text2;
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
						that.onSyncLVConfirm(text);
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

		/* Al confirmar la sincronización de los Business Process Types */
		onSyncBPConfirm: function () {
			var that = this;
			this.byId("manageBPs").setBusy(true);
			var url = "/CPI-WD2PD_Dest/di/workday/bpt/load";
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
						that.byId("manageBPs").setBusy(false);
						sap.m.MessageToast.show(results.message);
					},
					error: function (e) {
						var err = that.getResourceBundle().getText("errorWd");
						var error = e.responseJSON;
						sap.m.MessageToast.show(error.message);
						that.byId("manageBPs").setBusy(false);
					}
				});
			}
		},

		/* Al confirmar la sincronización de los Custom Fields */
		onSyncLVConfirm: function () {
			var that = this;
			var lvaid = this.keyList;
			this.byId("manageLVs").setBusy(true);
			var url = "/CPI-WD2PD_Dest/di/workday/customer_fields/load";

			if (this.getOwnerComponent().settings) {
				var cuscode = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Code");
				var cusclientid = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Client_Id");
				var cusscope = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Scope");
				//var data = {
				//		"list_values_id": lvaid
				//	};
				//var datajson = JSON.stringify(data);
				jQuery.ajax({
					url: url,
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Customer-Code', cuscode.value);
						xhr.setRequestHeader('Customer-Client_Id', cusclientid.value);
						xhr.setRequestHeader('Customer-Scope', cusscope.value);
					},
					type: "GET",
					dataType: "json",
					//	contentType: "application/json",
					//	data: datajson,
					success: function (results) {
						that.fill_List_Values(lvaid);
						that.byId("manageLVs").setBusy(false);
						sap.m.MessageToast.show(results.message);
					},
					error: function (e) {
						var err = that.getResourceBundle().getText("errorWd");
						var error = e.responseJSON;
						sap.m.MessageToast.show(error.message);
						that.byId("manageLVs").setBusy(false);
					}
				});
			}
		},

		/* Cargar los posibles Business Process Types */
		onAddBP: function (oEvent) {
			var buttonId = oEvent.getSource().getId();
			var sPath2 = "";
			if (!buttonId.match("addBP")) {
				sPath2 = oEvent.getSource().getParent().getParent().getBindingContext("BProcess").getPath();
			}
			var oModel = this.getOwnerComponent().getModel();
			var BPWDModel = this.getOwnerComponent().getModel("BProcessWD");
			var that = this;
			var sPath = "/Di_Business_Process_Master";
			oModel.read(sPath, {
				success: function (oData, oResponse) {
					var results = oData.results;
					delete oData.__metadata;
					BPWDModel.setData(results);
					BPWDModel.refresh();
					that.openAddBP(buttonId, sPath2);
				},
				error: function (oError) {}
			});

		},

		/* Abrir el popup para añadir un nuevo Business Process Type */
		openAddBP: function (ID, Spath) {
			var oBptModel = this.getModel("bpt");
			var bptData = oBptModel.getData();
			var action = "";
			var buttonId = ID;
			if (buttonId.match("addBP")) {
				action = "New";
				bptData = {
					retry_employee_exist: false
				};
				oBptModel.setData(bptData);
				oBptModel.refresh();
			} else {
				action = "Edit";
				var oBPTModel = this.getModel("BProcess");
				var sPath = Spath;
				var BPTData = oBPTModel.getData();
				var bpt = Object.assign({}, oBPTModel.getProperty(sPath));
				oBptModel.setData(bpt);
				oBptModel.refresh();
			}
			if (!this.byId("bpt")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.bpt",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					if (action == "New") {
						var tit1 = this.getResourceBundle().getText("titNewBpt");
						oDialog.setTitle(tit1);
						this.byId("btonAddBpt").setVisible(true);
						this.byId("btonEditBpt").setVisible(false);
						this.byId("Name_bpt").setEnabled(true);
					} else {
						var tit2 = this.getResourceBundle().getText("titEditBpt");
						oDialog.setTitle(tit2);
						this.byId("btonEditBpt").setVisible(true);
						this.byId("btonAddBpt").setVisible(false);
						if (bpt.templates) {
							if (bpt.templates.length > 0) {
								this.byId("Name_bpt").setEnabled(false);
							} else {
								this.byId("Name_bpt").setEnabled(true);
							}
						} else {
							this.byId("Name_bpt").setEnabled(true);
						}
					}
					oDialog.open();
				}.bind(this));
			} else {
				if (action == "New") {
					var tit1 = this.getResourceBundle().getText("titNewBpt");
					this.byId("bpt").setTitle(tit1);
					this.byId("btonAddBpt").setVisible(true);
					this.byId("btonEditBpt").setVisible(false);
					this.byId("Name_bpt").setEnabled(true);
				} else {
					var tit2 = this.getResourceBundle().getText("titEditBpt");
					this.byId("bpt").setTitle(tit2);
					this.byId("btonEditBpt").setVisible(true);
					this.byId("btonAddBpt").setVisible(false);
					if (bpt.templates) {
						if (bpt.templates.length > 0) {
							this.byId("Name_bpt").setEnabled(false);
						} else {
							this.byId("Name_bpt").setEnabled(true);
						}
					} else {
						this.byId("Name_bpt").setEnabled(true);
					}
				}
				this.byId("bpt").open();
			}
		},

		/* Validar que los campos tienen valor apropiado */
		_validateInputNewP: function (oInput) {
			var sValueState = "None";
			var bValidationError = false;
			var value = oInput.getValue();
			if (value == "") {
				sValueState = "Error";
				bValidationError = true;
			}
			oInput.setValueState(sValueState);
			return bValidationError;
		},

		/* Mostrar la referencia de uso de los Business Process Types */
		RefBP: function (oEvent) {
			var oButton = oEvent.getSource(),
				oView = this.getView();
			var oBptModel = this.getModel("bpt");
			var oBPTModel = this.getModel("BProcess");
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("BProcess").getPath();
			var BPTData = oBPTModel.getData();
			var bpt = Object.assign({}, oBPTModel.getProperty(sPath));
			oBptModel.setData(bpt);
			oBptModel.refresh();
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.refBps",
					controller: this
				}).then(function (oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._pPopover.then(function (oPopover) {
				oPopover.openBy(oButton);
			});
		},

		/* Confirmar la creación un nuevo Business Process Type */
		execNewBpt: function (oEvent) {
			var oBPTModel = this.getModel("BProcess");
			var BPTData = oBPTModel.getData();
			var aInputs = [
					this.byId("Desc_bpt")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var valE = this.getResourceBundle().getText("valError");
				sap.m.MessageBox.alert(valE);
				return;
			}
			var that = this;
			var name = this.byId("Name_bpt").getSelectedKey();
			var bpt = BPTData.find(buspt => buspt.name === name);
			if (bpt) {
				var useBpt = this.getResourceBundle().getText("useBpt");
				sap.m.MessageBox.alert(useBpt);
				return;
			}
			var description = aInputs[0].getValue();
			var retry = this.byId("retry_bpt").getSelected();
			var retries_number;
			if (!retry) {
				retries_number = null;
			} else {
				retries_number = parseInt(this.byId("retnum_bpt").getValue());
			}
			var data = {
				name: name,
				description: description,
				retry_employee_exist: retry,
				retries_number: retries_number
			};
			var oModel = that.getOwnerComponent().getModel();
			var text = that.getResourceBundle().getText("sureNewBpt");
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
						oModel.create("/Di_Business_Process", data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								that.fill_Business_Process();
								that.byId("bpt").close();
								sap.m.MessageToast.show(that.getResourceBundle().getText("sucNewBpt"));
							},
							error: function (oError) {
								sap.m.MessageToast.show(that.getResourceBundle().getText("error"));
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

		/* Cambiar datos de un Business Proceess type */
		execChangeBpt: function (oEvent) {
			var aInputs = [
					this.byId("Desc_bpt")
				],
				bValidationError = false;

			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				sap.m.MessageBox.alert(this.getResourceBundle().getText("valError"));
				return;
			}
			var that = this;
			var name = this.byId("Name_bpt").getSelectedKey();
			var description = aInputs[0].getValue();
			var retry = this.byId("retry_bpt").getSelected();
			var retries_number;
			if (!retry) {
				retries_number = null;
			} else {
				retries_number = parseInt(this.byId("retnum_bpt").getValue());
			}
			var bptModel = this.getModel("bpt");
			var editData = bptModel.getData();
			var bpt_id = editData.bpt_id;
			var data = {
				name: name,
				description: description,
				retry_employee_exist: retry,
				retries_number: retries_number
			};
			var oModel = that.getOwnerComponent().getModel();
			var text = this.getResourceBundle().getText("sureSaveBpt");
			var sPath = "/Di_Business_Process(guid'" + bpt_id + "')";
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
								that.fill_Business_Process();
								that.byId("bpt").close();
								sap.m.MessageToast.show(that.getResourceBundle().getText("sucSaveBpt"));
							},
							error: function (oError) {
								sap.m.MessageToast.show(that.getResourceBundle().getText("error"));
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

		/* Cancelar la acción sobre el Business Process Type */
		cancelBpt: function (oEvent) {
			var dialogNewBTP = oEvent.getSource().getParent();
			dialogNewBTP.close();
		},

		/* Abrir el dialog para los filtros y ordenaciones */
		onOpenViewSettings: function (oEvent) {
			var sDialogTab = "filter";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		/*Confirmar los filtros y ordenaciones seleccionados */
		onConfirmViewSettingsDialog: function (oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [],
				aFilters2 = [],
				aCaptions = [];
			var value;
			aFilterItems.forEach(function (oItem) {
				if (oItem.getKey() == "A") {
					value = true;
				} else {
					value = false;
				}
				aFilters2.push(new Filter(oItem.getParent().getKey(), FilterOperator.EQ, value));
			});
			if (aFilters2.length > 0) {
				aFilters.push(new Filter(aFilters2, false));
			}
			this._oTableFilterState = aFilters;
			var sQuery = this.byId("searchField").getValue();
			var aTableSearchState = [new Filter([
				new Filter("id", FilterOperator.Contains, sQuery),
				new Filter("title", FilterOperator.Contains, sQuery),
				new Filter("description", FilterOperator.Contains, sQuery)
			], false)];
			this._applySearch(aTableSearchState);
		},

		/* Resetear los filtros */
		handleResetFilters: function () {

		},

		/* Abrir para la gestión del Business Process Types */
		onBPs: function () {
			if (!this.byId("manageBPs")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.manageBPs",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("manageBPs").open();
			}
		},

		/* Abrir para la gestión de Custom Fields */
		onListValues: function (oEvent) {
			var menuItem = oEvent.getSource();
			var key = menuItem.getKey();
			this.keyList = key;
			var text = menuItem.getText();
			var textno = this.getResourceBundle().getText("no");
			var textload = this.getResourceBundle().getText("load");
			var text2 = textno + ' ' + text;
			var text3 = textload + ' ' + text;
			this.fill_List_Values();
			if (!this.byId("manageLVs")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.manageLVs",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.setTitle(text);
					this.byId("tableLVs").setNoDataText(text2);
					this.byId("tableLVsHeader").setText(text);
					this.byId("syncLV").setText(text3);
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("manageLVs").setTitle(text);
				this.byId("tableLVs").setNoDataText(text2);
				this.byId("tableLVsHeader").setText(text);
				this.byId("syncLV").setText(text3);
				this.byId("manageLVs").open();
			}
		},

		/* Buscar en el listado */
		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				aTableSearchState = [new Filter([
					new Filter("id", FilterOperator.Contains, sQuery),
					new Filter("title", FilterOperator.Contains, sQuery),
					new Filter("description", FilterOperator.Contains, sQuery)
				], false)];
			}
			this._applySearch(aTableSearchState);
		},

		/* Refrescar las valores del listado */
		onRefresh: function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* Mostrar el Detalle del template seleccionado en el listado */
		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext("templates").getProperty("id"),
				version: oItem.getBindingContext("templates").getProperty("active_version")
			});
		},

		/* Aplicar los filtros de la búsqueda */
		_applySearch: function (aTableSearchState) {
			var aFilters = aTableSearchState.concat(this._oTableFilterState);
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aFilters, "Application");
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},

		/* Recuperar los Business Process de persistencia */
		fill_Business_Process: function () {
			var oModel = this.getOwnerComponent().getModel();
			var BPModel = this.getOwnerComponent().getModel("BProcess");
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
					BPModel.setData(results);
					BPModel.refresh();
				},
				error: function (oError) {}
			});
		},

		/* Recuperar los Custom Fields de persistencia */
		fill_List_Values: function () {
			var aFilter = [];
			var lvaid = this.keyList;
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
				},
				error: function (oError) {}
			});
		},

		/* Borrar un determinado Business Process Type */
		deleteBP: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("BProcess").getPath();
			var itemsModel = this.getView().getModel("BProcess");
			var oModel = this.getView().getModel();
			var sPath2 = sPath + "/bpt_id";
			var bpt_id = itemsModel.getProperty(sPath2);
			var sPath1 = "/Di_Business_Process(guid'" + bpt_id + "')";
			var text = this.getResourceBundle().getText("sureDelBpt");
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
								that.fill_Business_Process();
								sap.m.MessageToast.show(that.getResourceBundle().getText("sucDelBpt"));
							},
							error: function (oError) {
								sap.m.MessageToast.show(that.getResourceBundle().getText("error"));
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
		}

	});
});
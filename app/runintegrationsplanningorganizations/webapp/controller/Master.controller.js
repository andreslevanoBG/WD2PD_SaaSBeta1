sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"../model/formatter"
], function (BaseController, JSONModel, History, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter) {
	"use strict";

	var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
		pattern: "YYYY-MM-ddTHH:mm:ss"
	});

	return BaseController.extend("shapein.RunIntegrationPlanningOrganizations.controller.Master", {

		formatter: formatter,

		/* Al instanciar el objeto */
		onInit: function () {
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();
			this._oList = oList;
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};
			var handlerEvent = sap.ui.getCore().getEventBus();
			handlerEvent.subscribe("Detail", "Delete_Plan", this._delete_Plan, this);
			this.setModel(oViewModel, "masterView");
			oList.attachEventOnce("updateFinished", function () {
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});
			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
			this.setModel(new JSONModel(), "newExec");
			var dataNewExec = {
				fromUpd: new Date(1900, 0, 1),
				toUpd: new Date(),
				fromEffec: new Date(1900, 0),
				toEffec: new Date(),
				orgsTopLevel: [],
				supervisories: [],
			};
			var newExecModel = this.getView().getModel("newExec");
			newExecModel.setData(dataNewExec);
			var oModelTime = this.getOwnerComponent().getModel("timezones");
			oModelTime.setSizeLimit(1000);
		},

		/* Al cargar la lista del máster */
		onUpdateFinished: function (oEvent) {
			this._updateListItemCount(oEvent.getParameter("total"));
		},

		/* Al realizar una búsqueda en el máster*/
		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				this.onRefresh();
				return;
			}
			this._oListFilterState.aFilter = [new Filter("pck_code", FilterOperator.EQ, "SYN_ORG")];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				//this._oListFilterState.aSearch = [new Filter("comments", FilterOperator.Contains, sQuery)];
				this._oListFilterState.aSearch = [new Filter("tolower(comments)", FilterOperator.Contains, "'" + sQuery.toLowerCase() + "'")];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();
		},

		/* Respuesta al evento lanzado para el borrado de la planificación */
		_delete_Plan: function (sChanel, sEvent, oData) {
			if (sEvent === "Delete_Plan") {
				var uuid = oData.Number;
				var items = this._oList.getItems();
				var oModel = this.getOwnerComponent().getModel();
				for (var i = 0; i < items.length; i++) {
					var uuid2 = items[i].getTitle();
					if (uuid2 !== uuid) {
						var firstItem = items[i];
						this._oList.setSelectedItem(firstItem, true);
						var mParam = {
							listItem: firstItem,
							selected: true
						};
						var sPath = firstItem.getBindingContext().getPath();
						this.getOwnerComponent().oListSelector.selectAListItem(sPath);
						this._oList.fireSelectionChange(mParam);
						break;
					}
				}
			}
		},

		/* Al refrescar la lista del máster*/
		onRefresh: function () {
			this._oList.getBinding("items").refresh();
		},

		/* Abre el popup para filtros y ordenamientos */
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
					name: "shapein.RunIntegrationPlanningOrganizations.view.ViewSettingsDialog",
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

		/* Al confirmar los valores de filtrado u ordenación, se generan los filtros y sorts */
		onConfirmViewSettingsDialog: function (oEvent) {
			this._applySortGroup(oEvent);
		},

		/*Aplicamos el ordenación del grupo */
		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			this._oList.getBinding("items").sort(aSorters);
		},

		/* Se ejecuta el evento de cambio de selección en la lista del máster */
		onSelectionChange: function (oEvent) {
			var oList = oEvent.getSource(),
				bSelected = oEvent.getParameter("selected");
			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			}
		},

		/* Event lanzado cuando nadie corresponde con la selección */
		onBypassed: function () {
			this._oList.removeSelections(true);
		},

		/* Al agrupar creamos el item de cabecera */
		createGroupHeader: function (oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		/*Navegamos hacia atrás */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},

		/* Crear el modelo para la vista */
		_createViewModel: function () {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "uuid",
				groupBy: "None"
			});
		},

		/* Evento al matchear el master */
		_onMasterMatched: function () {
			this.getModel("appView").setProperty("/layout", "OneColumn");
		},

		/*Mostramos el detalle del objeto seleccionado en la lista*/
		_showDetail: function (oItem) {
			var bReplace = !Device.system.phone;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("uuid")
			}, bReplace);
		},

		/* Actualizamos el contador en la lista del máster */
		_updateListItemCount: function (iTotalItems) {
			var sTitle;
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/* Aplicamos los filtros */
		_applyFilterSearch: function () {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/* Actualizamos la barra indicando los filtros aplicados */
		_updateFilterBar: function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		changeDTP: function (oEvent) {
			var bValid = oEvent.getParameter("valid");
			if (!bValid) {
				oEvent.getSource().setValueState("Error");
			} else {
				oEvent.getSource().setValueState("None");
			}
		},

		/* Cancelar la ejecución on Demand */
		cancelOnDemand: function (oEvent) {
			var dialog = oEvent.getSource().getParent();
			dialog.close();

		},

		/* Validamos el campo para que esté relleno */
		_validateInput: function (oInput) {
			var sValueState = "None";
			var bValidationError = false;
			var value = oInput.getValue();
			if (value == "") {
				sValueState = "Error";
				bValidationError = true;
			} else if (oInput.getValueState() == "Error") {
				sValueState = "Error";
				bValidationError = true;
			}
			oInput.setValueState(sValueState);
			return bValidationError;
		},

		/* Al cambiar fechas de la ejecución on Demand */
		changeDatesDemand: function (oEvent) {
			var value = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			var sValueState = "None";
			var bValid = oEvent.getParameter("valid");
			if (value == "") {
				sValueState = "Error";
			} else if (!bValid) {
				sValueState = "Error";
			}
			oInput.setValueState(sValueState);
		},

		/* Realizamos la ejecución on Demand */
		execOnDemand: function (oEvent) {
			var oView = this.getView(),
				aInputs = [
					oView.byId("DTP11"),
					oView.byId("DTP12"),
					oView.byId("DTP13"),
					oView.byId("DTP14")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInput(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("errorVal");
				sap.m.MessageBox.alert(text);
				return;
			}
			if (aInputs[0].getDateValue() > aInputs[1].getDateValue()) {
				var text = this.getResourceBundle().getText("updatTo");
				sap.m.MessageBox.alert(text);
				aInputs[1].setValueState("Error");
				return;
			}
			if (aInputs[2].getDateValue() > aInputs[3].getDateValue()) {
				var text = this.getResourceBundle().getText("effecDate");
				sap.m.MessageBox.alert(text);
				aInputs[1].setValueState("Error");
				return;
			}
			var text = this.getResourceBundle().getText("sureOnDem");
			var that = this;
			var dialogDemand = oEvent.getSource().getParent();
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialogDemand = oEvent.getSource().getParent();
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						var NewExecModel = that.getModel("newExec");
						var fromUpd = NewExecModel.getProperty("/fromUpd");
						var toUpd = NewExecModel.getProperty("/toUpd");
						var fromEffec = NewExecModel.getProperty("/fromEffec");
						var toEffec = NewExecModel.getProperty("/toEffec");
						var supervisoriest = that.byId("multiInput1").getTokens();
						var toplevel = NewExecModel.getProperty("/orgsTopLevel");;
						var organizations = [];
						for (var i = 0; i < supervisoriest.length; i++) {
							var organization = supervisoriest[i].getText();
							organizations.push(organization);
						}
						fromUpd = dateFormat.format(fromUpd);
						toUpd = dateFormat.format(toUpd);
						fromEffec = dateFormat.format(fromEffec);
						toEffec = dateFormat.format(toEffec);
						var data = {
							"test_mode": "False",
							"algorithm": "T-D",
							"transaction_log": {
								"time_zone": "CET",
								"updated_from": fromUpd,
								"updated_to": toUpd,
								"effective_from": fromEffec,
								"effective_to": toEffec
							},
							"organizations": {
								"reference_id": "Organization_Reference_ID",
								"mapping_organizations_top_level": toplevel,
								"organizations_list": organizations
							}
						};
						var datajson = JSON.stringify(data);
						var url = "/CPI-WD2PD_Dest/md/organizations_sync/ondemand";
						if (that.getOwnerComponent().settings) {
							var cuscode = that.getOwnerComponent().settings.find(setting => setting.code === "Customer-Code");
							var cusclientid = that.getOwnerComponent().settings.find(setting => setting.code === "Customer-Client_Id");
							var cusscope = that.getOwnerComponent().settings.find(setting => setting.code === "Customer-Scope");
							var settings = {
								"url": url,
								"method": "POST",
								"headers": {
									"Content-Type": "application/json",
									"Accept": "application/json",
									"Customer-Code": cuscode.value,
									"Customer-Client_Id": cusclientid.value,
									"Customer-Scope": cusscope.value,
								},
								"data": datajson
							};
							$.ajax(settings).done(function (data, textStatus, jqXHR) {
									var a = data;
									var b = textStatus;
									var c = jqXHR;
									if (textStatus == "success") {
										var text1 = that.getResourceBundle().getText("execOn");
										var text2 = that.getResourceBundle().getText("executed");
										var texto = text1 + " " + data.process_id + " " + text2;
										sap.m.MessageToast.show(texto);
									}
								})
								.fail(function (jqXHR, textStatus, errorThrown) {
									var d = jqXHR;
									var e = textStatus;
									var f = errorThrown;
								});
						}
						dialog.close();
						dialogDemand.close();
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

		/* Al pulsar el botón para la creación de una nueva Planificación */
		createPlan: function (oEvent) {
			if (!this.byId("newPlan")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.RunIntegrationPlanningOrganizations.view.fragment.NewPlanning",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					var fnValidator = function (args) {
						var text = args.text;
						return new sap.m.Token({
							key: text,
							text: text
						});
					};
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("newPlan").open();
			}
		},

		/* Validación del campo indicado */
		_validateInputNewP: function (oInput) {
			var sValueState = "None";
			var bValidationError = false;
			var oBinding = oInput.getBinding("value");
			var value = oInput.getValue();
			if (value == "") {
				sValueState = "Error";
				bValidationError = true;
			} else if (oInput.getValueState() == "Error") {
				sValueState = "Error";
				bValidationError = true;
			}
			oInput.setValueState(sValueState);
			return bValidationError;
		},

		/* Al guardar la nueva planificación */
		execNewPlan: function (oEvent) {
			var oView = this.getView(),
				aInputs = [
					oView.byId("Comments"),
					oView.byId("DTP1"),
					oView.byId("DTP2"),
					oView.byId("DTP3")
				],
				bValidationError = false;
			if (this.byId("ProcessType").getSelectedKey() === "I") {
				aInputs.forEach(function (oInput) {
					bValidationError = this._validateInputNewP(oInput) || bValidationError;
				}, this);
			}
			if (bValidationError) {
				var text = this.getResourceBundle().getText("errorVal");
				sap.m.MessageBox.alert(text);
				return;
			}
			var comments = aInputs[0].getValue();
			var text = this.getResourceBundle().getText("sureCreate");
			var that = this;
			var dialogNewPlan = oEvent.getSource().getParent();
			var tit = this.getResourceBundle().getText("confi");
			var yes = this.getResourceBundle().getText("yes");
			var no = this.getResourceBundle().getText("no");
			var dialogNewPlan = oEvent.getSource().getParent();
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
						var proc_type = that.byId("ProcessType").getSelectedKey();
						var data = {
							pck_code: "SYN_ORG",
							type: "D",
							enable: enable,
							processing_type: proc_type,
							comments: comments
						};
						var oModel = that.getOwnerComponent().getModel();
						dialogNewPlan.setBusy(true);
						oModel.create("/Integration_Pck_Planning", data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								dialogNewPlan.setBusy(false);
								dialogNewPlan.close();
								that.createDataBatch(oData.uuid, oData.processing_type);
								var planSuc = this.getResourceBundle().getText("planSuc");
								sap.m.MessageToast.show(planSuc);
							},
							error: function (oError) {
								dialogNewPlan.setBusy(false);
								dialogNewPlan.close();
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

		/* Al cambiar el tipo de procesamiento */
		changeTypeProcessing: function (oEvent) {
			var key = oEvent.getParameter("selectedItem").getKey();
			var oView = this.getView();
			var form = oView.byId("SimpleFormChange480_12");
			if (key == "R") {
				form.getAggregation("form").getAggregation("formContainers")[1].setVisible(false);
			} else {
				form.getAggregation("form").getAggregation("formContainers")[1].setVisible(true);
			}
		},

		/* Creamos los datos para el batch de los aData */
		createDataBatch: function (planUuid, processing_type) {
			var planning_uuid = planUuid;
			var sPath = "/Integration_Pck_Planning_Adata";
			var oModel = this.getOwnerComponent().getModel();
			oModel.setDeferredGroups(["createGroup"]);
			var oData = {};
			if (processing_type == "I") {
				oData.planning_uuid = planning_uuid;
				oData.level1 = "WS_GET_ORGANIZATIONS";
				oData.level2 = "TIME_ZONE";
				oData.value = this.byId("TimeZone").getSelectedKey();
				oData.value2 = null;
				oModel.create(sPath, oData, {
					groupId: "createGroup"
				});
				var oData2 = {};
				oData2.planning_uuid = planning_uuid;
				oData2.level1 = "WS_GET_ORGANIZATIONS";
				oData2.level2 = "NEXT_UPDATED_FROM";
				oData2.value = "";
				oData2.value2 = null;
				oModel.create(sPath, oData2, {
					groupId: "createGroup"
				});
				var oData3 = {};
				oData3.planning_uuid = planning_uuid;
				oData3.level1 = "WS_GET_ORGANIZATIONS";
				oData3.level2 = "INITIAL_DATE_FROM";
				oData3.value = this.byId("DTP1").getValue();
				oData3.value2 = null;
				oModel.create(sPath, oData3, {
					groupId: "createGroup"
				});
				var oData4 = {};
				oData4.planning_uuid = planning_uuid;
				oData4.level1 = "WS_GET_ORGANIZATIONS";
				oData4.level2 = "RETRO_CHG_EFFECTIVE_FROM";
				oData4.value = this.byId("DTP2").getValue();
				oData4.value2 = null;
				oModel.create(sPath, oData4, {
					groupId: "createGroup"
				});
				var oData5 = {};
				oData5.planning_uuid = planning_uuid;
				oData5.level1 = "WS_GET_ORGANIZATIONS";
				oData5.level2 = "FUTURE_CHG_UPDATED_FROM";
				oData5.value = this.byId("DTP3").getValue();
				oData5.value2 = null;
				oModel.create(sPath, oData5, {
					groupId: "createGroup"
				});
			}
			var oData6 = {};
			oData6.planning_uuid = planning_uuid;
			oData6.level1 = "MAPPING_ORGS_TOP_LEVEL";
			oData6.level2 = "REFERENCE_ID";
			oData6.value = this.byId("RefId").getSelectedKey();
			oData6.value2 = null;
			oModel.create(sPath, oData6, {
				groupId: "createGroup"
			});
			var oTable = this.getView().byId("tableOrgs2");
			var items = oTable.getItems();
			for (var i = 0; i < items.length; i++) {
				var cells = items[i].getCells();
				var oData7 = {};
				oData7.planning_uuid = planning_uuid;
				oData7.level1 = "MAPPING_ORGS_TOP_LEVEL";
				oData7.level2 = "SUPERVISORY-PD_PARENT";
				oData7.value = cells[0].getValue();
				oData7.value2 = cells[1].getValue();
				oModel.create(sPath, oData7, {
					groupId: "createGroup"
				});
			}
			oModel.submitChanges({
				groupId: "createGroup",
				success: this.successCreateBatch,
				error: this.errorCreateBatch
			});
		},

		/* Si el Batch ha ido correctamente */
		successCreateBatch: function (oData, response) {
			//TODO
			var a = 0;
		},

		/* Si ha habido error en el Batch */
		errorCreateBatch: function (oError) {
			//TODO
			var e = 0;
		},

		/* Cancelamos la nueva planificación */
		cancelNewPlan: function (oEvent) {
			var dialog = oEvent.getSource().getParent();
			dialog.close();
		},

		/* Añadir una fila de organización para la nueva ejecución */
		addRow_toplevel: function (oArg) {
			var dataModel = this.getView().getModel("newExec");
			var data = dataModel.getData();
			var newItem = {
				organization: "",
				pd_parent: ""
			};
			data.orgsTopLevel.push(newItem);
			dataModel.setData(data);
			dataModel.refresh();
		},

		/* Borrar fila de organizaciones para la nueva ejecución */
		deleteRow_toplevel: function (oArg) {
			var dataModel = this.getView().getModel("newExec");
			var oTable = this.getView().byId("tableOrgs");
			var oItem = oTable.getSelectedItem();
			if (oItem) {
				var deleteRecordPath = oItem.getBindingContext("newExec").getPath();
				var indice = parseInt(deleteRecordPath.substr(deleteRecordPath.length - 1));
				dataModel.getData().orgsTopLevel.splice(indice, 1); //removing 1 record from i th index.
				dataModel.refresh();
			} else {
				sap.m.MessageToast.show('Please, select a row to delete.');
			}
		},

		/* Añadir una fila de organización para la nueva planificación */
		addRow_toplevel2: function (oArg) {
			var oTable = this.getView().byId("tableOrgs2");
			var columnListItem = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Input({
						text: ""
					}),
					new sap.m.Input({
						text: ""
					})
				]
			});
			oTable.addItem(columnListItem);
		},

		/* Borrar fila de organizaciones para la nueva planificación */
		deleteRow_toplevel2: function (oArg) {
			var oTable = this.getView().byId("tableOrgs2");
			var oItem = oTable.getSelectedItem();
			if (oItem) {
				oTable.removeItem(oItem);
			} else {
				sap.m.MessageToast.show('Please, select a row to delete.');
			}
		},

		/* Al pulsar para configurar una nueva ejecución onDemand */
		newOnDemand: function (oEvent) {
			if (!this.byId("ondemand")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.RunIntegrationPlanningOrganizations.view.fragment.OnDemand",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					var fnValidator = function (args) {
						var text = args.text;
						return new sap.m.Token({
							key: text,
							text: text
						});
					};
					this.getView().byId("multiInput1").addValidator(fnValidator);
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("ondemand").open();
			}
		}
	});
});
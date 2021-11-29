sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	"sap/ui/core/Fragment",
], function (BaseController, JSONModel, formatter, mobileLibrary, Fragment) {
	"use strict";

	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("shapein.RunIntegrationPlanningOrganizations.controller.Detail", {

		formatter: formatter,
		adataOld: {},
		oldKey: "",
		_formFragments: null,

		/* Al instanciar el objeto */
		onInit: function () {
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.oSemanticPage = this.byId("detailPage");
			this.oEditAction = this.byId("editAction");
			this.oDeleteAction = this.byId("deleteAction");
			this.showCustomActions(false);
			var newPlanModel = new JSONModel({
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
			});
			this.setModel(newPlanModel, "newPlan");
			var daysModel = new JSONModel();
			var data = [];
			var item = {};
			for (var i = 0; i < 31; i++) {
				var item = {};
				item.text = i + 1;
				item.key = item.text;
				data.push(item);
			}
			daysModel.setData(data);
			this.setModel(new JSONModel(), "adata");
			this.setModel(daysModel, "days");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			this.createFragmentsData();
		},

		/* Al salir de la vista */
		onExit: function () {
			this._formFragments["DisplayData"].destroy();
			this._formFragments["ChangeData"].destroy();
			this._formFragments = null;
		},

		changeDTP: function (oEvent) {
			var bValid = oEvent.getParameter("valid");
			if (!bValid) {
				oEvent.getSource().setValueState("Error");
			} else {
				oEvent.getSource().setValueState("None");
			}
		},

		/* Instanciamos los fragmentos para la visualización o edición de los aDatas */
		createFragmentsData: function () {
			var sFragmentName = "DisplayData";
			this._formFragments = [];
			var fragmentName = "shapein.RunIntegrationPlanningOrganizations.view.fragment." + sFragmentName;
			Fragment.load({
				id: "displayData",
				name: fragmentName,
				controller: this
			}).then(function (oFragment) {
				this.getView().addDependent(oFragment);
				this._formFragments[sFragmentName] = oFragment;
				this._toggleButtonsAndView(false);
			}.bind(this));
			var sFragmentName2 = "ChangeData";
			var fragmentName2 = "shapein.RunIntegrationPlanningOrganizations.view.fragment." + sFragmentName2;
			Fragment.load({
				id: "changeData",
				name: fragmentName2,
				controller: this
			}).then(function (oFragment) {
				this.getView().addDependent(oFragment);
				var fnValidator = function (args) {
					var text = args.text;
					return new sap.m.Token({
						key: text,
						text: text
					});
				};
				this._formFragments[sFragmentName2] = oFragment;
			}.bind(this));
		},

		/* Función al finalizar la carga del listado de items */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* Evento al matchear el objeto seleccionado */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("Integration_Pck_Planning", {
					uuid: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/* Bindeamos la vista al objeto seleccionado con sus detalles */
		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", false);
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		/* Al cambiar el detalle del objeto a mostrar */
		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}
			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.uuid,
				sObjectName = oObject.uuid,
				oViewModel = this.getModel("detailView");
			if (oObject.enable) {
				this.oldKey = "A";
			} else {
				this.oldKey = "U";
			}
			var oModel = this.getOwnerComponent().getModel();
			var adataModel = this.getView().getModel("adata");
			var that = this;
			oViewModel.refresh();
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "adata"
				},
				success: function (oData, oResponse) {
					var results = oData.adata.results;
					delete oData.__metadata;
					var item = {};
					var item2 = {};
					item.orgsTopLevel = [];
					item2.orgsTopLevel = [];
					results.forEach(function (entry) {
						delete entry.__metadata;
						switch (entry.level2) {
						case "TIME_ZONE":
							item.time_zone = entry.value;
							item.time_zone_uuid = entry.uuid;
							item.planning_uuid = entry.planning_uuid;
							item2.time_zone = entry.value;
							item2.time_zone_uuid = entry.uuid;
							item2.planning_uuid = entry.planning_uuid;
							break;
						case "INITIAL_DATE_FROM":
							item.initial_date_from = entry.value;
							item.initial_date_from_uuid = entry.uuid;
							item2.initial_date_from = entry.value;
							item2.initial_date_from_uuid = entry.uuid;
							break;
						case "RETRO_CHG_EFFECTIVE_FROM":
							item.retro_effec_from = entry.value;
							item.retro_effec_from_uuid = entry.uuid;
							item2.retro_effec_from = entry.value;
							item2.retro_effec_from_uuid = entry.uuid;
							break;
						case "FUTURE_CHG_UPDATED_FROM":
							item2.fut_upd_from = entry.value;
							item2.fut_upd_from_uuid = entry.uuid;
							item.fut_upd_from = entry.value;
							item.fut_upd_from_uuid = entry.uuid;
							break;
						case "NEXT_UPDATED_FROM":
							item.next_upd_from = entry.value;
							item.next_upd_from_uuid = entry.uuid;
							item2.next_upd_from = entry.value;
							item2.next_upd_from_uuid = entry.uuid;
							break;
						case "REFERENCE_ID":
							item.ref_id = entry.value;
							item.ref_id_uuid = entry.uuid;
							item2.ref_id = entry.value;
							item2.ref_id_uuid = entry.uuid;
							break;
						case "SUPERVISORY-PD_PARENT":
							var supervisory = {};
							supervisory.organization = entry.value;
							supervisory.pd_parent = entry.value2;
							supervisory.Uuid = entry.uuid;
							item.orgsTopLevel.push(supervisory);
							item2.orgsTopLevel.push(supervisory);
							break;
						default:
						}
					});
					that.adataOld = item2;
					adataModel.setData(item);
					oViewModel.setProperty("/busy", false);
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});
			if (this._formFragments !== null) {
				var oFormFragment = this._formFragments["ChangeData"];
				if (oFormFragment) {
					this._toggleButtonsAndView(false);
				}
			}
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);
			this.showCustomActions(false);
			this.oEditAction.setVisible(true);
			var sPath1 = sPath + "/last_execution";
			var date = oModel.getProperty(sPath1);
			if (date === null) {
				this.oDeleteAction.setVisible(true);
			} else {
				this.oDeleteAction.setVisible(false);
			}
			this.byId("segButton").setEnabled(false);
			this.byId("comDisplay").setVisible(true);
			this.byId("comChange").setVisible(false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		addRow_toplevelA: function (oArg) {
			var dataModel = this.getView().getModel("adata");
			var data = dataModel.getData();
			var newItem = {
				organization: "",
				pd_parent: ""
			};
			data.orgsTopLevel.push(newItem);
			dataModel.setData(data);
			dataModel.refresh();
		},

		deleteRow_toplevelA: function (oArg) {
			var dataModel = this.getView().getModel("adata");
			var oTable = Fragment.byId("changeData", "tableOrgs4");
			var oItem = oTable.getSelectedItem();
			if (oItem) {
				var deleteRecordPath = oItem.getBindingContext("adata").getPath();
				var indice = parseInt(deleteRecordPath.substr(deleteRecordPath.length - 1));
				dataModel.getData().orgsTopLevel.splice(indice, 1); //removing 1 record from i th index.
				dataModel.refresh();
			} else {
				sap.m.MessageToast.show('Please, select a row to delete.');
			}
		},

		/* Los metadatas son cargados inicializa */
		_onMetadataLoaded: function () {
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);
			oLineItemTable.attachEventOnce("updateFinished", function () {
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});
			oViewModel.setProperty("/busy", true);
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			this.byId('edit').setEnabled(true);
		},

		/* Obtenemos la instancia del fragmento indicado */
		_getFormFragment: function (sFragmentName) {
			var oFormFragment = this._formFragments[sFragmentName];
			if (oFormFragment) {
				return oFormFragment;
			}
		},

		/* Mostramos el fragmento indicado */
		_showFormFragment: function (sFragmentName) {
			var oIconTabFilter = this.byId("icontabData");
			var content = oIconTabFilter.getContent();
			var barId = this.getView().createId("bar");
			if (content[0].getId() !== barId) {
				var id = content[0].getId();
				oIconTabFilter.removeContent(id);
			}
			var conte = this._getFormFragment(sFragmentName);
			if (Fragment.byId("changeData", "dp1")) {
				Fragment.byId("changeData", "dp1").setValueState("None");
				Fragment.byId("changeData", "dp2").setValueState("None");
				Fragment.byId("changeData", "dp3").setValueState("None");
				Fragment.byId("changeData", "dp4").setValueState("None");
			}
			oIconTabFilter.insertContent(conte);
		},

		/* Al presionar para editar los aData */
		handleEditPress: function () {
			this._toggleButtonsAndView(true);
		},

		/* Gestionar los elementos UI para pasar de Edición a Visualización y viceversa */
		_toggleButtonsAndView: function (bEdit) {
			var oView = this.getView();
			oView.byId("edit").setVisible(!bEdit);
			oView.byId("save").setVisible(bEdit);
			oView.byId("cancel").setVisible(bEdit);
			this._showFormFragment(bEdit ? "ChangeData" : "DisplayData");
		},

		/* Al Cancelar la Edición de los aData*/
		handleCancelPress: function () {
			var oModel = this.getView().getModel();
			var adataModel = this.getView().getModel("adata");
			var data = Object.assign({}, this.adataOld);
			adataModel.setData(data);
			adataModel.refresh();
			this._toggleButtonsAndView(false);
		},

		/* Validación */
		_validateInputEditA: function (oInput) {
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

		/* Guardar los valores editados */
		handleSavePress: function (oEvent) {
			var adataModel = this.getView().getModel("adata");
			var adata = adataModel.getData();
			var oModel = this.getOwnerComponent().getModel();
			var fragmentId = this.getView().createId("changeData");
			var oView = this.getView(),
				aInputs = [
					Fragment.byId("changeData", "dp1"),
					Fragment.byId("changeData", "dp2"),
					Fragment.byId("changeData", "dp3"),
					Fragment.byId("changeData", "dp4")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputEditA(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("errorVal");
				sap.m.MessageBox.alert(text);
				return;
			}
			var text = this.getResourceBundle().getText("sureUpdData");
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
						var oViewModel = that.getModel("detailView");
						oViewModel.setProperty("/busy", true);
						var planning_uuid = adataModel.getProperty("/planning_uuid");
						planning_uuid = that.byId("title").getText();
						var sPath = "/Integration_Pck_Planning_Adata";
						oModel.setDeferredGroups(["updateGroup"]);
						var oData = {};
						var sPath1 = sPath + "(" + adata.time_zone_uuid + ")";
						oData.uuid = adata.time_zone_uuid;
						oData.value = adata.time_zone;
						oModel.update(sPath1, oData, {
							groupId: "updateGroup"
						});
						var oData2 = {};
						var sPath2 = sPath + "(" + adata.next_upd_from_uuid + ")";
						oData2.uuid = adata.next_upd_from_uuid;
						oData2.value = adata.next_upd_from;
						oModel.update(sPath2, oData2, {
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
						var oData6 = {};
						oData6.uuid = adata.ref_id_uuid;
						var sPath6 = sPath + "(" + oData6.uuid + ")";
						oData6.value = adata.ref_id;
						oModel.update(sPath6, oData6, {
							groupId: "updateGroup"
						});
						var oTable = Fragment.byId("changeData", "tableOrgs4");
						var items = oTable.getItems();
						var sPath7 = "/Integration_Pck_Planning_Adata";
						for (var i = 0; i < items.length; i++) { //Los nuevos
							var resultado = that.adataOld.orgsTopLevel.find(function (supervisory) {
								return supervisory.organization === items[i].getCells()[0].getValue();
							});
							if (!resultado) {
								var oData7 = {};
								oData7.planning_uuid = planning_uuid;
								oData7.level1 = "MAPPING_ORGS_TOP_LEVEL";
								oData7.level2 = "SUPERVISORY-PD_PARENT";
								oData7.value = items[i].getCells()[0].getValue();
								oData7.value2 = items[i].getCells()[1].getValue();
								oModel.create(sPath7, oData7, {
									groupId: "updateGroup"
								});
							}
						}
						for (var j = 0; j < that.adataOld.orgsTopLevel.length; j++) { //Los eliminados
							var resultado2 = items.find(function (item) {
								return item.getCells()[0].getValue() === that.adataOld.orgsTopLevel[j].organization;
							});
							if (!resultado2) {
								var oData8 = {};
								var sPath8 = sPath + "(" + that.adataOld.orgsTopLevel[j].Uuid + ")";
								oModel.remove(sPath8, oData8, {
									groupId: "updateGroup"
								});
							}
						}
						that._toggleButtonsAndView(false);
						oModel.submitChanges({
							groupId: "updateGroup",
							success: that.successUpdateBatch.bind(that),
							error: that.errorUpdateBatch
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

		/* Manejar la respuesta exitosa del batch de grabación */
		successUpdateBatch: function (oData, response) {
			var text = this.getResourceBundle().getText("updSucData");
			sap.m.MessageToast.show(text);
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", false);
			this._onBindingChange();
		},

		/* Manejar la respuesta errónea del batch de grabación */
		errorUpdateBatch: function (oError) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", false);
			sap.m.MessageToast.show("Error");

		},

		/* Cerrar la visualización del detalle */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/* Al pulsar para añadir una periodicidad de planificación */
		onAddPlanD: function () {
			var data = {
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
			var newPlanModel = this.getModel("newPlan");
			newPlanModel.setData(data);
			var text = this.getResourceBundle().getText("newPlanD");
			if (!this.byId("PlanningD")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.RunIntegrationPlanningOrganizations.view.fragment.Planning",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					this.byId("createBut").setVisible(true);
					this.byId("saveBut").setVisible(false);
					oDialog.setTitle(text);
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("createBut").setVisible(true);
				this.byId("saveBut").setVisible(false);
				this.byId("PlanningD").setTitle(text);
				this.byId("begda").setValueState("None");
				this.byId("endda").setValueState("None");
				this.byId("TP1").setValueState("None");
				this.byId("TP2").setValueState("None");
				this.byId("PlanningD").open();
			}
		},

		/* Cancelar la planificación */
		cancelPlan: function (oEvent) {
			var dialog = oEvent.getSource().getParent();
			dialog.close();
		},

		/* Evento al modificar si se va a activar o no la planificación*/
		selExecute: function (oEvent) {
			var index = oEvent.getParameter("selectedIndex");
			var NewPlanModel = this.getModel("newPlan");
			if (index == 0) {
				NewPlanModel.setProperty("/execute", true);
			} else {
				NewPlanModel.setProperty("/execute", false);
			}
		},

		/* Evento de cambiar la fecha de inicio de planificación */
		changeBegda: function (oEvent) {
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
			var NewPlanModel = this.getModel("newPlan");
			NewPlanModel.setProperty("/begda", value);
		},

		/* Evento de cambiar la fecha de finalización de planificación */
		changeEndda: function (oEvent) {
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
			var NewPlanModel = this.getModel("newPlan");
			NewPlanModel.setProperty("/endda", value);
		},

		/* Evento al cambiar la selección de días de ejecución de la planificación */
		selectCheck: function (oEvent) {
			var source = oEvent.getSource();
			var text = source.getText();
			var NewPlanModel = this.getModel("newPlan");
			var periodValues = NewPlanModel.getProperty("/periodicity_values");
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
			NewPlanModel.setProperty("/periodicity_values", strValues);
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

		/* Evento al finalizar la selección de valores de planificación */
		handleSelectionFinish: function (oEvent) {
			var items = oEvent.getParameter("selectedItems");
			var itemsSel = [];
			for (var i = 0; i < items.length; i++) {
				itemsSel.push(items[i].getKey());
			}
			itemsSel.sort();
			var strValues = itemsSel.join("-");
			var NewPlanModel = this.getModel("newPlan");
			NewPlanModel.setProperty("/periodicity_valuesM", strValues);
		},

		/* Borrar una periodicidad de planificación */
		deletePlanD: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
			var itemsModel = this.getView().getModel();
			var text = this.getResourceBundle().getText("sureDelPlanD");
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
						itemsModel.remove(sPath, {
							success: function (oData, response) {
								var texto = that.getResourceBundle().getText("delPlanDSuc");
								sap.m.MessageToast.show(texto);
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

		/* Evento al cambiar el tipo periodicidad */
		changePeriodType: function (oEvent) {
			var selItem = oEvent.getParameter("selectedItem");
			var itemsCheck = this.byId("days").getItems();
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

		/* Evento de cambios en la selección */
		handleSelectionChange: function (oEvent) {
			var oInput = oEvent.getSource();
			var sValueState = "None";
			var selKeys = oInput.getSelectedKeys();
			if (selKeys.length > 0) {
				oInput.setValueState(sValueState);
			}
		},

		/* Al cambiar las horas de la planificación */
		timeChange: function (oEvent) {
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

		/* Al editar una periodicidad de planificación */
		editPlanD: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
			var itemsModel = this.getView().getModel();
			var sPath1 = sPath + "/execute";
			var execute = itemsModel.getProperty(sPath1);
			sPath1 = sPath + "/begda";
			var begdaD = itemsModel.getProperty(sPath1);
			var month = String(begdaD.getMonth() + 1);
			if (month < 10) {
				month = "0" + String(month);
			}
			var days = String(begdaD.getDate());
			if (days < 10) {
				days = "0" + String(days);
			}
			var begda = begdaD.getFullYear() + "-" + month + "-" + days;
			sPath1 = sPath + "/endda";
			var enddaD = itemsModel.getProperty(sPath1);
			var month2 = String(enddaD.getMonth() + 1);
			if (month2 < 10) {
				month2 = "0" + String(month2);
			}
			var days2 = String(enddaD.getDate());
			if (days2 < 10) {
				days2 = "0" + String(days2);
			}
			var endda = enddaD.getFullYear() + "-" + month2 + "-" + days2;
			sPath1 = sPath + "/periodicity_type";
			var periodicity_type = itemsModel.getProperty(sPath1);
			sPath1 = sPath + "/time_frecuency";
			var time_frecuency = itemsModel.getProperty(sPath1);
			sPath1 = sPath + "/time_measure";
			var time_measure = itemsModel.getProperty(sPath1);
			time_frecuency = String(time_frecuency) + time_measure;
			sPath1 = sPath + "/periodicity_values";
			var periodicity_values = itemsModel.getProperty(sPath1);
			sPath1 = sPath + "/time_zone";
			var time_zone = itemsModel.getProperty(sPath1);
			sPath1 = sPath + "/time_start";
			var timeSUTC = itemsModel.getProperty(sPath1);
			var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: "HH:mm:ss"
			});
			var offsetms = new Date(0).getTimezoneOffset() * 60 * 1000;
			var time_start = timeFormat.format(new Date(timeSUTC.ms + offsetms));
			sPath1 = sPath + "/time_end";
			var timeEUTC = itemsModel.getProperty(sPath1);
			var time_end = timeFormat.format(new Date(timeEUTC.ms + offsetms));
			var data = {
				path: sPath,
				execute: execute,
				begda: begda,
				endda: endda,
				periodicity_type: periodicity_type,
				ontime: false,
				periodicity_values: periodicity_values,
				time_frecuency: time_frecuency,
				time_start: time_start,
				time_end: time_end,
				time_zone: time_zone
			};

			var newPlanModel = this.getModel("newPlan");
			newPlanModel.setData(data);
			if (!this.byId("PlanningD")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.RunIntegrationPlanningOrganizations.view.fragment.Planning",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					this.byId("createBut").setVisible(false);
					this.byId("saveBut").setVisible(true);
					var texto = this.getResourceBundle().getText("editPlanD");
					oDialog.setTitle(texto);
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("createBut").setVisible(false);
				this.byId("saveBut").setVisible(true);
				var texto = this.getResourceBundle().getText("editPlanD");
				this.byId("begda").setValueState("None");
				this.byId("endda").setValueState("None");
				this.byId("TP1").setValueState("None");
				this.byId("TP2").setValueState("None");
				this.byId("PlanningD").setTitle(texto);
				this.byId("PlanningD").open();
			}
		},

		/* Validamos el campo que se le indique para que esté relleno */
		_validateInput: function (oInput) {
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

		/* Al salvar la planificación */
		execPlan: function (oEvent) {
			var oView = this.getView(),
				aInputs = [
					oView.byId("begda"),
					oView.byId("endda"),
					oView.byId("TP1"),
					oView.byId("TP2")
				],
				bValidationError = false;
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInput(oInput) || bValidationError;
			}, this);
			if (bValidationError) {
				var text = this.getResourceBundle().getText("errorVal");
				sap.m.MessageBox.alert(text);
			} else {
				if (this.byId("periodType").getSelectedItem().getKey() == "M") {
					var selKeys = this.byId("MC1").getSelectedKeys();
					if (selKeys.length == 0) {
						this.byId("MC1").setValueState("Error");
						var text = this.getResourceBundle().getText("errorVal");
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
						var text = this.getResourceBundle().getText("errorVal");
						sap.m.MessageBox.alert(text);
						return;
					}
				}
				var planDialog = oEvent.getSource().getParent();
				var button = oEvent.getSource().getText();
				var text = this.getResourceBundle().getText("savePlan");
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
							var uuid = that.byId("title").getText();
							var NewPlanModel = that.getModel("newPlan");
							var begda = NewPlanModel.getProperty("/begda");
							var endda = NewPlanModel.getProperty("/endda");
							var timezone = NewPlanModel.getProperty("/time_zone");
							var tp1 = that.byId("TP1").getDateValue();
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
							var tp2 = that.byId("TP2").getDateValue();
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
							var execute = NewPlanModel.getProperty("/execute");
							var path = NewPlanModel.getProperty("/path");
							var periodType = NewPlanModel.getProperty("/periodicity_type");
							if (periodType == "W") {
								var periodicity_values = NewPlanModel.getProperty("/periodicity_values");
							} else if (periodType == "M") {
								var periodicity_values = NewPlanModel.getProperty("/periodicity_valuesM");
							} else {
								var periodicity_values = "";
							}
							var onTime = NewPlanModel.getProperty("/ontime");
							if (!onTime) {
								var timefrec = NewPlanModel.getProperty("/time_frecuency");
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
							var oModel = that.getOwnerComponent().getModel();
							planDialog.setBusy(true);
							if (button == "Create") {
								oModel.create("/Integration_Pck_Planning_D", data, {
									headers: {
										"Content-Type": "application/json",
										'Accept': 'application/json'
									},
									success: function (oData, response) {
										planDialog.setBusy(false);
										planDialog.close();
										var texto1 = that.getResourceBundle().getText("planDCreaSuc");
										sap.m.MessageToast.show(texto1);

									},
									error: function (oError) {
										planDialog.setBusy(false);
										planDialog.close();
										sap.m.MessageToast.show("Error");
									}
								});
							} else if (button == "Save") {
								oModel.update(path, data, {
									headers: {
										"Content-Type": "application/json",
										'Accept': 'application/json'
									},
									success: function (oData, response) {
										planDialog.setBusy(false);
										planDialog.close();
										var texto1 = that.getResourceBundle().getText("planDSaveSuc");
										sap.m.MessageToast.show(texto1);
									},
									error: function (oError) {
										planDialog.setBusy(false);
										planDialog.close();
										sap.m.MessageToast.show("Error");
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

		/* Al pulsar la edición de la cabecera */
		onEdit: function () {
			this.showCustomActions(true);
			this.byId("segButton").setEnabled(true);
			this.byId("comDisplay").setVisible(false);
			this.byId("comChange").setVisible(true);
			this.oSemanticPage.setHeaderExpanded(true);
			this.oEditAction.setVisible(false);
			this.oDeleteAction.setVisible(false);
		},

		/* Al borrar la planificación */
		onDelete: function () {
			var sPath = this.getView().getBindingContext().getPath();
			var oModel = this.getOwnerComponent().getModel();
			var text = this.getResourceBundle().getText("delPlan");
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
						oModel.remove(sPath, {
							success: function (oData, response) {
								var oEven = new sap.ui.getCore().getEventBus();
								var uuid = that.byId("title").getText();
								oEven.publish("Detail", "Delete_Plan", {
									Number: uuid
								});
								var texto1 = that.getResourceBundle().getText("delPlanSuc");
								sap.m.MessageToast.show(texto1);
							},
							error: function (oError) {
								sap.m.MessageToast.show("Error");
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

		/* Al guardar la planificación */
		onSave: function () {
			this.showCustomActions(false);
			this.oEditAction.setVisible(true);
			this.byId("segButton").setEnabled(false);
			this.byId("comDisplay").setVisible(true);
			this.byId("comChange").setVisible(false);
			var that = this;
			var path = this.getView().getBindingContext().getPath();
			var oModel = this.getOwnerComponent().getModel();
			var sPath = this.getView().getBindingContext().getPath();
			var sPath1 = sPath + "/last_execution";
			var date = oModel.getProperty(sPath1);
			if (date === null) {
				this.oDeleteAction.setVisible(true);
			} else {
				this.oDeleteAction.setVisible(false);
			}
			var enabled = false;
			if (this.byId("segButton").getSelectedKey() == "A") {
				enabled = true;
			}
			var comments = this.byId("comChange").getValue();
			var data = {
				comments: comments,
				enable: enabled
			};
			oModel.update(path, data, {
				headers: {
					"Content-Type": "application/json",
					'Accept': 'application/json'
				},
				success: function (oData, response) {
					that.oldKey = that.byId("segButton").getSelectedKey();
					var texto1 = that.getResourceBundle().getText("saveSucc");
					sap.m.MessageBox.alert(texto1);
				},
				error: function (oError) {
					sap.m.MessageToast.show("Error");
				}
			});
		},

		/* Cancelar la creación de la planificación */
		onCancel: function () {
			this.showCustomActions(false);
			this.byId("segButton").setSelectedKey(this.oldKey);
			this.byId("segButton").setEnabled(false);
			this.byId("comDisplay").setVisible(true);
			this.byId("comChange").setVisible(false);
			this.oEditAction.setVisible(true);
			var oModel = this.getOwnerComponent().getModel();
			var sPath = this.getView().getBindingContext().getPath();
			var sPath1 = sPath + "/last_execution";
			var date = oModel.getProperty(sPath1);
			if (date === null) {
				this.oDeleteAction.setVisible(true);
			} else {
				this.oDeleteAction.setVisible(false);
			}
		},

		/* Mostrar las acciones que hemos añadido en la vista */
		showCustomActions: function (bShow) {
			this.byId("saveAction").setVisible(bShow);
			this.byId("cancelAction").setVisible(bShow);
		},

		/* Cambios de visualización de pantalla completa */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		}
	});
});
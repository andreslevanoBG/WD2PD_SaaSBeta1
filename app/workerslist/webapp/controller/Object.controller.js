sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter",
	"sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Fragment, Sorter, MessageBox) {
	"use strict";

	return BaseController.extend("shapein.WorkersList.controller.Object", {

		formatter: formatter,
		fromDatePreviousValue: "",
		toDatePreviousValue: "",

		/* Al instanciar el objeto */
		onInit: function () {
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0
				});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
			this.setModel(new JSONModel(), "data");
			this._oTableFilterState = {
				aFilter: [],
				aSearch: []
			};
		},

		/* Evento al matchear el objeto seleccionado */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("Workers", {
					uuid: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/* Bindeamos la vista al objeto seleccionado con sus detalles */
		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {
							oViewModel.setProperty("/busy", true);
						});
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
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.uuid,
				sObjectName = oObject.firstname;
			var oModel = this.getOwnerComponent().getModel();
			var itemsModel = this.getView().getModel("items");
			var that = this;
			oViewModel.refresh();
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "integ_items/integration"
				},
				success: function (oData, oResponse) {
					var results = oData.integ_items.results;
					delete oData.__metadata;
					var scount = 0;
					var ecount = 0;
					results.forEach(function (entry) {
						delete entry.__metadata;
						if (entry.status_code == "S") {
							scount++;
						} else {
							ecount++;
						}
						if (entry.integration) {
							if (entry.integration.status_code != "R") {
								entry.duration = String((entry.integration.timestamp_end.getTime() - entry.integration.timestamp_start.getTime()) / 1000) +
									" secs";
							} else {
								entry.duration = "0 secs";
							}
						}
					});
					oData.integ_items = null;
					oData.integ_items = results;
					itemsModel.setData(oData);
					oViewModel.setProperty("/busy", false);
					that.getView().byId("tabfSuc").setCount(scount);
					that.getView().byId("tabfErr").setCount(ecount);
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("objectTitle") + " - " + sObjectName,
				icon: "sap-icon://enter-more",
				intent: "#WorkersList-display&/Workers/" + sObjectId
			});
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		/* Abrir el pop-up para las acciones sobre el listado de items */
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
			if (!this.byId("viewSettingsDialogDetail")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.WorkersList.view.ViewSettingsDialogDetail",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialogDetail").open(sDialogTab);
			}
		},

		/* Al cambiar filtro de fechas */
		changeDates: function (oEvent) {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[0];
			var fechadesde = vLayout.getContent()[1].getValue();
			var fechahasta = vLayout.getContent()[3].getValue();
			if (fechadesde == "" && fechahasta == "") {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			} else {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			}
		},

		/* Al ejecutar los filtrados */
		searchFilters: function () {
			var aFilterItems = [],
				aFilters = [],
				aCaptions = [];
			var itemsModel = this.getView().getModel("items");
			if (this.byId("viewSettingsDialogDetail")) {
				aFilterItems = this.byId("viewSettingsDialogDetail").getFilterItems();
				var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
				var fechadesde = vLayout.getContent()[1].getValue();
				var fechahasta = vLayout.getContent()[3].getValue();
				var fechadesded = vLayout.getContent()[1].getDateValue();
				var fechahastad = vLayout.getContent()[3].getDateValue();
				this.fromDatePreviousValue = fechadesde;
				this.toDatePreviousValue = fechahasta;
				if (fechadesde !== "") {
					var fedesde = fechadesde.substring(0, 4) + "-" + fechadesde.substring(5, 7) + "-" + fechadesde.substring(8, 10) + "T" +
						fechadesde.substring(11, 13) + ":" + fechadesde.substring(14, 16) + ":" + fechadesde.substring(17, 19) + "Z";
				}
				if (fechahasta !== "") {
					var fehasta = fechahasta.substring(0, 4) + "-" + fechahasta.substring(5, 7) + "-" + fechahasta.substring(8, 10) + "T" +
						fechahasta.substring(11, 13) + ":" + fechahasta.substring(14, 16) + ":" + fechahasta.substring(17, 19) + "Z";
				}
				if (fehasta && !fedesde) {
					aFilters.push(new Filter([
						new Filter("timestamp_start", FilterOperator.LE, fechahastad)
					], true));
				} else if (fedesde && !fehasta) {
					aFilters.push(new Filter([
						new Filter("timestamp_start", FilterOperator.GE, fechadesded)
					], true));

				} else if (fedesde && fehasta) {
					aFilters.push(new Filter([
						new Filter("timestamp_start", FilterOperator.LE, fechahastad),
						new Filter("timestamp_start", FilterOperator.GE, fechadesded)
					], true));
				}
				var sortItems = this.byId("viewSettingsDialogDetail").getSortItems();
				var sortItem;
				sortItems.forEach(function (oItem) {
					if (oItem.getSelected()) {
						sortItem = oItem;
					}
				});
				var sortDesc = this.byId("viewSettingsDialogDetail").getSortDescending();
			}
			var keySel = this.getView().byId("iconTab").getSelectedKey();
			if (keySel == "Suc") {
				aFilters.push(new Filter("status_code", FilterOperator.EQ, "S"));
			} else if (keySel == "Err") {
				aFilters.push(new Filter("status_code", FilterOperator.EQ, "E"));
			}
			var query = this.getView().byId("search").getValue();
			if (query !== "") {
				aFilters.push(
					new Filter("integ_id", FilterOperator.Contains, query)
				);
			}
			this._oTableFilterState.aFilter = aFilters;
			this._applyFilterSearch();
			if (this.byId("viewSettingsDialogDetail")) {
				this._applySortGroup(sortItem, sortDesc);
			}
		},

		/* Función al ejecutar el mensaje de error */
		handleMessagePopoverPress: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("items").getPath();
			var itemsModel = this.getView().getModel("items");
			sPath = sPath + "/error_message";
			var text = this.b64DecodeUnicode(itemsModel.getProperty(sPath));
			if (text != "" && text) {
				var objectValue = JSON.parse(text);
				var sErrorDescription = objectValue['errors'][0].message;
				MessageBox.error(sErrorDescription);
			} else {
				var text1 = this.getResourceBundle().getText("messEmpty");
				MessageBox.error(text1);
			}
		},

		/* Aplicar los filtros */
		_applyFilterSearch: function () {
			var aFilters = this._oTableFilterState.aSearch.concat(this._oTableFilterState.aFilter);
			this.getView().byId("lineItemsList").getBinding("items").filter(aFilters, "Application");
		},

		/* Aplicar el ordenamiento */
		_applySortGroup: function (item, desc) {
			var sPath,
				bDescending,
				aSorters = [];
			sPath = item.getKey();
			bDescending = desc;
			aSorters.push(new Sorter(sPath, bDescending));
			var binding = this.getView().byId("lineItemsList").getBinding("items");
			binding.sort(aSorters);
		},

		/* Al cancelar el filtrado */
		handleCancel: function () {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[0],
				fromDP = vLayout.getContent()[1],
				toDP = vLayout.getContent()[3];

			fromDP.setValue(this.fromDatePreviousValue);
			toDP.setValue(this.toDatePreviousValue);

			if (this.fromDatePreviousValue !== "" || this.toDatePreviousValue !== "") {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			} else {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			}
		},

		/* Al resetear los filtros */
		handleResetFilters: function () {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[0],
				fromDP = vLayout.getContent()[1],
				toDP = vLayout.getContent()[3];
			fromDP.setValue("");
			toDP.setValue("");
			oCustomFilter.setFilterCount(0);
			oCustomFilter.setSelected(false);
		},

		/* Para decodificar de base64 */
		b64DecodeUnicode: function (str) {
			return decodeURIComponent(atob(str).split('').map(function (c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			}).join(''));
		},

		/* Al pinchar para visualizar los datos de la request de un elemento */
		onDataDialogPress: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("items").getPath();
			var itemsModel = this.getView().getModel("items");
			sPath = sPath + "/request";
			var request = itemsModel.getProperty(sPath);
			var text = this.b64DecodeUnicode(request);
			var data = [];
			var dataModel = this.getView().getModel("data");
			if (text != "") {
				var objectValue = JSON.parse(text);
				var arrayValues = Object.entries(objectValue);
				arrayValues.forEach(function (entry) {
					var item = {};
					if (entry[0] === "registration_references") {
						var arrayRef = Object.entries(entry[1]);
						arrayRef.forEach(function (entryRef) {
							var arrayRef2 = Object.entries(entryRef[1]);
							arrayRef2.forEach(function (entryRef2) {
								var itemRef = {};
								itemRef.Name = entryRef2[0].toString().replaceAll("_", " ");
								itemRef.Value = entryRef2[1];
								data.push(itemRef);
							});
						});
					} else if (entry[0] === "custom_fields") {
						var arrayCust = Object.entries(entry[1]);
						arrayCust.forEach(function (entryCust) {
							var itemCust = {};
							itemCust.Name = entryCust[1].code.toString().replaceAll("_", " ");
							itemCust.Value = entryCust[1].value;
							itemCust.key = "Data";
							itemCust.Icon = "sap-icon://database";
							data.push(itemCust);
						});
					} else {
						item.Name = entry[0].toString().replaceAll("_", " ");
						item.Value = entry[1];
						data.push(item);
					}
				});
			}
			dataModel.setData(data);
			if (!this.oDataDialog) {
				var tit = this.getResourceBundle().getText("dataDeta");
				this.oDataDialog = new sap.m.Dialog({
					title: tit,
					contentWidth: "550px",
					contentHeight: "300px",
					resizable: true,
					content: new sap.m.List({
						items: {
							path: "data>/",
							template: new sap.m.StandardListItem({
								title: "{data>Name}",
								info: "{data>Value}",
								infoState: "Information"
							})
						}
					}),
					endButton: new sap.m.Button({
						text: "OK",
						press: function () {
							this.oDataDialog.close();
						}.bind(this)
					})
				});
				this.getView().addDependent(this.oDataDialog);
			}
			this.oDataDialog.open();
		},
	});
});
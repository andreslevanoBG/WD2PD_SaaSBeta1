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

	return BaseController.extend("shapein.MonitoringOrganizations.controller.Master", {

		formatter: formatter,
		oFormatYyyymmdd: null,
		fromDatePreviousValue: "",
		toDatePreviousValue: "",
		numItems1PreviousValue: 0,
		numItems2PreviousValue: 0,

		/* Al instanciar el objeto */
		onInit: function () {
			// Definimos el formato usado para fechas
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "dd.MM.yyyy",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();
			this._oList = oList;
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");
			oList.attachEventOnce("updateFinished", function () {
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});
			this.getView().attachAfterRendering(function () {
				var date = new Date();
				date.setDate(date.getDate() - 1);
				var day = date.getUTCDate() < 10 ? "0" + date.getUTCDate() : date.getUTCDate(),
					month = date.getUTCMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getUTCMonth() + 1,
					year = date.getUTCFullYear(),
					hours = date.getUTCHours() < 10 ? "0" + date.getUTCHours() : date.getUTCHours(),
					minutes =
					date.getUTCMinutes() < 10 ? "0" + date.getUTCMinutes() : date.getUTCMinutes(),
					seconds =
					date.getUTCSeconds() < 10 ? "0" + date.getUTCSeconds() : date.getUTCSeconds();
				var lastday = year + "-" + month + "-" + day + "T" + hours + ":" + minutes + ":" + seconds + "Z";
				var sPath = "timestamp_start";
				var sOperator = "GE";
				var oBinding = this.byId("list").getBinding("items");
				oBinding.filter([new sap.ui.model.Filter(sPath, sOperator, lastday),
					new sap.ui.model.Filter("pck_code", "EQ", "SYN_ORG")
				], "Application");
			});
			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
			oViewModel.setProperty("/isFilterBarVisible", true);
			var text = this.getResourceBundle().getText("past24");
			oViewModel.setProperty("/filterBarLabel", text);
			var that = this;
			var oModel = this.getOwnerComponent().getModel();
			var sPath = '/Integration_Pck_Planning';
			var la_filters = [];
			var lo_orgs = new sap.ui.model.Filter({
				path: "pck_code",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: 'SYN_ORG'
			});
			la_filters.push(lo_orgs);
			var lo_enab = new sap.ui.model.Filter({
				path: "enable",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: true
			});
			la_filters.push(lo_enab);
			var lo_proctype = new sap.ui.model.Filter({
				path: "processing_type",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: 'R'
			});
			la_filters.push(lo_proctype);
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "adata"
				},
				filters: la_filters,
				success: function (oData, oResponse) {
					var results = oData.results;
					var mappings = [];
					results.forEach(function (entry) {
						entry.adata.results.forEach(function (adata) {
							if (adata.level1 == "MAPPING_ORGS_TOP_LEVEL" && adata.level2 == "SUPERVISORY-PD_PARENT") {
								var item = {};
								item.organization = adata.value;
								item.pd_parent = adata.value2;
								mappings.push(item);
							}
						});
					});
					var mappings2 = that.multiDimensionalUnique(mappings);
					that.getOwnerComponent().oMappings = mappings2;
				},
				error: function (oError) {}
			});

		},

		multiDimensionalUnique: function (arr) {
			var uniques = [];
			var itemsFound = {};
			for (var i = 0, l = arr.length; i < l; i++) {
				var stringified = JSON.stringify(arr[i]);
				if (itemsFound[stringified]) {
					continue;
				}
				uniques.push(arr[i]);
				itemsFound[stringified] = true;
			}
			return uniques;
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
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("id", FilterOperator.Contains, sQuery)];
				this._oListFilterState.aSearch.push(new Filter("pck_code", FilterOperator.EQ, "SYN_ORG"));
			} else {
				this._oListFilterState.aSearch = [];
				this._oListFilterState.aSearch.push(new Filter("pck_code", FilterOperator.EQ, "SYN_ORG"));
			}
			this._applyFilterSearch();
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
					name: "shapein.MonitoringOrganizations.view.ViewSettingsDialog",
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

		/* Pasar a 2 digitos */
		date2digits: function (num) {
			if (num < 10) {
				return "0" + num;
			}
			return num;
		},

		/* Al confirmar los valores de filtrado u ordenación, se generan los filtros y sorts */
		onConfirmViewSettingsDialog: function (oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [],
				aCaptions = [];
			var vLayout = this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();
			var fechadesde = vLayout.getContent()[1].getValue();
			var fechahasta = vLayout.getContent()[3].getValue();
			this.fromDatePreviousValue = fechadesde;
			this.toDatePreviousValue = fechahasta;
			var fechadesde2 = vLayout.getContent()[1].getDateValue();
			var fechahasta2 = vLayout.getContent()[3].getDateValue();
			var oViewModel = this.getModel("masterView");
			if (fechadesde !== "") {
				var year = fechadesde2.getUTCFullYear();
				var month = fechadesde2.getUTCMonth() + 1;
				month = this.date2digits(month);
				var day = fechadesde2.getUTCDate();
				day = this.date2digits(day);
				var hour = fechadesde2.getUTCHours();
				hour = this.date2digits(hour);
				var minutes = fechadesde2.getUTCMinutes();
				minutes = this.date2digits(minutes);
				var seconds = fechadesde2.getUTCSeconds();
				seconds = this.date2digits(seconds);
				var fedesde = year + "-" + month + "-" + day + "T" + hour + ":" + minutes + ":" + seconds + "Z";
			}
			if (fechahasta !== "") {
				var year2 = fechahasta2.getUTCFullYear();
				var month2 = fechahasta2.getUTCMonth() + 1;
				month2 = this.date2digits(month2);
				var day2 = fechahasta2.getUTCDate();
				day2 = this.date2digits(day2);
				var hour2 = fechahasta2.getUTCHours();
				hour2 = this.date2digits(hour2);
				var minutes2 = fechahasta2.getUTCMinutes();
				minutes2 = this.date2digits(minutes2);
				var seconds2 = fechahasta2.getUTCSeconds();
				seconds2 = this.date2digits(seconds2);
				var fehasta = year2 + "-" + month2 + "-" + day2 + "T" + hour2 + ":" + minutes2 + ":" + seconds2 + "Z";
			}
			if (fehasta && !fedesde) {
				aFilters.push(new Filter([
					new Filter("timestamp_start", FilterOperator.LE, fehasta)
				], true));
				var oText = this.oFormatYyyymmdd.format(vLayout.getContent()[3].getDateValue());
				var text = this.getResourceBundle().getText("procesTo");
				oText = text + " " + oText;
				this._updateFilterBar(oText);

			} else if (fedesde && !fehasta) {
				aFilters.push(new Filter([
					new Filter("timestamp_start", FilterOperator.GE, fedesde)
				], true));
				var oText = this.oFormatYyyymmdd.format(vLayout.getContent()[1].getDateValue());
				var text = this.getResourceBundle().getText("procesFrom");
				oText = text + " " + oText;
				this._updateFilterBar(oText);

			} else if (fedesde && fehasta) {
				aFilters.push(new Filter([
					new Filter("timestamp_start", FilterOperator.LE, fehasta),
					new Filter("timestamp_start", FilterOperator.GE, fedesde)
				], true));
				var oText = this.oFormatYyyymmdd.format(vLayout.getContent()[1].getDateValue());
				var oText2 = this.oFormatYyyymmdd.format(vLayout.getContent()[3].getDateValue());
				var text = this.getView().getModel("i18n").getResourceBundle().getText("procesBet");
				oText = text + " " + oText + " - " + oText2;
				this._updateFilterBar(oText);

			} else {
				var date = new Date();
				date.setDate(date.getDate() - 1);
				var day = date.getUTCDate() < 10 ? "0" + date.getUTCDate() : date.getUTCDate(),
					month = date.getUTCMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getUTCMonth() + 1,
					year = date.getUTCFullYear(),
					hours = date.getUTCHours() < 10 ? "0" + date.getUTCHours() : date.getUTCHours(),
					minutes =
					date.getUTCMinutes() < 10 ? "0" + date.getUTCMinutes() : date.getUTCMinutes(),
					seconds =
					date.getUTCSeconds() < 10 ? "0" + date.getUTCSeconds() : date.getUTCSeconds();
				var lastday = year + "-" + month + "-" + day + "T" + hours + ":" + minutes + ":" + seconds + "Z";
				var sPath = "timestamp_start";
				var sOperator = "GE";
				var oBinding = this.byId("list").getBinding("items");
				aFilters.push(new Filter([
					new Filter("timestamp_start", FilterOperator.GE, lastday)
				], true));
				var text = this.getResourceBundle().getText("past24");
				this._updateFilterBar(text);
			}
			var aFilters2 = [];
			aFilterItems.forEach(function (oItem) {
				if (oItem.getKey() !== "timestamp_start" && oItem.getKey() !== "numberOfItems") {
					aFilters2.push(new Filter(oItem.getParent().getKey(), FilterOperator.EQ, oItem.getKey()));
				}
			});
			if (aFilters2.length > 0) {
				aFilters.push(new Filter(aFilters2, false));
			}
			aFilters.push(new Filter([
				new Filter("pck_code", FilterOperator.EQ, "SYN_ORG")
			], true));
			var slider = this.byId("viewSettingsDialog").getFilterItems()[2].getCustomControl();
			var value1 = parseInt(slider.getValue());
			var value2 = parseInt(slider.getValue2());
			if (value1 > value2) {
				var aux = value1;
				value1 = value2;
				value2 = aux;
			}
			this.numItems1PreviousValue = value1;
			this.numItems2PreviousValue = value2;
			if (value2 !== 0) {
				if (value2 == slider.getMax()) {
					aFilters.push(new Filter([
						new Filter("numberOfItems", FilterOperator.GE, value1),
						new Filter("numberOfItems", FilterOperator.LE, 9999999)
					], true));
				} else {
					aFilters.push(new Filter([
						new Filter("numberOfItems", FilterOperator.GE, value1),
						new Filter("numberOfItems", FilterOperator.LE, value2)
					], true));
				}
			}
			this._oListFilterState.aFilter = aFilters;
			this._applyFilterSearch();
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
			var binding = this._oList.getBinding("items");
			binding.sort(aSorters);
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
				sortBy: "reference_id",
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
				objectId: oItem.getBindingContext().getProperty("id")
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
			oViewModel.setProperty("/isFilterBarVisible", true);
			oViewModel.setProperty("/filterBarLabel", sFilterBarText);
		},
		
		/* Al cambiar las fechas del filtro */
		changeDates: function (oEvent) {
			var vLayout = this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[0];
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
		
		/* Al cambiar el número de items en el filtro */
		changeSlider: function (oEvent) {
			var slider = this.byId("viewSettingsDialog").getFilterItems()[2].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[2];
			var numItems1 = parseInt(slider.getValue());
			var numItems2 = parseInt(slider.getValue2());
			if (numItems1 == 0 && numItems1 == 0) {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			} else {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			}
		},
		
		/* Cancelar cambios en los filtros */
		handleCancel: function () {
			var vLayout = this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[0],
				fromDP = vLayout.getContent()[1],
				toDP = vLayout.getContent()[3];
			var slider = this.byId("viewSettingsDialog").getFilterItems()[2].getCustomControl();
			var oCustomFilter2 = this.byId("viewSettingsDialog").getFilterItems()[2];
			fromDP.setValue(this.fromDatePreviousValue);
			toDP.setValue(this.toDatePreviousValue);
			slider.setValue(this.numItems1PreviousValue);
			slider.setValue2(this.numItems2PreviousValue);
			if (this.fromDatePreviousValue !== "" || this.toDatePreviousValue !== "") {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			} else {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			}
			if (this.numItems1PreviousValue !== 0 || this.numItems2PreviousValue !== 0) {
				oCustomFilter2.setFilterCount(1);
				oCustomFilter2.setSelected(true);
			} else {
				oCustomFilter2.setFilterCount(0);
				oCustomFilter2.setSelected(false);
			}
		},
		
		/* Al resetear los valores de los filtros */
		handleResetFilters: function () {
			var vLayout = this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[0],
				fromDP = vLayout.getContent()[1],
				toDP = vLayout.getContent()[3];
			fromDP.setValue("");
			toDP.setValue("");
			oCustomFilter.setFilterCount(0);
			oCustomFilter.setSelected(false);
			var slider = this.byId("viewSettingsDialog").getFilterItems()[2].getCustomControl();
			var oCustomFilter2 = this.byId("viewSettingsDialog").getFilterItems()[2];
			slider.setValue(0);
			slider.setValue2(0);
			oCustomFilter2.setFilterCount(0);
			oCustomFilter2.setSelected(false);
		}
	});
});
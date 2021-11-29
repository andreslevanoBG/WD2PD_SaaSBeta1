sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Fragment, Sorter) {
	"use strict";
	return BaseController.extend("shapein.OrganizationsList.controller.Worklist", {

		formatter: formatter,
		oFormatYyyymmdd: null,
		fromDatePreviousValue: "",
		toDatePreviousValue: "",
		fromLastPreviousValue: "",
		toLastPreviousValue: "",

		/* Al instanciar el objeto */
		onInit: function () {
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "dd.MM.yyyy",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			var oViewModel,
				iOriginalBusyDelay;
			this._aTableSearchState = [];
			this._oTableFilterState = {
				aFilter: [],
				aSearch: []
			};
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
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("worklistViewTitle"),
				icon: "sap-icon://table-view",
				intent: "#OrganizationsList-display"
			}, true);
		},

		/* Al cargar los datos en la lista  */
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
					name: "shapein.OrganizationsList.view.ViewSettingsDialog",
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

		/* Al ejecutar los filtrados */
		searchFilters: function (oEvent) {
			var aFilterItems = [],
				aFilters = [],
				aCaptions = [];
			if (this.byId("viewSettingsDialog")) {
				aFilterItems = this.byId("viewSettingsDialog").getFilterItems();
				var vLayout = this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();
				var fechadesde = vLayout.getContent()[1].getValue();
				var fechahasta = vLayout.getContent()[3].getValue();
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
						new Filter("last_timestamp", FilterOperator.LE, fehasta)
					], true));
				} else if (fedesde && !fehasta) {
					aFilters.push(new Filter([
						new Filter("last_timestamp", FilterOperator.GE, fedesde)
					], true));
				} else if (fedesde && fehasta) {
					aFilters.push(new Filter([
						new Filter("last_timestamp", FilterOperator.LE, fehasta),
						new Filter("last_timestamp", FilterOperator.GE, fedesde)
					], true));
				} else {}
				var vLayout2 = this.byId("viewSettingsDialog").getFilterItems()[1].getCustomControl();
				var lastfrom = vLayout2.getContent()[1].getValue();
				var lastto = vLayout2.getContent()[3].getValue();
				this.fromLastPreviousValue = lastfrom;
				this.toLastPreviousValue = lastto;
				if (lastfrom !== "" && lastto == "") {
					aFilters.push(new Filter([
						new Filter("name", FilterOperator.GE, lastfrom)
					], false));
				} else if (lastfrom == "" && lastto !== "") {
					aFilters.push(new Filter([
						new Filter("name", FilterOperator.LE, lastto)
					], false));
				} else if (lastfrom !== "" && lastto !== "") {
					aFilters.push(new Filter([
						new Filter("name", FilterOperator.BT, lastfrom, lastto)
						//	new Filter("lastname", FilterOperator.LE, lastto)
					], false));
				}
				var aFilters2 = [];
				aFilterItems.forEach(function (oItem) {
					if (oItem.getKey() !== "last_timestamp" && oItem.getKey() !== "name") {
						aFilters2.push(new Filter(oItem.getParent().getKey(), FilterOperator.EQ, oItem.getKey()));
					}
				});
				if (aFilters2.length > 0) {
					aFilters.push(new Filter(aFilters2, false));
				}
				var sortItems = this.byId("viewSettingsDialog").getSortItems();
				var sortItem;
				sortItems.forEach(function (oItem) {
					if (oItem.getSelected()) {
						sortItem = oItem;
					}
				});
				var sortDesc = this.byId("viewSettingsDialog").getSortDescending();
			}
			var keySel = this.getView().byId("iconTab").getSelectedKey();
			if (keySel == "Suc") {
				aFilters.push(new Filter("last_status", FilterOperator.EQ, "S"));
			} else if (keySel == "Err") {
				aFilters.push(new Filter("last_status", FilterOperator.EQ, "E"));
			}
			var query = this.getView().byId("searchField").getValue();
			this._oTableFilterState.aFilter = aFilters;
			this._applyFilterSearch();
			if (this.byId("viewSettingsDialog")) {
				this._applySortGroup(sortItem, sortDesc);
			}
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

		/* Al cambiar los last names del filtro */
		changeLast: function (oEvent) {
			var vLayout = this.byId("viewSettingsDialog").getFilterItems()[1].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[1];
			var lastfrom = vLayout.getContent()[1].getValue();
			var lastto = vLayout.getContent()[3].getValue();
			if (lastfrom == "" && lastto == "") {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			} else {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			}
		},

		/*Aplicamos el ordenación del grupo */
		_applySortGroup: function (item, desc) {
			var sPath,
				bDescending,
				aSorters = [];
			sPath = item.getKey();
			bDescending = desc;
			aSorters.push(new Sorter(sPath, bDescending));
			var binding = this.byId("table").getBinding("items");
			binding.sort(aSorters);
		},

		/*Aplicamos el filtrado */
		_applyFilterSearch: function () {
			var aFilters = this._oTableFilterState.aSearch.concat(this._oTableFilterState.aFilter),
				oViewModel = this.getModel("worklistView");
			this.byId("table").getBinding("items").filter(aFilters, "Application");
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			} else if (this._oTableFilterState.aSearch.length > 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/* Al resetear los filtros */
		handleResetFilters: function () {
			var vLayout = this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[0],
				fromOrganization = vLayout.getContent()[1],
				toOrganization = vLayout.getContent()[3];
			fromOrganization.setValue("");
			toOrganization.setValue("");
			oCustomFilter.setFilterCount(0);
			oCustomFilter.setSelected(false);
			var vLayout2 = this.byId("viewSettingsDialog").getFilterItems()[1].getCustomControl();
			var oCustomFilter2 = this.byId("viewSettingsDialog").getFilterItems()[1],
				fromLast = vLayout2.getContent()[1],
				toLast = vLayout2.getContent()[3];
			fromLast.setValue("");
			toLast.setValue("");
			oCustomFilter2.setFilterCount(0);
			oCustomFilter2.setSelected(false);
		},

		/* Al cancelar los filtros */
		handleCancel: function () {
			var vLayout = this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[0],
				fromDate = vLayout.getContent()[1],
				toDate = vLayout.getContent()[3];
			fromDate.setValue(this.fromDatePreviousValue);
			toDate.setValue(this.toDatePreviousValue);
			if (this.fromDatePreviousValue !== "" || this.toDatePreviousValue !== "") {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			} else {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			}
			var vLayout2 = this.byId("viewSettingsDialog").getFilterItems()[1].getCustomControl();
			var oCustomFilter2 = this.byId("viewSettingsDialog").getFilterItems()[1],
				fromLast = vLayout2.getContent()[1],
				toLast = vLayout2.getContent()[3];
			fromLast.setValue(this.fromLastPreviousValue);
			toLast.setValue(this.toLastPreviousValue);
			if (this.fromLastPreviousValue !== "" || this.toLastPreviousValue !== "") {
				oCustomFilter2.setFilterCount(1);
				oCustomFilter2.setSelected(true);
			} else {
				oCustomFilter2.setFilterCount(0);
				oCustomFilter2.setSelected(false);
			}
		},

		/* Al seleccionar un objeto del listado */
		onPress: function (oEvent) {
			this._showObject(oEvent.getSource());
		},

		/* Al buscar con el campo de búsqueda */
		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				this.onRefresh();
			} else {
				var sQuery = oEvent.getParameter("query");
				this._oTableFilterState.aSearch = [];
				if (sQuery && sQuery.length > 0) {
					this._oTableFilterState.aSearch.push(new Filter([
						// new Filter("name", FilterOperator.Contains, sQuery),
						// new Filter("external_id", FilterOperator.Contains, sQuery),
						// new Filter("corporate_name", FilterOperator.Contains, sQuery)
						
						new Filter("tolower(name)", FilterOperator.Contains, "'" + sQuery.toLowerCase() + "'"),
						new Filter("external_id", FilterOperator.Contains, sQuery),
						new Filter("tolower(corporate_name)", FilterOperator.Contains, "'" + sQuery.toLowerCase() + "'")
					], false));
				}
			}
			this._applyFilterSearch();
		},

		/* Al refrescar el listado */
		onRefresh: function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* Mostrar el objeto seleccionado en el listado */
		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("uuid")
			});
		},

		/* Aplicar la búsqueda  */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
});
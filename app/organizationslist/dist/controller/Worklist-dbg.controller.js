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

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			// Definimos el formato usado para fechas
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "dd.MM.yyyy",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			var oViewModel,
				iOriginalBusyDelay;
			//	oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			//	iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];
			this._oTableFilterState = {
				aFilter: [],
				aSearch: []
			};

			// Model used to manipulate control states
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

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)

			// oTable.attachEventOnce("updateFinished", function () {
			// 	// Restore original busy indicator delay for worklist's table
			// 	oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			// });

			// Add the worklist page to the flp routing history
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("worklistViewTitle"),
				icon: "sap-icon://table-view",
				intent: "#OrganizationsList-display"
			}, true);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
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
			// load asynchronous XML fragment
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.OrganizationsList.view.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
		 * are applied to the master list, which can also mean that they
		 * are removed from the master list, in case they are
		 * removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		searchFilters: function (oEvent) {
			var aFilterItems = [],
				aFilters = [],
				aCaptions = [];

			// update filter state:
			// combine the filter array and the filter string
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
				//aFilters.push(new Filter("createdAt", FilterOperator.LE, fehasta));
				//aFilters.push(new Filter("createdAt", FilterOperator.GE, fedesde));
				if (fehasta && !fedesde) {
					aFilters.push(new Filter([
						new Filter("last_timestamp", FilterOperator.LE, fehasta)
					], true));
					// var oText = this.oFormatYyyymmdd.format(vLayout.getContent()[3].getDateValue());
					// oText = "Processes to " + oText;
					//	this._updateFilterBar(oText);

				} else if (fedesde && !fehasta) {
					aFilters.push(new Filter([
						new Filter("last_timestamp", FilterOperator.GE, fedesde)
					], true));
					// var oText = this.oFormatYyyymmdd.format(vLayout.getContent()[1].getDateValue());
					// oText = "Processes from " + oText;
					//	this._updateFilterBar(oText);

				} else if (fedesde && fehasta) {
					aFilters.push(new Filter([
						new Filter("last_timestamp", FilterOperator.LE, fehasta),
						new Filter("last_timestamp", FilterOperator.GE, fedesde)
					], true));
					// var oText = this.oFormatYyyymmdd.format(vLayout.getContent()[1].getDateValue());
					// var oText2 = this.oFormatYyyymmdd.format(vLayout.getContent()[3].getDateValue());
					// oText = "Processes between " + oText + " - " + oText2;
					//	this._updateFilterBar(oText);

				} else {
					//	this._updateFilterBar("Past 24 Hours");
				}

				var vLayout2 = this.byId("viewSettingsDialog").getFilterItems()[1].getCustomControl();
				var lastfrom = vLayout2.getContent()[1].getValue();
				var lastto = vLayout2.getContent()[3].getValue();
				this.fromLastPreviousValue = lastfrom;
				this.toLastPreviousValue = lastto;
				if (lastfrom !== "" && lastto == "") {
					aFilters.push(new Filter([
						new Filter("lastname", FilterOperator.GE, lastfrom),
						new Filter("firstname", FilterOperator.GE, lastfrom)
					], false));
				} else if (lastfrom == "" && lastto !== "") {
					aFilters.push(new Filter([
						new Filter("lastname", FilterOperator.LE, lastto),
						new Filter("firstname", FilterOperator.LE, lastto)
					], false));
				} else if (lastfrom !== "" && lastto !== "") {
					aFilters.push(new Filter([
						new Filter("lastname", FilterOperator.BT, lastfrom, lastto),
						new Filter("firstname", FilterOperator.BT, lastfrom, lastto)
						//	new Filter("lastname", FilterOperator.LE, lastto)
					], false));
				}

				var aFilters2 = [];
				aFilterItems.forEach(function (oItem) {
					if (oItem.getKey() !== "last_timestamp" && oItem.getKey() !== "lastname") {
						aFilters2.push(new Filter(oItem.getParent().getKey(), FilterOperator.EQ, oItem.getKey()));
						// aFilters.push(new Filter([
						// 	new Filter(oItem.getParent().getKey(), FilterOperator.EQ, oItem.getKey())
						// ], false));
					}
					//	aCaptions.push(oItem.getText());
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
			// if (query !== "") {
			// 	aFilters.push(new Filter([
			// 		new Filter("employee_number", FilterOperator.Contains, query),
			// 		new Filter("firstname", FilterOperator.Contains, query),
			// 		new Filter("lastname", FilterOperator.Contains, query),
			// 		new Filter("organization_id", FilterOperator.Contains, query),
			// 		new Filter("email", FilterOperator.Contains, query)
			// 	], false));
			// }

			this._oTableFilterState.aFilter = aFilters;
			//	this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
			if (this.byId("viewSettingsDialog")) {
				this._applySortGroup(sortItem, sortDesc);
			}
		},

		changeDates: function (oEvent) {
			var vLayout = this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[0];
			var fechadesde = vLayout.getContent()[1].getValue();
			var fechahasta = vLayout.getContent()[3].getValue();

			// Set the custom filter's count and selected properties
			// if the value has changed
			if (fechadesde == "" && fechahasta == "") {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			} else {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			}
		},
		changeLast: function (oEvent) {
			var vLayout = this.byId("viewSettingsDialog").getFilterItems()[1].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[1];
			var lastfrom = vLayout.getContent()[1].getValue();
			var lastto = vLayout.getContent()[3].getValue();

			// Set the custom filter's count and selected properties
			// if the value has changed
			if (lastfrom == "" && lastto == "") {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			} else {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			}
		},

		/**
		 * Apply the chosen sorter and grouper to the master list
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySortGroup: function (item, desc) {
			var sPath,
				bDescending,
				aSorters = [];
			sPath = item.getKey();
			bDescending = desc;
			aSorters.push(new Sorter(sPath, bDescending));
			var binding = this.byId("table").getBinding("items");
			//binding.iLength = binding.iLastLength;
			binding.sort(aSorters);
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function () {
			var aFilters = this._oTableFilterState.aSearch.concat(this._oTableFilterState.aFilter),
				oViewModel = this.getModel("worklistView");
			this.byId("table").getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			} else if (this._oTableFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

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

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				//var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");
				this._oTableFilterState.aSearch = [];
				if (sQuery && sQuery.length > 0) {

					this._oTableFilterState.aSearch.push(new Filter([
						new Filter("name", FilterOperator.Contains, sQuery),
						new Filter("external_id", FilterOperator.Contains, sQuery),
						new Filter("corporate_name", FilterOperator.Contains, sQuery)
					], false));
					// 	aTableSearchState = [new Filter("firstname", FilterOperator.Contains, sQuery)];
				}
			}

			this._applyFilterSearch();

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("uuid")
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
});
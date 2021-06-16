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

		/* =========================================================== */
		/*    lifecycle methods                                        */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function () {
			// Definimos el formato usado para fechas
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "dd.MM.yyyy",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);

			//	oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/isFilterBarVisible", true);
			oViewModel.setProperty("/filterBarLabel", "Past 24 Hours");
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
				error: function (oError) {

				}
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

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
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

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			this._oList.getBinding("items").refresh();
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
					name: "shapein.MonitoringOrganizations.view.ViewSettingsDialog",
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
		 * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
		onOpenFilterSettings: function (oEvent) {
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
			if (!this.byId("viewFiltersDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.MonitoringOrganizations.view.FiltersDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewFiltersDialog").open(sDialogTab);
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

		date2digits: function (num) {
			if (num < 10) {
				return "0" + num;
			}
			return num;
		},
		onConfirmViewSettingsDialog: function (oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [],
				aCaptions = [];

			// update filter state:
			// combine the filter array and the filter string
			var vLayout = this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();
			var fechadesde = vLayout.getContent()[1].getValue();
			var fechahasta = vLayout.getContent()[3].getValue();
			this.fromDatePreviousValue = fechadesde;
			this.toDatePreviousValue = fechahasta;
			var fechadesde2 = vLayout.getContent()[1].getDateValue();
			var fechahasta2 = vLayout.getContent()[3].getDateValue();
			var oViewModel = this.getModel("masterView");
			// if (fechadesde !== "") {
			// 	var fedesde = fechadesde.substring(0, 4) + "-" + fechadesde.substring(5, 7) + "-" + fechadesde.substring(8, 10) + "T" +
			// 		fechadesde.substring(11, 13) + ":" + fechadesde.substring(14, 16) + ":" + fechadesde.substring(17, 19) + "Z";
			// }
			// if (fechahasta !== "") {
			// 	var fehasta = fechahasta.substring(0, 4) + "-" + fechahasta.substring(5, 7) + "-" + fechahasta.substring(8, 10) + "T" +
			// 		fechahasta.substring(11, 13) + ":" + fechahasta.substring(14, 16) + ":" + fechahasta.substring(17, 19) + "Z";
			// }
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
			//aFilters.push(new Filter("createdAt", FilterOperator.LE, fehasta));
			//aFilters.push(new Filter("createdAt", FilterOperator.GE, fedesde));
			if (fehasta && !fedesde) {
				aFilters.push(new Filter([
					new Filter("timestamp_start", FilterOperator.LE, fehasta)
				], true));
				var oText = this.oFormatYyyymmdd.format(vLayout.getContent()[3].getDateValue());
				oText = "Processes to " + oText;
				this._updateFilterBar(oText);

			} else if (fedesde && !fehasta) {
				aFilters.push(new Filter([
					new Filter("timestamp_start", FilterOperator.GE, fedesde)
				], true));
				var oText = this.oFormatYyyymmdd.format(vLayout.getContent()[1].getDateValue());
				oText = "Processes from " + oText;
				this._updateFilterBar(oText);

			} else if (fedesde && fehasta) {
				aFilters.push(new Filter([
					new Filter("timestamp_start", FilterOperator.LE, fehasta),
					new Filter("timestamp_start", FilterOperator.GE, fedesde)
				], true));
				var oText = this.oFormatYyyymmdd.format(vLayout.getContent()[1].getDateValue());
				var oText2 = this.oFormatYyyymmdd.format(vLayout.getContent()[3].getDateValue());
				oText = "Processes between " + oText + " - " + oText2;
				this._updateFilterBar(oText);

			} else {
				this._updateFilterBar("Past 24 Hours");
			}
			var aFilters2 = [];
			aFilterItems.forEach(function (oItem) {
				if (oItem.getKey() !== "timestamp_start" && oItem.getKey() !== "numberOfItems") {
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

			//	aFilters.push(new Filter("pck_code", FilterOperator.EQ, "SYN_WORKER"));
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
			//	this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
			this._applySortGroup(oEvent);
		},

		/**
		 * Apply the chosen sorter and grouper to the master list
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			var binding = this._oList.getBinding("items");
			//binding.iLength = binding.iLastLength;
			binding.sort(aSorters);
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function (oEvent) {
			var oList = oEvent.getSource(),
				bSelected = oEvent.getParameter("selected");

			// skip navigation when deselecting an item in multi selection mode
			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			}
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function () {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function (oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will navigate to the shell home
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				// eslint-disable-next-line sap-no-history-manipulation
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

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

		_onMasterMatched: function () {
			//Set the layout property of the FCL control to 'OneColumn'
			this.getModel("appView").setProperty("/layout", "OneColumn");
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function (oItem) {
			var bReplace = !Device.system.phone;
			// set the layout property of FCL control to show two columns
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("id")
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function () {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			//	oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/isFilterBarVisible", true);
			oViewModel.setProperty("/filterBarLabel", sFilterBarText);
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

		changeSlider: function (oEvent) {
			var slider = this.byId("viewSettingsDialog").getFilterItems()[2].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[2];
			var numItems1 = parseInt(slider.getValue());
			var numItems2 = parseInt(slider.getValue2());

			// Set the custom filter's count and selected properties
			// if the value has changed
			if (numItems1 == 0 && numItems1 == 0) {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			} else {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			}
		},

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
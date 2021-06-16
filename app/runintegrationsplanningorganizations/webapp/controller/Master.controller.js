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

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function () {
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

			var handlerEvent = sap.ui.getCore().getEventBus();
			handlerEvent.subscribe("Detail", "Delete_Plan", this._delete_Plan, this);

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
			//	var aData = oModelTime.getData();
			//	oModelTime.setSizeLimit(aData.timezones.length);
			oModelTime.setSizeLimit(1000);
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
			this._oListFilterState.aFilter = [new Filter("pck_code", FilterOperator.EQ, "SYN_ORG")];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("comments", FilterOperator.Contains, sQuery)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();
		},

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

				//this._showDetail(firstItem);
			}
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
					name: "shapein.RunIntegrationPlanningOrganizations.view.ViewSettingsDialog",
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
		onConfirmViewSettingsDialog: function (oEvent) {

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
			this._oList.getBinding("items").sort(aSorters);
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
				sortBy: "uuid",
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
				objectId: oItem.getBindingContext().getProperty("uuid")
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
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		cancelOnDemand: function (oEvent) {
			var dialog = oEvent.getSource().getParent();
			dialog.close();

		},

		_validateInput: function (oInput) {
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

		changeDatesDemand: function (oEvent) {
			var value = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			var sValueState = "None";
			if (value == "") {
				sValueState = "Error";
			} else {
				// var id = oInput.getId();
				// if(id == "DP2"){
				// 	var dp1 = this.byId("DP1").getDateValue();
				// 	var dp2 = this.byId("DP2").getDateValue();
				// 	if(dp2 > dp1){

				// 	}
				// }

			}
			oInput.setValueState(sValueState);
		},

		execOnDemand: function (oEvent) {
			var oView = this.getView(),
				aInputs = [
					oView.byId("DTP11"),
					oView.byId("DTP12"),
					oView.byId("DTP13"),
					oView.byId("DTP14")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInput(oInput) || bValidationError;
			}, this);

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}

			if (aInputs[0].getDateValue() > aInputs[1].getDateValue()) {
				sap.m.MessageBox.alert("Date 'Updated To' is earlier than 'Updated From'.");
				aInputs[1].setValueState("Error");
				return;
			}

			if (aInputs[2].getDateValue() > aInputs[3].getDateValue()) {
				sap.m.MessageBox.alert("Date 'Effective To' is earlier than 'Effective From'.");
				aInputs[1].setValueState("Error");
				return;
			}

			var text = "Are you sure you want to execute this integration on Demand?";
			var that = this;
			var dialogDemand = oEvent.getSource().getParent();
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						var NewExecModel = that.getModel("newExec");
						var fromUpd = NewExecModel.getProperty("/fromUpd");
						var toUpd = NewExecModel.getProperty("/toUpd");
						var fromEffec = NewExecModel.getProperty("/fromEffec");
						var toEffec = NewExecModel.getProperty("/toEffec");
						//var fragmentId = this.getView().createId("fr1");
						//var tab = Fragment.byId(fragmentId, "tab1");
						var supervisoriest = that.byId("multiInput1").getTokens();
						var toplevel = NewExecModel.getProperty("/orgsTopLevel");;
						var organizations = [];
						for (var i = 0; i < supervisoriest.length; i++) {
							var organization = supervisoriest[i].getText();
							organizations.push(organization);
						}
						// for (var i = 0; i < toplevel.length; i++) {
						// 	var maptop = toplevel[i].getText();
						// 	workers.push(worker);
						// }

						fromUpd = dateFormat.format(fromUpd);
						toUpd = dateFormat.format(toUpd);
						fromEffec = dateFormat.format(fromEffec);
						toEffec = dateFormat.format(toEffec);

						// var data = {
						// 	"test_mode": "False",
						// 	"reprocess": "True",
						// 	"transaction_log": {
						// 		"time_zone": "UTC",
						// 		"effective_from": "1900-01-01T00:00:01",
						// 		"effective_to": effective,
						// 	},
						// 	"workers": {
						// 		"reference_id": "Employee_ID",
						// 		"workers_list": [worker]
						// 	}
						// };
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

							// "supervisories": {
							// 	"reference_id": "Organization_Reference_ID",
							// 	"supervisories_list": [
							// 		supervisories
							// 	]
							// },
							// "workers": {
							// 	"reference_id": "Employee_ID",
							// 	"workers_list": [
							// 		workers
							// 	]
							// }
						};
						// var oViewModel = that.getModel("detailView");
						// oViewModel.setProperty("/busy", true);
						//		that.byId("ondemand").setBusy(true);
						var datajson = JSON.stringify(data);
						//	var url = "/CPI-WD2PD/organizations_sync/ondemand";
						var url = "/CPI-WD2PD_Dest/md/organizations_sync/ondemand";
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
									//				that.byId("ondemand").setBusy(false);
									if (textStatus == "success") {
										var texto = "Execution On Demand " + data.uuid_exec + " executed.";
										sap.m.MessageToast.show(texto);
									}
									//				dialogDemand.close();
								})
								.fail(function (jqXHR, textStatus, errorThrown) {
									var d = jqXHR;
									var e = textStatus;
									var f = errorThrown;
									//				that.byId("ondemand").setBusy(false);
									//				dialogDemand.close();
								});
						}
						dialog.close();
						dialogDemand.close();
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

		createPlan: function (oEvent) {
			// load asynchronous XML fragment
			if (!this.byId("newPlan")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.RunIntegrationPlanningOrganizations.view.fragment.NewPlanning",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					var fnValidator = function (args) {
						var text = args.text;
						return new sap.m.Token({
							key: text,
							text: text
						});
					};
					//	this.getView().byId("multiInput11").addValidator(fnValidator);
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("newPlan").open();
			}

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

		execNewPlan: function (oEvent) {
			// VALIDACIONES TODO
			var oView = this.getView(),
				aInputs = [
					oView.byId("Comments"),
					oView.byId("DTP1"),
					oView.byId("DTP2"),
					oView.byId("DTP3")
					//	oView.byId("DTP4")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			if (this.byId("ProcessType").getSelectedKey() === "I") {
				aInputs.forEach(function (oInput) {
					bValidationError = this._validateInputNewP(oInput) || bValidationError;
				}, this);
			}

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			var comments = aInputs[0].getValue();
			var text = "Are you sure you want to create a Organizations Planning?";
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
								//var but = oEvent.getSource();
								dialogNewPlan.setBusy(false);
								dialogNewPlan.close();
								that.createDataBatch(oData.uuid, oData.processing_type);
								sap.m.MessageToast.show("Planning created succesfully.");

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
				//oData2.value = this.byId("DTP4").getValue();
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

		successCreateBatch: function (oData, response) {
			//TODO
			var a = 0;
		},

		errorCreateBatch: function (oError) {
			//TODO
			var e = 0;
		},

		cancelNewPlan: function (oEvent) {
			var dialog = oEvent.getSource().getParent();
			dialog.close();
		},

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
		deleteRow_toplevel: function (oArg) {
			var dataModel = this.getView().getModel("newExec");
			var oTable = this.getView().byId("tableOrgs");
			var oItem = oTable.getSelectedItem();
			if (oItem) {
				var deleteRecordPath = oItem.getBindingContext("newExec").getPath();
				// for (var j = 0; j < dataModel.getData().global_configuration.mappings.zip_code.default_values.country.length; j++) {
				// 	if (dataModel.getData().global_configuration.mappings.zip_code.default_values.country[j] === deleteRecord) {
				var indice = parseInt(deleteRecordPath.substr(deleteRecordPath.length - 1));
				dataModel.getData().orgsTopLevel.splice(indice, 1); //removing 1 record from i th index.
				dataModel.refresh();
				// 	}
				// }

			} else {
				sap.m.MessageToast.show('Please, select a row to delete.');
			}
		},

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

		deleteRow_toplevel2: function (oArg) {
			var oTable = this.getView().byId("tableOrgs2");
			var oItem = oTable.getSelectedItem();
			if (oItem) {
				oTable.removeItem(oItem);
				// }
			} else {
				sap.m.MessageToast.show('Please, select a row to delete.');
			}
		},

		newOnDemand: function (oEvent) {
			// load asynchronous XML fragment
			if (!this.byId("ondemand")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.RunIntegrationPlanningOrganizations.view.fragment.OnDemand",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
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
					//	this.getView().byId("multiInput2").addValidator(fnValidator);
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("ondemand").open();
			}
		}

	});

});
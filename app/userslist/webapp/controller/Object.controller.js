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
	return BaseController.extend("shapein.UsersList.controller.Object", {

		formatter: formatter,
		fromDatePreviousValue: "",
		toDatePreviousValue: "",

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0
				});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.setModel(new JSONModel(), "data");
			this._oTableFilterState = {
				aFilter: [],
				aSearch: []
			};
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("objectView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("Users", {
					uuid: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
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
			//this.getView().byId("lineItemsList").setBusy(true);
			//	oViewModel.setProperty("/busy", true);
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
						//var text = atob(entry.request);
						// var text = that.b64DecodeUnicode(entry.request);
						// var objectValue = JSON.parse(text);
						// var firstname = objectValue['firstname'];
						// var lastname = objectValue['lastname'];
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
						//entry.integ_id = toString(entry.integ_id);
						// entry.firstname = firstname;
						// entry.lastname = lastname;
						// entry.name = lastname + ", " + firstname;
						// entry.email = objectValue['email'];
						// var ref = objectValue['registration_references'];
						// if (ref) {
						// 	entry.pernr = ref['employee_number'];
						// }

					});
					oData.integ_items = null;
					oData.integ_items = results;
					itemsModel.setData(oData);
					oViewModel.setProperty("/busy", false);
					//that.getView().byId("detailPage").setBusy(false);

					that.getView().byId("tabfSuc").setCount(scount);
					that.getView().byId("tabfErr").setCount(ecount);
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});
			// Add the object page to the flp routing history
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("objectTitle") + " - " + sObjectName,
				icon: "sap-icon://enter-more",
				intent: "#UsersList-display&/Users/" + sObjectId
			});

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
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
			if (!this.byId("viewSettingsDialogDetail")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.UsersList.view.ViewSettingsDialogDetail",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialogDetail").open(sDialogTab);
			}
		},

		changeDates: function (oEvent) {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[0];
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

		searchFilters: function () {
			var aFilterItems = [],
				aFilters = [],
				aCaptions = [];
			var itemsModel = this.getView().getModel("items");
			if (this.byId("viewSettingsDialogDetail")) {
				aFilterItems = this.byId("viewSettingsDialogDetail").getFilterItems();
				//	var sortItem = this.byId(this.byId("viewSettingsDialogDetail").getSelectedSortItem());
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
				//aFilters.push(new Filter("createdAt", FilterOperator.LE, fehasta));
				//aFilters.push(new Filter("createdAt", FilterOperator.GE, fedesde));
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
					//new Filter("pernr", FilterOperator.Contains, query)
				);
			}

			//aFilters.push(new Filter("pck_code", FilterOperator.EQ, "SYN_WORKER"));
			this._oTableFilterState.aFilter = aFilters;
			//	this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
			if (this.byId("viewSettingsDialogDetail")) {
				this._applySortGroup(sortItem, sortDesc);
			}

		},

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
				MessageBox.error("Message empty");
			}
		},

		_applyFilterSearch: function () {
			var aFilters = this._oTableFilterState.aSearch.concat(this._oTableFilterState.aFilter);
			this.getView().byId("lineItemsList").getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			// if (aFilters.length !== 0) {
			// 	oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			// } else if (this._oListFilterState.aSearch.length > 0) {
			// 	// only reset the no data text to default when no new search was triggered
			// 	oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			// }
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
			var binding = this.getView().byId("lineItemsList").getBinding("items");
			//binding.iLength = binding.iLastLength;
			binding.sort(aSorters);
		},
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

		b64DecodeUnicode: function (str) {
			// Going backwards: from bytestream, to percent-encoding, to original string.
			return decodeURIComponent(atob(str).split('').map(function (c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			}).join(''));
		},

		onDataDialogPress: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("items").getPath();
			var itemsModel = this.getView().getModel("items");
			sPath = sPath + "/request";
			var request = itemsModel.getProperty(sPath);
			//	var text = atob(request);
			var text = this.b64DecodeUnicode(request);
			var objectValue = JSON.parse(text);
			var arrayValues = Object.entries(objectValue);
			var data = [];
			var dataModel = this.getView().getModel("data");
			arrayValues.forEach(function (entry) {
				var item = {};
				if (entry[0] === "registration_references") {
					var arrayRef = Object.entries(entry[1]);
					arrayRef.forEach(function (entryRef) {
						var itemRef = {};
						itemRef.Name = entryRef[0].toString().replaceAll("_", " ");
						itemRef.Value = entryRef[1];
						itemRef.key = "Data";
						itemRef.Icon = "sap-icon://database";
						data.push(itemRef);
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
				} else if (entry[0] === "profiles") {
					var arrayProf = Object.entries(entry[1]);
					arrayProf.forEach(function (entryProf) {
						var itemProf = {};

						// itemProf.Name = "profile" + entryProf[0] + "-role id";
						// itemProf.Value = entryProf[1].role_id.toString().replaceAll("_", " ");
						// data.push(itemProf);
						// var itemProf1 = {};
						// itemProf1.Name = "profile" + entryProf[0] + "-operator";
						// itemProf1.Value = entryProf[1].employees_perimeter.operator.toString().replaceAll("_", " ");
						// data.push(itemProf1);
						// var itemProf2 = {};
						// itemProf2.Name = "profile" + entryProf[0] + "-org. id";
						// itemProf2.Value = entryProf[1].employees_perimeter.organization_id.toString().replaceAll("_", " ");
						// data.push(itemProf2);

						itemProf.Icon = "sap-icon://overview-chart";
						itemProf.key = "Profile";
						itemProf.Name = entryProf[1].role_id.toString().replaceAll("_", " ");
						itemProf.Description = entryProf[1].employees_perimeter.operator.toString().replaceAll("_", " ");
						itemProf.Value = entryProf[1].employees_perimeter.organization_id.toString().replaceAll("_", " ");
						data.push(itemProf);
					});
				} else {
					item.Icon = "sap-icon://database";
					item.Name = entry[0].toString().replaceAll("_", " ");
					item.Value = entry[1];
					item.key = "Data";
					data.push(item);
				}
			});
			dataModel.setData(data);

			if (!this.oDataDialog) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.UsersList.view.DataDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.oDataDialog = oDialog;
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.oDataDialog.open();
			}

			// if (!this.oDataDialog) {
			// 	this.oDataDialog = new sap.m.Dialog({
			// 		title: "Data Request",
			// 		contentWidth: "550px",
			// 		contentHeight: "300px",
			// 		resizable: true,
			// 		content: new sap.m.List({
			// 			items: {
			// 				path: "data>/",
			// 				template: new sap.m.StandardListItem({
			// 					title: "{data>Name}",
			// 					info: "{data>Value}",
			// 					infoState: "Information"
			// 				})
			// 			}
			// 		}),
			// 		endButton: new sap.m.Button({
			// 			text: "OK",
			// 			press: function () {
			// 				this.oDataDialog.close();
			// 			}.bind(this)
			// 		})
			// 	});

			// 	// to get access to the controller's model
			// 	this.getView().addDependent(this.oDataDialog);
			// }
			// this.oDataDialog.open();
		},
		pressOkButton: function (oEvent) {
			this.oDataDialog.close();
		},

		getGroup: function (oContext) {
			var sKey = oContext.getProperty("key");
			return {
				key: sKey
			};
		},

		getGroupHeader: function (oGroup) {
			return new sap.m.GroupHeaderListItem({
				title: oGroup.key,
				upperCase: false
			});
		}

	});

});
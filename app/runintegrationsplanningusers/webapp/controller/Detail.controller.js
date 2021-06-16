sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	"sap/ui/core/Fragment",
], function (BaseController, JSONModel, formatter, mobileLibrary, Fragment) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;
	//	var adataOld = {};

	return BaseController.extend("shapein.RunIntegrationPlanningUsers.controller.Detail", {

		formatter: formatter,
		adataOld: {},
		oldKey: "",
		_formFragments: null,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
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
				//	time_measure: "m",
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
			//	this._showFormFragment("DisplayData");

			this.createFragmentsData();
		},

		onExit: function () {
			this._formFragments["DisplayData"].destroy();
			this._formFragments["ChangeData"].destroy();
			this._formFragments = null;
		},

		createFragmentsData: function () {
			var sFragmentName = "DisplayData";
			this._formFragments = [];
		//	if (!this._formFragments["DisplayData"]) {
				var fragmentName = "shapein.RunIntegrationPlanningUsers.view.fragment." + sFragmentName;
				Fragment.load({
					id: "displayData",
					name: fragmentName,
					controller: this
				}).then(function (oFragment) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oFragment);
					this._formFragments[sFragmentName] = oFragment;
					this._toggleButtonsAndView(false);
					//return this._formFragments[sFragmentName];
				}.bind(this));
		//	}

			var sFragmentName2 = "ChangeData";
			var fragmentName2 = "shapein.RunIntegrationPlanningUsers.view.fragment." + sFragmentName2;
		//	if (!this._formFragments["ChangeData"]) {
				Fragment.load({
					id: "changeData",
					name: fragmentName2,
					controller: this
				}).then(function (oFragment) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oFragment);
					// var fnValidator = function (args) {
					// 	var text = args.text;
					// 	return new sap.m.Token({
					// 		key: text,
					// 		text: text
					// 	});
					// };
			//		var multi = Fragment.byId("changeData", "multiInput11");
			//		multi.addValidator(fnValidator);
					this._formFragments[sFragmentName2] = oFragment;
					//	return this._formFragments[sFragmentName];
				}.bind(this));
	//		}
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onSendEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("detailView"),
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

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
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

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
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

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
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
					item.supervisories = [];
					item2.supervisories = [];
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
						case "SUPERVISORY":
							var supervisory = {};
							supervisory.Name = entry.value;
							supervisory.Uuid = entry.uuid;
							item.supervisories.push(supervisory);
							item2.supervisories.push(supervisory);
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

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			this.byId('edit').setEnabled(true);
		},

		_getFormFragment: function (sFragmentName) {
			var oFormFragment = this._formFragments[sFragmentName];
			if (oFormFragment) {
				return oFormFragment;
			}
			// var fragmentName = "shapein.RunIntegrationPlanningWorkers.view.fragment." + sFragmentName;

			// //this.getView().addDependent(oFormFragment);
			// if (sFragmentName == "ChangeData") {
			// 	Fragment.load({
			// 		id: "changeData",
			// 		name: fragmentName,
			// 		controller: this
			// 	}).then(function (oFragment) {
			// 		// connect dialog to the root view of this component (models, lifecycle)
			// 		this.getView().addDependent(oFragment);
			// 		var fnValidator = function (args) {
			// 			var text = args.text;
			// 			return new sap.m.Token({
			// 				key: text,
			// 				text: text
			// 			});
			// 		};
			// 		var multi = Fragment.byId("changeData", "multiInput11");
			// 		multi.addValidator(fnValidator);
			// 		this._formFragments[sFragmentName] = oFragment;
			// 		return this._formFragments[sFragmentName];
			// 	}.bind(this));
			// } else {
			// 	Fragment.load({
			// 		id: "displayData",
			// 		name: fragmentName,
			// 		controller: this
			// 	}).then(function (oFragment) {
			// 		// connect dialog to the root view of this component (models, lifecycle)
			// 		this.getView().addDependent(oFragment);
			// 		this._formFragments[sFragmentName] = oFragment;
			// 		return this._formFragments[sFragmentName];
			// 	}.bind(this));
			// }
		},

		_showFormFragment: function (sFragmentName) {
			var oIconTabFilter = this.byId("icontabData");
			var content = oIconTabFilter.getContent();
			var barId = this.getView().createId("bar");
			if (content[0].getId() !== barId) {
				var id = content[0].getId();
				oIconTabFilter.removeContent(id);
			}
			var conte = this._getFormFragment(sFragmentName);
			oIconTabFilter.insertContent(conte);
		},

		handleEditPress: function () {

			//Clone the data
			//	this._oSupplier = Object.assign({}, this.getView().getModel().getData().SupplierCollection[0]);
			this._toggleButtonsAndView(true);

		},

		_toggleButtonsAndView: function (bEdit) {
			var oView = this.getView();

			// Show the appropriate action buttons
			oView.byId("edit").setVisible(!bEdit);
			oView.byId("save").setVisible(bEdit);
			oView.byId("cancel").setVisible(bEdit);
			// Set the right form type
			this._showFormFragment(bEdit ? "ChangeData" : "DisplayData");
		},

		handleCancelPress: function () {

			//Restore the data
			var oModel = this.getView().getModel();
			var adataModel = this.getView().getModel("adata");
			var data = Object.assign({}, this.adataOld);
			adataModel.setData(data);
			adataModel.refresh();
			//	oData.SupplierCollection[0] = this._oSupplier;

			//	oModel.setData(oData);
			this._toggleButtonsAndView(false);

		},

		_validateInputEditA: function (oInput) {
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

		handleSavePress: function (oEvent) {
			var adataModel = this.getView().getModel("adata");
			var adata = adataModel.getData();
			var oModel = this.getOwnerComponent().getModel();
			var fragmentId = this.getView().createId("changeData");

			// VALIDACIONES TODO
			var oView = this.getView(),
				aInputs = [
					Fragment.byId("changeData", "dp1"),
					Fragment.byId("changeData", "dp2"),
					Fragment.byId("changeData", "dp3"),
					Fragment.byId("changeData", "dp4")
					// oView.byId("dp1"),
					// oView.byId("dp2"),
					// oView.byId("dp3"),
					// oView.byId("dp4")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputEditA(oInput) || bValidationError;
			}, this);

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			var text = "Are you sure you want to update a Users Planning Adata?";
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						var oViewModel = that.getModel("detailView");
						oViewModel.setProperty("/busy", true);
						var planning_uuid = adataModel.getProperty("/planning_uuid");
						// UPDATE
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
						// var oData6 = {};
						// oData6.uuid = adata.ref_id_uuid;
						// var sPath6 = sPath + "(" + oData6.uuid + ")";
						// oData6.value = adata.ref_id;
						// oModel.update(sPath6, oData6, {
						// 	groupId: "updateGroup"
						// });
						// var supervisoriest = Fragment.byId("changeData", "multiInput11").getTokens();
						// var sPath7 = "/Integration_Pck_Planning_Adata";
						// for (var i = 0; i < supervisoriest.length; i++) { //Los nuevos
						// 	var resultado = that.adataOld.supervisories.find(function (supervisory) {
						// 		return supervisory.Name === supervisoriest[i].getText();
						// 	});
						// 	if (!resultado) {
						// 		var oData7 = {};
						// 		oData7.planning_uuid = planning_uuid;
						// 		oData7.level1 = "SUPERVISORIES_ALLOWED";
						// 		oData7.level2 = "SUPERVISORY";
						// 		oData7.value = supervisoriest[i].getText();
						// 		oData7.value2 = null;
						// 		oModel.create(sPath7, oData7, {
						// 			groupId: "updateGroup"
						// 		});
						// 	}
						// }

						// for (var j = 0; j < that.adataOld.supervisories.length; j++) { //Los eliminados
						// 	var resultado2 = supervisoriest.find(function (supervisory) {
						// 		return supervisory.getText() === that.adataOld.supervisories[j].Name;
						// 	});
						// 	if (!resultado2) {
						// 		var oData8 = {};
						// 		var sPath8 = sPath + "(" + that.adataOld.supervisories[j].Uuid + ")";
						// 		oModel.remove(sPath8, oData8, {
						// 			groupId: "updateGroup"
						// 		});
						// 	}
						// }

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

		successUpdateBatch: function (oData, response) {
			sap.m.MessageToast.show("Adata updated succesfully.");
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", false);
			this._onBindingChange();
		},

		errorUpdateBatch: function (oError) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", false);
			sap.m.MessageToast.show("Error");

		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		onAddPlanD: function () {
			var data = {
				execute: true,
				begda: "2020-01-01",
				endda: "9999-12-31",
				periodicity_type: "W",
				ontime: false,
				periodicity_values: "2-4-6",
				time_frecuency: "1m",
				//	time_measure: "m",
				time_start: "00:00:00",
				time_end: "23:59:00",
				time_zone: "UTC"
			};

			var newPlanModel = this.getModel("newPlan");
			newPlanModel.setData(data);

			if (!this.byId("PlanningD")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.RunIntegrationPlanningUsers.view.fragment.Planning",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					this.byId("createBut").setVisible(true);
					this.byId("saveBut").setVisible(false);
					oDialog.setTitle("New Planning D");
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("createBut").setVisible(true);
				this.byId("saveBut").setVisible(false);
				this.byId("PlanningD").setTitle("New Planning D");
				this.byId("PlanningD").open();
			}
		},

		cancelPlan: function (oEvent) {
			var dialog = oEvent.getSource().getParent();
			dialog.close();

		},

		selExecute: function (oEvent) {
			var index = oEvent.getParameter("selectedIndex");
			var NewPlanModel = this.getModel("newPlan");
			if (index == 0) {
				NewPlanModel.setProperty("/execute", true);
			} else {
				NewPlanModel.setProperty("/execute", false);
			}
		},

		changeBegda: function (oEvent) {
			var value = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			var sValueState = "None";
			if (value == "") {
				sValueState = "Error";
			}
			oInput.setValueState(sValueState);
			var NewPlanModel = this.getModel("newPlan");
			NewPlanModel.setProperty("/begda", value);
		},

		changeEndda: function (oEvent) {
			var value = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			var sValueState = "None";
			if (value == "") {
				sValueState = "Error";
			}
			oInput.setValueState(sValueState);
			var NewPlanModel = this.getModel("newPlan");
			NewPlanModel.setProperty("/endda", value);
		},

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

		deletePlanD: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
			var itemsModel = this.getView().getModel();
			var text = "Are you sure?";
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						itemsModel.remove(sPath, {
							success: function (oData, response) {
								//var but = oEvent.getSource();
								sap.m.MessageToast.show("Planning D deleted succesfully.");
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

		handleSelectionChange: function (oEvent) {
			var oInput = oEvent.getSource();
			var sValueState = "None";
			var selKeys = oInput.getSelectedKeys();
			if (selKeys.length > 0) {
				oInput.setValueState(sValueState);
			}
		},

		timeChange: function (oEvent) {
			var value = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			var sValueState = "None";
			if (value == "") {
				sValueState = "Error";
			}
			oInput.setValueState(sValueState);
		},

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
				//	time_measure: time_measure,
				time_start: time_start,
				time_end: time_end,
				time_zone: time_zone
			};

			var newPlanModel = this.getModel("newPlan");
			newPlanModel.setData(data);
			if (!this.byId("PlanningD")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.RunIntegrationPlanningUsers.view.fragment.Planning",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					this.byId("createBut").setVisible(false);
					this.byId("saveBut").setVisible(true);
					oDialog.setTitle("Edit Planning D");
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("createBut").setVisible(false);
				this.byId("saveBut").setVisible(true);
				this.byId("PlanningD").setTitle("Edit Planning D");
				this.byId("PlanningD").open();
			}
			//newPlanModel.setData(data);
			//sPath = sPath + "/request";
			//var request = itemsModel.getProperty(sPath);
		},

		_validateInput: function (oInput) {
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

		execPlan: function (oEvent) {
			// VALIDACIONES TODO
			var oView = this.getView(),
				aInputs = [
					oView.byId("begda"),
					oView.byId("endda"),
					oView.byId("TP1"),
					oView.byId("TP2")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInput(oInput) || bValidationError;
			}, this);

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
			} else {
				if (this.byId("periodType").getSelectedItem().getKey() == "M") {
					var selKeys = this.byId("MC1").getSelectedKeys();
					if (selKeys.length == 0) {
						this.byId("MC1").setValueState("Error");
						sap.m.MessageBox.alert("A validation error has occurred.");
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
						sap.m.MessageBox.alert("A validation error has occurred.");
						return;
					}

				}
				var planDialog = oEvent.getSource().getParent();
				var button = oEvent.getSource().getText();
				var text = "Are you sure?";
				var that = this;
				var dialog = new sap.m.Dialog({
					title: 'Confirmation',
					type: 'Message',
					content: new sap.m.Text({
						text: text
					}),
					beginButton: new sap.m.Button({
						text: 'Yes',
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
							//	var timeE = NewPlanModel.getProperty("/time_end");
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
										//var but = oEvent.getSource();
										planDialog.setBusy(false);
										planDialog.close();
										sap.m.MessageToast.show("Planning D created succesfully.");

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
										//var but = oEvent.getSource();
										planDialog.setBusy(false);
										planDialog.close();
										sap.m.MessageToast.show("Planning D saved succesfully.");

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
			}
		},

		onEdit: function () {
			this.showCustomActions(true);
			this.byId("segButton").setEnabled(true);
			this.byId("comDisplay").setVisible(false);
			this.byId("comChange").setVisible(true);
			this.oSemanticPage.setHeaderExpanded(true);
			this.oEditAction.setVisible(false);
			this.oDeleteAction.setVisible(false);
		},

		onDelete: function () {
			var sPath = this.getView().getBindingContext().getPath();
			var oModel = this.getOwnerComponent().getModel();
			var text = "Are you sure?";
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oModel.remove(sPath, {
							success: function (oData, response) {
								//var but = oEvent.getSource();
								var oEven = new sap.ui.getCore().getEventBus();
								var uuid = that.byId("title").getText();
								oEven.publish("Detail", "Delete_Plan", {
									Number: uuid
								});
								sap.m.MessageToast.show("Planning deleted succesfully.");
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
					//var but = oEvent.getSource();
					// planDialog.setBusy(false);
					// planDialog.close();
					that.oldKey = that.byId("segButton").getSelectedKey();
					sap.m.MessageBox.alert("Successfully saved!");

				},
				error: function (oError) {
					// planDialog.setBusy(false);
					// planDialog.close();
					sap.m.MessageToast.show("Error");

				}
			});

		},

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

		showCustomActions: function (bShow) {
			this.byId("saveAction").setVisible(bShow);
			this.byId("cancelAction").setVisible(bShow);
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		}
	});

});
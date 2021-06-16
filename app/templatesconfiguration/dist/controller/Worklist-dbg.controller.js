sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/core/Fragment",
	"sap/ui/model/FilterOperator",
	"./App.controller"
], function (BaseController, JSONModel, formatter, Filter, Fragment, FilterOperator, App) {
	"use strict";

	return BaseController.extend("shapein.TemplatesConfiguration.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			this.firstDisplay = "X";
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];
			this._oTableFilterState = [];
			var router = this.getOwnerComponent().getRouter();
			var target = router.getTarget("worklist");
			target.attachDisplay(this.onDisplay, this);

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
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
			// Add the worklist page to the flp routing history
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("worklistViewTitle"),
				icon: "sap-icon://table-view",
				intent: "#Worker-TemplateConfig"
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
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		closeManageBPs: function (oEvent) {
			var dialogManageBPs = oEvent.getSource().getParent();
			dialogManageBPs.close();
		},

		onDisplay: function (oEvent) {
			if (this.firstDisplay == "X") {
				this.firstDisplay = "";
			} else {
				this.refresh();
			}
		},

		refresh: function () {
			var oViewModel = this.getModel("appView");
			var oModel = this.getOwnerComponent().getModel();
			var oPersTempModel = this.getOwnerComponent().getModel("templates_pers");
			var that = this;
			this.byId("table").setBusy(true);
			var sPath = "/Di_Template";
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "planning"
				},
				success: function (oData, oResponse) {
					var results = oData.results;
					delete oData.__metadata;
					oPersTempModel.setData(results);
					oPersTempModel.refresh();
					that.call_Templates_Pd();
				},
				error: function (oError) {
					that.byId("table").setBusy(false);
					//	oViewModel.setProperty("/busy", false);
				}
			});

		},

		deleteTemplate: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("templates").getPath();
			var itemsModel = this.getView().getModel("templates");
			var sPath2 = sPath + "/uuid";
			var uuid = itemsModel.getProperty(sPath2);
			var that = this;
			var text = "Do you want to delete this Template?"
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						that.deleteTempConfirm(uuid);
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

		deleteTempConfirm: function (uuid) {
			var oModel = this.getOwnerComponent().getModel();
			this.byId("table").setBusy(true);
			var that = this;
			oModel.callFunction(
				"/delete_complete_template", {
					method: "GET",
					urlParameters: {
						uuid: uuid
					},
					success: function (oData, response) {
						sap.m.MessageToast.show(oData.value);
						that.refresh();
						that.byId("table").setBusy(false);
					},
					error: function (oError) {
						that.byId("table").setBusy(false);
						sap.m.MessageToast.show("Error");
					}
				});
		},

		call_Templates_Pd: function () {
			var oPersTempModel = this.getOwnerComponent().getModel("templates_pers");
			var templates = oPersTempModel.getData();
			var oViewModel = this.getModel("appView");
			var oModel = this.getOwnerComponent().getModel("templates");
			//	var url = "/CPI-WD2PD-Deep/templates/templates_pd";
			var url = "/CPI-WD2PD_Dest/di/templates/templates_pd";
			var that = this;
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
			if (this.getOwnerComponent().settings) {
				//this.settings = await this.getSubscriptionSettings();

				var cuscode = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Code");
				var cusclientid = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Client_Id");
				var cusscope = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Scope");
				jQuery.ajax({
					url: url,
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Customer-Code', cuscode.value);
						xhr.setRequestHeader('Customer-Client_Id', cusclientid.value);
						xhr.setRequestHeader('Customer-Scope', cusscope.value);
					},
					type: "GET",
					dataType: "json",
					success: function (results) {
						for (var i = 0; i < results.length; i++) {
							var act_version = String(results[i].active_version);
							var temp = templates.find(template => template.template_id === results[i].id && template.template_version === act_version);
							if (temp) {
								results[i].planned = "";
								if (temp.planning) {
									if (temp.planning.enable) {
										results[i].planned = "X";
									}
								}
								results[i].active = temp.active;
								results[i].exist_pers = "X";
								results[i].exist_PD = "X";
								results[i].uuid = temp.uuid;
							} else {
								results[i].planned = "";
								results[i].active = false;
								results[i].exist_pers = "";
								results[i].exist_PD = "X";
								results[i].uuid = "";
							}
						}
						for (var j = 0; j < templates.length; j++) {
							var act_version = String(templates[j].template_version);
							var temp = results.find(template => template.id === templates[j].template_id && template.active_version == act_version);
							if (!temp) {
								var result = {};
								result.planned = "";
								if (templates[j].planning) {
									if (templates[j].planning.enable) {
										result.planned = "X";
									}
								}
								result.active_version = templates[j].template_version;
								result.active = templates[j].active;
								result.exist_pers = "X";
								result.description = templates[j].description;
								result.id = templates[j].template_id;
								result.locale = templates[j].language;
								result.title = templates[j].doc_title;
								result.format = templates[j].format;
								result.updated_at = templates[j].updated_at;
								result.exist_PD = "";
								results.push(result);
							}
						}
						oModel.setData(results);
						oModel.refresh();
						that.byId("table").setBusy(false);
						//	oViewModel.setProperty("/busy", false);
					},
					error: function (e) {
						that.byId("table").setBusy(false);
						//	oViewModel.setProperty("/busy", false);
					}
				});
			}
		},

		onSyncBP: function (oEvent) {
			var that = this;
			var text = "Do you want to synchronize the Business Process Types from Workday?"
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						that.onSyncBPConfirm();
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

		onSyncBPConfirm: function () {
			//llamar a CPI para que cargue Persistencia
			var that = this;
			this.byId("manageBPs").setBusy(true);
			var url = "/CPI-WD2PD_Dest/di/workday/bpt/load";
			if (this.getOwnerComponent().settings) {
				//this.settings = await this.getSubscriptionSettings();

				var cuscode = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Code");
				var cusclientid = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Client_Id");
				var cusscope = this.getOwnerComponent().settings.find(setting => setting.code === "Customer-Scope");
				jQuery.ajax({
					url: url,
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Customer-Code', cuscode.value);
						xhr.setRequestHeader('Customer-Client_Id', cusclientid.value);
						xhr.setRequestHeader('Customer-Scope', cusscope.value);
					},
					type: "GET",
					dataType: "json",
					success: function (results) {
						that.byId("manageBPs").setBusy(false);
						sap.m.MessageToast.show(results.message);
						//	oViewModel.setProperty("/busy", false);
					},
					error: function (e) {
						sap.m.MessageToast.show("Workday Error: The requested resource is not available");
						that.byId("manageBPs").setBusy(false);
					}
				});
			}
		},

		onAddBP: function (oEvent) {
			// cargar modelo de BPT de Workday para mostrar el select
			var buttonId = oEvent.getSource().getId();
			var sPath2 = "";
			if (!buttonId.match("addBP")) {
				sPath2 = oEvent.getSource().getParent().getParent().getBindingContext("BProcess").getPath();
			}
			var oModel = this.getOwnerComponent().getModel();
			var BPWDModel = this.getOwnerComponent().getModel("BProcessWD");
			var that = this;
			var sPath = "/Di_Business_Process_Master";
			oModel.read(sPath, {
				success: function (oData, oResponse) {
					var results = oData.results;
					delete oData.__metadata;
					// for (var i = 0; i < results.length; i++) {
					// 	results[i].templates = results[i].templates.results;
					// }
					BPWDModel.setData(results);
					BPWDModel.refresh();
					that.openAddBP(buttonId, sPath2);
				},
				error: function (oError) {
					//	oViewModel.setProperty("/busy", false);
				}
			});

		},

		openAddBP: function (ID, Spath) {
			var oBptModel = this.getModel("bpt");
			var bptData = oBptModel.getData();
			var action = "";
			var buttonId = ID;
			if (buttonId.match("addBP")) {
				action = "New";
				bptData = {
					retry_employee_exist: false
				};
				oBptModel.setData(bptData);
				oBptModel.refresh();
			} else {
				action = "Edit";
				var oBPTModel = this.getModel("BProcess");
				//var sPath = oEvent.getSource().getParent().getParent().getBindingContext("BProcess").getPath();
				var sPath = Spath;
				var BPTData = oBPTModel.getData();
				var bpt = Object.assign({}, oBPTModel.getProperty(sPath));
				oBptModel.setData(bpt);
				oBptModel.refresh();
			}
			if (!this.byId("bpt")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.bpt",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					if (action == "New") {
						oDialog.setTitle("New Business Process Type");
						this.byId("btonAddBpt").setVisible(true);
						this.byId("btonEditBpt").setVisible(false);
						this.byId("Name_bpt").setEnabled(true);
					} else {
						oDialog.setTitle("Edit Business Process Type");
						this.byId("btonEditBpt").setVisible(true);
						this.byId("btonAddBpt").setVisible(false);
						if (bpt.templates) {
							if (bpt.templates.length > 0) {
								this.byId("Name_bpt").setEnabled(false);
							} else {
								this.byId("Name_bpt").setEnabled(true);
							}
						} else {
							this.byId("Name_bpt").setEnabled(true);
						}
					}
					oDialog.open();
				}.bind(this));
			} else {
				//	var checkMapModel = this.getModel("checkMap");
				//	checkMapModel.setData([]);
				// this.byId("CheckEmployee").setValue("");
				// this.byId("CheckEmployee").setValueState("None");
				if (action == "New") {
					this.byId("bpt").setTitle("New Business Process Type");
					this.byId("btonAddBpt").setVisible(true);
					this.byId("btonEditBpt").setVisible(false);
					this.byId("Name_bpt").setEnabled(true);
				} else {
					this.byId("bpt").setTitle("Edit Business Process Type");
					this.byId("btonEditBpt").setVisible(true);
					this.byId("btonAddBpt").setVisible(false);
					if (bpt.templates) {
						if (bpt.templates.length > 0) {
							this.byId("Name_bpt").setEnabled(false);
						} else {
							this.byId("Name_bpt").setEnabled(true);
						}
					} else {
						this.byId("Name_bpt").setEnabled(true);
					}
				}
				this.byId("bpt").open();
			}
		},

		_validateInputNewP: function (oInput) {
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

		RefBP: function (oEvent) {
			var oButton = oEvent.getSource(),
				oView = this.getView();
			var oBptModel = this.getModel("bpt");
			var oBPTModel = this.getModel("BProcess");
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("BProcess").getPath();
			var BPTData = oBPTModel.getData();
			var bpt = Object.assign({}, oBPTModel.getProperty(sPath));
			oBptModel.setData(bpt);
			oBptModel.refresh();
			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.refBps",
					controller: this
				}).then(function (oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._pPopover.then(function (oPopover) {
				oPopover.openBy(oButton);
			});
		},

		execNewBpt: function (oEvent) {
			var oBPTModel = this.getModel("BProcess");
			var BPTData = oBPTModel.getData();
			var aInputs = [
					//	this.byId("Name_bpt"),
					this.byId("Desc_bpt")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			var that = this;
			//var name = aInputs[0].getValue();
			var name = this.byId("Name_bpt").getSelectedKey();
			var bpt = BPTData.find(buspt => buspt.name === name);
			if (bpt) {
				sap.m.MessageBox.alert("This business process type is being used.");
				return;
			}
			var description = aInputs[0].getValue();
			var retry = this.byId("retry_bpt").getSelected();
			var retries_number;
			if (!retry) {
				retries_number = null;
			} else {
				retries_number = parseInt(this.byId("retnum_bpt").getValue());
			}
			var data = {
				name: name,
				description: description,
				retry_employee_exist: retry,
				retries_number: retries_number
			};
			var oModel = that.getOwnerComponent().getModel();
			var text = "Are you sure to create a new business process type?";
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oModel.create("/Di_Business_Process", data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								//	that.refreshAttribFilters(uuidtemp);
								that.fill_Business_Process();
								that.byId("bpt").close();
								sap.m.MessageToast.show("Business Process Type created!!");
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
		execChangeBpt: function (oEvent) {
			var aInputs = [
					//	this.byId("Name_bpt"),
					this.byId("Desc_bpt")
				],
				bValidationError = false;

			// Check that inputs are not empty.
			// Validation does not happen during data binding as this is only triggered by user actions.
			aInputs.forEach(function (oInput) {
				bValidationError = this._validateInputNewP(oInput) || bValidationError;
			}, this);
			// }

			if (bValidationError) {
				sap.m.MessageBox.alert("A validation error has occurred.");
				return;
			}
			var that = this;
			//	var name = aInputs[0].getValue();
			var name = this.byId("Name_bpt").getSelectedKey();
			var description = aInputs[0].getValue();
			var retry = this.byId("retry_bpt").getSelected();
			var retries_number;
			if (!retry) {
				retries_number = null;
			} else {
				retries_number = parseInt(this.byId("retnum_bpt").getValue());
			}
			var bptModel = this.getModel("bpt");
			var editData = bptModel.getData();
			var bpt_id = editData.bpt_id;
			var data = {
				name: name,
				description: description,
				retry_employee_exist: retry,
				retries_number: retries_number
			};
			var oModel = that.getOwnerComponent().getModel();
			var text = "Are you sure to save this business process type?";
			var sPath = "/Di_Business_Process(guid'" + bpt_id + "')";
			var dialog = new sap.m.Dialog({
				title: 'Confirmation',
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						oModel.update(sPath, data, {
							headers: {
								"Content-Type": "application/json",
								'Accept': 'application/json'
							},
							success: function (oData, response) {
								//	that.refreshAttribFilters(uuidtemp);
								that.fill_Business_Process();
								that.byId("bpt").close();
								sap.m.MessageToast.show("Business Process Type saved!!");
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

		cancelBpt: function (oEvent) {
			var dialogNewBTP = oEvent.getSource().getParent();
			dialogNewBTP.close();
		},

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
					name: "shapein.TemplatesConfiguration.view.fragments.ViewSettingsDialog",
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

		onConfirmViewSettingsDialog: function (oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [],
				aFilters2 = [],
				aCaptions = [];
			var value;
			aFilterItems.forEach(function (oItem) {
				if (oItem.getKey() == "A") {
					value = true;
				} else {
					value = false;
				}
				aFilters2.push(new Filter(oItem.getParent().getKey(), FilterOperator.EQ, value));
			});
			if (aFilters2.length > 0) {
				aFilters.push(new Filter(aFilters2, false));
			}
			this._oTableFilterState = aFilters;
			var sQuery = this.byId("searchField").getValue();
			var aTableSearchState = [new Filter([
				new Filter("id", FilterOperator.Contains, sQuery),
				new Filter("title", FilterOperator.Contains, sQuery),
				new Filter("description", FilterOperator.Contains, sQuery)
			], false)];

			this._applySearch(aTableSearchState);
		},

		handleResetFilters: function () {
			// var vLayout = this.byId("viewSettingsDialog").getFilterItems()[0].getCustomControl();
			// var oCustomFilter = this.byId("viewSettingsDialog").getFilterItems()[0],
			// 	fromDP = vLayout.getContent()[1],
			// 	toDP = vLayout.getContent()[3];
			// fromDP.setValue("");
			// toDP.setValue("");
			// oCustomFilter.setFilterCount(0);
			// oCustomFilter.setSelected(false);
			// var slider = this.byId("viewSettingsDialog").getFilterItems()[2].getCustomControl();
			// var oCustomFilter2 = this.byId("viewSettingsDialog").getFilterItems()[2];
			// slider.setValue(0);
			// slider.setValue2(0);
			// oCustomFilter2.setFilterCount(0);
			// oCustomFilter2.setSelected(false);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("worklistView"),
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

		onBPs: function () {
			if (!this.byId("manageBPs")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "shapein.TemplatesConfiguration.view.fragments.manageBPs",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("manageBPs").open();
				// this.byId("NameAttribuEdit").setValueState("None");
				// this.byId("DescAttribuEdit").setValueState("None");
				// this.byId("PathAttribuEdit").setValueState("None");
			}
		},

		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				aTableSearchState = [new Filter([
					new Filter("id", FilterOperator.Contains, sQuery),
					new Filter("title", FilterOperator.Contains, sQuery),
					new Filter("description", FilterOperator.Contains, sQuery)
				], false)];
			}
			this._applySearch(aTableSearchState);

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
				objectId: oItem.getBindingContext("templates").getProperty("id"),
				version: oItem.getBindingContext("templates").getProperty("active_version")
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var aFilters = aTableSearchState.concat(this._oTableFilterState);
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},

		fill_Business_Process: function () {
			var oModel = this.getOwnerComponent().getModel();
			var BPModel = this.getOwnerComponent().getModel("BProcess");

			var that = this;
			var sPath = "/Di_Business_Process";
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "templates"
				},
				success: function (oData, oResponse) {
					var results = oData.results;
					delete oData.__metadata;
					for (var i = 0; i < results.length; i++) {
						results[i].templates = results[i].templates.results;
					}
					BPModel.setData(results);
					BPModel.refresh();
				},
				error: function (oError) {
					//	oViewModel.setProperty("/busy", false);
				}
			});
		},

		deleteBP: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getParent().getBindingContext("BProcess").getPath();
			var itemsModel = this.getView().getModel("BProcess");
			var oModel = this.getView().getModel();
			var sPath2 = sPath + "/bpt_id";
			var bpt_id = itemsModel.getProperty(sPath2);
			var sPath1 = "/Di_Business_Process(guid'" + bpt_id + "')";
			var text = "Are you sure to delete this Business Process Type?";
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
						oModel.remove(sPath1, {
							success: function (oData, response) {
								//var but = oEvent.getSource();
								//	that.refreshAttribFilters(uuidtemp);
								that.fill_Business_Process();
								sap.m.MessageToast.show("Bus. Proc. Type deleted succesfully.");
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
		}

	});
});
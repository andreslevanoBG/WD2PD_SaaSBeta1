sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, Fragment, Sorter) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;
	var oMessagePopover;

	return BaseController.extend("shapein.MonitoringWorkers.controller.Detail", {

		formatter: formatter,
		fromWorkerPreviousValue: "",
		toWorkerPreviousValue: "",
		fromLastPreviousValue: "",
		toLastPreviousValue: "",
		reprocesses: [],

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
			this.setModel(new JSONModel(), "data");
			this.setModel(new JSONModel(), "message");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			this._oTableFilterState = {
				aFilter: [],
				aSearch: []
			};

			var oMessageTemplate = new sap.m.MessageItem({
				type: '{message>type}',
				title: '{message>title}',
				activeTitle: "{message>active}",
				description: '{message>description}',
				subtitle: '{message>subtitle}',
				counter: '{message>counter}'
			});

			oMessagePopover = new sap.m.MessagePopover({
				items: {
					path: 'message>/',
					template: oMessageTemplate
				},
				activeTitlePress: function () {
					//MessageToast.show('Active title is pressed');
				}
			});
			this.getView().addDependent(oMessagePopover);
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

		handleMessagePopoverPress: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("items").getPath();
			var itemsModel = this.getView().getModel("items");
			var sPath1 = sPath + "/timestamp_start";
			var sPath2 = sPath + "/error_code";
			var sPath3 = sPath + "/error/text";
			var sPath4 = sPath + "/error_message";
			var timestamp = itemsModel.getProperty(sPath1);
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd HH:mm:ss"
			});
			var time = dateFormat.format(timestamp);
			var error_code = itemsModel.getProperty(sPath2);
			var sErrorDescription = itemsModel.getProperty(sPath3);
			//var sErrorDescription2 = atob(itemsModel.getProperty(sPath4));
			var sErrorDescription2 = this.b64DecodeUnicode(itemsModel.getProperty(sPath4));
			// var sErrorDescription = 'First Error message description. \n' +
			// 	'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod' +
			// 	'tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,' +
			// 	'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo' +
			// 	'consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse' +
			// 	'cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non' +
			// 	'proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
			var data = [{
				type: 'Information',
				title: 'Timestamp:',
				description: "",
				subtitle: time
			}, {
				type: 'Error',
				title: 'Error Code',
				subtitle: error_code,
				description: ''
			}, {
				type: 'Error',
				title: 'Error Text',
				description: sErrorDescription
			}, {
				type: 'Error',
				title: 'Error Message',
				description: sErrorDescription2
			}];
			var messageModel = this.getView().getModel("message");
			messageModel.setData(data);
			oMessagePopover.toggle(oEvent.getSource());
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

		onFilterSelect: function (oEvent) {
			var oBinding = this.getView().byId("lineItemsList").getBinding("items"),
				sKey = oEvent.getParameter("key"),
				// Array to combine filters
				aFilters = [];

			if (sKey === "Ok") {
				// oCombinedFilterG = new Filter([new Filter("WeightMeasure", "LT", fMaxOkWeightG), new Filter("WeightUnit", "EQ", "G")], true);
				// oCombinedFilterKG = new Filter([new Filter("WeightMeasure", "LT", fMaxOkWeightKG), new Filter("WeightUnit", "EQ", "KG")], true);
				// aFilters.push(new Filter([oCombinedFilterKG, oCombinedFilterG], false));
			} else if (sKey === "Suc") {
				var SucFilter = new Filter("status_code", "EQ", "S");
				aFilters.push(new Filter([SucFilter], true));
			} else if (sKey === "Err") {
				var ErrFilter = new Filter("status_code", "EQ", "E");
				aFilters.push(new Filter([ErrFilter], true));
			}

			oBinding.filter(aFilters);
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
				var sObjectPath = this.getModel().createKey("Integrations", {
					id: sObjectId
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
			oViewModel.setProperty("/busy", true);
			//	oViewModel.refresh();
			//	this.getView().byId("lineItemsList").setBusy(true);
			//	this.getView().byId("detailPage").setBusy(true) ;
			var that = this;

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
						//that.getView().byId("detailPage").setBusy(true) ;
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
						//that.getView().byId("detailPage").setBusy(false) ;
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
				sObjectId = oObject.id,
				sObjectName = oObject.reference_id,
				oViewModel = this.getModel("detailView");
			var oModel = this.getOwnerComponent().getModel();
			var itemsModel = this.getView().getModel("items");
			var that = this;
			//this.getView().byId("lineItemsList").setBusy(true);
			//	oViewModel.setProperty("/busy", true);
			oViewModel.refresh();
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "integ_items/error,integ_items/worker"
				},
				success: function (oData, oResponse) {
					var results = oData.integ_items.results;
					delete oData.__metadata;
					var scount = 0;
					var ecount = 0;
					that.reprocesses = [];
					results.forEach(function (entry) {
						delete entry.__metadata;
						//var text = atob(entry.request);
						//	var text = that.b64DecodeUnicode(entry.request);
						//	var objectValue = JSON.parse(text);
						//	var firstname = objectValue['firstname'];
						//	var lastname = objectValue['lastname'];
						var worker = entry.worker;
						if (worker) {
							//entry.pernr = ref['employee_number'];
							entry.pernr = worker.employee_number;
							var firstname = worker.firstname;
							var lastname = worker.lastname;
							entry.firstname = firstname;
							entry.lastname = lastname;
							entry.name = lastname + ", " + firstname;
							//entry.email = objectValue['email'];
							entry.email = entry.worker.email;
						}
						if (entry.status_code == "S") {
							scount++;
						} else {
							ecount++;
						}

						//	var ref = objectValue['registration_references'];

						if (entry.worker.last_item_id == entry.item_id) {
							entry.action = "X";
						} else {
							entry.action = "";
						}
						if (entry.action == "X" && entry.status_code == "E") {
							that.reprocesses.push(worker.external_id);
						}

					});

					oData.integ_items = null;
					oData.integ_items = results;
					itemsModel.setData(oData);
					oViewModel.setProperty("/busy", false);
					//that.getView().byId("detailPage").setBusy(false);
					if (that.reprocesses.length > 0) {
						that.getView().byId("reproc").setVisible(true);
					} else {
						that.getView().byId("reproc").setVisible(false);
					}
					that.getView().byId("tabfSuc").setCount(scount);
					that.getView().byId("tabfErr").setCount(ecount);
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		b64DecodeUnicode: function (str) {
			// Going backwards: from bytestream, to percent-encoding, to original string.
			if (str == null || !str || str == undefined) {
				return "";
			} else {
				return decodeURIComponent(atob(str).split('').map(function (c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				}).join(''));
			}
		},

		pressError: function (oEvent) {

			var sPath = oEvent.getSource().getBindingContext().getPath();
			var itemsModel = this.getView().getModel();
			var sPath2 = sPath + "/error/text";
			var sPath3 = sPath + "/error_message";
			var text = itemsModel.getProperty(sPath2);
			var text2 = this.b64DecodeUnicode(itemsModel.getProperty(sPath3));
			var text3 = text2.replace("{", "(");
			var text4 = text3.replace("}", ")");
			//text = text + "&#xA;" + text2;
			//text = " invidunt (2 line breaks follow)&#xA;&#xA;ut labore et dolore ma";

			var dialog = new sap.m.Dialog({
				contentWidth: "500px",
				contentHeight: "auto",
				title: 'Error Message',
				type: 'Message',
				state: "Error",
				content: new sap.ui.layout.VerticalLayout({
					class: "sapUiContentPadding",
					width: "100%",
					content: [new sap.m.Text({
							class: "sapUiSmallMarginBottom",
							wrapping: true,
							text: text
						}), new sap.m.Label({
							class: "sapUiSmallMarginTop",
							text: ""
						}), new sap.m.Label({
							class: "sapUiSmallMarginTop",
							text: "Technical Error:"
						}),
						new sap.m.Text({
							wrapping: true,
							text: text4
						})
					]
				}),
				endButton: new sap.m.Button({
					text: 'Close',
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

		onAction: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("items").getPath();
			var itemsModel = this.getView().getModel("items");
			var sPath2 = sPath + "/worker/external_id";
			var external_id = itemsModel.getProperty(sPath2);
			var sPath3 = sPath + "/worker/employee_number";
			var worker = itemsModel.getProperty(sPath3);
			var text = "Are you sure you want to reprocess Worker ";
			text = text + worker + "?";
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
						var now = new Date();
						var utc_now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
							now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
						var effective = JSON.parse(JSON.stringify(utc_now));
						effective = effective.slice(0, -5);
						var data = {
							"test_mode": "False",
							"reprocess": "True",
							"transaction_log": {
								"time_zone": "UTC",
								"effective_from": "1900-01-01T00:00:01",
								"effective_to": effective,
							},
							"workers": {
								"reference_id": "WID",
								"workers_list": [external_id]
							}
						};
						var oViewModel = that.getModel("detailView");
						//oViewModel.setProperty("/busy", true);
						var datajson = JSON.stringify(data);
						//var url = "/CPI-WD2PD/workers_sync/ondemand";
						var url = "/CPI-WD2PD_Dest/md/workers_sync/ondemand";
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
									//	oViewModel.setProperty("/busy", false);
									if (textStatus == "success") {
										var sPath4 = sPath + "/action";
										itemsModel.setProperty(sPath4, "");
										itemsModel.refresh();
										var items = itemsModel.getData().integ_items;
										that.reprocesses = [];
										for(var i = 0; i < items.length; i++){
											if(items[i].action == "X"){
												that.reprocesses.push(items[i].worker.external_id);
											}
										}
										var texto = "Worker " + worker + " reprocessed.";
										sap.m.MessageToast.show(texto);
									}
								})
								.fail(function (jqXHR, textStatus, errorThrown) {
									var d = jqXHR;
									var e = textStatus;
									var f = errorThrown;
									//	oViewModel.setProperty("/busy", false);
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
		},

		onActionRepro: function (oEvent) {
			//	var sPath = oEvent.getSource().getParent().getBindingContext("items").getPath();
			var itemsModel = this.getView().getModel("items");
			//	sPath = sPath + "/worker/employee_number";
			//	var worker = itemsModel.getProperty(sPath);
			var text = "Are you sure you want to reprocess Workers in this Integration Process?";
			//	text = text + worker + "?";
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
						var now = new Date();
						var utc_now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
							now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
						var effective = JSON.parse(JSON.stringify(utc_now));
						effective = effective.slice(0, -5);
						var data = {
							"test_mode": "False",
							"reprocess": "True",
							"transaction_log": {
								"time_zone": "UTC",
								"effective_from": "1900-01-01T00:00:01",
								"effective_to": effective
							},
							"workers": {
								"reference_id": "WID",
								"workers_list": that.reprocesses
							}
						};
						var oViewModel = that.getModel("detailView");
						//	oViewModel.setProperty("/busy", true);
						var datajson = JSON.stringify(data);
						//var url = "/CPI-WD2PD/workers_sync/ondemand";
						var url = "/CPI-WD2PD_Dest/md/workers_sync/ondemand";
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
							var cusscope = that.getOwnerComponent().settings.find(setting => setting.code === "Customer-Scope");;
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
									//			oViewModel.setProperty("/busy", false);
									if (textStatus == "success") {
										var dataItems = itemsModel.getData();
										var items = dataItems.integ_items;
										that.reprocesses = [];
										for(var i = 0; i < items.length; i++){
											items[i].action = "";
										}
										dataItems.integ_items = items;
										itemsModel.setData(dataItems);
										itemsModel.refresh();
										that.getView().byId("reproc").setVisible(false);
										var texto = "All Workers reprocessed.";
										sap.m.MessageToast.show(texto);
									}
								})
								.fail(function (jqXHR, textStatus, errorThrown) {
									var d = jqXHR;
									var e = textStatus;
									var f = errorThrown;
									//			oViewModel.setProperty("/busy", false);
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
						data.push(itemCust);
					});

				} else {
					item.Name = entry[0].toString().replaceAll("_", " ");
					item.Value = entry[1];
					data.push(item);
				}
			});
			dataModel.setData(data);

			if (!this.oDataDialog) {
				this.oDataDialog = new sap.m.Dialog({
					title: "Data Details",
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

				// to get access to the controller's model
				this.getView().addDependent(this.oDataDialog);
			}
			this.oDataDialog.open();
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
					name: "shapein.MonitoringWorkers.view.ViewSettingsDialogDetail",
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

		searchFilters: function () {
			var aFilterItems = [],
				aFilters = [],
				aCaptions = [];
			if (this.byId("viewSettingsDialogDetail")) {
				aFilterItems = this.byId("viewSettingsDialogDetail").getFilterItems();
				//	var sortItem = this.byId(this.byId("viewSettingsDialogDetail").getSelectedSortItem());
				var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
				var workerfrom = vLayout.getContent()[1].getValue();
				var workerto = vLayout.getContent()[3].getValue();
				this.fromWorkerPreviousValue = workerfrom;
				this.toWorkerPreviousValue = workerto;
				if (workerfrom !== "" && workerto == "") {
					aFilters.push(new Filter([
						new Filter("pernr", FilterOperator.GE, workerfrom)
					], true));
				} else if (workerfrom == "" && workerto !== "") {
					aFilters.push(new Filter([
						new Filter("pernr", FilterOperator.LE, workerto)
					], true));
				} else if (workerfrom !== "" && workerto !== "") {
					aFilters.push(new Filter([
						new Filter("pernr", FilterOperator.GE, workerfrom),
						new Filter("pernr", FilterOperator.LE, workerto)
					], true));
				}
				var vLayout2 = this.byId("viewSettingsDialogDetail").getFilterItems()[1].getCustomControl();
				var lastfrom = vLayout2.getContent()[1].getValue();
				var lastto = vLayout2.getContent()[3].getValue();
				this.fromLastPreviousValue = lastfrom;
				this.toLastPreviousValue = lastto;
				if (lastfrom !== "" && lastto == "") {
					aFilters.push(new Filter([
						new Filter("lastname", FilterOperator.GE, lastfrom)
					], true));
				} else if (lastfrom == "" && lastto !== "") {
					aFilters.push(new Filter([
						new Filter("lastname", FilterOperator.LE, lastto)
					], true));
				} else if (lastfrom !== "" && lastto !== "") {
					aFilters.push(new Filter([
						new Filter("lastname", FilterOperator.BT, lastfrom, lastto)
						//	new Filter("lastname", FilterOperator.LE, lastto)
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
				aFilters.push(new Filter([
					new Filter("name", FilterOperator.Contains, query),
					new Filter("pernr", FilterOperator.Contains, query)
				], false));
			}

			//aFilters.push(new Filter("pck_code", FilterOperator.EQ, "SYN_WORKER"));
			this._oTableFilterState.aFilter = aFilters;
			//	this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
			if (this.byId("viewSettingsDialogDetail")) {
				this._applySortGroup(sortItem, sortDesc);
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

		changeWorkers: function (oEvent) {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[0];
			var workerfrom = vLayout.getContent()[1].getValue();
			var workerto = vLayout.getContent()[3].getValue();

			// Set the custom filter's count and selected properties
			// if the value has changed
			if (workerfrom == "" && workerto == "") {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			} else {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			}
		},

		changeLast: function (oEvent) {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[1].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[1];
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
			var binding = this.getView().byId("lineItemsList").getBinding("items");
			//binding.iLength = binding.iLastLength;
			binding.sort(aSorters);
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
		},

		handleCancel: function () {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[0],
				fromWorker = vLayout.getContent()[1],
				toWorker = vLayout.getContent()[3];

			fromWorker.setValue(this.fromWorkerPreviousValue);
			toWorker.setValue(this.toWorkerPreviousValue);

			if (this.fromWorkerPreviousValue !== "" || this.toWorkerPreviousValue !== "") {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			} else {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			}

			var vLayout2 = this.byId("viewSettingsDialogDetail").getFilterItems()[1].getCustomControl();
			var oCustomFilter2 = this.byId("viewSettingsDialogDetail").getFilterItems()[1],
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
		handleResetFilters: function () {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[0],
				fromWorker = vLayout.getContent()[1],
				toWorker = vLayout.getContent()[3];
			fromWorker.setValue("");
			toWorker.setValue("");
			oCustomFilter.setFilterCount(0);
			oCustomFilter.setSelected(false);

			var vLayout2 = this.byId("viewSettingsDialogDetail").getFilterItems()[1].getCustomControl();
			var oCustomFilter2 = this.byId("viewSettingsDialogDetail").getFilterItems()[1],
				fromLast = vLayout2.getContent()[1],
				toLast = vLayout2.getContent()[3];
			fromLast.setValue("");
			toLast.setValue("");
			oCustomFilter2.setFilterCount(0);
			oCustomFilter2.setSelected(false);
		}
	});

});
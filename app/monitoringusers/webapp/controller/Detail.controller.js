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

	var URLHelper = mobileLibrary.URLHelper;
	var oMessagePopover;

	return BaseController.extend("shapein.UsersMonitoring.controller.Detail", {

		formatter: formatter,
		fromUserPreviousValue: "",
		toUserPreviousValue: "",
		fromLastPreviousValue: "",
		toLastPreviousValue: "",
		reprocesses: [],

		/* Al instanciar el objeto */
		onInit: function () {
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
				activeTitlePress: function () {}
			});
			this.getView().addDependent(oMessagePopover);
		},

		/* Función al ejecutar el mensaje de error en el listado de detalles */
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
			var sErrorDescription2 = this.b64DecodeUnicode(itemsModel.getProperty(sPath4));
			var tit1 = this.getResourceBundle().getText("Timestamp");
			var tit2 = this.getResourceBundle().getText("ErrorCode");
			var tit3 = this.getResourceBundle().getText("ErrorText1");
			var tit4 = this.getResourceBundle().getText("ErrorMess");
			var data = [{
				type: 'Information',
				title: tit1,
				description: "",
				subtitle: time
			}, {
				type: 'Error',
				title: tit2,
				subtitle: error_code,
				description: ''
			}, {
				type: 'Error',
				title: tit3,
				description: sErrorDescription
			}, {
				type: 'Error',
				title: tit4,
				description: sErrorDescription2
			}];
			var messageModel = this.getView().getModel("message");
			messageModel.setData(data);
			oMessagePopover.toggle(oEvent.getSource());
		},

		/* Función al finalizar la carga del listado de items */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* Evento al matchear el objeto seleccionado */
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

		/* Bindeamos la vista al objeto seleccionado con sus detalles */
		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", true);
			var that = this;
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

		/* Al cambiar el detalle del objeto a mostrar */
		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
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
			oViewModel.refresh();
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "integ_items/error,integ_items/user"
				},
				success: function (oData, oResponse) {
					var results = oData.integ_items.results;
					delete oData.__metadata;
					var scount = 0;
					var ecount = 0;
					that.reprocesses = [];
					results.forEach(function (entry) {
						delete entry.__metadata;
						var user = entry.user;
						if (user) {
							entry.pernr = user.employee_number;
							var firstname = user.firstname;
							var lastname = user.lastname;
							entry.firstname = firstname;
							entry.lastname = lastname;
							entry.name = lastname + ", " + firstname;
							entry.email = entry.user.email;
						}
						if (entry.status_code == "S") {
							scount++;
						} else {
							ecount++;
						}
						if (user) {
							if (entry.user.last_item_id == entry.item_id) {
								entry.action = "X";
							} else {
								entry.action = "";
							}
							if (entry.action == "X" && entry.status_code == "E") {
								that.reprocesses.push(entry.original_external_id);
							}
						} else {
							entry.action = "";
						}
					});
					oData.integ_items = null;
					oData.integ_items = results;
					itemsModel.setData(oData);
					oViewModel.setProperty("/busy", false);
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

		/* Para decodificar de base64 */
		b64DecodeUnicode: function (str) {
			if (str == null || !str || str == undefined) {
				return "";
			} else {
				return decodeURIComponent(atob(str).split('').map(function (c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				}).join(''));
			}
		},

		/* Al ejecutar el reprocesamiento de un único elemento */
		onAction: function (oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("items").getPath();
			var itemsModel = this.getView().getModel("items");
			var sPath2 = sPath + "/original_external_id";
			var sPath3 = sPath + "/user/email";
			var mail = itemsModel.getProperty(sPath3);
			var user = itemsModel.getProperty(sPath2);
			var text = this.getView().getModel("i18n").getResourceBundle().getText("repUser");
			text = " " + text + worker + "?";
			var that = this;
			var tit = this.getResourceBundle().getText("Confirmation");
			var yes = this.getResourceBundle().getText("Yes");
			var no = this.getResourceBundle().getText("No");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						var now = new Date();
						var utc_now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
							now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
						var effective = JSON.parse(JSON.stringify(utc_now));
						effective = effective.slice(0, -5);
						var data = {
							"test_mode": "False",
							"transaction_log": {
								"time_zone": "UTC",
								"effective_from": "1900-01-01T00:00:01",
								"effective_to": effective,
							},
							"workers": {
								"reference_id": "WID",
								"workers_list": [user]
							}
						};
						var oViewModel = that.getModel("detailView");
						var datajson = JSON.stringify(data);
						var url = "/CPI-WD2PD_Dest/md/users_sync/ondemand";
						if (that.getOwnerComponent().settings) {
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
									if (textStatus == "success") {
										var sPath4 = sPath + "/action";
										itemsModel.setProperty(sPath4, "");
										itemsModel.refresh();
										var items = itemsModel.getData().integ_items;
										that.reprocesses = [];
										for (var i = 0; i < items.length; i++) {
											if (items[i].action == "X") {
												that.reprocesses.push(items[i].original_external_id);
											}
										}
										var text1 = that.getView().getModel("i18n").getResourceBundle().getText("Users");
										var text2 = that.getView().getModel("i18n").getResourceBundle().getText("Reprocessed");
										var texto = text1 + " " + org + " " + text2;
										sap.m.MessageToast.show(texto);
									}
								})
								.fail(function (jqXHR, textStatus, errorThrown) {
									var d = jqXHR;
									var e = textStatus;
									var f = errorThrown;
								});
						}
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al presionar la visualización del error en la cabecera */
		pressError: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var itemsModel = this.getView().getModel();
			var sPath2 = sPath + "/error/text";
			var sPath3 = sPath + "/error_message";
			var text = itemsModel.getProperty(sPath2);
			var text2 = this.b64DecodeUnicode(itemsModel.getProperty(sPath3));
			var text3 = text2.replace("{", "(");
			var text4 = text3.replace("}", ")");
			var tit = this.getResourceBundle().getText("ErrorMess");
			var lab = this.getResourceBundle().getText("TechError");
			var clo = this.getResourceBundle().getText("Close");
			var dialog = new sap.m.Dialog({
				contentWidth: "500px",
				contentHeight: "auto",
				title: tit,
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
							text: lab
						}),
						new sap.m.Text({
							wrapping: true,
							text: text4
						})
					]
				}),
				endButton: new sap.m.Button({
					text: clo ,
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

		/* Al ejecutar el reprocesamiento de todos los elementos */
		onActionRepro: function (oEvent) {
			var itemsModel = this.getView().getModel("items");
			var text = this.getResourceBundle().getText("reproAll");
			var that = this;
			var tit = this.getResourceBundle().getText("Confirmation");
			var yes = this.getResourceBundle().getText("Yes");
			var no = this.getResourceBundle().getText("No");
			var dialog = new sap.m.Dialog({
				title: tit,
				type: 'Message',
				content: new sap.m.Text({
					text: text
				}),
				beginButton: new sap.m.Button({
					text: yes,
					press: function () {
						var now = new Date();
						var utc_now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
							now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
						var effective = JSON.parse(JSON.stringify(utc_now));
						effective = effective.slice(0, -5);
						var data = {
							"test_mode": "False",
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
						var datajson = JSON.stringify(data);
						var url = "/CPI-WD2PD_Dest/md/users_sync/ondemand";
						if (that.getOwnerComponent().settings) {
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
									if (textStatus == "success") {
										var dataItems = itemsModel.getData();
										var items = dataItems.integ_items;
										that.reprocesses = [];
										for (var i = 0; i < items.length; i++) {
											items[i].action = "";
										}
										dataItems.integ_items = items;
										itemsModel.setData(dataItems);
										itemsModel.refresh();
										that.getView().byId("reproc").setVisible(false);
										var texto = "All Users reprocessed.";
										sap.m.MessageToast.show(texto);
									}
								})
								.fail(function (jqXHR, textStatus, errorThrown) {
									var d = jqXHR;
									var e = textStatus;
									var f = errorThrown;
								});
						}
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: no,
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

		/* Al pinchar para visualizar los datos de la request de un elemento */
		onDataDialogPress: function (oEvent) {
			var that = this;
			var sPath = oEvent.getSource().getParent().getBindingContext("items").getPath();
			var itemsModel = this.getView().getModel("items");
			sPath = sPath + "/request";
			var request = itemsModel.getProperty(sPath);
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
					name: "shapein.UsersMonitoring.view.DataDialog",
					controller: this
				}).then(function (oDialog) {
					this.oDataDialog = oDialog;
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.oDataDialog.open();
			}
		},

		/*Al pulsar el botón de Ok del dialog */
		pressOkButton: function (oEvent) {
			this.oDataDialog.close();
		},

		/* Obtener un determinado grupo */
		getGroup: function (oContext) {
			var sKey = oContext.getProperty("key");
			return {
				key: sKey
			};
		},

		/* Al crear una cabecera de agrupación */
		getGroupHeader: function (oGroup) {
			return new sap.m.GroupHeaderListItem({
				title: oGroup.key,
				upperCase: false
			});
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
					name: "shapein.UsersMonitoring.view.ViewSettingsDialogDetail",
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

		/* Al ejecutar los filtrados */
		searchFilters: function () {
			var aFilterItems = [],
				aFilters = [],
				aCaptions = [];
			if (this.byId("viewSettingsDialogDetail")) {
				aFilterItems = this.byId("viewSettingsDialogDetail").getFilterItems();
				var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
				var userfrom = vLayout.getContent()[1].getValue();
				var userto = vLayout.getContent()[3].getValue();
				this.fromUserPreviousValue = userfrom;
				this.toUserPreviousValue = userto;
				if (userfrom !== "" && userto == "") {
					aFilters.push(new Filter([
						new Filter("pernr", FilterOperator.GE, userfrom)
					], true));
				} else if (userfrom == "" && userto !== "") {
					aFilters.push(new Filter([
						new Filter("pernr", FilterOperator.LE, userto)
					], true));
				} else if (userfrom !== "" && userto !== "") {
					aFilters.push(new Filter([
						new Filter("pernr", FilterOperator.GE, userfrom),
						new Filter("pernr", FilterOperator.LE, userto)
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
			this._oTableFilterState.aFilter = aFilters;
			this._applyFilterSearch();
			if (this.byId("viewSettingsDialogDetail")) {
				this._applySortGroup(sortItem, sortDesc);
			}
		},

		/* Aplicar los filtros */
		_applyFilterSearch: function () {
			var aFilters = this._oTableFilterState.aSearch.concat(this._oTableFilterState.aFilter);
			this.getView().byId("lineItemsList").getBinding("items").filter(aFilters, "Application");
		},

		/* Al cambiar filtro users */
		changeUsers: function (oEvent) {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[0];
			var userfrom = vLayout.getContent()[1].getValue();
			var userto = vLayout.getContent()[3].getValue();
			if (userfrom == "" && userto == "") {
				oCustomFilter.setFilterCount(0);
				oCustomFilter.setSelected(false);
			} else {
				oCustomFilter.setFilterCount(1);
				oCustomFilter.setSelected(true);
			}
		},

		/* Al cambiar filtro Last Name */
		changeLast: function (oEvent) {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[1].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[1];
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

		/* Los metadatas son cargados inicializa */
		_onMetadataLoaded: function () {
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);
			oLineItemTable.attachEventOnce("updateFinished", function () {
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});
			oViewModel.setProperty("/busy", true);
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/* Al cerrar la página de detalles */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/* Al cambiar entre modo full screen y no */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		},

		/* Al cancelar el filtrado */
		handleCancel: function () {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[0],
				fromUser = vLayout.getContent()[1],
				toUser = vLayout.getContent()[3];
			fromUser.setValue(this.fromUserPreviousValue);
			toUser.setValue(this.toUserPreviousValue);
			if (this.fromUserPreviousValue !== "" || this.toUserPreviousValue !== "") {
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

		/* Al resetear los filtros */
		handleResetFilters: function () {
			var vLayout = this.byId("viewSettingsDialogDetail").getFilterItems()[0].getCustomControl();
			var oCustomFilter = this.byId("viewSettingsDialogDetail").getFilterItems()[0],
				fromUser = vLayout.getContent()[1],
				toUser = vLayout.getContent()[3];
			fromUser.setValue("");
			toUser.setValue("");
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
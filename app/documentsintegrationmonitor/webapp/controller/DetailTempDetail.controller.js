sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller",
    "./BaseController",
    "../model/formatter",
    "sap/m/library",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/model/Sorter",
    "sap/ui/Device",
], function (JSONModel, Controller, BaseController, formatter, mobileLibrary, Filter, FilterOperator, Fragment, Sorter, Device) {
    "use strict";

    var URLHelper = mobileLibrary.URLHelper;
    var oMessagePopover;

    return BaseController.extend("shapein.DocumentsIntegrationMonitor.controller.DetailTempDetail", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */


        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page is busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data

            var oParameters = new JSONModel({
                template_uuid: "",
                employee_uuid: "",
                employee_number: "",
                template_id: "",
                doc_title: "",
                doc_type_id: "",
                language: "",
                template_version: ""
            });
            this.getView().setModel(oParameters, "parameters");

            var oViewModel = new JSONModel({
                busy: false,
                delay: 0,
                lineItemListTitle: this.getResourceBundle().getText("detailDetailLineItemTableHeading")
            });

            this.getRouter().getRoute("detailTempDetail").attachPatternMatched(this._onObjectMatched, this);

            this.setModel(oViewModel, "detailDetailView");
            this.setModel(new JSONModel(), "data");
            this.setModel(new JSONModel(), "message");

            this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

            this._oTableFilterState = {
                aFilter: [],
                aSearch: []
            };    
            //this.getOwnerComponent().getRouter().getRoute("detailEmplDetail").attachPatternMatched(this._onObjectMatched, this);
            //this.getOwnerComponent().getRouter().getRoute("detailEmplDetail").attachPatternMatched(this._onPatternMatch, this);
            
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
            var oViewModel = this.getModel("detailDetailView");

            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },


		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
        onListUpdateFinished: function (oEvent) {
            var sTitle,
                iTotalItems = oEvent.getParameter("total"),
                oViewModel = this.getModel("detailDetailView");

            // only update the counter if the length is final
            if (this.byId("lineItemsListTemp").getBinding("itemsTemp").isLengthFinal()) {
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
            var oEmployee = oEvent.getParameter("arguments").employee;
            var oTemplate = oEvent.getParameter("arguments").template;            

            var localModel = this.getModel("parameters");
            localModel.oData.employee_uuid = oEmployee;
            localModel.oData.template_uuid = oTemplate;
            this.setModel(localModel, "parameters");

            this.getModel("appView").setProperty("/layout", "ThreeColumnsEndExpanded");
            this.getModel().metadataLoaded().then(function () {
                /*
                var sObjectPath = this.getModel().createKey("Di_Employee", {
                    uuid: sObjectId
                });
                */
                var sObjectPath = "Di_Generation_Processes_Doc";
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
            var oViewModel = this.getModel("detailDetailView");

            // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
            //oViewModel.setProperty("/busy", false);
            oViewModel.setProperty("/busy", true);

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
            var sPath = oElementBinding.getPath(),
                oViewModel = this.getModel("detailDetailView");
            var oModel = this.getOwnerComponent().getModel();
            var itemsModel = this.getView().getModel("itemsTemp");

            var that = this;
            var oModelParam = this.getView().getModel("parameters");

            var localModel = this.getView().getModel("parameters");
            var oLocalFilter = new Filter({
                filters: [
                    new Filter("generation_proc/template_uuid", FilterOperator.EQ, localModel.oData.template_uuid),
                    new Filter("employee_external_id", FilterOperator.EQ, localModel.oData.employee_uuid)
                ],
                and: true
            });

            oViewModel.refresh();
            oModel.read(sPath, {
                filters: [oLocalFilter],
                urlParameters: {
                    "$expand": "generation_proc,worker,doc_sign"
                },
                success: function (oData, oResponse) {
                    //var results = oData.worker.results;
                    var results = oData.results;
                    var scount = 0;
                    var ecount = 0;
                    that.reprocesses = [];
                    oViewModel.setProperty("/busy", false);

                    oData.docs = null;
                    oData.docs = [];

                    results.forEach(function (entry) {
                        if (entry.status == "S") {
                            scount++;
                        } else {
                            ecount++;
                        }
                    })

                    var auxParam = oModelParam.getData();
                    auxParam.template_id = oData.results[0].generation_proc.template_id;
                    auxParam.doc_type_id = oData.results[0].generation_proc.doc_type_id;
                    auxParam.template_version = oData.results[0].generation_proc.template_version;
                    oModelParam.setData(auxParam);

                    oData.docs = results;
                    itemsModel.setData(oData);
                    oViewModel.setProperty("/busy", false);
                    //that.getView().byId("detailPage").setBusy(false);
                    if (that.reprocesses.length > 0) {
                        that.getView().byId("reproc").setVisible(true);
                    } else {
                        that.getView().byId("reproc").setVisible(false);
                        //that.getView().byId("reproc").setVisible(true);
                    }
                    that.getView().byId("tabfSuc").setCount(scount);
                    that.getView().byId("tabfErr").setCount(ecount);
                    that.getView().byId("tabfAll").setCount(scount + ecount);

                },
                error: function (oError) {
                    oViewModel.setProperty("/busy", false);
                }
            });

            this.getOwnerComponent().oListSelector.selectAListItem(sPath);
        },

        _onMetadataLoaded: function () {
            // Store original busy indicator delay for the detail view
            var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
                oViewModel = this.getModel("detailDetailView"),
                oLineItemTable = this.byId("lineItemsListTemp"),
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
            /*
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
            // No item should be selected on master after detail page is closed
            this.getOwnerComponent().oListSelector.clearMasterListSelection();
            this.getRouter().navTo("master");
            */
            var bReplace = !Device.system.phone;
            // set the layout property of FCL control to show two columns
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getRouter().navTo("objecttemp", {
                objectId: oItem.getBindingContext().getProperty("uuid")
            }, bReplace);
        },

		/**
		 * Toggle between full and non full screen mode.
		 */
        toggleFullScreen: function () {
            var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/endColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen", !bFullScreen);
            if (!bFullScreen) {
                // store current layout and go full screen
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "EndColumnFullScreen");
            } else {
                // reset to previous layout
                this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
            }
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
            var sPath2 = sPath + "/message/text";
            var sPath3 = sPath + "/error_message";
            var text = itemsModel.getProperty(sPath2);
            var text2 = this.b64DecodeUnicode(itemsModel.getProperty(sPath3));
            var text3 = text2.replace("{", "(");
            var text4 = text3.replace("}", ")");

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

        onActionRepro: function (oEvent) {
            var text = this.getView().getModel("i18n").getResourceBundle().getText("viewMessage9");
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
                        var oViewModel = that.getModel("detailDetailView");
                        //	oViewModel.setProperty("/busy", true);
                        var datajson = JSON.stringify(data);
                        var url = "/CPI-WD2PD_Dest/di/templates/template/reprocessing ";

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
                                that.getView().byId("reproc").setVisible(false);
                                var texto = this.getView().getModel("i18n").getResourceBundle().getText("viewMessage12");
                                sap.m.MessageToast.show(texto);
                            }
                        })
                            .fail(function (jqXHR, textStatus, errorThrown) {
                                var d = jqXHR;
                                var e = textStatus;
                                var f = errorThrown;
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

        onActionRepro2: function (oEvent) {
            var itemsModel = this.getView().getModel("itemsTemp");
            var sPath3 = "/template_uuid";
            var template_uuid = itemsModel.getProperty(sPath3);

            var data_reproc = {
                "template_uuid": template_uuid,
                "employees": []
            };

            var results = itemsModel.getProperty("/docs");

            var text = this.getView().getModel("i18n").getResourceBundle().getText("viewMessage9");
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

                        results.forEach(function (entry) {

                            var employee_number = entry.employee_number;
                            var tlog_timezone = entry.tlog_timezone;
                            var tlog_updated_from = entry.tlog_updated_from;
                            var tlog_retro_effective_from = entry.tlog_retro_effective_from;
                            var tlog_future_updated_from = entry.tlog_future_updated_from;

                            var now = new Date(tlog_updated_from);
                            tlog_updated_from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                                now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
                            tlog_updated_from = JSON.parse(JSON.stringify(tlog_updated_from));

                            var now = new Date(tlog_retro_effective_from);
                            tlog_retro_effective_from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                                now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
                            tlog_retro_effective_from = JSON.parse(JSON.stringify(tlog_retro_effective_from));

                            var now = new Date(tlog_future_updated_from);
                            tlog_future_updated_from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                                now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
                            tlog_future_updated_from = JSON.parse(JSON.stringify(tlog_future_updated_from));

                            var employee = {
                                "employee_number": employee_number,
                                "tlog_timezone": tlog_timezone,
                                "tlog_updated_from": tlog_updated_from,
                                "tlog_retro_effective_from": tlog_retro_effective_from,
                                "tlog_future_updated_from": tlog_future_updated_from
                            };

                            data_reproc.employees.push(employee);
                        });




                        var oViewModel = that.getModel("detailDetailView");
                        var datajson = JSON.stringify(data_reproc);
                        var url = "/CPI-WD2PD_Dest/di/templates/template/reprocessing";
                        var settings = {
                            "url": url,
                            "method": "POST",
                            "headers": {
                                "Content-Type": "application/json",
                                "Accept": "application/json"
                            },
                            "data": datajson
                        };
                        $.ajax(settings).done(function (data_reproc, textStatus, jqXHR) {
                            //var a = data_reproc;
                            //var b = textStatus;
                            //var c = jqXHR;
                            //			oViewModel.setProperty("/busy", false);
                            if (textStatus == "success") {
                                that.getView().byId("reproc").setVisible(false);
                                var texto = this.getView().getModel("i18n").getResourceBundle().getText("viewMessage13");
                                sap.m.MessageToast.show(texto);

                                var oItems = that.getView().byId("lineItemsListTemp").getItems();
                                oItems.forEach(function (entry) {
                                    entry.getCells()[6].setEnabled(false);
                                });
                            }
                        })
                            .fail(function (jqXHR, textStatus, errorThrown) {
                                var d = jqXHR;
                                var e = textStatus;
                                var f = errorThrown;
                                //			oViewModel.setProperty("/busy", false);

                                sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage11"));
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

        onAction: function (oEvent) {

            var sPath = oEvent.getSource().getParent().getBindingContext("itemsTemp").getPath();
            var itemsModel = this.getView().getModel("itemsTemp");
            var sPath2 = sPath + "/employee_number";
            var employee_number = itemsModel.getProperty(sPath2);
            var sPath3 = "/template_uuid";
            var template_uuid = itemsModel.getProperty(sPath3);

            var sPath4 = sPath + "/tlog_timezone";
            var tlog_timezone = itemsModel.getProperty(sPath4);
            var sPath5 = sPath + "/tlog_updated_from";
            var tlog_updated_from = itemsModel.getProperty(sPath5);
            var sPath6 = sPath + "/tlog_retro_effective_from";
            var tlog_retro_effective_from = itemsModel.getProperty(sPath6);
            var sPath7 = sPath + "/tlog_future_updated_from";
            var tlog_future_updated_from = itemsModel.getProperty(sPath7);

            var that = this;

            var text = this.getView().getModel("i18n").getResourceBundle().getText("viewMessage10");
            text = text + employee_number + "?";
            var dialog = new sap.m.Dialog({
                title: 'Confirmation',
                type: 'Message',
                content: new sap.m.Text({
                    text: text
                }),
                beginButton: new sap.m.Button({
                    text: 'Yes',
                    press: function () {
                        var now = new Date(tlog_updated_from);
                        tlog_updated_from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
                        tlog_updated_from = JSON.parse(JSON.stringify(tlog_updated_from));

                        var now = new Date(tlog_retro_effective_from);
                        tlog_retro_effective_from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
                        tlog_retro_effective_from = JSON.parse(JSON.stringify(tlog_retro_effective_from));

                        var now = new Date(tlog_future_updated_from);
                        tlog_future_updated_from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
                        tlog_future_updated_from = JSON.parse(JSON.stringify(tlog_future_updated_from));

                        var data_reproc = {

                            "template_uuid": template_uuid,
                            "employees": [
                                {
                                    "employee_number": employee_number,
                                    "tlog_timezone": tlog_timezone,
                                    "tlog_updated_from": tlog_updated_from,
                                    "tlog_retro_effective_from": tlog_retro_effective_from,
                                    "tlog_future_updated_from": tlog_future_updated_from
                                }
                            ]
                        };

                        var oViewModel = that.getModel("detailDetailView");
                        var datajson = JSON.stringify(data_reproc);
                        var url = "/CPI-WD2PD_Dest/di/templates/template/reprocessing";
                        var settings = {
                            "url": url,
                            "method": "POST",
                            "headers": {
                                "Content-Type": "application/json",
                                "Accept": "application/json"
                            },
                            "data": datajson
                        };
                        $.ajax(settings).done(function (data_reproc, textStatus, jqXHR) {
                            var a = data_reproc;
                            var b = textStatus;
                            var c = jqXHR;
                            if (textStatus == "success") {
                                var sPath4 = sPath + "/action";
                                itemsModel.setProperty(sPath4, "");
                                itemsModel.refresh();
                                var texto = "Employee " + employee_number + " reprocessed.";
                                sap.m.MessageToast.show(texto);

                                that.getView().byId("reproc_ind").setEnable(false);
                            }
                        })
                            .fail(function (jqXHR, textStatus, errorThrown) {
                                var d = jqXHR;
                                var e = textStatus;
                                var f = errorThrown;

                                sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage11"));
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

        handleMessagePopoverPress: function (oEvent) {
            var sPath = oEvent.getSource().getParent().getBindingContext("itemsTemp").getPath();
            var itemsModel = this.getView().getModel("itemsTemp");
            var sPath1 = "/timestamp_start";
            var sPath2 = sPath + "/error_code";
            var sPath3 = sPath + "/message/text";
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
        searchFilters: function () {
            var aFilterItems = [],
                aFilters = [],
                aCaptions = [];
            if (this.byId("viewSettingsDialogDetailDetTemp")) {
                aFilterItems = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems();
                //	var sortItem = this.byId(this.byId("viewSettingsDialogDetailDetTemp").getSelectedSortItem());
                var vLayout = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems()[0].getCustomControl();
                var workerfrom = vLayout.getContent()[1].getValue();
                var workerto = vLayout.getContent()[3].getValue();
                this.fromWorkerPreviousValue = workerfrom;
                this.toWorkerPreviousValue = workerto;
                if (workerfrom !== "" && workerto == "") {
                    aFilters.push(new Filter([
                        new Filter("employee_number", FilterOperator.GE, workerfrom)
                    ], true));
                } else if (workerfrom == "" && workerto !== "") {
                    aFilters.push(new Filter([
                        new Filter("employee_number", FilterOperator.LE, workerto)
                    ], true));
                } else if (workerfrom !== "" && workerto !== "") {
                    aFilters.push(new Filter([
                        new Filter("employee_number", FilterOperator.GE, workerfrom),
                        new Filter("employee_number", FilterOperator.LE, workerto)
                    ], true));
                }
                /*
                var vLayout2 = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems()[1].getCustomControl();
                var lastfrom = vLayout2.getContent()[1].getValue();
                var lastto = vLayout2.getContent()[3].getValue();
                this.fromLastPreviousValue = lastfrom;
                this.toLastPreviousValue = lastto;
                if (lastfrom !== "" && lastto == "") {
                    aFilters.push(new Filter([
                        new Filter("worker/lastname", FilterOperator.GE, lastfrom)
                    ], true));
                } else if (lastfrom == "" && lastto !== "") {
                    aFilters.push(new Filter([
                        new Filter("worker/lastname", FilterOperator.LE, lastto)
                    ], true));
                } else if (lastfrom !== "" && lastto !== "") {
                    aFilters.push(new Filter([
                        new Filter("worker/lastname", FilterOperator.BT, lastfrom, lastto)
                        //	new Filter("lastname", FilterOperator.LE, lastto)
                    ], true));
                }
                */
                var sortItems = this.byId("viewSettingsDialogDetailDetTemp").getSortItems();
                var sortItem;
                sortItems.forEach(function (oItem) {
                    if (oItem.getSelected()) {
                        sortItem = oItem;
                    }
                });
                var sortDesc = this.byId("viewSettingsDialogDetailDetTemp").getSortDescending();
            }

            var aFilters2 = [];
            aFilterItems.forEach(function (oItem) {
                if (oItem.getKey() == "status") {
                    oItem.getItems().forEach(function (oItem2){
                        if(oItem2.getSelected() == true){
                            aFilters2.push(new Filter(oItem.getKey(), FilterOperator.EQ, oItem2.getKey()));
                        }
                    })
                }
            });
            if (aFilters2.length > 0) {
                aFilters.push(new Filter(aFilters2, false));
            }
            
            var keySel = this.getView().byId("iconTab").getSelectedKey();
            if (keySel == "Suc") {
                aFilters.push(new Filter("status", FilterOperator.EQ, "S"));
            } else if (keySel == "Err") {
                aFilters.push(new Filter("status", FilterOperator.EQ, "E"));
            }

            var query = this.getView().byId("search").getValue();
            if (query !== "") {
                aFilters.push(new Filter([
                    new Filter("uuid", FilterOperator.Contains, query),
                    new Filter("worker/lastname", FilterOperator.Contains, query),
                    //new Filter("employee_number", FilterOperator.Contains, query)
                ], false));
            }

            //aFilters.push(new Filter("pck_code", FilterOperator.EQ, "SYN_WORKER"));
            this._oTableFilterState.aFilter = aFilters;
            //	this._updateFilterBar(aCaptions.join(", "));
            this._applyFilterSearch();
            if (this.byId("viewSettingsDialogDetailDetTemp")) {
                this._applySortGroup(sortItem, sortDesc);
            }

        },
        _applyFilterSearch: function () {
            var aFilters = this._oTableFilterState.aSearch.concat(this._oTableFilterState.aFilter);
            this.getView().byId("lineItemsListTemp").getBinding("items").filter(aFilters, "Application");

        },
        onShareInJamPress: function () {
            var oViewModel = this.getModel("detailDetailView"),
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

        onListUpdateFinished: function (oEvent) {
            var sTitle,
                iTotalItems = oEvent.getParameter("total"),
                oViewModel = this.getModel("detailDetailView");

            // only update the counter if the length is final
            if (this.byId("lineItemsListTemp").getBinding("itemsTemp").isLengthFinal()) {
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
            var oBinding = this.getView().byId("lineItemsListTemp").getBinding("itemsTemp"),
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
        handleCancel: function () {
            var vLayout = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems()[0].getCustomControl();
            var oCustomFilter = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems()[0],
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

            var vLayout2 = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems()[1].getCustomControl();
            var oCustomFilter2 = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems()[1],
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
            var vLayout = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems()[0].getCustomControl();
            var oCustomFilter = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems()[0],
                fromWorker = vLayout.getContent()[1],
                toWorker = vLayout.getContent()[3];
            fromWorker.setValue("");
            toWorker.setValue("");
            oCustomFilter.setFilterCount(0);
            oCustomFilter.setSelected(false);

            var vLayout2 = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems()[1].getCustomControl();
            var oCustomFilter2 = this.byId("viewSettingsDialogDetailDetTemp").getFilterItems()[1],
                fromLast = vLayout2.getContent()[1],
                toLast = vLayout2.getContent()[3];
            fromLast.setValue("");
            toLast.setValue("");
            oCustomFilter2.setFilterCount(0);
            oCustomFilter2.setSelected(false);
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
            if (!this.byId("viewSettingsDialogDetailDetTemp")) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "shapein.DocumentsIntegrationMonitor.view.ViewSettingsDialogDetailDetTemp",
                    controller: this
                }).then(function (oDialog) {
                    // connect dialog to the root view of this component (models, lifecycle)
                    this.getView().addDependent(oDialog);
                    oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                    oDialog.open(sDialogTab);
                }.bind(this));
            } else {
                this.byId("viewSettingsDialogDetailDetTemp").open(sDialogTab);
            }
        },
        _applySortGroup: function (item, desc) {
            var sPath,
                bDescending,
                aSorters = [];
            sPath = item.getKey();

            bDescending = desc;
            aSorters.push(new Sorter(sPath, bDescending));
            var binding = this.getView().byId("lineItemsListTemp").getBinding("itemsTemp");
            //binding.iLength = binding.iLastLength;
            binding.sort(aSorters);
        },
        _applySortGroup1: function (oEvent) {
            var mParams = oEvent.getParameters(),
                sPath,
                bDescending,
                aSorters = [];
            sPath = mParams.sortItem.getKey();
            bDescending = mParams.sortDescending;
            aSorters.push(new Sorter(sPath, bDescending));
            var binding = this.getView().byId("lineItemsListTemp").getBinding("itemsTemp");
            binding.sort(aSorters);
        },
        onSelectionChangeTempDet: function (oEvent) {
            var oList = oEvent.getSource(),
                bSelected = oEvent.getParameter("selected");

            // skip navigation when deselecting an item in multi selection mode
            if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
                // get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
                this._showDetailTempDet(oEvent.getParameter("listItem") || oEvent.getSource());
            }
        },
        _showDetailTempDet: function (oItem) {
            var bReplace = !Device.system.phone;
            // set the layout property of FCL control to show two columns
            //this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getRouter().navTo("detailTempDetail", {
                objectId: oItem.getBindingContext().getProperty("uuid")
            }, bReplace);
        },

        handleAboutPress: function () {
            var oNextUIState;
            this.oOwnerComponent.getHelper().then(function (oHelper) {
                oNextUIState = oHelper.getNextUIState(3);
                this.oRouter.navTo("page2", { layout: oNextUIState.layout });
            }.bind(this));
        },

        _onPatternMatch: function (oEvent) {
            var sObjectId = oEvent.getParameter("arguments").objectId;
            this._supplier = oEvent.getParameter("arguments").supplier || this._supplier || "0";
            this._product = oEvent.getParameter("arguments").product || this._product || "0";

            this.getView().bindElement({
                path: "/ProductCollectionStats/Filters/1/values/" + this._supplier,
                model: "products"
            });
        },

        handleFullScreen: function () {
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/fullScreen");
            this.oRouter.navTo("detailDetail", { layout: sNextLayout, product: this._product, supplier: this._supplier });
        },

        handleExitFullScreen: function () {
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/exitFullScreen");
            this.oRouter.navTo("detailDetail", { layout: sNextLayout, product: this._product, supplier: this._supplier });
        },

        handleClose: function () {
            var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/closeColumn");
            this.oRouter.navTo("detail", { layout: sNextLayout, product: this._product });
        },

        onExit: function () {
            this.oRouter.getRoute("detailDetail").detachPatternMatched(this._onPatternMatch, this);
        }
    });
});
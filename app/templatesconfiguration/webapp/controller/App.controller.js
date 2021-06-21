sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("shapein.TemplatesConfiguration.controller.App", {

        onInit: function () {
            var oViewModel,
                fnSetAppNotBusy,
                iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

            oViewModel = new JSONModel({
                busy: true,
                delay: 0
            });
            this.setModel(oViewModel, "appView");

            fnSetAppNotBusy = function () {
                //	oViewModel.setProperty("/busy", false);
                //	oViewModel.setProperty("/delay", iOriginalBusyDelay);
            };

            // disable busy indication when the metadata is loaded and in case of errors
            this.getOwnerComponent().getModel().metadataLoaded().
                then(fnSetAppNotBusy);
            this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);
            //this.getSubscriptionSettings();
            // apply content density mode to root view
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

            // sap.ui.getCore().loadLibrary("ui5lab.wl.pdf");
            this.fill_Business_Process();
            //	this.fill_Parser();
            var oModel = this.getOwnerComponent().getModel();
            var that = this;
            oModel.attachBatchRequestCompleted(function (oEvent) {
                var requests = oEvent.getParameter('requests');
                for (var i = 0; i < requests.length; i++) {
                    if (requests[i].url == "Subscription_Settings") {
                        that.call_Templates();
                    }
                }
            });
           // this.call_Templates();
        },

        fill_Parser: function () {
            var oModel = this.getOwnerComponent().getModel();
            var BPMode = this.getOwnerComponent().getModel("jerarquia");
            var XSDModel = this.getOwnerComponent().getModel("xsd");
            var that = this;
            var aFilter = [];
            var xsdFil = new sap.ui.model.Filter("xsd_id", sap.ui.model.FilterOperator.EQ, "GET_WORKERS_35.2");
            aFilter.push(xsdFil);
            //	aFilter.push(templateVers);
            var sPath = "/Di_Parser_Xsd_Definition";
            oModel.read(sPath, {
                filters: aFilter,
                success: function (oData, oResponse) {
                    var results = oData.results;
                    delete oData.__metadata;
                    var oRawModel = that.getModel("RawModel");
                    oRawModel.setData(results);
                    var tree = that.pasaratree(results);
                    XSDModel.setData(tree);
                    BPMode.setData({
                        nodeRoot: {
                            nodes: tree
                        }
                    });

                },
                error: function (oError) {
                    //	oViewModel.setProperty("/busy", false);
                }
            });
        },

        pasaratree: function (array, parent, tree) {

            tree = typeof tree !== 'undefined' ? tree : [];
            parent = typeof parent !== 'undefined' ? parent : {
                node_id: 0
            };
            var nodes = array.filter(function (child) {
                if (child.parent_id === parent.node_id) { //&& child.node_type !== "attribute"
                    return true;
                } else {
                    return false;
                }
                //	return child.parent_id === parent.node_id;
            });
            var that = this;
            if (nodes.length > 0) {
                if (parent.node_id === 0) {
                    tree = nodes;
                } else {
                    parent['nodes'] = nodes;
                }
                nodes.forEach(function (child) {
                    that.pasaratree(array, child);
                });
            }
            return tree;
        },

        call_Templates: function () {
            var oViewModel = this.getModel("appView");
            var oModel = this.getOwnerComponent().getModel();
            var oPersTempModel = this.getOwnerComponent().getModel("templates_pers");
            var that = this;
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
                    oViewModel.setProperty("/busy", false);
                }
            });

        },

        fill_Business_Process: function () {
            var oModel = this.getOwnerComponent().getModel();
            var BPMode = this.getOwnerComponent().getModel("BProcess");

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
                    BPMode.setData(results);
                },
                error: function (oError) {
                    //	oViewModel.setProperty("/busy", false);
                }
            });
        },

        call_Templates_Pd: function () {
            var oPersTempModel = this.getOwnerComponent().getModel("templates_pers");
            var templates = oPersTempModel.getData();
            var oViewModel = this.getModel("appView");
            var oModel = this.getOwnerComponent().getModel("templates");
            //var url = "/CPI-WD2PD-Deep/templates/templates_pd";
            var url = "/CPI-WD2PD_Dest/di/templates/templates_pd";
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
                        oViewModel.setProperty("/busy", false);
                    },
                    error: function (e) {
                        oViewModel.setProperty("/busy", false);
                    }
                });
            }
        },
    });

});
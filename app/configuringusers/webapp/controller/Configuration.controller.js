sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"./json2xml"
], function (Controller, JSONModel, Jquery) {
	"use strict";

	return Controller.extend("shapein.ConfiguringUsers.controller.Configuration", {
		onInit: function () {
			var vThat = this;
			var modelBase64 = this.getOwnerComponent().getModel();
            this.getView().setModel(modelBase64, "Base64");
            
            var oGlobalBusyDialog = new sap.m.BusyDialog();
            oGlobalBusyDialog.open();

			modelBase64.attachBatchRequestCompleted(function (oEvent) {
				var requests = oEvent.getParameter('requests');
				for (var i = 0; i < requests.length; i++) {
					if (requests[i].url == "Subscription_Settings") {
                        vThat.readBase64(modelBase64);
                        oGlobalBusyDialog.close();
					}
				}
			});
		},
		booleanTrans: function (parameter) {
			if (parameter === 'True') {
				return true;
			} else {
				return false;
			}
		},
		booleanTransOp: function (parameter) {
			if (parameter === 'True') {
				return false;
			} else {
				return true;
			}
		},
		addRow_email: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.oData.global_configuration.mappings.email.filters.filter.length == undefined) {
				dataModel.oData.global_configuration.mappings.email.filters.filter = ([{
					usage_public: "",
					type_data_primary: "",
					type_reference: "",
					_secuence: ""
				}]);
			} else {
				dataModel.oData.global_configuration.mappings.email.filters.filter.push({
					usage_public: "",
					type_data_primary: "",
					type_reference: "",
					_secuence: ""
				});
			}
			this.getView().getModel("ModelJSON").refresh();
		},
		deleteRow_email: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");
			var oTable = this.getView().byId("table0_1603812787387");
			var oItems = oTable.getSelectedItems();

			if (oItems.length != 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.ModelJSON.getProperty();

					for (var j = 0; j < dataModel.oData.global_configuration.mappings.email.filters.filter.length; j++) {
						if (dataModel.oData.global_configuration.mappings.email.filters.filter[j] == deleteRecord) {
							dataModel.oData.global_configuration.mappings.email.filters.filter.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage1"));
			}
		},
		addRow_trans: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.oData.global_configuration.transformations.organization_code.transformation.length == undefined) {
				dataModel.oData.global_configuration.transformations.organization_code.transformation = ([{
					characters: "",
					separator: "",
					replace_by: "",
					_secuence: null
				}]);
			} else {
				dataModel.oData.global_configuration.transformations.organization_code.transformation.push({
					characters: "",
					separator: "",
					replace_by: "",
					_secuence: null
				});
			}
			this.getView().getModel("ModelJSON").refresh();
		},
		deleteRow_trans: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");
			var oTable = this.getView().byId("table1");
			var oItems = oTable.getSelectedItems();

			if (oItems.length != 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.ModelJSON.getProperty();

					for (var j = 0; j < dataModel.oData.global_configuration.transformations.organization_code.transformation.length; j++) {
						if (dataModel.oData.global_configuration.transformations.organization_code.transformation[j] == deleteRecord) {
							dataModel.oData.global_configuration.transformations.organization_code.transformation.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage1"));
			}
		},
		addRow_roles: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.getData().global_configuration.mappings.roles.pd_role.length === undefined) {
				dataModel.getData().global_configuration.mappings.roles.pd_role = ([{
					_wd_role: ""
				}]);
			} else {
				dataModel.getData().global_configuration.mappings.roles.pd_role.push({
					_wd_role: ""
				});
			}
			this.getView().getModel("ModelJSON").refresh();
		},
		deleteRow_roles: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");
			var oTable = this.getView().byId("table0");
			var oItems = oTable.getSelectedItems();

			if (oItems.length !== 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.ModelJSON.getProperty();

					for (var j = 0; j < dataModel.getData().global_configuration.mappings.roles.pd_role.length; j++) {
						if (dataModel.getData().global_configuration.mappings.roles.pd_role[j] === deleteRecord) {
							dataModel.getData().global_configuration.mappings.roles.pd_role.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage1"));
			}
		},
		readBase64: function (oModel) {
			var vThat = this;
			var sUrl = "/Configurations";
			var sUrl_Languages = "/Pd_Languages";

			var filter = new sap.ui.model.Filter("pck_code", sap.ui.model.FilterOperator.EQ, "SYN_USER");
			oModel.read(sUrl, {
				filters: [filter],
				success: function (oData, response) {
					var oJSON;
					//oJSON = vThat.createJSON();
					if (oData.results.length !== 0) {
						var oXML = vThat._convertBase64toXML(oData.results[0].value);
						var vXML = $.parseXML(oXML);
						oJSON = vThat.transformXML2JSON(vXML);
					} else {
						oJSON = vThat.createJSON();
					}
					var oModelJSON = vThat.getJsonModel(oJSON);
					vThat.getView().setModel(oModelJSON, "ModelJSON");
					vThat.callCPIShapeIn_Language();
				}
			});
			oModel.read(sUrl_Languages);
		},
		_convertBase64toXML: function (oObject) {
			var xmlObject = window.atob(oObject);
			return xmlObject;
		},
		transformXML2JSON: function (oXML) {
			var array = this.createJSON();
			var vArray = oXML.childNodes;

			var vGlobalConfiguration = vArray[0].childNodes;

			var vGlobalParameters = vGlobalConfiguration[0].childNodes;

			var vWSGetWorkers = vGlobalParameters[0].childNodes;
			var vRequestFilter = vWSGetWorkers[0].childNodes;
			var vContingentWorkers = vRequestFilter[0].childNodes[0].textContent;
			var vEmployees = vRequestFilter[1].childNodes[0].textContent;
			var vInactiveWorkers = vRequestFilter[2].childNodes[0].textContent;
			var vCustomId = vRequestFilter[3].childNodes;

			if (vCustomId[0].childNodes.length !== 0) {
				var vObjectName = vCustomId[0].childNodes[0].textContent;
			}
			if (vCustomId[1].childNodes.length !== 0) {
				var vObjectValue = vCustomId[1].childNodes[0].textContent;
			}

			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_contingent_workers = vContingentWorkers;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_employees = vEmployees;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_inactive_workers = vInactiveWorkers;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.custom_id.object_name = vObjectName;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.custom_id.object_value = vObjectValue;

			var vMappings = vGlobalConfiguration[1].childNodes;

			var vLanguage = vMappings[0].childNodes;
			var vDefaultValues1 = vLanguage[0].childNodes;
			if (vDefaultValues1.length !== 0) {
				if (vDefaultValues1[0].childNodes.length != 0) {
					var vBPC7_default_code = vDefaultValues1[0].childNodes[0].textContent;
					array.global_configuration.mappings.language.default_values.BPC7_default_code = vBPC7_default_code;
				} else {
					array.global_configuration.mappings.language.default_values.BPC7_default_code = "";
				}
			}

			var vEmail = vMappings[1].childNodes;
			var vFilters2 = vEmail[0].childNodes;
			for (var n4 = 0; n4 < vFilters2.length; n4++) {
				var vFilter2 = vFilters2[n4].childNodes;
				if (vFilter2.length != 0) {
					var vVar11 = vFilters2[n4].getAttribute("secuence") * 1;
					if (vFilter2[0].childNodes.length !== 0) {
						var vVar12 = vFilter2[0].childNodes[0].textContent;
					} else {
						vVar12 = " ";
					}
					if (vFilter2[1] !== undefined) {
						var vVar13 = vFilter2[1].childNodes[0].textContent;
					} else {
						vVar13 = " ";
					}
					if (vFilter2[2] !== undefined) {
						var vVar14 = vFilter2[2].childNodes[0].textContent;
					} else {
						vVar14 = " ";
					}
					array.global_configuration.mappings.email.filters.filter.push({
						usage_public: vVar12,
						type_data_primary: vVar13,
						type_reference: vVar14,
						_secuence: vVar11
					});
				}
			}

			var vRoles = vMappings[2].childNodes;
			for (var n3 = 0; n3 < vRoles.length; n3++) {
				if (vRoles[n3].attributes.length !== 0) {
					var vVar21 = vRoles[n3].attributes[0].value;
					var vVar22 = vRoles[n3].textContent;
					array.global_configuration.mappings.roles.pd_role.push({
						_wd_role: vVar21,
						text: vVar22
					});
				}
			}

			var vTransformations = vGlobalConfiguration[2].childNodes;
			var vOrganizationCode = vTransformations[0].childNodes;
			for (var n5 = 0; n5 < vOrganizationCode.length; n5++) {
				var vTransformation = vOrganizationCode[n5].childNodes;
				if (vTransformation.length !== 0) {
					if (vTransformation[0].childNodes.length !== 0) {
						var vVar15 = vTransformation[0].childNodes[0].textContent;
					} else {
						vVar15 = " ";
					}
					if (vTransformation[1].childNodes.length !== 0) {
						var vVar16 = vTransformation[1].childNodes[0].textContent;
					} else {
						vVar16 = " ";
					}
					if (vTransformation[2].childNodes.length !== 0) {
						var vVar17 = vTransformation[2].childNodes[0].textContent;
					} else {
						vVar17 = " ";
					}
				}
				array.global_configuration.transformations.organization_code.transformation.push({
					characters: vVar15,
					separator: vVar16,
					replace_by: vVar17,
				});

			}
			return array;
		},
		createJSON: function () {
			var array = {
				"global_configuration": {
					"global_parameters": {
						"ws_get_workers": {
							"request_filter": {
								"exclude_contingent_workers": "False",
								"exclude_employees": "False",
								"exclude_inactive_workers": "False",
								"custom_id": {
									"object_name": "",
									"object_value": ""
								}
							}
						}
					},
					"mappings": {
						"language": {
							"default_values": {
								"BPC7_default_code": " "
							}
						},
						"email": {
							"filters": {
								"filter": []
							}
						},
						"roles": {
							"pd_role": []
						}
					},
					"transformations": {
						"organization_code": {
							"transformation": []
						}
					}
				}
			};
			return array;
		},
		saveConfiguration: function (oObject) {
			var vArray = [];

			var aux = this.validation2Save();
			if (aux) {
				vArray = this.getUpdatedArray();
				var vBase64 = this.transformToBase64(vArray);

				var vServiceModel = this.getView().getModel("Base64");
				var changedData = {
					"value": vBase64
				};

                var oThat = this;
				var sUrl = "/Configurations(pck_code='SYN_USER',conf_code='SCE-CONFIG')";
				vServiceModel.update(sUrl, changedData, {
					success: function (oData, response) {
						sap.m.MessageToast.show(oThat.getView().getModel("i18n").getResourceBundle().getText("viewMessage7"));
					},
					error: function (oData, response) {
						sap.m.MessageToast.show(oThat.getView().getModel("i18n").getResourceBundle().getText("viewMessage5"));
					}
				});
			} else {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage6"));
			}
		},
		validation2Save: function () {
			var aux = true;
			return aux;
		},
		getUpdatedArray: function () {
			var array = this.createJSON();

			//REQUEST FILTER
			var vContigenteWorkers;
			var vExcludeEmployees;
			var vInactiveWorkers;
			var vObjectName;
			var vObjectValue;

			if (this.getView().byId("rb001").getProperty("selected")) {
				vContigenteWorkers = "True";
			} else {
				vContigenteWorkers = "False";
			}
			if (this.getView().byId("rb003").getProperty("selected")) {
				vExcludeEmployees = "True";
			} else {
				vExcludeEmployees = "False";
			}
			if (this.getView().byId("rb005").getProperty("selected")) {
				vInactiveWorkers = "True";
			} else {
				vInactiveWorkers = "False";
			}

			vObjectName = this.getView().byId("input0").getProperty("value");
			vObjectValue = this.getView().byId("input1").getProperty("value");

			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_contingent_workers = vContigenteWorkers;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_employees = vExcludeEmployees;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_inactive_workers = vInactiveWorkers;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.custom_id.object_name = vObjectName;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.custom_id.object_value = vObjectValue;

			//MAPPING CONFIGURATION - EMAIL
			var vItems3 = this.getView().byId("table0_1603812787387").getItems();
			for (var m = 0; m < vItems3.length; m++) {
				var cells3 = vItems3[m].getAggregation("cells");
				var vKey1 = cells3[0].getProperty("selectedKey");
				var vKey2 = cells3[1].getProperty("selectedKey");
				var vKey3 = cells3[2].getProperty("selectedKey");
				var vValue5 = (cells3[3].getProperty("value").replace('_', ' ')) * 1;

				array.global_configuration.mappings.email.filters.filter.push({
					usage_public: vKey1,
					type_data_primary: vKey2,
					type_reference: vKey3,
					_secuence: vValue5
				});
			}

			//MAPPING CONFIGURATION - ROLES
			var vItems1 = this.getView().byId("table0").getItems();
			for (var p = 0; p < vItems1.length; p++) {
				var cells1 = vItems1[p].getAggregation("cells");
				var vKey11 = cells1[0].getProperty("value");
				var vKey21 = cells1[1].getProperty("value");

				array.global_configuration.mappings.roles.pd_role.push({
					_wd_role: vKey11
				});
				array.global_configuration.mappings.roles.pd_role[p]['#text'] = vKey21;
			}
			for (var a = 0; a < array.global_configuration.mappings.roles.pd_role.length; a++) {
				var aux = array.global_configuration.mappings.roles.pd_role[a]['#text'].replace(/\s/g, '').length;
				if (aux == 0) {
					array.global_configuration.mappings.roles.pd_role.splice(a, 1);
				}
			}

			//MAPPING CONFIGURATION - LANGUAGE
			var vBPC7_default_code;

			vBPC7_default_code = this.getView().byId("combo01").getSelectedKey();
			array.global_configuration.mappings.language.default_values.BPC7_default_code = vBPC7_default_code;

			//TRANSFORMATIONS - SPECIAL CHARACTERS
			var vItems2 = this.getView().byId("table1").getItems();
			for (var j = 0; j < vItems2.length; j++) {
				var cells2 = vItems2[j].getAggregation("cells");
				var vValue1 = cells2[0].getProperty("value");
				var vValue2 = cells2[1].getProperty("value");
				var vValue3 = cells2[2].getProperty("value");

				array.global_configuration.transformations.organization_code.transformation.push({
					characters: vValue1,
					separator: vValue2,
					replace_by: vValue3
				});
			}

			return array;
		},
		transformToBase64: function (oArray) {
			var base64;
			var oXML = $.json2xml(oArray);

			var string1 = oXML.split("<roles>");
			string1 = string1[0];

			var string2 = oXML.substring(oXML.indexOf("<roles>"));
			var string2 = string2.substring(0, string2.indexOf("</roles>") + 8);

			var string2a = "";
			string2 = string2.split("<#text>");
			for (var i = 0; i < string2.length; i++) {
				string2a = string2a + string2[i];
			}
			string2 = string2a;

			var string2b = "";
			string2 = string2.split("</#text>");
			for (var j = 0; j < string2.length; j++) {
				string2b = string2b + string2[j];
			}
			string2 = string2b;
			var string3 = oXML.split("</roles>");
			string3 = string3[1];

			oXML = string1 + string2 + string3;
			var base64 = window.btoa(oXML);
			return base64;
		},
		getJsonModel: function (oJSON) {
			var oModel = new JSONModel();
			oModel.oData = oJSON;
			return oModel;
		},
		callCPIShapeIn_Language: function () {

			//	var url = "/CPI-WD2PD/pd/client";
			var url = "/CPI-WD2PD_Dest/md/peopledoc/client";
			var vThat = this;
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
					success: function (result) {
						var oData = vThat.getView().getModel("Base64").getProperty("/");
						var oLanguages = new JSONModel();
						var array = [];
						var oLanguagesCPI = result.available_languages;
						for (var i = 0; i < oLanguagesCPI.length; i++) {
							var oIndex = "Pd_Languages('" + oLanguagesCPI[i] + "')";
							array.push({
								code: oData[oIndex].code,
								text: oData[oIndex].text
							});
						}
						oLanguages.setData(array);
						vThat.getView().setModel(oLanguages, "Language");
					},
					error: function (e) {}
				});
			}
		},
	});
});
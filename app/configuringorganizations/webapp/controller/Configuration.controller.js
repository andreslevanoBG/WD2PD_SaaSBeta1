sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"./json2xml",
	"sap/m/MessageBox"
], function (Controller, Fragment, JSONModel, Jquery, MessageBox) {
	"use strict";

	return Controller.extend("shapein.ConfiguringOrganizations.controller.Configuration", {
		onInit: function () {

			// //carga modelo local-inicio
			// var vThat = this;
			// var oModelJSON = this.getOwnerComponent().getModel("mock_json_model");
			// this.getView().setModel(oModelJSON, "ModelJSON");

			// oModelJSON.attachRequestCompleted(function () {
			// 	var dataModelCountryLogic = vThat.formatCountryLogic(oModelJSON);
			// 	vThat.getView().setModel(dataModelCountryLogic, "CountryLogic");
			// }, this);
			// //carga modelo local-fin

			var modelBase64 = this.getOwnerComponent().getModel();
			this.getView().setModel(modelBase64, "Base64");
			var that = this;
			modelBase64.attachBatchRequestCompleted(function (oEvent) {
				var requests = oEvent.getParameter('requests');
				for (var i = 0; i < requests.length; i++) {
					if (requests[i].url == "Subscription_Settings") {
						that.readBase64(modelBase64);
					}
				}
			});
		},
		readBase64: function (oModel) {
			var vThat = this;
			var sUrl = "/Configurations";

			var filter = new sap.ui.model.Filter("pck_code", sap.ui.model.FilterOperator.EQ, "SYN_ORG");
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

					var dataModelCountryLogic = vThat.formatCountryLogic(oModelJSON);
					vThat.getView().setModel(dataModelCountryLogic, "CountryLogic");
					// vThat.callCPIShapeIn();
				}
			});
		},
		transformXML2JSON: function (oXML) {
			var array = this.createJSON();
			var vArray = oXML.childNodes;

			var vGlobalConfiguration = vArray[0].childNodes;
			var vWebServices = vGlobalConfiguration[0].childNodes;

			var vGetLocations = vWebServices[0].childNodes;
			var vMappings1 = vGetLocations[0].childNodes;

			var vAddressData = vMappings1[0].childNodes;
			var vFilters1 = vAddressData[0].childNodes;
			for (var n1 = 0; n1 < vFilters1.length; n1++) {
				var vFilter1 = vFilters1[n1].childNodes;
				if (vFilter1.length != 0) {
					var vVar3 = vFilters1[n1].getAttribute("secuence") * 1;
					if (vFilter1[0].childNodes.length !== 0) {
						var vVar1 = vFilter1[0].childNodes[0].textContent;
					} else {
						vVar1 = " ";
					}
					if (vFilter1[1].childNodes.length !== 0) {
						var vVar2 = vFilter1[1].childNodes[0].textContent;
					} else {
						vVar2 = " ";
					}
					if (vFilter1[2].childNodes.length !== 0) {
						var vVar3A = vFilter1[2].childNodes[0].textContent;
					} else {
						vVar3A = " ";
					}
					array.global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.push({
						usage_public: vVar1,
						type_data_primary: vVar2,
						type_reference: vVar3A,
						_secuence: vVar3
					});
				}
			}

			var vCountryLogic = vAddressData[1].childNodes;
			for (var n2 = 0; n2 < vCountryLogic.length; n2++) {
				var vCountry1 = vCountryLogic[n2].childNodes;
				if (vCountry1.length !== 0) {
					var vVar4 = vCountryLogic[0].id;
					if (vCountry1[0].childNodes.length != 0) {
						var vVar5 = vCountry1[0].childNodes[0].textContent;
					} else {
						vVar5 = " ";
					}
					if (vCountry1[1].childNodes.length != 0) {
						var vVar6 = vCountry1[1].childNodes[0].textContent;
					} else {
						vVar6 = " ";
					}
					if (vCountry1[2].childNodes.length != 0) {
						var vVar7 = vCountry1[2].childNodes[0].textContent;
					} else {
						vVar7 = " ";
					}
					array.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country.push({
						address1: vVar5,
						address2: vVar6,
						address3: vVar7,
						_id: vVar4
					});
				}
			}

			var vZipCode = vMappings1[1].childNodes;
			var vDefaultValues1 = vZipCode[0].childNodes;
			for (var n3 = 0; n3 < vDefaultValues1.length; n3++) {
				var vVar9 = vDefaultValues1[n3].id;
				if (vDefaultValues1[n3].childNodes.length !== 0) {
					var vVar10 = vDefaultValues1[n3].childNodes[0].textContent;
					array.global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.push({
						_id: vVar9,
						__text: vVar10
					});
				}
			}

			var vGetOrganizations = vWebServices[1].childNodes;
			var vRequestFilter = vGetOrganizations[0].childNodes;
			var vIncludeInactiveOrgs = vRequestFilter[0].childNodes[0].textContent;

			array.global_configuration.web_services.ws_get_organizations.request_filter.include_inactive_orgs = vIncludeInactiveOrgs;

			var vGetWorkers = vWebServices[2].childNodes;
			var vMappings2 = vGetWorkers[0].childNodes;
			var vEmail = vMappings2[0].childNodes;
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
					array.global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.push({
						usage_public: vVar12,
						type_data_primary: vVar13,
						type_reference: vVar14,
						_secuence: vVar11
					});
				}
			}

			var vTransformations = vGlobalConfiguration[1].childNodes;
			var vOrganizationCode = vTransformations[0].childNodes;
			for (var n5 = 0; n5 < vOrganizationCode.length; n5++) {
				var vTransformation = vOrganizationCode[n5].childNodes;
				//var vVar18 = vOrganizationCode[n5].getAttribute("secuence") * 1;
				if (vTransformation.length != 0) {
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
					//_secuence: vVar18
				});

			}
			return array;
		},
		createJSON: function () {
			var array = {
				"global_configuration": {
					"web_services": {
						"ws_get_locations": {
							"mappings": {
								"address_data": {
									"filters": {
										"filter": []
									},
									"country_logic": {
										"country": []
									}
								},
								"zip_code": {
									"default_values": {
										"country": []
									}
								}
							}
						},
						"ws_get_organizations": {
							"request_filter": {
								"include_inactive_orgs": "False"
							}
						},
						"ws_get_workers": {
							"mappings": {
								"email": {
									"filters": {
										"filter": []
									}
								}
							}
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
		_convertBase64toXML: function (oObject) {
			var xmlObject = window.atob(oObject);
			return xmlObject;
		},
		getJsonModel: function (oJSON) {
			var oModel = new JSONModel();
			oModel.oData = oJSON;
			return oModel;
		},
		formatCountryLogic: function (oModel) {
			var countryLogic = new JSONModel();
			var array = [];
			var oModelJSON = oModel.getData();

			for (var i = 0; i < oModelJSON.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country.length; i++) {
				array.push({
					country: oModelJSON.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[i]._id,
					field: "Address 1",
					value: oModelJSON.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[i].address1
				});
				array.push({
					country: oModelJSON.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[i]._id,
					field: "Address 2",
					value: oModelJSON.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[i].address2
				});
				array.push({
					country: oModelJSON.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[i]._id,
					field: "Address 3",
					value: oModelJSON.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country[i].address3
				});
			}
			countryLogic.oData = array;
			return countryLogic;
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
		addRow_zipcode: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.length ===
				undefined) {
				dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country = ([{
					_id: "",
					__text: ""
				}]);
			} else {
				dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.push({
					_id: "",
					__text: ""
				});
			}
			this.getView().getModel("ModelJSON").refresh();
		},
		deleteRow_zipcode: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");
			var oTable = this.getView().byId("table0_1603812570312");
			var oItems = oTable.getSelectedItems();

			if (oItems.length !== 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.ModelJSON.getProperty();

					for (var j = 0; j < dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country
						.length; j++) {
						if (dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country[j] ===
							deleteRecord) {
							dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show('Please, select a row to delete.');
			}
		},
		addRow_email: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.length == undefined) {
				dataModel.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter = ([{
					usage_public: "",
					type_data_primary: "",
					type_reference: "",
					_secuence: ""
				}]);
			} else {
				dataModel.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.push({
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

					for (var j = 0; j < dataModel.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.length; j++) {
						if (dataModel.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter[j] == deleteRecord) {
							dataModel.getData().global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show('Please, select a row to delete.');
			}
		},
		addRow_address: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.length == undefined) {
				dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter = ([{
					business_site_address: "",
					address_format_type: "",
					_secuence: ""
				}]);
			} else {
				dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.push({
					business_site_address: "",
					address_format_type: "",
					_secuence: ""
				});
			}
			this.getView().getModel("ModelJSON").refresh();
		},
		deleteRow_address: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");
			var oTable = this.getView().byId("table0");
			var oItems = oTable.getSelectedItems();

			if (oItems.length != 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.ModelJSON.getProperty();

					for (var j = 0; j < dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.length; j++) {
						if (dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter[j] ==
							deleteRecord) {
							dataModel.getData().global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show('Please, select a row to delete.');
			}
		},
		addRow_country: function (oArg) {
			var aux;
			var oSelected = this.getView().byId("combo03423").getSelectedItem();
			if (oSelected !== null) {
				var dataModel = this.getView().getModel("CountryLogic");
				var oItems = this.getView().byId("table0_copy").getItems();
				if (oItems.length !== 0) {
					for (var i = 0; i < oItems.length; i++) {
						if (oItems[i].getAggregation("cells") !== null) {
							var oItemKey = oItems[i].getAggregation("cells")[0].getProperty("text");
							if (oItemKey === oSelected.getProperty("key")) {
								sap.m.MessageToast.show('This country is already selected.');
								aux = false;
								break;
							} else {
								aux = true;
							}
						}
					}
				} else {
					aux = true;
				}

				//var array = [];
				if (aux) {
					dataModel.oData.push({
						country: oSelected.getProperty("key"),
						field: "Address 1",
						value: ""
					});
					dataModel.oData.push({
						country: oSelected.getProperty("key"),
						field: "Address 2",
						value: ""
					});
					dataModel.oData.push({
						country: oSelected.getProperty("key"),
						field: "Address 3",
						value: ""
					});

					this.getView().getModel("CountryLogic").refresh(); //which will add the new record	
				}
			} else {
				sap.m.MessageToast.show('Please, select a country to add.');
			}
		},
		deleteRow_country: function (oArg) {
			var dataModel = this.getView().getModel("CountryLogic");
			var oTable = this.getView().byId("table0_copy");
			var oItems = oTable.getSelectedItems();

			if (oItems.length != 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.CountryLogic.getProperty();

					for (var j = 0; j < dataModel.getData().length; j++) {
						if (dataModel.getData()[j].country == deleteRecord.country) {
							[1, 2, 3].forEach(function (n) {
								dataModel.getData().splice(j, 1); //removing 1 record from i th index.
							});
							this.getView().getModel("CountryLogic").refresh();
							break; //quit the loop
						}
					}
				}
			} else {
				sap.m.MessageToast.show('Please, select a row to delete.');
			}
		},
		addRow_trans: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.getData().global_configuration.transformations.organization_code.transformation.length == undefined) {
				dataModel.getData().global_configuration.transformations.organization_code.transformation = ([{
					characters: " ",
					separator: " ",
					replace_by: " ",
					_secuence: null
				}]);
			} else {
				dataModel.getData().global_configuration.transformations.organization_code.transformation.push({
					characters: " ",
					separator: " ",
					replace_by: " ",
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

					for (var j = 0; j < dataModel.getData().global_configuration.transformations.organization_code.transformation.length; j++) {
						if (dataModel.getData().global_configuration.transformations.organization_code.transformation[j] == deleteRecord) {
							dataModel.getData().global_configuration.transformations.organization_code.transformation.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show('Please, select a row to delete.');
			}
		},
		handleUploadComplete: function (oEvent) {
			var sResponse = oEvent.getParameter("response");
			if (sResponse) {
				var sMsg = "";
				var m = /^\[(\d\d\d)\]:(.*)$/.exec(sResponse);
				if (m[1] == "200") {
					sMsg = "Return Code: " + m[1] + "\n" + m[2] + "(Upload Success)";
					oEvent.getSource().setValue("");
				} else {
					sMsg = "Return Code: " + m[1] + "\n" + m[2] + "(Upload Error)";
				}
				MessageToast.show(sMsg);
			}
		},
		handleUploadPress: function () {
			var oFileUploader = this.byId("fileUploader");
			oFileUploader.upload();
		},
		buildAddressChk: function (oObject) {
			var oView = this.getView();
			var vThat = this;
			var oCountryLogic = oObject.getSource().getParent().getAggregation("cells")[2].getProperty("value");
			this.countryLogic = oCountryLogic;

			var oItems = this.getView().byId("table0_copy").getItems();
			for (var i = 0; i < oItems.length; i++) {
				if (oObject.getSource().getParent().getBindingContextPath() === oItems[i].getBindingContextPath()) {
					this.countryLogicIndex = i;
				}
			}

			// create dialog lazily
			if (!this.byId("buildAddressChk")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "shapein.ConfiguringOrganizations.view.buildAddressChk",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();

					oView().byId("area210").setValue(vThat.countryLogic);
				});
			} else {
				this.byId("buildAddressChk").open();
				this.byId("area210").setValue(this.countryLogic);
			}
		},
		onCloseBuildAddressChk: function (oObject) {
			var oTextArea = this.getView().byId("area210").getValue();
			var oItems = this.getView().byId("table0_copy").getItems();
			for (var i = 0; i < oItems.length; i++) {
				if (this.countryLogicIndex == i) {

				}
			}
			this.byId("buildAddressChk").close();
		},
		onAcceptBuildAddressChk: function (oObject) {
			var oTextArea = this.getView().byId("area210").getValue();
			var oItems = this.getView().byId("table0_copy").getItems();
			for (var i = 0; i < oItems.length; i++) {
				if (this.countryLogicIndex == i) {
					oItems[this.countryLogicIndex].getAggregation("cells")[2].setValue(oTextArea);
				}
			}
			this.byId("buildAddressChk").close();
		},
		addOption: function () {
			var oItems = this.getView().byId("table13423").getSelectedItems();
			for (var i = 0; i < oItems.length; i++) {
				var oCell = oItems[i].getAggregation("cells")[0];
				var oValue = "{" + oCell.getProperty("text") + "}";

				var oTextArea = this.getView().byId("area210").getValue();
				oTextArea = oTextArea + oValue;
				this.getView().byId("area210").setValue(oTextArea);
			}
			this.getView().byId("table13423").removeSelections();
		},
		deleteOption: function () {
			var oTextArea = this.getView().byId("area210").getValue();
			oTextArea = "";
			this.getView().byId("area210").setValue(oTextArea);
			this.getView().byId("table13423").removeSelections();
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

				var sUrl = "/Configurations(pck_code='SYN_ORG',conf_code='SCE-CONFIG')";
				vServiceModel.update(sUrl, changedData, {
					success: function (oData, response) {
						sap.m.MessageToast.show('Organizations Configurations updated.');
					},
					error: function (oData, response) {
						sap.m.MessageToast.show('Data can not be updated. Please try again');
					}
				});
			} else {
				sap.m.MessageToast.show('There is a field with wrong value.');
			}
		},
		getUpdatedArray: function () {
			var array = this.createJSON();

			//REQUEST FILTER
			var vIncludeInactiveOrgs;

			if (this.getView().byId("rb001").getProperty("selected")) {
				vIncludeInactiveOrgs = "True";
			} else {
				vIncludeInactiveOrgs = "False";
			}

			array.global_configuration.web_services.ws_get_organizations.request_filter.include_inactive_orgs = vIncludeInactiveOrgs;

			//MAPPING CONFIGURATION - COMMON ADDRESS
			var vItems4 = this.getView().byId("table0").getItems();
			for (var n = 0; n < vItems4.length; n++) {
				var cells4 = vItems4[n].getAggregation("cells");
				var vKey6 = cells4[0].getProperty("selectedKey");
				var vKey7 = cells4[1].getProperty("selectedKey");
				var vKey8 = cells4[2].getProperty("selectedKey");
				var vValue9 = (cells4[3].getProperty("value").replace('_', ' ')) * 1;

				array.global_configuration.web_services.ws_get_locations.mappings.address_data.filters.filter.push({
					usage_public: vKey6,
					type_data_primary: vKey7,
					type_reference: vKey8,
					_secuence: vValue9
				});
			}

			//MAPPING CONFIGURATION - COUNTRY LOGIC
			var vItems5 = this.getView().byId("table0_copy").getItems();
			var country_logic = [];
			for (var m = 0; m < vItems5.length; m++) {
				if (vItems5[m].getAggregation("cells") !== null) {
					var cells5 = vItems5[m].getAggregation("cells");
					var vValue11 = cells5[0].getProperty("text");
					var vValue10 = cells5[2].getProperty("value");
					country_logic.push(vValue10);
					if (country_logic.length === 3) {
						array.global_configuration.web_services.ws_get_locations.mappings.address_data.country_logic.country.push({
							address1: country_logic[0],
							address2: country_logic[1],
							address3: country_logic[2],
							_id: vValue11
						});
						country_logic = [];
					}
				}
			}

			//MAPPING CONFIGURATION - ZIP CODE
			var vItems1 = this.getView().byId("table0_1603812570312").getItems();
			for (var i = 0; i < vItems1.length; i++) {
				var cells1 = vItems1[i].getAggregation("cells");
				var vKey = cells1[0].getProperty("selectedKey");
				var vValue = cells1[1].getProperty("value");

				array.global_configuration.web_services.ws_get_locations.mappings.zip_code.default_values.country.push({
					_id: vKey,
					__text: vValue
				});
			}

			//MAPPING CONFIGURATION - EMAIL
			var vItems3 = this.getView().byId("table0_1603812787387").getItems();
			for (var m = 0; m < vItems3.length; m++) {
				var cells3 = vItems3[m].getAggregation("cells");
				var vKey1 = cells3[0].getProperty("selectedKey");
				var vKey2 = cells3[1].getProperty("selectedKey");
				var vKey3 = cells3[2].getProperty("selectedKey");
				var vValue5 = (cells3[3].getProperty("value").replace('_', ' ')) * 1;

				array.global_configuration.web_services.ws_get_workers.mappings.email.filters.filter.push({
					usage_public: vKey1,
					type_data_primary: vKey2,
					type_reference: vKey3,
					_secuence: vValue5
				});
			}

			//TRANSFORMATIONS - SPECIAL CHARACTERS
			var vItems2 = this.getView().byId("table1").getItems();
			for (var j = 0; j < vItems2.length; j++) {
				var cells2 = vItems2[j].getAggregation("cells");
				var vValue1 = cells2[0].getProperty("value");
				var vValue2 = cells2[1].getProperty("value");
				var vValue3 = cells2[2].getProperty("value");
				//var vValue4 = (cells2[3].getProperty("value").replace('_', ' ')) * 1;

				array.global_configuration.transformations.organization_code.transformation.push({
					characters: vValue1,
					separator: vValue2,
					replace_by: vValue3,
					//_secuence: vValue4
				});
			}

			return array;
		},
		transformToBase64: function (oArray) {
			var base64;
			var oXML = $.json2xml(oArray);
			var base64 = window.btoa(oXML);
			return base64;
		},
		validateCountryZipCode: function (oParameter) {
			var vThat = this;
			var oItems = this.getView().byId("table0_1603812570312").getItems();
			var oSelectedKey = oParameter.getParameters().selectedItem.getProperty("key");
			var oIndex = oParameter.getParameters().id;
			oIndex = oIndex.substring(oIndex.length - 2);
			oIndex = oIndex.replace('-', '') * 1;

			for (var i = 0; i < oItems.length; i++) {
				var oItemKey = oItems[i].getAggregation("cells")[0].getProperty("selectedKey");

				if (oSelectedKey === oItemKey && i !== oIndex) {
					oParameter.getSource().setValueState("Error");
					break;
				} else {
					oParameter.getSource().setValueState("None");
				}
			}
		},
		validation2Save: function () {
			var aux = true;
			var oItems = this.getView().byId("table0_1603812570312").getItems();
			for (var i = 0; i < oItems.length; i++) {
				var oItemState = oItems[i].getAggregation("cells")[0].getValueState();
				if (oItemState === "Error") {
					aux = false;
					break;
				} else {
					aux = true;
				}
			}
			return aux;
		}
	});
});
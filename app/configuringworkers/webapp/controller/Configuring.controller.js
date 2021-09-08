sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"./Utils",
	"./json2xml"
], function (BaseController, MessageBox, History, JSONModel, Fragment, Utils, Jquery) {
	"use strict";

	return BaseController.extend("shapein.ConfiguringWorkers.controller.Configuring", {

		onInit: function () {
			var vThat = this;
			var vWindow = window;

			var modelBase64 = this.getOwnerComponent().getModel();
			this.getView().setModel(modelBase64, "Base64");
            var that = this;
            
            var oGlobalBusyDialog = new sap.m.BusyDialog();
            oGlobalBusyDialog.open();
            
			modelBase64.attachBatchRequestCompleted(function (oEvent) {
				var requests = oEvent.getParameter('requests');
				for(var i = 0; i < requests.length; i++){
					if(requests[i].url == "Subscription_Settings"){
                        that.readBase64(modelBase64);	
                        oGlobalBusyDialog.close();
					}
				}
			});
			this.radiobuttonModel();

		},

		handleRouteMatched: function (oEvent) {
			var sAppId = "App5f5b471a03c7c8623472451f";

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;

			} else {
				if (this.getOwnerComponent().getComponentData()) {
					var patternConvert = function (oParam) {
						if (Object.keys(oParam).length !== 0) {
							for (var prop in oParam) {
								if (prop !== "sourcePrototype" && prop.includes("Set")) {
									return prop + "(" + oParam[prop][0] + ")";
								}
							}
						}
					};

					this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

				}
			}

			var oPath;

			if (this.sContext) {
				oPath = {
					path: "/" + this.sContext,
					parameters: oParams
				};
				this.getView().bindObject(oPath);
			}

			this.aRadioButtonGroupIds = [
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-1-subSections-sap_uxap_ObjectPageSubSection-1-blocks-build_simple_form_Form-1600070272249-formContainers-build_simple_form_FormContainer-1-formElements-build_simple_form_FormElement-2-fields-sap_m_RadioButtonGroup-1600077158601",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-1-subSections-sap_uxap_ObjectPageSubSection-1-blocks-build_simple_form_Form-1600070272249-formContainers-build_simple_form_FormContainer-1-formElements-build_simple_form_FormElement-1600077208298-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-1-subSections-sap_uxap_ObjectPageSubSection-1-blocks-build_simple_form_Form-1600070272249-formContainers-build_simple_form_FormContainer-1-formElements-build_simple_form_FormElement-1600251652154-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-1-subSections-sap_uxap_ObjectPageSubSection-1-blocks-build_simple_form_Form-1600070272249-formContainers-build_simple_form_FormContainer-1-formElements-build_simple_form_FormElement-1600077212672-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-1-subSections-sap_uxap_ObjectPageSubSection-1-blocks-build_simple_form_Form-1600070272249-formContainers-build_simple_form_FormContainer-1-formElements-build_simple_form_FormElement-1600077215833-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-2-formElements-build_simple_form_FormElement-2-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-2-formElements-build_simple_form_FormElement-4-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-2-formElements-build_simple_form_FormElement-5-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-3-formElements-build_simple_form_FormElement-2-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-3-formElements-build_simple_form_FormElement-3-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-3-formElements-build_simple_form_FormElement-4-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-4-formElements-build_simple_form_FormElement-2-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-4-formElements-build_simple_form_FormElement-3-fields-sap_m_RadioButtonGroup-1",
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-4-formElements-build_simple_form_FormElement-4-fields-sap_m_RadioButtonGroup-1"
			];
			this.handleRadioButtonGroupsSelectedIndex();

		},
		handleRadioButtonGroupsSelectedIndex: function () {
			var that = this;
			this.aRadioButtonGroupIds.forEach(function (sRadioButtonGroupId) {
				var oRadioButtonGroup = that.byId(sRadioButtonGroupId);
				var oButtonsBinding = oRadioButtonGroup ? oRadioButtonGroup.getBinding("buttons") : undefined;
				if (oButtonsBinding) {
					var oSelectedIndexBinding = oRadioButtonGroup.getBinding("selectedIndex");
					var iSelectedIndex = oRadioButtonGroup.getSelectedIndex();
					oButtonsBinding.attachEventOnce("change", function () {
						if (oSelectedIndexBinding) {
							oSelectedIndexBinding.refresh(true);
						} else {
							oRadioButtonGroup.setSelectedIndex(iSelectedIndex);
						}
					});
				}
			});

		},
		convertTextToIndexFormatter: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-1-subSections-sap_uxap_ObjectPageSubSection-1-blocks-build_simple_form_Form-1600070272249-formContainers-build_simple_form_FormContainer-1-formElements-build_simple_form_FormElement-2-fields-sap_m_RadioButtonGroup-1600077158601"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect: function () {

		},
		convertTextToIndexFormatter1: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-1-subSections-sap_uxap_ObjectPageSubSection-1-blocks-build_simple_form_Form-1600070272249-formContainers-build_simple_form_FormContainer-1-formElements-build_simple_form_FormElement-1600077208298-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect1: function () {

		},
		convertTextToIndexFormatter2: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-1-subSections-sap_uxap_ObjectPageSubSection-1-blocks-build_simple_form_Form-1600070272249-formContainers-build_simple_form_FormContainer-1-formElements-build_simple_form_FormElement-1600251652154-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect2: function () {

		},
		convertTextToIndexFormatter3: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-1-subSections-sap_uxap_ObjectPageSubSection-1-blocks-build_simple_form_Form-1600070272249-formContainers-build_simple_form_FormContainer-1-formElements-build_simple_form_FormElement-1600077212672-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect3: function () {

		},
		convertTextToIndexFormatter4: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-1-subSections-sap_uxap_ObjectPageSubSection-1-blocks-build_simple_form_Form-1600070272249-formContainers-build_simple_form_FormContainer-1-formElements-build_simple_form_FormElement-1600077215833-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect4: function () {

		},
		convertTextToIndexFormatter5: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-2-formElements-build_simple_form_FormElement-2-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect5: function () {

		},
		convertTextToIndexFormatter6: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-2-formElements-build_simple_form_FormElement-4-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect6: function () {

		},
		convertTextToIndexFormatter7: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-2-formElements-build_simple_form_FormElement-5-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect7: function () {

		},
		convertTextToIndexFormatter8: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-3-formElements-build_simple_form_FormElement-2-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect8: function () {

		},
		convertTextToIndexFormatter9: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-3-formElements-build_simple_form_FormElement-3-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect9: function () {

		},
		convertTextToIndexFormatter10: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-3-formElements-build_simple_form_FormElement-4-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect10: function () {

		},
		convertTextToIndexFormatter11: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-4-formElements-build_simple_form_FormElement-2-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect11: function () {

		},
		convertTextToIndexFormatter12: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-4-formElements-build_simple_form_FormElement-3-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect12: function () {

		},
		convertTextToIndexFormatter13: function (sTextValue) {
			var oRadioButtonGroup = this.byId(
				"sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-2-subSections-sap_uxap_ObjectPageSubSection-1600084166720-blocks-build_simple_form_Form-1-formContainers-build_simple_form_FormContainer-4-formElements-build_simple_form_FormElement-4-fields-sap_m_RadioButtonGroup-1"
			);
			var oButtonsBindingInfo = oRadioButtonGroup.getBindingInfo("buttons");
			if (oButtonsBindingInfo && oButtonsBindingInfo.binding) {
				// look up index in bound context
				var sTextBindingPath = oButtonsBindingInfo.template.getBindingPath("text");
				return oButtonsBindingInfo.binding.getContexts(oButtonsBindingInfo.startIndex, oButtonsBindingInfo.length).findIndex(function (
					oButtonContext) {
					return oButtonContext.getProperty(sTextBindingPath) === sTextValue;
				});
			} else {
				// look up index in static items
				return oRadioButtonGroup.getButtons().findIndex(function (oButton) {
					return oButton.getText() === sTextValue;
				});
			}

		},
		_onRadioButtonGroupSelect13: function () {

		},
		initValue: function (parameter) {
			return parameter;
		},
		initValue1: function (parameter) {

			return parameter;
		},
		initValue2: function (parameter) {
			return parameter;
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
		addRow_startingdate: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.getData().global_configuration.mappings.starting_date.mappings.mapping.length === undefined) {
				dataModel.getData().global_configuration.mappings.starting_date.mappings.mapping = ([{
					sender_node: "",
					_secuence: ""
				}]);
			} else {
				dataModel.getData().global_configuration.mappings.starting_date.mappings.mapping.push({
					sender_node: "",
					_secuence: ""
				});
			}
			this.getView().getModel("ModelJSON").refresh();
		},
		deleteRow_startingdate: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");
			var oTable = this.getView().byId("table0_SD");
			var oItems = oTable.getSelectedItems();

			if (oItems.length != 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.ModelJSON.getProperty();

					for (var j = 0; j < dataModel.getData().global_configuration.mappings.starting_date.mappings.mapping.length; j++) {
						if (dataModel.getData().global_configuration.mappings.starting_date.mappings.mapping[j] === deleteRecord) {
							dataModel.getData().global_configuration.mappings.starting_date.mappings.mapping.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
                sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage1"));

			}
		},
		addRow_zipcode: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.getData().global_configuration.mappings.zip_code.default_values.country.length === undefined) {
				dataModel.getData().global_configuration.mappings.zip_code.default_values.country = ([{
					_id: "",
					__text: ""
				}]);
			} else {
				dataModel.getData().global_configuration.mappings.zip_code.default_values.country.push({
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

			if (oItems.length != 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.ModelJSON.getProperty();

					for (var j = 0; j < dataModel.getData().global_configuration.mappings.zip_code.default_values.country.length; j++) {
						if (dataModel.getData().global_configuration.mappings.zip_code.default_values.country[j] === deleteRecord) {
							dataModel.getData().global_configuration.mappings.zip_code.default_values.country.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage1"));
			}
		},
		addRow_email: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.getData().global_configuration.mappings.email.filters.filter.length === undefined) {
				dataModel.getData().global_configuration.mappings.email.filters.filter = ([{
					usage_public: "",
					type_data_primary: "",
					type_reference: "",
					_secuence: ""
				}]);
			} else {
				dataModel.getData().global_configuration.mappings.email.filters.filter.push({
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

			if (oItems.length !== 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.ModelJSON.getProperty();

					for (var j = 0; j < dataModel.getData().global_configuration.mappings.email.filters.filter.length; j++) {
						if (dataModel.getData().global_configuration.mappings.email.filters.filter[j] === deleteRecord) {
							dataModel.getData().global_configuration.mappings.email.filters.filter.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage1"));
			}
		},
		addRow_address: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.getData().global_configuration.mappings.address_data.filters.filter.length === undefined) {
				dataModel.getData().global_configuration.mappings.address_data.filters.filter = ([{
					business_site_address: "",
					address_format_type: "",
					_secuence: ""
				}]);
			} else {
				dataModel.getData().global_configuration.mappings.address_data.filters.filter.push({
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

			if (oItems.length !== 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.ModelJSON.getProperty();

					for (var j = 0; j < dataModel.getData().global_configuration.mappings.address_data.filters.filter.length; j++) {
						if (dataModel.getData().global_configuration.mappings.address_data.filters.filter[j] === deleteRecord) {
							dataModel.getData().global_configuration.mappings.address_data.filters.filter.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage1"));
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
								sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage2"));
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
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage3"));
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
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage1"));
			}
		},
		addRow_trans: function (oArg) {
			var dataModel = this.getView().getModel("ModelJSON");

			if (dataModel.getData().global_configuration.transformations.organization_code.transformation.length === undefined) {
				dataModel.getData().global_configuration.transformations.organization_code.transformation = ([{
					characters: "",
					separator: "",
					replace_by: "",
					_secuence: null
				}]);
			} else {
				dataModel.getData().global_configuration.transformations.organization_code.transformation.push({
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

			if (oItems.length !== 0) {
				for (var i = 0; i < oItems.length; i++) {
					var oItem = oItems[i];
					var deleteRecord = oItem.oBindingContexts.ModelJSON.getProperty();

					for (var j = 0; j < dataModel.getData().global_configuration.transformations.organization_code.transformation.length; j++) {
						if (dataModel.getData().global_configuration.transformations.organization_code.transformation[j] === deleteRecord) {
							dataModel.getData().global_configuration.transformations.organization_code.transformation.splice(j, 1); //removing 1 record from i th index.
							this.getView().getModel("ModelJSON").refresh();
						}
					}
				}
			} else {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage1"));
			}
		},
		_convertBase64toXML: function (oObject) {
			var xmlObject = window.atob(oObject);
			return xmlObject;
		},
		_convertXMLtoJSON: function (xml) {
			var obj = {};
			if (xml.nodeType === 1) {
				if (xml.attributes.length > 0) {
					obj["@attributes"] = {};
					for (var j = 0; j < xml.attributes.length; j++) {
						var attribute = xml.attributes.item(j);
						obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
					}
				}
			} else if (xml.nodeType === 3) {
				obj = xml.nodeValue;
			}
			if (xml.hasChildNodes()) {
				for (var i = 0; i < xml.childNodes.length; i++) {
					var item = xml.childNodes.item(i);
					var nodeName = item.nodeName;
					if (typeof (obj[nodeName]) === "undefined") {
						obj[nodeName] = this._convertXMLtoJSON(item);
					} else {
						if (typeof (obj[nodeName].push) === "undefined") {
							var old = obj[nodeName];
							obj[nodeName] = [];
							obj[nodeName].push(old);
						}
						obj[nodeName].push(this._convertXMLtoJSON(item));
					}
				}
			}
			return obj;
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

			if (!this.byId("buildAddressChk")) {
				Fragment.load({
					id: oView.getId(),
					name: "shapein.ConfiguringWorkers.view.buildAddressChk",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.open();

					oView().byId("area210").setValue(vThat.countryLogic);
				});
			} else {
				this.byId("buildAddressChk").open();
				this.byId("area210").setValue(this.countryLogic);
			}
		},
		buildAddress: function (oObject) {
			var oView = this.getView();

			if (!this.byId("buildAddress")) {
				Fragment.load({
					id: oView.getId(),
					name: "shapein.ConfiguringWorkers.view.buildAddress",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("buildAddress").open();
			}
		},
		onDropAvailableProductsTable: function (oEvent) {
			var oDraggedItem = oEvent.getParameter("draggedControl");
			var oDraggedItemContext = oDraggedItem.getBindingContext();
			if (!oDraggedItemContext) {
				return;
			}

			var oAvailableProductsTable = Utils.getAvailableProductsTable(this);
			var oProductsModel = oAvailableProductsTable.getModel();
			oProductsModel.setProperty("Rank", Utils.ranking.Initial, oDraggedItemContext);
		},
		onCloseBuildAddress: function (oObject) {
			this.byId("buildAddress").close();
		},
		onCloseBuildAddressChk: function (oObject) {
			var oTextArea = this.getView().byId("area210").getValue();
			var oItems = this.getView().byId("table0_copy").getItems();
			for (var i = 0; i < oItems.length; i++) {
				if (this.countryLogicIndex === i) {

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
		readBase64: function (oModel) {
			var vThat = this;
			var sUrl = "/Configurations";
			var sUrl_Languages = "/Pd_Languages";
			//var filter = new sap.ui.model.Filter("pck_code", sap.ui.model.FilterOperator.EQ, "SYN_WEX");
			var filter = new sap.ui.model.Filter("pck_code", sap.ui.model.FilterOperator.EQ, "SYN_WORKER");
			oModel.read(sUrl, {
				filters: [filter],
				success: function (oData, response) {
					var oJSON;
					//oJSON = vThat.createJSON();
					if (oData.results.length != 0) {
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

					vThat.callCPIShapeIn_CustomFields();
					vThat.callCPIShapeIn_Language();

				}
			});
			oModel.read(sUrl_Languages);
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

			for (var i = 0; i < oModelJSON.global_configuration.mappings.address_data.country_logic.country.length; i++) {
				array.push({
					country: oModelJSON.global_configuration.mappings.address_data.country_logic.country[i]._id,
					field: "Address 1",
					value: oModelJSON.global_configuration.mappings.address_data.country_logic.country[i].address1
				});
				array.push({
					country: oModelJSON.global_configuration.mappings.address_data.country_logic.country[i]._id,
					field: "Address 2",
					value: oModelJSON.global_configuration.mappings.address_data.country_logic.country[i].address2
				});
				array.push({
					country: oModelJSON.global_configuration.mappings.address_data.country_logic.country[i]._id,
					field: "Address 3",
					value: oModelJSON.global_configuration.mappings.address_data.country_logic.country[i].address3
				});
			}
			countryLogic.oData = array;
			return countryLogic;
		},
		saveConfiguration: function (oObject) {

			var vArray = [];

			var aux = this.validation2Save();
			if (aux) {
				vArray = this.getUpdatedArray();
				var vBase64 = this.transformToBase64(vArray);

				var vPCKCode = "SYN_WEX";
				var vConfCode = "SCE-CONFIG";
				//var vBase64 	= "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiID8+Cjxyb290PgogIDxnbG9iYWxfcGFyYW1ldGVycz4KICAgIDx3c19nZXRfd29ya2Vycz4KICAgICAgPHJlcXVlc3RfZmlsdGVyPgogICAgICAgIDxleGNsdWRlX2NvbnRpbmdlbnRfd29ya2Vycz5UcnVlPC9leGNsdWRlX2NvbnRpbmdlbnRfd29ya2Vycz4KICAgICAgICA8ZXhjbHVkZV9lbXBsb3llZXM+VHJ1ZTwvZXhjbHVkZV9lbXBsb3llZXM+CiAgICAgICAgPGV4Y2x1ZGVfaW5hY3RpdmVfd29ya2Vycz5UcnVlPC9leGNsdWRlX2luYWN0aXZlX3dvcmtlcnM+CiAgICAgIDwvcmVxdWVzdF9maWx0ZXI+CiAgICA8L3dzX2dldF93b3JrZXJzPgogIDwvZ2xvYmFsX3BhcmFtZXRlcnM+CiAgPG1hcHBpbmdzPgogICAgPGFkZHJlc3NfZGF0YT4KICAgICAgPGZpbHRlcnM+CiAgICAgICAgPGZpbHRlcj4KICAgICAgICAgIDx1c2FnZV9wdWJsaWM+MTwvdXNhZ2VfcHVibGljPgogICAgICAgICAgPHR5cGVfZGF0YV9wcmltYXJ5PjE8L3R5cGVfZGF0YV9wcmltYXJ5PgogICAgICAgICAgPHR5cGVfcmVmZXJlbmNlPldPUks8L3R5cGVfcmVmZXJlbmNlPgogICAgICAgICAgPF9zZWN1ZW5jZT4xPC9fc2VjdWVuY2U+CiAgICAgICAgPC9maWx0ZXI+CiAgICAgICAgPGZpbHRlcj4KICAgICAgICAgIDx1c2FnZV9wdWJsaWM+MDwvdXNhZ2VfcHVibGljPgogICAgICAgICAgPHR5cGVfZGF0YV9wcmltYXJ5PjE8L3R5cGVfZGF0YV9wcmltYXJ5PgogICAgICAgICAgPHR5cGVfcmVmZXJlbmNlPldPUks8L3R5cGVfcmVmZXJlbmNlPgogICAgICAgICAgPF9zZWN1ZW5jZT4yPC9fc2VjdWVuY2U+CiAgICAgICAgPC9maWx0ZXI+CiAgICAgIDwvZmlsdGVycz4KICAgICAgPGNvdW50cnlfbG9naWM+CiAgICAgICAgPGNvdW50cnk+CiAgICAgICAgICA8YWRkcmVzczE+e0FERFJFU1NfTElORV8xfTwvYWRkcmVzczE+CiAgICAgICAgICA8YWRkcmVzczI+e0FERFJFU1NfTElORV8yfTwvYWRkcmVzczI+CiAgICAgICAgICA8YWRkcmVzczM+e0FERFJFU1NfTElORV80fTwvYWRkcmVzczM+CiAgICAgICAgICA8X2lkPkVTPC9faWQ+CiAgICAgICAgPC9jb3VudHJ5PgogICAgICAgIDxjb3VudHJ5PgogICAgICAgICAgPGFkZHJlc3MxPntBRERSRVNTX0xJTkVfMX08L2FkZHJlc3MxPgogICAgICAgICAgPGFkZHJlc3MyPntBRERSRVNTX0xJTkVfMn08L2FkZHJlc3MyPgogICAgICAgICAgPGFkZHJlc3MzPntBRERSRVNTX0xJTkVfNH08L2FkZHJlc3MzPgogICAgICAgICAgPF9pZD5ERTwvX2lkPgogICAgICAgIDwvY291bnRyeT4KICAgICAgPC9jb3VudHJ5X2xvZ2ljPgogICAgPC9hZGRyZXNzX2RhdGE+CiAgICA8bGFuZ3VhZ2U+CiAgICAgIDxkZWZhdWx0X3ZhbHVlcz4KICAgICAgICA8QlBDN19kZWZhdWx0X2NvZGU+ZW4tVVM8L0JQQzdfZGVmYXVsdF9jb2RlPgogICAgICA8L2RlZmF1bHRfdmFsdWVzPgogICAgPC9sYW5ndWFnZT4KICAgIDx6aXBfY29kZT4KICAgICAgPGRlZmF1bHRfdmFsdWVzPgogICAgICAgIDxjb3VudHJ5PgogICAgICAgICAgPF9pZD5FUzwvX2lkPgogICAgICAgICAgPF9fdGV4dD4yODAwMTwvX190ZXh0PgogICAgICAgIDwvY291bnRyeT4KICAgICAgICA8Y291bnRyeT4KICAgICAgICAgIDxfaWQ+REU8L19pZD4KICAgICAgICAgIDxfX3RleHQ+MjgwMDI8L19fdGV4dD4KICAgICAgICA8L2NvdW50cnk+CiAgICAgIDwvZGVmYXVsdF92YWx1ZXM+CiAgICA8L3ppcF9jb2RlPgogICAgPGVtYWlsPgogICAgICA8ZmlsdGVycz4KICAgICAgICA8ZmlsdGVyPgogICAgICAgICAgPHVzYWdlX3B1YmxpYz4xPC91c2FnZV9wdWJsaWM+CiAgICAgICAgICA8dHlwZV9kYXRhX3ByaW1hcnk+MTwvdHlwZV9kYXRhX3ByaW1hcnk+CiAgICAgICAgICA8dHlwZV9yZWZlcmVuY2U+V09SSzwvdHlwZV9yZWZlcmVuY2U+CiAgICAgICAgICA8X3NlY3VlbmNlPjE8L19zZWN1ZW5jZT4KICAgICAgICA8L2ZpbHRlcj4KICAgICAgICA8ZmlsdGVyPgogICAgICAgICAgPHVzYWdlX3B1YmxpYz4xPC91c2FnZV9wdWJsaWM+CiAgICAgICAgICA8dHlwZV9kYXRhX3ByaW1hcnk +MTwvdHlwZV9kYXRhX3ByaW1hcnk+CiAgICAgICAgICA8dHlwZV9yZWZlcmVuY2U+SE9NRTwvdHlwZV9yZWZlcmVuY2U+CiAgICAgICAgICA8X3NlY3VlbmNlPjI8L19zZWN1ZW5jZT4KICAgICAgICA8L2ZpbHRlcj4KICAgICAgPC9maWx0ZXJzPgogICAgPC9lbWFpbD4KICA8L21hcHBpbmdzPgogIDx0cmFuc2Zvcm1hdGlvbnM+CiAgICA8b3JnYW5pemF0aW9uX2NvZGU+CiAgICAgIDx0cmFuc2Zvcm1hdGlvbj4KICAgICAgICA8Y2hhcmFjdGVycz4vPC9jaGFyYWN0ZXJzPgogICAgICAgIDxzZXBhcmF0b3I+Ozwvc2VwYXJhdG9yPgogICAgICAgIDxyZXBsYWNlX2J5Pl88L3JlcGxhY2VfYnk+CiAgICAgICAgPF9zZWN1ZW5jZT4xPC9fc2VjdWVuY2U+CiAgICAgIDwvdHJhbnNmb3JtYXRpb24+CiAgICAgIDx0cmFuc2Zvcm1hdGlvbj4KICAgICAgICA8Y2hhcmFjdGVycz7DkTt+PC9jaGFyYWN0ZXJzPgogICAgICAgIDxzZXBhcmF0b3I+Ozwvc2VwYXJhdG9yPgogICAgICAgIDxyZXBsYWNlX2J5Pi08L3JlcGxhY2VfYnk+CiAgICAgICAgPF9zZWN1ZW5jZT4yPC9fc2VjdWVuY2U+CiAgICAgIDwvdHJhbnNmb3JtYXRpb24+CiAgICA8L29yZ2FuaXphdGlvbl9jb2RlPgogIDwvdHJhbnNmb3JtYXRpb25zPgo8L3Jvb3Q+";
				//var vBase64 = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPGdsb2JhbF9jb25maWd1cmF0aW9uPgogIDxnbG9iYWxfcGFyYW1ldGVycz4KICAgIDx3c19nZXRfd29ya2Vycz4KICAgICAgPHJlcXVlc3RfZmlsdGVyPgogICAgICAgIDxleGNsdWRlX2NvbnRpbmdlbnRfd29ya2Vycz5GYWxzZTwvZXhjbHVkZV9jb250aW5nZW50X3dvcmtlcnM+CiAgICAgICAgPGV4Y2x1ZGVfZW1wbG95ZWVzPkZhbHNlPC9leGNsdWRlX2VtcGxveWVlcz4KICAgICAgICA8ZXhjbHVkZV9pbmFjdGl2ZV93b3JrZXJzPlRydWU8L2V4Y2x1ZGVfaW5hY3RpdmVfd29ya2Vycz4KICAgICAgPC9yZXF1ZXN0X2ZpbHRlcj4KICAgIDwvd3NfZ2V0X3dvcmtlcnM+CiAgPC9nbG9iYWxfcGFyYW1ldGVycz4KICA8bWFwcGluZ3M+CiAgICA8YWRkcmVzc19kYXRhPgogICAgICA8ZmlsdGVycz4KICAgICAgICA8ZmlsdGVyIHNlY3VlbmNlPSIxIj4KICAgICAgICAgIDx1c2FnZV9wdWJsaWM+MTwvdXNhZ2VfcHVibGljPgogICAgICAgICAgPHR5cGVfZGF0YV9wcmltYXJ5PjE8L3R5cGVfZGF0YV9wcmltYXJ5PgogICAgICAgICAgPHR5cGVfcmVmZXJlbmNlPldPUks8L3R5cGVfcmVmZXJlbmNlPgogICAgICAgIDwvZmlsdGVyPgogICAgICAgIDxmaWx0ZXIgc2VjdWVuY2U9IjIiPgogICAgICAgICAgPHVzYWdlX3B1YmxpYz4wPC91c2FnZV9wdWJsaWM+CiAgICAgICAgICA8dHlwZV9kYXRhX3ByaW1hcnk+MTwvdHlwZV9kYXRhX3ByaW1hcnk+CiAgICAgICAgICA8dHlwZV9yZWZlcmVuY2U+V09SSzwvdHlwZV9yZWZlcmVuY2U+CiAgICAgICAgPC9maWx0ZXI+CiAgICAgIDwvZmlsdGVycz4KICAgICAgPGNvdW50cnlfbG9naWM+CiAgICAgICAgPGNvdW50cnkgaWQ9IkVTIj4KICAgICAgICAgIDxhZGRyZXNzMT57QUREUkVTU19MSU5FXzF9PC9hZGRyZXNzMT4KICAgICAgICAgIDxhZGRyZXNzMj57QUREUkVTU19MSU5FXzJ9PC9hZGRyZXNzMj4KICAgICAgICAgIDxhZGRyZXNzMz57QUREUkVTU19MSU5FXzR9PC9hZGRyZXNzMz4KICAgICAgICA8L2NvdW50cnk+CiAgICAgICAgPGNvdW50cnkgaWQ9IkRFIj4KICAgICAgICAgIDxhZGRyZXNzMT57QUREUkVTU19MSU5FXzF9PC9hZGRyZXNzMT4KICAgICAgICAgIDxhZGRyZXNzMj57QUREUkVTU19MSU5FXzJ9PC9hZGRyZXNzMj4KICAgICAgICAgIDxhZGRyZXNzMz57QUREUkVTU19MSU5FXzR9PC9hZGRyZXNzMz4KICAgICAgICA8L2NvdW50cnk+CiAgICAgIDwvY291bnRyeV9sb2dpYz4KICAgIDwvYWRkcmVzc19kYXRhPgogICAgPGxhbmd1YWdlPgogICAgICA8ZGVmYXVsdF92YWx1ZXM+CiAgICAgICAgPEJQQzdfZGVmYXVsdF9jb2RlPmVuLVVTPC9CUEM3X2RlZmF1bHRfY29kZT4KICAgICAgPC9kZWZhdWx0X3ZhbHVlcz4KICAgIDwvbGFuZ3VhZ2U+CiAgICA8emlwX2NvZGU+CiAgICAgIDxkZWZhdWx0X3ZhbHVlcz4KICAgICAgICA8Y291bnRyeSBpZD0iRVMiPjI4MDAxPC9jb3VudHJ5PgogICAgICAgIDxjb3VudHJ5IGlkPSJERSI+MjgwMDI8L2NvdW50cnk+CiAgICAgIDwvZGVmYXVsdF92YWx1ZXM+CiAgICA8L3ppcF9jb2RlPgogICAgPGVtYWlsPgogICAgICA8ZmlsdGVycz4KICAgICAgICA8ZmlsdGVyIHNlY3VlbmNlPSIxIj4KICAgICAgICAgIDx1c2FnZV9wdWJsaWM+MTwvdXNhZ2VfcHVibGljPgogICAgICAgICAgPHR5cGVfZGF0YV9wcmltYXJ5PjE8L3R5cGVfZGF0YV9wcmltYXJ5PgogICAgICAgICAgPHR5cGVfcmVmZXJlbmNlPldPUks8L3R5cGVfcmVmZXJlbmNlPgogICAgICAgIDwvZmlsdGVyPgogICAgICAgIDxmaWx0ZXIgc2VjdWVuY2U9IjIiPgogICAgICAgICAgPHVzYWdlX3B1YmxpYz4xPC91c2FnZV9wdWJsaWM+CiAgICAgICAgICA8dHlwZV9kYXRhX3ByaW1hcnk+MTwvdHlwZV9kYXRhX3ByaW1hcnk+CiAgICAgICAgICA8dHlwZV9yZWZlcmVuY2U+SE9NRTwvdHlwZV9yZWZlcmVuY2U+CiAgICAgICAgPC9maWx0ZXI+CiAgICAgIDwvZmlsdGVycz4KICAgIDwvZW1haWw+CiAgPC9tYXBwaW5ncz4KICA8dHJhbnNmb3JtYXRpb25zPgogICAgPG9yZ2FuaXphdGlvbl9jb2RlPgogICAgICA8dHJhbnNmb3JtYXRpb24gc2VjdWVuY2U9IjEiPgogICAgICAgIDxjaGFyYWN0ZXJzPi8gPC9jaGFyYWN0ZXJzPgogICAgICAgIDxzZXBhcmF0b3I+Ozwvc2VwYXJhdG9yPgogICAgICAgIDxyZXBsYWNlX2J5Pl88L3JlcGxhY2VfYnk+CiAgICAgIDwvdHJhbnNmb3JtYXRpb24+CiAgICAgIDx0cmFuc2Zvcm1hdGlvbiBzZWN1ZW5jZT0iMiI+CiAgICAgICAgPGNoYXJhY3RlcnM+w5E7fjwvY2hhcmFjdGVycz4KICAgICAgICA8c2VwYXJhdG9yPjs8L3NlcGFyYXRvcj4KICAgICAgICA8cmVwbGFjZV9ieT4tPC9yZXBsYWNlX2J5PgogICAgICA8L3RyYW5zZm9ybWF0aW9uPgogICAgPC9vcmdhbml6YXRpb25fY29kZT4KICA8L3RyYW5zZm9ybWF0aW9ucz4KPC9nbG9iYWxfY29uZmlndXJhdGlvbj4=";

				var vServiceModel = this.getView().getModel("Base64");
				var changedData = {
					"value": vBase64
				};

                var oThat = this;
				var sUrl = "/Configurations(pck_code='SYN_WORKER',conf_code='SCE-CONFIG')";
				vServiceModel.update(sUrl, changedData, {
					success: function (oData, response) {
						sap.m.MessageToast.show(oThat.getView().getModel("i18n").getResourceBundle().getText("viewMessage4"));
					},
					error: function (oData, response) {
						sap.m.MessageToast.show(oThat.getView().getModel("i18n").getResourceBundle().getText("viewMessage5"));
					}
				});
			} else {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("viewMessage6"));
			}
		},
		createJSON: function () {
			var array = {
				"global_configuration": {
					"global_parameters": {
						"ws_get_workers": {
							"request_filter": {
								"exclude_contingent_workers": "",
								"exclude_employees": "",
								"exclude_inactive_workers": ""
							}
						}
					},
					"mappings": {
						"address_data": {
							"filters": {
								"filter": []
							},
							"country_logic": {
								"country": []
							}
                        },
						"starting_date": {
							"mappings": {
								"mapping": []
							}
						},
						"language": {
							"default_values": {
								"BPC7_default_code": ""
							}
						},
						"zip_code": {
							"default_values": {
								"country": []
							}
						},
						"email": {
							"filters": {
								"filter": []
							}
						},
						"custom_fields": {
							"fields": {
								"field": []
							}
						}
					},
					"transformations": {
						"organization_code": {
							"transformation": []
						}
					},
					"retention_period": {
						// "logic_type": "",
						// "employee_details": "",
						// "complete_employee_data": ""
					}
				}
			};
			return array;
		},
		getUpdatedArray: function () {
			var array = this.createJSON();

			//REQUEST FILTER
			var vContigenteWorkers;
			var vExcludeEmployees;
			var vInactiveWorkers;

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

			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_contingent_workers = vContigenteWorkers;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_employees = vExcludeEmployees;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_inactive_workers = vInactiveWorkers;

			//MAPPING CONFIGURATION - COMMON ADDRESS
			var vItems4 = this.getView().byId("table0").getItems();
			for (var n = 0; n < vItems4.length; n++) {
				var cells4 = vItems4[n].getAggregation("cells");
				var vKey6 = cells4[0].getProperty("selectedKey");
				var vKey7 = cells4[1].getProperty("selectedKey");
				var vKey8 = cells4[2].getProperty("selectedKey");
				var vValue9 = (cells4[3].getProperty("value").replace('_', ' ')) * 1;

				array.global_configuration.mappings.address_data.filters.filter.push({
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
						array.global_configuration.mappings.address_data.country_logic.country.push({
							address1: country_logic[0],
							address2: country_logic[1],
							address3: country_logic[2],
							_id: vValue11
						});
						country_logic = [];
					}
				}
			}

			//MAPPING CONFIGURATION - STARTING DATE
			var vItems7 = this.getView().byId("table0_SD").getItems();
			for (var m = 0; m < vItems7.length; m++) {
				var cells7 = vItems7[m].getAggregation("cells");
				var vKey1SD = cells7[0].getProperty("selectedKey");
				var vValue5SD = (cells7[1].getProperty("value").replace('_', ' ')) * 1;

				array.global_configuration.mappings.starting_date.mappings.mapping.push({
					sender_node: vKey1SD,
					_secuence: vValue5SD
				});
			}
            
			//MAPPING CONFIGURATION - LANGUAGE
			var vBPC7_default_code;

			vBPC7_default_code = this.getView().byId("combo01").getSelectedKey();
			array.global_configuration.mappings.language.default_values.BPC7_default_code = vBPC7_default_code;

			//MAPPING CONFIGURATION - ZIP CODE
			var vItems1 = this.getView().byId("table0_1603812570312").getItems();
			for (var i = 0; i < vItems1.length; i++) {
				var cells1 = vItems1[i].getAggregation("cells");
				var vKey = cells1[0].getProperty("selectedKey");
				var vValue = cells1[1].getProperty("value");

				array.global_configuration.mappings.zip_code.default_values.country.push({
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

				array.global_configuration.mappings.email.filters.filter.push({
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
					replace_by: vValue3
						//_secuence: vValue4
				});
			}

			//CUSTOM FIELDS - FIELD/VALUE
			var vItems6 = this.getView().byId("table0_1605526253660").getItems();
			for (var k = 0; k < vItems6.length; k++) {
				var cells6 = vItems6[k].getAggregation("cells");
				var vValue21 = cells6[2].getProperty("text");
				var vValue31 = cells6[1].getProperty("value");
				//if (vValue31.replace(/\s/g, '').length !== 0) {
				array.global_configuration.mappings.custom_fields.fields.field.push({
					_custom_id: vValue21,
					//"#text": vValue31
				});
				array.global_configuration.mappings.custom_fields.fields.field[k]['#text'] = vValue31;
				//}
			}
			for (var a = 0; a < array.global_configuration.mappings.custom_fields.fields.field.length; a++) {
				var aux = array.global_configuration.mappings.custom_fields.fields.field[a]['#text'].replace(/\s/g, '').length;
				if (aux == 0) {
					array.global_configuration.mappings.custom_fields.fields.field.splice(a, 1);
				}
			}

			//RETENTION PERIOD
			var vLogicType = "0" + (this.getView().byId("group0").getSelectedIndex() + 1);
			var vEmployeeDetail = this.getView().byId("text_mask1").getValue().replaceAll('_', ' ') * 1;
			var vCompleteEmployeeData = this.getView().byId("text_mask2").getValue().replaceAll('_', ' ') * 1;

			if (vLogicType == '03') {
				array.global_configuration.retention_period.logic_type = vLogicType;
				array.global_configuration.retention_period.employee_details = vEmployeeDetail;
				array.global_configuration.retention_period.complete_employee_data = vCompleteEmployeeData;
			} else {
				array.global_configuration.retention_period.logic_type = vLogicType;
				//array.global_configuration.retention_period.employee_details = "";
				//array.global_configuration.retention_period.complete_employee_data = "";
				//array.global_configuration.retention_period.pop();
				//array.global_configuration.retention_period.pop();
			}

			return array;
		},
		transformToBase64: function (oArray) {
			var base64;
			var oXML = $.json2xml(oArray);

			var string1 = oXML.split("<custom_fields>");
			string1 = string1[0];

			var string2 = oXML.substring(oXML.indexOf("<custom_fields>"));
			var string2 = string2.substring(0, string2.indexOf("</custom_fields>") + 16);

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
			var string3 = oXML.split("</custom_fields>");
			string3 = string3[1];

			oXML = string1 + string2 + string3;
			base64 = window.btoa(oXML);
			return base64;
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
		transformXML2JSON_OLD: function (oXML) {
			//vXML.childNodes[0].childNodes[1].childNodes[2].childNodes[0].childNodes[0].childNodes[0].data
			var array = this.createJSON();

			var vArray = oXML.childNodes;
			var vGlobalConfiguration = vArray[0].childNodes;

			var vGlobalParameters = vGlobalConfiguration[0].childNodes;

			var vWSGetWorkers = vGlobalParameters[0].childNodes;
			var vRequestFilter = vWSGetWorkers[0].childNodes;
			var vContingentWorkers = vRequestFilter[0].childNodes[0].textContent;
			var vEmployees = vRequestFilter[1].childNodes[0].textContent;
			var vInactiveWorkers = vRequestFilter[2].childNodes[0].textContent;

			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_contingent_workers = vContingentWorkers;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_employees = vEmployees;
			array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_inactive_workers = vInactiveWorkers;

			var vMappings = vGlobalConfiguration[1].childNodes;

			var vAddressData = vMappings[0].childNodes;
			var vFilters1 = vAddressData[0].childNodes;
			for (var n1 = 0; n1 < vFilters1.length; n1++) {
				var vFilter1 = vFilters1[n1].childNodes;
				var vVar4 = vFilters1[n1].getAttribute("secuence") * 1;
				if (vFilter1.length != 0) {
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
						var vVar3 = vFilter1[2].childNodes[0].textContent;
					} else {
						vVar3 = " ";
					}
				}

				array.global_configuration.mappings.address_data.filters.filter.push({
					usage_public: vVar1,
					type_data_primary: vVar2,
					type_reference: vVar3,
					_secuence: vVar4
				});
			}

			var vCountryLogic = vAddressData[1].childNodes;
			for (var n2 = 0; n2 < vCountryLogic.length; n2++) {
				var vCountry1 = vCountryLogic[n2].childNodes;
				if (vCountry1.length !== 0) {
					var vVar8 = vCountryLogic[0].id;
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
					array.global_configuration.mappings.address_data.country_logic.country.push({
						address1: vVar5,
						address2: vVar6,
						address3: vVar7,
						_id: vVar8
					});
				}
			}

            /*
			var vStarting_Date = vMappings[1].childNodes;
			var vMappingsSD = vStarting_Date[0].childNodes;
			for (var n7 = 0; n7 < vMappingsSD.length; n7++) {
				var vMapping = vMappingsSD[n7].childNodes;
				var vVar14SD = vMappingsSD[n7].getAttribute("secuence") * 1;
				if (vMapping.length != 0) {
					if (vMapping[0].childNodes.length !== 0) {
						var vVar11A = vMapping[0].childNodes[0].textContent;
					} else {
						vVar11A = " ";
					}
				}

				array.global_configuration.mappings.starting_date.mappings.mapping.push({
					sender_node: vVar11A,
					_secuence: vVar14SD
				});
            }
            */
            
			var vLanguage = vMappings[1].childNodes;
			var vDefaultValues1 = vLanguage[0].childNodes;
			if (vDefaultValues1.length !== 0) {
				if (vDefaultValues1[0].childNodes.length != 0) {
					var vBPC7_default_code = vDefaultValues1[0].childNodes[0].textContent;
					array.global_configuration.mappings.language.default_values.BPC7_default_code = vBPC7_default_code;
				} else {
					array.global_configuration.mappings.language.default_values.BPC7_default_code = "";
				}
			}

			var vZipCode = vMappings[2].childNodes;
			var vDefaultValues2 = vZipCode[0].childNodes;
			for (var n3 = 0; n3 < vDefaultValues2.length; n3++) {
				var vVar9 = vDefaultValues2[n3].id;
				if (vDefaultValues2[n3].childNodes.length !== 0) {
					var vVar10 = vDefaultValues2[n3].childNodes[0].textContent;
					array.global_configuration.mappings.zip_code.default_values.country.push({
						_id: vVar9,
						__text: vVar10
					});
				}
			}

			var vEmail = vMappings[3].childNodes;
			var vFilters2 = vEmail[0].childNodes;
			for (var n4 = 0; n4 < vFilters2.length; n4++) {
				var vFilter2 = vFilters2[n4].childNodes;
				var vVar14 = vFilters2[n4].getAttribute("secuence") * 1;
				if (vFilter2.length != 0) {
					if (vFilter2[0].childNodes.length !== 0) {
						var vVar11 = vFilter2[0].childNodes[0].textContent;
					} else {
						vVar11 = " ";
					}
					if (vFilter2[1].childNodes.length !== 0) {
						var vVar12 = vFilter2[1].childNodes[0].textContent;
					} else {
						vVar12 = " ";
					}
					if (vFilter2[2].childNodes.length !== 0) {
						var vVar13 = vFilter2[2].childNodes[0].textContent;
					} else {
						vVar13 = " ";
					}
				}

				array.global_configuration.mappings.email.filters.filter.push({
					usage_public: vVar11,
					type_data_primary: vVar12,
					type_reference: vVar13,
					_secuence: vVar14
				});
			}

			var vCustomFields = vMappings[4].childNodes;
			var vCustomField = vCustomFields[0].childNodes;
			for (var n6 = 0; n6 < vCustomField.length; n6++) {
				var vVar19 = vCustomField[n6].getAttribute("custom_id");
				if (vCustomField[n6].childNodes.length !== 0) {
					var vVar20 = vCustomField[n6].childNodes[0].textContent;
				} else {
					vVar20 = " ";
				}

				array.global_configuration.mappings.custom_fields.fields.field.push({
					id: vVar19,
					value: vVar20
				});
			}

			var vTransformations = vGlobalConfiguration[2].childNodes;
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
					replace_by: vVar17
						//_secuence: vVar18
				});
			}

			var vRetentionPeriod = vGlobalConfiguration[3].childNodes;
			var vLogicType = (vRetentionPeriod[0].textContent.substring(1) * 1) - 1;

			if (vLogicType == 2) {
				var vEmployeeDetails = vRetentionPeriod[1].textContent;
				var vCompleteEmployeeData = vRetentionPeriod[2].textContent;

				array.global_configuration.retention_period.logic_type = vLogicType;
				array.global_configuration.retention_period.employee_details = vEmployeeDetails;
				array.global_configuration.retention_period.complete_employee_data = vCompleteEmployeeData;

				this.getView().byId("element12").setVisible(true);
				this.getView().byId("element3").setVisible(true);
			} else {
				array.global_configuration.retention_period.logic_type = vLogicType;
				array.global_configuration.retention_period.employee_details = "";
				array.global_configuration.retention_period.complete_employee_data = "";

				this.getView().byId("element12").setVisible(false);
				this.getView().byId("element3").setVisible(false);
			}

			return array;
        },
        
		transformXML2JSON: function (oXML) {
			var oThis = this;

			var vGlobalParameters;
			var vMappings;
			var vTransformations;
			var vRetentionPeriod;
			var vAddressData;
			var vStarting_Date;
			var vLanguage;
			var vZipCode;
			var vEmail;
			var vCustomFields;

			var array = this.createJSON();

			var vArray = oXML.childNodes;
			var vGlobalConfiguration = vArray[0].childNodes;

			vGlobalConfiguration.forEach(function (entry) {
				//GLOBAL PARAMETER
				if (entry.nodeName == "global_parameters") {
					vGlobalParameters = entry.childNodes;

					//Global Parameters
					var vWSGetWorkers = vGlobalParameters[0].childNodes;
					var vRequestFilter = vWSGetWorkers[0].childNodes;
					var vContingentWorkers = vRequestFilter[0].childNodes[0].textContent;
					var vEmployees = vRequestFilter[1].childNodes[0].textContent;
					var vInactiveWorkers = vRequestFilter[2].childNodes[0].textContent;

					array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_contingent_workers = vContingentWorkers;
					array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_employees = vEmployees;
					array.global_configuration.global_parameters.ws_get_workers.request_filter.exclude_inactive_workers = vInactiveWorkers;
				}

				//MAPPINGS
				if (entry.nodeName == "mappings") {
					vMappings = entry.childNodes;

					vMappings.forEach(function (entry) {
						// address data
						if (entry.nodeName == "address_data") {
							vAddressData = entry.childNodes;
							var vVar1;
							var vVar2;
							var vVar3;
							var vFilters1 = vAddressData[0].childNodes;
							vFilters1.forEach(function (entry) {
								if (entry.nodeName == "filter") {
									var vFilter1 = entry.childNodes;
									var vVar4 = entry.getAttribute("secuence") * 1;
									vFilter1.forEach(function (entry) {
										if (entry.nodeName == "usage_public") {
											if (entry.childNodes.length !== 0) {
												vVar1 = entry.childNodes[0].textContent;
											} else {
												vVar1 = " ";
											}
										}
										if (entry.nodeName == "type_data_primary") {
											if (entry.childNodes.length !== 0) {
												vVar2 = entry.childNodes[0].textContent;
											} else {
												vVar2 = " ";
											}
										}
										if (entry.nodeName == "type_reference") {
											if (entry.childNodes.length !== 0) {
												vVar3 = entry.childNodes[0].textContent;
											} else {
												vVar3 = " ";
											}
										}
									})

									array.global_configuration.mappings.address_data.filters.filter.push({
										usage_public: vVar1,
										type_data_primary: vVar2,
										type_reference: vVar3,
										_secuence: vVar4
									});
								}
							})

							var vVar5;
							var vVar6;
							var vVar7;
							var vVar8;
							var vCountryLogic = vAddressData[1].childNodes;
							vCountryLogic.forEach(function (entry) {
								if (entry.nodeName == "country") {
									var vCountry1 = entry.childNodes;
									if (vCountry1.length !== 0) {
										vVar8 = entry.id;
										if (vCountry1[0].childNodes.length != 0) {
											vVar5 = vCountry1[0].childNodes[0].textContent;
										} else {
											vVar5 = " ";
										}
										if (vCountry1[1].childNodes.length != 0) {
											vVar6 = vCountry1[1].childNodes[0].textContent;
										} else {
											vVar6 = " ";
										}
										if (vCountry1[2].childNodes.length != 0) {
											vVar7 = vCountry1[2].childNodes[0].textContent;
										} else {
											vVar7 = " ";
										}
										array.global_configuration.mappings.address_data.country_logic.country.push({
											address1: vVar5,
											address2: vVar6,
											address3: vVar7,
											_id: vVar8
										});
									}
								}
							})

						}
						//starting date
						if (entry.nodeName == "starting_date") {
							vStarting_Date = entry.childNodes;

							vStarting_Date.forEach(function (entry) {
								if (entry.nodeName == "mappings") {
									var vMappingsSD = entry.childNodes;
									for (var n7 = 0; n7 < vMappingsSD.length; n7++) {
										var vMapping = vMappingsSD[n7].childNodes;
										var vVar14SD = vMappingsSD[n7].getAttribute("secuence") * 1;
										if (vMapping.length != 0) {
											if (vMapping[0].childNodes.length !== 0) {
												var vVar11A = vMapping[0].childNodes[0].textContent;
											} else {
												vVar11A = " ";
											}
										}

										array.global_configuration.mappings.starting_date.mappings.mapping.push({
											sender_node: vVar11A,
											_secuence: vVar14SD
										});
									}
								}
							})
						}
						//language
						if (entry.nodeName == "language") {
							vLanguage = entry.childNodes;

							//Language
							var vBPC7_default_code;
							vLanguage.forEach(function (entry) {
								if (entry.nodeName == "default_values") {
									var vDefaultValues1 = entry.childNodes;
									vDefaultValues1.forEach(function (entry) {
										if (entry.nodeName == "BPC7_default_code") {
											if (entry.childNodes.length != 0) {
												vBPC7_default_code = entry.childNodes[0].textContent;
												array.global_configuration.mappings.language.default_values.BPC7_default_code = vBPC7_default_code;
											} else {
												array.global_configuration.mappings.language.default_values.BPC7_default_code = "";
											}
										}
									})
								}
							})
						}
						//zip code
						if (entry.nodeName == "zip_code") {
							vZipCode = entry.childNodes;

							//Zip Code
							vZipCode.forEach(function (entry) {
								if (entry.nodeName == "default_values") {
									var vDefaultValues2 = entry.childNodes;
									vDefaultValues2.forEach(function (entry) {
										if (entry.nodeName == "country") {
											var vVar9 = entry.id;
											if (entry.childNodes.length !== 0) {
												var vVar10 = entry.childNodes[0].textContent;
												array.global_configuration.mappings.zip_code.default_values.country.push({
													_id: vVar9,
													__text: vVar10
												});
											}
										}
									})
								}
							})
						}
						//email
						if (entry.nodeName == "email") {
							vEmail = entry.childNodes;

							//Email
							var vVar11;
							var vVar12;
							var vVar13;
							var vVar14;
							vEmail.forEach(function (entry) {
								if (entry.nodeName == "filters") {
									var vFilters2 = entry.childNodes;
									vFilters2.forEach(function (entry) {
										if (entry.nodeName == "filter") {
											var vFilter2 = entry.childNodes;
											vVar14 = entry.getAttribute("secuence") * 1;
											vFilter2.forEach(function (entry) {
												if (entry.nodeName == "usage_public") {
													if (entry.childNodes.length !== 0) {
														vVar11 = entry.childNodes[0].textContent;
													} else {
														vVar11 = " ";
													}
												}
												if (entry.nodeName == "type_data_primary") {
													if (entry.childNodes.length !== 0) {
														vVar12 = entry.childNodes[0].textContent;
													} else {
														vVar12 = " ";
													}
												}
												if (entry.nodeName == "type_reference") {
													if (entry.childNodes.length !== 0) {
														vVar13 = entry.childNodes[0].textContent;
													} else {
														vVar13 = " ";
													}
												}
											})
											array.global_configuration.mappings.email.filters.filter.push({
												usage_public: vVar11,
												type_data_primary: vVar12,
												type_reference: vVar13,
												_secuence: vVar14
											});
										}
									})
								}
							})
						}
						//custom fields
						if (entry.nodeName == "custom_fields") {
							vCustomFields = entry.childNodes;

							//Custom Fields
							var vVar19;
							var vVar20;
							vCustomFields.forEach(function (entry) {
								var vCustomField = entry.childNodes;
								vCustomField.forEach(function (entry) {
									vVar19 = entry.getAttribute("custom_id");
									if (entry.childNodes.length !== 0) {
										vVar20 = entry.childNodes[0].textContent;
									} else {
										vVar20 = " ";
									}

									array.global_configuration.mappings.custom_fields.fields.field.push({
										id: vVar19,
										value: vVar20
									});

								})

							})
						}
					})
				}
				//TRANSFORMATIONS
				if (entry.nodeName == "transformations") {
					vTransformations = entry.childNodes;

					//Transformations
					var vVar15;
					var vVar16;
					var vVar17;
					vTransformations.forEach(function (entry) {
						var vTransformation = entry.childNodes;

						vTransformation[0].childNodes.forEach(function (entry) {
							if (entry.nodeName == "characters") {
								if (entry.childNodes.length !== 0) {
									vVar15 = entry.childNodes[0].textContent;
								} else {
									vVar15 = " ";
								}
							}
							if (entry.nodeName == "separator") {
								if (entry.childNodes.length !== 0) {
									vVar16 = entry.childNodes[0].textContent;
								} else {
									vVar16 = " ";
								}
							}
							if (entry.nodeName == "replace_by") {
								if (entry.childNodes.length !== 0) {
									vVar17 = entry.childNodes[0].textContent;
								} else {
									vVar17 = " ";
								}
							}
						})

						array.global_configuration.transformations.organization_code.transformation.push({
							characters: vVar15,
							separator: vVar16,
							replace_by: vVar17
						});
					})
				}
				//RETENTION PERIOD
				if (entry.nodeName == "retention_period") {
					vRetentionPeriod = entry.childNodes;

					//Retention Period
					var vLogicType = (vRetentionPeriod[0].textContent.substring(1) * 1) - 1;

					if (vLogicType == 2) {
						var vEmployeeDetails = vRetentionPeriod[1].textContent;
						var vCompleteEmployeeData = vRetentionPeriod[2].textContent;

						array.global_configuration.retention_period.logic_type = vLogicType;
						array.global_configuration.retention_period.employee_details = vEmployeeDetails;
						array.global_configuration.retention_period.complete_employee_data = vCompleteEmployeeData;

						oThis.getView().byId("element12").setVisible(true);
						oThis.getView().byId("element3").setVisible(true);
					} else {
						array.global_configuration.retention_period.logic_type = vLogicType;
						array.global_configuration.retention_period.employee_details = "";
						array.global_configuration.retention_period.complete_employee_data = "";

						oThis.getView().byId("element12").setVisible(false);
						oThis.getView().byId("element3").setVisible(false);
					}
				}
			})

			return array;
        },
        
		callCPIShapeIn_CustomFields: function () {

			//var url = "/CPI-WD2PD/pd/custom_fields";
			var url = "/CPI-WD2PD_Dest/md/peopledoc/custom_fields";
			var vThat = this;
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
					success: function (result) {
						var oData = vThat.getView().getModel("ModelJSON").getData();
						var customFields = new JSONModel();
						var array = [];
						for (var i = 0; i < result.length; i++) {
							for (var j = 0; j < result[i].localized_labels.length; j++) {
								var oLanguage = sap.ui.getCore().getConfiguration().getLanguage();
								if (oLanguage == result[i].localized_labels[j].language_code) {

									for (var a = 0; a < oData.global_configuration.mappings.custom_fields.fields.field.length; a++) {
										if (oData.global_configuration.mappings.custom_fields.fields.field[a].id === result[i].id) {
											var vValueA = oData.global_configuration.mappings.custom_fields.fields.field[a].value;
											break;
										} else {
											vValueA = "";
										}
									}
									var oLabel1 = result[i].localized_labels[j].value + "(" + result[i].id + ")";
									array.push({
										id: result[i].id,
										//label: result[i].label,
										//label: result[i].localized_labels[j].value,
										label: oLabel1,
										language_code: result[i].localized_labels[j].language_code,
										value: vValueA,
									});
								}
							}
						}
						if (array.length == 0) {
							for (var s = 0; s < result.length; s++) {
								for (var b = 0; b < oData.global_configuration.mappings.custom_fields.fields.field.length; b++) {
									if (oData.global_configuration.mappings.custom_fields.fields.field[b].id === result[s].id) {
										var vValueB = oData.global_configuration.mappings.custom_fields.fields.field[b].value;
										break;
									} else {
										vValueB = "";
									}
								}
								var oLabel2 = result[s].label + "\u00a0" + "(" + result[s].id + ")";
								array.push({
									id: result[s].id,
									//label: result[s].label,
									label: oLabel2,
									language_code: sap.ui.getCore().getConfiguration().getLanguage(),
									value: vValueB,
								});
							}
						}
						customFields.oData = array;
						vThat.getView().setModel(customFields, "CustomFields");
					},
					error: function (e) {}
				});
			}
		},
		callCPIShapeIn_Language: function () {

			//	var url = "/CPI-WD2PD/pd/client";
			var url = "/CPI-WD2PD_Dest/md/peopledoc/client";
			var vThat = this;
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

			var oEmployeeDetail = this.getView().byId("text_mask1").getValue().replaceAll('_', ' ') * 1;
			var oCompleteEmployeeData = this.getView().byId("text_mask2").getValue().replaceAll('_', ' ') * 1;
			var oSelRadioButton = this.getView().byId("group0");

			if (oSelRadioButton.getSelectedIndex() == 2) {
				if (oEmployeeDetail > 0) {
					this.getView().byId("text_mask1").setValueState("None");
					aux = true;
				} else {
					this.getView().byId("text_mask1").setValueState("Error");
					return false;
				}

				if (oCompleteEmployeeData > 0) {
					this.getView().byId("text_mask2").setValueState("None");
					aux = true;
				} else {
					this.getView().byId("text_mask2").setValueState("Error");
					return false;
				}

				if (oCompleteEmployeeData > oEmployeeDetail) {
					this.getView().byId("text_mask1").setValueState("None");
					this.getView().byId("text_mask2").setValueState("None");
					aux = true;
				} else {
					this.getView().byId("text_mask1").setValueState("Error");
					this.getView().byId("text_mask2").setValueState("Error");
					return false;
				}
			}

			return aux;
		},
		selectLogicType: function (oObj1) {

			var oSelRadioButton = oObj1.getParameter("selectedIndex");
			if (oSelRadioButton == 2) {
				this.getView().byId("element12").setVisible(true);
				this.getView().byId("element3").setVisible(true);
			} else {
				this.getView().byId("element12").setVisible(false);
				this.getView().byId("element3").setVisible(false);
			}
		},
		radiobuttonModel: function () {
			var oObject = {
				selectedIndex: 0
			};
			var oModel = new JSONModel(oObject);
			this.getView().setModel(oModel, "RadioButtonModel");
		}
	});
}, /* bExport= */ true);
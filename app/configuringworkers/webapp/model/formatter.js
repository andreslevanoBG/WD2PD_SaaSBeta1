sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		visDeleteRep: function (sValue) {
			if (sValue && sValue != "") {
				return true;
			}
			return false;
		},

		visDeprecated: function (sValue) {
			if (sValue) {
				return true;
			}
			return false;
		},

		stateStatusCheck: function (sValue) {
			if (sValue == "X") {
				return "Error";
			} else if (sValue == "C") {
				return "None";
			} else {
				return "Success";
			}
		},
		visDocType: function (sValue) {
			if (sValue.length > 0) {
				return true;
			}
			return false;
		},

		enabDeleteBpt: function (sValue) {
			if (sValue) {
				if (sValue.length > 0) {
					return false;
				} else {
					return true;
				}
			} else {
				return true;
			}
		},

		enabReferenceBpt: function (sValue) {
			if (sValue) {
				if (sValue.length > 0) {
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		},

		stateSMS: function (sValue) {
			if (sValue) {
				return "Success";
			} else {
				return "Error";
			}
		},

		iconSMS: function (sValue) {
			if (sValue) {
				return "sap-icon://message-success";
			} else {
				return "sap-icon://message-error";
			}
		},

		iconStatusCheck: function (sValue) {
			if (sValue == "X") {
				return "sap-icon://message-error";
			} else if (sValue == "C") {
				return "";
			} else {
				return "sap-icon://message-success";
			}
		},

		enableKey: function (sValue) {
			if (sValue) {
				return "A";
			} else {
				return "I";
			}
		},

		enableActive: function (sValue, sValue2) {
			if (sValue || sValue2) {
				return false;
			} else {
				return true;
			}
		},
		
		modeSigners: function (sValue, sValue2) {
			if (sValue || sValue2) {
				return "None";
			} else {
				return "SingleSelectLeft";
			}
		},
		
		enableActiveClear: function (sValue, sValue2, sValue3) {
			if (sValue || sValue2 || sValue3 == "") {
				return false;
			} else {
				return true;
			}
		},

		enabledActive2: function (sValue) {
			if (sValue) {
				return false;
			} else {
				return true;
			}
		},

		enableActive2: function (sValue2) {
			if (sValue2 && sValue2 != "") {
				return false;
			} else {
				return true;
			}
		},

		lastPage: function (s1, s2) {
			if (s1 == "" && s2 != "") {
				return "Last Page";
			} else {
				return s1;
			}
		},

		toolActive: function (sValue) {
			if (sValue) {
				return "Template is active";
			} else {
				return "Template is not active";
			}
		},

		toolConf: function (sValue) {
			if (sValue == "X") {
				return "Template is configured";
			} else {
				return "Template is not configured";
			}
		},

		toolPlanned: function (sValue) {
			if (sValue == "X") {
				return "Template is planned";
			} else {
				return "Template is not planned";
			}
		},

		toolPeople: function (sValue) {
			if (sValue == "X") {
				return "Template is active in PeopleDoc";
			} else {
				return "Template is not active in PeopleDoc";
			}
		},

		EnabStatusIcon: function (sValue, sValue2) {
			if (sValue && sValue2 == "X") {
				return "sap-icon://thumb-up";
			} else {
				return "sap-icon://thumb-down";
			}
		},
		EnabStatus: function (sValue, sValue2) {

			if (sValue && sValue2 == "X") {
				return "Success";
			} else {
				return "Error";
			}
		},

		DeleteTemplate: function (sValue, sValue2) {
			if (!sValue && sValue2 == "X") {
				return true;
			}
			return false;
		},

		visibleOpenTrust: function (sValue) {
			var oSignTypesModel = this.getModel("signtypes");
			var singTypesData = oSignTypesModel.getData();
			var typeSignData = singTypesData.find(styp => styp.id === sValue);
			if (typeSignData) {
				if (typeSignData.backend_code == "docusign_protect_and_sign") { //OPENTRUST
					//	if (sValue == "sage-ind") {
					return true;
				} else {
					return false;
				}
			}
		},

		EnabStatusIconX: function (sValue) {
			if (sValue === "X") {
				return "sap-icon://thumb-up";
			} else {
				return "sap-icon://thumb-down";
			}
		},
		EnabStatusIconX2: function (sValue) {
			if (sValue === "X") {
				return "sap-icon://accept";
			} else {
				return "sap-icon://decline";
			}
		},
		EnabStatusIconX3: function (sValue) {
			if (sValue === "X") {
				return "sap-icon://accept";
			} else {
				return "sap-icon://less";
			}
		},
		EnabStatusIconX4: function (sValue) {
			if (sValue === "X") {
				return "sap-icon://fob-watch";
			} else {
				return "sap-icon://less";
			}
		},
		EnabStatusX: function (sValue) {
			if (sValue === "X") {
				return "Success";
			} else {
				return "Error";
			}
		},
		EnabStatusX2: function (sValue) {
			if (sValue === "X") {
				return "Success";
			} else {
				return "None";
			}
		},
		Update: function (sValue) {
			if (sValue) {
				var date1 = sValue.substring(0, 10);
				var date2 = sValue.substring(11);
				var date3 = date2.substring(0, 8);
				return date1 + " " + date3;
			} else {
				return "";
			}
		},

		executePlan: function (sValue) {
			if (sValue) {
				return 0;
			}
			return 1;
		},
		enablePlan: function (s1) {
			if (s1) {
				return false;
			}
			return true;
		},
		ontimePlan: function (sValue) {
			if (sValue) {
				return 0;
			}
			return 1;
		},
		timePlan: function (sValue) {
			if (sValue) {
				return sValue;
			}
			// return 1;
		},
		datePlan: function (sValue) {
			if (sValue) {
				return sValue;
			}
			// return 1;
		},

		checkPlan: function (s1, s2, s3) {
			if (s1 == "W" && s2) {
				var res = s2.indexOf(s3);
				if (res < 0) {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		},
		PlanStatus: function (sValue) {
			if (sValue) {
				return "Success";
			} else {
				return "Error";
			}
		},
		visDays: function (s1) {
			if (s1 == "W") {
				return true;
			}
			return false;
		},
		visDays2: function (s1) {
			if (s1 == "M") {
				return true;
			}
			return false;
		},
		visDays3: function (s1) {
			if (s1 == "D") {
				return true;
			} else if (s1 == "M") {
				return false;
			} else if (s1 == "W") {
				return false;
			}
			return true;
		},
		highlightField: function (oParam1, oParam2) {
			if (oParam1 === "attribute") {
				return "Error";
			} else if (oParam1 === "structure") {
				if (oParam2 === "unbounded") {

				} else {
					return "Warning";
				}
			} else if (oParam1 === "field") {
				return "Success";
			}
		},
		PlanStatusText: function (sValue) {
			if (sValue) {
				return "Active";
			} else {
				return "Inactive";
			}
		},
		setColor: function (oParam1, oParam2) {
			if (oParam1 === "structure") {
				if (oParam2 === "unbounded") {
					return "None";
				} else {
					return "Warning";
				}
			} else if (oParam1 === "attribute") {
				return "Error";
			} else if (oParam1 === "field") {
				return "Success";
			} else {
				return "None";
			}
		},

		enabledValueGV: function (sValue) {
			if (sValue == "EXPRE") {
				return true;
			}
			return false;
		},

		enabledButtonGV: function (sValue) {
			if (sValue == "EXPRE") {
				return false;
			}
			return true;
		},

		setIcon: function (oParam1, oParam2) {
			if (oParam1 === "structure") {
				if (oParam2 === "unbounded") {
					//return "sap-icon://bullet-text";
					return "sap-icon://table-view";
				} else {
					return "sap-icon://overflow";
				}
			} else if (oParam1 === "attribute") {
				//return "sap-icon://overlay";
			} else if (oParam1 === "field") {
				return "sap-icon://along-stacked-chart";
			} else {
				return "sap-icon://along-stacked-chart";
			}
		}

	};

});
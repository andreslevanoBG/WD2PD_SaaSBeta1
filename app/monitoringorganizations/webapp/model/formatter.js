sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},
		IconError: function (sValue) {
			if (sValue == "E") {
				return "sap-icon://message-error";
			} else {
				return "";
			}
		},
		ItemButEnabled: function (sValue) {
			if (sValue == "S") {
				return false;
			} else if (sValue == "E") {
				return true;
			} else if (sValue == "R") {
				return false;
			}
		},
		VisError: function (sValue, sValue2) {
			if (sValue == "E" && sValue2 !== null) {
				return true;
			} else {
				return false;
			}
		},
		ItemStatus2: function (sValue) {
			if (sValue == "S") {
				return "Success";
			} else if (sValue == "E") {
				return "Error";
			} else if (sValue == "R") {
				return "Warning";
			} else if (sValue == "D") {
				return "Discarded";
			}
		},
		visStatusS: function (sValue) {
			if (sValue == "S") {
				return true;
			} else if (sValue == "E") {
				return false;
			} else if (sValue == "R") {
				return false;
			}
		},
		visStatusE: function (sValue) {
			if (sValue == "E") {
				return true;
			} else if (sValue == "S") {
				return false;
			} else if (sValue == "R") {
				return false;
			}
		},

		duration: function (sValue, sValue2) {
			var oFormatOptions = {
				groupingEnabled: true
			};
			var local = sap.ui.getCore().getConfiguration().getLocale();
			var oFloatFormat = sap.ui.core.format.NumberFormat.getFloatInstance(oFormatOptions, local);
			if (sValue == "0") {
				var date1 = new Date();
				var date2 = new Date(sValue2);
				var diff = (date1.getTime() - date2.getTime()) / 1000;
				var diff2 = oFloatFormat.format(diff);
				var text = "Duration: " + diff2 + " secs";
				//var text1 = text.toString().replace(".", ",");
				return text;
			}
			var sVal = oFloatFormat.format(sValue);
			var text2 = "Duration: " + sVal + " secs";
			//var text3 = text2.toString().replace(".", ",");
			return text2;
		},

		numberInt: function (sValue) {
			var oFormatOptions = {
				groupingEnabled: true
			};
			var local = sap.ui.getCore().getConfiguration().getLocale();
			var oIntegFormat = sap.ui.core.format.NumberFormat.getIntegerInstance(oFormatOptions, local);
			return oIntegFormat.format(sValue);
		},

		IntegStatusInv: function (sValue) {
			if (sValue == "S" || sValue == "W" || sValue == "E") {
				return true;
			} else if (sValue == "R") {
				return false;
			}
		},

		IntegStatusIcon: function (sValue) {
			if (sValue == "S" || sValue == "W" || sValue == "E") {
				return "";
			} else if (sValue == "R") {
				return "sap-icon://goalseek";
			}
		},

		Startdate: function (t1, status) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd HH:mm:ss"
			});
			var dateformat;
			if (status == "R") {
				dateformat = dateFormat.format(t1);
			} else {
				dateformat = dateFormat.format(t1);
			}
			return "Start Time: " + dateformat;
		},

		ItemStatus2Tex: function (sValue) {
			if (sValue == "I") {
				return "Incremental";
			} else if (sValue == "R") {
				return "Reprocessing";
			} else if (sValue == "O") {
				return "On Demand";
			}
		},

		IntegStatus2: function (sValue) {
			if (sValue == "I") {
				return "Indication07";
			} else if (sValue == "R") {
				return "Indication01";
			} else if (sValue == "O") {
				return "Indication06";
			}
		},

		Enddate: function (t1, status) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd HH:mm:ss"
			});
			var dateformat;
			if (status == "R") {
				dateformat = "";
			} else {
				dateformat = dateFormat.format(t1);
			}
			return "End Time:  " + dateformat;
		},
		buildName: function (first, last) {
			return last + ", " + first;
		},
		reqName: function (sValue) {
			var text = atob(sValue);
			var objectValue = JSON.parse(text);
			var firstname = objectValue['firstname'];
			var lastname = objectValue['lastname'];
			return lastname + ", " + firstname;
		},
		reqMail: function (sValue) {
			var text = atob(sValue);
			var objectValue = JSON.parse(text);
			var email = objectValue['email'];
			return email;
		},
		reqPernr: function (sValue) {
			var text = atob(sValue);
			var objectValue = JSON.parse(text);
			var ref = objectValue['registration_references'];
			var pernr = ref['employee_number'];
			return pernr;
		},

		IntegStatus: function (sValue) {
			if (sValue == "S") {
				return "Success";
			} else if (sValue == "E") {
				return "Error";
			} else if (sValue == "W") {
				return "Warning";
			} else if (sValue == "R") {
				return "Information";
			}
		},

		ItemStatusTex: function (sValue) {
			if (sValue == "S") {
				return "Success";
			} else if (sValue == "R") {
				return "Running";
			} else if (sValue == "W") {
				return "Warning";
			} else if (sValue == "E") {
				return "Error";
			}
		},
		ItemStatusText: function (sValue, sValue2) {
			if (sValue2 == "E") {
				if (sValue) {
					return "Error: " + sValue;
				} else {
					return "Error";
				}
			} else {
				if (sValue2 == "S") {
					return "Success";
				} else if (sValue2 == "R") {
					return "Running";
				} else if (sValue2 == "W") {
					return "Warning";
				}
			}
		},
		ItemStatusText2: function (sValue, sValue2) {
			if (sValue) {
				return sValue.text;
			}
		},
		ItemStatus: function (sValue) {
			if (sValue == "S") {
				return "Success";
			} else if (sValue == "E") {
				return "Error";
			} else if (sValue == "R") {
				return "Warning";
			}
		},
		visibleInteg: function (sValue1, sValue2) {
			if (sValue1.length == 0 && sValue2 == 'S') {
				return false;
			}
			return true;
		},
		countItems: function (sItems) {
			if (sItems) {
				return sItems.length;
			} else {
				return 0;
			}
		},
		ActionButEnabled: function (sValue, sValue2) {
			if (sValue == "X" && sValue2 == "E") {
				return true;
			} else {
				return false;
			}
		},
		ActionButVisible1: function (sValue) {
			if (sValue == "D") {
				return false;
			} else {
				return true;
			}
		},
		ActionButVisible2: function (sValue) {
			if (sValue == "D") {
				return true;
			} else {
				return false;
			}
		},
		IntegUnits: function (sItems) {
			if (sItems > 1) {
				return "Orgs.";
			} else {
				return "Org";
			}
		}
	};
});
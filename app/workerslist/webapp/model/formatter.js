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
		IntegId: function (sValue) {
			return "Integ." + sValue;
		},
		workName: function (sValue1, sValue2) {
			return sValue2 + ", " + sValue1;
		},
		getColor: function (sValue) {
			if (sValue) {
				if (sValue.status_code) {
					if (sValue.status_code == "S") {
						return "green";
					}
				}
			}

			return "red";
		},
		timestamp: function (t1) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd HH:mm:ss"
			});
			var dateformat;
			dateformat = dateFormat.format(t1);
			return dateformat;
		},
		date: function (t1, t2, status) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd HH:mm:ss"
			});
			var dateformat;
			if (status == "R") {
				dateformat = dateFormat.format(t1);
			} else {
				dateformat = dateFormat.format(t2);
			}
			return dateformat;
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
		
		ItemStatus: function (sValue) {
			if (sValue == "S") {
				return "Success";
			} else if (sValue == "E") {
				return "Error";
			} else if (sValue == "R") {
				return "Warning";
			}
		},
		statusMess: function (sValue1, sValue2) {
			if (sValue1 == 'S') {
				return "Worker Integrated Successfully."
			} else {
				if (sValue2) {
					var mess = atob(sValue2);
					var objectValue = JSON.parse(mess);
					var ref = objectValue['errors'][0];
					var mens = ref['message'];
					return mens;
				}
			}
		},
		numProc: function (sValue){
			return sValue.length;	
		},
		statusNumb: function (sValue1) {
			if (sValue1 == 'S') {
				return "Synchronized"
			} else {
				return "Not Synchronized";
			}
		},
		statusType: function (sValue1) {
			if (sValue1 == 'S') {
				return "Success"
			} else {
				return "Error";
			}
		},
		getPernr: function (sValue) {
			if (sValue) {
				var text = atob(sValue.request);
				var objectValue = JSON.parse(text);
				var ref = objectValue['registration_references'];
				var pernr = ref['employee_number'];
				return pernr;
			}
			return "00000";
		}

	};

});
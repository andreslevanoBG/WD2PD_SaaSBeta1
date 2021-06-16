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
		editInitDate: function (sValue) {
			if (!sValue) {
				return true;
			}
			return false;
		},

		enableKey: function (sValue) {
			if (sValue) {
				return "A";
			}
			return "U";
		},
		supervisories: function (sValue) {
			if (sValue) {
				var result = "";
				var i = 0;
				sValue.forEach(function (supervisory) {
					if (i > 0) {
						result = result + "-" + supervisory.Name;
					} else {
						result = supervisory.Name;
					}
					i++;
				});
				return result;
			}
			return "";
		},

		Demanddate: function (t1) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd HH:mm:ss"
			});
			var dateformat;
			dateformat = dateFormat.format(t1);

			return dateformat;
		},
		Startdate: function (t1) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd HH:mm:ss"
			});
			var dateformat;
			dateformat = dateFormat.format(t1);

			return "Last Run: " + dateformat;
		},

		processType: function (sValue) {
			if (sValue === "I") {
				return "Incremental Processing";
			} else if (sValue === "R") {
				return "Error Reprocessing";
			}
		},

		processTypeVis: function (sValue) {
			if (sValue === "I") {
				return true;
			} else if (sValue === "R") {
				return false;
			}
		},

		tableDate: function (t1) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd"
			});
			var dateformat;
			var offsetms = new Date(0).getTimezoneOffset() * 60 * 1000;
			var t2 = t1.getTime();
			t2 = t2 + offsetms;
			dateformat = dateFormat.format(new Date(t2));
			return dateformat;
		},

		periodType: function (sValue) {
			if (sValue == "D") {
				return "Daily";
			} else if (sValue == "M") {
				return "Monthly";
			} else if (sValue == "W") {
				return "Weekly";
			} else {
				return "";
			}
		},

		periodValue: function (sValue, sValue2) {
			var array = sValue.split("-");
			if (sValue2 == "W") {
				for (var i = 0; i < array.length; i++) {
					switch (array[i]) {
					case '0':
						array[i] = "Sun";
						break;
					case '1':
						array[i] = "Mon";
						break;
					case '2':
						array[i] = "Tue";
						break;
					case '3':
						array[i] = "Wed";
						break;
					case '4':
						array[i] = "Thu";
						break;
					case '5':
						array[i] = "Fri";
						break;
					case '6':
						array[i] = "Sat";
						break;
					default:
					}
				}
				return array.join("-");
			} else {
				return sValue;
			}

		},

		frecuency: function (sValue, sValue2) {
			if (sValue2 == "m" || sValue2 == "M") {
				return sValue + " min";
			} else if (sValue2 == "h" || sValue2 == "H") {
				return sValue + " hour";
			}
		},

		interval: function (sValue, sValue2) {
			// var oType = new sap.ui.model.type.Time({
			// 	source: {
			// 		__edmtype: "Edm.Time"
			// 	},
			// 	pattern: "HH:MM:SS"
			// });

			var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: "HH:mm:ss"
			});
			var offsetms = new Date(0).getTimezoneOffset() * 60 * 1000;
			var time1 = timeFormat.format(new Date(sValue.ms + offsetms));
			var time2 = timeFormat.format(new Date(sValue2.ms + offsetms));
			return time1 + " - " + time2;
		},

		ExecStatusT: function (sValue) {
			if (sValue) {
				return "Active";
			} else {
				return "Inactive";
			}
		},
		ExecStatusIcon: function (sValue) {
			if (sValue) {
				return "sap-icon://thumb-up";
			} else {
				return "sap-icon://thumb-down";
			}
		},
		ExecStatus: function (sValue) {
			if (sValue) {
				return "Success";
			} else {
				return "Error";
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
			if (s1 == "W") {
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
		PlanStatusText: function (sValue) {
			if (sValue) {
				return "Active";
			} else {
				return "Inactive";
			}
		}
	};
});
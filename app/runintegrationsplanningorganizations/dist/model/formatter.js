sap.ui.define([],function(){"use strict";return{currencyValue:function(e){if(!e){return""}return parseFloat(e).toFixed(2)},editInitDate:function(e){if(!e){return true}return false},processType:function(e){if(e==="I"){return"Incremental Processing"}else if(e==="R"){return"Error Reprocessing"}},processTypeVis:function(e){if(e==="I"){return true}else if(e==="R"){return false}},enableKey:function(e){if(e){return"A"}return"U"},supervisories:function(e){if(e){var r="";var t=0;e.forEach(function(e){if(t>0){r=r+"-"+e.Name}else{r=e.Name}t++});return r}return""},Demanddate:function(e){var r=sap.ui.core.format.DateFormat.getDateInstance({pattern:"YYYY-MM-dd HH:mm:ss"});var t;t=r.format(e);return t},Startdate:function(e){var r=sap.ui.core.format.DateFormat.getDateInstance({pattern:"YYYY-MM-dd HH:mm:ss"});var t;t=r.format(e);return"Last Run: "+t},tableDate:function(e){var r=sap.ui.core.format.DateFormat.getDateInstance({pattern:"YYYY-MM-dd"});var t;var n=new Date(0).getTimezoneOffset()*60*1e3;var a=e.getTime();a=a+n;t=r.format(new Date(a));return t},periodType:function(e){if(e=="D"){return"Daily"}else if(e=="M"){return"Monthly"}else if(e=="W"){return"Weekly"}else{return""}},periodValue:function(e,r){var t=e.split("-");if(r=="W"){for(var n=0;n<t.length;n++){switch(t[n]){case"0":t[n]="Sun";break;case"1":t[n]="Mon";break;case"2":t[n]="Tue";break;case"3":t[n]="Wed";break;case"4":t[n]="Thu";break;case"5":t[n]="Fri";break;case"6":t[n]="Sat";break;default:}}return t.join("-")}else{return e}},frecuency:function(e,r){if(r=="m"||r=="M"){return e+" min"}else if(r=="h"||r=="H"){return e+" hour"}},interval:function(e,r){var t=sap.ui.core.format.DateFormat.getTimeInstance({pattern:"HH:mm:ss"});var n=new Date(0).getTimezoneOffset()*60*1e3;var a=t.format(new Date(e.ms+n));var u=t.format(new Date(r.ms+n));return a+" - "+u},ExecStatusT:function(e){if(e){return"Active"}else{return"Inactive"}},ExecStatusIcon:function(e){if(e){return"sap-icon://thumb-up"}else{return"sap-icon://thumb-down"}},ExecStatus:function(e){if(e){return"Success"}else{return"Error"}},executePlan:function(e){if(e){return 0}return 1},enablePlan:function(e){if(e){return false}return true},ontimePlan:function(e){if(e){return 0}return 1},timePlan:function(e){if(e){return e}},datePlan:function(e){if(e){return e}},checkPlan:function(e,r,t){if(e=="W"){var n=r.indexOf(t);if(n<0){return false}else{return true}}else{return false}},PlanStatus:function(e){if(e){return"Success"}else{return"Error"}},visDays:function(e){if(e=="W"){return true}return false},visDays2:function(e){if(e=="M"){return true}return false},visDays3:function(e){if(e=="D"){return true}else if(e=="M"){return false}else if(e=="W"){return false}return true},PlanStatusText:function(e){if(e){return"Active"}else{return"Inactive"}}}});
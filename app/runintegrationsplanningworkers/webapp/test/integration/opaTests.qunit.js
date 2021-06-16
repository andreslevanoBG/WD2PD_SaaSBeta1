/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"shapein/RunIntegrationPlanningWorkers/test/integration/AllJourneys"
	], function() {
		QUnit.start();
	});
});
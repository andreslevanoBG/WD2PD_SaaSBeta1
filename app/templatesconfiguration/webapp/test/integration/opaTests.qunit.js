/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"shapein/TemplatesConfiguration/test/integration/AllJourneys"
	], function() {
		QUnit.start();
	});
});
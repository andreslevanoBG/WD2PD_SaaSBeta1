/*global QUnit*/

sap.ui.define([
	"shapein/ConfiguringUsers/controller/Configuration.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Configuration Controller");

	QUnit.test("I should test the Configuration controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
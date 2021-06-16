/*global QUnit*/

sap.ui.define([
	"shapein/ConfiguringWorkers/controller/Configuring.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Configuring Controller");

	QUnit.test("I should test the Configuring controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
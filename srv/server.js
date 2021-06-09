const cds = require('@sap/cds');

const odatav2adapterproxy = require('@sap/cds-odata-v2-adapter-proxy');

cds.on('bootstrap', app => {

    app.use(odatav2adapterproxy());

    cds.mtx.in(app).then(async () => {
        const provisioning = await cds.connect.to('ProvisioningService');
        provisioning.impl(require('./provisioning'));
    });

});

module.exports = cds.server;

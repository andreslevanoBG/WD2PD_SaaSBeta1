const debug = require('debug')('srv:provisioning');
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
const xsenv = require('@sap/xsenv');
xsenv.loadEnv();
const services = xsenv.getServices({
    registry: { tag: 'SaaS' }
  //  port: { label: 'portal' },
   // theme: { label: 'theming'}
});



module.exports = (service) => {

    service.on('UPDATE', 'tenant', async (req, next) => {
        let tenantHost = req.data.subscribedSubdomain + '-' + appEnv.app.space_name.toLowerCase().replace(/_/g, '-') + '-' + services.registry.appName.toLowerCase().replace(/_/g, '-');
        let tenantURL = 'https:\/\/' + tenantHost + /\.(.*)/gm.exec(appEnv.app.application_uris[0])[0];
        console.log('Subscribe: ', req.data.subscribedSubdomain, req.data.subscribedTenantId, tenantHost);
        await next();
        return tenantURL;
    });

    service.on('DELETE', 'tenant', async (req, next) => {
        let tenantHost = req.data.subscribedSubdomain + '-' + appEnv.app.space_name.toLowerCase().replace(/_/g, '-') + '-' + services.registry.appName.toLowerCase().replace(/_/g, '-');
        console.log('Unsubscribe: ', req.data.subscribedSubdomain, req.data.subscribedTenantId, tenantHost);
        await next();
        return req.data.subscribedTenantId;
    });

    service.on('dependencies', async (req, next) => {
        //'05c6c0c3-befc-4ce4-942a-d0cb3a6204ec!b62197|portal-cf-service!b3664'
        // 'e89e45ae-ef90-4388-8dbe-df5383da7d3c!b62197|sap-theming!b6529'
        //services.port.uaa.xsappname
        //services.port.xsappname
       // services.theme.xsappname
        let dependencies = [{
            'xsappname': '05c6c0c3-befc-4ce4-942a-d0cb3a6204ec!b62197|portal-cf-service!b3664'
        },
        {
            'xsappname': 'e89e45ae-ef90-4388-8dbe-df5383da7d3c!b62197|sap-theming!b6529'
            
        }
      //  {
      //      'xsappname': '2f90b798-8589-4b38-bd45-36ab4c79b4cc!b62197|html5-apps-repo-uaa!b1685'
      //  }
    ];
        return dependencies;
    });



}
/* uncomment and modify as needed
using IntegrationService from '_base/srv/integ-service'; 

using Z_shapein.integrations as my from '../db/new'; 

extend service IntegrationService with {

    @readonly
    entity Z_Custom
      as select * from my.Z_Custom;

};
*/
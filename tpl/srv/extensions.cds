/* uncomment and modify as needed
using CatalogService from '_base/srv/catalog-service'; 

using Z_wd2pdsaas.db as db from '../db/new'; 

extend service CatalogService with {

    @readonly
    entity Z_Custom
      as select * from db.Z_Custom;

};
*/
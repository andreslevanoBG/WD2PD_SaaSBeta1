using {shapein.integrations as my} from '../db/schema';

@cds.query.limit : {
    default : 5000,
    max     : 100000
}

@path            : '/integration'
@requires        : 'Service'
service IntegrationService {
     entity Integrations as projection on my.Integrations;
 //   entity Integrations                      as
 //       select from my.Integrations {
 //           *,
 //           0 as numberOfItems   : Integer,
 //           0 as numberOfSeconds : Decimal
 //       };

    entity Status                            as projection on my.Status;
    entity Integration_Items                 as projection on my.Integration_Items;
    entity Messages                          as projection on my.Messages;
    entity Messages_Categories               as projection on my.Messages_Categories;
    entity Integration_Pck                   as projection on my.Integration_Pck;
    entity Reprocess                         as projection on my.Reprocess;
    entity Configurations                    as projection on my.Configurations;
    entity Configuration_Types               as projection on my.Configuration_Types;

    entity Workers                           as
        select from my.Workers {
            *,
            0 as numberOfItems : Integer
        };

    entity Users                             as
        select from my.Users {
            *,
            0 as numberOfItems : Integer
        };

    entity Domain_Values                     as projection on my.Domain_Values;

    entity Organizations                     as
        select from my.Organizations {
            *,
            0 as numberOfItems : Integer
        };

    entity Countries                         as projection on my.Countries;
    entity Pd_Languages                      as projection on my.Pd_Languages;
    entity Integration_Pck_Planning          as projection on my.Integration_Pck_Planning;
    entity Integration_Pck_Planning_D        as projection on my.Integration_Pck_Planning_D;
    entity Integration_Pck_Planning_Adata    as projection on my.Integration_Pck_Planning_Adata;
    entity User_Future_Changes               as projection on my.User_Future_Changes;
    entity Di_Template_Mappings              as projection on my.Di_Template_Mappings;
    entity Di_Template_Worker_Attr           as projection on my.Di_Template_Worker_Attr;
    entity Di_Template_Worker_Attr_Values    as projection on my.Di_Template_Worker_Attr_Values;
    entity Di_Template                       as projection on my.Di_Template;
    entity Di_Business_Process               as projection on my.Di_Business_Process;
    entity Di_Business_Process_Master        as projection on my.Di_Business_Process_Master;
    entity Di_Parser_Xsd                     as projection on my.Di_Parser_Xsd;
    entity Di_Parser_Xsd_Definition          as projection on my.Di_Parser_Xsd_Definition;

    entity Di_Generation_Processes        as projection on my.Di_Generation_Processes;
   // entity Di_Generation_Processes           as
   //     select from my.Di_Generation_Processes {
   //         *,
   //         0 as numberOfItems   : Integer,
   //         0 as numberOfSeconds : Decimal
   //     };

    entity Di_Generation_Processes_Doc       as projection on my.Di_Generation_Processes_Doc;
    entity Di_Messages                       as projection on my.Di_Messages;
    entity Di_Template_Mapping_Objects       as projection on my.Di_Template_Mapping_Objects;
    entity Di_Document_Sign                  as projection on my.Di_Document_Sign;
    entity Di_Document_Sign_Log              as projection on my.Di_Document_Sign_Log;
    entity Di_Template_Sign_Cfg              as projection on my.Di_Template_Sign_Cfg;
    entity Subscription_Settings             as projection on my.Subscription_Settings;
    entity Di_Employee                       as projection on my.Di_Employee;
    entity Di_Employee_Template              as projection on my.Di_Employee_Template;
    entity Di_Template_Mapping_Sources       as projection on my.Di_Template_Mapping_Sources;
    entity Di_Template_Mapping_Sources_Types as projection on my.Di_Template_Mapping_Sources_Types;
    entity Di_Template_Mapping_Types         as projection on my.Di_Template_Mapping_Types;
    entity Di_List_Values                    as projection on my.Di_List_Values;

    @cds.query.limit : 6
    entity Di_Template_Page_Content          as projection on my.Di_Template_Page_Content;

    entity Organization_Types                as projection on my.Organization_Types;

    event deleteInteg : {
        integ_id : String(32);
    }

    event deleteGeneration : {
        gen_id : UUID;
    }

    event deleteFutureChanges : {
        external_id : String(32);
    }

    event updateOrg : {
        external_id          : String;
        last_item_id         : UUID;
        last_status          : String(10);
        original_external_id : String;
        name                 : String(50);
        corporate_name       : String(50);
    }

    event updateWorker : {
        external_id     : String;
        last_item_id    : UUID;
        last_status     : String(10);
        employee_number : String(50);
        firstname       : String(50);
        lastname        : String(50);
        email           : String(64);
    }

    event updateUser : {
        external_id     : String;
        last_item_id    : UUID;
        last_status     : String(10);
        employee_number : String(50);
        firstname       : String(50);
        lastname        : String(50);
        email           : String(64);
    }

    event updatePlanning : {
        planning_uuid           : UUID;
        last_execution          : Timestamp;
        last_execution_timezone : String(10);
    }

    type organization_type {
        type      : String;
        type_text : String;
        subtype   : String;
        metadata  : String;
    }

    type pack_pages {
        next_pack   : Integer;
        uuidtemp    : String(36);
        pages       : array of {
            page    : Integer;
            content : LargeString;
        };
    }

    type tileinfo {
        number : Integer;
    }

    type countersInteg {
        countS: Integer;
        countE: Integer;
        countD: Integer;
    }

    function set_user_future_changes(uuid : String(32), date : Date) returns String;
    function retention_period_workers() returns String;
    function delete_mappings(uuid : String(36)) returns String;
    function delete_mappings_meta(uuid : String(36)) returns String;
    function delete_attr_values(uuid : String(36)) returns String;
    function delete_conf_signature(uuid : String(36)) returns String;
    function can_be_activated(uuid : String(36), sign : Boolean) returns String;
    function copy_template_config(uuid_new : String(36), uuid_to_copy : String(36), mappings : Boolean, metadata : Boolean, variables : Boolean, planning : Boolean, planning_rep : Boolean, worker_attr : Boolean, sign_conf : Boolean) returns String;
    function delete_planning_repro(uuid : String(36)) returns String;
    //function di_business_process_type_master_insert(bpt_data: String) returns String;
    function di_business_process_type_master_delete_all() returns String;
    function delete_list_values(lvaid : String(20)) returns String;
    function delete_complete_template(uuid : String(36)) returns String;
    function get_organization_types(text : Boolean, metadata : Boolean) returns organization_type;
    function get_pages(uuidtemp : String(36), pack: Integer) returns pack_pages;
    function counterIntWorkers() returns tileinfo;
    function counterIntUsers() returns tileinfo;
    function counterIntOrgs() returns tileinfo;
    function counterIntProc() returns tileinfo;
    function updateCalculatedFields(id: String(32)) returns String;
    function getCountersInteg(id: String(32)) returns countersInteg;
}

using {
    Currency,
    managed,
    sap
} from '@sap/cds/common';

namespace shapein.integrations;

entity Integrations : managed {
    key id              : String(32);
        pck_code        : String(10);
        status_code     : String(10);
        reference_id    : String(50);
        error_code      : String(10);
        error_http_code : String(100);
        error_message   : String;
        timezone        : String(10);
        timestamp_start : Timestamp;
        timestamp_end   : Timestamp;
        type            : String(1);
        planning_uuid   : UUID;
        error           : Association to Messages
                              on error.code = error_code;
        status          : Association to Status
                              on status.code = status_code;
        pck             : Association to Integration_Pck
                              on pck.code = pck_code;
        integ_items     : Association to many Integration_Items
                              on integ_items.integ_id = id;
        reprocess       : Association to many Reprocess
                              on reprocess.integ_id = id;
}

entity Integration_Items : managed {
    key item_id              : UUID;
        //key item_id : String(32);
        integ_id             : String(32);
        external_id          : String;
        original_external_id : String;
        pck_code             : String(10);
        status_code          : String(10);
        request_format       : String(10);
        request              : String;
        request_deleted      : String(1);
        request_deleted_date : Timestamp;
        error_code           : String(10);
        error_http_code      : String(10);
        error_message        : String;
        error_details_format : String(10);
        error_details        : String;
        timestamp_start      : Timestamp;
        timezone             : String(10);
        status               : Association to Status
                                   on status.code = status_code;
        error                : Association to Messages
                                   on error.code = error_code;
        integration          : Association to Integrations
                                   on integration.id = integ_id;
        reprocess            : Association to many Reprocess
                                   on reprocess.item_id = item_id;
        worker               : Association to Workers
                                   on worker.external_id = external_id;
        organization         : Association to Organizations
                                   on organization.external_id = external_id;
        user                 : Association to Users
                                   on user.external_id = external_id;
}

entity Status {
    key code               : String(10);
        text               : localized String;
        type               : String(1);
        integrations       : Association to many Integrations
                                 on integrations.status_code = code;
        integrations_items : Association to many Integration_Items
                                 on integrations_items.status_code = code;
}

entity Messages {
    key code              : String(10);
        text              : localized String;
        categor_code      : String(10);
        categor           : Association to Messages_Categories
                                on categor.code = categor_code;
        integrations      : Association to many Integrations
                                on integrations.error_code = code;
        integration_items : Association to many Integration_Items
                                on integration_items.error_code = code;
}

entity Messages_Categories {
    key code     : String(10);
        text     : localized String;
        messages : Association to many Messages
                       on messages.categor_code = code;
}

entity Integration_Pck {
    key code           : String(10);
        text           : localized String;
        integrations   : Association to many Integrations
                             on integrations.pck_code = code;
        configurations : Association to many Configurations
                             on configurations.pck_code = code;
}

entity Reprocess : managed {
    key id               : String(32);
        type             : String(1);
        integ_id         : String(32);
        item_id          : UUID;
        integration      : Association to Integrations
                               on integration.id = integ_id;
        integration_item : Association to Integration_Items
                               on integration_item.item_id = item_id;
}

entity Configuration_Types {
    key code           : String(10);
        text           : localized String;
        configurations : Association to many Configurations
                             on configurations.conf_code = code;
}

entity Configurations : managed {
    key pck_code  : String(10);
    key conf_code : String(10);
        value     : LargeString;
        int_pck   : Association to Integration_Pck
                        on int_pck.code = pck_code;
        conf_type : Association to Configuration_Types
                        on conf_type.code = conf_code;
}

entity Workers : managed {
    key uuid                 : UUID;
        //key code: String(32);
        external_id          : String;
        original_external_id : String;
        employee_number      : String(50);
        firstname            : String(50);
        lastname             : String(50);
        organization_id      : String(255);
        last_timestamp       : Timestamp;
        email                : String(64);
        last_status          : String(10);
        status               : Association to Status
                                   on status.code = last_status;
        last_item_id         : UUID;
        last_integ_item      : Association to Integration_Items
                                   on last_integ_item.item_id = last_item_id;
        integ_items          : Association to many Integration_Items
                                   on integ_items.external_id = external_id;
//integ_items: Association to many Integration_Items on integ_items.obj_code = code;
}

entity Users : managed {
    key uuid                 : UUID;
        //key code: String(32);
        external_id          : String;
        original_external_id : String;
        employee_number      : String(50);
        firstname            : String(50);
        lastname             : String(50);
        organization_id      : String(255);
        last_timestamp       : Timestamp;
        email                : String(64);
        last_status          : String(10);
        status               : Association to Status
                                   on status.code = last_status;
        last_item_id         : UUID;
        last_integ_item      : Association to Integration_Items
                                   on last_integ_item.item_id = last_item_id;
        integ_items          : Association to many Integration_Items
                                   on integ_items.external_id = external_id;
//integ_items: Association to many Integration_Items on integ_items.obj_code = code;
}

entity Organizations : managed {
    key uuid                 : UUID;
        //key code: String(32);
        external_id          : String;
        original_external_id : String;
        reference_id         : String(32);
        name                 : String(50);
        corporate_name       : String(50);
        last_timestamp       : Timestamp;
        last_item_id         : UUID;
        last_status          : String(10);
        status               : Association to Status
                                   on status.code = last_status;
        last_integ_item      : Association to Integration_Items
                                   on last_integ_item.item_id = last_item_id;
        integ_items          : Association to many Integration_Items
                                   on integ_items.external_id = external_id;
//integ_items: Association to many Integration_Items on integ_items.obj_code = code;
}

entity Domain_Values {
    key pck_code : String(10);
    key level1   : String(25);
    key level2   : String(25);
    key value    : String(50);
        text     : localized String;
        int_pck  : Association to Integration_Pck
                       on int_pck.code = pck_code;
}

entity Countries {
    key code : String(2);
        text : localized String(50);
}


entity Pd_Languages {
    key code : String(20);
        text : localized String(50);
}

entity Integration_Pck_Planning {
    key uuid                    : UUID;
        pck_code                : String(10);
        type                    : String(1);
        enable                  : Boolean;
        processing_type         : String(1);
        comments                : String;
        last_execution          : Timestamp;
        last_execution_timezone : String(10);
        integ_pck               : Association to Integration_Pck
                                      on integ_pck.code = pck_code;
        integs_plan_d           : Association to many Integration_Pck_Planning_D
                                      on integs_plan_d.planning_uuid = uuid;
        adata                   : Association to many Integration_Pck_Planning_Adata
                                      on adata.planning_uuid = uuid;
        templates               : Association to many Di_Template
                                      on templates.planning_uuid = uuid;
        generation_proc         : Association to Di_Generation_Processes
                                      on generation_proc.planning_uuid = uuid;

}

entity Integration_Pck_Planning_D {
    key uuid               : UUID;
        planning_uuid      : UUID;
        seqno              : Integer;
        execute            : Boolean;
        begda              : Date;
        endda              : Date;
        periodicity_type   : String(1);
        periodicity_values : String;
        time_frecuency     : Integer;
        time_measure       : String(1);
        time_start         : Time;
        time_end           : Time;
        time_zone          : String(50);
        integ_plan         : Association to Integration_Pck_Planning
                                 on integ_plan.uuid = planning_uuid;

}

entity Integration_Pck_Planning_Adata {
    key uuid          : UUID;
        planning_uuid : UUID;
        level1        : String(25);
        level2        : String(25);
        value         : String;
        value2        : String;
        pck_plan      : Association to Integration_Pck_Planning
                            on pck_plan.uuid = planning_uuid;
}

entity User_Future_Changes {
    key external_id : String(32);
        date        : Date;
}

entity Di_Business_Process {
    key bpt_id               : UUID;
        name                 : String;
        description          : String;
        retry_employee_exist : Boolean;
        retries_number       : Integer;
        templates            : Association to many Di_Template
                                   on templates.bpt_id = bpt_id;
}


entity Di_Business_Process_Master {
    key uuid        : UUID;
        external_id : String;
        code        : String;
        description : String;
}


entity Di_Template_Mappings {
    key uuid           : UUID;
        template_uuid  : UUID;
        variable       : String;
        mapping_object : String(10);
        mapping_type   : String(5);
        vartype        : String(50);
        mapping        : String;
        required       : Boolean;
        source         : String(20);
        metadata       : String;
        template       : Association to Di_Template
                             on template.uuid = template_uuid;
        object         : Association to Di_Template_Mapping_Objects
                             on object.code = mapping_object;
        source_link    : Association to Di_Template_Mapping_Sources
                             on source_link.code = source;
        typeMap        : Association to Di_Template_Mapping_Types
                             on typeMap.code = mapping_type;
}

entity Di_Template_Mapping_Objects {
    key code          : String(10);
        description   : String;
        temp_mappings : Association to many Di_Template_Mappings
                            on temp_mappings.mapping_object = code;
}

//XPATH Sources
entity Di_Template_Mapping_Sources {
    key code       : String(20);
        type       : String(5);
        text       : String;
        xsd_id     : String(20);
        metadata   : String;
        parser_xsd : Association to many Di_Parser_Xsd
                         on parser_xsd.xsd_id = xsd_id;
        typeSource : Association to Di_Template_Mapping_Sources_Types
                         on typeSource.code = type;
}

entity Di_List_Values {
    key lvaid : String(20);
    key seqno : Integer;
        value : String(100);
        text  : String(200);
}


entity Di_Template : managed {
    key uuid              : UUID;
        template_id       : String;
        template_version  : String;
        bpt_id            : UUID;
        doc_type_id       : String;
        doc_title         : String;
        active            : Boolean;
        planning_uuid     : UUID;
        planning_rep_uuid : UUID;
        language          : String(5);
        signature         : Boolean;
        format            : String(10);
        updated_at        : String(30);
        description       : String(200);
        deprecated        : Boolean;
        business_process  : Association to many Di_Business_Process
                                on business_process.bpt_id = bpt_id;
        mappings          : Association to many Di_Template_Mappings
                                on mappings.template_uuid = uuid;
        planning          : Association to Integration_Pck_Planning
                                on planning.uuid = planning_uuid;
        planning_rep      : Association to Integration_Pck_Planning
                                on planning_rep.uuid = planning_rep_uuid;
        attributes        : Association to many Di_Template_Worker_Attr
                                on attributes.template_uuid = uuid;
        sign_cfg          : Association to Di_Template_Sign_Cfg
                                on sign_cfg.template_uuid = uuid;
        pages             : Association to many Di_Template_Page_Content
                                on pages.template_uuid = uuid;
        employee_template : Association to many Di_Employee_Template
                                on employee_template.template_uuid = uuid;
}

entity Di_Generation_Processes : managed {
    key uuid             : UUID;
        template_uuid    : UUID;
        template_id      : String;
        template_version : String;
        doc_type_id      : String;
        bpt_id           : UUID;
        type             : String(1);
        status           : String(10);
        planning_uuid    : UUID;
        //   tlog_timezone             : String;
        //   tlog_updated_from         : Timestamp;
        //   tlog_updated_to           : Timestamp;
        //   tlog_retro_effective_from : Timestamp;
        //   tlog_future_updated_from  : Timestamp;
        error_code       : String(10);
        error_http_code  : String(100);
        error_message    : String;
        timezone         : String;
        timestamp_start  : Timestamp;
        timestamp_end    : Timestamp;
        planning         : Association to Integration_Pck_Planning
                               on planning.uuid = planning_uuid;
        docs             : Association to many Di_Generation_Processes_Doc
                               on docs.genproc_uuid = uuid;
        message          : Association to Di_Messages
                               on message.code = error_code;
        business_process : Association to Di_Business_Process
                               on business_process.bpt_id = bpt_id;
        template         : Association to Di_Template
                               on template.uuid = template_uuid;

}

entity Di_Messages {
    key code          : String(10);
        text          : localized String;
        processes     : Association to many Di_Generation_Processes
                            on processes.error_code = code;
        processes_doc : Association to many Di_Generation_Processes_Doc
                            on processes_doc.error_code = code;
}

entity Di_Generation_Processes_Doc : managed {
    key uuid                      : UUID;
        genproc_uuid              : UUID;
        employee_external_id      : String;
        employee_number           : String;
        doc_id                    : String;
        pd_doc_id                 : String(15);
        status                    : String(10);
        error_code                : String(10);
        error_http_code           : String(100);
        error_message             : String;
        timezone                  : String;
        timestamp                 : Timestamp;
        tlog_timezone             : String;
        tlog_updated_from         : Timestamp;
        tlog_updated_to           : Timestamp;
        tlog_retro_effective_from : Timestamp;
        tlog_future_updated_from  : Timestamp;
        signature_uuid            : UUID;
        generation_proc           : Association to Di_Generation_Processes
                                        on generation_proc.uuid = genproc_uuid;
        message                   : Association to Di_Messages
                                        on message.code = error_code;
        doc_sign                  : Association to Di_Document_Sign
                                        on doc_sign.uuid = signature_uuid;
        last_temp_employee        : Association to Di_Employee_Template
                                        on last_temp_employee.last_execution_uuid = uuid;
        worker                    : Association to Workers
                                        on worker.employee_number = employee_number;
}

entity Di_Template_Sign_Cfg {
    key uuid          : UUID;
        template_uuid : UUID;
        api_version   : String(5);
        json_cfg      : LargeString;
        template      : Association to Di_Template
                            on template.uuid = template_uuid;
}

entity Di_Template_Page_Content {
    key uuid          : UUID;
        template_uuid : UUID;
        page          : Integer;
        content       : LargeString;
        template      : Association to Di_Template
                            on template.uuid = template_uuid;

}

entity Di_Document_Sign : managed {
    key uuid     : UUID;
        //   doc_uuid : UUID;
        pd_id    : String(10);
        status   : String(50);
        message  : String;
        document : Association to Di_Generation_Processes_Doc
                       on document.signature_uuid = uuid;
        log      : Composition of many Di_Document_Sign_Log
                       on log.signature_uuid = uuid;

}

entity Di_Employee {
    key uuid                 : UUID;
        employee_number      : String;
        employee_external_id : String;
        emp_template         : Association to many Di_Employee_Template
                                   on emp_template.employee_uuid = uuid;
        worker               : Association to Workers
                                   on worker.employee_number = employee_number;

}

entity Di_Employee_Template {
    key uuid                : UUID;
        employee_uuid       : UUID;
        template_uuid       : UUID;
        last_status         : String(10);
        last_execution_uuid : UUID;
        template            : Association to Di_Template
                                  on template.uuid = template_uuid;
        employee            : Association to Di_Employee
                                  on employee.uuid = employee_uuid;
        last_doc            : Association to Di_Generation_Processes_Doc
                                  on last_doc.uuid = last_execution_uuid;
}

entity Di_Document_Sign_Log : managed {
    key uuid           : UUID;
        signature_uuid : UUID;
        status         : String(50);
        code           : String(5);
        message        : String;
        sign           : Association to Di_Document_Sign
                             on sign.uuid = signature_uuid;
}

entity Di_Template_Worker_Attr {
    key uuid          : UUID;
        template_uuid : UUID;
        xpath         : String;
        name          : String;
        description   : String;
        sign          : String(1);
        template      : Association to Di_Template
                            on template.uuid = template_uuid;
        values_attr   : Composition of many Di_Template_Worker_Attr_Values
                            on values_attr.attr_uuid = uuid;
}

entity Di_Template_Worker_Attr_Values {
    key uuid        : UUID;
        attr_uuid   : UUID;
        value       : String;
        worker_attr : Association to Di_Template_Worker_Attr
                          on worker_attr.uuid = attr_uuid;

}

entity Di_Parser_Xsd {
    key xsd_id      : String(20);
        text        : String;
        definitions : Association to many Di_Parser_Xsd_Definition
                          on definitions.xsd_id = xsd_id;
}

entity Di_Parser_Xsd_Definition {
    key xsd_id       : String(20);
    key seqno        : Integer;
        node_id      : Integer;
        parent_id    : Integer;
        order_output : Integer;
        node_type    : String(30);
        fieldname    : String(100);
        datatype     : String;
        basetype     : String;
        minoccurs    : String;
        maxoccurs    : String;
        prefix       : String;
        parser_xsd   : Association to Di_Parser_Xsd
                           on parser_xsd.xsd_id = xsd_id;
}

entity Subscription_Settings {
    key code        : String(20);
        value       : String;
        description : String;
}

entity Di_Template_Mapping_Sources_Types {
    key code        : String(5);
        description : localized String;
        sources     : Association to many Di_Template_Mapping_Sources
                          on sources.type = code;

}

entity Di_Template_Mapping_Types {
    key code        : String(5);
        description : localized String;
        mappings    : Association to many Di_Template_Mappings
                          on mappings.mapping_type = code;

}

entity Organization_Types {
    key code : String(50);
    description: String;
    metadata: String;
}
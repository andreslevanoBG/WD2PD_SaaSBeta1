const cds = require('@sap/cds')

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


module.exports = cds.service.impl(srv => {

    //module.exports = (srv) => {

    const { Workers } = srv.entities('shapein.integrations')
    const { Users } = srv.entities('shapein.integrations')
    const { Organizations } = srv.entities('shapein.integrations')
    const { Integration_Items } = srv.entities('shapein.integrations')
    const { Integrations } = srv.entities('shapein.integrations')
    const { Integration_Pck_Planning } = srv.entities('shapein.integrations')
    const { User_Future_Changes } = srv.entities('shapein.integrations')
    const { Integration_Pck_Planning_D } = srv.entities('shapein.integrations')
    const { Integration_Pck_Planning_Adata } = srv.entities('shapein.integrations')
    const { Configurations } = srv.entities('shapein.integrations')
    const { Di_Template_Mappings } = srv.entities('shapein.integrations')
    const { Di_Template } = srv.entities('shapein.integrations')
    const { Di_Generation_Processes } = srv.entities('shapein.integrations')
    const { Di_Generation_Processes_Doc } = srv.entities('shapein.integrations')
    const { Di_Template_Worker_Attr } = srv.entities('shapein.integrations')
    const { Di_Template_Worker_Attr_Values } = srv.entities('shapein.integrations')
    const { Di_Template_Sign_Cfg } = srv.entities('shapein.integrations')
    const { Di_Employee } = srv.entities('shapein.integrations')
    const { Di_Employee_Template } = srv.entities('shapein.integrations')
    const { Di_Business_Process_Master } = srv.entities('shapein.integrations')
    const { Di_List_Values } = srv.entities('shapein.integrations')
    const { Organization_Types } = srv.entities('shapein.integrations')


    srv.before('READ', 'Integrations', async (req) => {
        try {
            var query = req._query;
            var lday;
            if (query) {
                if (req._path.includes("Integrations(")) {
                    lday = "";
                } else {
                    var filters = query.$filter;
                    if (filters && filters.includes("timestamp")) {
                        lday = "";
                    } else {
                        lday = "X";
                    }
                    if (filters && filters.includes("numberOfItems")) {
                        const { SELECT } = req.query
                        if (SELECT.where) {
                            var index1 = SELECT.where.length - 5;
                            SELECT.where[index1].val = 0;
                        }
                    }
                }
            } else {
                lday = "X";
            }
            if (lday == "X") {
                var date = new Date();
                var whereaux = [];
                date.setDate(date.getDate() - 1);
                var day = (date.getDate() < 10) ? "0" + (date.getDate()) : date.getDate(),
                    month = (date.getMonth() + 1 < 10) ? "0" + (date.getMonth() + 1) : date.getMonth() + 1,
                    year = date.getFullYear(),
                    hours = (date.getHours() < 10) ? "0" + (date.getHours()) : date.getHours(),
                    minutes = (date.getMinutes() < 10) ? "0" + (date.getMinutes()) : date.getMinutes(),
                    seconds = (date.getSeconds() < 10) ? "0" + (date.getSeconds()) : date.getSeconds();

                var lastday = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + 'Z';
                const { SELECT } = req.query
                if (SELECT.where) {
                    var exp = ['and', { ref: ["timestamp_start"] }, ">", { val: lastday }]

                } else {
                    var exp = [{ ref: ["timestamp_start"] }, ">", { val: lastday }]
                    SELECT.where = [];
                }
                for (var i = 0; i < exp.length; i++) {
                    SELECT.where.push(exp[i]);
                }
            }
        } catch (err) {

        }
    })

    srv.after('UPDATE', 'Integrations', async (req) => {
        //  var data = req.data
        //   var status = data.status_code;
        //   var integ_id = data.id;
        try {
            var status = req.status_code;
            var integ_id = req.id;
            var type = req.type;
            var planning_uuid = req.planning_uuid;
            if (planning_uuid && status != "R" && planning_uuid != "") {
                const eventp = {
                    planning_uuid: planning_uuid,
                    last_execution: req.timestamp_end,
                    last_execution_timezone: 'UTC'
                }
                srv.emit('updatePlanning', eventp)
            }
            if (status == "S") {
                var items = await srv.run(
                    SELECT.from(Integration_Items).where({ integ_id: integ_id })
                )
                if (items.length == 0) {
                    var event = {
                        integ_id: integ_id
                    }
                    await srv.emit('deleteInteg', event)
                    event = null;
                }
                items = null;
            }
        } catch (err) {

        }
    })

    srv.before('UPDATE', 'Integrations', async (req) => {
        try {
            var now = new Date();
            var utc_now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));
            const nowjson = JSON.parse(JSON.stringify(utc_now));
            req.data.timestamp_end = nowjson;
            var status = req.data.status_code;
            var integ_id = req.data.id;
            if (status == "S") {
                var items = await srv.run(
                    SELECT.from(Integration_Items).where({ integ_id: integ_id })
                )
                if (items.length > 0) {
                    var pck_code;
                    var exist_S = "";
                    var exist_E = "";
                    for (var i = 0; i < items.length; i++) {
                        pck_code = items[i].pck_code;
                        if (items[i].status_code != "E") {
                            exist_S = "X";
                        } else if (items[i].status_code == "E") {
                            exist_E = "X";
                        }
                        if (exist_S == "X" && exist_E == "X") {
                            break;
                        }
                    }
                    items = null;
                    if (exist_E == "X" && exist_S == "X") {
                        req.data.status_code = "W";
                    } else if (exist_E == "X") {
                        req.data.status_code = "E";
                        if (pck_code == "SYN_WORKER") {
                            req.data.error_code = "W_RT_H001";
                        } else if (pck_code == "SYN_ORG") {
                            req.data.error_code = "O_RT_H001";
                        } else if (pck_code == "SYN_USER") {
                            req.data.error_code = "U_RT_H001";
                        }
                    } else if (exist_S == "X") {
                        req.data.status_code = "S";
                    }
                }
            }
        } catch (err) {

        }
    })

    srv.before('CREATE', 'Integrations', async (req) => {
        try {
            var now = new Date();
            var utc_now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));
            const nowjson = JSON.parse(JSON.stringify(utc_now));
            req.data.timestamp_start = nowjson;
            req.data.timezone = "UTC";
        } catch (err) {

        }
    })

    srv.after('READ', 'Integrations', (integrations, req) => {
        try {
            const promise = new Promise(async (resolve, reject) => {
                if (Array.isArray(integrations)) {
                    var l = integrations.length;
                    var i = 0;
                    if (integrations.length == 0) {
                        resolve(integrations);
                    }
                    integrations.map(async integration => {
                        var items = await cds.transaction(req).run(
                            SELECT.from(Integration_Items).where({ integ_id: integration.id })
                        )
                        i = i + 1;
                        integration.numberOfItems = items.length
                        if (integration.status_code !== "R") {
                            var date1 = new Date(integration.timestamp_end);
                            var date2 = new Date(integration.timestamp_start);
                            var diff = (date1.getTime() - date2.getTime()) / 1000;
                            integration.numberOfSeconds = diff;
                        } else {
                            integration.numberOfSeconds = 0;
                        }
                        if (i == l) {
                            items = null;
                            resolve(integrations);
                        }
                    });
                } else {
                    if (integrations) {
                        var items2 = await cds.transaction(req).run(
                            SELECT.from(Integration_Items).where({ integ_id: integrations.id })
                        )
                        i = i + 1;
                        integrations.numberOfItems = items2.length
                        if (integrations.status_code !== "R") {
                            var date1 = new Date(integrations.timestamp_end);
                            var date2 = new Date(integrations.timestamp_start);
                            var diff = (date1.getTime() - date2.getTime()) / 1000;
                            integrations.numberOfSeconds = diff;
                        } else {
                            integrations.numberOfSeconds = 0;
                        }
                        resolve(integrations);
                    } else {
                        resolve(integrations);
                    }
                }

                // resolve(integrations);
            })

            return promise
                .then(integrations => {
                    if (req._query) {
                        if (req._query.$orderby) {
                            var sorter = req._query.$orderby;
                            if (sorter.includes("numberOfSeconds")) {
                                var type = sorter.split(' ');
                                if (type[1] == "desc") {
                                    integrations.sort(function (a, b) {
                                        if (a.numberOfSeconds > b.numberOfSeconds) {
                                            return -1;
                                        }
                                        if (a.numberOfSeconds < b.numberOfSeconds) {
                                            return 1;
                                        }
                                        return 0;
                                    });

                                } else if (type[1] == "asc") {
                                    integrations.sort(function (a, b) {
                                        if (a.numberOfSeconds > b.numberOfSeconds) {
                                            return 1;
                                        }
                                        if (a.numberOfSeconds < b.numberOfSeconds) {
                                            return -1;
                                        }
                                        return 0;
                                    });

                                }
                            }
                            if (sorter.includes("numberOfItems")) {
                                var type = sorter.split(' ');
                                if (type[1] == "desc") {
                                    integrations.sort(function (a, b) {
                                        if (a.numberOfItems > b.numberOfItems) {
                                            return -1;
                                        }
                                        if (a.numberOfItems < b.numberOfItems) {
                                            return 1;
                                        }
                                        return 0;
                                    });

                                } else if (type[1] == "asc") {
                                    integrations.sort(function (a, b) {
                                        if (a.numberOfItems > b.numberOfItems) {
                                            return 1;
                                        }
                                        if (a.numberOfItems < b.numberOfItems) {
                                            return -1;
                                        }
                                        return 0;
                                    });

                                }
                            }
                        }
                        if (req._query.$filter) {
                            if (req._query.$filter.includes("numberOfItems")) {
                                var filters = req._query.$filter.split(' ');
                                var index1 = filters.length - 5;
                                var index2 = filters.length - 1;
                                var value1 = parseInt(filters[index1]);
                                var value2 = parseInt(filters[index2]);
                                for (let i = 0; i < integrations.length; i++) {
                                    var currentInteg = integrations[i];
                                    if (currentInteg.numberOfItems < value1 || currentInteg.numberOfItems > value2) {
                                        integrations.splice(i, 1);
                                        i = i - 1;
                                    }
                                }
                            }
                        }
                    }
                })
        } catch (err) {

        }
    })

    srv.before('READ', 'Di_Generation_Processes', async (req) => {
        try {
            var query = req._query;
            var lday;
            if (req._path.includes("Integrations(")) {
                lday = "";
            } else if (query) {
                var filters = query.$filter;
                if (filters && filters.includes("timestamp")) {
                    lday = "";
                } else {
                    lday = "X";
                }
                if (filters && filters.includes("numberOfItems")) {
                    const { SELECT } = req.query
                    if (SELECT.where) {
                        var index1 = SELECT.where.length - 5;
                        SELECT.where[index1].val = 0;
                    }
                }
            } else {
                lday = "X";
            }
            if (lday == "X") {
                var date = new Date();
                var whereaux = [];
                date.setDate(date.getDate() - 1);
                var day = (date.getDate() < 10) ? "0" + (date.getDate()) : date.getDate(),
                    month = (date.getMonth() + 1 < 10) ? "0" + (date.getMonth() + 1) : date.getMonth() + 1,
                    year = date.getFullYear(),
                    hours = (date.getHours() < 10) ? "0" + (date.getHours()) : date.getHours(),
                    minutes = (date.getMinutes() < 10) ? "0" + (date.getMinutes()) : date.getMinutes(),
                    seconds = (date.getSeconds() < 10) ? "0" + (date.getSeconds()) : date.getSeconds();

                var lastday = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + 'Z';
                const { SELECT } = req.query
                if (SELECT.where) {
                    var exp = ['and', { ref: ["timestamp_start"] }, ">", { val: lastday }]

                } else {
                    var exp = [{ ref: ["timestamp_start"] }, ">", { val: lastday }]
                    SELECT.where = [];
                }
                for (var i = 0; i < exp.length; i++) {
                    SELECT.where.push(exp[i]);
                }
            }
        } catch (err) {

        }
    })


    srv.after('UPDATE', 'Di_Template', async (req) => {
        try {
            var signature = req.signature;
            var active = req.active;
            var uuid_temp = req.uuid;
            if (!signature) {
                var items = await srv.run(
                    SELECT.from(Di_Template_Sign_Cfg).where({ template_uuid: uuid_temp }))
                if (items.length > 0) {
                    await srv.run(DELETE.from(Di_Template_Sign_Cfg).where({ template_uuid: uuid_temp }));
                }
            }
            if (active) {
                var template = await srv.run(SELECT.one.from(Di_Template).where({
                    uuid: uuid_temp
                }));

                var templates = await srv.run(SELECT.from(Di_Template).where({
                    template_id: template.template_id
                }));
                if (templates && Array.isArray(templates)) {
                    for (var i = 0; i < templates.length; i++) {
                        if (templates[i].template_version < template.template_version && !templates[i].deprecated) {
                            var updRow = await srv.run(
                                UPDATE(Di_Template).set(
                                    {
                                        active: false,
                                        deprecated: true
                                    })
                                    .where({ uuid: templates[i].uuid })
                            )
                        }
                    }
                }
            }
        } catch (err) {

        }
    })

    srv.before('UPDATE', 'Di_Template', async (req) => {
        try {
            //Delete metadata mappings if change doc type
            if (req.data.doc_type_id) {
                var temp = await srv.run(SELECT.one.from(Di_Template).where({ uuid: req.data.uuid }));
                if (temp) {
                    if (temp.doc_type_id != req.data.doc_type_id) { //change doc type
                        var items = await srv.run(
                            SELECT.from(Di_Template_Mappings).where({
                                template_uuid: req.data.uuid,
                                mapping_object: 'DOCID_META'
                            }))
                        if (items.length > 0) {
                            await srv.run(DELETE.from(Di_Template_Mappings).where({
                                template_uuid: req.data.uuid,
                                mapping_object: 'DOCID_META'
                            }));
                        }
                    }
                }
            }
        } catch (err) {

        }
    })


    srv.before('UPDATE', 'Di_Generation_Processes', async (req) => {
        try {
            var now = new Date();
            var utc_now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));
            const nowjson = JSON.parse(JSON.stringify(utc_now));
            req.data.timestamp_end = nowjson;
            var status = req.data.status;
            var gen_id = req.data.uuid;
            if (status == "S") {
                var items = await srv.run(
                    SELECT.from(Di_Generation_Processes_Doc).where({ genproc_uuid: gen_id })
                )
                if (items.length > 0) {
                    var exist_S = "";
                    var exist_E = "";
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].status == "S") {
                            exist_S = "X";
                        } else if (items[i].status == "E") {
                            exist_E = "X";
                        }
                        if (exist_S == "X" && exist_E == "X") {
                            break;
                        }
                    }
                    items = null;
                    if (exist_E == "X" && exist_S == "X") {
                        req.data.status = "W";
                    } else if (exist_E == "X") {
                        req.data.status = "E";
                        req.data.error_code = "TG_RT_H001"; //Meter el mensaje que sea TODO
                    } else if (exist_S == "X") {
                        req.data.status = "S";
                    }
                }
            }
        } catch (err) {

        }
    })


    srv.after('UPDATE', 'Di_Generation_Processes', async (req) => {
        try {
            //  var data = req.data
            //   var status = data.status_code;
            //   var integ_id = data.id;
            var status = req.status;
            var gen_id = req.uuid;
            var type = req.type;
            //var planning_uuid = req.planning_uuid;
            var process = await cds.transaction(req).run(
                SELECT.one.from(Di_Generation_Processes).where({ uuid: gen_id })
            )
            if (process) {
                if (process.planning_uuid && status != "R" && process.planning_uuid != "") {
                    const eventp = {
                        planning_uuid: process.planning_uuid,
                        last_execution: req.timestamp_end,
                        last_execution_timezone: 'UTC'
                    }
                    srv.emit('updatePlanning', eventp)
                }
            }
            if (status == "S") {
                var items = await srv.run(
                    SELECT.from(Di_Generation_Processes_Doc).where({ genproc_uuid: gen_id })
                )
                if (items.length == 0) {
                    var event = {
                        gen_id: gen_id
                    }
                    await srv.emit('deleteGeneration', event)
                    event = null;
                }
                items = null;
            }
        } catch (err) {

        }
    })

    srv.on('deleteInteg', async (msg) => {
        try {
            var del = "";
            var times = 0;
            do {
                try {
                    times++;
                    await srv.run(DELETE.from(Integrations).where({ id: msg.data.integ_id }));
                    del = "X";
                }
                catch (e) {
                    await sleep(500);
                }
            } while (del !== "X" && times < 10);
        } catch (err) {

        }

        //console.log('==> Received msg of type myEventName:' + msg.data.integ_id);
    })

    srv.on('deleteGeneration', async (msg) => {
        try {

            //console.log('==> Received msg of type myEventName:' + msg.data.integ_id);
            var del = "";
            var times = 0;
            do {
                try {
                    times++;
                    await srv.run(DELETE.from(Di_Generation_Processes).where({ uuid: msg.data.gen_id }))
                    del = "X";
                }
                catch (e) {
                    await sleep(500);
                }
            } while (del !== "X" && times < 10);
        } catch (err) {

        }

    })

    srv.on('deleteIntegItem', async (msg) => {
        try {
            srv.run(DELETE.from(Integration_Items).where({ item_id: msg.data.item_id }))
            //console.log('==> Received msg of type myEventName:' + msg.data.integ_id);
        } catch (err) {

        }
    })

    srv.on('deleteWorker', async (msg) => {
        try {
            srv.run(DELETE.from(Workers).where({ uuid: msg.data.worker_uuid }))
            //console.log('==> Received msg of type myEventName:' + msg.data.integ_id);
        } catch (err) {

        }
    })

    srv.on('updatePlanning', async (msg) => {
        try {
            srv.run(
                UPDATE(Integration_Pck_Planning).set(
                    {
                        last_execution: msg.data.last_execution,
                        last_execution_timezone: msg.data.last_execution_timezone
                    })
                    .where({ uuid: msg.data.planning_uuid })
            )
        } catch (err) {

        }
    })

    srv.on('updateOrg', async (msg) => {
        try {
            //var original_external_id = msg.data.original_external_id;
            var org = await srv.run(SELECT.from(Organizations).where({ external_id: msg.data.external_id }));
            if (org.length > 0) {
                if (!msg.data.original_external_id) {
                    msg.data.original_external_id = org[0].original_external_id;
                }
                if (!msg.data.corporate_name) {
                    msg.data.corporate_name = org[0].corporate_name;
                }
                if (!msg.data.name) {
                    msg.data.name = org[0].name;
                }
                if (!msg.data.last_item_id) {
                    msg.data.last_item_id = org[0].last_item_id;
                }
                if (!msg.data.last_status) {
                    msg.data.last_status = org[0].last_status;
                }
                srv.run(
                    UPDATE(Organizations).set(
                        {
                            original_external_id: msg.data.original_external_id,
                            name: msg.data.name, corporate_name: msg.data.corporate_name,
                            last_item_id: msg.data.last_item_id, last_status: msg.data.last_status,
                            last_timestamp: msg.data.last_timestamp
                        })
                        .where({ external_id: msg.data.external_id })
                )
                org = null;
            } else {
                if (!msg.data.original_external_id) {
                    msg.data.original_external_id = null;
                }
                if (!msg.data.corporate_name) {
                    msg.data.corporate_name = null;
                }
                if (!msg.data.name) {
                    msg.data.name = null;
                }
                if (!msg.data.last_item_id) {
                    msg.data.last_item_id = null;
                }
                if (!msg.data.last_status) {
                    msg.data.last_status = null;
                }
                srv.run(
                    INSERT.into(Organizations).entries(
                        {
                            external_id: msg.data.external_id, original_external_id: msg.data.original_external_id,
                            name: msg.data.name, corporate_name: msg.data.corporate_name,
                            last_item_id: msg.data.last_item_id, last_status: msg.data.last_status,
                            last_timestamp: msg.data.last_timestamp
                        })
                )
            }
        } catch (err) {

        }
    })

    srv.on('updateWorker', async (msg) => {
        try {
            var worker = await srv.run(SELECT.from(Workers).where({ external_id: msg.data.external_id }));
            if (worker.length > 0) {
                if (!msg.data.original_external_id) {
                    msg.data.original_external_id = worker[0].original_external_id;
                }
                if (!msg.data.email) {
                    msg.data.email = worker[0].email;
                }
                if (!msg.data.employee_number) {
                    msg.data.employee_number = worker[0].employee_number;
                }
                if (!msg.data.lastname) {
                    msg.data.lastname = worker[0].lastname;
                }
                if (!msg.data.organization_id) {
                    msg.data.organization_id = worker[0].organization_id;
                }
                if (!msg.data.last_item_id) {
                    msg.data.last_item_id = worker[0].last_item_id;
                }
                if (!msg.data.last_status) {
                    msg.data.last_status = worker[0].last_status;
                }
                srv.run(
                    UPDATE(Workers).set(
                        {
                            firstname: msg.data.firstname, original_external_id: msg.data.original_external_id,
                            employee_number: msg.data.employee_number, lastname: msg.data.lastname,
                            email: msg.data.email, last_item_id: msg.data.last_item_id,
                            last_status: msg.data.last_status, organization_id: msg.data.organization_id,
                            last_timestamp: msg.data.last_timestamp
                        })
                        .where({ external_id: msg.data.external_id })
                )
                worker = null;
            } else {
                if (!msg.data.original_external_id) {
                    msg.data.original_external_id = null;
                }
                if (!msg.data.email) {
                    msg.data.email = null;
                }
                if (!msg.data.employee_number) {
                    msg.data.employee_number = null;
                }
                if (!msg.data.lastname) {
                    msg.data.lastname = null;
                }
                if (!msg.data.organization_id) {
                    msg.data.organization_id = null;
                }
                if (!msg.data.last_item_id) {
                    msg.data.last_item_id = null;
                }
                if (!msg.data.last_status) {
                    msg.data.last_status = null;
                }
                srv.run(
                    INSERT.into(Workers).entries(
                        {
                            external_id: msg.data.external_id, original_external_id: msg.data.original_external_id,
                            firstname: msg.data.firstname, employee_number: msg.data.employee_number,
                            lastname: msg.data.lastname, email: msg.data.email, last_item_id: msg.data.last_item_id,
                            last_status: msg.data.last_status, organization_id: msg.data.organization_id,
                            last_timestamp: msg.data.last_timestamp
                        })
                )
            }
        } catch (err) {

        }
    })

    srv.on('updateUser', async (msg) => {
        try {
            var user = await srv.run(SELECT.from(Users).where({ external_id: msg.data.external_id }));
            if (user.length > 0) {
                if (!msg.data.original_external_id) {
                    msg.data.original_external_id = user[0].original_external_id;
                }
                if (!msg.data.email) {
                    msg.data.email = user[0].email;
                }
                if (!msg.data.employee_number) {
                    msg.data.employee_number = user[0].employee_number;
                }
                if (!msg.data.lastname) {
                    msg.data.lastname = user[0].lastname;
                }
                if (!msg.data.organization_id) {
                    msg.data.organization_id = user[0].organization_id;
                }
                if (!msg.data.last_item_id) {
                    msg.data.last_item_id = user[0].last_item_id;
                }
                if (!msg.data.last_status) {
                    msg.data.last_status = user[0].last_status;
                }
                srv.run(
                    UPDATE(Users).set(
                        {
                            firstname: msg.data.firstname, original_external_id: msg.data.original_external_id,
                            employee_number: msg.data.employee_number, lastname: msg.data.lastname,
                            email: msg.data.email, last_item_id: msg.data.last_item_id,
                            last_status: msg.data.last_status, organization_id: msg.data.organization_id,
                            last_timestamp: msg.data.last_timestamp
                        })
                        .where({ external_id: msg.data.external_id })
                )
                user = null;
            } else {
                if (!msg.data.original_external_id) {
                    msg.data.original_external_id = null;
                }
                if (!msg.data.email) {
                    msg.data.email = null;
                }
                if (!msg.data.employee_number) {
                    msg.data.employee_number = null;
                }
                if (!msg.data.lastname) {
                    msg.data.lastname = null;
                }
                if (!msg.data.organization_id) {
                    msg.data.organization_id = null;
                }
                if (!msg.data.last_item_id) {
                    msg.data.last_item_id = null;
                }
                if (!msg.data.last_status) {
                    msg.data.last_status = null;
                }
                srv.run(
                    INSERT.into(Users).entries(
                        {
                            external_id: msg.data.external_id, original_external_id: msg.data.original_external_id,
                            firstname: msg.data.firstname, employee_number: msg.data.employee_number, lastname: msg.data.lastname,
                            email: msg.data.email, last_item_id: msg.data.last_item_id,
                            last_status: msg.data.last_status, organization_id: msg.data.organization_id,
                            last_timestamp: msg.data.last_timestamp
                        })
                )
            }
        } catch (err) {

        }
    })

    srv.before('CREATE', 'Integration_Items', async (req) => {
        try {
            var now = new Date();
            var utc_now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));
            const nowjson = JSON.parse(JSON.stringify(utc_now));
            req.data.timestamp_start = nowjson;
            req.data.timezone = "UTC";
        } catch (err) {

        }
    })

    srv.before('CREATE', 'Di_Generation_Processes_Doc', async (req) => {
        try {
            var now = new Date();
            var utc_now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));
            const nowjson = JSON.parse(JSON.stringify(utc_now));
            req.data.timestamp = nowjson;
            req.data.timezone = "UTC";
        } catch (err) {

        }
    })


    srv.before('CREATE', 'Di_Generation_Processes', async (req) => {
        try {
            var now = new Date();
            var utc_now = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));
            const nowjson = JSON.parse(JSON.stringify(utc_now));
            req.data.timestamp_start = nowjson;
            req.data.timezone = "UTC";
        } catch (err) {

        }
    })

    srv.before('DELETE', 'Integration_Pck_Planning', async (req) => {
        try {
            var items = await cds.transaction(req).run(
                SELECT.from(Integration_Pck_Planning_D).where({ planning_uuid: req.data.uuid })
            )
            if (items.length > 0) {
                srv.run(DELETE.from(Integration_Pck_Planning_D).where({ planning_uuid: req.data.uuid }))
            }
            items = null;

            var itemsA = await cds.transaction(req).run(
                SELECT.from(Integration_Pck_Planning_Adata).where({ planning_uuid: req.data.uuid })
            )
            if (itemsA.length > 0) {
                srv.run(DELETE.from(Integration_Pck_Planning_Adata).where({ planning_uuid: req.data.uuid }))
            }
            itemsA = null;
        } catch (err) {

        }

    })

    srv.before('DELETE', 'Di_Template_Worker_Attr', async (req) => {
        try {
            var items = await cds.transaction(req).run(
                SELECT.from(Di_Template_Worker_Attr_Values).where({ attr_uuid: req.data.uuid })
            )
            if (items.length > 0) {
                srv.run(DELETE.from(Di_Template_Worker_Attr_Values).where({ attr_uuid: req.data.uuid }))
            }
            items = null;
        } catch (err) {

        }
    })

    srv.after('CREATE', 'Di_Template', async (req) => {
        //    var templates = await srv.run(SELECT.from(Di_Template).where({
        //        template_id: req.data.template_id
        //    }));
        //   if (templates && Array.isArray(templates)) {
        //       for (var i = 0; i < templates.length; i++) {
        //            if (templates[i].template_version !== req.data.template_version && templates[i].active) {
        //               var updRow = await srv.run(
        //                   UPDATE(Di_Template).set(
        //                       {
        //                           active: false
        //                       })
        //                        .where({ uuid: templates[i].uuid })
        //                )
        //            }
        //       }
        //    }

    })

    srv.after('CREATE', 'Di_Generation_Processes_Doc', async (req) => {
        try {
            var doc = req
            var genproc_uuid = doc.genproc_uuid;
            var gen_proc = await srv.run(SELECT.one.from(Di_Generation_Processes).where({
                uuid: genproc_uuid
            }));
            if (gen_proc) {
                var emp_uuid;
                var employee = await srv.run(SELECT.one.from(Di_Employee).where({
                    employee_number: doc.employee_number
                }));
                if (!employee) {
                    // lo creo
                    var insEmp = await srv.run(
                        INSERT.into(Di_Employee).entries(
                            {
                                employee_external_id: doc.employee_external_id,
                                employee_number: doc.employee_number
                            })
                    )
                    emp_uuid = insEmp.uuid;
                } else {
                    emp_uuid = employee.uuid;
                }
                var emp_template = await srv.run(SELECT.one.from(Di_Employee_Template).where({
                    employee_uuid: emp_uuid,
                    template_uuid: gen_proc.template_uuid
                }));
                if (emp_template) {
                    //lo actualizo emp_temp
                    var updEmpTemp = await srv.run(
                        UPDATE(Di_Employee_Template).set(
                            {
                                last_status: doc.status,
                                last_execution_uuid: doc.uuid
                            })
                            .where({ uuid: emp_template.uuid })
                    )


                } else {
                    //lo creo emp_temp
                    var insEmpTemp = await srv.run(
                        INSERT.into(Di_Employee_Template).entries(
                            {
                                employee_uuid: emp_uuid,
                                template_uuid: gen_proc.template_uuid,
                                last_status: doc.status,
                                last_execution_uuid: doc.uuid
                            })
                    )


                }
            }
        } catch (err) {

        }
    })

    srv.after('CREATE', 'Integration_Items', async (req) => {
        try {
            var integ_item = req
            // const tx = cds.transaction(req)
            var buff = Buffer.from(integ_item.request, 'base64');
            var text = buff.toString('UTF8');
            // //var text = b64DecodeUnicode(integ_item.request);
            // //var text = atob(integ_item.request);
            var objectValue = JSON.parse(text);
            var external_id = integ_item.external_id;
            // var firstname = objectValue['firstname'];
            var pck_code = integ_item.pck_code;
            var configuration = await srv.run(SELECT.from(Configurations).where({
                pck_code: pck_code,
                conf_code: 'SCE-CONFIG'
            }));

            var buff = Buffer.from(configuration[0].value, 'base64');
            var text = buff.toString('UTF8');
            var xml2js = require('xml2js');
            var resultado, res2;
            xml2js.parseString(text, (err, result) => {
                if (err) {
                    throw err;
                }
                resultado = result;
            });
            xml2js = null;
            configuration = null;
            buff = null;
            text = null;
            var glo_conf = resultado['global_configuration'];
            var ret_period = glo_conf['retention_period'];
            if (ret_period) {
                var logic_type = ret_period['0']['logic_type'][0];
            } else {
                var logic_type = '02';
            }
            if (logic_type != '01') {
                if (pck_code == "SYN_WORKER") {
                    if (objectValue['registration_references']) {
                        var reg_ref = objectValue['registration_references'];
                        var employee_number = reg_ref[0].employee_number;
                        var organization_id = reg_ref[0].organization_id;
                    }
                    var event = {
                        external_id: external_id,
                        last_item_id: integ_item.item_id,
                        last_status: integ_item.status_code,
                        original_external_id: integ_item.original_external_id,
                        employee_number: employee_number,
                        firstname: objectValue['firstname'],
                        lastname: objectValue['lastname'],
                        email: objectValue['email'],
                        organization_id: organization_id,
                        last_timestamp: integ_item.timestamp_start
                    }

                    srv.emit('updateWorker', event)
                    event = null;

                } else if (pck_code == "SYN_ORG") {
                    var event = {
                        external_id: external_id,
                        last_item_id: integ_item.item_id,
                        last_status: integ_item.status_code,
                        original_external_id: integ_item.original_external_id,
                        name: objectValue['name'],
                        corporate_name: objectValue['corporate_name'],
                        last_timestamp: integ_item.timestamp_start
                    }

                    srv.emit('updateOrg', event)
                    event = null;

                } else if (pck_code == "SYN_USER") {
                    if (objectValue['registration_references']) {
                        var reg_ref = objectValue['registration_references'];
                        var employee_number = reg_ref[0].employee_number;
                        var organization_id = reg_ref[0].organization_id;
                    }
                    var event = {
                        external_id: external_id,
                        last_item_id: integ_item.item_id,
                        last_status: integ_item.status_code,
                        original_external_id: integ_item.original_external_id,
                        employee_number: employee_number,
                        firstname: objectValue['firstname'],
                        lastname: objectValue['lastname'],
                        email: objectValue['email'],
                        organization_id: organization_id,
                        last_timestamp: integ_item.timestamp_start
                    }

                    srv.emit('updateUser', event)
                    event = null;
                }
            }
        } catch (err) {

        }
    })

    srv.after('READ', 'Workers', async (workers, req) => {
        try {
            const promise = new Promise(async (resolve, reject) => {
                if (Array.isArray(workers)) {
                    var l = workers.length;
                    var i = 0;
                    if (workers.length == 0) {
                        resolve(workers);
                    }
                    workers.map(async worker => {
                        var items = await cds.transaction(req).run(
                            SELECT.from(Integration_Items).where({ external_id: worker.external_id })
                        )
                        worker.numberOfItems = items.length
                        i = i + 1;
                        if (i == l) {
                            resolve(workers);
                            items = null;
                        }
                    })
                } else {
                    if (workers) {
                        var items2 = await cds.transaction(req).run(
                            SELECT.from(Integration_Items).where({ external_id: workers.external_id })
                        )
                        workers.numberOfItems = items2.length
                        resolve(workers);
                    } else {
                        resolve(workers);
                    }
                }
            })
            return promise
        } catch (err) {

        }
    })

    srv.after('READ', 'Di_Generation_Processes', async (processes, req) => {
        try {
            const promise = new Promise(async (resolve, reject) => {
                if (Array.isArray(processes)) {
                    var l = processes.length;
                    var i = 0;
                    if (processes.length == 0) {
                        resolve(processes);
                    }
                    processes.map(async process => {
                        var items = await cds.transaction(req).run(
                            SELECT.from(Di_Generation_Processes_Doc).where({ genproc_uuid: process.uuid })
                        )
                        process.numberOfItems = items.length
                        i = i + 1;
                        if (process.status !== "R") {
                            var date1 = new Date(process.timestamp_end);
                            var date2 = new Date(process.timestamp_start);
                            var diff = (date1.getTime() - date2.getTime()) / 1000;
                            process.numberOfSeconds = diff;
                        } else {
                            process.numberOfSeconds = 0;
                        }
                        if (i == l) {
                            resolve(processes);
                            items = null;
                        }
                    })
                } else {
                    if (processes) {
                        var items2 = await cds.transaction(req).run(
                            SELECT.from(Di_Generation_Processes_Doc).where({ genproc_uuid: processes.uuid })
                        )
                        processes.numberOfItems = items2.length
                        if (processes.status !== "R") {
                            var date1 = new Date(processes.timestamp_end);
                            var date2 = new Date(processes.timestamp_start);
                            var diff = (date1.getTime() - date2.getTime()) / 1000;
                            processes.numberOfSeconds = diff;
                        } else {
                            processes.numberOfSeconds = 0;
                        }
                        resolve(processes);
                    } else {
                        resolve(processes);
                    }
                }
            })
            return promise
        } catch (err) {

        }
    })

    srv.after('READ', 'Users', async (users, req) => {
        try {
            const promise = new Promise(async (resolve, reject) => {
                if (Array.isArray(users)) {
                    var l = users.length;
                    var i = 0;
                    if (users.length == 0) {
                        resolve(users);
                    }
                    users.map(async user => {
                        var items = await cds.transaction(req).run(
                            SELECT.from(Integration_Items).where({ external_id: user.external_id })
                        )
                        user.numberOfItems = items.length
                        i = i + 1;
                        if (i == l) {
                            resolve(users);
                            items = null;
                        }
                    })
                } else {
                    if (users) {
                        var items2 = await cds.transaction(req).run(
                            SELECT.from(Integration_Items).where({ external_id: users.external_id })
                        )
                        users.numberOfItems = items2.length
                        resolve(users);
                    } else {
                        resolve(users);
                    }
                }
            })
            return promise
        } catch (err) {

        }
    })

    srv.after('READ', 'Organizations', async (organizations, req) => {
        try {
            const promise = new Promise(async (resolve, reject) => {
                if (Array.isArray(organizations)) {
                    var l = organizations.length;
                    var i = 0;
                    if (organizations.length == 0) {
                        resolve(organizations);
                    }
                    organizations.map(async organization => {
                        var items = await cds.transaction(req).run(
                            SELECT.from(Integration_Items).where({ external_id: organization.external_id })
                        )
                        organization.numberOfItems = items.length
                        i = i + 1;
                        if (i == l) {
                            resolve(organizations);
                            items = null;
                        }
                    })
                } else {
                    if (organizations) {
                        var items2 = await cds.transaction(req).run(
                            SELECT.from(Integration_Items).where({ external_id: organizations.external_id })
                        )
                        organizations.numberOfItems = items2.length
                        resolve(organizations);
                    } else {
                        resolve(organizations);
                    }
                }
            })
            return promise
        } catch (err) {

        }

    })

    srv.on('delete_mappings', async (req) => {
        try {
            var future_deletes = await srv.run(SELECT.from(Di_Template_Mappings).where({
                template_uuid: req.data.uuid,
                mapping_object: 'TEMPL_MAPP'
            }));
            if (future_deletes.length > 0) {
                await srv.run(DELETE.from(Di_Template_Mappings).where({
                    template_uuid: req.data.uuid,
                    mapping_object: 'TEMPL_MAPP'
                }));
                return "All the records deleted";
            } else {
                return "There is nothing to delete";
            }
        } catch (err) {

        }
    })

    srv.on('delete_mappings_meta', async (req) => {
        try {
            var future_deletes = await srv.run(SELECT.from(Di_Template_Mappings).where({
                template_uuid: req.data.uuid,
                mapping_object: 'DOCID_META'
            }));
            if (future_deletes.length > 0) {
                await srv.run(DELETE.from(Di_Template_Mappings).where({
                    template_uuid: req.data.uuid,
                    mapping_object: 'DOCID_META'
                }));
                return "All the records deleted";
            } else {
                return "There is nothing to delete";
            }
        } catch (err) {

        }
    })

    srv.on('delete_attr_values', async (req) => {
        try {
            var future_va_deletes = await srv.run(SELECT.from(Di_Template_Worker_Attr_Values).where({ attr_uuid: req.data.uuid }));
            if (future_va_deletes.length > 0) {
                await srv.run(DELETE.from(Di_Template_Worker_Attr_Values).where({ attr_uuid: req.data.uuid }));
                return "All the values deleted";
            } else {
                return "There is nothing to delete";
            }
        } catch (err) {

        }
    })

    srv.on('delete_conf_signature', async (req) => {
        try {
            var future_conf_deletes = await srv.run(SELECT.from(Di_Template_Sign_Cfg).where({ uuid: req.data.uuid }));
            if (future_conf_deletes.length > 0) {
                await srv.run(DELETE.from(Di_Template_Sign_Cfg).where({ uuid: req.data.uuid }));
                return "Signature Configuration deleted";
            } else {
                return "There is nothing to delete";
            }
        } catch (err) {

        }
    })

    srv.on('can_be_activated', async (req) => {
        try {
            var template = await srv.run(SELECT.one.from(Di_Template).where({ uuid: req.data.uuid }));
            if (template) {
                if (template.bpt_id == null) {
                    return "Template hasn't business process type assigned.";
                }
                if (template.doc_type_id == null) {
                    return "Template hasn't document type assigned.";
                }
                var mappings = await srv.run(SELECT.from(Di_Template_Mappings).where({ template_uuid: req.data.uuid }));
                if (mappings.length > 0) {
                    for (var i = 0; i < mappings.length; i++) {
                        if (mappings[i].required && (mappings[i].mapping == "" || mappings[i].mapping == null)) {
                            return "Template has uninformed mandatory mappings.";
                        }
                    }
                }
                var signat;
                if (req.data.sign == 'false') {
                    signat = false;
                } else if (req.data.sign == 'true') {
                    signat = true;
                } else {
                    signat = req.data.sign;
                }
                if (signat) {
                    if (template.signature) {
                        var sign = await srv.run(SELECT.one.from(Di_Template_Sign_Cfg).where({ template_uuid: req.data.uuid }));
                        if (!sign) {
                            return "Template hasn't sign configuration.";
                        }
                    }
                }
                // var planning = await srv.run(SELECT.one.from(Integration_Pck_Planning).where({ uuid: template.planning_uuid }));
                // if (planning) {
                //     if (!planning.enable) {
                //        return false;
                //    }
                //  } else {
                //     return false;
                //  }
                return "";
            }
        } catch (err) {

        }

    })
    srv.on('delete_planning_repro', async (req) => {
        try {
            var template = await srv.run(SELECT.one.from(Di_Template).where({ uuid: req.data.uuid }));
            if (template && template.planning_rep_uuid !== null) {
                var plan_d = await srv.run(SELECT.from(Integration_Pck_Planning_D).where({ planning_uuid: template.planning_rep_uuid }));
                if (plan_d && Array.isArray(plan_d)) {
                    for (var i = 0; i < plan_d.length; i++) {
                        srv.run(DELETE.from(Integration_Pck_Planning_D).where({ uuid: plan_d[i].uuid }));
                    }
                }
                //       var plan_adata = await srv.run(SELECT.from(Integration_Pck_Planning_Adata).where({ planning_uuid: template.planning_rep_uuid }));
                //       if (plan_adata && Array.isArray(plan_adata)) {
                //           for (var i = 0; i < plan_adata.length; i++) {
                //               srv.run(DELETE.from(Integration_Pck_Planning_Adata).where({ uuid: plan_adata[i].uuid }));
                //            }
                //        }
                await srv.run(DELETE.from(Integration_Pck_Planning).where({ uuid: template.planning_rep_uuid }));
                template.planning_rep_uuid = null;
                var updRow = await srv.run(
                    UPDATE(Di_Template).set(
                        {
                            planning_rep_uuid: template.planning_rep_uuid
                        })
                        .where({ uuid: req.data.uuid })
                )
                return "Success";
            } else {
                return "Success";
            }
        } catch (err) {

        }

    })
    srv.on('delete_complete_template', async (req) => {
        try {
            var temp_del = await srv.run(SELECT.one.from(Di_Template).where({ uuid: req.data.uuid }));
            if (temp_del) {
                var map_del = await srv.run(SELECT.from(Di_Template_Mappings).where({ template_uuid: req.data.uuid }));
                if (map_del && Array.isArray(map_del)) {
                    for (var i = 0; i < map_del.length; i++) {
                        await srv.run(DELETE.from(Di_Template_Mappings).where({ uuid: map_del[i].uuid }));
                    }
                }

                var signConfs = await srv.run(SELECT.from(Di_Template_Sign_Cfg).where({ template_uuid: req.data.uuid }));
                if (signConfs && Array.isArray(signConfs)) {
                    for (var i = 0; i < signConfs.length; i++) {
                        await srv.run(DELETE.from(Di_Template_Sign_Cfg).where({ uuid: signConfs[i].uuid }));
                    }
                }

                if (temp_del.planning_uuid && temp_del.planning_uuid !== null) {
                    var planning_del = await srv.run(SELECT.one.from(Integration_Pck_Planning).where({ uuid: temp_del.planning_uuid }));
                    if (planning_del) {
                        await srv.run(DELETE.from(Integration_Pck_Planning).where({ uuid: planning_del.uuid }));
                    }
                    var pland_del = await srv.run(SELECT.one.from(Integration_Pck_Planning_D).where({ planning_uuid: temp_del.planning_uuid }));
                    if (pland_del) {
                        await srv.run(DELETE.from(Integration_Pck_Planning_D).where({ uuid: pland_del.uuid }));
                    }
                    var planadata_del = await srv.run(SELECT.from(Integration_Pck_Planning_Adata).where({ planning_uuid: temp_del.planning_uuid }));
                    if (planadata_del && Array.isArray(planadata_del)) {
                        for (var i = 0; i < planadata_del.length; i++) {
                            await srv.run(DELETE.from(Integration_Pck_Planning_Adata).where({ uuid: planadata_del[i].uuid }));
                        }
                    }
                }

                if (temp_del.planning_rep_uuid && temp_del.planning_rep_uuid !== null) {
                    var planning_rep_del = await srv.run(SELECT.one.from(Integration_Pck_Planning).where({ uuid: temp_del.planning_rep_uuid }));
                    if (planning_rep_del) {
                        await srv.run(DELETE.from(Integration_Pck_Planning).where({ uuid: planning_rep_del.uuid }));
                    }
                    var pland_rep_del = await srv.run(SELECT.one.from(Integration_Pck_Planning_D).where({ planning_uuid: temp_del.planning_rep_uuid }));
                    if (pland_rep_del) {
                        await srv.run(DELETE.from(Integration_Pck_Planning_D).where({ uuid: pland_rep_del.uuid }));
                    }
                }

                var worker_attr_del = await srv.run(SELECT.from(Di_Template_Worker_Attr).where({ template_uuid: req.data.uuid }));
                if (worker_attr_del && Array.isArray(worker_attr_del)) {
                    for (var i = 0; i < worker_attr_del.length; i++) {
                        var attr_values_del = await srv.run(SELECT.from(Di_Template_Worker_Attr_Values).where({ attr_uuid: worker_attr_del[i].attr_uuid }));
                        if (attr_values_del && Array.isArray(attr_values_del)) {
                            for (var j = 0; j < attr_values_del.length; j++) {
                                await srv.run(DELETE.from(Di_Template_Worker_Attr_Values).where({ uuid: attr_values_del[j].uuid }));
                            }
                        }
                        await srv.run(DELETE.from(Di_Template_Worker_Attr).where({ uuid: worker_attr_del[i].uuid }));
                    }
                }

                await srv.run(DELETE.from(Di_Template).where({ uuid: req.data.uuid }));
                return "Template Configuration deleted successfully."

            } else {
                return "This Template Configuration  doesn't exist"
            }
        } catch (err) {

        }

    })


    srv.on('copy_template_config', async (req) => {
        try {
            //TODO borrar objetos de template target
            var temp_ori_uuid = req.data.uuid_to_copy;
            var temp_new_uuid = req.data.uuid_new;
            var temp_ori = await srv.run(SELECT.one.from(Di_Template).where({ uuid: req.data.uuid_to_copy }));
            var temp_new = await srv.run(SELECT.one.from(Di_Template).where({ uuid: temp_new_uuid }));
            if (temp_new.active) {
                return "Template must be inactive";
            }
            if (temp_ori && temp_new) {
                if (req.data.mappings == 'true') {
                    var map_del = await srv.run(SELECT.from(Di_Template_Mappings).where({ template_uuid: temp_new_uuid, mapping_object: 'TEMPL_MAPP' }));
                    if (map_del && Array.isArray(map_del)) {
                        for (var i = 0; i < map_del.length; i++) {
                            await srv.run(DELETE.from(Di_Template_Mappings).where({ uuid: map_del[i].uuid }));
                        }
                    }
                    var mappings = await srv.run(SELECT.from(Di_Template_Mappings).where({ template_uuid: temp_ori_uuid, mapping_object: 'TEMPL_MAPP' }));
                    if (mappings && Array.isArray(mappings)) {
                        for (var i = 0; i < mappings.length; i++) {
                            mappings[i].template_uuid = temp_new_uuid;
                            delete mappings[i].uuid;
                        }
                        if (mappings.length > 0) {
                            await srv.run(
                                INSERT(mappings).into(Di_Template_Mappings)
                            )
                        }
                    }
                }
                if (req.data.metadata == 'true') {
                    var meta_del = await srv.run(SELECT.from(Di_Template_Mappings).where({ template_uuid: temp_new_uuid, mapping_object: 'DOCID_META' }));
                    if (meta_del && Array.isArray(meta_del)) {
                        for (var i = 0; i < meta_del.length; i++) {
                            await srv.run(DELETE.from(Di_Template_Mappings).where({ uuid: meta_del[i].uuid }));
                        }
                    }
                    var metadatas = await srv.run(SELECT.from(Di_Template_Mappings).where({ template_uuid: temp_ori_uuid, mapping_object: 'DOCID_META' }));
                    if (metadatas && Array.isArray(metadatas)) {
                        for (var i = 0; i < metadatas.length; i++) {
                            metadatas[i].template_uuid = temp_new_uuid;
                            delete metadatas[i].uuid;
                        }
                        if (metadatas.length > 0) {
                            await srv.run(
                                INSERT(metadatas).into(Di_Template_Mappings)
                            )
                        }
                    }
                }
                if (req.data.variables == 'true') {
                    var var_del = await srv.run(SELECT.from(Di_Template_Mappings).where({ template_uuid: temp_new_uuid, mapping_object: 'GLOBAL_VAR' }));
                    if (var_del && Array.isArray(var_del)) {
                        for (var i = 0; i < var_del.length; i++) {
                            await srv.run(DELETE.from(Di_Template_Mappings).where({ uuid: var_del[i].uuid }));
                        }
                    }

                    var variables = await srv.run(SELECT.from(Di_Template_Mappings).where({ template_uuid: temp_ori_uuid, mapping_object: 'GLOBAL_VAR' }));
                    if (variables && Array.isArray(variables)) {
                        for (var i = 0; i < variables.length; i++) {
                            variables[i].template_uuid = temp_new_uuid;
                            delete variables[i].uuid;
                        }
                        if (variables.length > 0) {
                            await srv.run(
                                INSERT(variables).into(Di_Template_Mappings)
                            )
                        }
                    }
                }
                if (req.data.sign_conf == 'true') {
                    var signConf = await srv.run(SELECT.one.from(Di_Template_Sign_Cfg).where({ template_uuid: temp_new_uuid }));
                    if (signConf) {
                        // for (var i = 0; i < signConfs.length; i++) {
                        await srv.run(DELETE.from(Di_Template_Sign_Cfg).where({ uuid: signConf.uuid }));
                        //  }
                    }
                    var sign_Config = await srv.run(SELECT.one.from(Di_Template_Sign_Cfg).where({ template_uuid: temp_ori_uuid }));
                    if (sign_Config) {
                        //  if (sign_Config.length > 0) {
                        sign_Config.template_uuid = temp_new_uuid;
                        delete sign_Config.uuid;
                        await srv.run(
                            INSERT(sign_Config).into(Di_Template_Sign_Cfg)
                        )
                        // }
                    }
                }
                if (temp_ori.planning_uuid && temp_ori.planning_uuid !== "") {
                    if (req.data.planning == 'true') {
                        // Borramos planning anterior si existe
                        if (temp_new.planning_uuid && temp_new.planning_uuid !== null) {
                            var planning_del = await srv.run(SELECT.one.from(Integration_Pck_Planning).where({ uuid: temp_new.planning_uuid }));
                            if (planning_del) {
                                await srv.run(DELETE.from(Integration_Pck_Planning).where({ uuid: planning_del.uuid }));
                            }
                            var pland_del = await srv.run(SELECT.one.from(Integration_Pck_Planning_D).where({ planning_uuid: temp_new.planning_uuid }));
                            if (pland_del) {
                                await srv.run(DELETE.from(Integration_Pck_Planning_D).where({ uuid: pland_del.uuid }));
                            }
                            var planadata_del = await srv.run(SELECT.from(Integration_Pck_Planning_Adata).where({ planning_uuid: temp_new.planning_uuid }));
                            if (planadata_del && Array.isArray(planadata_del)) {
                                for (var i = 0; i < planadata_del.length; i++) {
                                    await srv.run(DELETE.from(Integration_Pck_Planning_Adata).where({ uuid: planadata_del[i].uuid }));
                                }
                            }
                        }
                        // Copiamos la de la otra template
                        var planning = await srv.run(SELECT.one.from(Integration_Pck_Planning).where({ uuid: temp_ori.planning_uuid }));
                        if (planning) {
                            delete planning.uuid;
                            planning.enable = false;
                            var new_plan = await srv.run(
                                INSERT(planning).into(Integration_Pck_Planning)
                            )
                            temp_new.planning_uuid = new_plan.uuid;
                            var plan_d = await srv.run(SELECT.one.from(Integration_Pck_Planning_D).where({ planning_uuid: temp_ori.planning_uuid }));
                            if (plan_d) {
                                delete plan_d.uuid;
                                plan_d.planning_uuid = new_plan.uuid;

                                await srv.run(
                                    INSERT(plan_d).into(Integration_Pck_Planning_D)
                                )
                            }
                            var plan_adata = await srv.run(SELECT.from(Integration_Pck_Planning_Adata).where({ planning_uuid: temp_ori.planning_uuid }));
                            if (plan_adata && Array.isArray(plan_adata)) {
                                for (var i = 0; i < plan_adata.length; i++) {
                                    plan_adata[i].planning_uuid = new_plan.uuid;
                                    delete plan_adata[i].uuid;
                                    if (plan_adata[i].level2 === "NEXT_UPDATED_FROM") {
                                        plan_adata[i].value = "";
                                    }
                                }
                                if (plan_adata.length > 0) {
                                    await srv.run(
                                        INSERT(plan_adata).into(Integration_Pck_Planning_Adata)
                                    )
                                }
                            }
                        }
                    }
                }
                if (temp_ori.planning_rep_uuid && temp_ori.planning_rep_uuid !== "") {
                    if (req.data.planning_rep == 'true') {
                        // Borramos planning anterior si existe
                        if (temp_new.planning_rep_uuid && temp_new.planning_rep_uuid !== null) {
                            var planning_rep_del = await srv.run(SELECT.one.from(Integration_Pck_Planning).where({ uuid: temp_new.planning_rep_uuid }));
                            if (planning_rep_del) {
                                await srv.run(DELETE.from(Integration_Pck_Planning).where({ uuid: planning_rep_del.uuid }));
                            }
                            var pland_rep_del = await srv.run(SELECT.one.from(Integration_Pck_Planning_D).where({ planning_uuid: temp_new.planning_rep_uuid }));
                            if (pland_rep_del) {
                                await srv.run(DELETE.from(Integration_Pck_Planning_D).where({ uuid: pland_rep_del.uuid }));
                            }
                        }
                        // Copiamos la de la otra template
                        var planning_rep = await srv.run(SELECT.one.from(Integration_Pck_Planning).where({ uuid: temp_ori.planning_rep_uuid }));
                        if (planning_rep) {
                            delete planning_rep.uuid;
                            planning_rep.enable = false;
                            var new_plan_rep = await srv.run(
                                INSERT(planning_rep).into(Integration_Pck_Planning)
                            )
                            temp_new.planning_rep_uuid = new_plan_rep.uuid;
                            var plan_d_rep = await srv.run(SELECT.one.from(Integration_Pck_Planning_D).where({ planning_uuid: temp_ori.planning_rep_uuid }));
                            if (plan_d_rep) {
                                delete plan_d_rep.uuid;
                                plan_d_rep.planning_uuid = new_plan_rep.uuid;
                                await srv.run(
                                    INSERT(plan_d_rep).into(Integration_Pck_Planning_D)
                                )
                            }
                        }
                    }
                }
                if (req.data.worker_attr == 'true') {
                    var worker_attr_del = await srv.run(SELECT.from(Di_Template_Worker_Attr).where({ template_uuid: temp_new_uuid }));
                    if (worker_attr_del && Array.isArray(worker_attr_del)) {
                        for (var i = 0; i < worker_attr_del.length; i++) {
                            var attr_values_del = await srv.run(SELECT.from(Di_Template_Worker_Attr_Values).where({ attr_uuid: worker_attr_del[i].attr_uuid }));
                            if (attr_values_del && Array.isArray(attr_values_del)) {
                                for (var j = 0; j < attr_values_del.length; j++) {
                                    await srv.run(DELETE.from(Di_Template_Worker_Attr_Values).where({ uuid: attr_values_del[j].uuid }));
                                }
                            }
                            await srv.run(DELETE.from(Di_Template_Worker_Attr).where({ uuid: worker_attr_del[i].uuid }));
                        }
                    }

                    var worker_attr = await srv.run(SELECT.from(Di_Template_Worker_Attr).where({ template_uuid: temp_ori_uuid }));
                    if (worker_attr) {
                        for (var i = 0; i < worker_attr.length; i++) {
                            worker_attr[i].template_uuid = temp_new_uuid;
                            var attr_uuid = worker_attr[i].uuid;
                            var attr_values = await srv.run(SELECT.from(Di_Template_Worker_Attr_Values).where({ attr_uuid: attr_uuid }));
                            delete worker_attr[i].uuid;
                            var new_worker_attr = await srv.run(
                                INSERT(worker_attr[i]).into(Di_Template_Worker_Attr)
                            )
                            if (attr_values) {
                                for (var j = 0; j < attr_values.length; j++) {
                                    delete attr_values[j].uuid;
                                    attr_values[j].attr_uuid = new_worker_attr.uuid;
                                }
                                await srv.run(
                                    INSERT(attr_values).into(Di_Template_Worker_Attr_Values)
                                )
                            }
                        }
                    }
                }
            }
            if (req.data.planning == 'true') {
                if (temp_new.planning_uuid) {
                    var updRow = await srv.run(
                        UPDATE(Di_Template).set(
                            {
                                planning_uuid: temp_new.planning_uuid
                            })
                            .where({ uuid: temp_new_uuid })
                    )
                }
            }
            if (req.data.planning_rep == 'true') {
                if (temp_new.planning_rep_uuid) {
                    var updRow = await srv.run(
                        UPDATE(Di_Template).set(
                            {
                                planning_rep_uuid: temp_new.planning_rep_uuid
                            })
                            .where({ uuid: temp_new_uuid })
                    )
                }
            }
            if (req.data.worker_attr == 'true') {
                if (temp_ori.bpt_id) {
                    var updRow = await srv.run(
                        UPDATE(Di_Template).set(
                            {
                                bpt_id: temp_ori.bpt_id
                            })
                            .where({ uuid: temp_new_uuid })
                    )
                }
            }
            return "Success";
        } catch (err) {

        }
    })

    srv.on('set_user_future_changes', async (req) => {
        try {
            if (req.data.date == null) {
                var future_delete = await srv.run(SELECT.from(User_Future_Changes).where({ external_id: req.data.uuid }));
                if (future_delete.length > 0) {
                    var delRow = await srv.run(DELETE.from(User_Future_Changes).where({ external_id: req.data.uuid }))
                    if (delRow) {
                        return "Record deleted";
                    }
                    delRow = null;
                } else {
                    return "Record does not exist";
                }
                future_delete = null;
            } else {
                var future_change = await srv.run(SELECT.from(User_Future_Changes).where({ external_id: req.data.uuid }));
                if (future_change.length > 0) {
                    var updRow = await srv.run(
                        UPDATE(User_Future_Changes).set(
                            {
                                date: req.data.date
                            })
                            .where({ external_id: req.data.uuid })
                    )
                    if (updRow) {
                        return "Record updated";
                    } else {
                        return "Record NOT updated";
                    }
                    updRow = null;
                } else {
                    var insRow = await srv.run(
                        INSERT.into(User_Future_Changes).entries(
                            {
                                external_id: req.data.uuid, date: req.data.date
                            })
                    )
                    if (insRow) {
                        return "Record created";
                    } else {
                        return "Record NOT created";
                    }
                    insRow = null;
                }
                future_change = null;
            }
            return "Success";
        } catch (err) {

        }
    })

    srv.on('retention_period_workers', async (req) => {
        try {
            var configuration = await srv.run(SELECT.from(Configurations).where({
                pck_code: 'SYN_WORKER',
                conf_code: 'SCE-CONFIG'
            }));
            if (Array.isArray(configuration) && configuration.length > 0) {
                var buff = Buffer.from(configuration[0].value, 'base64');
                var text = buff.toString('UTF8');
                var xml2js = require('xml2js');
                var resultado, res2;
                xml2js.parseString(text, (err, result) => {
                    if (err) {
                        throw err;
                    }
                    resultado = result;
                });
                xml2js = null;
                configuration = null;
                buff = null;
                text = null;
                var glo_conf = resultado['global_configuration'];
                var ret_period = glo_conf['retention_period'];
                if (ret_period && Array.isArray(ret_period)) {
                    var logic_type = ret_period['0']['logic_type'][0];
                    if (logic_type == '03') {
                        var days_complete_employee = parseInt(ret_period['0']['complete_employee_data'][0]);
                        var days_employee_details = parseInt(ret_period['0']['employee_details'][0]);

                        if (days_employee_details >= 1) {
                            var date = new Date();
                            date.setDate(date.getDate() - days_employee_details);
                            var day = (date.getDate() < 10) ? "0" + (date.getDate()) : date.getDate(),
                                month = (date.getMonth() + 1 < 10) ? "0" + (date.getMonth() + 1) : date.getMonth() + 1,
                                year = date.getFullYear(),
                                hours = (date.getHours() < 10) ? "0" + (date.getHours()) : date.getHours(),
                                minutes = (date.getMinutes() < 10) ? "0" + (date.getMinutes()) : date.getMinutes(),
                                seconds = (date.getSeconds() < 10) ? "0" + (date.getSeconds()) : date.getSeconds();

                            var limit = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + 'Z';
                            var workeritems = await srv.run(SELECT.from(Integration_Items).where({
                                pck_code: 'SYN_WORKER',
                                // request_deleted: { '<>': 'X' }, 
                                request_deleted: null,
                                createdAt: { '<=': limit }
                            }));

                            if (workeritems.length > 0) {
                                for (var i = 0; i < workeritems.length; i++) {
                                    var date2 = new Date();
                                    var day2 = (date2.getDate() < 10) ? "0" + (date2.getDate()) : date2.getDate(),
                                        month2 = (date2.getMonth() + 1 < 10) ? "0" + (date2.getMonth() + 1) : date2.getMonth() + 1,
                                        year2 = date2.getFullYear(),
                                        hours2 = (date2.getHours() < 10) ? "0" + (date2.getHours()) : date2.getHours(),
                                        minutes2 = (date2.getMinutes() < 10) ? "0" + (date2.getMinutes()) : date2.getMinutes(),
                                        seconds2 = (date2.getSeconds() < 10) ? "0" + (date2.getSeconds()) : date2.getSeconds();

                                    var limit2 = year2 + '-' + month2 + '-' + day2 + 'T' + hours2 + ':' + minutes2 + ':' + seconds2 + 'Z';
                                    var updItem = srv.run(
                                        UPDATE(Integration_Items).set(
                                            {
                                                request_deleted: 'X',
                                                request: '',
                                                request_deleted_date: limit2
                                            })
                                            .where({ item_id: workeritems[i].item_id })
                                    )
                                }
                                workeritems = null;
                            } else {
                                workeritems = null;
                                //    return 'Ningun item.';
                            }
                        }

                        if (days_complete_employee >= 1) {
                            var date3 = new Date();
                            date3.setDate(date3.getDate() - days_complete_employee);
                            var day3 = (date3.getDate() < 10) ? "0" + (date3.getDate()) : date3.getDate(),
                                month3 = (date3.getMonth() + 1 < 10) ? "0" + (date3.getMonth() + 1) : date3.getMonth() + 1,
                                year3 = date3.getFullYear(),
                                hours3 = (date3.getHours() < 10) ? "0" + (date3.getHours()) : date3.getHours(),
                                minutes3 = (date3.getMinutes() < 10) ? "0" + (date3.getMinutes()) : date3.getMinutes(),
                                seconds3 = (date3.getSeconds() < 10) ? "0" + (date3.getSeconds()) : date3.getSeconds();

                            var limit3 = year3 + '-' + month3 + '-' + day3 + 'T' + hours3 + ':' + minutes3 + ':' + seconds3 + 'Z';
                            var integrations = await srv.run(SELECT.from(Integrations).where({
                                pck_code: 'SYN_WORKER',
                                createdAt: { '<=': limit3 }
                            }));

                            if (integrations.length > 0) {
                                for (var i = 0; i < integrations.length; i++) {
                                    var items = await srv.run(SELECT.from(Integration_Items).where({
                                        integ_id: integrations[i].id
                                    }));

                                    for (var j = 0; j < items.length; j++) {
                                        var workers = await srv.run(SELECT.from(Workers).where({
                                            last_item_id: items[j].item_id
                                        }));
                                        if (workers.length == 1) {
                                            const event3 = {
                                                worker_uuid: workers[0].uuid
                                            }
                                            srv.emit('deleteWorker', event3)
                                        }
                                        const event2 = {
                                            item_id: items[j].item_id
                                        }
                                        srv.emit('deleteIntegItem', event2)
                                    }
                                    const event = {
                                        integ_id: integrations[i].id
                                    }
                                    srv.emit('deleteInteg', event)
                                }
                                return 'Borrados';
                            } else {
                                return 'Ninguna integración';
                            }
                        }
                    } else {
                        return 'No es del tipo';
                    }
                } else {
                    return 'No existe retention period en configuración';
                }
            } else {
                return 'No existe configuración';
            }
        } catch (err) {

        }
    })


    //Import Function: Delete all Business Process Type Master
    srv.on('di_business_process_type_master_delete_all', async (req) => {
        try {
            //delete the all records. If no exist records, raise a exception
            await srv.run(
                DELETE.from(Di_Business_Process_Master)
            )
        } catch (err) {

        }
        return "Business Process Types Master deleted successfully"
    })


    //Import Function: Delete the List Values "LVAID"
    srv.on('delete_list_values', async (req) => {
        try {
            await srv.run(
                DELETE.from(Di_List_Values).where({ lvaid: req.data.lvaid })
            )
        } catch (err) {

        }
        return "List Values deleted successfully"
    })

    srv.on('get_organization_types', async (req) => {
        try {
            var configuration = await srv.run(SELECT.one.from(Configurations).where({
                pck_code: 'SYN_ORG',
                conf_code: 'SCE-CONFIG'
            }));
            if (configuration) {
                var buff = Buffer.from(configuration.value, 'base64');
                var text = buff.toString('UTF8');
                var xml2js = require('xml2js');
                var resultado, res2;
                xml2js.parseString(text, (err, result) => {
                    if (err) {
                        throw err;
                    }
                    resultado = result;
                });
                xml2js = null;
                configuration = null;
                buff = null;
                text = null;
                var glo_conf = resultado['global_configuration'];
                if (glo_conf) {
                    var web_services = glo_conf['web_services'];
                    if (web_services) {
                        var ws_org = web_services[0]['ws_get_organizations'];
                        if (ws_org) {
                            var req_filter = ws_org[0]['request_filter'];
                            if (req_filter) {
                                var typeOrg = req_filter[0]['type'][0];
                                var subtypeOrg = req_filter[0]['subtype'][0];
                                if (req.data.text == 'true' || req.data.metadata == 'true') {
                                    var typeTxt = await srv.run(SELECT.one.from(Organization_Types).where({
                                        code: typeOrg
                                    }));
                                    if (req.data.text == 'true' && req.data.metadata == 'true') {
                                        var result = {
                                            type: typeOrg,
                                            type_text: typeTxt.description,
                                            subtype: subtypeOrg,
                                            metadata: typeTxt.metadata
                                        };
                                    } else if (req.data.text == 'true' && req.data.metadata == 'false') {
                                        var result = {
                                            type: typeOrg,
                                            type_text: typeTxt.description,
                                            subtype: subtypeOrg
                                        };
                                    } else {
                                        var result = {
                                            type: typeOrg,
                                            subtype: subtypeOrg,
                                            metadata: typeTxt.metadata
                                        };
                                    }
                                } else {
                                    var result = {
                                        type: typeOrg,
                                        subtype: subtypeOrg
                                    };
                                }

                                return result;
                            } else {
                                return "Request_Filter Node not found in configuration."
                            }
                        } else {
                            return "Ws_Get_Organization Node not found in configuration."
                        }
                    } else {
                        return "Web_Services Node not found in configuration."
                    }
                } else {
                    return "Global_Configuration Node not found in configuration."
                }

            } else {
                return "Organizations Configuration not found."
            }

        } catch (err) {

        }

    })

    /*
        //Import Function: Load Business Process Types
        srv.on('di_business_process_type_master_insert', async (req) => {
            try {
                var b64_buffer = Buffer.from(req.data.bpt_data, 'base64');
                //1.- build the records to insert in the entity
                var business_process_types = JSON.parse( b64_buffer.toString('UTF8') )
                var bpt_list = []
                for (var bpt_record of business_process_types.data){
                    let bpt_item = {}
                    bpt_item['external_id'] = bpt_record.wid
                    bpt_item['code'] = bpt_record.bpt
                    bpt_item['description'] = bpt_record.desc
                    bpt_list.push(bpt_item)
                }
    
                //2.- insert the new records
                await srv.run( 
                    INSERT(bpt_list).into(Di_Business_Process_Master)
                )
    
                return "Business Process Types Master loaded successfully"
            }catch(err) {
                throw new Error(err.message);
            }
        })
    */



    /* return Promise.all([integrations.map(async integration => {
         const items = await cds.transaction(req).run(
             SELECT.from(Integration_Items).where({ integ_id: integration.id })
         )
         integration.numberOfItems = items.length
         if (integration.status_code !== "R") {
             var date1 = new Date(integration.timestamp_end);
             var date2 = new Date(integration.timestamp_start);
             var diff = (date1.getTime() - date2.getTime()) / 1000;
             integration.numberOfSeconds = diff;
         }
     }), req]).then(function (values) {
         integrations.sort(function (a, b) {
             if (a.numberOfSeconds > b.numberOfSeconds) {
                 return -1;
             }
             if (a.numberOfSeconds < b.numberOfSeconds) {
                 return 1;
             }
             return 0;
         });
     })*/


})


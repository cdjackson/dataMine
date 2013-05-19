var configTree = [];
var configDeviceId = 0
var configVariableStore;
var configRootNode;

var lookupStore;

var graphTypes = [
    {id:0, Name:"Spline"},
    {id:1, Name:"Line"},
    {id:2, Name:"Scatter"},
    {id:3, Name:"Area"},
    {id:4, Name:"Area/Line"}
];

function getGraphType(val) {
    if (val == null)
        return "Undefined";

    var catLen = graphTypes.length;
    for (var catCnt = 0; catCnt < catLen; catCnt++) {
        if (graphTypes[catCnt].id == val)
            return graphTypes[catCnt].Name;
    }
    return "Unknown (" + val + ")";
}

function getPropertyValue(prop, name) {
    var index = prop.find('name', name);
    return prop.getAt(index).get('value');
}

function SaveConfigVariableData() {
    var parms = {};
    var tmp;
    parms.id = 'lr_dmCtrl';
    parms.control = 'saveVar';

    var prop = Ext.getCmp('configProperties').getStore();

    parms.device = configDeviceId;
    parms.service = getPropertyValue(prop, 'Service');
    parms.variable = getPropertyValue(prop, 'Variable');

    parms.name = getPropertyValue(prop, 'DisplayName');
    parms.unit = getPropertyValue(prop, 'Units');

    parms.doff = getPropertyValue(prop, 'DataOffset');

    parms.derr = parseFloat(getPropertyValue(prop, 'DrowsyError')) * 60000;
    parms.dwar = parseFloat(getPropertyValue(prop, 'DrowsyWarning')) * 60000;

    if (parms.derr == configGUI.generalDrowsyError)
        parms.derr = 0;
    if (parms.dwar == configGUI.generalDrowsyWarning)
        parms.dwar = 0;

    if (getPropertyValue(prop, 'LoggingEnabled') == true)
        parms.log = 1;
    else
        parms.log = 0;

    if (getPropertyValue(prop, 'FilterEnable') == true)
        parms.filt = 1;
    else
        parms.filt = 0;
    parms.fmax = getPropertyValue(prop, 'FilterMaximum');
    parms.fmin = getPropertyValue(prop, 'FilterMinimum');

    var lookup = [];
    var lookupCnt = lookupStore.getCount();
    if (lookupCnt > 0) {
        for (var Cnt = 0; Cnt < lookupCnt; Cnt++) {
            var newLookup = {};
            newLookup.lab = lookupStore.getAt(Cnt).get("label");
            newLookup.val  = lookupStore.getAt(Cnt).get("value");
            lookup.push(newLookup);
        }
    }
    parms.lookup = Ext.encode(lookup);

    // If this is an energy monitoring variable, then configure the energy settings
    // Make sure it's within valid range by checking the config array
    tmp = getPropertyValue(prop, 'EnergyCategory');
    if (tmp != null) {
        var catLen = configEnergyCategories.length;
        for (var catCnt = 0; catCnt < catLen; catCnt++) {
            if (configEnergyCategories[catCnt].id == tmp) {
                parms.ecat = tmp;
                break;
            }
        }
    }

    tmp = getPropertyValue(prop, 'GraphType');
    if (tmp != null) {
        parms.gtype = parseInt(tmp);
    }

    Ext.Ajax.request({
        url:veraServer + '/data_request',
        params:parms,
        method:'GET',
        success:function (response, opts) {
            if (response.responseText == "Handler failed") {
                Ext.MessageBox.show({
                    msg:'Error saving data : Handler Failed',
                    width:200,
                    draggable:false,
                    icon:'graph-download-error',
                    closable:false
                });
                setTimeout(function () {
                    Ext.MessageBox.hide();
                }, 2500);

                return;
            }

            var res = Ext.decode(response.responseText);

            // Update the data in the configChan structure
            var found = false;
            var total = configChan.length;
            for (var cnt = 0; cnt < total; cnt++) {
                if (configChan[cnt].Id == res.Variables[0].Id) {
                    configChan[cnt].Name = res.Variables[0].Name;
                    configChan[cnt].Units = res.Variables[0].Units;
                    configChan[cnt].Logging = res.Variables[0].Logging;
                    configChan[cnt].EnergyCat = res.Variables[0].EnergyCat;
                    configChan[cnt].DataOffset = res.Variables[0].DataOffset;
                    configChan[cnt].DrowsyError = res.Variables[0].DrowsyError;
                    configChan[cnt].DrowsyWarning = res.Variables[0].DrowsyWarning;
                    configChan[cnt].FilterEnable = res.Variables[0].FilterEnable;
                    configChan[cnt].FilterMaximum = res.Variables[0].FilterMaximum;
                    configChan[cnt].FilterMinimum = res.Variables[0].FilterMinimum;
                    configChan[cnt].Type = res.Variables[0].Type;

                    if (configChan[cnt].DrowsyWarning == 0)
                        configChan[cnt].DrowsyWarning = configGUI.generalDrowsyWarning;

                    if (configChan[cnt].DrowsyError == 0)
                        configChan[cnt].DrowsyError = configGUI.generalDrowsyError;

                    configChan[cnt].Lookup = res.Variables[0].Lookup;

                    found = true;
                    break;
                }
            }
            // If this is a new variable, then it needs to be added to the channel array
            if (found == false) {
                configChan.push(res.Variables[0]);
            }

            // Clear the filter collection without updating the UI
            channelStore.clearFilter(true);

            // Update the data in the variable config store
            var index = channelStore.findExact('Id', res.Variables[0].Id);
            if (index != -1) {
                // Update the store data
                var upd = channelStore.getAt(index);

                upd.set('Name', res.Variables[0].Name);
                upd.set('Logging', res.Variables[0].Logging)
            }
            else {
                // Add new entry to the store
                addVariable(res.Variables[0]);
            }

            // Restore filtering
            channelStore.filter("Logging", 1);

            // Set the config data in case it's changed by Vera
            SetConfigVariableData(configDeviceId, parms.service, parms.variable);

            // Find the variable in the tree store
            var devNode = configRootNode.findChild("DeviceId", res.Variables[0].Device);
            var svcNode = devNode.findChild("Parent", res.Variables[0].Service);
            var varNode = svcNode.findChild("Parent", res.Variables[0].Variable);

            if (res.Variables[0].Logging == false) {
                varNode.set('Logging', false);
                if (svcNode.findChild('Logging', true) == null)
                    svcNode.set('Logging', false);
                else
                    svcNode.set('Logging', true);
                if (devNode.findChild('Logging', true) == null)
                    devNode.set('Logging', false);
                else
                    devNode.set('Logging', true);

                varNode.set('icon', '');
                if (svcNode.findChild('icon', 'images/tick.png') == null)
                    svcNode.set('icon', '');
                else
                    svcNode.set('icon', 'images/tick.png');
                if (devNode.findChild('icon', 'images/tick.png') == null)
                    devNode.set('icon', '');
                else
                    devNode.set('icon', 'images/tick.png');
            }
            else {
                devNode.set('icon', 'images/tick.png');
                svcNode.set('icon', 'images/tick.png');
                varNode.set('icon', 'images/tick.png');

                devNode.set('Logging', true);
                svcNode.set('Logging', true);
                varNode.set('Logging', true);
            }

            // Add energy icon filter up
            if (getVeraEnergyVariableState(res.Variables[0].Service, res.Variables[0].Variable) == 1) {
                if (res.Variables[0].EnergyCat != null)
                    varNode.Energy = 2

                if (svcNode.findChild('Energy', 1) == null)
                    svcNode.set('Energy', 1);
                else if (svcNode.findChild('Energy', 2) == null)
                    svcNode.set('Energy', 2);
                else
                    svcNode.set('Energy', 0);

                if (devNode.findChild('Energy', 1) == null)
                    devNode.set('Energy', 1);
                else if (devNode.findChild('Energy', 2) == null)
                    devNode.set('Energy', 2);
                else
                    devNode.set('Energy', 0);
            }

            channelStore.filter("Logging", 1);
        }
    });
}

function SetConfigVariableData(Device, Service, Variable) {
    // Set defaults
    var Category = "";
    var Name = "";
    var DeviceName = "";
    var Logging = false;
    var Dashboard = false;
    var OOLEnable = false;
    var OOLMaximum = 0;
    var OOLMinimum = 0;
    var DrowsyWarning = 0;
    var DrowsyError = 0;
    var DataOffset = 0;
    var DataType = 0;
    var GraphType = 0;
    var Units = null;
    var EnergyCat = 0;
    var Lookup = null;

    configDeviceId = Device;

    if (configChan != null) {
        var chLen = configChan.length;
        for (var chCnt = 0; chCnt < chLen; chCnt++) {
            if ((configChan[chCnt].Variable == Variable) &&
                (configChan[chCnt].Service == Service) &&
                (configChan[chCnt].Device == Device)) {
//                Category = configChan[chCnt].Category;
                Logging = configChan[chCnt].Logging == 1 ? true : false;
                Name = configChan[chCnt].Name;
                Units = configChan[chCnt].Units;
                EnergyCat = configChan[chCnt].EnergyCat;
                DataOffset = configChan[chCnt].DataOffset;
                DrowsyWarning = configChan[chCnt].DrowsyWarning;
                DrowsyError = configChan[chCnt].DrowsyError;
                if (DrowsyWarning == configGUI.generalDrowsyWarning)
                    DrowsyWarning = 0;
                if (DrowsyError == configGUI.generalDrowsyError)
                    DrowsyError = 0;
                DrowsyWarning /= 60000;
                DrowsyError /= 60000;
                if (EnergyCat == null)
                    EnergyCat = 0;
                GraphType = configChan[chCnt].Type;
                OOLEnable = configChan[chCnt].FilterEnable == 1 ? true : false;
                OOLMaximum = configChan[chCnt].FilterMaximum;
                OOLMinimum = configChan[chCnt].FilterMinimum;
                Lookup = configChan[chCnt].Lookup;
                break;
            }
        }
    }

    var veraDevice = getVeraDevice(Device);
    if (veraDevice != null) {
        Category = getVeraDeviceCategory(veraDevice.category_num);
        DeviceName = veraDevice.name;
    }

    var prop = Ext.getCmp('configProperties');
    prop.setProperty("Device", "[" + configDeviceId + "] " + DeviceName);
    prop.setProperty("Service", Service);
    prop.setProperty("Variable", Variable);
    prop.setProperty("VeraCategory", Category);
    prop.setProperty("DisplayName", Name);
    prop.setProperty("Units", Units);
    prop.setProperty("LoggingEnabled", Logging);
    prop.setProperty("EnergyCategory", EnergyCat);
    prop.setProperty("GraphType", GraphType);
//    prop.setProperty("Data Type", DataType);
//    prop.setProperty("Display on dashboard", Dashboard);
    prop.setProperty("FilterEnable", OOLEnable);
    prop.setProperty("FilterMaximum", OOLMaximum);
    prop.setProperty("FilterMinimum", OOLMinimum);
    prop.setProperty("DataOffset", DataOffset);
    prop.setProperty("DrowsyWarning", DrowsyWarning);
    prop.setProperty("DrowsyError", DrowsyError);

    var lookupCnt = lookupStore.getCount();
    if (lookupCnt > 0) {
        for (var Cnt = 0; Cnt < lookupCnt; Cnt++) {
//            lookupStore.removeAt(Cnt);
            lookupStore.removeAt(0);
        }
    }
//    lookupStore.removeAll();
//    Ext.ComponentQuery.query('gridLookup')[0].getSelectionModel().deselectAll();
    if (Lookup != null) {
        for (var i in Lookup) {
            if(i != "") {
                var newVar = {};
                newVar.value = Lookup[i];
                newVar.label = i;

                lookupStore.add(newVar);
            }
        }
    }

    Ext.getCmp("configLookupTb-add").enable();
}

Ext.define('DataMine.configLogging', {
    extend:'Ext.panel.Panel',
    layout:'border',
    xtype:'dmConfig',

    initComponent:function () {

        if (configVera != null) {
            var rmLen = configVera.rooms.length;
            // Loop through the configuration
            var numDevices = configVera.devices.length;
            for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
                // Don't display invisible items
                if (configVera.devices[iDevice].invisible == 1)
                    continue;

                var newDev = [];
                var newDevPnt;
                newDev.Parent = configVera.devices[iDevice].name;
                newDev.DeviceId = configVera.devices[iDevice].id;
                for (var rmCnt = 0; rmCnt < rmLen; rmCnt++) {
                    if (configVera.rooms[rmCnt].id == configVera.devices[iDevice].room)
                        newDev.Room = configVera.rooms[rmCnt].name;
                }
                newDev.Category = getVeraDeviceCategory(configVera.devices[iDevice].category_num);

                newDev.Logging = 0;
                newDev.Energy = 0;
                newDev.iconCls = 'node-device';
                newDev.children = [];
                newDevPnt = configTree.push(newDev) - 1;

                // Find/add the service
                var varLen = configVera.devices[iDevice].states.length;
                for (var varCnt = 0; varCnt < varLen; varCnt++) {
                    var svcPnt = -1;
                    svcLen = configTree[newDevPnt].children.length;
                    for (var svcCnt = 0; svcCnt < svcLen; svcCnt++) {
                        // See if the service is in the list
                        if (configTree[newDevPnt].children[svcCnt].Parent == configVera.devices[iDevice].states[varCnt].service) {
                            // Service exists
                            svcPnt = svcCnt;
                        }
                    }
                    // If no service found, add it
                    if (svcPnt == -1) {
                        //
                        var newSvc = [];
                        newSvc.Logging = 0;
                        newSvc.Energy = 0;
                        newSvc.Parent = configVera.devices[iDevice].states[varCnt].service;
                        newSvc.iconCls = 'node-service';
                        newSvc.children = [];
                        svcPnt = configTree[newDevPnt].children.push(newSvc) - 1;
                    }
                    // Add the variable
                    var newVar = [];
                    newVar.Device = configVera.devices[iDevice].name;
                    newVar.DeviceId = configVera.devices[iDevice].id;
                    newVar.Service = configVera.devices[iDevice].states[varCnt].service;
                    newVar.Parent = configVera.devices[iDevice].states[varCnt].variable;
                    newVar.expandable = false;
                    newVar.leaf = true;
                    newVar.iconCls = 'node-variable';

                    // Is this an energy "Watts" variable
                    if (getVeraEnergyVariableState(configVera.devices[iDevice].states[varCnt].service, configVera.devices[iDevice].states[varCnt].variable) == 1) {
                        newVar.Energy = 1
                        configTree[newDevPnt].Energy = 1;
                        configTree[newDevPnt].children[svcPnt].Energy = 1;
                    }

                    if (configChan != null) {
                        var chLen = configChan.length;
                        for (var chCnt = 0; chCnt < chLen; chCnt++) {
                            // Find the variable in the channel configuration
                            if ((configChan[chCnt].Variable == configVera.devices[iDevice].states[varCnt].variable) &&
                                (configChan[chCnt].Service == configVera.devices[iDevice].states[varCnt].service) &&
                                (configChan[chCnt].Device == configVera.devices[iDevice].id)) {
                                if (configChan[chCnt].Logging == true) {
                                    newVar.Logging = true;
                                    configTree[newDevPnt].Logging = true;
                                    configTree[newDevPnt].children[svcPnt].Logging = true;

                                    newVar.icon = 'images/tick.png';
                                    configTree[newDevPnt].icon = 'images/tick.png';
                                    configTree[newDevPnt].children[svcPnt].icon = 'images/tick.png';
                                }
                                if ((configChan[chCnt].EnergyCat != null) && (newVar.Energy == 1)) {
                                    newVar.Energy = 2;
                                    configTree[newDevPnt].Energy = 2;
                                    configTree[newDevPnt].children[svcPnt].Energy = 2;
                                }
                            }
                        }
                    }

                    configTree[newDevPnt].children[svcPnt].children.push(newVar);
                }
            }
        }

        // We want to setup a model and store instead of using dataUrl
        Ext.define('VariableTree', {
            extend:'Ext.data.Model',
            fields:[
                {name:'Parent', type:'string'},
                {name:'Room', type:'string'},
                {name:'Category', type:'string'},
                {name:'DeviceId'},
                {name:'Device', type:'string'},
                {name:'Service', type:'string'},
                {name:'Energy'},
                {name:'Logging'}
            ]
        });

        configVariableStore = Ext.create('Ext.data.TreeStore', {
            model:'VariableTree',
            proxy:{
                type:'memory'
//                type:'ajax'//,
                //the store will get the content from the .json file
//                url: 'treegrid.json'
            },
            folderSort:true
        });

        var rootHere = [];
        rootHere.text = "ROOT!!!";
        rootHere.children = configTree;
        configRootNode = configVariableStore.setRootNode(rootHere);

        var variables = Ext.create('Ext.tree.Panel', {
            title:'Device Variables',
            id:'configVarTree',
            icon:'images/document-node.png',
            store:configVariableStore,
            region:'west',
            split:true,
            collapsible:false,
            width:700,
            minSize:300,
            useArrows:false,
//            hideCollapseTool:true,
            lines:true,
            rootVisible:false,
            multiSelect:false,
            singleExpand:true,
//            viewConfig:{
//                stripeRows:false,
//                enableTextSelection:false,
//                markDirty:false,
//                getRowClass:function (record) {
//                    return 'x-tree-row-selected-override';
//                }
//            },
            columns:[
                {
                    xtype:'treecolumn', //this is so we know which column will show the tree
                    text:'Variable',
                    flex:5,
//                    sortable:true,
                    dataIndex:'Parent'
                },
                {
                    text:'Room',
                    flex:2,
                    dataIndex:'Room'
//                    sortable:true
                },
                {
                    text:'Category',
                    flex:2,
                    dataIndex:'Category'
//                    sortable:true
                },
                {
                    text:'',
                    width:50,
                    flex:0,
                    dataIndex:'',
                    sortable:false,
                    renderer:function (value, metaData, record, rowIndex, colIndex, store, view) {
                        var data = "";
                        if (record.get("Energy") == 1)
                            data = data + "<img src='images/light-bulb-small-off.png'>";
                        else if (record.get("Energy") == 2)
                            data = data + "<img src='images/light-bulb-small.png'>";
                        else
                            data = data + "<img src='images/null.png'>";
                        if (record.get("Logging"))
                            data = data + "<img src='images/pencil-small.png'>";

                        return data;
                    }
                }
            ],
            listeners:{
                select:function (tree, record, index, eOpts) {
                    if (record.get("Device") != "") {
                        var Device = record.get("DeviceId");
                        var Service = record.get("Service");
                        var Variable = record.get("Parent");
                        SetConfigVariableData(Device, Service, Variable);
                        Ext.getCmp("tabsConfig").setActiveTab(0);

                        Ext.getCmp("configPropTb-save").disable();
                        Ext.getCmp("configPropTb-cancel").disable();
                    }
                }
            }
        });

        Ext.define('GhostList', {
            extend:'Ext.data.Model',
            fields:[
                {name:'Id'},
                {name:'Name'},
                {name:'Ghost'}
            ]
        });

        // create the data store
        ghostStore = Ext.create('Ext.data.ArrayStore', {
            model:'GhostList'
        });

//        if (configChan != null) {
//            var chLen = configChan.length;
//            for (var chCnt = 0; chCnt < chLen; chCnt++) {
//                if (configChan[chCnt].Ghost == true)
//                    ghostStore.add(configChan[chCnt]);
//            }
//        }

        ghostStore.loadData(configChan);
        ghostStore.filter("Ghost", true);

        var ghosts = Ext.create('Ext.grid.Panel', {
            id:'ghostVariables',
            store:ghostStore,
            icon:'images/ghost.png',
            hideHeaders:true,
            disableSelection:true,
//        stateful:true,
//        stateId:'stateGrid',
            columns:[
                {
                    text:'Name',
                    hideable:false,
                    flex:1,
//                    width:75,
                    sortable:true,
                    dataIndex:'Name'
                },
                {
                    menuDisabled:true,
                    sortable:false,
                    xtype:'actioncolumn',
                    width:30,
                    items:[
                        {
                            icon:'images/cross-small.png',
                            tooltip:'Delete ghost variable',
                            handler:function (grid, rowIndex, colIndex) {
                                var rec = ghostStore.getAt(rowIndex);

                                var parms = {};
                                parms.id = 'lr_dmCtrl';
                                parms.control = 'delVar';
                                parms.name = rec.get("Name");
                                parms.ref = rec.get("Id");
                                Ext.Ajax.request({
                                    url:veraServer + '/data_request',
                                    params:parms,
                                    method:'GET',
                                    success:function (response, opts) {
                                        var res = Ext.decode(response.responseText);
                                        ghostStore.loadData(res);
                                        ghostStore.filter("Ghost", true);
                                    }
                                });

                            }
                        }
                    ]
                }
            ],
            layout:'fit',
            title:'Ghost Variables',
            viewConfig:{
                stripeRows:false,
                enableTextSelection:false,
                markDirty:false
            },
            listeners:{
                itemclick:function (grid, record, item, index, element, eOpts) {
                    if (item != null) {
                        var Name = record.get('Name');

                        if (configChan == null)
                            return;

                        var chLen = configChan.length;
                        for (var chCnt = 0; chCnt < chLen; chCnt++) {
                            if (configChan[chCnt].Ghost == true && configChan[chCnt].Name == Name) {
                                var Device = configChan[chCnt].Device;
                                var Service = configChan[chCnt].Service;
                                var Variable = configChan[chCnt].Variable;
                                SetConfigVariableData(Device, Service, Variable);
                                Ext.getCmp("tabsConfig").setActiveTab(0);
                                break;
                            }
                        }

                        Ext.getCmp("configPropTb-save").disable();
                        Ext.getCmp("configPropTb-cancel").disable();
                    }
                }
            }
        });


        var general = Ext.create('Ext.grid.Panel', {
            id:'generalProperties',
//            store:ghostStore,
            icon:'images/hammer-screwdriver.png',
            hideHeaders:true,
            disableSelection:true,
//        stateful:true,
//        stateId:'stateGrid',
            columns:[
                {
                    text:'Name',
                    hideable:false,
                    flex:1,
//                    width:75,
                    sortable:true,
                    dataIndex:'Name'
                }
            ],
            layout:'fit',
            title:'General Properties',
            viewConfig:{
                stripeRows:false,
                enableTextSelection:false,
                markDirty:false
            },
            listeners:{
                itemclick:function (grid, record, item, index, element, eOpts) {
                    if (item != null) {
//                        var Name = record.get('Name');

//                        Ext.getCmp("configPropTb-save").disable();
//                        Ext.getCmp("configPropTb-cancel").disable();
                    }
                }
            }
        });


        var accordion = Ext.create('Ext.Panel', {
            split:true,
            border:false,
            region:'west',
            width:600,
            layout:{
                type:'accordion',
                hideCollapseTool:true
            },
            items:[variables, ghosts, general]
        });

        var tbProperties = Ext.create('Ext.toolbar.Toolbar', {
            items:[
                {
                    icon:'images/cross.png',
                    id:'configPropTb-cancel',
                    text:'Cancel',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Cancel changes made to the variable configuration',
                    handler:function () {
                        Ext.getCmp("configPropTb-save").disable();
                        Ext.getCmp("configPropTb-cancel").disable();

                        // Reset to the current data
                        var prop = Ext.getCmp('configProperties').getStore();
                        var Service = prop.getAt(1).get('value');
                        var Variable = prop.getAt(2).get('value');
                        SetConfigVariableData(configDeviceId, Service, Variable);
                    }
                },
                {
                    icon:'images/disk.png',
                    id:'configPropTb-save',
                    text:'Save',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Save changes to the variable configuration',
                    handler:function () {
                        Ext.getCmp("configPropTb-save").disable();
                        Ext.getCmp("configPropTb-cancel").disable();
                        SaveConfigVariableData();
                    }
                }
            ]
        });

        var energyCategoryStore = Ext.create('Ext.data.Store', {
            fields:['id', 'Name']
        });
        energyCategoryStore.loadData(configEnergyCategories);

        var graphTypeStore = Ext.create('Ext.data.Store', {
            fields:['id', 'Name']
        });
        graphTypeStore.loadData(graphTypes);

        var variableOptions = Ext.create('Ext.grid.property.Grid', {
            title:'Properties',
            icon:'images/gear.png',
            id:'configProperties',
            tbar:tbProperties,
            hideHeaders:true,
            sortableColumns:false,
            nameColumnWidth:300,
            region:'center',
            split:true,
            source:{
                "Device":"",
                "Service":"",
                "Variable":"",
                "VeraCategory":"",
                "DisplayName":"",
                "Units":"",
                "LoggingEnabled":false,
                "EnergyCategory":"",
                "GraphType":"",
                "DataOffset":"",
                "DrowsyWarning":"",
                "DrowsyError":"",
//                "Data Type":"",
//                "Display on dashboard":false,
                "FilterEnable":false,
                "FilterMaximum":"",
                "FilterMinimum":""
            },
            sourceConfig:{
                DisplayName:{
                    displayName:"Display Name"
                },
                LoggingEnabled:{
                    displayName:"Logging Enabled"
                },
                VeraCategory:{
                    displayName:"Vera Category"
                },
                EnergyCategory:{
                    displayName:"Energy Category",
                    renderer:function (v) {
                        return getEnergyCategory(v);
                    },
                    editor:Ext.create('Ext.form.ComboBox', {
                        store:energyCategoryStore,
                        queryMode:'local',
                        typeAhead:false,
                        editable:false,
                        displayField:'Name',
                        valueField:'id'
                    })
                },
                GraphType:{
                    displayName:"Graph Type",
                    renderer:function (v) {
                        return getGraphType(v);
                    },
                    editor:Ext.create('Ext.form.ComboBox', {
                        store:graphTypeStore,
                        queryMode:'local',
                        typeAhead:false,
                        editable:false,
                        displayField:'Name',
                        valueField:'id'
                    })
                },
                DataOffset:{
                    displayName:"Data Offset"
                },
                DrowsyWarning:{
                    displayName:"Drowsy Warning"
                },
                DrowsyError:{
                    displayName:"Drowsy Error"
                },
                "FilterEnable": {
                    displayName:"Enable out-of-limits filter"
                },
                "FilterMaximum":{
                    displayName:"Filter maximum"
                },
                "FilterMinimum":{
                    displayName:"Filter minimum"
                }
            },
            viewConfig:{
                markDirty:true
            },
            listeners:{
                beforeedit:function (editor, e) {
                    if (e.rowIdx < 4) {
                        return false;
                    }
//                    if(e.row.viewRecordId == "")
                },
                propertychange:function (source, recordId, value, oldValue, eOpts) {
                    Ext.getCmp("configPropTb-save").enable();
                    Ext.getCmp("configPropTb-cancel").enable();
                }
            }
        });


        /*
         var generalOptions = Ext.create('Ext.grid.property.Grid', {
         title:'Properties',
         icon:'images/gear.png',
         id:'configGeneralProperties',
         tbar:tbProperties,
         hideHeaders:true,
         sortableColumns:false,
         nameColumnWidth:300,
         region:'center',
         split:true,
         source:{
         },
         viewConfig:{
         markDirty:true
         }
         });*/

        Ext.define('LookupList', {
            extend:'Ext.data.Model',
            fields:[
                {name:'Value'},
                {name:'Label'}
            ]
        });

        // create the data store
        lookupStore = Ext.create('Ext.data.ArrayStore', {
            model:'LookupList'
        });

        var tbLookup = Ext.create('Ext.toolbar.Toolbar', {
            items:[
                {
                    icon:'images/cross.png',
                    id:'configLookupTb-cancel',
                    text:'Cancel',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Cancel changes made to the lookup table',
                    handler:function () {
                        Ext.getCmp("configLookupTb-save").disable();
                        Ext.getCmp("configLookupTb-cancel").disable();
                        Ext.getCmp("configLookupTb-add").enable();
                        Ext.getCmp("configLookupTb-delete").disable();

                        // Reset to the current data
                        var prop = Ext.getCmp('configProperties').getStore();
                        var Service = prop.getAt(1).get('value');
                        var Variable = prop.getAt(2).get('value');
                        SetConfigVariableData(configDeviceId, Service, Variable);
                    }
                },
                {
                    icon:'images/disk.png',
                    id:'configLookupTb-save',
                    text:'Save',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Save changes to the lookup table',
                    handler:function () {
                        Ext.getCmp("configLookupTb-save").disable();
                        Ext.getCmp("configLookupTb-cancel").disable();
                        Ext.getCmp("configLookupTb-add").enable();
                        SaveConfigVariableData();
                    }
                },
                {
                    icon:'images/plus-button.png',
                    id:'configLookupTb-add',
                    text:'Add',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Add a row to the lookup table',
                    handler:function () {
                        Ext.getCmp("configLookupTb-save").enable();
                        Ext.getCmp("configLookupTb-cancel").enable();

                        var newVar = {};
                        newVar.value = 0;
                        newVar.label = "New Label";

                        lookupStore.add(newVar);
                    }
                },
                {
                    icon:'images/minus-button.png',
                    id:'configLookupTb-delete',
                    text:'Delete',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Remove highlighted row from the lookup table',
                    handler:function () {
                        Ext.getCmp("configLookupTb-save").enable();
                        Ext.getCmp("configLookupTb-cancel").enable();
                        Ext.getCmp("configLookupTb-add").enable();
                        Ext.getCmp("configLookupTb-delete").disable();

                        var selection = Ext.getCmp("gridLookup").getView().getSelectionModel().getSelection()[0];
                        if (selection) {
                            lookupStore.remove(selection);
                        }
                    }
                }
            ]
        });

        Ext.define('LookupList', {
            extend:'Ext.data.Model',
            fields:[
                {name:'value'},
                {name:'label'}
            ],
            idProperty:'lookup'
        });

        // create the data store
        lookupStore = Ext.create('Ext.data.ArrayStore', {
            model:'LookupList'//,
//        data: configChan.list
        });

        this.cellEditing = new Ext.grid.plugin.CellEditing({
            clicksToEdit:1
        });

        var variableLookup = Ext.create('Ext.grid.Panel', {
            xtype:'cell-editing',
            id:'gridLookup',
            icon:'images/tables-relation.png',
            title:'Y-Axis Lookup',
            plugins:[this.cellEditing],
            store:lookupStore,
            columns:[
                {
                    header:'Label',
                    dataIndex:'label',
                    width:300,
                    editor:{
                        allowBlank:false
                    }
                },
                {
                    header:'Value',
                    dataIndex:'value',
                    editor:{
                        allowBlank:false
                    }
                }
            ],
            selModel:{
                selType:'cellmodel'
            },
            tbar:tbLookup,
            listeners : {
                beforeedit: function(dv, record, item, index, e) {
                    Ext.getCmp("configLookupTb-delete").enable();
                },
                edit: function(dv, record, item, index, e) {
                    Ext.getCmp("configLookupTb-save").enable();
                }
            }
        });

//            onAddClick: function(){
        // Create a model instance
//                var rec = new KitchenSink.model.grid.Plant({
//                    common: 'New Plant 1',
//                    light: 'Mostly Shady',
//                    price: 0,
//                    availDate: Ext.Date.clearTime(new Date()),
//                    indoor: false
//                });

//                this.getStore().insert(0, rec);
//                this.cellEditing.startEditByPosition({
//                    row: 0,
//                    column: 0
//                });
//            },

//            onRemoveClick: function(grid, rowIndex){
//                this.getStore().removeAt(rowIndex);
//            }

        var tabsConfig = Ext.create('Ext.tab.Panel', {
            region:'center',
            layout:'fit',
            id:'tabsConfig',
            items:[variableOptions, variableLookup]
        });

        this.items = [accordion, tabsConfig];

        this.callParent();
    }
})
;
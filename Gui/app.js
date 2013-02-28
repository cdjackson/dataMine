/**
 * dataMine Graphing package for Vera
 * (c) Chris Jackson
 */

Ext.Loader.setConfig({
    enabled:true,
    disableCaching:true, // For debug only
    'paths':{

//        'Ext.ux.tab.VerticalPanel':'app/VerticalTab/VerticalPanel.js',
//        'Ext.ux.toggleslide':'app/toggleslide',

        'Ext.ux':'extjs/ux',
        'DataMine':'app'
    }
});

//Ext.require([ 'Ext.ux.toggleslide.Thumb' ]);

Ext.require([
    'Ext.tab.*',
    'Ext.grid.*',
    'Ext.data.*',
    'Ext.util.*',
    'Ext.form.*',
    'Ext.tree.Panel',
    'Ext.container.Viewport',
    'Ext.selection.CellModel',
    'Ext.layout.container.Border',
    'Ext.layout.container.Accordion',
    'Ext.ux.GroupTabPanel',
    'DataMine.dashboard',
    'DataMine.dashEnergyOverview',
    'DataMine.graph',
    'DataMine.configLogging'
]);

var configEnergyCategories = [
    {id:0, Name:"None"},
    {id:1, Name:"Whole House"},
    {id:2, Name:"Lighting"},
    {id:3, Name:"Heating"},
    {id:4, Name:"Entertainment"},
    {id:5, Name:"Appliances"},
    {id:6, Name:"Computing"},
    {id:7, Name:"Utilities"},
    {id:21, Name:"Solar PV"},
    {id:22, Name:"Wind Generator"}
];

var configVeraCategories = [
    {id:1, Name:"Interface", Icon:"images/node.png"},
    {id:2, Name:"Dimmable Light", Icon:"images/light-bulb-code.png"},
    {id:3, Name:"Switch", Icon:"images/switch.png"},
    {id:4, Name:"Security Sensor", Icon:"images/node.png"},
    {id:5, Name:"HVAC", Icon:"images/thermometer-high.png"},
    {id:6, Name:"Camera", Icon:"images/webcam.png"},
    {id:7, Name:"Door Lock", Icon:"images/lock.png"},
    {id:8, Name:"Window Covering", Icon:"images/curtain.png"},
    {id:9, Name:"Remote Control", Icon:"images/remote-control.png"},
    {id:10, Name:"IR Transmitter", Icon:"images/remote-control.png"},
    {id:11, Name:"Generic IO", Icon:"images/node.png"},
    {id:12, Name:"Generic Sensor", Icon:"images/node.png"},
    {id:13, Name:"Serial Port", Icon:"images/node.png"},
    {id:14, Name:"Scene Controller", Icon:"images/node.png"},
    {id:15, Name:"Audio Visual", Icon:"images/television.png"},
    {id:16, Name:"Humidity Sensor", Icon:"images/water.png"},
    {id:17, Name:"Temperature Sensor", Icon:"images/thermometer.png"},
    {id:18, Name:"Light Sensor", Icon:"images/node.png"},
    {id:19, Name:"ZWave Interface", Icon:"images/node.png"},
    {id:20, Name:"Insteon Interface", Icon:"images/node.png"},
    {id:21, Name:"Power Meter", Icon:"images/node.png"},
    {id:22, Name:"Alarm Panel", Icon:"images/node.png"},
    {id:23, Name:"Alarm Partition", Icon:"images/node.png"}
];

var viewPort;

var configVera = null;
var configChan = null;
var configGraph = null;
var configGUI = [];
var channelStore = null;
var graphStore = null;

var lastStatusUpdate = 0;
var NextDrowsyCheck = 0;

var appConfig;

var lastDataVersion;
var lastLoadTime;

var reloadTime = 0;

var veraUnits;
var veraServer = "";
var veraNotifications;
var veraNotificationsLast = 0;

var statusTooltip;

var USBConfigOnce = false;


var initList = [
//    {type:0, name:"Vera device location", variable:"veraUnits", url:"http://sta1.mios.com/locator_json.php", fatal:true, notify:"Unable to find Vera"},
    {type:0, name:"Vera configuration", variable:"configVera", url:"/data_request?id=user_data", fatal:true, notify:"Unable to download configuration data from Vera"},
    {type:0, name:"dataMine app configuration", variable:"appConfig", url:"/data_request?id=lr_dmCtrl&control=appConfigGet", fatal:true, notify:"Unable to download app configuration data from dataMine"},
    {type:0, name:"dataMine channel configuration", variable:"configChan", url:"/data_request?id=lr_dmList", fatal:true, notify:"Unable to download channel configuration data from dataMine"},
    {type:0, name:"dataMine graph configuration", variable:"configGraph", url:"/data_request?id=lr_dmCtrl&control=listGraphs", fatal:false, notify:""},
    {type:0, name:"dataMine graph configuration", variable:"configGUI", url:"/data_request?id=lr_dmCtrl&control=listConfig", fatal:true, notify:""}
];

var initState;

Ext.application({
    name:'dataMine',
    launch:function () {
        // Detect if this is running as an app...
//        var app = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
//        if (app) {
//            super.setIntegerProperty("loadUrlTimeoutValue", 50000);
//            window.deviceApp = 1;
//            initState = 0;
//        } else {
//            window.deviceApp = 0;
//            veraServer = "/port_3480";

        // Step over the vera search function...
//            initState = 1;
//        }

        initState = 0;
//        veraServer = "http://192.168.2.200/port_3480";
//       veraServer = "https://fwd1.mios.com/cjackson/Satellite11/30101033";

        veraServer = "/port_3480";
//        createUI();

//        viewPort = Ext.create('Ext.container.Viewport', {
//            el:'dataMine',
//            layout:'fit',
//            renderTo:'dataMine',
//            hidden:true
//        });

//        taskStart.delay(1500);
        loadNextConfig();
    }
});


//var taskStart = new Ext.util.DelayedTask(function(){
//    loadNextConfig();
//});


function loadNextConfig() {
//    console.log("loadNextConfig " + initState);
    Ext.Ajax.request({
        url:veraServer + initList[initState].url,
//        timeout:20000,
        success:function (response, opts) {
//            console.log("loadNextConfig success");
            if (response.responseText == "No handler") {
                loadError(initList[initState].notify);
                return;
            }

            window[initList[initState].variable] = Ext.decode(response.responseText);

            //           if(initState == 0) {
            //               if (window.deviceApp == 1) {
            //             veraServer = "https://"+veraUnits.units[0].active_server+"/cjackson/Satellite11"+"/"+veraUnits.units[0].serialNumber;
//                    loadError(veraServer);
//                    return;
            //               }
            //           }

            initState++;

            if (initState < initList.length) {
                loadNextConfig();
                return;
            }

            // All configs loaded
            createUI();
        },
        failure:function (response, opts) {
//            console.log('server-side failure with status code ' + response.status);

            if (initList[initState].fatal == true) {
                loadError(initList[initState].notify);
                return;
            }

            // Error was non-fatal. Ignore and continue
            initState++;

            if (initState < initList.length) {
                loadNextConfig();
                return;
            }

            // All configs loaded
            createUI();
        }
    });
}

function loadError(errorText) {
    Ext.get('loadingSpinner').fadeOut({
        duration:200,
        remove:true
    });
    Ext.get('loadingText').fadeOut({
        duration:200,
        remove:true
    });

    Ext.fly('startWarning').update('<img style="margin-top:-4px;" src="images/exclamation.png"><span style="margin-left: 4px; vertical-align: top;">' + errorText + '</span>', false);//({title: errorText});
//    Ext.get('warningText').set({title: errorText});

    Ext.get('startWarning').fadeIn({
        duration:200
    });

//    createUI();
}

function getEnergyCategory(enId) {
    if (enId == null)
        return "Undefined";

    var catLen = configEnergyCategories.length;
    for (var catCnt = 0; catCnt < catLen; catCnt++) {
        if (configEnergyCategories[catCnt].id == enId)
            return configEnergyCategories[catCnt].Name;
    }
    return "Unknown (" + enId + ")";
}

function getVeraDeviceCategory(catId) {
    if (catId == null)
        return "Undefined";

    var catLen = configVeraCategories.length;
    for (var catCnt = 0; catCnt < catLen; catCnt++) {
        if (configVeraCategories[catCnt].id == catId)
            return configVeraCategories[catCnt].Name;
    }
    return "Unknown (" + catId + ")";
}

function getVeraDevice(devId) {
    var numDevices = configVera.devices.length;
    for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
        if (devId == configVera.devices[iDevice].id)
            return configVera.devices[iDevice];
    }

    return null;
}

function getVeraDeviceIcon(devId) {
    var numDevices = configVera.devices.length;
    for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
        if (devId == configVera.devices[iDevice].id) {
            var catLen = configVeraCategories.length;
            for (var catCnt = 0; catCnt < catLen; catCnt++) {
                if (configVeraCategories[catCnt].id == configVera.devices[iDevice].category_num) {
                    if (configVeraCategories[catCnt].Icon == "")
                        return "images/node.png";
                    else
                        return configVeraCategories[catCnt].Icon;
                }
            }
        }
    }

    return "images/node.png";
}

function getDMDevice(dmId) {
    var numDevices = configChan.length;
    for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
        if (dmId == configChan[iDevice].Id)
            return configChan[iDevice];
    }

    return null;
}

function getVeraEnergyVariableState(service, variable) {
    if (service == "urn:micasaverde-com:serviceId:EnergyMetering1" & variable == "Watts") {
        return 1;
    }
    return 0;
}

function addVariable(newVar) {
    var rmLen = configVera.rooms.length;
    var devLen = configVera.devices.length;

    newVar.yAxis = 0;
    // Convert the date to a java date object
    if (newVar.LastRec != 0)
        newVar.LastRec = new Date(newVar.LastRec * 1000);
    else
        newVar.LastRec = null;

    // Get the device name and room id from the Vera config
    for (var devCnt = 0; devCnt < devLen; devCnt++) {
        if (newVar.Device == configVera.devices[devCnt].id) {
            newVar.devName = configVera.devices[devCnt].name;
            newVar.roomId = configVera.devices[devCnt].room;
        }
    }

    // Lookup the room name
    for (var rmCnt = 0; rmCnt < rmLen; rmCnt++) {
        if (configVera.rooms[rmCnt].id == newVar.roomId)
            newVar.room = configVera.rooms[rmCnt].name;
    }

    // Remember the initial drowsy settings
    // If they are set to 0, then use the system defaults
//    newVar.defaultDrowsyWarning = newVar.DrowsyWarning;
//    newVar.defaultDrowsyError = newVar.DrowsyError;

    if (newVar.DrowsyWarning == 0)
        newVar.DrowsyWarning = configGUI.generalDrowsyWarning;

    if (newVar.DrowsyError == 0)
        newVar.DrowsyError = configGUI.generalDrowsyError;

    channelStore.add(newVar);
}

function applyGuiDefaults() {
    if (configGUI.energyWholeHouseMin != null)
        configGUI.energyWholeHouseMin = parseFloat(configGUI.energyWholeHouseMin);
    if (configGUI.energyWholeHouseMax != null)
        configGUI.energyWholeHouseMax = parseFloat(configGUI.energyWholeHouseMax);
    if (configGUI.energyWholeHouseMin > 0 || configGUI.energyWholeHouseMin < -100000)
        configGUI.energyWholeHouseMin = null;
    if (configGUI.energyWholeHouseMax < 0 || configGUI.energyWholeHouseMax > 100000)
        configGUI.energyWholeHouseMax = null;
    if (configGUI.energyWholeHouseMin == null)
        configGUI.energyWholeHouseMin = 0;
    if (configGUI.energyWholeHouseMax == null)
        configGUI.energyWholeHouseMax = 6000;

    if (configGUI.generalDrowsyError != null)
        configGUI.generalDrowsyError = parseFloat(configGUI.generalDrowsyError);
    if (configGUI.generalDrowsyError > 864000000 || configGUI.generalDrowsyError < 300000)
        configGUI.generalDrowsyError = null;
    if (configGUI.generalDrowsyError == null)
        configGUI.generalDrowsyError = 86400000;

    if (configGUI.generalDrowsyWarning != null)
        configGUI.generalDrowsyWarning = parseFloat(configGUI.generalDrowsyWarning);
    if (configGUI.generalDrowsyWarning > 864000000 || configGUI.generalDrowsyWarning < 180000)
        configGUI.generalDrowsyWarning = null;
    if (configGUI.generalDrowsyWarning == null)
        configGUI.generalDrowsyWarning = 3600000;

    // Warning value can't be greater than the error value
    if (configGUI.generalDrowsyWarning > configGUI.generalDrowsyError)
        configGUI.generalDrowsyWarning = configGUI.generalDrowsyError - 60000;


    if (configGUI.graphDefaultPeriod == null)
        configGUI.graphDefaultPeriod = 1;
    if (configGUI.graphDefaultPeriod > 30)
        configGUI.graphDefaultPeriod = 1;
    if (configGUI.graphDefaultPeriod < 1)
        configGUI.graphDefaultPeriod = 1;

    if (configGUI.graphOptionMarkers == null)
        configGUI.graphOptionMarkers = false;
    if (configGUI.graphOptionMarkers != true)
        configGUI.graphOptionMarkers = false;

    if (configGUI.graphOptionShadows == null)
        configGUI.graphOptionShadows = false;
    if (configGUI.graphOptionShadows != true)
        configGUI.graphOptionShadows = false;

    if (configGUI.graphOptionLegend == null)
        configGUI.graphOptionLegend = true;
    if (configGUI.graphOptionLegend != false)
        configGUI.graphOptionLegend = true;

    if (configGUI.graphOptionCrosshairs == null)
        configGUI.graphOptionCrosshairs = true;
    if (configGUI.graphOptionCrosshairs != false)
        configGUI.graphOptionCrosshairs = true;

    if (configGUI.graphOptionTooltip == null)
        configGUI.graphOptionTooltip = true;
    if (configGUI.graphOptionTooltip != false)
        configGUI.graphOptionTooltip = true;

    if (configGUI.graphOptionTime == null)
        configGUI.graphOptionTime = true;
    if (configGUI.graphOptionTime != false)
        configGUI.graphOptionTime = true;

    if (configGUI.graphOptionWidth == null)
        configGUI.graphOptionWidth = 3;
    if (configGUI.graphOptionWidth > 10)
        configGUI.graphOptionWidth = 3;
    if (configGUI.graphOptionWidth < 1)
        configGUI.graphOptionWidth = 1;

    if (configGUI.graphOptionAnimation == null)
        configGUI.graphOptionAnimation = true;
    if (configGUI.graphOptionAnimation != false)
        configGUI.graphOptionAnimation = true;
}

var energyCategoryMatrix = [];
//var energyHouseMatrix = [];
var powerWholeHouseId = 0;
var powerWholeHouseValue = 0;

// Build up the array of power consuming devices in each category
function createEnergyCategoryMatrix() {
    energyCategoryMatrix[0] = {};
    energyCategoryMatrix[0].Devices = [];
    energyCategoryMatrix[0].Name = "Unaccounted";
    energyCategoryMatrix[0].Value = 0;
    energyCategoryMatrix[0].Devices[0] = {};
    energyCategoryMatrix[0].Devices[0].Name = "Unknown";
    energyCategoryMatrix[0].Devices[0].Value = 0;

    powerWholeHouseValue = 0;

    // Loop through the configuration looking for power variables
    var numDevices = configChan.length;
    for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
        if (configChan[iDevice].EnergyCat != null) {
            var catNum = configChan[iDevice].EnergyCat;

            // Now add the device
            var dev = getVeraDevice(configChan[iDevice].Device);

            /*            // Find the whole-house devices and generators
             if (catNum == 1 || catNum > 20) {
             energyHouseMatrix[configChan[iDevice].Id] = {};
             energyHouseMatrix[configChan[iDevice].Id].Name = dev.name
             energyHouseMatrix[configChan[iDevice].Id].EnergyCat = catNum;
             energyHouseMatrix[configChan[iDevice].Id].Value = parseFloat(configChan[iDevice].LastVal);
             if (catNum == 1)
             powerWholeHouseValue += parseFloat(configChan[iDevice].LastVal);
             else
             powerWholeHouseValue -= parseFloat(configChan[iDevice].LastVal);
             continue;
             */
            if (catNum == 1)
                powerWholeHouseValue += parseFloat(configChan[iDevice].LastVal);
            else if (catNum > 20)
                powerWholeHouseValue -= parseFloat(configChan[iDevice].LastVal);

            // Exclude unknown
            if (catNum == 0)
                continue

            //if(catNum != 1)
            //    continue;
            // Make sure the category exists
            if (energyCategoryMatrix[catNum] == null) {
                energyCategoryMatrix[catNum] = {};
                energyCategoryMatrix[catNum].Name = getEnergyCategory(catNum);
                energyCategoryMatrix[catNum].Devices = [];
                //console.debug("addCat=" + energyCategoryMatrix[catNum].Name);
            }

            energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id] = {};
            if (dev == null || dev.name == null)
                energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id].Name = "Error";
            else
                energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id].Name = dev.name;
            energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id].Value = parseFloat(configChan[iDevice].LastVal);
            //console.debug("addDev=" + energyCategoryMatrix[catNum].Name + " -- " + energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id].Name + " == " + energyCategoryMatrix[catNum].Devices[configChan[iDevice].Id].Value);
        }
    }
}

function updateEnergyCategoryMatrix(updateChan) {
    if (updateChan == null)
        return false;
    //console.debug("updateEnergyCategoryMatrix");
    /*
     // Find the current whole-house value
     var chLen = updateChan.length;
     for (var chCnt = 0; chCnt < chLen; chCnt++) {
     if (updateChan[chCnt].Id == powerWholeHouseId) {
     powerWholeHouseValue = parseFloat(updateChan[chCnt].LastVal);
     changes = true;
     // We're done!
     break;
     }
     }
     //console.debug("energyChartUsageCurrent(" + powerWholeHouseId + ") =" + powerWholeHouseValue);
     */
    if (energyCategoryMatrix.length == 0)
        return false;

    var changes = false;
    var numDevices = configChan.length;
    var numUpdates = updateChan.length;

    // Loop through the configuration looking for power variables
    for (var iUpdate = 0; iUpdate < numUpdates; ++iUpdate) {
        // Find the device from its Id
        for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
            if (configChan[iDevice].Id == updateChan[iUpdate].Id) {
                // Is it configured for energy
                if (configChan[iDevice].EnergyCat == null)
                    break;
                var catNum = configChan[iDevice].EnergyCat;

                /*                // Exclude whole-house and generators
                 if (catNum == 1 || catNum > 20) {
                 //console.debug("updateHouse=" + updateChan[iUpdate].Id + "  catNum=" + catNum + "  =" + updateChan[iUpdate].LastVal + "/" + energyHouseMatrix[updateChan[iUpdate].Id].Value);
                 if (energyHouseMatrix[updateChan[iUpdate].Id] != null)
                 energyHouseMatrix[updateChan[iUpdate].Id].Value = parseFloat(updateChan[iUpdate].LastVal);
                 break;
                 }*/
                if (catNum == 0)
                    break;

                if (energyCategoryMatrix[catNum].Devices[updateChan[iUpdate].Id] != null) {
                    energyCategoryMatrix[catNum].Devices[updateChan[iUpdate].Id].Value = parseFloat(updateChan[iUpdate].LastVal);
                    changes = true;

                    //console.debug("updateChan=" + updateChan[iUpdate].Id + "  catNum=" + catNum + "  =" + energyCategoryMatrix[catNum].Devices[updateChan[iUpdate].Id].Value);
                }
                break;
            }
        }
    }

    if (changes == false)
        return false;

    /*    powerWholeHouseValue = 0;
     for (var listCnt in energyHouseMatrix) {
     if (energyHouseMatrix[listCnt].EnergyCat == 1)
     powerWholeHouseValue += energyHouseMatrix[listCnt].Value;
     else
     powerWholeHouseValue -= energyHouseMatrix[listCnt].Value;
     }*/

    // Add up all the devices in a category
    powerWholeHouseValue = 0;
    var Total = 0;
    for (var listCnt in energyCategoryMatrix) {
        energyCategoryMatrix[listCnt].Value = 0;

        var varLen = energyCategoryMatrix[listCnt].Devices.length;
        for (var varCnt in energyCategoryMatrix[listCnt].Devices) {
            energyCategoryMatrix[listCnt].Value += energyCategoryMatrix[listCnt].Devices[varCnt].Value;
        }

        switch (parseInt(listCnt)) {
            case 0:
                break;
            case 1:
                powerWholeHouseValue += energyCategoryMatrix[listCnt].Value;
                break;
            case 21:
            case 22:
                powerWholeHouseValue -= energyCategoryMatrix[listCnt].Value;
                break;
            default:
                Total += energyCategoryMatrix[listCnt].Value;
                break;
        }

        //console.debug("catTotal=(" + listCnt + ")" + energyCategoryMatrix[listCnt].Name + "=" + energyCategoryMatrix[listCnt].Value);
    }

    //console.debug("updateWhole=" + powerWholeHouseValue + "/" + Total);
    // Calculate the difference between the sum of the devices and the "whole house"
    if (powerWholeHouseValue < Total) {
        energyCategoryMatrix[0].Value = 0;
        energyCategoryMatrix[0].Devices[0].Value = 0;
        //console.debug("updateUnknown=000");
    }
    else {
        energyCategoryMatrix[0].Value = powerWholeHouseValue - Total;
        energyCategoryMatrix[0].Devices[0].Value = powerWholeHouseValue - Total;
        //console.debug("updateUnknown=" + energyCategoryMatrix[0].Value + "/" + energyCategoryMatrix[0].Devices[0].Value);
    }

    // Keep the whole house graph within limits
    if (powerWholeHouseValue < configGUI.energyWholeHouseMin) {
        powerWholeHouseValue = configGUI.energyWholeHouseMin;
    }
    else if (powerWholeHouseValue > configGUI.energyWholeHouseMax) {
        powerWholeHouseValue = configGUI.energyWholeHouseMin;
    }
    return true;
}

function getHistory(Id) {
    var now = (new Date()).getTime() / 1000;

    //console.debug("UpdateHistory (" + Id + ") at " + now);

    var parms = {};
    parms.id = "lr_dmData";
    parms.start = Math.floor(now);
    parms.stop = Math.ceil(now) - 3600;
    parms.channel1 = Id;

    Ext.Ajax.request({
        url:veraServer + '/data_request',
        params:parms,
        method:'GET',
        success:function (response, opts) {
            //console.debug("UpdateHistory returned " + Id);
            var res = Ext.decode(response.responseText);

            var Dev = getDMDevice(Id);
            if (Dev == null)
                return;

            if (Dev.historyDay == null)
                Dev.historyDay = {};
            Dev.historyDay = res.series[0].data;
            //console.debug("UpdateHistory done");

            createEnergyHistory(Id);
        },
        failure:function (response, opts) {
            //console.log('server-side failure with status code ' + response.status);
        }
    });
}

function getEvents() {
    var now = (new Date()).getTime() / 1000;

    var parms = {};
    parms.id = "lr_dmCtrl";
    parms.start = Math.ceil(now) - (86400 * 30);
    parms.stop = Math.floor(now);
    parms.control = "events";

    Ext.Ajax.request({
        url:veraServer + '/data_request',
        params:parms,
        method:'GET',
        success:function (response, opts) {
            veraNotifications = [];
            veraNotifications.Events = [];
            //console.debug("UpdateHistory returned " + Id);
            var res = Ext.decode(response.responseText);
            for (var listCnt in res.Events) {
                // Only add items that are "real"!
                if (res.Events[listCnt].timestamp != null) {
                    veraNotifications.Events.push(res.Events[listCnt]);

                    if (res.Events[listCnt].timestamp > veraNotificationsLast)
                        veraNotificationsLast = res.Events[listCnt].timestamp;
                }
            }
//            veraNotifications = res;
        },
        failure:function (response, opts) {
            //console.log('server-side failure with status code ' + response.status);
        }
    });
}

function doUSBConfig() {
    if (appConfig.luup.SetManualMount == 1)
        return;

    if (USBConfigOnce == true)
        return;
    USBConfigOnce = true;

    var uuid = [];
    for (var i = 0, c = appConfig.blkid.length; i < c; i++) {
        uuid[i] = {};
        uuid[i].id = appConfig.blkid[i].uuid;
        if (appConfig.blkid[i].label != null)
            uuid[i].name = appConfig.blkid[i].uuid + " (" + appConfig.blkid[i].label + ")";
        else
            uuid[i].name = appConfig.blkid[i].uuid;
    }

    // Define the model for a State
    Ext.define('USB', {
        extend:'Ext.data.Model',
        fields:[
            {type:'string', name:'id'},
            {type:'string', name:'name'}
        ]
    });

    var form = Ext.widget('form', {
        layout:{
            type:'vbox',
            align:'stretch'
        },
        border:false,
        bodyPadding:10,

        fieldDefaults:{
            labelAlign:'top',
            labelWidth:100,
            labelStyle:'font-weight:bold'
        },
        items:[
            {
                xtype:'textareafield',
                id:'usbInfo',
                flex:1,
                margins:'0'
            },
            {
                xtype:'combobox',
                fieldLabel:'USB UUID',
                id:'usbUUID',
                name:'usbUUID',
                store:{model:'USB', data:uuid},
//                value: appConfig.luup.SetMountUUID,
                valueField:'id',
                displayField:'name',
                queryMode:'local',
                forceSelection:true,
                editable:false,
                typeAhead:true,
                queryMode:'local',
                emptyText:'Select USB Drive'
            }
        ],

        buttons:[
            {
                text:'Cancel',
                handler:function () {
                    Ext.getCmp('usbWindow').hide();
                    Ext.MessageBox.show({
                        msg:'You have not configured dataMine. ' +
                            'You must now do this manually, or you can refresh the GUI to complete the setup again. ' +
                            'Until this is done, the system may not work as planned<br><br>' +
                            'Please restart Luup (press the Reload button in UI5).<br>' +
                            'Wait a moment before then refreshing the GUI.',
                        width:400,
                        height:40,
                        icon:'graph-download-warning',
                        draggable:false,
                        closable:false
                    });
                }
            },
            {
                text:'Save',
                handler:function () {
                    if (this.up('form').getForm().isValid()) {
                        var parms = {};
                        parms.id = "lr_dmCtrl";
                        parms.control = "appConfigSet";
                        parms.SetMountUUID = Ext.getCmp('usbUUID').getValue();
                        parms.SetManualMount = 0;
                        parms.SetMountPoint = "";

                        Ext.Ajax.request({
                            url:veraServer + '/data_request',
                            params:parms,
                            method:'GET',
                            success:function (response, opts) {
                                Ext.getCmp('usbWindow').hide();
                                Ext.MessageBox.show({
                                    msg:'Please restart Luup (press the Reload button in UI5). ' +
                                        'Wait a moment before then refreshing the GUI.',
                                    width:400,
                                    height:40,
                                    icon:'graph-download-warning',
                                    draggable:false,
                                    closable:false
                                });
                            },
                            failure:function (response, opts) {
                                Ext.getCmp('usbWindow').hide();
                                Ext.MessageBox.show({
                                    msg:'There was an error saving the data.',
                                    width:200,
                                    height:40,
                                    icon:'graph-download-error',
                                    draggable:false,
                                    closable:false
                                });
                            }
                        });
                    }
                }
            }
        ]
    });

    Ext.widget('window', {
        title:'USB Configuration',
        closeAction:'hide',
        id:'usbWindow',
        width:500,
        height:345,
        layout:'fit',
        draggable:false,
        resizable:false,
        modal:true,
        items:form
    }).show();

    var Msg = "";
    Msg += "<i>dataMine</i> has detected that your USB is not configured, or there was a failure during the mounting of the USB drive.<br>"
    Msg += "If you have not configured <i>dataMine</i> previously, please select the USB drive unique ID below.<br>"
    Msg += "If you are unsure of the UUID, it is recommended that you set a label for the USB drive on your PC which will also be displayed below, reinstall the USB in Vera, and refresh the GUI.<br>"
    Msg += "<br>";
    Msg += "If <i>dataMine</i> has been configured, then you may have a problem with your USB drive. Try restarting Vera - if that doesn't help try looking at the USB drive on a PC.<br>";
    Msg += "<br>";
    Msg += "<b>Note:</b> If you are using <i>dataMine</i> with the same USB drive as Vera logging, then please read the <i>dataMine</i> documentation to get the correct configuration and press Cancel now.<br>";
//    Msg += "Your configuration:<br>";
//    Msg += "SetDataDirectory: "+appConfig.luup.SetDataDirectory+"<br>";
//    Msg += "SetMountUUID: "+appConfig.luup.SetMountUUID+"<br>";
//    Msg += "SetMountPoint: "+appConfig.luup.SetMountPoint+"<br>";
//    Msg += "SetManualMount: "+appConfig.luup.SetManualMount+"<br>";


    Ext.getCmp('usbInfo').update(Msg);
    Ext.getCmp('usbUUID').setValue(appConfig.luup.SetMountUUID);
}

function createUI() {
//  Ext.QuickTips.init();

    // Get the notifications/events from Vera
    getEvents();

    lastDataVersion = configVera.DataVersion;
    lastLoadTime = configVera.LoadTime;

    applyGuiDefaults();

    Ext.define('ChannelList', {
        extend:'Ext.data.Model',
        fields:[
            {name:'Id'},
            {name:'Name'},
            {name:'selected'},
            {name:'status'},
            {name:'room'},
            {name:'devName'},
            {name:'DataType'},
            {name:'LastVal', type:'float'},
            {name:'LastRec'},
            {name:'yAxis'},
            {name:'Ghost'},
            {name:'DrowsyWarning'},
            {name:'DrowsyError'},
            {name:'DataOffset'},
            {name:'Logging'}
        ],
        idProperty:'channels'
    });

    // create the data store
    channelStore = Ext.create('Ext.data.ArrayStore', {
        model:'ChannelList'//,
//        data: configChan.list
    });

    if (configChan != null) {
        var chLen = configChan.length;
        for (var chCnt = 0; chCnt < chLen; chCnt++) {
            addVariable(configChan[chCnt]);
        }
    }

    channelStore.filter("Logging", 1);

    Ext.define('GraphList', {
        extend:'Ext.data.Model',
        fields:[
            {name:'Name'},
            {name:'Icon'}
        ]
        //,
        //idProperty:'channels'
    });


    // create the data store
    graphStore = Ext.create('Ext.data.ArrayStore', {
        model:'GraphList'//,
//        data: configChan.list
    });

    // Check to see if there are no null in the array!!
    if (configGraph != null) {
        var chLen = configGraph.length;
        for (var chCnt = 0; chCnt < chLen; chCnt++) {
            if (configGraph[chCnt] == null)
                configGraph.splice(chCnt, 1)
        }
    }

    graphStore.loadData(configGraph);

    createEnergyCategoryMatrix();

    // Periodically retrieve the dataMine status updates
    var updateStatus = {
        run:function () {
            Ext.Ajax.request({
                url:veraServer + '/data_request',
                params:{
                    id:"lr_dmCtrl",
                    control:"status",
                    last:lastStatusUpdate
                },
                method:'GET',
                success:function (response, opts) {
                    if (response.responseText == "No handler") {
                        Ext.get('statusicon').dom.src = 'images/status-offline.png';
                        statusTooltip.update("Vera is not responding to requests")
                        return;
                    }

                    var res = Ext.decode(response.responseText);
                    if (res.System == null) {
                        Ext.get('statusicon').dom.src = 'images/status.png';
                        statusTooltip.update("Vera is online and responding to requests")
                    }
                    else {
                        if (res.System.ErrorStatus == 0) {
                            Ext.get('statusicon').dom.src = 'images/status.png';
                            statusTooltip.update("Vera is online and responding to requests")
                        }
                        else {
                            Ext.get('statusicon').dom.src = 'images/status-busy.png';
                            statusTooltip.update("Vera is online, however dataMine has errors (Error Count " + res.System.ErrorCount + ").")
                        }
                        //res.System.Initialised = false;
                        if (res.System.Initialised == false) {
                            // The Lua plugin is not initialised, or faile to install USB!!!
                            doUSBConfig();
                        }
                    }

                    if (res.Variables.length > 0) {
                        if (updateEnergyCategoryMatrix(res.Variables))
                            updateEnergySummary();

                        if (channelStore != null) {
                            // Force a full update if status doesn't update for >60seconds
                            if ((lastStatusUpdate != 0) && (lastStatusUpdate < res.time - 60))
                                lastStatusUpdate = 0;
                            else
                                lastStatusUpdate = res.time;
                            listLen = res.Variables.length;
                            for (var chCnt = 0; chCnt < listLen; chCnt++) {
                                var index = channelStore.findExact('Id', res.Variables[chCnt].Id);
                                if (index != -1) {
                                    var upd = channelStore.getAt(index);
                                    if (res.Variables[chCnt].LastRec != 0)
                                        upd.set('LastRec', new Date(res.Variables[chCnt].LastRec * 1000));
                                    else
                                        upd.set('LastRec', null);
                                    upd.set('LastVal', res.Variables[chCnt].LastVal);
                                }
                            }
                        }
                    }
                    if (res.Events != null) {
                        if (res.Events.last != veraNotificationsLast) {
                            // There are new notifications...
                            getEvents();
                        }
                    }
                    if (res.reload != reloadTime) {
                        if (reloadTime != 0) {
                            // Server has restarted - notify user (?)
                            Ext.MessageBox.show({
                                msg:'Vera has restarted. Data may have changed and it is advisable to reload the dataMine GUI.',
                                width:375,
                                height:140,
                                icon:'graph-download-warning',
                                draggable:false,
                                closable:false,
                                buttons: Ext.Msg.OK
                            });

                            // Force a full update of the status
                            lastStatusUpdate = 0;
                        }
                        reloadTime = res.reload;
                    }
                },
                failure:function (response, opts) {
                    Ext.get('statusicon').dom.src = 'images/status-offline.png';
                    statusTooltip.update("Vera is not responding to requests.")
                    //console.log('server-side failure with status code ' + response.status);
                }
            });
        },
        interval:5000
    }
    Ext.TaskManager.start(updateStatus);
    /*
     // Periodically retrieve the Vera status
     var updateVera = {
     run:function () {
     Ext.Ajax.request({
     url:'/port_3480/data_request',
     params:{
     id:"lu_status",
     DataVersion:lastDataVersion,
     LoadTime:lastLoadTime,
     MinimumDelay:2000,
     Timeout:60,
     last:lastStatusUpdate
     },
     method:'GET',
     success:function (response, opts) {
     var res = Ext.decode(response.responseText);

     lastDataVersion = res.DataVersion;
     lastLoadTime = res.LoadTime;



     devLen = res.devices.length;
     for (var devCnt = 0; devCnt < devLen; devCnt++) {
     var index = channelStore.find(findChannelId);
     if (index != -1) {
     var upd = channelStore.getAt(index);
     if (res.Variables[chCnt].LastRec != 0)
     upd.set('LastRec', new Date(res.Variables[chCnt].LastRec * 1000));
     else
     upd.set('LastRec', null);
     upd.set('LastValue', res.Variables[chCnt].LastValue);
     }
     }






     },
     failure:function (response, opts) {
     console.log('server-side failure with status code ' + response.status);
     }
     });
     },
     interval:100
     }
     Ext.TaskManager.start(updateVera);
     */


    // Periodically retrieve the dataMine history data
    var updateHistory = {
        run:function () {
            var numDevices = configChan.length;
            for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
                if (configChan[iDevice].EnergyCat == 1)
                    getHistory(configChan[iDevice].Id);
            }
        },
        interval:600000
    }
    Ext.TaskManager.start(updateHistory);


    var dashTab = Ext.create('DataMine.dashboard', {
        icon:'images/dashboard.png',
        tabTip:'Display chart page',
        title:'Dashboard',
        cls:'empty'
    });

    var chartTab = Ext.create('DataMine.graph', {
        icon:'images/chart-up.png',
        tabTip:'Display chart page',
        title:'Chart',
        cls:'empty'
    });

    var configTab = Ext.create('DataMine.configLogging', {
        title:'Configuration',
        icon:'images/gear.png',
        tabTip:'Display <i>dataMine</i> configuration page',
        cls:'empty'
    });

    Ext.define('StatusBar', {
        extend:'Ext.Component',
        alias:'widget.statusbar',
        html:'<div id="onlineStatus" style="position:absolute;right:5px;top:3px;"><span id="statustext" style="vertical-align: top;">Online Status </span><img style="margin-top:-1px;" id="statusicon" src="images/status-offline.png"></div>',
        style:{
            'width':200
        }
    });

    var tabMain = Ext.create('Ext.tab.Panel', {
        id:'mainTab',
        plain:false,
        layout:'fit',
        listeners:{
            render:function () {
                this.tabBar.add(
                    { xtype:'tbfill' },
                    { xtype:'statusbar' }
                );
            }
        },
        items:[chartTab, dashTab, configTab]
    });

    viewPort = Ext.create('Ext.container.Viewport', {
        el:'dataMine',
        layout:'fit',
        renderTo:'dataMine',
        hidden:true,
        items:[tabMain]
    });

//    viewPort.add(tabMain);

    viewPort.show(true);

    Ext.get('splashscreen').fadeOut({
        duration:500,
        remove:true
    });

    Ext.get('dataMine').show(true);

    statusTooltip = Ext.create('Ext.tip.ToolTip', {target:'onlineStatus', html:'Offline'});
}

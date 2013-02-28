var chartChannels = null;


var chanList;
//var chartOptions;
var chartMin = 0;
var chartMax = 0;
var chartObject = null;
//var seriesData = null;
var RealTimeUpdate = false;

var chartTimeVera = 0;
var chartTimeResponse = 0;
var chartTimeRender = 0;
var chartTimeTotal = 0;

var EVT_NONE = 0;
var EVT_LINKED = 1;
var EVT_ALL = 2;
var eventDisplay = EVT_NONE;
var eventAxis = -1;

var graphInfoItems;

var dataTypeArray = [
    {icon:'node.png'},
    {icon:'thermometer.png'},
    {icon:'water.png'},
    {icon:'switch.png'},
    {icon:'brightness.png'},
    {icon:'light-bulb.png'},
    {icon:'lock.png'},
    {icon:'thermometer-high.png'},
    {icon:'thermometer-low.png'},
    {icon:'weather-cloudy.png'},
    {icon:'battery-charge.png'},
    {icon:'clock.png'}
];


chartOptions = {
    chart:{
        renderTo:'chartIsHere',
        animation:true,
        type:'spline',
        zoomType:'x',
        events:{
            selection:function (event) {
                event.preventDefault();
                updateChart(chartChannels, Math.floor(event.xAxis[0].min / 1000), Math.ceil(event.xAxis[0].max / 1000));
            },
            click:function (event) {
//							event.preventDefault();
//							updateChart(chartChannels, event.xAxis[0].min, event.xAxis[0].max);
            }
        }
    },
    credits:{
        enabled:false
    },
    title:{
        text:null
    },
    subtitle:{
//					text: null
    },
    xAxis:{
        type:'datetime',
//					maxZoom: 4 * 3600000,	// 4 hours
        dateTimeLabelFormats:{ // don't display the dummy year
            month:'%e. %b',
            year:'%b'
        }
    },
    yAxis:[
        {
            title:{
                text:null
            }
        },
        {
            title:{
                text:null
            }
        },
        {
            title:{
                text:null
            }
        },
        {
            title:{
                text:null
            }
        },
        {
            title:{
                text:null
            },
            min:-1,
            max:0,
            maxPadding:0,
            minPadding:0,
            tickLength:0,
            labels:{
                enabled:false
            }
        }
    ],
    plotOptions:{
        spline:{
            lineWidth:3,
            states:{
                hover:{
                    lineWidth:5
                }
            },
            marker:{
                states:{
                    hover:{
                        enabled:true,
                        symbol:'circle',
                        radius:5,
                        lineWidth:1
                    }
                }
            }
        },
        series:{
            marker:{
                enabled:false
            }
        }
    },
    legend:{
        enabled:true
    },
    tooltip:{
        enabled:true,
        crosshairs:true,
        shared:false,
//					formatter: function() {
//							return '&lt;b&gt;'+ this.series.name +'&lt;/b&gt;&lt;br/&gt;'+
//							Highcharts.dateFormat('%e. %b', this.x) +': '+ this.y +' m';
//					}
        formatter:function () {
            if (this.series.name != "Notifications") {
                return '<b>' + this.series.name + '</b><br/>' +
                    Highcharts.dateFormat('%H:%M:%S %d/%m/%Y', this.x) + ' ' +
                    Highcharts.numberFormat(this.y, 2);
            }
            else {
                var title = "Notification";
                var info = "";
                var evt = findNotification(this.point.id);
                if (evt != null) {
                    title = evt.description;
                    if (evt.value != "")
                        title += " (" + evt.value + ")";
                    var dev = getVeraDevice(evt.device);
                    if (dev != null) {
                        info = '<br>from: ' + dev.name;
                    }
                }
                return '<b>' + title + '</b><br/>' +
                    Highcharts.dateFormat('%H:%M:%S %d/%m/%Y', this.x) +
                    info;
//                    Highcharts.numberFormat(this.y, 2);
            }
        }
    }
};


function toolbarEnable() {
    Ext.getCmp('chartTb-zoomIn').enable();
    Ext.getCmp('chartTb-zoomOut').enable();
    Ext.getCmp('chartTb-scrollLeft').enable();
    Ext.getCmp('chartTb-scrollRight').enable();
    Ext.getCmp('chartTb-viewDay').enable();
    Ext.getCmp('chartTb-viewWeek').enable();
    Ext.getCmp('chartTb-eventsNone').enable();
    Ext.getCmp('chartTb-eventsSome').enable();
    Ext.getCmp('chartTb-eventsAll').enable();
    Ext.getCmp('chartTb-info').enable();
//        Ext.getCmp('chartTb-viewMonth').enable();
}

function createNotificationSeries(start, stop, device) {
    var series = [];
    var cnt = 0;
    for (var listCnt in veraNotifications.Events) {
        // Check if this is inside the time required...
        if (veraNotifications.Events[listCnt].timestamp < start | veraNotifications.Events[listCnt].timestamp > stop)
            continue;

        // Check if the device is the one we want
        if (device != null & veraNotifications.Events[listCnt].device != device)
            continue;

        //if(veraNotifications.Events[listCnt].Value)
        var newEvt = {};
        newEvt.x = veraNotifications.Events[listCnt].timestamp * 1000;
        newEvt.y = 0;
        newEvt.id = veraNotifications.Events[listCnt].id;
        newEvt.marker = {};
        newEvt.marker.enabled = true;
        if (veraNotifications.Events[listCnt].device == 0) {
            newEvt.marker.symbol = "url(images/computer.png)";
        }
        else {
            newEvt.marker.symbol = "url(" + getVeraDeviceIcon(veraNotifications.Events[listCnt].device) + ")";
        }

        series[cnt] = newEvt;
        cnt++;
    }
    return series;
}

function addNotifications(channels, start, stop) {
    var data;

    if (eventDisplay == EVT_LINKED) {
        var nodes = [];

        // Build the list of devices - remove any duplicates!
        for (var chCnt = 0; chCnt < channels.length; chCnt++) {
            var dmDev = getDMDevice(channels[chCnt].value);
            if (dmDev != null) {
                if (nodes.indexOf(dmDev.Device) == -1)
                    nodes.push(dmDev.Device);

                var vDev = getVeraDevice(dmDev.Device);
                if ((vDev != null) && (vDev.id_parent != 0)) {
                    if (nodes.indexOf(vDev.id_parent) == -1)
                        nodes.push(vDev.id_parent);
                }
            }
        }

        for (var chCnt = 0; chCnt < nodes.length; chCnt++) {
            var ret = createNotificationSeries(start, stop, nodes[chCnt]);
            if (data == null)
                data = ret;
            else
                data = data.concat(ret);
        }
    }
    else
        data = createNotificationSeries(start, stop);

    var startLen = data.length;

    // Now, make sure we don't have too many, or Highcharts won't display them!
    if (startLen >= 500) {
        var sampleInc = startLen / 500;
        var outCnt = 0;
        var val = 0;
        for (var chCnt = startLen-1; chCnt >= 0; chCnt--) {
            if(val > outCnt) {
                data.splice(chCnt, 1);
            }
            else
            val += sampleInc;
            outCnt++;
        }
    }

    graphInfoItems[4 + eventAxis] = [];
    graphInfoItems[4 + eventAxis].name = "Notifications points";
    graphInfoItems[4 + eventAxis].value = data.length + " / " + startLen;

    return data;
}

function findNotification(id) {
    for (var listCnt in veraNotifications.Events) {
        if (id == veraNotifications.Events[listCnt].id)
            return veraNotifications.Events[listCnt];
    }
    return null;
}

function saveGraphOption(name, value) {
    var parms = {};
    parms.id = "lr_dmCtrl";
    parms.control = "saveConfig";
    parms[name] = value;

    Ext.Ajax.request({
        url:veraServer + '/data_request',
        timeout:5000,
        params:parms,
        method:'GET',
        success:function (response, opts) {
            // Check for errors
            if (response.responseText == "Handler failed") {
            }
        }
    });
}

function updateChart(channels, start, stop, newChart) {
    chartChannels = channels;
    var timeStart = (new Date()).getTime();
    var timeInit = timeStart;

    Ext.MessageBox.show({
        msg:'Downloading graph data...',
        width:100,
        height:40,
        icon:'graph-download',
        draggable:false,
        closable:false
    });

    var parms = {};
    parms.id = "lr_dmData";
    parms.start = Math.floor(start);
    parms.stop = Math.ceil(stop);

    for (var chCnt = 0; chCnt < channels.length; chCnt++) {
        parms["channel" + (chCnt + 1)] = channels[chCnt].value;
    }

    // Remove the categories from the yAxis
    chartOptions.yAxis[0].categories = null;
    chartOptions.yAxis[1].categories = null;
    chartOptions.yAxis[2].categories = null;
    chartOptions.yAxis[3].categories = null;

    Ext.Ajax.request({
        url:veraServer + '/data_request',
        timeout:20000,
        params:parms,
        method:'GET',
        success:function (response, opts) {
            // Reset the info store
            graphInfoItems = [];

            // Check for errors
            if (response.responseText == "Handler failed") {
                Ext.MessageBox.show({
                    msg:'Error downloading data from Vera : Handler Failed',
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

            graphInfoItems[1] = [];
            graphInfoItems[1].name = "Response Time";
            graphInfoItems[1].value = (new Date()).getTime() - timeStart + " ms";

            timeStart = (new Date()).getTime();

            var json = Ext.decode(response.responseText);

            graphInfoItems[0] = [];
            graphInfoItems[0].name = "Vera Processing Time";
            graphInfoItems[0].value = Math.floor(json.procTime * 1000) + " ms";

            var options = chartOptions;		// Keep a copy of the options - NOT REALLY DOING THIS!!!
            var binaryOffset = 0;
            var binaryAxis = 0;

            options.series = [];

            var cnt, tot;
            cnt = 0;
            tot = 0;
            //				for(var s = 0; s < json.series.length; s++) {
            //					if(flotrChan[s].axis == 0) {
            //						tot++;
            //						if(json.series[s].min == 0 & json.series[s].max == 1)
            //							cnt++;
            //					}
//				}
//				if(tot > 0 & tot == cnt) {
            //					binaryAxis = 1;
            //				}
//				else {
            //					cnt = 0;
            //					tot = 0;
            //					for(var s = 0; s < json.series.length; s++) {
            //						if(flotrChan[s].axis == 1) {
            //							tot++;
            //							if(json.series[s].min == 0 & json.series[s].max == 1)
            //								cnt++;
            //						}
//					}
//					if(tot > 0 & tot == cnt)
//						binaryAxis = 2;
//				}

//				if(binaryAxis == 0) {
            //					flotrOptions.yaxis.showLabels  = true;
            //					flotrOptions.y2axis.showLabels = true;
            //				}
//				else if(binaryAxis == 1) {
            //					flotrOptions.yaxis.showLabels  = false;
            //					flotrOptions.y2axis.showLabels = true;
            //				}
//				else if(binaryAxis == 2) {
            //					flotrOptions.yaxis.showLabels  = true;
            //					flotrOptions.y2axis.showLabels = false;
            //				}

            if (json.series) {
                for (var s = 0; s < json.series.length; s++) {
                    graphInfoItems[4 + s] = [];
                    graphInfoItems[4 + s].name = json.series[s].label + " points";
                    graphInfoItems[4 + s].value = json.series[s].pointsRet + " / " + json.series[s].pointsTot;

                    // Get the configuration data
                    var dmDev = getDMDevice(json.series[s].Id);

                    // Get the axis
                    var yAxis = 0;
                    for (var c = 0; c < channels.length; c++) {
                        if (channels[c].value == dmDev.Id) {
                            yAxis = channels[c].axis;
                            break;
                        }
                    }

                    // Turn the realtime data into a 1 second timeline
                    if (RealTimeUpdate) {
                        var newSeries = [];
                        var seriesTime = json.series[s].data[0][0];     // Start time
                        var Counter = 0;
                        for (var i = 1; i < json.series[s].data.length; i++) {
                            do {
                                newSeries[Counter] = [];
                                newSeries[Counter][0] = seriesTime;
                                newSeries[Counter][1] = json.series[s].data[i][1];
                                seriesTime += 1000;
                                Counter++;
                            }
                            while (seriesTime < json.series[s].data[i][0])
                            //							if(binaryAxis == json.series[s].yaxis)
                            //								json.series[s].data[i][1] += binaryOffset;
                        }
                        json.series[s].data = newSeries;
                    }
                    else if (dmDev.DataOffset != 0) {
                        for (var i = 0; i < json.series[s].data.length; i++) {
                            json.series[s].data[i][1] += dmDev.DataOffset;
                        }
                    }

//						if(binaryAxis == json.series[s].yaxis)
//							binaryOffset += 2;

                    // If ticks are provided, add categories to the graph
                    if (json.series[s].ticks) {
                        chartOptions.yAxis[yAxis].categories = new Array();
                        for (var t = 0; t < json.series[s].ticks.length; t++) {
                            chartOptions.yAxis[yAxis].categories[json.series[s].ticks[t][1]] = json.series[s].ticks[t][0];
                        }
                    }

                    options.series[s] = [];
                    options.series[s].data = json.series[s].data;
                    options.series[s].name = json.series[s].label;
                    options.series[s].yAxis = yAxis;

                    if (dmDev == null)
                        option.series[s].type = "spline";
                    else {
                        switch (dmDev.Type) {
                            case 1:
                                options.series[s].type = "line";
                                break;
                            case 2:
                                options.series[s].type = "scatter";
//                                chartOptions.scatter.marker.enabled = true;
                                break;
                            case 3:
                            case 4:
                                options.series[s].type = "area";
                                break;
                            default:
                                options.series[s].type = "spline";
                                break;
                        }
                    }
                }

                eventAxis = options.series.length;
                if (eventDisplay) {
                    options.series[eventAxis] = {};
                    options.series[eventAxis].name = "Notifications";
                    options.series[eventAxis].yAxis = 4;
                    options.series[eventAxis].type = "scatter";
                    options.series[eventAxis].data = addNotifications(channels, parms.start, parms.stop);
                }

                // Remember the series data so we can redraw if needed
//                seriesData = json.series;

//                if (chartObject)
//                    chartObject.hideLoading();

                chartObject = new Highcharts.Chart(options);
            }
            if (json.min) {
                chartMin = json.min;
                chartMax = json.max;
            }

            graphInfoItems[2] = [];
            graphInfoItems[2].name = "Render Time";
            graphInfoItems[2].value = (new Date()).getTime() - timeStart + " ms";
            graphInfoItems[3] = [];
            graphInfoItems[3].name = "Total Time";
            graphInfoItems[3].value = (new Date()).getTime() - timeInit + " ms";

            Ext.MessageBox.hide();

            if (json.error) {
                Ext.MessageBox.show({
                    msg:'Warning: ' + json.error,
                    width:200,
                    draggable:false,
                    icon:'graph-download-warning',
                    closable:false
                });
                setTimeout(function () {
                    Ext.MessageBox.hide();
                }, 2500);
            }
        },
        failure:function (response, opts) {
            Ext.MessageBox.hide();
            Ext.MessageBox.show({
                msg:'Error downloading data from Vera: Response ' + response.status,
                width:200,
                draggable:false,
                icon:'graph-download-error',
                closable:false
            });
            setTimeout(function () {
                Ext.MessageBox.hide();
            }, 2500);
        }
    });
}

function redrawChart() {
    if (chartObject != null) {
        chartObject.destroy();
        chartObject = null;
    }

    var options = chartOptions;
//    options.series[0].data = seriesData[0].data;


    if (eventDisplay) {
        options.series[eventAxis] = {};
        options.series[eventAxis].name = "Notifications";
        options.series[eventAxis].yAxis = 4;
        options.series[eventAxis].type = "scatter";
        options.series[eventAxis].data = addNotifications(chartChannels, chartMin, chartMax);
    }
    else {
        options.series.splice(eventAxis, 1);
    }

    options.chart.animation = false;
    chartObject = new Highcharts.Chart(options);
    options.chart.animation = true;
}

function doGraphTime(days) {
    var ts = Math.round((new Date()).getTime() / 1000);
    updateChart(chartChannels, ts - (days * 86400), ts);
}

var saveWin;
function saveGraph(channels) {
    if (!saveWin) {
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
                    xtype:'textfield',
                    id:'graphName',
                    fieldLabel:'Graph Name',
                    maxLength:50,
                    enforceMaxLength:true,
                    afterLabelTextTpl:'<span style="color:red;font-weight:bold" data-qtip="Required.">*</span>',
//                    vtype:'name',
                    allowBlank:false
                },
                {
                    xtype:'textfield',
                    id:'graphRef',
                    fieldLabel:'Quickview reference',
                    maxLength:15,
                    enforceMaxLength:true,
                    afterLabelTextTpl:'<span data-qtip="Used to reference the graph directly through /dm/graph.html?ref=<i>reference</i>."><img src="images/question.png"></span>',
                    maskRe:/([0-9a-zA-Z]+)/,
//                    regex: /[0-9]/,
                    allowBlank:true
                }
            ],

            buttons:[
                {
                    text:'Cancel',
                    handler:function () {
                        this.up('form').getForm().reset();
                        this.up('window').hide();
                    }
                },
                {
                    text:'Save',
                    handler:function () {
//                        if (this.up('form').getForm().isValid()) {
                        var parms = {};
                        parms.id = 'lr_dmCtrl';
                        parms.control = 'saveGraph';
                        parms.name = Ext.getCmp('graphName').getValue();
                        parms.ref = Ext.getCmp('graphRef').getValue();


                        for (var chCnt = 0; chCnt < channels.length; chCnt++) {
                            parms["channel" + (chCnt + 1)] = channels[chCnt].value;
                        }

                        Ext.Ajax.request({
                            url:veraServer + '/data_request',
                            params:parms,
                            method:'GET',
                            success:function (response, opts) {
                                configGraph = Ext.decode(response.responseText);
                                graphStore.loadData(configGraph);
                            }
                        });


                        this.up('form').getForm().reset();
                        this.up('window').hide();
//                            Ext.MessageBox.alert('Thank you!', 'Your inquiry has been sent. We will respond as soon as possible.');
//                      }
                    }
                }
            ]
        });

        saveWin = Ext.widget('window', {
            title:'Save Graph',
            closeAction:'hide',
            width:350,
            height:175,
            layout:'fit',
            resizable:false,
            modal:true,
            items:form
        });
    }
    saveWin.show();
}

Ext.define('DataMine.graph', {
    extend:'Ext.panel.Panel',
    layout:'border',
    xtype:'dmGraph',
    id:'chartMain',
    border:false,

    initComponent:function () {
        // Default to local time
        Highcharts.setOptions({global:{useUTC:false}});

        var tbChart = Ext.create('Ext.toolbar.Toolbar', {
            items:[
                {
                    icon:'images/zoom_in.png',
                    id:'chartTb-zoomIn',
                    disabled:true,
                    cls:'x-btn-icon',
                    tooltip:'Zoom In',
                    handler:function () {
                        var zoom;

                        zoom = (chartMax - chartMin) / 5;
                        updateChart(chartChannels, chartMin + zoom, chartMax - zoom);
                    }
                },
                {
                    icon:'images/zoom_out.png',
                    id:'chartTb-zoomOut',
                    disabled:true,
                    cls:'x-btn-icon',
                    tooltip:'Zoom Out',
                    handler:function () {
                        var zoom;

                        zoom = (chartMax - chartMin) / 5;
                        updateChart(chartChannels, chartMin - zoom, chartMax + zoom);
                    }
                },
                '-',
                {
                    icon:'images/calendar_view_day.png',
                    id:'chartTb-viewDay',
                    disabled:true,
                    cls:'x-btn-icon',
                    tooltip:'Display last day',
                    handler:function () {
                        doGraphTime(1);
                    }
                },
                {
                    icon:'images/calendar_view_week.png',
                    id:'chartTb-viewWeek',
                    disabled:true,
                    cls:'x-btn-icon',
                    tooltip:'Display last week',
                    handler:function () {
                        doGraphTime(7);
                    }
                },
                {
                    icon:'images/calendar_view_month.png',
                    id:'chartTb-viewMonth',
                    disabled:true,
                    cls:'x-btn-icon',
                    tooltip:'Display last month',
                    handler:function () {
                        doGraphTime(30);
                    }
                },
                '-',
                {
                    icon:'images/arrow_left.png',
                    id:'chartTb-scrollLeft',
                    disabled:true,
                    cls:'x-btn-icon',
                    tooltip:'Scroll left',
                    handler:function () {
                        var scroll;

                        scroll = (chartMax - chartMin) / 5;
                        updateChart(chartChannels, chartMin - scroll, chartMax - scroll);
                    }
                },
                {
                    icon:'images/arrow_right.png',
                    id:'chartTb-scrollRight',
                    disabled:true,
                    cls:'x-btn-icon',
                    tooltip:'Scroll right',
                    handler:function () {
                        var scroll;

                        scroll = (chartMax - chartMin) / 5;
                        updateChart(chartChannels, chartMin + scroll, chartMax + scroll);
                    }
                },
                '-',
                {
                    icon:'images/clock.png',
                    id:'chartTb-realTime',
                    disabled:true,
                    cls:'x-btn-icon',
                    tooltip:'Display real-time graph',
                    handler:function () {
                    }
                },
                '-',
                {
                    icon:'images/flag-white.png',
                    id:'chartTb-eventsNone',
                    disabled:true,
                    pressed:true,
                    allowDepress:false,
                    toggleGroup:'events',
                    cls:'x-btn-icon',
                    tooltip:"Don't show Vera notifications",
                    handler:function () {
                        if (eventDisplay == EVT_NONE)
                            return;
                        eventDisplay = EVT_NONE;
                        redrawChart();
                    }
                },
                {
                    icon:'images/flag-green.png',
                    id:'chartTb-eventsSome',
                    disabled:true,
                    allowDepress:false,
                    toggleGroup:'events',
                    cls:'x-btn-icon',
                    tooltip:"Show linked Vera notifications",
                    handler:function () {
                        if (eventDisplay == EVT_LINKED)
                            return;
                        eventDisplay = EVT_LINKED;
                        redrawChart();
                    }
                },
                {
                    icon:'images/flag.png',
                    id:'chartTb-eventsAll',
                    disabled:true,
                    allowDepress:false,
                    toggleGroup:'events',
                    cls:'x-btn-icon',
                    tooltip:'Show all Vera notifications',
                    handler:function () {
                        if (eventDisplay == EVT_ALL)
                            return;
                        eventDisplay = EVT_ALL;
                        redrawChart();
                    }
                },
                { xtype:'tbfill' },
                {
                    icon:'images/information-balloon.png',
                    id:'chartTb-info',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Display information on current graph',
                    handler:function () {
                        Ext.create('Ext.data.Store', {
                            storeId:'graphInfoStore',
                            fields:['name', 'value'],
                            data:graphInfoItems
                        });

                        var graphInfoGrid = Ext.create('Ext.grid.Panel', {
                            hideHeaders:true,
                            store:Ext.data.StoreManager.lookup('graphInfoStore'),
                            columns:[
                                { text:'Name', dataIndex:'name', width:250 },
                                { text:'Value', dataIndex:'value', flex:1 }
                            ],
                            disableSelection:true,
                            viewConfig:{
                                trackOver:false
                            }
                        });

                        var grWin = Ext.create('Ext.Window', {
                            title:'Graph Information',
                            width:350,
                            height:300,
                            modal:true,
                            resizable:false,
                            draggable:false,
                            itemId:'chartInfo',
                            id:'chartInfo',
                            items:[graphInfoGrid]
                        });

                        grWin.show();
                        grWin.alignTo(Ext.get("chartIsHere"), "tr-tr");
                    }
                }
            ]
        });

        var chartPanel = Ext.create('Ext.panel.Panel', {
            itemId:'chartPanel',
            id:'chartPanel',
            xtype:'panel',
            tbar:tbChart,
            flex:1,
            region:'center',
            maintainFlex:true,
            border:false,
            layout:'fit',
            items:[
                {
                    itemId:'chartIsHere',
                    id:'chartIsHere',
                    listeners:{
                        resize:function (comp, width, height, oldWidth, oldHeight, eOpts) {
                            if (chartObject != null) {
                                chartObject.setSize(width, height);
                            }
                        }
                    }
                }
            ]
        });

        var tbChannel = Ext.create('Ext.toolbar.Toolbar', {
            items:[
                {
                    icon:'images/cross.png',
                    id:'chartChanTb-clear',
                    text:'Reset Graph',
                    cls:'x-btn-icon',
                    disabled:false,
                    tooltip:'Clear Selected Channels and Reset Period',
                    handler:function () {
                        var Total = channelStore.getCount();
                        for (var Cnt = 0; Cnt < Total; Cnt++) {
                            var rec = channelStore.getAt(Cnt);
                            rec.set('selected', 0);
                            rec.set('yAxis', 0);
                        }
                        Ext.getCmp('chartChanTb-update').disable();
                        Ext.getCmp('chartChanTb-save').disable();
                        //Ext.getCmp('chartChanTb-clear').disable();
                        Ext.getCmp('channelGrid').selectedChans = 0;

                        chartMin = 0;
                        chartMax = 0;
                    }
                },
                {
                    icon:'images/disk.png',
                    id:'chartChanTb-save',
                    text:'Save Graph',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Save current chart configuration',
                    handler:function () {
                        var Total = channelStore.getCount();
                        var channels = new Array();
                        var chanCnt = 0;
                        for (var Cnt = 0; Cnt < Total; Cnt++) {
                            var rec = channelStore.getAt(Cnt);
                            if (rec.get('selected') == 1) {
                                channels[chanCnt] = {};
                                channels[chanCnt].axis = rec.get('yAxis');
                                channels[chanCnt++].value = rec.get('Id');
                            }
                        }
                        saveGraph(channels);
                    }
                },
                {
                    icon:'images/external.png',
                    id:'chartChanTb-update',
                    text:'Update Graph',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Update the graph with the currently selected channels.',
                    handler:function () {
                        var Total = channelStore.getCount();
                        var channels = new Array();
                        var chanCnt = 0;
                        for (var Cnt = 0; Cnt < Total; Cnt++) {
                            var rec = channelStore.getAt(Cnt);
                            if (rec.get('selected') == 1) {
                                channels[chanCnt] = {};
                                channels[chanCnt].axis = rec.get('yAxis');
                                channels[chanCnt++].value = rec.get('Id');
                            }
                        }
                        if (chartMin == 0 || chartMax == 0) {
                            var ts = Math.round((new Date()).getTime() / 1000);
                            chartMin = ts - (configGUI.graphDefaultPeriod * 86400);
                            chartMax = ts;
                        }
                        updateChart(channels, chartMin, chartMax, true);
                        toolbarEnable();
                    }
                }
            ]
        });

        var channelList = Ext.create('Ext.grid.Panel', {
            selectedChans:0,
            id:'channelGrid',
            store:channelStore,
            tbar:tbChannel,
//            selType:'cellmodel',
            icon:'images/chart_curve_add.png',
//            collapsible:true,
            disableSelection:true,
//        stateful:true,
//        stateId:'stateGrid',
            columns:[
                {
                    menuDisabled:true,
                    menuText:"Data Type",
                    sortable:true,
                    width:24,
                    hidden:false,
                    resizable:false,
//                    tooltip
                    dataIndex:'DataType',
                    renderer:function (value, metaData, record, row, col, store, gridView) {
                        if (dataTypeArray[value] != null)
                            return '<img src="images/' + dataTypeArray[value].icon + '">';
                        else
                            return '<img src="images/node.png">';
                    }
                },
                {
                    text:'Channel',
                    hideable:false,
                    flex:1,
                    width:75,
                    sortable:true,
                    dataIndex:'Name'
                },
                {
                    text:'Device',
                    width:75,
                    hidden:true,
                    sortable:true,
                    dataIndex:'devName'
                },
                {
                    text:'Room',
                    width:75,
                    hidden:true,
                    sortable:true,
                    dataIndex:'room'
                },
                {
                    text:'Last Updated',
                    width:125,
                    sortable:true,
                    renderer:function (value, metaData, record, row, col, store, gridView) {
                        var img;
                        if (record.get('Ghost') == true)
                            img = 'ghost';
                        else {
                            var timeWarning = (new Date()).getTime() - record.get('DrowsyWarning');
                            var timeError = (new Date()).getTime() - record.get('DrowsyError');
                            if (record.get('LastRec') < timeError)
                                img = 'exclamation-small-red';
                            else if (record.get('LastRec') < timeWarning)
                                img = 'exclamation-small';
                            else
                                img = 'tick-small';
                        }
                        return '<img src="images/' + img + '.png">' + Ext.util.Format.date(record.get('LastRec'), 'd M Y H:i');
                    },
                    dataIndex:'LastRec'
                },
                {
                    text:'Last Value',
                    width:75,
                    hidden:true,
                    sortable:true,
                    dataIndex:'LastValue'
                }/*,
                 {
                 menuDisabled:true,
                 sortable:false,
                 hideable:false,
                 width:30,
                 xtype:'actioncolumn',
                 items:[
                 {
                 getClass: function(v, meta, rec) {          // Or return a class from a function
                 if (rec.get('selected') == 0) {
                 this.items[0].tooltip = '';
                 return '';
                 }

                 var img;
                 if (rec.get('yAxis') == 0) {
                 this.items[0].tooltip = 'Change axis to secondary Y-axis';
                 return 'chartAxis1';
                 }
                 else {
                 this.items[0].tooltip = 'Change axis to primary Y-axis';
                 return 'chartAxis2';
                 }
                 },
                 handler:function (grid, rowIndex, colIndex) {
                 var rec = channelStore.getAt(rowIndex);
                 if (rec.get('selected') == 0) {
                 rec.set('selected', 1);
                 rec.set('yAxis', 0);
                 return;
                 }
                 if (rec.get('yAxis') == 0)
                 rec.set('yAxis', 1);
                 else
                 rec.set('yAxis', 0);
                 },
                 //                         tooltip:'Sell stock',
                 }
                 ]
                 }*/
            ],
            layout:'fit',
            title:'Graph Channels',
            viewConfig:{
                stripeRows:false,
                enableTextSelection:false,
                markDirty:false,
                getRowClass:function (record) {
                    return record.get('selected') ? 'x-grid-row-selected-override' : '';
                }
            },
            listeners:{
                itemclick:function (grid, record, item, index, element, eOpts) {
                    if (item != null) {
                        var c = record.get('selected');
                        var el = Ext.get(item);
                        if (record.get('selected') == 0) {
                            if (this.selectedChans < 8) {
                                this.selectedChans++;
                                record.set('selected', 1);
                                record.set('yAxis', -1);
                                var Max = -1;
                                var Total = channelStore.getCount();
                                var chanCnt = 0;
                                for (var Cnt = 0; Cnt < Total; Cnt++) {
                                    var rec = channelStore.getAt(Cnt);
                                    if ((rec.get('selected') == 1) & (rec != record)) {
                                        if (rec.get('yAxis') > Max)
                                            Max = rec.get('yAxis');
                                        if (rec.get('DataType') == record.get('DataType')) {
                                            record.set('yAxis', rec.get('yAxis'))
                                            break;
                                        }
                                    }
                                }
                                if (record.get('yAxis') == -1) {
                                    if (Max >= 1)
                                        record.set('yAxis', 1);
                                    else
                                        record.set('yAxis', Max + 1);
                                }
                                Ext.getCmp('chartChanTb-update').enable();
                                Ext.getCmp('chartChanTb-save').enable();
                                //Ext.getCmp('chartChanTb-clear').enable();
                                el.frame();
                            }
                        }
                        else {
                            this.selectedChans--;
                            record.set('selected', 0);
                            if (this.selectedChans == 0) {
                                Ext.getCmp('chartChanTb-update').disable();
                                Ext.getCmp('chartChanTb-save').disable();
                                //Ext.getCmp('chartChanTb-clear').disable();
                            }
                            el.frame();
                        }
                    }
                }
            },
            clearSelection:function () {
                var storeSize = channelStore.data.length;
                for (var rowIndex = 0; rowIndex < storeSize; rowIndex++) {
                    var rec = channelStore.getAt(rowIndex);
                    if (rec.get('selected') == 1) {
                        rec.set('yAxis', 0);
                        rec.set('selected', 0);
                    }
                }

                this.selectedChans = 0;
                Ext.getCmp('chartChanTb-update').disable();
                Ext.getCmp('chartChanTb-save').disable();
                //Ext.getCmp('chartChanTb-clear').disable();
            }
        });

        // Set the defaults
        chartOptions.plotOptions.series.marker.enabled = configGUI.graphOptionMarkers;
        chartOptions.chart.shadow = configGUI.graphOptionShadows;
        chartOptions.legend.enabled = configGUI.graphOptionLegend;
        chartOptions.tooltip.crosshairs = configGUI.graphOptionCrosshairs;
        chartOptions.tooltip.enabled = configGUI.graphOptionTooltip;
        chartOptions.plotOptions.spline.lineWidth = configGUI.graphOptionWidth;
        Highcharts.setOptions({global:{useUTC:!configGUI.graphOptionTime}});

        var graphOptions = Ext.create('Ext.grid.property.Grid', {
            title:'Graph Options',
            icon:'images/gear.png',
            hideHeaders:true,
            sortableColumns:false,
            nameColumnWidth:150,
            source:{
                "Display data markers":configGUI.graphOptionMarkers,
                "Display shadows":configGUI.graphOptionShadows,
                "Display legend":configGUI.graphOptionLegend,
                "Display crosshairs":configGUI.graphOptionCrosshairs,
                "Display tooltip":configGUI.graphOptionTooltip,
                "Display local times":configGUI.graphOptionTime,
                "Line width":configGUI.graphOptionWidth
            },
            listeners:{
                propertychange:function (source, recordId, value, oldValue, eOpts) {
                    switch (recordId) {
                        case "Display data markers":
                            if (value == true) {
                                chartOptions.plotOptions.series.marker.enabled = true;
                            }
                            else {
                                chartOptions.plotOptions.series.marker.enabled = false;
                            }
                            saveGraphOption("graphOptionMarker", chartOptions.plotOptions.series.marker.enabled);
                            redrawChart();
                            break;
                        case "Display shadows":
                            if (value == true) {
                                chartOptions.chart.shadow = true;
                            }
                            else {
                                chartOptions.chart.shadow = false;
                            }
                            saveGraphOption("graphOptionShadows", chartOptions.chart.shadow);
                            redrawChart();
                            break;
                        case "Display legend":
                            if (value == true) {
                                chartOptions.legend.enabled = true;
                            }
                            else {
                                chartOptions.legend.enabled = false;
                            }
                            saveGraphOption("graphOptionLegend", chartOptions.legend.enabled);
                            redrawChart();
                            break;
                        case "Display crosshairs":
                            if (value == true) {
                                chartOptions.tooltip.crosshairs = true;
                            }
                            else {
                                chartOptions.tooltip.crosshairs = false;
                            }
                            saveGraphOption("graphOptionCrosshairs", chartOptions.tooltip.crosshairs);
                            redrawChart();
                            break;
                        case "Display tooltip":
                            if (value == true) {
                                chartOptions.tooltip.enabled = true;
                            }
                            else {
                                chartOptions.tooltip.enabled = false;
                            }
                            saveGraphOption("graphOptionTooltip", chartOptions.tooltip.enabled);
                            redrawChart();
                            break;
                        case "Display local times":
                            Highcharts.setOptions({global:{useUTC:!value}});
                            saveGraphOption("graphOptionTime", !value);
                            redrawChart();
                            break;
                        case "Line width":
                            chartOptions.plotOptions.spline.lineWidth = value;
                            saveGraphOption("graphOptionWidth", value);
                            redrawChart();
                            break;
                    }
                }
            }
        });

        var graphList = Ext.create('Ext.grid.Panel', {
            id:'graphGrid',
            store:graphStore,
//            selType:'cellmodel',
            icon:'images/disks.png',
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
                            tooltip:'Delete saved graph',
                            handler:function (grid, rowIndex, colIndex) {
                                var rec = graphStore.getAt(rowIndex);

                                var parms = {};
                                parms.id = 'lr_dmCtrl';
                                parms.control = 'delGraph';
                                parms.name = rec.get("Name");
                                Ext.Ajax.request({
                                    url:veraServer + '/data_request',
                                    params:parms,
                                    method:'GET',
                                    success:function (response, opts) {
                                        configGraph = Ext.decode(response.responseText);
                                        graphStore.loadData(configGraph);
                                    }
                                });
                            }
                        }
                    ]}
            ],
            layout:'fit',
            title:'Saved Graphs',
            viewConfig:{
                stripeRows:false,
                enableTextSelection:false,
                markDirty:false
            },
            listeners:{
                itemclick:function (grid, record, item, index, element, eOpts) {
                    if (item != null) {
                        var Name = record.get('Name');

                        var Total = configGraph.length;
                        for (var Cnt = 0; Cnt < Total; Cnt++) {
                            if (configGraph[Cnt].Name == Name) {
                                // Found the reference, load the channels
                                var channels = new Array();
                                var chTotal = configGraph[Cnt].Channels.length;
                                for (var chCnt = 0; chCnt < chTotal; chCnt++) {
                                    channels[chCnt] = {};
                                    channels[chCnt].axis = configGraph[Cnt].Channels[chCnt].yAxis;

                                    // Convert the Device:Service:Variable to the id
                                    var cfTotal = configChan.length;
                                    for (var cfCnt = 0; cfCnt < cfTotal; cfCnt++) {
                                        if (configChan[cfCnt].Device == configGraph[Cnt].Channels[chCnt].Device &
                                            configChan[cfCnt].Service == configGraph[Cnt].Channels[chCnt].Service &
                                            configChan[cfCnt].Variable == configGraph[Cnt].Channels[chCnt].Variable)
                                            channels[chCnt].value = configChan[cfCnt].Id;
                                    }
                                }

                                //                               if(chartMin == 0 || chartMax == 0) {
                                var ts = Math.round((new Date()).getTime() / 1000);
                                chartMin = ts - (configGUI.graphDefaultPeriod * 86400);
                                chartMax = ts;
                                //                               }

                                updateChart(channels, chartMin, chartMax, true);
                                toolbarEnable();
                            }
                        }
                    }
                }
            },
            clearSelection:function () {
                var storeSize = channelStore.data.length;
                for (var rowIndex = 0; rowIndex < storeSize; rowIndex++) {
                    var rec = channelStore.getAt(rowIndex);
                    if (rec.get('selected') == 1) {
                        rec.set('yAxis', 0);
                        rec.set('selected', 0);
                    }
                }

                this.selectedChans = 0;
                Ext.getCmp('chartChanTb-update').disable();
                Ext.getCmp('chartChanTb-save').disable();
                //Ext.getCmp('chartChanTb-clear').disable();
            }
        });

        var accordion = Ext.create('Ext.Panel', {
            split:true,
            border:false,
            region:'west',
            width:450,
            layout:{
                type:'accordion',
                hideCollapseTool:true
            },
            items:[channelList, graphList, graphOptions]
        });
        this.items = [accordion, chartPanel];

        this.callParent();
    }
})
;
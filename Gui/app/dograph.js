/**
 * dataMine Graphing package for Vera
 * (c) Chris Jackson
 */
var chartChannels = null;


var chanList;
//var chartOptions;
var chartMin = 0;
var chartMax = 0;
var chartObject = null;
//var seriesData = null;
var RealTimeUpdate = false;

var EVT_NONE = 0;
var EVT_LINKED = 1;
var EVT_ALL = 2;
var eventDisplay = EVT_NONE;
var eventAxis = -1;

var nightsDisplay = false;

var graphInfoItems;

chartOptions = {
    chart:{
        renderTo:'chartIsHere',
        animation:false,
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
                    Highcharts.dateFormat('%H:%M:%S %a %d %b %Y', this.x) + ': ' +
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
                    Highcharts.dateFormat('%H:%M:%S %a %d %b %Y', this.x) + ': ' +
                    info;
//                    Highcharts.numberFormat(this.y, 2);
            }
        }
    }
};

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
        for (var chCnt = startLen - 1; chCnt >= 0; chCnt--) {
            if (val > outCnt) {
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

// Generate the day/night plotbands
function addNights(start, stop) {
    chartOptions.xAxis.plotBands = [];

    if(veraDayNight == null)
        return;

    var newBand = null;

    for (var listCnt in veraDayNight.Sunrise) {
        if(veraDayNight.Sunrise[listCnt].time == null)
            continue;
        if(veraDayNight.Sunrise[listCnt].time < start)
            continue;
        if(veraDayNight.Sunrise[listCnt].time > stop)
            break;

        if(veraDayNight.Sunrise[listCnt].night == true) {
            newBand = {};
            newBand.from = veraDayNight.Sunrise[listCnt].time * 1000;
        }
        else {
            // If we've started in darkness, then start the band
            if(newBand == null) {
                newBand = {};
                newBand.from = start * 1000;
            }
            newBand.to = veraDayNight.Sunrise[listCnt].time * 1000;
            newBand.color = "#eeeeee";
            chartOptions.xAxis.plotBands.push(newBand);
            newBand = null;
        }
    }

    // If we've ended in darkness, then close the band
    if(newBand != null){
        newBand.to = stop * 1000;
        newBand.color = "#eeeeee";
        chartOptions.xAxis.plotBands.push(newBand);
    }
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

            if (json.series) {

                // *****************************************
                /*
                 // Count the number of status channels
                 for (var s = 0; s < json.series.length; s++) {
                 if (flotrChan[s].axis == 0) {
                 tot++;
                 if (json.series[s].min == 0 & json.series[s].max == 1)
                 cnt++;
                 }
                 }

                 if (tot > 0 & tot == cnt) {
                 // All channels are status channels
                 binaryAxis = 1;
                 }
                 else {
                 cnt = 0;
                 tot = 0;
                 for (var s = 0; s < json.series.length; s++) {
                 if (flotrChan[s].axis == 1) {
                 tot++;
                 if (json.series[s].min == 0 & json.series[s].max == 1)
                 cnt++;
                 }
                 }
                 if (tot > 0 & tot == cnt)
                 binaryAxis = 2;
                 }

                 if (binaryAxis == 0) {
                 flotrOptions.yaxis.showLabels = true;
                 flotrOptions.y2axis.showLabels = true;
                 }
                 else if (binaryAxis == 1) {
                 flotrOptions.yaxis.showLabels = false;
                 flotrOptions.y2axis.showLabels = true;
                 }
                 else if (binaryAxis == 2) {
                 flotrOptions.yaxis.showLabels = true;
                 flotrOptions.y2axis.showLabels = false;
                 }
                 */

                //*****************************************


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
//                    options.series[s].color = '#FF0000';
                    //options.series[s].marker = true;

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

                    options.series[s].animation = configGUI.graphOptionAnimation;
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

                if(nightsDisplay)
                    addNights(parms.start, parms.stop);
                else
                    options.xAxis.plotBands = null;

                chartObject = new Highcharts.Chart(options);
            }
            if (json.min) {
                chartMin = json.min;
                chartMax = json.max;

                if ((chartMax - chartMin) < 300)
                    Ext.getCmp('chartTb-zoomIn').disable();
                else
                    Ext.getCmp('chartTb-zoomIn').enable();
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

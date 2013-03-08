/**
 * dataMine Graphing package for Vera
 * (c) Chris Jackson
 */

var energyChartUsageDonut = null;
var energyChartUsageHistory = null;
var energyChartUsageCurrent = null;

var energyInitialised = false;


function updateEnergySummary() {
    if (energyChartUsageCurrent != null) {
        //console.debug("energyChartUsageCurrent(" + powerWholeHouseId + ") =" + powerWholeHouseValue);
        energyChartUsageCurrent.series[0].points[0].update(powerWholeHouseValue);
    }

    if (energyChartUsageDonut == null)
        return;

//    var catNum;
    // Update all the devices in a category
    for (var listCnt in energyCategoryMatrix) {
        if (listCnt == 1 || listCnt > 20)
            continue;

        var varLen = energyCategoryMatrix[listCnt].Devices.length;
        for (var varCnt in energyCategoryMatrix[listCnt].Devices) {
//            energyCategoryMatrix[listCnt].Value += energyCategoryMatrix[listCnt].Devices[varCnt].Value;
//            catNum = energyCategoryMatrix[listCnt].Devices[varCnt].
            energyChartUsageDonut.series[1].points[energyCategoryMatrix[listCnt].Devices[varCnt].Ref].update(energyCategoryMatrix[listCnt].Devices[varCnt].Value);
        }
        energyChartUsageDonut.series[0].points[energyCategoryMatrix[listCnt].Ref].update(energyCategoryMatrix[listCnt].Value);
    }

//        energyChartUsageDonut.series[0].points[energyCategoryMatrix[0].Ref].update(0);
//        energyChartUsageDonut.series[1].points[energyCategoryMatrix[0].Devices[0].Ref].update(0);
}

function createEnergyCategoryGraph() {
    var Total = 0;
    var categoryData = [];
    var deviceData = [];

    // Now update the graph
    var colors = Highcharts.getOptions().colors;

    // Build the data arrays
    var colCnt = 0;
    var seqCnt = 0;
    for (var i in energyCategoryMatrix) {
//        if (energyCategoryMatrix[i].Value == 0)
//            continue;
        if (i == 1 || i > 20)
            continue;

        energyCategoryMatrix[i].Ref = categoryData.length;
        // add category data
        categoryData.push({
            name:energyCategoryMatrix[i].Name,
            y:energyCategoryMatrix[i].Value,
            color:colors[colCnt]
        });

        // add device data
//        var xx = energyCategoryMatrix[i].Devices.length;
        for (var j in energyCategoryMatrix[i].Devices) {
//            if (energyCategoryMatrix[i].Devices[j].Value == 0)
//                continue;
//            var brightness = 0.2 - (j / data[i].drilldown.data.length) / 5;
            energyCategoryMatrix[i].Devices[j].Ref = deviceData.length;
            deviceData.push({
                name:energyCategoryMatrix[i].Devices[j].Name,
                y:energyCategoryMatrix[i].Devices[j].Value,
//                color:colors[colCnt]

                color:Highcharts.Color(colors[colCnt]).brighten(0.2).get()
            });
        }
        colCnt++;
    }

    // Create the chart
    energyChartUsageDonut = new Highcharts.Chart({
        chart:{
            renderTo:'dashEnergyDonut',
            ignoreHiddenSeries:true,
            type:'pie'
        },
        title:{
            text:''
        },
        yAxis:{
            title:{
                text:'Watts Consumed'
            }
        },
        credits:{
            enabled:false
        },
        plotOptions:{
            pie:{
                shadow:false,
                center:['50%', '50%']
            }
        },
        tooltip:{
            formatter:function () {
                return '<b>' + this.point.name + ':</b>' + this.y + 'W';
            }
        },
        series:[
            {   // Inner
                name:'Categories',
                data:categoryData,
                size:'50%',
                dataLabels:{
                    formatter:function () {
                        return this.y > 5 ? this.point.name : null;
                    },
                    color:'white',
                    distance:-30
                }//,
//                point:{
//                    events:{
//                        click:function (e) {
                            //this.slice();
//                            console.log(e);
//                            console.log("name: " + e.point.options.name);
//                            console.log("value: " + e.point.options.y);
//                            e.preventDefault();
//                        }
//                    }
//                }
            },
            {   // Outer
                name:'Devices',
                data:deviceData,
                size:'70%',
                innerSize:'50%',
                dataLabels:{
                    formatter:function () {
                        // display only if larger than 0
                        //console.debug(this.point.name + ':' + this.y);
                        if (this.y > 0) {
                            //console.debug('<b>' + this.point.name + ':</b> ' + this.y + 'W');
                            return '<b>' + this.point.name + ':</b> ' + this.y + 'W';
                        }
                        else {
                            //console.debug("null");
                            return null;
                        }

//                        return this.y > 0 ? '<b>' + this.point.name + ':</b> ' + this.y + 'W' : null;
                    }
                },
                point:{
                    events:{
                        click:function (e) {
                            //this.slice();
//                            console.log(e);
                            console.log("name: " + e.point.options.name);
                            console.log("value: " + e.point.options.y);
                            e.preventDefault();
                        }
                    }
                }
            }
        ]
    });

    var height = Ext.getCmp('dashEnergyDonut').getHeight();
    var width = Ext.getCmp('dashEnergyDonut').getWidth();
    energyChartUsageDonut.setSize(width, height);
}

function createEnergyHistory(Device)    //Type, Category, Device) {
{
    if (energyInitialised == false)
        return;
    /*
     if(Type == null)
     Type = 0;

     if(Category == null)
     Category = 0;

     if(Device == null)
     Device = 0;

     switch(Type) {
     case 0:
     if(energyCategoryMatrix[Category].historyDay == null)
     return;
     break;
     case 1:
     if(energyCategoryMatrix[Category].historyWeek == null)
     return;
     break;
     case 2:
     if(energyCategoryMatrix[Category].historyMonth == null)
     return;
     break;
     case 3:
     if(energyCategoryMatrix[Category].historyYear == null)
     return;
     break;
     }*/

    var options = {
        chart:{
            renderTo:'dashEnergyHistory',
            type:'spline'//'area'
        },
        credits:{
            enabled:false
        },
        title:{
            text:null
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
            }
        ],
        legend:{
            enabled:false
        },
        tooltip:{
            enabled:true,
            crosshairs:true,
            shared:false,
            formatter:function () {
                return '<b>' + this.series.name + '</b><br/>' +
                    Highcharts.dateFormat('%H:%M:%S %d/%m/%Y', this.x) + ' ' +
                    Highcharts.numberFormat(this.y, 2);
            }
        },
        plotOptions:{
            area:{
                stacking:'normal',
//                lineColor:'#666666',
//                lineWidth:1,
                marker:{
                    enabled:false,
                    states:{
                        hover:{
                            enabled:true,
                            symbol:'circle',
                            radius:5,
                            lineWidth:1
                        }
                    }
                }
                //{
                //   lineWidth:1,
                // lineColor:'#666666'
                //}
            }
        }
    };

    Dev = getDMDevice(Device);
    if (Dev.historyDay == null)
        return;

    options.series = [];
    options.series[0] = [];
    options.series[0].data = Dev.historyDay;
    options.series[0].name = Dev.Name;

    energyChartUsageHistory = new Highcharts.Chart(options);
}

function createEnergyUseCurrent() {
    // Find the (first) whole house energy variable
    var numDevices = configChan.length;
    for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
        if (configChan[iDevice].EnergyCat != null) {
            if (configChan[iDevice].EnergyCat == 1) {
                powerWholeHouseId = configChan[iDevice].Id;
                powerWholeHouseValue = parseFloat(configChan[iDevice].LastVal);
                break;
            }
        }
    }

    energyChartUsageCurrent = new Highcharts.Chart({
        chart:{
            renderTo:'dashEnergyCurrent',
            type:'gauge',
            plotBackgroundColor:null,
            plotBackgroundImage:null,
            plotBorderWidth:0,
            plotShadow:false
        },
        title:{
            text:''
        },
        credits:{
            enabled:false
        },
        pane:{
            startAngle:-120,
            endAngle:120,
            background:[
                {
                    backgroundColor:{
                        linearGradient:{ x1:0, y1:0, x2:0, y2:1 },
                        stops:[
                            [0, '#FFF'],
                            [1, '#333']
                        ]
                    },
                    borderWidth:0,
                    outerRadius:'109%'
                },
                {
                    backgroundColor:{
                        linearGradient:{ x1:0, y1:0, x2:0, y2:1 },
                        stops:[
                            [0, '#333'],
                            [1, '#FFF']
                        ]
                    },
                    borderWidth:1,
                    outerRadius:'107%'
                },
                {
                    // default background
                },
                {
                    backgroundColor:'#DDD',
                    borderWidth:0,
                    outerRadius:'105%',
                    innerRadius:'103%'
                }
            ]
        },

        // the value axis
        yAxis:{
            min:configGUI.energyWholeHouseMin,
            max:configGUI.energyWholeHouseMax,

            minorTickInterval:'auto',
            minorTickWidth:1,
            minorTickLength:10,
            minorTickPosition:'inside',
            minorTickColor:'#666',

            tickPixelInterval:50,
            tickWidth:2,
            tickPosition:'inside',
            tickLength:10,
            tickColor:'#666',
            labels:{
                step:2,
                rotation:'auto'
            },
            title:{
                text:'Watts'
            },
            plotBands:[
                {
                    from:configGUI.energyWholeHouseMin,
                    to:configGUI.energyWholeHouseMax / 6,
                    color:'#00E600' // green
                },
                {
                    from:configGUI.energyWholeHouseMax / 6,
                    to:configGUI.energyWholeHouseMax / 6 * 2,
                    color:'#CCFF99' // light green
                },
                {
                    from:configGUI.energyWholeHouseMax / 6 * 2,
                    to:configGUI.energyWholeHouseMax / 6 * 3,
                    color:'#FFFF66' // yellow
                },
                {
                    from:configGUI.energyWholeHouseMax / 6 * 3,
                    to:configGUI.energyWholeHouseMax / 6 * 4,
                    color:'#FFA319' // orange
                },
                {
                    from:configGUI.energyWholeHouseMax / 6 * 4,
                    to:configGUI.energyWholeHouseMax,
                    color:'#DF5353' // red
                }
            ]
        },
        series:[
            {
                name:'Watts',
                data:[powerWholeHouseValue]
            }
        ]
    });
}


Ext.define('DataMine.dashEnergyOverview', {
    extend:'Ext.panel.Panel',
    layout:'fit',
    xtype:'dmDashEnergyOverview',
    id:'dashEnergyOverview',
    border:false,
    initComponent:function () {
        var categoryPanel = Ext.create('Ext.panel.Panel', {
            itemId:'dashEnergyDonutPanel',
            id:'dashEnergyDonutPanel',
            xtype:'panel',
//            tbar:tbChart,
//            flex:1,
//            region:'center',
            maintainFlex:true,
            border:false,
            layout:{
                type:'hbox',
                align:'stretch'
            },
            listeners:{
                afterlayout:function () {
                    if (energyInitialised == true)
                        return;
                    energyInitialised = true;

                    createEnergyUseCurrent();
                    createEnergyCategoryGraph();

                    var numDevices = configChan.length;
                    for (var iDevice = 0; iDevice < numDevices; ++iDevice) {
                        if (configChan[iDevice].EnergyCat == 1) {
                            createEnergyHistory(configChan[iDevice].Id);
                            break;
                        }
                    }

                }
            },
            items:[
                {
                    id:'dashEnergyDonut',
                    border:false,
                    flex:2,
                    listeners:{
                        resize:function (comp, width, height, oldWidth, oldHeight, eOpts) {
                            if (energyChartUsageDonut != null) {
                                energyChartUsageDonut.setSize(width, height);
                            }
                        }
                    }
                },
                {
                    flex:1,
                    layout:{
                        type:'vbox',
                        align:'stretch'
                    },
                    border:false,
                    maintainFlex:true,
                    xtype:'panel',
                    items:[
                        {
                            id:'dashEnergyCurrent',
                            border:false,
                            flex:1,
                            listeners:{
                                resize:function (comp, width, height, oldWidth, oldHeight, eOpts) {
                                    if (energyChartUsageCurrent != null) {
                                        energyChartUsageCurrent.setSize(width, height);
                                    }
                                }
                            }
                        },
                        {
                            id:'dashEnergyHistory',
//                            title:'Item 2',
                            border:false,
                            flex:1,
                            listeners:{
                                resize:function (comp, width, height, oldWidth, oldHeight, eOpts) {
                                    if (energyChartUsageHistory != null) {
                                        energyChartUsageHistory.setSize(width, height);
                                    }
                                }
                            }
                        }
                    ]

                }
            ]
        });
        /*
         var currentPanel = Ext.create('Ext.panel.Panel', {
         itemId:'dashEnergyCurrentPanel',
         id:'dashEnergyCurrentPanel',
         xtype:'panel',
         //            tbar:tbChart,
         flex:1,
         //      region:'center',
         maintainFlex:true,
         border:false,
         layout:'fit',
         listeners:{
         afterlayout:function () {
         if(energyInitialised == true)
         return;
         energyInitialised = true;

         createEnergyCategoryMatrix();
         //updateEnergyDonut();
         graphEnergyCategoryMatrix();
         }
         },
         items:[
         {
         id:'dashEnergyCurrent',
         listeners:{
         resize:function (comp, width, height, oldWidth, oldHeight, eOpts) {
         if (energyChartUsageCurrent != null) {
         energyChartUsageCurrent.setSize(width, height);
         }
         }
         }
         }
         ]
         });*/


        this.items = [categoryPanel];//, currentPanel];

        this.callParent();
    }
})
;

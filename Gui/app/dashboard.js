/**
 * dataMine Graphing package for Vera
 * (c) Chris Jackson
 */



Ext.define('DataMine.dashboard', {
    extend:'Ext.panel.Panel',
    xtype:'dmDash',
    id:'dashMain',
    layout:'fit',
    items:[
        {
            xtype:'grouptabpanel',
            activeGroup:0,
            items:[
                {
                    mainItem:0,
                    items:[
                        {
                            title:'Energy Overview',
//                            tabTip:'Dashboard tabtip',
                            border:false,
                            xtype: 'dmDashEnergyOverview'
                        }
                    ]
                },
                {
                    mainItem:0,
                    items:[
                        {
                            title:'Notifications',
//                            tabTip:'Dashboard tabtip',
                            border:false,
                            xtype: 'dmDashNotifications'
                        }
                    ]
                }
            ]
        }
    ],

    initComponent:function () {


//    this.items = [accordion, chartPanel];

        this.callParent();

    }
})
;

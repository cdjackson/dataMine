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
                            tabTip:'Dashboard tabtip',
                            border:false,
                            xtype: 'dmDashEnergyOverview'
                        }
                        /*,
                        {
                            title:'Dashboard',
                            tabTip:'Dashboard tabtip',
                            border:false,
                            items:[

                            ]
                        }*/
                    ]
                }
                /*,
                {
                    expanded:true,
                    icon:'images/save.png',
                    items:[
                        {
                            title:'Configuration',
                            tabTip:'Configuration tabtip',
                            style:'padding: 10px;'
                        }
                    ]
                }*/
            ]
        }
    ],

    initComponent:function () {


//    this.items = [accordion, chartPanel];

        this.callParent();

    }
})
;

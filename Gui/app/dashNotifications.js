
Ext.define('DataMine.dashNotifications', {
    extend:'Ext.panel.Panel',
    layout:'fit',
    xtype:'dmDashNotifications',
    id:'dashNotifications',
    border:false,
    initComponent:function () {
        var notificationList = Ext.create('Ext.grid.Panel', {
            id:'notificationGrid',
            store:notificationStore,
//            icon:'images/disks.png',
            hideHeaders:false,
            disableSelection:true,
            columns:[
                /*{
                    menuDisabled:true,
//                    menuText:"",
//                    sortable:true,
                    width:24,
                    hidden:false,
                    resizable:false,
//                    tooltip
                    dataIndex:'Icon',
                    renderer:function (value, metaData, record, row, col, store, gridView) {
                        if (dataTypeArray[value] != null)
                            return '<img src="images/' + dataTypeArray[value].icon + '">';
                        else
                            return '<img src="images/node.png">';
                    }
                },*/
                {
                    text:'Time',
                    hideable:false,
                    flex:2,
//                    width:75,
                    sortable:true,
                    dataIndex:'timestamp',
                    renderer:function (value, metaData, record, row, col, store, gridView) {
                        var d = new Date(parseInt(record.get("timestamp"))*1000);
                        return Ext.util.Format.date(d, 'd M Y H:i')
                    }
                },
                {
                    text:'Device',
                    hideable:false,
                    flex:4,
//                    width:75,
                    sortable:true,
                    dataIndex:'source',
                    renderer:function (value, metaData, record, row, col, store, gridView) {
                        var dev = getVeraDevice(record.get("device"));
                        if (dev != null) {
                         var img = '<img src="' + getVeraDeviceIcon(record.get("device")) + '">'+dev.name;
                        return img;
                        }
                        else
                           return '';
                    }
                },
                {
                    text:'Description',
                    hideable:false,
                    flex:4,
//                    width:75,
                    sortable:true,
                    dataIndex:'description'
                },
                {
                    text:'Value',
                    hideable:false,
                    flex:4,
//                    width:75,
                    sortable:true,
                    dataIndex:'value'
                }
            ],
            layout:'fit',
//            title:'Notifications',
            viewConfig:{
                stripeRows:false,
                enableTextSelection:false,
                markDirty:false
            }
        });


        this.items = [notificationList];

        this.callParent();
    }
})
;
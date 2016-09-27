/**
 * JavaScript for Files List
 */
(function (mw, $) {

    function loadApiFilesData() {

        var api = new mw.Api();

        api.get({
            formatversion: 2,
            action: 'query',
            ailimit: 500,
            list: 'allimages',
            utf8: true,
            aisort: 'timestamp',
            aidir: 'descending',
            aiprop: 'url|comment|timestamp|user'
        }).done(function (res) {
            loadFilesLists(api, res.query.allimages);
        }).fail(function (code, result) {
            if (code === "http") {
                mw.log("HTTP error: " + result.textStatus); // result.xhr contains the jqXHR object
            } else if (code === "ok-but-empty") {
                mw.log("Got an empty response from the server");
            } else {
                mw.log("API error: " + code);
            }
        });
    };

    /*function initFilesListTable() {
        var filesListTable = mw.template.get("ext.FilesList", "data-table.mustache");
        var tableData = {
            "table-id": "dataTableId"
        };
        var tableHtmlScript = filesListTable.render(tableData);
        $("#filesListTable").append(tableHtmlScript);
    };*/

    function showModal() {

        // instanciate new modal
        var modal = new tingle.modal({
            footer: false,
            cssClass: ['materialDialog'],
            onClose: function () {
                modal.destroy();
            }
        });

        // set content
        modal.setContent('<table id="idt-table" class="row-border hover responsive" cellspacing="0" width="100%"></table>');

        // open modal
        modal.open();

    };

    function setSortDataTableWithMoment( format, locale ) {
        var types = $.fn.dataTable.ext.type;

        // Add type detection
        types.detect.unshift( function ( d ) {
            // Strip HTML tags if possible
            if ( d && d.replace ) {
                d = d.replace(/<.*?>/g, '');
            }

            // Null and empty values are acceptable
            if ( d === '' || d === null ) {
                return 'moment-'+format;
            }

            return moment( d, format, locale, true ).isValid() ?
                'moment-'+format :
            null;
        } );

        // Add sorting method - use an integer for the sorting
        types.order[ 'moment-'+format+'-pre' ] = function ( d ) {
            if ( d && d.replace ) {
                d = d.replace(/<.*?>/g, '');
            }
            return d === '' || d === null ?
                -Infinity :
            parseInt( moment( d, format, locale, true ).format( 'x' ), 10 );
        };
    };

    function apiDeleteFile(api, fileTitle, fileToken) {

        console.log(fileTitle, fileToken);

        api.get({
            formatversion: 2,
            action: 'delete',
            title: fileTitle,
            token: fileToken          
        }).done(function (res) {

        }).fail(function (code, result) {
            if (code === "http") {
                mw.log("HTTP error: " + result.textStatus); // result.xhr contains the jqXHR object
            } else if (code === "ok-but-empty") {
                mw.log("Got an empty response from the server");
            } else {
                mw.log("API error: " + code);
            }
        });
    };

    function apiDeleteFileWithToken(api, fileTitle) {
        /*var fileToken = "";        
        api.get({
            formatversion: 2,
            action: 'query',
            meta: 'tokens'           
        }).done(function (res) {
            var tokens = res.query.tokens;
            fileToken = tokens[0];
            apiDeleteFile(api, fileTitle, fileToken);
        }).fail(function (code, result) {
            if (code === "http") {
                mw.log("HTTP error: " + result.textStatus); // result.xhr contains the jqXHR object
            } else if (code === "ok-but-empty") {
                mw.log("Got an empty response from the server");
            } else {
                mw.log("API error: " + code);
            }
        });*/

        var params = "";

        api.postWithEditToken($.extend({
            action: 'delete',
            title: fileTitle,            
            formatversion: '2',
            // Protect against errors and conflicts
            assert: mw.user.isAnon() ? undefined : 'user'
        }, params)).done(function () {
            swal(
                'נמחק!',
                '[' + fileTitle +']' + ' נמחק בהצלחה! '
            );
        }).fail(function (code, result) {
            if (code === "http") {
                mw.log("HTTP error: " + result.textStatus); // result.xhr contains the jqXHR object
            } else if (code === "ok-but-empty") {
                mw.log("Got an empty response from the server");
            } else {
                mw.log("API error: " + code);
            }
        });

    };

    function loadFilesLists(api, filesData) {

        var tableData = [];
        /* 
           var path = mw.config.get( 'wgScriptPath' );
           console.log(path);
        */
        filesData.map(function (item) {
            var regex = new RegExp('_', 'g');
            var itemName = item.name.trim();
            var fileName = itemName.replace(regex, ' ');
            var dateTime = moment(item.timestamp);
            var fileTitle = item.title;

            tableData.push([
                '<img src="'+item.url+'" alt="'+fileName+'" class="imgList">',
                '<a href="'+item.descriptionurl+'">'+fileName+'</a>',
                item.comment,
                '<a href="/w/index.php?title=user:'+item.user+'" title="'+item.user+'">'+item.user+'</a>',
                dateTime.format("DD/MM/YY HH:mm"),
                '<a href="#" class="deleteFileBtn" title="'+ fileTitle +'">'+
                '<i class="fa fa-trash"></i>'+
                '</a>'
                //'<a href="/w/index.php?title='+item.title+'&action=delete" title="'+item.title+'">'+
                //'<i class="fa fa-trash" aria-hidden="true"></i></a>'
            ]);
        });

        /*var dialogActionButtons = [
            {
                id: "model-close-button",
                action: 'close',
                framed: false,
                icon: 'close',
                iconTitle: mw.msg("modal-close-button"),
                flags: 'safe'
            }];

        var fieldset = new OO.ui.FieldsetLayout({
            items: [
                new OO.ui.LabelWidget({
                    label: $('<div id="filesListTable"></div>')
                })
            ]
        });

        var dialogSize = 'full';

        //title, actions, content, mainAction, mainActionFunc, height
        MaterialDialog(
            mw.msg("files-toggle-popup"),
            dialogActionButtons,
            fieldset,
            '',
            null,
            0,
            dialogSize
        );

        initFilesListTable();
        */

        showModal();

        setSortDataTableWithMoment( "DD/MM/YY HH:mm" );

        var dataTable = $('#idt-table').DataTable( {
            data: tableData,            
            dom: 'frti',
            language: {
                processing:   "מעבד...",
                lengthMenu:   "הצג _MENU_ פריטים",
                zeroRecords:  "לא נמצאו רשומות מתאימות",
                emptyTable:   "לא נמצאו רשומות מתאימות",
                info: "_START_ עד _END_ מתוך _TOTAL_ רשומות" ,
                infoEmpty:    "0 עד 0 מתוך 0 רשומות",
                infoFiltered: "(מסונן מסך _MAX_  רשומות)",
                infoPostFix:  "",
                search: "_INPUT_",
                searchPlaceholder: "חפש...",
                url:          "",
                paginate: {
                    first:    "ראשון",
                    previous: "קודם",
                    next:     "הבא",
                    last:     "אחרון"
                }
            },
            order: [[ 4, "desc" ]],
            paging: false,
            deferRender: true,           
            scrollCollapse: false,            
            scroller: true,
            responsive: true,
            autoWidth: false,
            searchHighlight: true,
            columns: [
                {
                    title: "תמונה",
                    orderable: false,
                    class: "all center-col"
                },
                {
                    title: "שם",
                    class: "all"
                },
                {
                    title: "תיאור",
                    width: "50%",
                    class: "desktop"
                },
                {
                    title: "משתמש",
                    class: "all center-col"
                },
                {
                    title: "תאריך",
                    class: "all center-col"
                },
                {
                    title: "מחק",
                    orderable: false,
                    class: "all center-col"
                }
            ]
        } );

        $('#idt-table tbody').on('click', 'a.deleteFileBtn', function (e) {            
            var item = $(this)[0];
            var fileTitle = item.title;
            var fileRow = $(this).parents('tr');

            swal( {
                title: "האם למחוק את הקובץ ?",
                text: fileTitle,
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'מחק',
                cancelButtonColor: '#3085d6',
                cancelButtonText: 'בטל'                
            } ).then(function () {                
                dataTable.row(fileRow).remove().draw();
                apiDeleteFileWithToken(api, fileTitle);
            }, function (dismiss) {
                // dismiss can be 'cancel', 'overlay',
                // 'close', and 'timer' 
            } );

            return false;
        });

        dataTable.on( 'draw', function () {
            var body = $( dataTable.table().body() );
            body.unhighlight();
            body.highlight( dataTable.search() );  
        } );
    };

    $(function () {
        $(document).on("click", "#files_toggle", function (e) {            
            e.preventDefault();
            if ($(".materialDialog").length < 1) {
                loadApiFilesData();
            }
        });
    });

}(mediaWiki, jQuery));

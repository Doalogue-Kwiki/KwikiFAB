/**
 * JavaScript for Files List
 */
(function (mw, $) {
    
    var api = new mw.Api();
    
    var loadApiFilesData = function () {

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
            apiGetFilesUsage(res.query.allimages);            
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

    var loadPageWikiText = function (pageTitle, filesToAttach) {  

        api.get({
            formatversion: 2,
            action: 'parse',
            prop: 'wikitext',
            page: pageTitle,
            utf8: true
        }).done(function (res) {
            var wikiText = res.parse.wikitext;
            removeGalleryAndMediaFromWikiText(pageTitle, wikiText, filesToAttach);                        
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
    
    
    function setSortDataTableWithMoment(format, locale) {
        
        var types = $.fn.dataTable.ext.type;

        // Add type detection
        types.detect.unshift(function (d) {
            // Strip HTML tags if possible
            if (d && d.replace) {
                d = d.replace(/<.*?>/g, '');
            }

            // Null and empty values are acceptable
            if (d === '' || d === null) {
                return 'moment-' + format;
            }

            return moment(d, format, locale, true).isValid() ?
                'moment-' + format :
                null;
        });

        // Add sorting method - use an integer for the sorting
        types.order['moment-' + format + '-pre'] = function (d) {
            if (d && d.replace) {
                d = d.replace(/<.*?>/g, '');
            }
            return d === '' || d === null ?
                -Infinity :
                parseInt(moment(d, format, locale, true).format('x'), 10);
        };
    };

    function apiDeleteFileWithToken( fileTitle ) {
        
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
                '[' + fileTitle + ']' + ' נמחק בהצלחה! '
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
    
    function apiGetFilesUsage( allfilesData ) {

        var allFilesTitles = "";

        allfilesData.map(function (item) {
            allFilesTitles += '|' + item.title;
        });
        
        api.get({
            formatversion: 2,
            action: 'query',
            prop: 'fileusage',
            formatversion: '2',
            titles: allFilesTitles,
            fulimit: 500,
            utf8: true
        }).done(function (res) {            
            var filesUsageData = res.query.pages;
            setDataTableData(allfilesData, filesUsageData);
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
    
    function setDataTableData(allfilesData, filesUsageData) {
        
        var tableData = [];
        var linkTitle = "לחץ לצפייה";
        var fileLinkTitle = "לחץ לעמוד הקובץ";
        var regex = new RegExp('_', 'g');
        var currentPageTitle = mw.config.get('wgTitle'); 
        
        allfilesData.map(function (item) {            
            var itemName = item.name.trim();
            var fileExtension = itemName.split('.').pop().toLowerCase();
            var fileName = itemName.replace(regex, ' ');
            var fileTitle = item.title;
            var dateTime = moment(item.timestamp);

            var fileUsageLinks = "";
            var searchFileUsage = _.findWhere(filesUsageData, {title: fileTitle });
            var isFileChecked = false;

            if ( searchFileUsage.fileusage ) {
                _.each( searchFileUsage.fileusage, function (item) {                    
                    var pageTitle = item.title;
                    isFileChecked = (currentPageTitle == pageTitle);
                    fileUsageLinks += '<a href="/'+ pageTitle + '" class="fileUsage" >'+ pageTitle + '</a></br>';
                } );
            }

            tableData.push( [                
                '<a href="' + item.url + '" title="' + linkTitle + '"><img src="' + item.url + '" alt="' + fileName + '" class="imgList"></a>',
                '<a href="' + item.descriptionurl + '" title="' + fileLinkTitle + '">' + fileName + '</a>',
                item.comment,
                fileUsageLinks,
                '<a href="/w/index.php?title=user:' + item.user + '" title="' + item.user + '">' + item.user + '</a>',
                dateTime.format("DD/MM/YY HH:mm"),
                '<a href="#" class="deleteFileBtn" title="' + fileTitle + '">' +
                '<i class="fa fa-trash"></i>' +
                '</a>',                
                isFileChecked,
                attachFileExtensionCheck(fileExtension, fileName)             
            ] );

        } );
        
        loadFilesLists(tableData);
    };
    
    function attachSelectedFiles(selectedRowsData) {

        var pageTitle = mw.config.get('wgTitle'); 

        var filesToAttach = "";
        var imagesGalleryToAttach = '\n<gallery heights=100px style="text-align:center">'; 
        
        selectedRowsData.each( function ( value, index ) {
            console.log(value);
            var currentFile = value[8];
            
            if (currentFile.indexOf("[[Media:") !== -1) {
                filesToAttach += "\n" + currentFile;                
            } else {
                imagesGalleryToAttach += "\n" + currentFile;
            }            
        } ); 
        
        imagesGalleryToAttach += "\n</gallery>\n";  
        imagesGalleryToAttach += filesToAttach;
        
        console.log( imagesGalleryToAttach );
        loadPageWikiText(pageTitle, imagesGalleryToAttach);
    };    

    function attachFileExtensionCheck(fileExtension, fileName) {
        
        var result = "";

        switch (fileExtension) {
            case 'png':
            case 'bmp':
            case 'jpeg':
            case 'jpg':
            case 'gif':
            case 'gif':
            case 'pdf':
                result = "File:" + fileName + "|thumb|" + fileName;
                break;
            default:
                result = '[[Media:' + fileName + '|' + fileName + ']]';
        }
        
        return result;
    };
    
    function removeGalleryAndMediaFromWikiText( pageTitle, wikiText, filesToAttach ) {
        // Text modification
        function replaceByBlanks(match) {
            // /./ doesn't match linebreaks. /(\s|\S)/ does.
            return match.replace(/(\s|\S)/g, '');         
        }

        var wikiTextWithOutGallery = wikiText.replace(/<gallery\b[^<]*(?:(?!<\/gallery>)<[^<]*)*<\/gallery>/g, '');
        console.log(wikiTextWithOutGallery);
        var wikiTextWithOutMedia = wikiTextWithOutGallery.replace(/\[\[((Media|מדיה):.+)\]\]/g, '');
        var content = wikiTextWithOutMedia.trim();
                
        console.log(content);
        
        var isNew = (Boolean(content) == false);
        content += filesToAttach; 
        
        EditOrCreatePage(pageTitle, content, isNew);
    };
    
    function loadFilesLists(tableData) {
        
        // Create modal and set his content
        var modalContent =
            '<table id="idt-table" class="row-border hover responsive" cellspacing="0" width="100%"></table>';

        //var modalClass = 'materialDialog';
        var modalClass = '';       
  
        MaterialModal( modalContent, modalClass );
        
        var isMenuButtonEnabled = true;
        var uploadMenuButtonsData = {
            "menu-id": "md-fab-menu",
            "menu-location": "br", // bottom-right
            "menu-toggle-event": "hover",
            "main-button": [
                {                    
                    "bg-color": (isMenuButtonEnabled ? '#2196F3' : "#cacaca"),
                    "label": mw.msg("upload-toggle-popup"),
                    "resting-id": "upload_toggle",
                    "resting-class-icon": "material-icons",
                    "resting-icon": "cloud_upload",
                    "active-id": "upload_toggle",
                    "active-class-icon": "material-icons",
                    "active-icon": "cloud_upload"
                }
            ]
        };
        var toClass = ".tingle-modal";
        MaterialAddFAB( uploadMenuButtonsData, toClass );
                               
        setSortDataTableWithMoment("DD/MM/YY HH:mm");

        var dataTable = $('#idt-table').DataTable({
            data: tableData,
            dom: 'frti',
            language: {
                processing: "מעבד...",
                lengthMenu: "הצג _MENU_ פריטים",
                zeroRecords: "לא נמצאו רשומות מתאימות",
                emptyTable: "לא נמצאו רשומות מתאימות",
                info: "_START_ עד _END_ מתוך _TOTAL_ רשומות",
                infoEmpty: "0 עד 0 מתוך 0 רשומות",
                infoFiltered: "(מסונן מסך _MAX_  רשומות)",
                infoPostFix: "",
                search: "_INPUT_",
                searchPlaceholder: "חפש...",
                url: "",
                paginate: {
                    first: "ראשון",
                    previous: "קודם",
                    next: "הבא",
                    last: "אחרון"
                }
            },
            order: [[5, "desc"]],
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
                    class: "desktop"
                },
                {
                    title: "שימוש בדפים",
                    class: "desktop center-col"
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
                    title: '<i class="fa fa-trash-o"></i>',
                    orderable: false,
                    class: "all center-col"
                },
                {
                    title: '<i class="fa fa-paperclip"></i>',
                    orderable: false,
                    class: "all center-col",
                    render: function ( isFileChecked, type, row, meta ) {
                        var api = new $.fn.dataTable.Api(meta.settings);
                        if( isFileChecked ) {
                            $(api.row(meta.row).node()).toggleClass('selected');                         
                        }
                        return isFileChecked ? '<input type="checkbox" checked/>' : '<input type="checkbox" />'
                    }
                },
                {
                    orderable: false,
                    visible: false,
                    searchable: false
                }
            ]
        });

        $('input').iCheck({
            checkboxClass: 'icheckbox_square-blue',
            increaseArea: '20%' // optional
        });
        
        $('input').iCheck('update');
        
        /*
        $('input').on('ifToggled', function(event){            
            var selectedRow = $(this).closest('tr');
            selectedRow.toggleClass('selected');
            //$(this).toggleClass('selected');
        });*/

        var addFilesToPageButtonsData = {
            "menu-id": "md-fab-add-to-page",
            "menu-location": "bl", // bottom-left
            "menu-toggle-event": "hover",
            "main-button": [
                {                    
                    "bg-color": "#cacaca",
                    "label": "הוסף קבצים לדף",
                    "resting-id": "attach_file_toggle",
                    "resting-class-icon": "material-icons",
                    "resting-icon": "attach_file",
                    "active-id": "attach_file_toggle",
                    "active-class-icon": "material-icons",
                    "active-icon": "attach_file"
                }
            ]
        };

        MaterialAddFAB( addFilesToPageButtonsData, toClass );
        
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
                apiDeleteFileWithToken(fileTitle);
            }, function (dismiss) {
                // dismiss can be 'cancel', 'overlay',
                // 'close', and 'timer' 
            } );

            return false;
        } );

        dataTable.on('draw', function () {
            var body = $(dataTable.table().body());
            body.unhighlight();
            body.highlight(dataTable.search());
        } );
                
        var attachButton = $('#md-fab-add-to-page').find("a");

        $('input').on('ifChecked', function(event) {            
            var selectedRow = $(this).closest('tr');
            selectedRow.toggleClass('selected');
            // enabled the attach button.
            attachButton.css("background-color", '#ffc107');
        } );

        $('input').on('ifUnchecked', function(event) {            
            var selectedRow = $(this).closest('tr');
            selectedRow.toggleClass('selected');
            
            // if any row selected disabled the attach button.
            if ( !dataTable.rows('.selected').data().length ) {
                attachButton.css("background-color", '#cacaca');  
            }
        } );
        
        $(document).on("click", "#md-fab-add-to-page", function (e) {
            e.preventDefault();
            var selectedRowsData = dataTable.rows('.selected').data();
            
            // check that selected files are at least 1.
            if (selectedRowsData.length) {                
                attachSelectedFiles(selectedRowsData);
            }
        });
    };

    $(function () {
        $(document).on("click", "#files_toggle", function (e) {
            e.preventDefault();
            if ($(".materialDialog").length < 1) {
                loadApiFilesData();
            } else {
                return false;   
            }
        });        
    });

    window.LoadApiFilesData = loadApiFilesData;

}(mediaWiki, jQuery));

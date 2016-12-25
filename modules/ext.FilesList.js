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
        var modalMsg = '[' + fileTitle + ']' + mw.msg("modal-delete-message");
        
        api.postWithEditToken($.extend({
            action: 'delete',
            title: fileTitle,
            formatversion: '2',
            // Protect against errors and conflicts
            assert: mw.user.isAnon() ? undefined : 'user'
        }, params))
        .done(function () {
            swal(
                mw.msg("modal-delete-title"),
                modalMsg
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
    
    function removeCategoriesFromDescription(commentsText) {
        // Text modification
        function replaceByBlanks(match) {
            // /./ doesn't match linebreaks. /(\s|\S)/ does.
            return match.replace(/(\s|\S)/g, '');         
        }
          
        var findCatRE = new RegExp('(\\[\\[(.*:.*)\\]\\])', 'gi'); 
        commentsText = commentsText.replace(findCatRE, replaceByBlanks);
        commentsText = commentsText.trim();        

        return commentsText;
    };
    
    function setDataTableData(allfilesData, filesUsageData) {
        
        var tableData = [];
        var linkTitle = mw.msg("modal-click-to-watch-the-file");
        var fileLinkTitle = mw.msg("modal-click-to-the-file-page");
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
                    fileUsageLinks += '    <a href="/'+ pageTitle + '"> '+ pageTitle + '</a>';
                } );
            }

            tableData.push( [
                isFileChecked,
                '<a href="' + item.url + '" title="' + linkTitle + '"><img src="' + item.url + '" alt="' + fileName + '" class="imgList"></a>',
                '<a href="' + item.descriptionurl + '" title="' + fileLinkTitle + '">' + fileName + '</a>',
                removeCategoriesFromDescription(item.comment),
                fileUsageLinks,
                '<a href="/w/index.php?title=user:' + item.user + '" title="' + item.user + '">' + item.user + '</a>',
                dateTime.format("DD/MM/YY HH:mm"),
                '<a href="#" class="deleteFileBtn" title="' + fileTitle + '">' +
                '<i class="fa fa-trash"></i>' +
                '</a>',
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
            //console.log(value);
            var currentFile = value[8];
            
            if (currentFile.indexOf("[[Media:") !== -1) {
                filesToAttach += "\n" + currentFile;                
            } else {
                imagesGalleryToAttach += "\n" + currentFile;
            }            
        } ); 
        
        imagesGalleryToAttach += "\n</gallery>\n";  
        imagesGalleryToAttach += filesToAttach;
        
        //console.log( imagesGalleryToAttach );
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
        //console.log(wikiTextWithOutGallery);
        var wikiTextWithOutMedia = wikiTextWithOutGallery.replace(/\[\[((Media|מדיה):.+)\]\]/g, '');
        var content = wikiTextWithOutMedia.trim();
                
        //console.log(content);
        
        var isNew = (Boolean(content) == false);
        content += filesToAttach; 
        
        EditOrCreatePage(pageTitle, content, isNew);
    };
    
    function loadMaterialModal() {
        // Create modal and set his content

        var modalContent =
            '<img id="loadingSpinner">' + 
            '<table id="idt-table" class="row-border hover responsive" cellspacing="0" width="100%"></table>';
        
        //var modalClass = 'materialDialog';
        var modalClass = '';       

        MaterialModal( modalContent, modalClass );
    };
    
    function loadModalFAB(){
        var toClass = ".tingle-modal";
        var isMenuButtonEnabled = true;
        var uploadMenuButtonsData = {
            "menu-id": "md-fab-menu",
            "menu-location": "br", // bottom-right
            "menu-toggle-event": "click",
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
        
        var addFilesToPageButtonsData = {
            "menu-id": "md-fab-add-to-page",
            "menu-location": "bl", // bottom-left
            "menu-toggle-event": "click",
            "main-button": [
                {                    
                    "bg-color": "#cacaca",
                    "label": mw.msg("modal-add-files-page"),
                    "resting-id": "attach_file_toggle",
                    "resting-class-icon": "material-icons",
                    "resting-icon": "attach_file",
                    "active-id": "attach_file_toggle",
                    "active-class-icon": "material-icons",
                    "active-icon": "attach_file"
                }
            ]
        };
        
        MaterialAddFAB( uploadMenuButtonsData, toClass );
        MaterialAddFAB( addFilesToPageButtonsData, toClass );
    };
    
    function loadDataTableEvents(dataTable) {

        dataTable.on('draw', function () {
            var body = $(dataTable.table().body());
            body.unhighlight();
            body.highlight(dataTable.search());
        } );

        /*
        $('input').on('ifToggled', function(event){            
            var selectedRow = $(this).closest('tr');
            selectedRow.toggleClass('selected');
            //$(this).toggleClass('selected');
        });*/

        $('#idt-table tbody').on( 'click', 'tr', function () {
            var selectRow = $(this);
            var checkInput = selectRow.find('input[type="checkbox"]');

            if ( selectRow.hasClass('selected') ) {
                checkInput.iCheck('uncheck');
            }
            else {
                checkInput.iCheck('check');                
            }
        } );

        $('#idt-table tbody').on('click', 'a.deleteFileBtn', function (e) {
            var item = $(this)[0];
            var fileTitle = item.title;
            var fileRow = $(this).parents('tr');

            swal( {
                title: mw.msg("modal-if-delete-file"),
                text: fileTitle,
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: mw.msg("modal-delete-button"),
                cancelButtonColor: '#3085d6',
                cancelButtonText: mw.msg("modal-cancel-button")
            } ).then(function () {
                dataTable.row(fileRow).remove().draw();
                apiDeleteFileWithToken(fileTitle);
            }, function (dismiss) {
                // dismiss can be 'cancel', 'overlay',
                // 'close', and 'timer' 
            } );

            return false;
        } );

        $('input').on('ifChecked', function(event) { 
            var attachButton = $('#md-fab-add-to-page').find("a");
            var selectedRow = $(this).closest('tr');
            selectedRow.toggleClass('selected');
            $(this).parent().attr('title', mw.msg("title-selected-file"));

            // enabled the attach button.
            attachButton.css("background-color", '#ffc107');
        } );

        $('input').on('ifUnchecked', function(event) {
            var attachButton = $('#md-fab-add-to-page').find("a");
            var selectedRow = $(this).closest('tr');
            selectedRow.toggleClass('selected');
            $(this).parent().attr('title', mw.msg("title-click-select-file"));

            // if any row selected disabled the attach button.
            if ( !dataTable.rows('.selected').data().length ) {
                attachButton.css("background-color", '#cacaca');  
            }
        } );

        $('input').on('ifCreated', function(event) {

            var selectedRow = $(this).closest('tr');

            if ( selectedRow.hasClass('selected') ) {
                $(this).parent().attr('title', mw.msg("title-selected-file"));
            } else {
                $(this).parent().attr('title', mw.msg("title-click-select-file"));
            }
        });

        //$('input').iCheck('update');

        $(document).on("click", "#md-fab-add-to-page", function (e) {
            e.preventDefault();
            var selectedRowsData = dataTable.rows('.selected').data();

            // check that selected files are at least 1.
            if (selectedRowsData.length) {                
                attachSelectedFiles(selectedRowsData);
            }
        } );
    };
    
    function loadFilesLists(tableData) {        
                         
        setSortDataTableWithMoment("DD/MM/YY HH:mm");

        var dataTable = $('#idt-table').DataTable({
            //processing: true,
            data: tableData,
            dom: 'frti',
            language: {
                processing: mw.msg("processing"),
                lengthMenu: mw.msg("lengthMenu"),
                zeroRecords: mw.msg("zeroRecords"),
                emptyTable: mw.msg("emptyTable"),
                info: mw.msg("info"),
                infoEmpty: mw.msg("infoEmpty"),
                infoFiltered: mw.msg("infoFiltered"),
                infoPostFix: mw.msg("infoPostFix"),
                search: "_INPUT_",
                searchPlaceholder: mw.msg("searchPlaceholder"),
                url: mw.msg("url"),
                paginate: {
                    first: mw.msg("paginate-first"),
                    previous: mw.msg("paginate-previous"),
                    next: mw.msg("paginate-next"),
                    last: mw.msg("paginate-last")
                }
            },
            order: [[6, "desc"]],
            paging: false,
            deferRender: true,
            scrollCollapse: false,
            scroller: true,
            responsive: true,
            autoWidth: false,
            select: {
                style: 'multi'
            },
            searchHighlight: true,
            fnDrawCallback: function() {
                $('th').each(function(){ 
                    var titleText = $(this).context.textContent;
                    var curretTitle = $(this).context.title;
                    if (!curretTitle){
                        $(this).attr({ title: $(this).context.textContent }); 
                    }                   
                }); 
            },           
            columns: [
                {
                    title: '<i class="fa fa-paperclip" title="' + mw.msg("title-select-file") + '"></i>',
                    orderable: false,
                    class: "all center-col",
                    render: function ( isFileChecked, type, row, meta ) {
                        var api = new $.fn.dataTable.Api(meta.settings);
                        if( isFileChecked ) {
                            $(api.row(meta.row).node()).toggleClass('selected');
                        }
                        return isFileChecked ? 
                            '<input title="'+ mw.msg("title-selected-file") + '" type="checkbox" checked/>' : 
                        '<input title="' + mw.msg("title-click-select-file") + '" type="checkbox" />'
                    }
                },
                {
                    title: mw.msg("title-image"),
                    orderable: false,
                    class: "all center-col"
                },
                {
                    title: mw.msg("title-name"),
                    class: "all"
                },
                {
                    title: mw.msg("title-description"),
                    class: "desktop"
                },
                {
                    title: mw.msg("title-file-usage"),
                    class: "desktop fileUsage center-col"
                },
                {
                    title: mw.msg("title-user"),
                    class: "desktop center-col"
                },
                {
                    title: mw.msg("title-date"),
                    class: "desktop center-col"
                },
                {
                    title: '<i class="fa fa-trash-o" title="' + mw.msg("modal-delete-button") + '"></i>',
                    orderable: false,
                    class: "all center-col"
                }                
            ],
            initComplete: function(settings, json) {

                $('input').iCheck({
                    checkboxClass: 'icheckbox_square-blue',
                    increaseArea: '20%', // optional
                    inherit: 'title'
                });

                // fix the bug of title of the checkbox.
                $('input[type="checkbox"]').each( function() {
                    var currentTitle = $(this)[0].title;
                    $(this).parent().attr('title', currentTitle);
                } );
                
                loadModalFAB();

                $('#loadingSpinner').remove();
                //or $('#loadingSpinner").empty();
            }
        });
        loadDataTableEvents(dataTable);
    };

    $(function () {
        $(document).on("click", "#files_toggle", function (e) {
            e.preventDefault();
            
            var isVeNotActive = (window.location.href.indexOf("veaction") === -1);
            
            $('#md-fab-menu').attr('data-mfb-state', 'close');
            
            if ( $(".materialDialog").length < 1 && isVeNotActive ) {
                loadMaterialModal();                       
                loadApiFilesData();
            } else {
                return false;   
            }
        });        
    });

    window.LoadApiFilesData = loadApiFilesData;

}(mediaWiki, jQuery));

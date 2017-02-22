/**
 * JavaScript for Drag And Drop Upload
 */
(function (mw, $) {

    /*
    var categoriesFileSelector;
    var categoriesData;
    */
    /*var fileDescription = "";*/
    var api = new mw.Api;
    var filesToUpload;
    
    function handleFilesSelect() {
        
        if (filesToUpload.length) {

            _.each( filesToUpload, function (file) { 
                console.log("file:", file);
                uploadFile(file, file.name);
            });
            
        } else {
            $.simplyToast(mw.msg("modal-popup-warning-file-missing"), 'danger');
        }
    };

    function uploadFile(fileToUpload, fileName, fileComment = "") {

        formdata = new FormData(); //see https://developer.mozilla.org/en-US/docs/Web/Guide/Using_FormData_Objects?redirectlocale=en-US&redirectslug=Web%2FAPI%2FFormData%2FUsing_FormData_Objects

        formdata.append("action", "upload");
        formdata.append("ignorewarnings", false);
        formdata.append("token", mw.user.tokens.get('editToken'));
        formdata.append("file", fileToUpload);
        formdata.append("comment", fileComment);
        formdata.append("filename", fileName);

        var formatedFileName = "FILE:" + fileName;
        console.log(formatedFileName);

        //as we now have created the data to send, we send it...
        $.ajax({
            url: mw.util.wikiScript('api'), //url to api.php 
            contentType: false,
            processData: false,
            type: 'POST',
            data: formdata, //the formdata object we created above
            success: function () {
                ReloadApiPurge(formatedFileName);
            },
            error: function (xhr, status, error) {
                console.log(error)
            }
        });
    };

    // Create and append a window manager, which opens and closes the window.
    function loadDragAndDropUpload() {

        // Create modal and set his content
        var modalContent = '<input id="uploadInputFiles" type="file" name="files[]" multiple="multiple">';

        /*
        var modalContent =
            '<input type="file" id="uploadInputFiles" class="dropify" data-height="400" />';
        */
        var modalClass = '';

        MaterialModal(modalContent, modalClass);

        $('#uploadInputFiles').filer({
            addMore: true,
            showThumbs: true,
            changeInput: '<div class="jFiler-input-dragDrop"><div class="jFiler-input-inner"><div class="jFiler-input-icon"><i class="icon-jfi-cloud-up-o"></i></div><div class="jFiler-input-text"><h3>גרור ושחרר קבצים כאן</h3> <span style="display:inline-block; margin: 15px 0">או</span></div><a class="jFiler-input-choose-btn blue">בחר קבצים</a></div></div>',
            theme: "dragdropbox",
            templates: {
                box: '<ul class="jFiler-items-list jFiler-items-grid"></ul>',
                item: '<li class="jFiler-item">\
                        <div class="jFiler-item-container">\
                            <div class="jFiler-item-inner">\
                                <div class="jFiler-item-thumb">\
                                    <div class="jFiler-item-status"></div>\
                                    <div class="jFiler-item-thumb-overlay">\
                                        <div class="jFiler-item-info">\
                                            <div style="display:table-cell;vertical-align: middle;">\
                                                <span class="jFiler-item-title"><b title="{{fi-name}}">{{fi-name}}</b></span>\
                                                <span class="jFiler-item-others">{{fi-size2}}</span>\
                                            </div>\
                                        </div>\
                                    </div>\
                                    {{fi-image}}\
                                    </div>\
                                    <div class="jFiler-item-assets jFiler-row">\
                                        <ul class="list-inline pull-left">\
                                            <li>{{fi-progressBar}}</li>\
                                        </ul>\
                                        <ul class="list-inline pull-right">\
                                            <li><a class="fa fa-trash-o jFiler-item-trash-action"></a></li>\
                                        </ul>\
                                </div>\
                            </div>\
                        </div>\
                    </li>',
                itemAppend: 
                '<li class="jFiler-item">\
                    <div class="jFiler-item-container">\
                        <div class="jFiler-item-inner">\
                            <div class="jFiler-item-thumb">\
                                <div class="jFiler-item-status"></div>\
                                <div class="jFiler-item-thumb-overlay">\
                                    <div class="jFiler-item-info">\
                                    <div style="display:table-cell;vertical-align: middle;">\
                                        <span class="jFiler-item-title"><b title="{{fi-name}}">{{fi-name}}</b></span>\
                                        <span class="jFiler-item-others">{{fi-size2}}</span>\
                                    </div>\
                                </div>\
                            </div>\
                            {{fi-image}}\
                            </div>\
                            <div class="jFiler-item-assets jFiler-row">\
                                <ul class="list-inline pull-left">\
                                    <li><span class="jFiler-item-others">{{fi-icon}}</span></li>\
                                </ul>\
                                <ul class="list-inline pull-right">\
                                    <li><a class="fa fa-trash-o jFiler-item-trash-action"></a></li>\
                                </ul>\
                            </div>\
                        </div>\
                    </div>\
                </li>',
                progressBar: '<div class="bar"></div>',
                itemAppendToEnd: false,
                canvasImage: true,
                removeConfirmation: true,
                _selectors: {
                    list: '.jFiler-items-list',
                    item: '.jFiler-item',
                    progressBar: '.bar',
                    remove: '.jFiler-item-trash-action'
                }
            },
            onRemove: function(itemEl, file, id, listEl, boxEl, newInputEl, inputEl){
                filesToUpload = _.without(filesToUpload, file);
                console.log(filesToUpload);
            },
            dragDrop: {
                dragEnter: null,
                dragLeave: null,
                drop: null,
                dragContainer: null,
            },
            captions: {
                button: "Choose Files",
                feedback: "Choose files To Upload",
                feedback2: "files were chosen",
                drop: "Drop file here to Upload",
                removeConfirmation: "Are you sure you want to remove this file?",
                errors: {
                    filesLimit: "Only {{fi-limit}} files are allowed to be uploaded.",
                    filesType: "Only Images are allowed to be uploaded.",
                    filesSize: "{{fi-name}} is too large! Please upload file up to {{fi-fileMaxSize}} MB.",
                    filesSizeAll: "Files you've choosed are too large! Please upload files up to {{fi-maxSize}} MB.",
                    folderUpload: "You are not allowed to upload folders."
                }
            }
        });
    }

    $(function () {
        $(document).on("click", "#upload_toggle", function (e) {
            e.preventDefault();
            loadDragAndDropUpload();
        });

        $(document).on("change", "#uploadInputFiles", function (e) {
            e.preventDefault();

            // add the button only if is not existing
            if (!$("#md-upload-fab").length) {

                var isMenuButtonEnabled = true;

                var uploadMenuButtonsData = {
                    "menu-id": "md-upload-fab",
                    "menu-location": "bl", // bottom-left
                    "menu-toggle-event": "hover",
                    "main-button": [
                        {
                            "bg-color": (isMenuButtonEnabled ? '#2196F3' : '#cacaca'),
                            "label": mw.msg("upload-toggle-popup"),
                            "resting-id": "done_upload_toggle",
                            "resting-class-icon": "material-icons",
                            "resting-icon": "cloud_upload",
                            "active-id": "done_upload_toggle",
                            "active-class-icon": "material-icons",
                            "active-icon": "cloud_upload"
                        }
                    ]
                };

                var toClass = ".tingle-modal";
                /*
                var htmlInputs =
                    '<span class="oo-ui-labelElement-label"> שם הקובץ </span>' +
                    '<input id="renameFile" type="text" \>' +
                    '<span class="oo-ui-labelElement-label"> תיאור </span>' +
                    '<textarea id="fileDescription" rows="4" placeholder="הוסף תיאור לקובץ ..." autofocus></textarea>';

                $(".tingle-modal-box__content").append(htmlInputs);
                */

                MaterialAddFAB(uploadMenuButtonsData, toClass);

            }            
            filesToUpload = e.target.files;
            /*$("#renameFile").val(filesToUpload.name);*/
        });

        /*
        $(document).on("blur", "#fileDescription", function (e) {
            e.preventDefault();
            fileDescription = $('#fileDescription').val();
        });
        */

        $(document).on("click", "#done_upload_toggle", function (e) {
            e.preventDefault();
            /*var renameFile = $("#renameFile").val();
            console.log($("#renameFile") ,renameFile);*/
            handleFilesSelect();

            swal({
                title: mw.msg("uploaded-successfully"),
                text: mw.msg("redirect-files-list"),
                confirmButtonText: mw.msg("modal-ok-button")
            }).then(function () {
                LoadFilesListModal();
            });
        });
    });

}(mediaWiki, jQuery));

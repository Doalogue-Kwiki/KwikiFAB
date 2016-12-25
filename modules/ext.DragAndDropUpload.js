/**
 * JavaScript for Drag And Drop Upload
 */
(function (mw, $) {

    var fileToUpload;
    /*
    var categoriesFileSelector;
    var categoriesData;
    */
    var fileDescription = "";
    var api = new mw.Api;
    
    function handleFileSelect() {
        
        if (fileToUpload) {

            var fileComment = "";
            var renameFile = $("#renameFile").val();
            var fileName = fileToUpload.name;

            if (renameFile) {
                fileName = renameFile;
            } 

            /*var selectedCategoriesText = "";
            var selectedCategories = categoriesFileSelector.getValue();

            selectedCategories.forEach(function (item) {
                selectedCategoriesText += "\n" + "[[category:" + item.toString() + "]]";
            });

            fileComment = fileDescription + selectedCategoriesText;
            */
            
            uploadFile(fileToUpload, fileDescription, fileName);
            
        } else {
            $.simplyToast(mw.msg("modal-popup-warning-file-missing"), 'danger');
        }
    };
    
    function uploadFile(fileToUpload, fileComment, fileName) {
        
        formdata = new FormData(); //see https://developer.mozilla.org/en-US/docs/Web/Guide/Using_FormData_Objects?redirectlocale=en-US&redirectslug=Web%2FAPI%2FFormData%2FUsing_FormData_Objects
        
        formdata.append("action", "upload");        
        formdata.append("ignorewarnings", false);
        formdata.append("token", mw.user.tokens.get( 'editToken' ) );
        formdata.append("file", fileToUpload);
        formdata.append("comment", fileComment);
        formdata.append("filename", fileName);

        //as we now have created the data to send, we send it...
        $.ajax( { 
            url: mw.util.wikiScript( 'api' ), //url to api.php 
            contentType: false,
            processData: false,
            type: 'POST',
            data: formdata,//the formdata object we created above
            success:function(data){
                swal({
                    title: mw.msg("uploaded-successfully"),
                    text: mw.msg("redirect-files-list"),
                    confirmButtonText: mw.msg("modal-ok-button")
                }).then(function () {
                    /*
                    console.log(data);         
                    var uploadedImageInfo = data.upload.imageinfo;
                    */                            
                    LoadApiFilesData();
                });
            },
            error:function(xhr,status, error){
                console.log(error)
            }
        });      
    };

    // Create and append a window manager, which opens and closes the window.
    function loadDragAndDropUpload() {

        /*
        categoriesData = new Array();
        LoadAllCategories(categoriesData);
        */
        
        // Create modal and set his content
        var modalContent =
            '<input type="file" id="uploadInputFile" class="dropify" data-height="400" />';

        //var modalClass = 'materialDialog';   
        var modalClass = '';

        MaterialModal(modalContent, modalClass);

        $('#uploadInputFile').dropify({
            messages: {
                default: "גרור ושחרר קבצים לכאן או לחץ",
                replace: "גרור ושחרר קבצים לכאן או לחץ להחלפת הקובץ",
                remove: "הסר",
                error: "Ooops, something wrong appended."
            },
            error: {
                fileSize: "The file size is too big ({{ value }} max).",
                minWidth: "The image width is too small ({{ value }}}px min).",
                maxWidth: "The image width is too big ({{ value }}}px max).",
                minHeight: "The image height is too small ({{ value }}}px min).",
                maxHeight: "The image height is too big ({{ value }}px max).",
                imageFormat: "The image format is not allowed ({{ value }} only).",
                fileExtension: "The file is not allowed ({{ value }} only)."
            },
            tpl: {
                wrap: '<div class="dropify-wrapper"></div>',
                loader: '<div class="dropify-loader"></div>',
                message: '<div class="dropify-message"><span class="file-icon" /> <p>{{ default }}</p></div>',
                preview: '<div class="dropify-preview"><span class="dropify-render"></span><div class="dropify-infos"><div class="dropify-infos-inner"><p class="dropify-infos-message">{{ replace }}</p></div></div></div>',
                filename: '',
                clearButton: '<button type="button" class="dropify-clear">{{ remove }}</button>',
                errorLine: '<p class="dropify-error">{{ error }}</p>',
                errorsContainer: '<div class="dropify-errors-container"><ul></ul></div>'
            }
        });
    }

    $(function () {
        $(document).on("click", "#upload_toggle", function (e) {
            e.preventDefault();
            loadDragAndDropUpload();
        });

        $(document).on("change", "#uploadInputFile", function (e) {
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
                    '<textarea id="fileDescription" rows="4" placeholder="הוסף תיאור לקובץ ..." autofocus></textarea>' + 
                    '<span class="oo-ui-labelElement-label"> קטגוריות </span>' +
                    '<input id="categoriesFileSelector" type="text" \>';
                */
                var htmlInputs =
                    '<span class="oo-ui-labelElement-label"> שם הקובץ </span>' +
                    '<input id="renameFile" type="text" \>' +
                    '<span class="oo-ui-labelElement-label"> תיאור </span>' +
                    '<textarea id="fileDescription" rows="4" placeholder="הוסף תיאור לקובץ ..." autofocus></textarea>';

                $(".tingle-modal-box__content").append(htmlInputs);
                
                MaterialAddFAB(uploadMenuButtonsData, toClass);
                /*
                categoriesFileSelector = $('#categoriesFileSelector').magicSuggest( {        
                    sortOrder: 'name',
                    data: categoriesData,
                    noSuggestionText: mw.msg("modal-categories-no-suggestion"),
                    placeholder: mw.msg("modal-categories-placeholder"),
                    toggleOnClick: true,
                    strictSuggest: true,
                    maxDropHeight: 150,
                    useCommaKey: false,
                    selectionStacked: true            
                } );
                */
                
            }
            
            fileToUpload = e.target.files[0];
            $("#renameFile").val(fileToUpload.name);
        });

        $(document).on("blur", "#fileDescription", function (e) {
            e.preventDefault();
            fileDescription = $('#fileDescription').val();
        });

        $(document).on("click", "#done_upload_toggle", function (e) {
            e.preventDefault();
            handleFileSelect();
        });
    });

}(mediaWiki, jQuery));

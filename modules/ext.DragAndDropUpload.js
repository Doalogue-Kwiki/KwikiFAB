/**
 * JavaScript for Drag And Drop Upload
 */
( function ( mw, $ ) {
    
    var fileToUpload; 
    var fileDescription = "";
    
    function uploadFile() {
    
        var upload = new mw.Upload;
        
        if (fileToUpload) {
            upload.setFile( fileToUpload );
            upload.setFilename( fileToUpload.name );
            console.log(fileDescription);
            upload.setComment( fileDescription );
            upload.upload();

            swal({   
                title: mw.msg("uploaded-successfully"),
                text: mw.msg("redirect-files-list"),
                confirmButtonText: mw.msg("modal-ok-button")
            }).then(function() {
                LoadApiFilesData();
            });				
        }						
        else {
            $.simplyToast(mw.msg("modal-popup-warning-file-missing"), 'danger');
        }
    };
    
    // Create and append a window manager, which opens and closes the window.
    function loadDragAndDropUpload() {
		
        // Create modal and set his content
        var modalContent =
            '<input type="file" id="uploadInputFile" class="dropify" data-height="500" />';            
        
        //var modalClass = 'materialDialog';   
        var modalClass = '';
        
        MaterialModal(modalContent, modalClass);
       
        $('#uploadInputFile').dropify({
            messages: {
                "default": "Drag and drop a file here or click",
                replace: "Drag and drop or click to replace",
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
                filename: '<p class="dropify-filename"><span class="file-icon"></span> <span class="dropify-filename-inner"></span></p>',
                clearButton: '<button type="button" class="dropify-clear">{{ remove }}</button>',
                errorLine: '<p class="dropify-error">{{ error }}</p>',
                errorsContainer: '<div class="dropify-errors-container"><ul></ul></div>'
            }
        });  
    }    
	
    $( function () {
		$( document ).on("click", "#upload_toggle", function(e) {
			e.preventDefault();
			loadDragAndDropUpload();
		}); 
        
        $(document).on("change", "#uploadInputFile", function (e) {
            e.preventDefault();
            
            // add the button only if is not existing
            if ( !$("#md-upload-fab").length ) { 
                
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
                
                var description =
                    '<textarea id="fileDescription" rows="4" placeholder="הוסף תיאור לקובץ ..." autofocus></textarea>';
                
                $(".tingle-modal-box__content").append(description);
                
                MaterialAddFAB( uploadMenuButtonsData, toClass );
            }
            
            fileToUpload = e.target.files[0];
        });
        
        $(document).on("blur", "#fileDescription", function (e) {
            e.preventDefault();
            fileDescription = $('#fileDescription').val();            
        });
        
        $(document).on("click", "#done_upload_toggle", function (e) {
            e.preventDefault();
            uploadFile();
        });
    });
	
}( mediaWiki, jQuery ) );

/**
 * JavaScript for Drag And Drop Upload
 */
( function ( mw, $ ) {
	
    // Create and append a window manager, which opens and closes the window.
		
    function loadDragAndDropUpload() {
		
		var file = new OO.ui.SelectFileWidget( {
			id: "modal-select-file",
			showDropTarget: true,
			droppable: true
		} );
		var upload = new mw.Upload;
		
		var dialogActionButtons = [ 
		{
			id: "model-upload-button",
			action: 'upload',
			framed: false,			
			icon: 'check',
			label: mw.msg("modal-upload-label-button"),
			iconTitle: mw.msg("modal-upload-label-button"),
			flags: [ 'other', 'progressive' ] 
		},
		{ 
			id: "model-close-button",
			action: 'close',
			framed: false,
			icon: 'close',
			iconTitle: mw.msg("modal-close-button"),
			flags: 'safe' 
		} ];

		var dialogHeight = 200;
		
        var uploadFunction = function(dialog, action, windowManager) {							
			var fileToUpload = file.getValue();
		
			if (fileToUpload) {
				upload.setFile( fileToUpload );
				upload.setFilename( fileToUpload.name );
				upload.upload();
				
				swal({   
					title: mw.msg("uploaded-successfully"),
					text: mw.msg("redirect-files-list"),
					confirmButtonText: mw.msg("modal-ok-button")
				}).then(function() {
					window.location.href = "/special:fileList";
					dialog.close();
                    windowManager.destroy();
				});				
			}						
			else {
				$.simplyToast(mw.msg("modal-popup-warning-file-missing"), 'danger');
			}
		};
		
        var dialogSize = "medium";

        
		//title, actions, content, mainAction, mainActionFunc, windowManager, height
		MaterialDialog(
			mw.msg("upload-files-dialog-title"),
			dialogActionButtons,
			file,
			'upload',
			uploadFunction,
			dialogHeight,
            dialogSize
		);
		
    }    
	
    $( function () {
		$( document ).on( "click", "#upload_toggle", function(e) {
			e.preventDefault();
			loadDragAndDropUpload();
		});        
    });
	
}( mediaWiki, jQuery ) );

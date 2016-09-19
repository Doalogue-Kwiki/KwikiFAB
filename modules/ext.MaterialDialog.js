/**
 * JavaScript for Material Dialog
 */
( function ( mw, $ ) {

	var createMaterialDialog = function ( title,
                                          actions,
                                          content,
                                          mainAction, 
                                          mainActionFunc,
                                          height, 
                                          windowManager, 
                                          dialogSize )
	{
		function MaterialDialog( config ) {
			MaterialDialog.parent.call( this, config );
			this.broken = true;
		};
					
		OO.inheritClass( MaterialDialog, OO.ui.ProcessDialog );
		
		MaterialDialog.static.title = title;
		
		MaterialDialog.static.actions = actions;
		
		MaterialDialog.prototype.initialize = function () {

			MaterialDialog.parent.prototype.initialize.apply( this, arguments );
			this.content = new OO.ui.FormLayout( {
				classes: ['materialDialog'],
				items: [ content ]
			} );		

			this.$body.append( this.content.$element );
		};
			
		MaterialDialog.prototype.getBodyHeight = function () {
            if (height) {
                return height;                
            } else {
                return this.content.$element.outerHeight( true );  
            }            
		};

		MaterialDialog.prototype.onDialogKeyDown = function ( e ) {
			var actions;

			if ( e.which === OO.ui.Keys.ESCAPE && this.constructor.static.escapable ) {
				this.executeAction( 'close' );
				e.preventDefault();
				e.stopPropagation();
			} 
		};

		MaterialDialog.prototype.getActionProcess = function ( action ) {
			var dialog = this;

			if ( action === mainAction ) {
				return new OO.ui.Process( function () {				
					
					try {
                        if (mainActionFunc)
                        {
                            mainActionFunc(dialog, mainAction, windowManager);	
                        }
					}
					catch (e) {
						console.log(e);
						dialog.close();
                        windowManager.destroy();
					}	
				} );
			} 
			
			if ( action === 'close' ) {				
				return new OO.ui.Process( function () {					
					dialog.close();
					windowManager.destroy();
				} );
			}
		};
		
		return new MaterialDialog( { 
            size: dialogSize 
		} );
	};
	
    var openMaterialDialog = function (  title,
                                         actions,
                                         content, 
                                         mainAction,
                                         mainActionFunc, 
                                         height,
                                         dialogSize = "large" ) {

		if ( $(".oo-ui-windowManager-modal").length < 1) {

            var windowManager = new OO.ui.WindowManager();
            
            // User is currently editing a page using VisualEditor
            if ( window.ve && ve.init && ve.init.target && ve.init.target.active ) {
                console.log(" User is currently editing a page using VisualEditor ");
            }
            			
			var materialDialog = 
				createMaterialDialog( title, actions, content, mainAction, mainActionFunc, height, windowManager );		
			windowManager.addWindows( [ materialDialog ] );
			// Open the window!
			windowManager.openWindow( materialDialog );
			
			$( 'body' ).append( windowManager.$element );
		}
	}
			
	window.MaterialDialog = openMaterialDialog;
	
}( mediaWiki, jQuery ) );
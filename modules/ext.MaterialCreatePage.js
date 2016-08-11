/**
 * JavaScript for MaterialFAB Menu
 */
( function ( mw, $ ) {
    
    function loadMaterialCreatePage() {
        
        var menu = mw.template.get( "ext.MaterialFAB", "menu.mustache" );
		
		var createPageMenuData = {
			"menu-id" : "md-create-page-menu",
			"menu-location" : "tr", // top-right ==> RTL ==> top-left
			"menu-toggle-event" : "hover",
			"main-button" : [{
				"href" : "#",
				"label" : mw.msg('create-toggle-popup'),
				"resting-id" : "main_toggle",				
				"resting-class-icon" : "material-icons",
				"resting-icon" : "create",
				"active-id" : "clear_toggle",				
				"active-class-icon" : "material-icons",
				"active-icon" : "clear"
			}],			
			"menu-items": [
			{
				"id" : "categories_toggle",
				"href" : "#",
				"label" : mw.msg("categories-toggle-popup"),
				"bg-color" : "#8c8989;",
				"class-icon" : "material-icons",
				"icon" : "style"			
			},
			{
				"id" : "files_toggle",
				"href" : "#",
				"label" : mw.msg("files-toggle-popup"),
				"bg-color" : "#8c8989;",
				"class-icon" : "material-icons",
				"icon" : "perm_media"			
			},
			{
				"id" : "upload_toggle",
				"href" : "#",
				"label" : mw.msg("upload-toggle-popup"),
				"bg-color" : "#8c8989;",
				"class-icon" : "material-icons",
				"icon" : "cloud_upload"			
			}]
		};
		
		var randeredMenu = menu.render(createPageMenuData);
		
        /*
		//kwiki material ux 
		$(".pagenameinput").on("focus", function( e ) {
			$('.createpage').addClass('active');
		});

		$(".pagenameinput").on("blur", function( e ) {
			$('.createpage').removeClass('active');
		});

		//reveal on hover
		$(".kwiki-mat").mouseover(function() {
			$("#kwiki-ux").addClass("activate");
		});
		$(".kwiki-mat").mouseleave(function() {
			$("#kwiki-ux").removeClass("activate");
		});

		// prevent null form
		$('.createpage').prop('disabled',true); 
		
		$('.pagenameinput').keyup(function(){ 
			$('.createpage').prop('disabled', this.value == "" ? true : false); 
		})
		
		if ( self !== top ) {
			$('body').addClass('iframed');
		}*/
    }
    
    $( function () {		
        loadMaterialCreatePage();		
    });

}( mediaWiki, jQuery ) );

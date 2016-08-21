/**
 * JavaScript for MaterialCreatePage Menu
 */
( function ( mw, $ ) {
    
    function loadMaterialCreatePage() {
        
        var menu = mw.template.get( "ext.MaterialFAB", "menu.mustache" );		

		var createPageMenuData = {
			"menu-id" : "md-create-page-menu",
			"menu-location" : "br", // bottom-right ==> RTL ==> bottom-left
			"menu-toggle-event" : "hover",
			"main-button" : [{
				"href" : "#",
				"bg-color": "#d23f31",
				"label" : mw.msg('create-toggle-popup'),
				"resting-id" : "add_toggle",				
				"resting-class-icon" : "material-icons",
				"resting-icon" : "add",
				"active-id" : "create_toggle",				
				"active-class-icon" : "material-icons",
				"active-icon" : "create"
			}],			
			"menu-items": [
			{
				"id" : "upload_toggle",
				"href" : "#",
				"label" : mw.msg("upload-toggle-popup"),
				"bg-color" : "#2196F3",
				"class-icon" : "material-icons",
				"icon" : "cloud_upload"			
			},			
			{
				"id" : "files_toggle",
				"href" : "#",
				"label" : mw.msg("files-toggle-popup"),
				"bg-color" : "#4CAF50",
				"class-icon" : "material-icons",
				"icon" : "perm_media"			
			},
			{
				"id" : "categories_toggle",
				"href" : "#",
				"label" : mw.msg("categories-toggle-popup"),
				"bg-color" : "#ffc107",
				"class-icon" : "material-icons",
				"icon" : "style"			
			}]
		};
		
		var randeredMenu = menu.render(createPageMenuData);			
		$("#page-content").append(randeredMenu);
		
		$( document ).on( "click", "#create_toggle", function(e) {
			e.preventDefault();            
			loadApiData();
		});
    };

	function loadCreatePageModal(randeredCategories) {
		
		var titleInput = new mw.widgets.TitleInputWidget( {
			id: "title-input",
			autofocus: true,
			placeholder: mw.msg("modal-title-input-placeholder"),
			indicator: 'required'		
		} );
		
		var namespaceSelector = new mw.widgets.NamespaceInputWidget( { 
			includeAllValue: "all namespaces"
		} );
		
		var categoriesSelector = new OO.ui.LabelWidget( {
			label: $(randeredCategories)
		} );
		
		/*var categoriesSelector = new mw.widgets.CategorySelector( {
			allowArbitrary: true,
			icon: "tag",
			iconTitle: mw.msg("modal-categories-selector-label")
		} );*/
		
		var templateSelector = new OO.ui.DropdownInputWidget( {
			options: [
				{ data: 'empty', label: ' ' },
				{ data: 'a', label: 'First' },
				{ data: 'b', label: 'Second'},
				{ data: 'c', label: 'Third' }
			]
		} );
		
		var fieldset = new OO.ui.FieldsetLayout( {
			items: [
				new OO.ui.FieldLayout( titleInput, {
					id: "modal-title-fieldset",
					label: mw.msg("modal-title-input-label"),
					classes: ['materialFieldset'],
					align: 'top'
				} ),
				new OO.ui.FieldLayout( categoriesSelector, {
					id: "modal-categories-fieldset",
					label: mw.msg("modal-categories-selector-label"),
					classes: ['materialFieldset'],
					align: 'top'
				} ),
				new OO.ui.FieldLayout( namespaceSelector, {
					id: "modal-namespace-fieldset",
					label: mw.msg("modal-namespace-selector-label"),
					classes: ['materialFieldset'],
					align: 'top'
				} ),
				new OO.ui.FieldLayout( templateSelector, {
					id: "modal-template-fieldset",
					label: mw.msg("modal-template-selector-label"),
					classes: ['materialFieldset'],
					align: 'top'
				} )
			]
		} );
				
		var dialogActionButtons = [ {
			id: "model-create-button",
			action: 'create',
			framed: false,				
			icon: 'templateAdd',
			iconTitle: mw.msg("modal-create-page-button"),
			flags: [ 'primary', 'progressive' ] 
		},
		{ 
			id: "model-close-button",
			action: 'close',
			framed: false,
			icon: 'close',
			iconTitle: mw.msg("modal-close-button"),
			flags: 'safe' 
		} ];

		var dialogTitle = mw.msg("modal-create-page-title");
		var dialogHeight = 550;
		var materialDialog = CreateMaterialDialog( fieldset, dialogActionButtons, dialogTitle, dialogHeight );

		materialDialog.getActionProcess = function ( action ) {
			var dialog = this;

			if ( action === 'create' ) {
				return new OO.ui.Process( function () {
					dialog.close();
				} );
			} else if ( action === 'close' ) {
				return new OO.ui.Process( function () {
					dialog.close();
				} );
			}
			return materialDialog.parent.getActionProcess.call( this, action );
		};
		
		$('#categories-multiselector').select2({
			placeholder : {
				id: '-1', // the value of the option
				text: 'Select all categories ...'
			},
			closeOnSelect: true,
			dir: "rtl",
			allowClear: true,
			tags: true	
		});		
	};
	
	function loadApiData() {
		
		var template = mw.template.get( "ext.MaterialCreatePage", "select2.mustache" );		
		var api = new mw.Api();	
		
		var categoriesData = [];
		
		api.get( {
			formatversion: 2,
			action: 'query',
			prop: 'categories',
			aclimit: 5000,
			list: 'allcategories'
		} ).done( function ( res ) {
			var categories = res.query.allcategories;
			categoriesData = 
			{
				categories: categories.map(function(item){
					return item; 
				})
			};
			randeredCategories = template.render(categoriesData);
			console.log(categoriesData);			
			loadCreatePageModal(randeredCategories);
		} );		
	};
	
    $( function () {		
        loadMaterialCreatePage();		
    });

}( mediaWiki, jQuery ) );

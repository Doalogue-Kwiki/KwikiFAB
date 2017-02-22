/**
 * JavaScript for KwikiFAB Menu
 */
(function (mw, $) {

    var getKey = function(array, value) {
        for (var key in array) {
            val = array[key];
            if (key == value) {
                return val;
                break;
            }
        }
        return -999;
    };
    
    var isVisualEditorNotActiveted = function () {
        
        if (window.location.href.indexOf("veaction") === -1) {
            return true;   
        } else {
            return false;   
        }
    };

    function loadKwikiFAB() {
        var editTitle = {};

        /////////////////////////////////////////////////////////////////////////

        $("#content").on("click", ".new", function (e) {            

            // Check if the visual editor is active right now
            //if(!$('html').hasClass( 've-active' ) && isVisualEditorNotActiveted())

            if( isVisualEditorNotActiveted() )
            {
                e.preventDefault();
                var splitedFirst = e.currentTarget.title.split('(');
                var wgNamespaceIds = mw.config.get('wgNamespaceIds');
                var createdNamespaceId = 0;
                var createdTitle = splitedFirst[0].trim();
                var isNewRedLink = true;
                console.log("wgNamespaceIds:", wgNamespaceIds, "createdTitle:", createdTitle);

                if (createdTitle.includes(":")) {
                    var splitedSec = splitedFirst[0].split(':');
                    var namespace = splitedSec[0].trim().replace(/ /g, '_');
                    createdNamespaceId = getKey(wgNamespaceIds, namespace.toLowerCase());
                    createdTitle = splitedSec[1].trim();
                }
                
                
                editTitle = {
                    title: createdTitle,
                    namespaceId: createdNamespaceId,
                    isEdit: false,
                    selectedCategories: []
                };

                LoadCreateOrEditModal(editTitle, isNewRedLink);                
            }
        } );
        
        /////////////////////////////////////////////////////////////////////
        
        $(document).on("blur", "#md-fab-menu", function (e) {
            e.preventDefault();

            if (isVisualEditorNotActiveted()) {
                $('#md-fab-menu').attr('data-mfb-state', 'close');
            }
        });           

        ////////////////////////////////////////////////////////////////////

        $(document).on("click", "#create_toggle", function (e) {
            e.preventDefault();

            if (isVisualEditorNotActiveted()) {

                var menuState = $('#md-fab-menu').attr('data-mfb-state');
                var mfbToggleType = $('#md-fab-menu').attr('data-mfb-toggle');

                if ( menuState === 'open' ) {

                    editTitle = {
                        title: "",
                        namespaceId: 0,
                        isEdit: false,
                        selectedCategories: []
                    };
                    LoadCreateOrEditModal(editTitle);           
                }
                else {
                    $('#md-fab-menu').attr('data-mfb-state', 'open'); 
                }
            }            
        });        

        /////////////////////////////////////////////////////////////////////////

        $(document).on("click", "#ve_edit_toggle", function (e) {
            e.preventDefault();

            if (isVisualEditorNotActiveted()) {

                // pageName also include the namespace.
                var pageName = mw.config.get('wgPageName');

                var veLinkTarget =  "/w/index.php?title=" + pageName + "&veaction=edit";
                window.location = veLinkTarget;
                //$('#md-fab-menu .mfb-component__button--main').css('background-color', '#7d7c7c');
                //$('#md-fab-menu .mfb-component__button--main').css('cursor','not-allowed');
            }
        });

        /////////////////////////////////////////////////////////////////////////

        $(document).on("click", "#quick_edit_toggle", function (e) {
            e.preventDefault();
            
            ApiCheckUserInfo(function(res){             

                var currentUserInfoList = res.query.userinfo.rights;
                var isCurrentUserCanDelete = _.contains(currentUserInfoList, "delete");

                // Check if the current page is special page.
                // Or user is not currently editing a page using VisualEditor
                if ( !$('body').hasClass( "ns-special" ) && isVisualEditorNotActiveted() ) {

                    var pageTitle = mw.config.get('wgTitle');
                    // pageName also include the namespace.
                    var pageName = mw.config.get('wgPageName');
                    var pageNamespaceId = mw.config.get('wgNamespaceNumber');
                    var pageCategories = mw.config.get('wgCategories');

                    editTitle = {
                        title: pageTitle,
                        namespaceId: pageNamespaceId,
                        isEdit: true,
                        selectedCategories: pageCategories,
                        pageName: pageName,
                        isUserCanDelete: isCurrentUserCanDelete
                    };

                    LoadCreateOrEditModal(editTitle);
                }
            });            
        });        

        /////////////////////////////////////////////////////////////////////////

        
        
        /////////////////////////////////////////////////////////////////////////

    };

    $(function () {    

        var buttonsMenuData = {
            "menu-id": "md-fab-menu",
            "menu-location": "bl", // bottom-left
            "menu-toggle-event": "click",
            "main-button": [ 
                {
                    "href": "#",
                    "bg-color": isVisualEditorNotActiveted() ? "#d23f31" : "#7d7c7c",
                    "label": mw.msg('create-toggle-popup'),
                    "resting-id": "menu_toggle",
                    "resting-class-icon": "material-icons",
                    "resting-icon": "menu",
                    "active-id": "create_toggle",
                    "active-class-icon": "material-icons",
                    "active-icon": "add"
                }
            ],
            "menu-items": [                
                {
                    "id": "quick_edit_toggle",
                    "href": "#",
                    "label": mw.msg("quick-edit-toggle-popup"),
                    "bg-color": "#4CAF50",                    
                    "class-icon": "material-icons",
                    "icon": "style"
                },
                {
                    "id": "files_toggle",
                    "href": "#",
                    "label": mw.msg("files-toggle-popup"),
                    "bg-color": "#ffa726",
                    "class-icon": "material-icons",
                    "icon": "perm_media"
                },  
                {
                    "id": "ve_edit_toggle",
                    "href": "#",
                    "label": mw.msg("edit-toggle-popup"),
                    "bg-color":"#2196F3",
                    "class-icon": "material-icons",
                    "icon": "mode_edit"
                }        
            ]
        };

        MaterialAddFAB(buttonsMenuData, "body");

        loadKwikiFAB();         
    });

}(mediaWiki, jQuery));

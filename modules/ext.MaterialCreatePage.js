/**
 * JavaScript for MaterialCreatePage Menu
 */
(function (mw, $) {

    var isNewTitleVaild = true;
    var isTemplateVaild = true;
    
    function getKey(array, value) {
        for (var key in array) {
            val = array[key];
            if (key == value) {
                return val;
                break;
            }
        }
        return -999;
    }

    function apiCreatePageWithContext(api, pageTitle, content, isNew = true) {
        var textMessage = mw.msg("create-page-redirect-to-edit");
        var titleMessage = mw.msg("created-successfully");
        
        // In edit mode 
        if (!isNew ){                    
            titleMessage = mw.msg("edited-successfully");
        }

        var params = "";
        console.log("pageTitle: ", pageTitle, " content: ", content, " isNew: ", isNew);
        
        api.postWithEditToken($.extend( {
            action: 'edit',
            title: pageTitle,
            text: content,
            formatversion: '2',
            contentformat: 'text/x-wiki',
            contentmodel: 'wikitext',
            // Protect against errors and conflicts
            assert: mw.user.isAnon() ? undefined : 'user',
            createonly: isNew
        }, params )).done(function () {
            
            swal({
                title: titleMessage,
                text: textMessage,                
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: mw.msg("modal-edit-page-button"),
                cancelButtonText: mw.msg("modal-close-button"),
                confirmButtonClass: 'btn btn-success',
                cancelButtonClass: 'btn btn-info',
                buttonsStyling: false
            }).then( function() {
                window.location.href = "/w/index.php?title=" + pageTitle + "&veaction=edit";
            }, function(dismiss) {
                // dismiss can be 'cancel', 'overlay',
                // 'close', and 'timer'                
                console.log("modal closed");             
            } );

        } ).fail( function( code, result ) {
            if ( code === "http" ) {
                mw.log( "HTTP error: " + result.textStatus ); // result.xhr contains the jqXHR object
            } else if ( code === "ok-but-empty" ) {
                mw.log( "Got an empty response from the server" );
            } else {
                mw.log( "API error: " + code );
            }
        } );
    };

    function apiMovePage(api, wikiText, pageTitle, oldTitle, selectedCategoriesText, isNew) {
        
        var content = wikiText.concat(selectedCategoriesText);
        oldTitle = oldTitle.trim().replace('_', ' ');
        pageTitle = pageTitle.trim();
        
        console.log("isNew:", isNew, "pageTitle:", pageTitle, "oldTitle:", oldTitle, "content:", content);
        
        // not in edit mode and page title equal to old title.       
        if( isNew || pageTitle === oldTitle ) {            
            apiCreatePageWithContext(api, pageTitle, content, isNew);                        
        } 
        else {
            // in edit mode and page title is not equeal to old title.
            var params = "";
            console.log("from: ", oldTitle, " to: ", pageTitle);
            
            api.postWithEditToken( $.extend( {
                action: 'move',
                from: oldTitle,
                to: pageTitle,
                noredirect: true,
                formatversion: '2',
                // Protect against errors and conflicts
                assert: mw.user.isAnon() ? undefined : 'user'
            }, params ) ).done(function () {                
                apiCreatePageWithContext(api, pageTitle, content, isNew);
            } ).fail( function( code, result ) {
                if ( code === "http" ) {
                    mw.log( "HTTP error: " + result.textStatus ); // result.xhr contains the jqXHR object
                } else if ( code === "ok-but-empty" ) {
                    mw.log( "Got an empty response from the server" );
                } else {
                    mw.log( "API error: " + code );
                }
            } );
        }
    };
    
    function loadWikiTextFromPage(api, templateTitleText, pageTitle, categoriesSelector, isNew = true) {
        var wikiText = "";
        var selectedCategoriesText = "";
        var selectedCategories = categoriesSelector.getItemsData();
        
        selectedCategories.forEach(function (item) {
            selectedCategoriesText += "\n" + "[[category:" + item.toString() + "]]";
        });
        
        if ( templateTitleText ) {
            api.get( {
                formatversion: 2,
                action: 'query',
                prop: 'extracts',
                titles: templateTitleText,
                utf8: true,
                explaintext: false,
                exsectionformat: 'plain'
            } ).done(function (res) {                
                wikiText = res.query.pages[0].extract;
                apiMovePage(api, wikiText, pageTitle, templateTitleText, selectedCategoriesText, isNew);
            } ).fail( function( code, result ) {
                if ( code === "http" ) {
                    mw.log( "HTTP error: " + result.textStatus ); // result.xhr contains the jqXHR object
                } else if ( code === "ok-but-empty" ) {
                    mw.log( "Got an empty response from the server" );
                } else {
                    mw.log( "API error: " + code );
                }
            } );
        } else {
            apiCreatePageWithContext(api, pageTitle, selectedCategoriesText, isNew);
        }
    }

    function disableAbiltyToClickCreate(enabledCreateClick, input, notifyMessage) {        
        var mainButton = $("#model-main-button");
        
        if (enabledCreateClick) {
            //input.setValidityFlag(true);
            mainButton.toggleClass('oo-ui-widget-disabled', false);
            mainButton.toggleClass('oo-ui-widget-enabled', true);
            mainButton.attr('aria-disabled', false);
        } else {
            $.simplyToast(notifyMessage, 'danger');
            //input.setValidityFlag(false);
            mainButton.toggleClass('oo-ui-widget-disabled', true);
            mainButton.toggleClass('oo-ui-widget-enabled', false);
            mainButton.attr('aria-disabled', "true");
        }
    };

    function isPageTitleVaild(api, title, titleInput) {
        if ( title ) {
            api.get( {
                formatversion: 2,
                action: 'query',
                prop: 'pageprops',
                titles: title
            } ).done( function (res) {
                
                isNewTitleVaild = (Boolean(res.query.pages[0].pageid) == false);
                var notifyExistsMessage = mw.msg("modal-popup-warning-page-exists");
                disableAbiltyToClickCreate(isNewTitleVaild, titleInput, notifyExistsMessage);
                
            } ).fail( function( code, result ) {
                if ( code === "http" ) {
                    mw.log( "HTTP error: " + result.textStatus ); // result.xhr contains the jqXHR object
                } else if ( code === "ok-but-empty" ) {
                    mw.log( "Got an empty response from the server" );
                } else {
                    mw.log( "API error: " + code );
                }
            } );
        } else {
            isNewTitleVaild = false;
            var notifyMissingMessage = mw.msg("modal-popup-warning-title-missing");
            disableAbiltyToClickCreate(isNewTitleVaild, titleInput, notifyMissingMessage);
        }
    };

    function isTemplateTitleVaild(api, title, templateSelector) {
        var notifyMessage = mw.msg("modal-popup-warning-template-not-exists");

        if (title) {
            api.get( {
                formatversion: 2,
                action: 'query',
                prop: 'pageprops',
                titles: title
            } ).done(function (res) {
                isTemplateVaild = Boolean(res.query.pages[0].pageid);
                disableAbiltyToClickCreate(isTemplateVaild, templateSelector, notifyMessage);
            } ).fail( function( code, result ) {
                if ( code === "http" ) {
                    mw.log( "HTTP error: " + result.textStatus ); // result.xhr contains the jqXHR object
                } else if ( code === "ok-but-empty" ) {
                    mw.log( "Got an empty response from the server" );
                } else {
                    mw.log( "API error: " + code );
                }
            } );
        } else {
            isTemplateVaild = true;
            disableAbiltyToClickCreate(isTemplateVaild, templateSelector, notifyMessage);
        }
    };

    function loadCreatePageCombinedModal( actionMain,
                                          dialogTitle,
                                          namespacesTempletesSelector,
                                          categoriesSelector,
                                          titleInput,
                                          dialogActionButtons,
                                          editTitle,
                                          api ) {

        namespacesTempletesSelector.on("change", function (data) {
            var splitedData = data.split('#');
            var namespace = splitedData[0];
            var template = splitedData[1];
            loadSelectedTemplateCategories(api, template, categoriesSelector);
            titleInput.setNamespace(namespace);
        });

        var fieldset = new OO.ui.FieldsetLayout({
            items: [
				new OO.ui.FieldLayout(namespacesTempletesSelector, {
                    id: "modal-namespace-fieldset",
                    label: mw.msg("modal-namespace-template-selector-label"),
                    classes: ['materialFieldset'],
                    align: 'top'
                }),
				new OO.ui.FieldLayout(titleInput, {
                    id: "modal-title-fieldset",
                    label: mw.msg("modal-title-input-label"),
                    classes: ['materialFieldset'],
                    align: 'top'
                }),
				new OO.ui.FieldLayout(categoriesSelector, {
                    id: "modal-categories-fieldset",
                    label: mw.msg("modal-categories-selector-label"),
                    classes: ['materialFieldset'],
                    align: 'top'
                })
			]
        });

        var dialogHeight = 450;

        var mainFunction = function (dialog, action, windowManager) {
            var pageTitle = titleInput.getTitle();

            if (pageTitle) {                
                var isNew = false;
                
                if (action === "edit")
                {
                    loadWikiTextFromPage(api,
                                         editTitle.pageName,
                                         pageTitle.toText(),
                                         categoriesSelector, 
                                         isNew);
                    dialog.close();
                    windowManager.destroy();
                }
                else {                    
                    isPageTitleVaild(api, pageTitle.toText(), titleInput);
                    
                    if (isNewTitleVaild) {
                        var namespaceTempleteData = namespacesTempletesSelector.getValue();
                        var splitedData = namespaceTempleteData.split('#');
                        var selectedNamespace = splitedData[0];
                        var templateTitleText = splitedData[1];
                        titleInput.setNamespace(selectedNamespace);

                        isTemplateTitleVaild(api, templateTitleText, namespaceTempleteData);

                        if (isTemplateVaild) {
                            isNew = true;
                            loadWikiTextFromPage(api, 
                                                 templateTitleText,
                                                 pageTitle.toText(),
                                                 categoriesSelector,
                                                 isNew);
                            dialog.close();
                            windowManager.destroy();
                        }
                    }
                }
            } else {
                $.simplyToast(mw.msg("modal-popup-warning-title-missing"), 'danger');
            }
        };

        //title, actions, content, mainAction, mainActionFunc, windowManager, height
        MaterialDialog(
            dialogTitle,
            dialogActionButtons,
            fieldset,
            actionMain,
            mainFunction,
            dialogHeight
        );

    };
    
    function loadSelectedTemplateCategories(api, title, categoriesSelector) {
        
        var selectedCategories = []; 
        
        api.get( {
            formatversion: 2,
            action: 'query',
            prop: 'categories',
            utf8: true,
            titles: title
        } ).done(function (res) {            
            var categories = res.query.pages[0].categories;            
            categories.forEach(function (item) {
                
                var splitedData = item.title.split(':');
                var namespace = splitedData[0];
                var category = splitedData[1];
                
                // add only categories that are not selected.
                if (!selectedCategories.includes(category))
                {
                    selectedCategories.push(category);
                }
                
            });
            
            categoriesSelector.setItemsFromData( selectedCategories );
            
        } ).fail( function( code, result ) {
            if ( code === "http" ) {
                mw.log( "HTTP error: " + result.textStatus ); // result.xhr contains the jqXHR object
            } else if ( code === "ok-but-empty" ) {
                mw.log( "Got an empty response from the server" );
            } else {
                mw.log( "API error: " + code );
            }
        } );
    };

    function loadCreatePageModal( actionMain,
                                  dialogTitle,
                                  namespaceSelector,
                                  categoriesSelector,
                                  titleInput,
                                  dialogActionButtons,
                                  editTitle,
                                  api ) {

        var templateSelector = new mw.widgets.TitleInputWidget({
            id: "template-input",
            placeholder: mw.msg("modal-template-placeholder"),
            icon: 'search',
            iconTitle: mw.msg("modal-template-placeholder")
        });

        templateSelector.on("change", function(title) {
        	isTemplateTitleVaild(api, title, templateSelector);
            if (isTemplateVaild) {
                loadSelectedTemplateCategories(api, title, categoriesSelector);
            }            
        });

        namespaceSelector.on("change", function (namespace) {
            console.log(namespace);
            if (namespace) {
                titleInput.setNamespace(namespace);
            }
        });

        var fieldset = new OO.ui.FieldsetLayout({
            items: [
				new OO.ui.FieldLayout(namespaceSelector, {
                    id: "modal-namespace-fieldset",
                    label: mw.msg("modal-namespace-selector-label"),
                    classes: ['materialFieldset'],
                    align: 'top'
                }),
				new OO.ui.FieldLayout(titleInput, {
                    id: "modal-title-fieldset",
                    label: mw.msg("modal-title-input-label"),
                    classes: ['materialFieldset'],
                    align: 'top'
                }),
				new OO.ui.FieldLayout(categoriesSelector, {
                    id: "modal-categories-fieldset",
                    label: mw.msg("modal-categories-selector-label"),
                    classes: ['materialFieldset'],
                    align: 'top'
                }),
				new OO.ui.FieldLayout(templateSelector, {
                    id: "modal-template-fieldset",
                    label: mw.msg("modal-template-selector-label"),
                    classes: ['materialFieldset'],
                    align: 'top'
                })
			]
        });

        var mainFunction = function (dialog, action, windowManager) {
            var pageTitle = titleInput.getTitle();

            if (pageTitle) {
                var isNew = false;  
                
                if (action === "edit")
                {                    
                    loadWikiTextFromPage(api,
                                         editTitle.pageName,
                                         pageTitle.toText(),
                                         categoriesSelector, 
                                         isNew);
                    dialog.close();
                    windowManager.destroy();
                }
                else {                    
                
                    isPageTitleVaild(api, pageTitle.toText(), titleInput);

                    if (isNewTitleVaild) {
                        var templateTitleText = templateSelector.getTitle();

                        isTemplateTitleVaild(api, templateTitleText.toText(), templateSelector);

                        if (isTemplateVaild) {
                            isNew = true;
                            loadWikiTextFromPage(api, 
                                                 templateTitleText.toText(),
                                                 pageTitle.toText(), 
                                                 categoriesSelector,
                                                 isNew);
                            dialog.close();
                            windowManager.destroy();
                        }
                    }
                }
            } else {
                $.simplyToast(mw.msg("modal-popup-warning-title-missing"), 'danger');
            }
        };

        var dialogHeight = 500;

        //title, actions, content, mainAction, mainActionFunc, windowManager, height
        MaterialDialog(
            dialogTitle,
            dialogActionButtons,
            fieldset,
            actionMain,
            mainFunction,
            dialogHeight
        );
    };

    function loadModalElements(api, categoriesData, editTitle, wgFABNamespacesAndTempletes) {
        
        var categoriesSelector = new OO.ui.CapsuleMultiSelectWidget({
            id: "categoriesMultiSelector",
            allowArbitrary: true,
            icon: "tag",
            indicator: "down",
            iconTitle: mw.msg("modal-categories-selector-label"),
            supportsSimpleLabel: true,
            menu: {
                input: {
                    placeholder: mw.msg("modal-categories-placeholder")
                },
                filterFromInput: true,
                items: categoriesData
            }
        });
    
        var titleInput = new mw.widgets.TitleInputWidget({
            id: "title-input",
            autofocus: true,
            autocomplete: false,
            showRedlink: false,
            suggestions: false,
            value: editTitle.title,
            namespace: editTitle.namespaceId,
            placeholder: mw.msg("modal-title-input-placeholder"),
            indicator: 'required'
        });
        
        var dialogTitle = mw.msg("create-toggle-popup");
        var actionMainButtonLabel = mw.msg("modal-create-page-button");
        var actionMain = "create";
        var actionMainIcon = "add";
        
        // In edit mode
        if( editTitle.isEdit)
        {
            dialogTitle = mw.msg("edit-toggle-popup");
            actionMainButtonLabel = mw.msg("modal-edit-page-button");
            actionMain = "edit";
            actionMainIcon = "edit";            
            categoriesSelector.setItemsFromData( editTitle.selectedCategories );
        }
        
        // register a listener for an event type
        /*titleInput.on('blur', function() {
        	isPageTitleVaild(this);
        });*/

        var dialogActionButtons = [
            {
                id: "model-main-button",
                action: actionMain,
                framed: false,
                icon: actionMainIcon,
                label: actionMainButtonLabel,
                iconTitle: actionMainButtonLabel,
                flags: ['other', 'progressive']
		},
            {
                id: "model-close-button",
                action: 'close',
                framed: false,
                icon: 'close',
                iconTitle: mw.msg("modal-close-button"),
                flags: 'safe'
		}];

        var namespaceSelector = new OO.ui.DropdownInputWidget({
            dropdown: {
                icon: "code",
                label: mw.msg("modal-namespace-selector-label"),
                iconTitle: mw.msg("modal-namespace-selector-label")
            }
        });
        
        var namespacesOptions = new Array();
        var selectedItem = "";
        
        if (wgFABNamespacesAndTempletes.length > 0) {

            wgFABNamespacesAndTempletes.map( function (item) { 
                
                var option = new OO.ui.MenuOptionWidget( {
                    data: item.namespace + '#' + item.templete,
                    label: item.title
                } );
                
                if ( item.namespace == editTitle.namespaceId ) {
                    selectedItem = option.data;
                } 
                                            
                namespacesOptions.push(option);
            } );

            namespaceSelector.setOptions(namespacesOptions);
            
            if (selectedItem) {
                namespaceSelector.setValue(selectedItem);
            }
                        
            loadCreatePageCombinedModal(actionMain,
                                        dialogTitle, 
                                        namespaceSelector, 
                                        categoriesSelector, 
                                        titleInput, 
                                        dialogActionButtons,
                                        editTitle,
                                        api);            
        } else {
          
            var namespaces = mw.config.get('wgFormattedNamespaces');            
            Object.keys(namespaces).forEach(function(key) {                
                var option = new OO.ui.MenuOptionWidget( {
                    data: key,
                    label: namespaces[key]
                } );
                
                if ( key == editTitle.namespaceId ) {
                    //console.log(option);
                    selectedItem = option.data;
                }
                namespacesOptions.push(option);
            });
            
            namespaceSelector.setOptions(namespacesOptions);

            if (selectedItem) {
                namespaceSelector.setValue(selectedItem);
            }

            loadCreatePageModal(actionMain,
                                dialogTitle,
                                namespaceSelector,
                                categoriesSelector, 
                                titleInput, 
                                dialogActionButtons,
                                editTitle,
                                api);            
        }
    }

    function loadApiCategoriesData(editTitle, wgFABNamespacesAndTempletes) {
        var api = new mw.Api();
        var categoriesData = new Array();

        api.get( {
            formatversion: 2,
            action: 'query',
            prop: 'categories',
            aclimit: 5000,
            list: 'allcategories'
        } ).done(function (res) {
            var categories = res.query.allcategories;
            categories.map(function (item) {
                categoriesData.push(
                    new OO.ui.MenuOptionWidget({
                        data: item.category,
                        label: item.category,
                    })
                );                
            } );
            
            loadModalElements(api, categoriesData, editTitle, wgFABNamespacesAndTempletes);
            
        } ).fail( function( code, result ) {
            if ( code === "http" ) {
                mw.log( "HTTP error: " + result.textStatus ); // result.xhr contains the jqXHR object
            } else if ( code === "ok-but-empty" ) {
                mw.log( "Got an empty response from the server" );
            } else {
                mw.log( "API error: " + code );
            }
        } );     
    };

    function loadMaterialCreatePage() {

        var editTitle = {
            title: "",
            namespaceId: 0, 
            isEdit: false,
            selectedCategories: []
        };

        var menu = mw.template.get("ext.MaterialFAB", "menu.mustache");

        var createPageMenuData = {
            "menu-id": "md-fab-menu",
            "menu-location": "br", // bottom-right
            "menu-toggle-event": "hover",
            "main-button": [{
                "href": "#",
                "bg-color": "#d23f31",
                "label": mw.msg('create-toggle-popup'),
                "resting-id": "add_toggle",
                "resting-class-icon": "material-icons",
                "resting-icon": "menu",
                "active-id": "create_toggle",
                "active-class-icon": "material-icons",
                "active-icon": "add"
			}],
            "menu-items": [
            {
                "id": "edit_toggle",
                "href": "#",
                "label": mw.msg("edit-toggle-popup"),
                "bg-color": "#4CAF50",                    
                "class-icon": "material-icons",
                "icon": "mode_edit"
            },
            {
                "id": "files_toggle",
                "href": "#",
                "label": mw.msg("files-toggle-popup"),
                "bg-color": "#ffc107",
                "class-icon": "material-icons",
                "icon": "perm_media"
			},
            {
                "id": "upload_toggle",
                "href": "#",
                "label": mw.msg("upload-toggle-popup"),
                "bg-color": "#2196F3",
                "class-icon": "material-icons",
                "icon": "cloud_upload"
            }]
        };

        var randeredMenu = menu.render(createPageMenuData);
        
        $("body").append(randeredMenu);

        var wgFABNamespacesAndTempletes = mw.config.get('wgFABNamespacesAndTempletes');
        
        /////////////////////////////////////////////////////////////////////////
        
        $(document).on("click", "#create_toggle", function (e) {
            e.preventDefault();
            loadApiCategoriesData(editTitle, wgFABNamespacesAndTempletes);
        });
        
        /////////////////////////////////////////////////////////////////////////
        
        $(document).on("click", "#edit_toggle", function (e) {
            e.preventDefault();
            
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
                pageName: pageName
            };
            
            loadApiCategoriesData(editTitle, wgFABNamespacesAndTempletes);
        });
        
        /////////////////////////////////////////////////////////////////////////
        
        $(document).on("click", ".new", function (e) {
            e.preventDefault();
            
            var splitedFirst = e.currentTarget.title.split('(');
            var wgNamespaceIds = mw.config.get('wgNamespaceIds');
            var createdNamespaceId = 0;
            var createdTitle = splitedFirst[0].trim();

            if (createdTitle.includes(":")) {
                var splitedSec = splitedFirst[0].split(':');
                var namespace = splitedSec[0].trim().replace(' ', '_');

                createdNamespaceId = getKey(wgNamespaceIds, namespace);
                createdTitle = splitedSec[1].trim();
            }

            editTitle = {
                title: createdTitle,
                namespaceId: createdNamespaceId,
                isEdit: false,
                selectedCategories: []
            };

            if (wgFABNamespacesAndTempletes.length > 0) {
                var isNamespaceExist = false;

                wgFABNamespacesAndTempletes.forEach(function (item) {
                    if (item.namespace == editTitle.namespaceId) {
                        isNamespaceExist = true;
                    }
                });

                if (isNamespaceExist) {                    
                    loadApiCategoriesData(editTitle, wgFABNamespacesAndTempletes);
                } else {                    
                    window.location = e.target.href;
                }

            } else {
                window.location = e.target.href;
            }
        });
    };

    $(function () { 
        loadMaterialCreatePage();        
    });

}(mediaWiki, jQuery));

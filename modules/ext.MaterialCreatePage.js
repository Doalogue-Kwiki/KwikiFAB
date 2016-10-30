/**
 * JavaScript for MaterialCreatePage Menu
 */
(function (mw, $) {
    
    var isNewTitleVaild = true;
    var isTemplateVaild = true;

    var api = new mw.Api();
    var categoriesData = new Array();
    loadApiCategoriesData();
    

    var categoriesSelector;

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

    var apiCreatePageWithContext = function(pageTitle, content, isNew = true) {
        var textMessage = mw.msg("create-page-redirect-to-edit");
        var titleMessage = mw.msg("created-successfully");

        // In edit mode 
        if (!isNew) {
            titleMessage = mw.msg("edited-successfully");
        }

        var params = "";

        api.postWithEditToken($.extend({
            action: 'edit',
            title: pageTitle,
            text: content,
            formatversion: '2',
            contentformat: 'text/x-wiki',
            contentmodel: 'wikitext',
            // Protect against errors and conflicts
            assert: mw.user.isAnon() ? undefined : 'user',
            createonly: isNew
        }, params)).done(function () {
            swal( {
                title: titleMessage,
                showCancelButton: false,
                confirmButtonColor: '#3085d6',
                confirmButtonText: mw.msg("modal-close-button"),
                buttonsStyling: true
            } ).then(function () {
                window.location.reload();
            } );

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

    function apiMovePage(wikiText, pageTitle, oldTitle, selectedCategoriesText, isNew) {

        var content = wikiText.concat(selectedCategoriesText);
        oldTitle = oldTitle.trim().replace(/_/g, ' ');
        pageTitle = pageTitle.trim();

        // not in edit mode and page title equal to old title.       
        if (isNew || pageTitle === oldTitle) {
            apiCreatePageWithContext( pageTitle, content, isNew);
        } else {
            // in edit mode and page title is not equeal to old title.
            var params = "";

            api.postWithEditToken($.extend({
                action: 'move',
                from: oldTitle,
                to: pageTitle,
                noredirect: false,
                formatversion: '2',
                // Protect against errors and conflicts
                assert: mw.user.isAnon() ? undefined : 'user'
            }, params)).done(function () {
                apiCreatePageWithContext( pageTitle, content, isNew);
            }).fail(function (code, result) {
                if (code === "http") {
                    mw.log("HTTP error: " + result.textStatus); // result.xhr contains the jqXHR object
                } else if (code === "ok-but-empty") {
                    mw.log("Got an empty response from the server");
                } else {
                    mw.log("API error: " + code);
                }
            });
        }
    };

    function removeCategoriesFromWikiText(wikiText, categories) {
        // Text modification
        function replaceByBlanks(match) {
            // /./ doesn't match linebreaks. /(\s|\S)/ does.
            return match.replace(/(\s|\S)/g, '');         
        }

        //var findCatsRE = new RegExp('\[\[((category|קטגוריה):[^|]+)\]\]', 'i');

        for ( index in categories ) {
            var category = categories[index].replace(/_/g, ' ');
            var findCatRE = new RegExp('(\\[\\[(.*:' + category + ')\\]\\])', 'g'); 
            wikiText = wikiText.replace(findCatRE, replaceByBlanks);
            wikiText = wikiText.trim();
        }  
        return wikiText;
    };

    function loadWikiTextFromPage(templateTitleText, pageTitle, isNew = true) {
        var wikiText = "";
        var selectedCategoriesText = "";
        var selectedCategories = categoriesSelector.getValue();

        selectedCategories.forEach(function (item) {
            selectedCategoriesText += "\n" + "[[category:" + item.toString() + "]]";
        });

        if (templateTitleText) {            
            api.get({
                formatversion: 2,
                action: 'parse',
                prop: 'categories|wikitext',
                page: templateTitleText,
                list: 'allcategories',
                utf8: true
            }).done(function (res) {
                var templateWikiText = res.parse.wikitext;
                var categories = res.parse.categories;
                var templateCategories = [];                       
                categories.map(function (item) {
                    templateCategories.push(item.category);
                });

                // Wiki Text Without Categories.
                var wikiText = removeCategoriesFromWikiText(templateWikiText, templateCategories);                
                apiMovePage( wikiText, pageTitle, templateTitleText, selectedCategoriesText, isNew);

            }).fail(function (code, result) {
                if (code === "http") {
                    mw.log("HTTP error: " + result.textStatus); // result.xhr contains the jqXHR object
                } else if (code === "ok-but-empty") {
                    mw.log("Got an empty response from the server");
                } else {
                    mw.log("API error: " + code);
                }
            });  
        } else {
            apiCreatePageWithContext(pageTitle, selectedCategoriesText, isNew);
        }
    }

    function disableAbiltyToClickCreate(enabledCreateClick, input, notifyMessage, isNotifyDisplay) {
        var mainButton = $("#model-main-button");

        if (enabledCreateClick) {
            //input.setValidityFlag(true);
            mainButton.toggleClass('oo-ui-widget-disabled', false);
            mainButton.toggleClass('oo-ui-widget-enabled', true);
            mainButton.attr('aria-disabled', false);
        } else {
            // showing notify message only after submiting all the data.
            if (isNotifyDisplay) {
                $.simplyToast(notifyMessage, 'danger');
            }
            //input.setValidityFlag(false);
            mainButton.toggleClass('oo-ui-widget-disabled', true);
            mainButton.toggleClass('oo-ui-widget-enabled', false);
            mainButton.attr('aria-disabled', "true");
        }
    };

    function isPageTitleVaild(title, titleInput, isNotifyDisplay = false) {
        if (title) {
            api.get({
                formatversion: 2,
                action: 'query',
                prop: 'pageprops',
                titles: title
            }).done(function (res) {

                isNewTitleVaild = (Boolean(res.query.pages[0].pageid) == false);
                var notifyExistsMessage = mw.msg("modal-popup-warning-page-exists");
                disableAbiltyToClickCreate(isNewTitleVaild, titleInput, notifyExistsMessage, isNotifyDisplay);

            }).fail(function (code, result) {
                if (code === "http") {
                    mw.log("HTTP error: " + result.textStatus); // result.xhr contains the jqXHR object
                } else if (code === "ok-but-empty") {
                    mw.log("Got an empty response from the server");
                } else {
                    mw.log("API error: " + code);
                }
            });
        } else {
            isNewTitleVaild = false;
            var notifyMissingMessage = mw.msg("modal-popup-warning-title-missing");
            disableAbiltyToClickCreate(isNewTitleVaild, titleInput, notifyMissingMessage, isNotifyDisplay);
        }
    };

    function isTemplateTitleVaild(title, templateSelector, isNotifyDisplay = false) {
        var notifyMessage = mw.msg("modal-popup-warning-template-not-exists");

        if (title) {
            api.get({
                formatversion: 2,
                action: 'query',
                prop: 'pageprops',
                titles: title
            }).done(function (res) {
                isTemplateVaild = Boolean(res.query.pages[0].pageid);
                disableAbiltyToClickCreate(isTemplateVaild, templateSelector, notifyMessage, isNotifyDisplay);
            }).fail(function (code, result) {
                if (code === "http") {
                    mw.log("HTTP error: " + result.textStatus); // result.xhr contains the jqXHR object
                } else if (code === "ok-but-empty") {
                    mw.log("Got an empty response from the server");
                } else {
                    mw.log("API error: " + code);
                }
            });
        } else {
            isTemplateVaild = true;
            disableAbiltyToClickCreate(isTemplateVaild, templateSelector, notifyMessage, isNotifyDisplay);
        }
    };

    function loadCreatePageCombinedModal( actionMain,
                                          dialogTitle,
                                          namespacesTemplatesSelector,
                                          categoriesInputSelector,
                                          titleInput,
                                          dialogActionButtons,
                                          editTitle ) {

        var fieldset = new OO.ui.FieldsetLayout();

        // In create mode
        if (!editTitle.isEdit)
        {
            namespacesTemplatesSelector.on("change", function (data) {
                var splitedData = data.split('#');
                var namespace = splitedData[0];
                var template = splitedData[1];
                loadSelectedTemplateCategories(template);
                titleInput.setNamespace(namespace);
            });

            fieldset.addItems( [
                new OO.ui.FieldLayout(namespacesTemplatesSelector, {
                    id: "modal-namespace-fieldset",
                    label: mw.msg("modal-namespace-template-selector-label"),
                    classes: ['materialFieldset'],
                    align: 'top'
                } )
            ] );
        }

        fieldset.addItems( [                
            new OO.ui.FieldLayout(titleInput, {
                id: "modal-title-fieldset",
                label: mw.msg("modal-title-input-label"),
                classes: ['materialFieldset'],
                align: 'top'
            }),
            new OO.ui.FieldLayout(categoriesInputSelector, {
                id: "modal-categories-fieldset",
                label: mw.msg("modal-categories-selector-label"),
                classes: ['materialFieldset'],
                align: 'top'
            })
        ] );

        var dialogHeight = 450;

        var mainFunction = function (dialog, action, windowManager) {
            var pageTitle = titleInput.getTitle();

            if (pageTitle) {
                var isNew = false;

                if (action === "edit") {
                    loadWikiTextFromPage( editTitle.pageName,
                                         pageTitle.toText(),                                         
                                         isNew );
                    dialog.close();
                    windowManager.destroy();                    
                } 
                else if (action === "create") {
                    isPageTitleVaild(pageTitle.toText(), titleInput, true);

                    if (isNewTitleVaild) {
                        var namespaceTemplateData = namespacesTemplatesSelector.getValue();
                        var splitedData = namespaceTemplateData.split('#');
                        var selectedNamespace = splitedData[0];
                        var templateTitleText = splitedData[1];
                        titleInput.setNamespace(selectedNamespace);

                        isTemplateTitleVaild(templateTitleText, namespacesTemplatesSelector, true);

                        if (isTemplateVaild) {
                            isNew = true;
                            loadWikiTextFromPage( templateTitleText,
                                                 pageTitle.toText(),                                                 
                                                 isNew );
                            dialog.close();
                            windowManager.destroy();
                        }
                    }
                }
                else if (action === "redirect") {
                    window.location.href = "/w/index.php?title=" + pageTitle;
                    dialog.close();
                    windowManager.destroy();
                }
            } else {
                $.simplyToast(mw.msg("modal-popup-warning-title-missing"), 'danger');
            }
        };

        MaterialDialog(
            dialogTitle,
            dialogActionButtons,
            fieldset,
            mainFunction,
            dialogHeight
        );

    };

    function loadSelectedTemplateCategories(templateTitle) {
        var selectedCategories = [];
        if (templateTitle) {
            api.get( {
                formatversion: 2,
                action: 'parse',
                prop: 'categories',
                page: templateTitle,
                //list: 'allcategories',
                utf8: true
            } ).done(function (res) {
                var categories = res.parse.categories;
                categories.map(function (item) {
                    // add only categories that are not selected.
                    if (!selectedCategories.includes(item.category)) {
                        selectedCategories.push(item.category);
                    }
                });           
                categoriesSelector.setValue(selectedCategories);                    
            } ).fail(function (code, result) {
                if (code === "http") {
                    mw.log("HTTP error: " + result.textStatus); // result.xhr contains the jqXHR object
                } else if (code === "ok-but-empty") {
                    mw.log("Got an empty response from the server");
                } else {
                    mw.log("API error: " + code);
                }
            } );
        } else {
            categoriesSelector.setValue(selectedCategories);    
        }
    };

    function loadCreatePageModal( actionMain,
                                   dialogTitle,
                                   namespaceSelector,
                                   categoriesInputSelector,
                                   titleInput,
                                   dialogActionButtons,
                                   editTitle ) {

        var templateSelector = "";

        var fieldset = new OO.ui.FieldsetLayout();
        var titleLabelMsg = mw.msg("modal-title-rename-input-label");
        
        // In create mode
        if (!editTitle.isEdit)
        {
            titleLabelMsg = mw.msg("modal-title-input-label");
            templateSelector = new mw.widgets.TitleInputWidget({
                id: "template-input",
                placeholder: mw.msg("modal-template-placeholder"),
                icon: 'search',
                iconTitle: mw.msg("modal-template-placeholder")
            });

            templateSelector.on("change", function (templateTitle) {

                loadSelectedTemplateCategories(templateTitle);

                var pageTitle = titleInput.getTitle();

                if ( pageTitle ) {
                    pageTitle = pageTitle.toText();
                }

                isPageTitleVaild( pageTitle, titleInput, false );
            });

            fieldset.addItems( [
                new OO.ui.FieldLayout(templateSelector, {
                    id: "modal-template-fieldset",
                    label: mw.msg("modal-template-selector-label"),
                    classes: ['materialFieldset'],
                    align: 'top'
                } )
            ] );
        }

        fieldset.addItems( [
            new OO.ui.FieldLayout( namespaceSelector, {
                id: "modal-namespace-fieldset",
                label: mw.msg("modal-namespace-selector-label"),
                classes: ['materialFieldset'],
                align: 'top'
            } ),
            new OO.ui.FieldLayout(titleInput, {
                id: "modal-title-fieldset",
                label: titleLabelMsg,
                classes: ['materialFieldset'],
                align: 'top'
            } ),
            new OO.ui.FieldLayout(categoriesInputSelector, {
                id: "modal-categories-fieldset",
                label: mw.msg("modal-categories-selector-label"),
                classes: ['materialFieldset'],
                align: 'top'
            } )
        ] );

        var mainFunction = function (dialog, action, windowManager) {
            var pageTitle = titleInput.getTitle();

            if (pageTitle) {
                var isNew = false;

                if (action === "edit") {
                    loadWikiTextFromPage(editTitle.pageName,
                                         pageTitle.toText(),                                         
                                         isNew);
                    dialog.close();
                    windowManager.destroy();
                } 
                else if (action === "create") {

                    isPageTitleVaild(pageTitle.toText(), titleInput, true);
                    var templateTitleText = "";

                    if (isNewTitleVaild) {

                        // In Create mode
                        if (templateSelector)
                        {
                            templateTitleText = templateSelector.getTitle();
                        }

                        if (templateTitleText) {                            
                            isTemplateTitleVaild( templateTitleText.toText(), templateSelector, true);

                            if (isTemplateVaild) {
                                isNew = true;
                                loadWikiTextFromPage(
                                    templateTitleText.toText(),
                                    pageTitle.toText(),                                                     
                                    isNew);
                                dialog.close();
                                windowManager.destroy();
                            }
                        } else {
                            isNew = true;
                            loadWikiTextFromPage("",
                                                 pageTitle.toText(),                                                 
                                                 isNew);
                            dialog.close();
                            windowManager.destroy();
                        }
                    }
                }
                else if (action === "redirect") {
                    window.location.href = "/w/index.php?title=" + pageTitle;
                    dialog.close();
                    windowManager.destroy();
                }
            } else {
                $.simplyToast(mw.msg("modal-popup-warning-title-missing"), 'danger');
            }
        };

        var dialogHeight = 550;

        MaterialDialog(
            dialogTitle,
            dialogActionButtons,
            fieldset,
            mainFunction,
            dialogHeight
        );
    };

    function loadModalElements(editTitle, wgFABNamespacesAndTemplates, isNewRedLink = false) {

        var categoriesInputSelector =  new OO.ui.LabelWidget( {            
            id: "categoriesSelector",
            label: $( '<input id="categoriesSelector" type="text">' )
        } );

        var titleInput = new mw.widgets.TitleInputWidget({
            id: "title-input",
            autofocus: true,
            autocomplete: false,
            showRedlink: false,
            suggestions: false,
            disabled: isNewRedLink,
            value: editTitle.title,
            namespace: editTitle.namespaceId,
            placeholder: mw.msg("modal-title-input-placeholder"),
            indicator: 'required'
        } );

        var dialogTitle = mw.msg("create-toggle-popup");
        var actionMainButtonLabel = mw.msg("modal-create-page-button");
        var actionMainButtonIconTitle = mw.msg("modal-create-save-popup");
        var actionMain = "create";
        var actionMainIcon = "add";

        // In edit mode
        if (editTitle.isEdit) {
            dialogTitle = mw.msg("quick-edit-toggle-popup");
            actionMainButtonLabel = mw.msg("modal-save-page-button");
            actionMainButtonIconTitle = mw.msg("modal-edit-save-popup");
            actionMain = "edit";
            actionMainIcon = "edit";
        }

        var dialogActionButtons = [
            {
                id: "model-close-button",
                action: 'close',
                framed: false,
                icon: 'close',
                iconTitle: mw.msg("modal-close-button"),
                flags: 'safe'
            },
            {
                id: "model-main-button",
                action: actionMain,
                framed: true,
                icon: actionMainIcon,
                label: actionMainButtonLabel,
                iconTitle: actionMainButtonIconTitle,
                flags: ['primary', 'progressive']
            }
           ];
                
        if ( isNewRedLink ) {        
            var redirectButton = {
                id: "redirect-ve-button",
                action: 'redirect',
                framed: false,
                icon: 'articleRedirect',
                label: mw.msg("modal-redirect-ve-button"),
                iconTitle: mw.msg("modal-redirect-ve-button"),
                flags: ['safe', 'destructive']
            };
            
            dialogActionButtons.push(redirectButton);
        }
        
        var namespaceSelector = new OO.ui.DropdownInputWidget( {
            disabled: isNewRedLink,
            dropdown: {
                icon: "code",
                label: mw.msg("modal-namespace-selector-label"),
                iconTitle: mw.msg("modal-namespace-selector-label")
            }
        } );

        var namespacesOptions = new Array();
        var selectedItem = "";

        if (wgFABNamespacesAndTemplates.length > 0) {

            wgFABNamespacesAndTemplates.map(function (item) {

                var option = new OO.ui.MenuOptionWidget({
                    data: item.namespace + '#' + item.template,
                    label: item.title
                });

                if (item.namespace == editTitle.namespaceId) {
                    selectedItem = option.data;
                }

                namespacesOptions.push(option);
            });

            namespaceSelector.setOptions(namespacesOptions);

            if (selectedItem) {
                namespaceSelector.setValue(selectedItem);
            }            

            loadCreatePageCombinedModal(actionMain,
                                        dialogTitle,
                                        namespaceSelector,
                                        categoriesInputSelector,
                                        titleInput,
                                        dialogActionButtons,
                                        editTitle);
        } else {

            var namespaces = mw.config.get('wgFormattedNamespaces');
            Object.keys(namespaces).forEach(function (key) {
                var option = new OO.ui.MenuOptionWidget({
                    data: key,
                    label: namespaces[key]
                });

                if (key == editTitle.namespaceId) {
                    selectedItem = option.data;
                }
                namespacesOptions.push(option);
            });

            namespaceSelector.setOptions(namespacesOptions);

            if (selectedItem) {
                namespaceSelector.setValue(selectedItem);
            }

            namespaceSelector.on("change", function (namespace) {                
                titleInput.setNamespace(namespace);                
            });

            loadCreatePageModal(actionMain,
                                dialogTitle,
                                namespaceSelector,
                                categoriesInputSelector,
                                titleInput,
                                dialogActionButtons,
                                editTitle);

        }

        categoriesSelector = $('#categoriesSelector').magicSuggest( {        
            sortOrder: 'name',
            data: categoriesData,
            value: editTitle.selectedCategories,
            noSuggestionText: mw.msg("modal-categories-no-suggestion"),
            placeholder: mw.msg("modal-categories-placeholder"),
            toggleOnClick: true,
            strictSuggest: true,
            maxDropHeight: 150,
            useCommaKey: false,
            selectionStacked: true            
        } );
    }

    function loadApiCategoriesData() {

        api.get({
            formatversion: 2,
            action: 'query',
            prop: 'categories',
            aclimit: 5000,
            list: 'allcategories'
        }).done(function (res) {            
            var categories = res.query.allcategories;
            categories.map(function (item) {
                categoriesData.push( {
                    id: item.category,
                    name: item.category
                } );
            });

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

    function loadMaterialCreatePage() {

        var editTitle = {};

        var wgFABNamespacesAndTemplates = mw.config.get('wgFABNamespacesAndTemplates');

        /////////////////////////////////////////////////////////////////////////

        $(document).on("click", "#create_toggle", function (e) {
            editTitle = {
                title: "",
                namespaceId: 0,
                isEdit: false,
                selectedCategories: []
            };

            e.preventDefault();
            loadModalElements(editTitle, wgFABNamespacesAndTemplates);
        });

        /////////////////////////////////////////////////////////////////////////

        $(document).on("click", "#ve_edit_toggle", function (e) {
            e.preventDefault();

            // pageName also include the namespace.
            var pageName = mw.config.get('wgPageName');
            
            var veLinkTarget =  "/w/index.php?title=" + pageName + "&veaction=edit";
            window.location = veLinkTarget;
        });

        /////////////////////////////////////////////////////////////////////////
        
        $(document).on("click", "#quick_edit_toggle", function (e) {
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

            loadModalElements(editTitle, wgFABNamespacesAndTemplates);
        });


        /////////////////////////////////////////////////////////////////////////

        $("#content").on("click", ".new", function (e) {            
            
            // Check if the visual editor is active right now
            if(!$('html').hasClass( 've-active' ))
            {
                e.preventDefault();
                var splitedFirst = e.currentTarget.title.split('(');
                var wgNamespaceIds = mw.config.get('wgNamespaceIds');
                var createdNamespaceId = 0;
                var createdTitle = splitedFirst[0].trim();
                var isNewRedLink = true;

                if (createdTitle.includes(":")) {
                    var splitedSec = splitedFirst[0].split(':');
                    var namespace = splitedSec[0].trim().replace(/ /g, '_');

                    createdNamespaceId = getKey(wgNamespaceIds, namespace);
                    createdTitle = splitedSec[1].trim();
                }

                editTitle = {
                    title: createdTitle,
                    namespaceId: createdNamespaceId,
                    isEdit: false,
                    selectedCategories: []
                };

                if (wgFABNamespacesAndTemplates.length > 0) {
                    var isNamespaceExist = false;

                    wgFABNamespacesAndTemplates.forEach(function (item) {
                        if (item.namespace == editTitle.namespaceId) {
                            isNamespaceExist = true;
                        }
                    });

                    if (isNamespaceExist) {
                        loadModalElements(editTitle, wgFABNamespacesAndTemplates, isNewRedLink);
                    } else {
                        window.location = e.target.href;
                    }

                } else {
                    loadModalElements(editTitle, wgFABNamespacesAndTemplates, isNewRedLink);
                }
            }
        } );
    };

    function loadMaterialFAB(isEnabled = true) {

        var menu = mw.template.get("ext.MaterialFAB", "menu.mustache");
        var disabledBtnColor = "#cacaca";

        var createPageMenuData = {
            "menu-id": "md-fab-menu",
            "menu-location": "br", // bottom-right
            "menu-toggle-event": "hover",
            "main-button": [ 
                {
                    "href": "#",
                    "bg-color": (isEnabled ? "#d23f31" : disabledBtnColor),
                    "label": mw.msg('create-toggle-popup'),
                    "resting-id": "add_toggle",
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
                    "bg-color": (isEnabled ? "#4CAF50" : disabledBtnColor),                    
                    "class-icon": "material-icons",
                    "icon": "style"
                },
                {
                    "id": "files_toggle",
                    "href": "#",
                    "label": mw.msg("files-toggle-popup"),
                    "bg-color": (isEnabled ? "#ffa726" : disabledBtnColor),
                    "class-icon": "material-icons",
                    "icon": "perm_media"
                },  
                {
                    "id": "ve_edit_toggle",
                    "href": "#",
                    "label": mw.msg("edit-toggle-popup"),
                    "bg-color": (isEnabled ? "#2196F3" : disabledBtnColor),
                    "class-icon": "material-icons",
                    "icon": "mode_edit"
                }
            ]
        };

        var randeredMenu = menu.render(createPageMenuData);

        $("body").append(randeredMenu);   
    }

    $(function () {        
        loadMaterialFAB(true);        
        loadMaterialCreatePage();        
    });
    
    window.EditOrCreatePage = apiCreatePageWithContext;
    

}(mediaWiki, jQuery));

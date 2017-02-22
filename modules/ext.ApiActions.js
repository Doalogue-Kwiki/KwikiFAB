/**
 * JavaScript for Kwiki API Actions
 */
(function (mw, $) {

    var api = new mw.Api();
    var params = "";

    /**
    * Callback function in case api fail.
    */
    
    var failFunc = function (code, result) {
        if (code === "http") {
            mw.log("HTTP error: " + result.textStatus); // result.xhr contains the jqXHR object
        } else if (code === "ok-but-empty") {
            mw.log("Got an empty response from the server");
        } else {
            mw.log("API error: " + code);
        }
    };
    
    /**
     * API Check Is Selected Title Is Vaild.
     */
    var checkIsTitleVaild = function (title, callbackFunc) {
        
        api.get({
            formatversion: 2,
            action: 'query',
            prop: 'pageprops',
            titles: title
        }).done(callbackFunc).fail(failFunc);  
    };

    /**
     * API load wiki text and categories from template page.
     */
    var loadTemplatePageWikiTextAndCategories = function (pageTitle, callbackFunc) {

        api.get({
            formatversion: 2,
            action: 'parse',
            prop: 'categories|wikitext',
            page: pageTitle,
            utf8: true
        }).done(callbackFunc).fail(failFunc);
    };
    
    /**
     * API load wiki text and categories from template page.
     */
    var loadSelectedTemplateCategories = function (templateTitle, callbackFunc) {
        api.get( {
            formatversion: 2,
            action: 'parse',
            prop: 'categories',
            page: templateTitle,
            utf8: true
        } ).done(callbackFunc).fail(failFunc);
    };

    /**
     * API load wiki text and categories from template page.
     */
    var loadCategoriesData = function(callbackFunc) {
        api.get({
            formatversion: 2,
            action: 'query',
            prop: 'categories',
            aclimit: 5000,
            list: 'allcategories'
        }).done(callbackFunc).fail(failFunc);
    };
    
    /**
     * API check current user info.
     */
    var checkUserInfo = function(callbackFunc) {       
        api.get({
            formatversion: 2,
            action: 'query',
            meta: 'userinfo',
            uiprop: 'rights'
        }).done(callbackFunc).fail(failFunc);
    };
    
    /**
     * API create new page with context.
     */
    var editOrCreateNewPageWithContext = function(pageTitle, content, isNewPage) {
        var textMessage = mw.msg("create-page-redirect-to-edit");
        var titleMessage = mw.msg("edited-successfully");

        if(isNewPage) {
            titleMessage = mw.msg("created-successfully");
        }
        
        api.postWithEditToken($.extend({
            action: 'edit',
            title: pageTitle,
            text: content,
            formatversion: '2',
            contentformat: 'text/x-wiki',
            contentmodel: 'wikitext',
            // Protect against errors and conflicts
            assert: mw.user.isAnon() ? undefined : 'user',
            createonly: false
        }, params)).done(function () {
            
            if (isNewPage){                
                swal( {
                    title: titleMessage,
                    text: textMessage,
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: mw.msg("modal-continue-to-page"),
                    cancelButtonText: mw.msg("modal-close-button"),
                    buttonsStyling: true
                } ).then(function () {
                    window.location.href = "/w/index.php?title=" + pageTitle + "&veaction=edit";                
                }, function (dismiss) {
                    // dismiss can be 'cancel', 'overlay',
                    // 'close', and 'timer'                
                    window.location.reload(true);
                } );
            } else {
                $.simplyToast(titleMessage, 'success'); 

                setTimeout(function(){
                    window.location.href = "/" + pageTitle;
                    window.location.reload(true);
                }, 1500);
            }
        }).fail(failFunc);  
    };
    
    /**
     * API Move / Rename page.
     */
    var renamePage = function(pageTitle, oldTitle, callbackFunc) {
        api.postWithEditToken($.extend({
            action: 'move',
            from: oldTitle,
            to: pageTitle,
            noredirect: false,
            formatversion: '2',
            // Protect against errors and conflicts
            assert: mw.user.isAnon() ? undefined : 'user'
        }, params)).done(callbackFunc).fail(failFunc);        
    };
    
    /**
     * API load all flies data.
     */
    var loadAllFilesData = function(callbackFunc) {
        api.get({
            formatversion: 2,
            action: 'query',
            ailimit: 500,
            list: 'allimages',
            utf8: true,
            aisort: 'timestamp',
            aidir: 'descending',
            aiprop: 'url|comment|timestamp|user'
        }).done(callbackFunc).fail(failFunc);
    };
    
    /**
     * API load files page usage.
     */
    var loadFilesUsage = function(allFilesTitles, callbackFunc) {
        api.get({
            formatversion: 2,
            action: 'query',
            prop: 'fileusage',
            formatversion: '2',
            titles: allFilesTitles,
            fulimit: 500,
            utf8: true
        }).done(callbackFunc).fail(failFunc);
    };
    
    /**
     * API reload pages use purges.
     */
    var reloadPurge = function( formatedTitles, callbackFunc) {
        api.get({
            formatversion: 2,
            action: 'purge',
            titles: formatedTitles,            
            forcelinkupdate: true,
            utf8: true
        }).done(callbackFunc).fail(failFunc);
    };
    
    /**
     * API delete page.
     */
    var deletePage = function( pageTitle ) {

        var modalMsg = '[' + pageTitle + ']' + mw.msg("modal-delete-message");

        api.postWithEditToken($.extend({
            action: 'delete',
            title: pageTitle,
            formatversion: '2',
            // Protect against errors and conflicts
            assert: mw.user.isAnon() ? undefined : 'user'
        }, params)).done(function () {
            
            reloadPurge(pageTitle, function () {                    
                window.location.reload(true);                
                swal(
                    mw.msg("modal-delete-title"),
                    modalMsg
                );
            });

        }).fail(failFunc);
    };
    

    var loadPageWikiText = function (pageTitle, callbackFunc) {  

        api.get({
            formatversion: 2,
            action: 'parse',
            prop: 'wikitext',
            page: pageTitle,
            utf8: true
        }).done(callbackFunc).fail(failFunc);
    };

    /////////////////////////////////////////////////////////////////////
    
    window.ApiRenamePage = renamePage;
    window.ApiCheckIsTitleVaild = checkIsTitleVaild;
    window.ApiLoadAllCategories = loadCategoriesData;
    window.ApiLoadTemplateCategories = loadSelectedTemplateCategories;
    window.ApiLoadTemplateWikiTextAndCategories = loadTemplatePageWikiTextAndCategories;
    window.ApiCheckUserInfo = checkUserInfo;
    window.ApiEditOrCreateNewPage = editOrCreateNewPageWithContext;
    window.ApiLoadAllFilesData = loadAllFilesData;
    window.ApiLoadFilesUsage = loadFilesUsage;
    window.ApiReloadPurge = reloadPurge;
    window.ApiDeletePage = deletePage;
    window.ApiLoadPageWikiText = loadPageWikiText;

}(mediaWiki, jQuery));

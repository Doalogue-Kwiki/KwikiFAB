/**
 * Loading the wikiText of the page without the categories.
 */
( function ( mw, $ ) {
    
    // Regular sub-expression matching all possible names for the category namespace. Is automatically localized
    var category_regexp = '[Cc][Aa][Tt][Ee][Gg][Oo][Rr][Yy]';

    var uncat_regexp = /\{\{\s*([Uu]ncat(egori[sz]ed( image)?)?|[Nn]ocat|[Nn]eedscategory)[^}]*\}\}\s*(<\!--.*?--\>)?/g;
    // A regexp matching a templates used to mark uncategorized pages, if your wiki does have that.
    // If not, set it to null.

    var template_regexp = '[Tt][Ee][Mm][Pp][Ll][Aa][Tt][Ee]';
    // Regexp to recognize templates. Like "category" above; autolocalized for MW 1.16+, otherwise set manually here.
    // On the German Wikipedia, you might use '[Tt][Ee][Mm][Pp][Ll][Aa][Tt][Ee]|[Vv][Oo][Rr][Ll][Aa][Gg][Ee]'.

    var template_categories = {};
    // The following regular expression strings are used when searching for categories in wikitext.
    var wikiTextBlank = '[\\t _\\xA0\\u1680\\u180E\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000]+';
    var wikiTextBlankRE = new RegExp(wikiTextBlank, 'g');
    // Regexp for handling blanks inside a category title or namespace name.
    // See http://svn.wikimedia.org/viewvc/mediawiki/trunk/phase3/includes/Title.php?revision=104051&view=markup#l2722
    // See also http://www.fileformat.info/info/unicode/category/Zs/list.htm
    //   MediaWiki collapses several contiguous blanks inside a page title to one single blank. It also replace a
    // number of special whitespace characters by simple blanks. And finally, blanks are treated as underscores.
    // Therefore, when looking for page titles in wikitext, we must handle all these cases.
    //   Note: we _do_ include the horizontal tab in the above list, even though the MediaWiki software for some reason
    // appears to not handle it. The zero-width space \u200B is _not_ handled as a space inside titles by MW.
    var wikiTextBlankOrBidi = '[\\t _\\xA0\\u1680\\u180E\\u2000-\\u200B\\u200E\\u200F\\u2028-\\u202F\\u205F\\u3000]*';
    // Whitespace regexp for handling whitespace between link components. Including the horizontal tab, but not \n\r\f\v:
    // a link must be on one single line.
    //   MediaWiki also removes Unicode bidi override characters in page titles (and namespace names) completely.
    // This is *not* handled, as it would require us to allow any of [\u200E\u200F\u202A-\u202E] between any two
    // characters inside a category link. It _could_ be done though... We _do_ handle strange spaces, including the
    // zero-width space \u200B, and bidi overrides between the components of a category link (adjacent to the colon,
    // or adjacent to and inside of "[[" and "]]").


    // Text modification

    var findCatsRE =
        new RegExp('\\[\\[' + wikiTextBlankOrBidi + '(?:' + category_regexp + ')' + wikiTextBlankOrBidi + ':[^\\]]+\\]\\]', 'g');

    function replaceByBlanks(match) {
        return match.replace(/(\s|\S)/g, ' '); // /./ doesn't match linebreaks. /(\s|\S)/ does.
    }
    
    function escapeRE(str) {
        return str.replace(/([\\\^\$\.\?\*\+\(\)\[\]])/g, '\\$1');
    }

    function find_category(wikitext, category, once) {
        var cat_regex = null;
        if (template_categories[category]) {
            cat_regex = new RegExp('\\{\\{' + wikiTextBlankOrBidi + '(' + template_regexp + '(?=' + wikiTextBlankOrBidi + ':))?' + wikiTextBlankOrBidi +'(?:' + template_categories[category] + ')' + wikiTextBlankOrBidi + '(\\|.*?)?\\}\\}', 'g' );
        } else {
            var cat_name = escapeRE(category);
            var initial = cat_name.substr(0, 1);
            cat_regex = new RegExp('\\[\\[' + wikiTextBlankOrBidi + '(' + category_regexp + ')' + wikiTextBlankOrBidi + ':' + wikiTextBlankOrBidi +
                                   (initial == '\\' || !capitalizePageNames ?
                                    initial :
                                    '[' + initial.toUpperCase() + initial.toLowerCase() + ']') +
                                   cat_name.substring(1).replace(wikiTextBlankRE, wikiTextBlank) +
                                   wikiTextBlankOrBidi + '(\\|.*?)?\\]\\]', 'g'
                                  );
        }
        if (once) return cat_regex.exec(wikitext);
        var copiedtext = wikitext.replace(/<\!--(\s|\S)*?--\>/g, replaceByBlanks)
        .replace(/<nowiki\>(\s|\S)*?<\/nowiki>/g, replaceByBlanks);
        var result = [];
        var curr_match = null;
        while ((curr_match = cat_regex.exec(copiedtext)) != null) {
            result.push({
                match: curr_match
            });
        }
        result.re = cat_regex;
        return result; // An array containing all matches, with positions, in result[i].match
    }

    var interlanguageRE = null;

    function find_insertionpoint(wikitext) {
        var copiedtext = wikitext.replace(/<\!--(\s|\S)*?--\>/g, replaceByBlanks).replace(/<nowiki\>(\s|\S)*?<\/nowiki>/g, replaceByBlanks);
        // Search in copiedtext to avoid that we insert inside an HTML comment or a nowiki "element".
        var index = -1;
        findCatsRE.lastIndex = 0;
        while (findCatsRE.exec(copiedtext) != null) index = findCatsRE.lastIndex;
        if (index < 0) {
            // Find the index of the first interlanguage link...
            var match = null;
            if (!interlanguageRE) {
                // Approximation without API: interlanguage links start with 2 to 3 lower case letters, optionally followed by
                // a sequence of groups consisting of a dash followed by one or more lower case letters. Exceptions are "simple"
                // and "tokipona".
                match = /((^|\n\r?)(\[\[\s*(([a-z]{2,3}(-[a-z]+)*)|simple|tokipona)\s*:[^\]]+\]\]\s*))+$/.exec(copiedtext);
            } else {
                match = interlanguageRE.exec(copiedtext);
            }
            if (match) index = match.index;
            return {
                idx: index,
                onCat: false
            };
        }
        return {
            idx: index,
            onCat: index >= 0
        };
    }
    
    function change_category(wikitext, toRemove, toAdd, key, is_hidden) {

        var summary = [];
        var nameSpace = 'Category';
        var cat_point = -1; // Position of removed category;

        if (key) key = '|' + key;
        var keyChange = (toRemove && toAdd && toRemove == toAdd && toAdd.length > 0);
        if (toRemove && toRemove.length > 0) {
            var matches = find_category(wikitext, toRemove);
            if (!matches || matches.length === 0) {
                return {
                    text: wikitext,
                    'summary': summary
                };
            } else {
                var before = wikitext.substring(0, matches[0].match.index);
                var after = wikitext.substring(matches[0].match.index + matches[0].match[0].length);
                if (matches.length > 1) {
                    // Remove all occurrences in after
                    matches.re.lastIndex = 0;
                    after = after.replace(matches.re, "");
                }
                if (toAdd) {
                    nameSpace = matches[0].match[1] || nameSpace;
                    if (key == null) key = matches[0].match[2]; // Remember the category key, if any.
                }
                // Remove whitespace (properly): strip whitespace, but only up to the next line feed.
                // If we then have two linefeeds in a row, remove one. Otherwise, if we have two non-
                // whitespace characters, insert a blank.
                var i = before.length - 1;
                while (i >= 0 && before.charAt(i) != '\n' && before.substr(i, 1).search(/\s/) >= 0) i--;
                var j = 0;
                while (j < after.length && after.charAt(j) != '\n' && after.substr(j, 1).search(/\s/) >= 0)
                    j++;
                if (i >= 0 && before.charAt(i) == '\n' && (after.length === 0 || j < after.length && after.charAt(j) == '\n'))
                    i--;
                if (i >= 0) before = before.substring(0, i + 1);
                else before = "";
                if (j < after.length) after = after.substring(j);
                else after = "";
                if (before.length > 0 && before.substring(before.length - 1).search(/\S/) >= 0 &&
                    after.length > 0 && after.substr(0, 1).search(/\S/) >= 0)
                    before += ' ';
                cat_point = before.length;
                if (cat_point === 0 && after.length > 0 && after.substr(0, 1) == '\n') {
                    after = after.substr(1);
                }
                wikitext = before + after;            
            }
        }
        if (toAdd && toAdd.length > 0) {
            var matches = find_category(wikitext, toAdd);
            if (matches && matches.length > 0) {
                return {
                    text: wikitext,
                    'summary': summary
                };
            } else {
                var onCat = false;
                if (cat_point < 0) {
                    var point = find_insertionpoint(wikitext);
                    cat_point = point.idx;
                    onCat = point.onCat;
                } else {
                    onCat = true;
                }
                var newcatstring = '[[' + nameSpace + ':' + toAdd + (key || "") + ']]';
                if (cat_point >= 0) {
                    var suffix = wikitext.substring(cat_point);
                    wikitext = wikitext.substring(0, cat_point) + (cat_point > 0 ? '\n' : "") + newcatstring + (!onCat ? '\n' : "");
                    if (suffix.length > 0 && suffix.substr(0, 1) != '\n') {
                        wikitext += '\n' + suffix;
                    } else {
                        wikitext += suffix;
                    }
                } else {
                    if (wikitext.length > 0 && wikitext.substr(wikitext.length - 1, 1) != '\n')
                        wikitext += '\n';
                    wikitext += (wikitext.length > 0 ? '\n' : "") + newcatstring;
                }            
            }
        }
        return {
            text: wikitext,
            'summary': summary,
            error: null
        };
    }
    
    function loadWikiTextWithoutCategories(wikiText){    
        var copiedtext = 
            wikiText.replace(/<\!--(\s|\S)*?--\>/g, replaceByBlanks).
        replace(/<nowiki\>(\s|\S)*?       <\/nowiki>/g, replaceByBlanks);
        var result = {};
        // Search in copiedtext to avoid that we insert inside an HTML comment or a nowiki "element".
        var index = -1;
        findCatsRE.lastIndex = 0;
        result = findCatsRE.exec(copiedtext);
        while ( result != null){            
            console.log(result[0]);   
            index = findCatsRE.lastIndex;
            result = findCatsRE.exec(copiedtext);
        }
        console.log(copiedtext);
    };
    
    var loadWikiText = function ( ) {
        
        // Access multiple ones for use throughout a larger code base
        var conf = mw.config.get([
            'wgServer',
            'wgPageName',
            'wgScript',
            'wgUserLanguage'
        ]);
        var path = conf.wgServer + conf.wgScript + '?title=' + conf.wgPageName + '&action=raw&uselang=en';
        /*var wikiText = 'https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw.Api\nAPI/כל הקטגוריות\n\t\n<YouTubeURL>4O6S7sbsOxo</YouTubeURL>\n\n[[category:API]]\n[[category:מדיה ויקי]]';
        */
        
        console.log(path);
        
        //var wikiText;
        
        $.get(path, {}, function(content){
            var wikiText = content.trim();
            console.log(wikiText);
            loadWikiTextWithoutCategories(wikiText);
        });
        
        
    };

    window.LoadWikiText = loadWikiText;
    
}( mediaWiki, jQuery ) );
<?php

if ( function_exists( 'wfLoadExtension' ) ) {
    wfLoadExtension( 'MaterialCreatePage' );
	// Keep i18n globals so mergeMessageFileList.php doesn't break
	$wgMessagesDirs['MaterialCreatePage'] = __DIR__ . '/i18n';
	
	$wgExtensionMessagesFiles['MaterialCreatePageMagic'] = __DIR__ . '/MaterialCreatePage.i18n.magic.php';
	wfWarn(
		'Deprecated PHP entry point used for MaterialCreatePage extension. Please use wfLoadExtension ' .
		'instead, see https://www.mediawiki.org/wiki/Extension_registration for more details.'
	);

	return true;
} else {
	die( 'This version of the MaterialCreatePage extension requires MediaWiki 1.25+' );
}

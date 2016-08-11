<?php
/**
 * Hooks for Material Create Page extension
 *
 * @file
 * @ingroup Extensions
 */

class MaterialCreatePageHooks {
	public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin) {
        $out->addModules( array( 'ext.MaterialCreatePage' ) );
		return true;
	}
}

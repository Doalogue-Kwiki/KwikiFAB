<?php
/**
 * Hooks for Material Create Page extension
 *
 * @file
 * @ingroup Extensions
 */

class MaterialCreatePageHooks {
	public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin) {
		
		global $wgFABNamespacesAndTempletes;
		
		$user = $skin->getUser();
		
		// Check if the user is connect
		if ( !$user->isAnon() ) {
			$out->addJsConfigVars( array(
				'wgFABNamespacesAndTempletes' => $wgFABNamespacesAndTempletes
			) );
		
			$out->addModules( array(
				'ext.MaterialDialog',
				'ext.DragAndDropUpload',
				'ext.MaterialCreatePage'
			) );
		}
		
		return true;
	}
}

<?php
/**
 * Hooks for Material Create Page extension
 *
 * @file
 * @ingroup Extensions
 */

class MaterialCreatePageHooks {
	public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin) {
		
        global $wgFABNamespacesAndTemplates;
		
		$user = $skin->getUser();
		
		// Check if the user is connect
		if ( !$user->isAnon() ) {
			$out->addJsConfigVars( array(
                'wgFABNamespacesAndTemplates' => $wgFABNamespacesAndTemplates
			) );
		
			$out->addModules( array(
				'ext.MaterialDialog',
                'ext.FilesList',
				'ext.DragAndDropUpload',
				'ext.MaterialCreatePage'
			) );
		}
		
		return true;
	}
}

<?php
/**
 * Hooks for Kwiki FAB extension
 *
 * @file
 * @ingroup Extensions
 */

class KwikiFABHooks {
	public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin) {
		
        global $wgFABNamespacesAndTemplates;
		
		$user = $skin->getUser();
		
		// Check if the user is connect
		if ( !$user->isAnon() ) {
			$out->addJsConfigVars( array(
                'wgFABNamespacesAndTemplates' => $wgFABNamespacesAndTemplates
			) );
		
			$out->addModules( array(
                'ext.ApiActions',
				'ext.MaterialDialog',
                'ext.FilesList',
				'ext.DragAndDropUpload',
                'ext.QuickCreateAndEdit',
                'ext.KwikiFAB'
			) );
		}
		
		return true;
	}
}

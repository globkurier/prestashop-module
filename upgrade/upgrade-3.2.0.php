<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Upgrade module to version 3.2.0
 *
 * @param Module $module Instance of the module being upgraded
 * @return bool True if upgrade was successful
 */
function upgrade_module_3_2_0($module)
{
    $module->clearCache();

    // Unregister old hook
    $module->unregisterHook('displayAdminOrder');

    // Register new hook
    $hookResult = $module->registerHook('displayAdminOrderMainBottom');

    $filesToRemove = [
        'views/js/angular.min.js',
        'views/js/configApp.261.js',
        'views/js/newParcelApp.261.js',
        'views/templates/partials/globAdditionalInformation_en.html',
        'views/templates/partials/globAdditionalInformation_pl.html',
        'views/templates/partials/globDiscountCodeAndSummary_en.html',
        'views/templates/partials/globDiscountCodeAndSummary_pl.html',
        'views/templates/partials/globServiceOptions_en.html',
        'views/templates/partials/globServiceOptions_pl.html',
        'views/templates/partials/globServices_en.html',
        'views/templates/partials/globServices_pl.html',
        'views/templates/partials/globTerminalPicker_en.html',
        'views/templates/partials/globTerminalPicker_pl.html',
    ];

    $success = true;
    $modulePath = dirname(__FILE__) . '/../';

    foreach ($filesToRemove as $file) {
        $filePath = $modulePath . $file;
        if (file_exists($filePath)) {
            if (!unlink($filePath)) {
                $success = false;
                error_log('Globkurier: Failed to remove file: ' . $file);
            }
        }
    }

    // Remove partials directory if empty
    $partialsDir = $modulePath . 'views/templates/partials/';
    if (is_dir($partialsDir)) {
        $files = array_diff(scandir($partialsDir), ['.', '..']);
        if (empty($files)) {
            rmdir($partialsDir);
        }
    }

    // Return combined success of hook registration and file removal
    return $hookResult && $success;
}
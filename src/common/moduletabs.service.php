<?php
/**
 * 2007-2023 PrestaShop.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License 3.0 (AFL-3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/AFL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to http://www.prestashop.com for more information.
 *
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright 2007-2023 PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 * International Registered Trademark & Property of PrestaShop SA
 */

namespace Globkuriermodule\Common;

if (!defined('_PS_VERSION_')) {
    exit;
}
class ModuleTabs
{
    private static $tab_name = [
        'pl' => [
            0 => 'Nadaj przez GlobKuriera',
            1 => 'Historia przesyłek',
            2 => 'Konfiguracja',
            3 => 'Nadaj przez Globkuriera',
            4 => 'GlobKurier',
        ],
        'en' => [
            0 => 'Send via GlobKurier',
            1 => 'Shipment history',
            2 => 'Configuration',
            3 => 'Send via Globkurier',
            4 => 'GlobKurier',
        ],
    ];

    public static $moduleName = 'globkuriermodule';

    public static function install()
    {
        $parentId = self::add(4, 'AdminGlobkurier');
        self::add(
            3,
            'AdminGlobkurierPlaceOrder',
            \Tab::getIdFromClassName('AdminParentShipping')
        );

        self::add(0, 'AdminGlobkurierPlaceOrder', $parentId);
        self::add(1, 'AdminGlobkurierHistory', $parentId);
        self::add(2, 'AdminGlobkurierConfiguration', $parentId);

        return true;
    }

    private static function add($name, $className, $parent = 0)
    {
        $tab = new \Tab();
        $tab->active = 1;
        $tab->name = [];
        $languages = \Language::getLanguages(true);
        foreach ($languages as $lang) {
            $tab->name[$lang['id_lang']] = self::$tab_name[$lang['iso_code']][$name];
        }
        $tab->class_name = $className;
        $tab->id_parent = $parent;
        $tab->module = self::$moduleName;
        $tab->add();

        return $tab->id;
    }

    /**
     * Uninstall tabs. There are two times PlaceOrder class, because there are
     * two tabs pointing at it
     * @return bool
     */
    public static function uninstall()
    {
        $tabs = [
            'AdminGlobkurierConfiguration',
            'AdminGlobkurierHistory',
            'AdminGlobkurierPlaceOrder',
            'AdminGlobkurierPlaceOrder',
            'AdminGlobkurier',
        ];

        foreach ($tabs as $tabName) {
            $tab = \Tab::getInstanceFromClassName($tabName);
            if ($tab) {
                $tab->delete();
            }
        }

        return true;
    }
}

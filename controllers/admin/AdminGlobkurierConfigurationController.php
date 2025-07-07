<?php
/**
 * 2007-2020 PrestaShop.
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
if (!defined('_PS_VERSION_')) {
    exit;
}
class AdminGlobkurierConfigurationController extends ModuleAdminController
{
    private $link;

    public function __construct()
    {
        $this->table = 'configuration';
        $this->display = 'view';
        $this->bootstrap = true;
        $this->meta_title = 'Zamawianie przesyłki globkurier';
        parent::__construct();
        $this->path = $this->path ? $this->path : _MODULE_DIR_ . $this->module->name;
        $this->link = new Link();
    }

    // @Override
    public function init()
    {
        parent::init();
        $url = $this->context->link->getAdminLink('AdminModules');
        Tools::redirectAdmin($url . '&configure=' . Tools::safeOutput($this->module->name));
    }
}

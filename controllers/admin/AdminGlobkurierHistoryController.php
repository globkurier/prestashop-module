<?php
/**
 * 2007-2025 PrestaShop.
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
 * @copyright 2007-2025 PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 * International Registered Trademark & Property of PrestaShop SA
 */
if (!defined('_PS_VERSION_')) {
    exit;
}
class AdminGlobkurierHistoryController extends ModuleAdminController
{
    private $link;

    public function __construct()
    {
        $this->table = 'configuration';
        $this->display = 'view';
        $this->bootstrap = true;
        $this->meta_title = 'Przesyłki zamówione przez GlobKurier';
        parent::__construct();
        $this->path = $this->path ? $this->path : _MODULE_DIR_ . $this->module->name;
        $this->link = new Link();
    }

    // @Override
    public function renderView()
    {
        $orderManager = new Globkuriermodule\Order\OrderManager();
        $orders = $orderManager->getAll();
        $this->context->smarty->assign([
            'orders' => $orders,
            'orderDetailsUrl' => $this->link->getAdminLink('AdminOrders') . '&vieworder',
            'moduleApiUrl' => $this->link->getAdminLink('AdminGlobkurierHistory'),
            'urlModule' => $this->link->getModuleLink('globkuriermodule', 'getLabel'),
        ]);
        return $this->module->display($this->path, 'views/templates/admin/history_page.tpl');
    }

    // @Override
    public function postProcess()
    {
        return parent::postProcess();
    }

    /**
     * Metoda do zwracania linku do listu przewozowego
     * przykladowy adres: index.php?controller=AdminGlobkurierPlaceOrder&ajax=1&action=getWaybill&gknumber=xc123123
     * @return bool zwracana zmienna nie ma znaczenia
     */
    public function displayAjaxGetWaybill()
    {
        /** @var string numer przesylki dla ktorej chcemy pobrać list przewozowy */
        $number = Tools::getValue('gknumber', null);
        $resData = [];
        try {
            $c = new Globkuriermodule\Common\Config();
            $api = new Globkuriermodule\Common\GlobkurierApi($c->login, $c->password, $c->apiKey);
            $url = $api->getWaybillUrl($number);
            $resData['success'] = true;
            $resData['url'] = $url;
        } catch (Exception $e) {
            $resData['success'] = false;
            $resData['error'] = $e->getMessage();
        }
        header('Content-Type: application/json');
        echo json_encode($resData);
        return true;
    }
}

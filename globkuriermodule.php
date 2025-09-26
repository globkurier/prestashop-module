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
 * @copyright 2007-2020 PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 * International Registered Trademark & Property of PrestaShop SA
 */

use Globkuriermodule\Common\Config;
use Globkuriermodule\Common\ModuleTabs;

if (!defined('_PS_VERSION_')) {
    exit;
}

require_once 'src/globkurier.loader.php';

class Globkuriermodule extends Module
{
    protected $config_form = false;
    protected $link;

    private $payments = [
        1 => 'Przelew bankowy',
        2 => 'Płatność online',
        3 => 'Konto pre-paid',
        4 => 'Faktura zbiorcza (przelew bankowy - odroczony termin płatności)',
        5 => 'Płatność gotówką',
        6 => 'Płatność gotówką przy doręczeniu',
        7 => '-',
        8 => 'Bon',
        9 => 'Konto pre-paid (faktura zbiorcza)',
    ];

    public function __construct()
    {
        $this->name = 'globkuriermodule';
        $this->tab = 'shipping_logistics';
        $this->version = '3.2.0';
        $this->author = 'GlobKurier.pl';
        $this->need_instance = 0;
        $this->bootstrap = true;
        $this->module_key = '82d29cc1292216aeeb640e446d32c5ea';

        parent::__construct();

        $this->displayName = $this->l('Globkurier integration');
        $this->description = $this->l('Module Globkurier to ship parcels');
        $this->ps_versions_compliancy = ['min' => '1.6', 'max' => _PS_VERSION_];
        $this->link = new Link();
    }

    /**
     * Don't forget to create update methods if needed:
     * http://doc.prestashop.com/display/PS16/Enabling+the+Auto-Update
     */
    public function install()
    {
        Configuration::updateValue('GLOBKURIER2_LIVE_MODE', false);
        require_once __DIR__ . '/sql/install.php';
        ModuleTabs::install();
        return parent::install()
            && $this->registerHook('displayHeader')
            && $this->registerHook('displayBackOfficeHeader')
            && $this->registerHook('displayCarrierList')
            && $this->registerHook('displayAfterCarrier')
            && $this->registerHook('displayAfterCarrier')
            && $this->registerHook('displayAdminOrder')
            && $this->registerHook('actionUpdateCarrier');
    }

    public function uninstall()
    {
        Configuration::deleteByName('GLOBKURIER2_LIVE_MODE');
        ModuleTabs::uninstall();
        // include(dirname(__FILE__).'/sql/uninstall.php');
        Config::purge();
        return parent::uninstall();
    }

    /**
     * Load the configuration form
     */
    public function getContent()
    {
        $config = new Config();
        if (Tools::getValue('action') == 'updateConfig' && $this->validateConfigFields()) {
            $return = $config->update();
            if ($return) {
                $this->context->smarty->assign([
                    'success' => $this->l('The module settings have been saved correctly.'),
                ]);
            } else {
                $error = $this->l('An error occurred while saving the settings. Try again.');
                $this->context->smarty->assign([
                    'error_info' => $error,
                ]);
            }
        }
        $this->context->smarty->assign([
            'config' => $config,
            'submited' => Tools::getValue('action') == 'updateConfig' ? true : false,
            'newParcelPageLink' => $this->link->getAdminLink('AdminGlobkurierPlaceOrder'),
            'getCachePointsLink' => $this->link->getAdminLink('AdminGlobkurierPlaceOrder') . '&ajax=1&action=getAllPickupPoints',
            'baseurl' => $this->_path,
        ]);
        $api = new Globkuriermodule\Common\GlobkurierApi($config->login, $config->password, $config->apiKey);
        if (!$api->isUserAuthorized()) {
            if (version_compare(_PS_VERSION_, '1.6.0', '>=') === true) {
                return $this->display(__FILE__, 'views/templates/admin/login_page_v16.tpl');
            } else {
                return $this->display(__FILE__, 'views/templates/admin/login_page_v15.tpl');
            }
        }
        $carriers = Carrier::getCarriers($this->context->language->id);
        $countries = $api->getCountries();
        $this->context->smarty->assign([
            'countries' => $countries,
            'carriers' => $carriers,
            'tokenAPI' => $api->getToken(),
            'moduleVersion' => $this->version,
        ]);
        // Load jQuery-based config page script (Angular removed)
        $this->context->controller->addJS($this->_path . '/views/js/configApp.jquery.js');
        if (version_compare(_PS_VERSION_, '1.6.0', '>=') === true) {
            return $this->display(__FILE__, 'views/templates/admin/config_page_v16.tpl');
        } else {
            return $this->display(__FILE__, 'views/templates/admin/config_page_v15.tpl');
        }
    }

    private function validateConfigFields()
    {
        $valid = true;
        $ruchCarrier = (int) Tools::getValue('config_paczkaRuchCarrier');
        $inpostCarrier = (int) Tools::getValue('config_inPostCarrier');
        if ($inpostCarrier != 0 && $inpostCarrier == $ruchCarrier) {
            $this->context->controller->errors[] = $this->l('You cant use same carrier for two services');
            $valid = false;
        }
        return $valid;
    }

    public function hookDisplayAdminOrder($params)
    {
        $orderM = new Globkuriermodule\Order\OrderManager();
        $gkOrder = $orderM->getByOrderId($params['id_order']);
        if (!empty($gkOrder)) {
            foreach ($gkOrder as &$item) {
                $pdf = (int)$this->checkPDFReady($item->hash);
                $item->pdf = $pdf;

                $item->payment_name = $this->payments[$item->payment];
            }
        }
        $newParcelPageLink = $this->link->getAdminLink('AdminGlobkurierPlaceOrder');
        $newParcelPageLink .= '&order_id=' . $params['id_order'];
        $this->context->smarty->assign([
            'orders' => $gkOrder,
            'moduleApiUrl' => $this->link->getAdminLink('AdminGlobkurierHistory'),
            'newParcelPageLink' => $newParcelPageLink,
        ]);
        if (version_compare(_PS_VERSION_, '8.0.0', '>=') === true) {
            // PrestaShop 8.x and 9.x
            return $this->display(__FILE__, 'views/templates/hooks/admin_order.tpl');
        } elseif (version_compare(_PS_VERSION_, '1.7.0', '>=') === true) {
            // PrestaShop 1.7.x
            return $this->display(__FILE__, 'views/templates/hooks/admin_order.tpl');
        } elseif (version_compare(_PS_VERSION_, '1.6.0', '>=') === true) {
            // PrestaShop 1.6.x
            return $this->display(__FILE__, 'views/templates/hooks/order_details_page_v16.tpl');
        } else {
            // PrestaShop 1.5.x and older
            return $this->display(__FILE__, 'views/templates/hooks/order_details_v15.tpl');
        }
    }

    /**
     * Check if PDF label is ready for download
     * This method makes an internal API call to check the status of a parcel label
     *
     * @param string|null $hash The parcel hash identifier
     * @return int Returns 1 if PDF is ready, 0 otherwise
     */
    private function checkPDFReady($hash)
    {
        // Check if hash is null or empty - prevent null access errors
        if ($hash === null || $hash === '') {
            return 0;
        }

        // Verify that context and shop objects exist - required for URL construction
        if (!isset($this->context) || !isset($this->context->shop)) {
            return 0;
        }

        // Build internal API URL to check label status
        $url = 'https://tebimpro:tebimpro@'.$this->context->shop->domain.$this->context->shop->physical_uri.'module/globkuriermodule/getLabel?hash='.$hash.'&ajax=1';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        $result = curl_exec($ch);
        curl_close($ch);

        // Check if cURL request failed
        if ($result === false) {
            return 0;
        }

        // Decode JSON response and validate structure
        $return = json_decode($result, true);
        if (!is_array($return) || !isset($return['status'])) {
            return 0;
        }

        return $return['status'];
    }

    /**
     * Wyświetla i ładuje skrypty związane z wyborem paczkomatów
     * @param $params
     * @return string
     */
    public function hookDisplayCarrierList($params)
    {
        $config = new Config();
        if (!$config->inPostEnabled && !$config->inPostCODEnabled && !$config->paczkaRuchEnabled && !$config->pocztex48owpEnabled) {
            return;
        }
        $address = new Address($this->context->cart->id_address_delivery);
        $this->smarty->assign([
            'globConfig' => $config,
            'inpost_carrier_id' => $config->inPostEnabled ? $config->inPostCarrier : null,
            'inpost_cod_carrier_id' => $config->inPostCODEnabled ? $config->inPostCODCarrier : null,
            'paczkaruch_carrier_id' => $config->paczkaRuchEnabled ? $config->paczkaRuchCarrier : null,
            'pocztex48owp_carrier_id' => $config->pocztex48owpEnabled ? $config->pocztex48owpCarrier : null,
            'cart_id' => $params['cart']->id,
            'rest_endpoint' => $this->context->link->getModuleLink($this->name, 'restinterface', [], true),
            'gk_token' => $this->encryptCartId($params['cart']->id),
            'address_all' => json_encode($params),
            'baseurl' => 'https://' . $this->context->shop->domain . $this->context->shop->physical_uri,
            'city' => $address->city,
            'postcode' => $address->postcode,
        ]);
        if (version_compare(_PS_VERSION_, '8.0.0', '>=') === true) {
            // PrestaShop 8.x and 9.x
            return $this->display(__FILE__, 'views/templates/hooks/carrier_list_17.tpl');
        } elseif (version_compare(_PS_VERSION_, '1.7.0', '>=') === true) {
            // PrestaShop 1.7.x
            return $this->display(__FILE__, 'views/templates/hooks/carrier_list_17.tpl');
        } else {
            // PrestaShop 1.6.x and older
            return $this->display(__FILE__, 'views/templates/hooks/carrier_list.tpl');
        }
    }

    /**
     * Alias for hookDisplayCarrierList used in PS1.7 version
     * @param $params
     * @return string
     */
    public function hookDisplayAfterCarrier($params)
    {
        return $this->hookDisplayCarrierList($params);
    }

    /**
     * aktualizuje id przewoźnika inPostu
     * @param $params - parametry przewoźnika
     * @return void
     */
    public function hookActionUpdateCarrier($params)
    {
        $id_carrier_old = (int) $params['id_carrier'];
        $id_carrier_new = (int) $params['carrier']->id;
        $config = new Config();
        if ($config->inPostCarrier == $id_carrier_old) {
            $config->inPostCarrier = $id_carrier_new;
            $config->update(false);
        }
        if ($config->paczkaRuchCarrier == $id_carrier_old) {
            $config->paczkaRuchCarrier = $id_carrier_new;
            $config->update(false);
        }
    }

    public function hookDisplayHeader($params)
    {
        $config = new Config();
        $code = trim($this->context->controller->php_self);
        if ($code != 'order' && $code != 'order-opc') {
            return;
        }
        if (version_compare(_PS_VERSION_, '8.0.0', '>=') === true) {
            // PrestaShop 8.x and 9.x - use modern asset management
            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-style',
                'modules/' . $this->name . '/views/css/front.css',
                [
                    'media' => 'all',
                    'priority' => 200,
                ]
            );
            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-select2-style',
                'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css',
                [
                    'media' => 'all',
                    'priority' => 200,
                ]
            );

            // Load Google Maps API if configured
            $goolgeMapsApiKeyFromConfiguration = $config->googleMapsApiKey;
            if ($goolgeMapsApiKeyFromConfiguration) {
                $this->context->controller->registerJavascript(
                    'google-maps-api',
                    'https://maps.google.com/maps/api/js?key=' . $goolgeMapsApiKeyFromConfiguration,
                    [
                        'server' => 'remote',
                        'position' => 'bottom',
                        'priority' => 200,
                        'attribute' => 'defer',
                    ]
                );
                $this->context->controller->registerJavascript(
                    'google-maps-clusterer',
                    'https://unpkg.com/@googlemaps/markerclustererplus/dist/index.min.js',
                    [
                        'server' => 'remote',
                        'position' => 'bottom',
                        'priority' => 200,
                        'attribute' => 'defer',
                    ]
                );
            }

            // Load Select2 JavaScript
            $this->context->controller->registerJavascript(
                'select-select2',
                'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
                [
                    'server' => 'remote',
                    'position' => 'bottom',
                    'priority' => 200,
                    'attribute' => 'defer',
                ]
            );

            // Load main module JavaScript
            $this->context->controller->registerJavascript(
                'modules-globkuriermodule',
                'modules/' . $this->name . '/views/js/inpost-front-17.js',
                [
                    'position' => 'bottom',
                    'priority' => 250,
                ]
            );
        } elseif (version_compare(_PS_VERSION_, '1.7.0', '>=') === true) {
            // PrestaShop 1.7.x
            $this->context->controller->addCSS($this->_path . '/views/css/front.css', 'all');
            $this->context->controller->addCSS('https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css', 'all');
            $this->context->controller->registerStylesheet(
                'module-' . $this->name . '-style',
                'modules/' . $this->name . '/views/css/front.css',
                [
                    'media' => 'all',
                    'priority' => 200,
                ]
            );
            $goolgeMapsApiKeyFromConfiguration = $config->googleMapsApiKey;
            if ($goolgeMapsApiKeyFromConfiguration) {
                $this->context->controller->registerJavascript(
                    'google-maps-api',
                    'https://maps.google.com/maps/api/js?key=' . $goolgeMapsApiKeyFromConfiguration,
                    [
                        'server' => 'remote',
                        'position' => 'bottom',
                        'priority' => 200,
                        'attribute' => 'defer',
                    ]
                );
                $this->context->controller->registerJavascript(
                    'google-maps-clusterer',
                    'https://unpkg.com/@googlemaps/markerclustererplus/dist/index.min.js',
                    [
                        'server' => 'remote',
                        'position' => 'bottom',
                        'priority' => 200,
                        'attribute' => 'defer',
                    ]
                );
            }
            $this->context->controller->registerJavascript(
                'select-select2',
                'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
                [
                    'server' => 'remote',
                    'position' => 'bottom',
                    'priority' => 200,
                    'attribute' => 'defer',
                ]
            );
            $this->context->controller->registerJavascript(
                'modules-globkuriermodule',
                'modules/' . $this->name . '/views/js/inpost-front-17.js',
                [
                    'position' => 'bottom',
                    'priority' => 250,
                ]
            );
        } else {
            $this->context->controller->addCSS($this->_path . 'views/css/front.css', 'all');
            $this->context->controller->addJS($this->_path . 'views/js/inpost-front.js');
        }
    }

    public function hookDisplayBackOfficeHeader($params)
    {
        $this->context->controller->addCSS($this->_path . 'views/css/back.css', 'all');
    }

    /**
     * Encrypt cart ID for security token
     * Compatible with all PrestaShop versions
     * @param int $cartId
     * @return string
     */
    private function encryptCartId($cartId)
    {
        // Use hash with salt for security
        $salt = _COOKIE_KEY_ . $this->name;
        return hash('sha256', $cartId . $salt);
    }
}

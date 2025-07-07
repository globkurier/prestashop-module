{*
 * 2007-2024 PrestaShop.
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
 * @copyright 2007-2024 PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 * International Registered Trademark & Property of PrestaShop SA
 *}
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />

<div id="pickup-terminal-container" class="delivery-option row" style="display: none;">

    <div class="no_results" style="display: none; color: red; text-align: center">
        {l s='No results found for: ' mod='globkuriermodule'} <b></b>
    </div>

    <div class="col-sm-12 pickup-search">
        <span>{l s='Type a name of your city and select parcel point closest to you' mod='globkuriermodule'}</span>
        <div class="input-group">
            <input type="text" name="pickup_town" class="form-control pickup_town" value="{$city}" />
            <div class="input-group-btn">
                <button class="btn btn-primary search-button">{l s='Search' mod='globkuriermodule'}</button>
            </div>
        </div>
    </div>

    <div class="col-sm-12 pickup-loader"><div class="lds-ripple"><div></div><div></div></div></div>

    <div class="col-sm-12 pickup-result">
        <span>{l s='Found inPost parcel points' mod='globkuriermodule'}</span>
        <select class="form-control" name="pickup_point">
            <option value="0">{l s='Please use the search' mod='globkuriermodule'}</option>
        </select>
        <div class="no_inpost_point" style="display: none;">
            <i class="icon-warning"></i> {l s='Unfortunately, we did not find any parcel machines in given city' mod='globkuriermodule'}
        </div>
        {*        <img class="ajax-loader" src="img/loader.gif" style="display: none;" />*}
        <div class="pickup-point-selected"></div>
    </div>

    <div class="no_inpost_point_selected" style="display: none;">
        <p><i class="icon-warning"></i> {l s='Please pick parcel point' mod='globkuriermodule'}</p>
    </div>
    <div class="clearfix"></div>
    <div id="containerForMapOfTerminals" style="display:none; margin-top: 5px; width:100%; height:500px"></div>

</div>

<script type="text/javascript">
    var inpost_carrier_id = {if $globConfig->inPostEnabled}{$globConfig->inPostCarrier|escape:'javascript':'UTF-8'}{else}null{/if};
    var inpost_cod_carrier_id = {if $globConfig->inPostCODEnabled}{$globConfig->inPostCODCarrier|escape:'javascript':'UTF-8'}{else}null{/if};
    var paczkaruch_carrier_id = {if $globConfig->paczkaRuchEnabled}{$globConfig->paczkaRuchCarrier|escape:'javascript':'UTF-8'}{else}null{/if};
    var pocztex48owp_carrier_id = {if $globConfig->pocztex48owpEnabled}{$globConfig->pocztex48owpCarrier|escape:'javascript':'UTF-8'}{else}null{/if};
    var dhlparcel_carrier_id = null;{* {if $globConfig->dhlparcelEnabled}{$globConfig->dhlparcelCarrier|escape:'javascript':'UTF-8'}{else}null{/if} *};
    var dpdpickup_carrier_id = {if $globConfig->dpdpickupEnabled}{$globConfig->dpdpickupCarrier|escape:'javascript':'UTF-8'}{else}null{/if};
    var cart_id = {$cart_id|escape:'javascript':'UTF-8'};
    var gk_token = '{$gk_token|escape:'javascript':'UTF-8'}';
    var rest_endpoint = '{$rest_endpoint|escape:'javascript':'UTF-8'}';
    var address = '{$address_all|escape:'javascript':'UTF-8'}';
    var baseUrl = '{$baseurl|escape:'javascript':'UTF-8'}';
    let mainTextLang = '{l s='Type a name of your city and select parcel point closest to you' mod='globkuriermodule'}',
        mainTextLang2 = '{l s='for' mod='globkuriermodule'}',
        postcode = '{$postcode}';
</script>

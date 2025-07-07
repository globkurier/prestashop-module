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
<div id="pickup-terminal-container" class="">
    <div>
        <table class="resume table table-bordered">
            <tbody>
                <tr>
                    <td style="width: 30%">
                        {l s='Type a name of your city and select parcel point closest to you' mod='globkuriermodule'}<br/>
                        <div class="input-group">
                            <input type="text" name="pickup_town" class="form-control" />
                            <div class="input-group-btn">
                                <button class="btn btn-default search-button">{l s='Search' mod='globkuriermodule'}</button>
                            </div>
                        </div>
                    </td>
                    <td style="width: 70%">
                        {l s='Found inPost parcel points' mod='globkuriermodule'}<br/>
                        <select class="" name="pickup_point">
                            <option value="0">{l s='Please use the search' mod='globkuriermodule'}</option>
                        </select>
                        <div class="no_pickup_point" style="display: none;">
                            <i class="icon-warning"></i> {l s='Unfortunately, we did not find any parcel machines in given city' mod='globkuriermodule'}
                        </div>
                        <img class="ajax-loader" src="img/loader.gif" style="display: none;" />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="no_pickup_point_selected" style="display: none;">
        <p><i class="icon-warning"></i> {l s='Please pick parcel point' mod='globkuriermodule'}</p>
    </div>
    
</div>

<script type="text/javascript">
    var inpost_carrier_id = {if $globConfig->inPostEnabled}{$globConfig->inPostCarrier|escape:'javascript':'UTF-8'}{else}null{/if};
    var inpost_cod_carrier_id = {if $globConfig->inPostCODEnabled}{$globConfig->inPostCODCarrier|escape:'javascript':'UTF-8'}{else}null{/if};
    var paczkaruch_carrier_id = {if $globConfig->paczkaRuchEnabled}{$globConfig->paczkaRuchCarrier|escape:'javascript':'UTF-8'}{else}null{/if};
    var pocztex48owp_carrier_id = {if $globConfig->pocztex48owpEnabled}{$globConfig->pocztex48owpCarrier|escape:'javascript':'UTF-8'}{else}null{/if};
    var dhlparcel_carrier_id = null; {*{if $globConfig->dhlparcelEnabled}{$globConfig->dhlparcelCarrier|escape:'javascript':'UTF-8'}{else}null{/if};*}
    var cart_id = {$cart_id|escape:'javascript':'UTF-8'};
    var gk_token = '{$gk_token|escape:'javascript':'UTF-8'}';
    var rest_endpoint = '{$rest_endpoint|escape:'javascript':'UTF-8'}';

    $(function(){
        /**
         * Jesli domyslnie jest ustawiony dostawca inpost, to pokaz wyszukiwarke punktow
         * Instrukcja musi być tutaj, ponieważ prestaShop, przy każdorazowym wyborze przewoźnika
         * ładuje jeszcze raz cały ten szablon
         */
        var inpostCODSelected = ($('input[value="' + inpost_cod_carrier_id + ',"') && $('input[value="' + inpost_cod_carrier_id + ',"').attr('checked')) ? true : false;
        var inpostSelected = ($('input[value="' + inpost_carrier_id + ',"') && $('input[value="' + inpost_carrier_id + ',"').attr('checked')) ? true : false;
        var ruchSelected = ($('input[value="' + paczkaruch_carrier_id + ',"').length && $('input[value="' + paczkaruch_carrier_id + ',"').attr('checked')) ? true : false;
        var pocztexSelected = ($('input[value="' + pocztex48owp_carrier_id + ',"').length && $('input[value="' + pocztex48owp_carrier_id + ',"').attr('checked')) ? true : false;
        var dhlparcelSelected = ($('input[value="' + dhlparcel_carrier_id + ',"').length && $('input[value="' + dhlparcel_carrier_id + ',"').attr('checked')) ? true : false;

        if (inpostCODSelected || inpostSelected || ruchSelected || pocztexSelected || dhlparcelSelected) {
            $('#pickup-terminal-container').show();
            var serviceCode = (ruchSelected ? "ORLEN PACZKA" : "PACZKOMAT");
            $('input[name="pickup_town"]').data("service-code", serviceCode);
        } else {
            $('#pickup-terminal-container').hide();
        }
    });
</script>

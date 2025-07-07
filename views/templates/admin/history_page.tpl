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
<style type="text/css">
    .track-button {
        display: inline; 
        padding: 0px 10px;
    }
</style>

<div class="panel" ng-app="newParcelApp" ng-controller="mainController">
    <div class="panel-heading">
        <i class="icon-send"></i> {l s='Globkurier - order history' mod='globkuriermodule'}
    </div>
    <table class="table">
        <thead>
            <tr>
                <th>{l s='Date' mod='globkuriermodule'}</th>
                <th>{l s='Parcel No' mod='globkuriermodule'}</th>
                <th>{l s='Receiver' mod='globkuriermodule'}</th>
                <th>{l s='Carrier' mod='globkuriermodule'}</th>
                <th>{l s='Content' mod='globkuriermodule'}</th>
                <th>{l s='Weight' mod='globkuriermodule'}</th>
                <th>{l s='Payment' mod='globkuriermodule'}</th>
                <th>{l s='Label' mod='globkuriermodule'}</th>
                <th>#</th>
            </tr>
        </thead>
        <tbody>
            {foreach from=$orders item=order}
            <tr>
                <td>{$order->crateDate|escape:'htmlall':'UTF-8'}</td>
                <td>{$order->gkId|escape:'htmlall':'UTF-8'}</td>
                <td>{$order->receiver|escape:'htmlall':'UTF-8'}</td>
                <td>{$order->carrier|escape:'htmlall':'UTF-8'}</td>
                <td>{$order->content|escape:'htmlall':'UTF-8'}</td>
                <td>{$order->weight|escape:'htmlall':'UTF-8'}kg</td>
                <td>{$order->paymentName|escape:'htmlall':'UTF-8'}</td>
                <td>
                    {if $order->hash}
                        <a href="{$urlModule}?hash={$order->hash|escape:'url':'UTF-8'}" class="" target="_blank" title="{l s='Download the bill of lading' mod='globkuriermodule'}">
                            <i class="material-icons">note</i>
                        </a>
                    {else}
                        --
                    {/if}
                </td>
                <td>
                    {if $order->orderId}
                        <a href="{$orderDetailsUrl|escape:'javascript':'UTF-8'}&id_order={$order->orderId|escape:'htmlall':'UTF-8'}" title="{l s='View order' mod='globkuriermodule'}">
                            <i class="icon-credit-card"></i>
                        </a>
                    {/if}
                    <form class="track-button" id="track{$order->gkId|escape:'htmlall':'UTF-8'}" action="https://www.globkurier.pl/shipment-tracking/{$order->gkId|escape:'htmlall':'UTF-8'}" target="_blank" method="get">
                        <a href onclick="$('#track{$order->gkId|escape:'htmlall':'UTF-8'}').submit(); return false;" title="{l s='Tracking shipment' mod='globkuriermodule'}">
                            <i class="icon-search"></i>
                        </a>
                    </form>
                </td>
            </tr>
            {/foreach}
        </tbody>
    </table>
</div>

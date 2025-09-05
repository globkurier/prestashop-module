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
{if empty($config->defaultCountryCode) || !isset($config->defaultCountryCode)}
<div class="alert alert-danger">
    <p>{l s='Complete all data in the module configuration.' mod='globkuriermodule'}</p>
</div>
{else}

<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<style type="text/css">
    [ng\:cloak], [ng-cloak], .ng-cloak {
        display: none !important;
    }
</style>

<div class="panel" ng-app="newParcelApp" ng-controller="mainController">
    <div class="panel-heading">
        <i class="icon-cogs"></i> {l s='Ship parcel with Globkurier' mod='globkuriermodule'}
        {if $orderId}{l s='Based on order' mod='globkuriermodule'} #{$orderId|escape:'htmlall':'UTF-8'}{/if}
    </div>

    <div class="bootstrap" ng-cloak ng-show="orderError">
        <div class="alert alert-danger">
            <h4>{l s='We\'ve try to send you request but there was an error' mod='globkuriermodule'}</h4>
            <ul>
                <li ng-repeat="(key, msg) in orderError"><span ng-bind="key"></span>: <span ng-bind="msg"></span></li>
            </ul>
            <button type="button" class="close" ng-click="orderError = null;">×</button>
        </div>
    </div>

    <div class="bootstrap" ng-cloak ng-show="validationError">
        <div class="alert alert-danger">
            <h4>{l s='There is some validation errors. Please fix them before you can continue' mod='globkuriermodule'}</h4>
            <span ng-show="validationError.noSenderPhone">{l s='Please provide sender phone number' mod='globkuriermodule'}</span>
            <span ng-show="validationError.noReceiverPhone">{l s='Please provide receiver phone number' mod='globkuriermodule'}</span>
            <button type="button" class="close" ng-click="validationError = null;">×</button>
        </div>
    </div>

    <div class="panel-body" ng-cloak ng-show="isProcessing">
        <div class="page-loader" style="text-align: center; font-size: 25px!important; color: #ccc;">
            <i class="icon-cog icon-spin"></i>
        </div>
    </div>
    <div class="panel-body order-placed" ng-cloak ng-show="!isProcessing && orderPlaced">
        <div class="col-lg-12" style="text-align: center;">
            <h2><i class="icon-check" style="font-size: 50px!important; color:#72C279;"></i></h2>
            <h2>{l s='Carrier was succesfully ordered' mod='globkuriermodule'}</h2>
            <p>{l s='Parcel No' mod='globkuriermodule'}: <span ng-bind="orderPlaced.gkId"></span></p>
            <button class="btn btn-warning" onclick="location.reload();">{l s='Ship next' mod='globkuriermodule'}</button>
            <small>{l s='Powrót za 2 sekundy' mod='globkuriermodule'}</small>
        </div>
    </div>
    <div class="panel-body" ng-cloak ng-show="!isProcessing && !orderPlaced">
        <div class="col-lg-4">
            <div class="row">
                <div class="col-lg-6" glob-address ng-model="sender" address-title="{l s='Sender' mod='globkuriermodule'}"></div>
                <div class="col-lg-6 receiverAddressBox" glob-address ng-model="receiver" address-title="{l s='Receiver' mod='globkuriermodule'}"></div>
            </div>
            <div class="row" ng-show="terminalCode" style="margin-top: 10px;" data-service="{$service}">
                <div class="col-lg-12">
                    <div class="panel" style="border: 3px dashed rgb(227, 176, 0);">
                        <div class="panel-heading">{l s='Pick point' mod='globkuriermodule'}</div>
                        <div class="panel-body">
                            {l s='Your client wants to pick parcel in parcel point:' mod='globkuriermodule'}<br/>
                            [<strong ng-bind="terminalCode"></strong>]
                            <span ng-if="terminalType == 'ruch'">{l s='ORLEN Paczka' mod='globkuriermodule'}</span>
                            <span ng-if="terminalType == 'inpost'">{l s='Paczkomat InPost' mod='globkuriermodule'}</span>
                            <span ng-if="terminalType == 'pocztex48owp'">{l s='Pocztex48 Odbiór w punkcie' mod='globkuriermodule'}</span>
                            <span ng-if="terminalType == 'dhlparcel'">{l s='DHL ParcelShop' mod='globkuriermodule'}</span>
                            <span ng-if="terminalType == 'dpdpickup'">{l s='DPD Pickup' mod='globkuriermodule'}</span>
                            <br/><br/>
                            {l s='In this case you will be shown only this services.' mod='globkuriermodule'}
                            {l s='If you want to get all services anyway, please click button below' mod='globkuriermodule'}

                            <div class="form-group">
                                <label class="col-lg-4 control-label" style="margin-bottom: 0;
                                    padding-top: 7px; text-align: right; width: 34%;">
                                    {l s='Show all carriers' mod='globkuriermodule'}</label>
                                <div class="col-lg-4">
                                         <span class="switch prestashop-switch fixed-width-lg">
                                            <input name="service_filters" id="service_filters_on" value="1" type="radio">
                                            <label for="service_filters_on" class="radioCheck" ng-click="disableServiceFilters();">
                                                <i class="color_success"></i> {l s='Yes' mod='globkuriermodule'}
                                            </label>
                                            <input name="service_filters" id="service_filters_off" value="0" checked="checked" type="radio">
                                            <label for="service_filters_off" class="radioCheck" ng-click="enableServiceFilters();">
                                                <i class="color_danger"></i> {l s='No' mod='globkuriermodule'}
                                            </label>
                                            <a class="slide-button btn"></a>
                                         </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="col-lg-12"
                 glob-services
                 initial-product-symbol="{$config->defaultServiceCode|escape:'htmlall':'UTF-8'}"
                 recevicer-address="receiver"
                 sender-address="sender"
                 filter-services="filterServices"
                 picked-product="pickedService"></div>
            <div class="col-lg-12" ng-show="pickedService" glob-service-options service-model="pickedService" ng-model="serviceOptions"></div>
        </div>

        <div class="col-lg-4 additionalInfo"
             glob-additional-information
             ng-model="additionalInfo"
             recevicer-address="receiver"
             service-options="serviceOptions"
             service-model="pickedService"></div>

        <!-- Section discount code and summary -->
        <div class="col-lg-12" ng-show="pickedService && additionalInfo && additionalInfo.paymentType" style="margin-top: 20px;">
           <div class="panel">
                <div class="panel-heading">Podsumowanie zamówienia</div>
                <div class="panel-body">
                    <div glob-discount-code-and-summary
                         service-model="pickedService"
                         service-options="serviceOptions"
                         additional-info="additionalInfo"
                         package-info="pickedService.packageInfo"
                         sender-address="senderAddress"
                         recevicer-address="recevicerAddress"
                         discount-code="discountCode"
                         price-error="priceError"></div>
                </div>
            </div>
        </div>

        <div class=" col-lg-12 panel-footer" style="text-align: center;">
            <button
                type="submit"
                class="btn btn-success"
                style="padding: 12px 40px;"
                ng-click="send();"
                ng-hide="orderPlaced"
                ng-disabled="isProcessing || !pickedService || priceError"
            >
                <i class="icon-send" ng-show="!isProcessing"></i>
                <i class="icon-cog icon-spin" ng-show="isProcessing"></i>
                {l s='Send' mod='globkuriermodule'}
            </button>
        </div>
    </div>

    <script type="text/javascript">
        let package = [
            ['senderCountryId', {$config->id_country}],
            ['receiverCountryId', {if !empty($adress) && isset($adress->id_country)}{$adress->id_country}{else}1{/if}],
        ];
        let urlRedirect = '{$urlRedirect}';

        (function () {
            'use strict';

            angular
                .module('newParcelApp')
                .factory('InitialValues', [InitialValuesFactory])
            ;

            function InitialValuesFactory() {
                return {
                    sender : {
                        name: '{$config->defaultSenderName|escape:'javascript':'UTF-8'}',
                        personName: '{$config->defaultSenderPersonName|escape:'javascript':'UTF-8'}',
                        street: '{$config->defaultSenderStreet|escape:'javascript':'UTF-8'}',
                        houseNumber: '{$config->defaultSenderHouseNumber|escape:'javascript':'UTF-8'}',
                        apartmentNumber: '{$config->defaultSenderApartmentNumber|escape:'javascript':'UTF-8'}',
                        postCode: '{$config->defaultSenderPostCode|escape:'javascript':'UTF-8'}',
                        city: '{$config->defaultSenderCity|escape:'javascript':'UTF-8'}',
                        countryCode: '{$config->defaultCountryCode|escape:'javascript':'UTF-8'}',
                        countryId: '{$config->id_country|escape:'javascript':'UTF-8'}',
                        phone: '{$config->defaultSenderPhoneNumber|escape:'javascript':'UTF-8'}',
                        email: '{$config->defaultSenderEmail|escape:'javascript':'UTF-8'}',
                    },
                    {if isset($adress) && !empty($adress)}
                    receiver : {
                        personName: '{$adress->firstname|escape:'javascript':'UTF-8'} {$adress->lastname|escape:'javascript':'UTF-8'}',
                        {if $splitedAddress != null}
                        street: '{$splitedAddress.street|escape:'javascript':'UTF-8'}',
                        houseNumber: '{$splitedAddress.houseNumber|escape:'javascript':'UTF-8'}',
                        apartmentNumber: '{$splitedAddress.apartmentNumber|escape:'javascript':'UTF-8'}',
                        {else}
                        street: '{$adress->address1|escape:'javascript':'UTF-8'}',
                        houseNumber: null,
                        apartmentNumber: null,
                        {/if}
                        postCode: '{$adress->postcode|escape:'javascript':'UTF-8'}',
                        city: '{$adress->city|escape:'javascript':'UTF-8'}',
                        countryCode: '{$country->iso_code|escape:'javascript':'UTF-8'}',
                        countryId: '{if !empty($adress) && isset($adress->id_country)}{$adress->id_country}{else}1{/if}',
                        phone: '{if $adress->phone}{$adress->phone|escape:'javascript':'UTF-8'}{else}{$adress->phone_mobile|escape:'javascript':'UTF-8'}{/if}',
                        email: '{if isset($customer->email)}{$customer->email|escape:'javascript':'UTF-8'}{else}null{/if}',
                        stateId: {$adress->id_state},
                    },
                    {else}
                    receiver : {},
                    {/if}
                    defaultPackageInfo : {
                        content: '{$config->defaultContent|escape:'javascript':'UTF-8'  }',
                        length : {if $config->defaultDepth}{$config->defaultDepth|escape:'javascript':'UTF-8'}{else}null{/if},
                        width  : {if $config->defaultWidth}{$config->defaultWidth|escape:'javascript':'UTF-8'}{else}null{/if},
                        height : {if $config->defaultHeight}{$config->defaultHeight|escape:'javascript':'UTF-8'}{else}null{/if},
                        weight : {if $config->defaultWeight}{$config->defaultWeight|escape:'javascript':'UTF-8'}{else}null{/if},
                        count  : 1,
                    },
                    defaultPaymentType : '{$config->defaultPaymentType|escape:'javascript':'UTF-8'}',
                    defaultCodAccount : '{$config->defaultCodAccount|escape:'javascript':'UTF-8'}',
                    defaultCodAccountHolderName : '{$config->defaultCodAccountHolderName|escape:'javascript':'UTF-8'}',
                    defaultCodAccountHolderAddr1 : '{$config->defaultCodAccountHolderAddr1|escape:'javascript':'UTF-8'}',
                    defaultCodAccountHolderAddr2 : '{$config->defaultCodAccountHolderAddr2|escape:'javascript':'UTF-8'}',
                    defaultServiceCode : '{$config->defaultServiceCode|escape:'javascript':'UTF-8'}',
                    moduleName : 'globkuriermodule',
                    partialsPath : '../modules/globkuriermodule/views/templates/partials/',
                    moduleApiUrl : '{$moduleApiUrl|escape:'javascript':'UTF-8'}',
                    login : '{$config->login|escape:'javascript':'UTF-8'}',
                    password : '{$config->password|escape:'javascript':'UTF-8'}',
                    apiKey : '{$config->apiKey|escape:'javascript':'UTF-8'}',
                    token : '{$token|escape:'javascript':'UTF-8'}',
                    clientId : '{$globClientId|escape:'javascript':'UTF-8'}',
                    todayDate : '{date("Y-m-d")|escape:'javascript':'UTF-8'}',
                    terminalCode : {if isset($terminalCode)}'{$terminalCode|escape:'javascript':'UTF-8'}'{else}null{/if},
                    terminalType : {if isset($terminalType)}'{$terminalType|escape:'javascript':'UTF-8'}'{else}null{/if},
                    terminalType2 : {if isset($terminalType)}'{$terminalType|escape:'javascript':'UTF-8'}'{else}'none'{/if},
                    defaultInPostPoint : {if $config->defaultInPostPoint}'{$config->defaultInPostPoint|escape:'javascript':'UTF-8'}'{else}null{/if},
                    prestaOrderId : '{$orderId|escape:'javascript':'UTF-8'}',
                    collectionTypes: '',
                    senderCountryIdNew : {$config->idCountry},
                    receiverCountryIdNew : {$country_id},
                    isoCode: '{$iso_code|escape:'javascript':'UTF-8'}',
                    lang1: '{l s='Parameter' mod='globkuriermodule'}',
                    lang2: '{l s='is required!' mod='globkuriermodule'}',
                    lang3: '{l s='Contact person' mod='globkuriermodule'}',
                    lang4: '{l s='Change address' mod='globkuriermodule'}',
                    lang5: '{l s='Name' mod='globkuriermodule'}',
                    lang6: '{l s='Street' mod='globkuriermodule'}',
                    lang7: '{l s='House number' mod='globkuriermodule'}',
                    lang8: '{l s='Apartment number' mod='globkuriermodule'}',
                    lang9: '{l s='Postcode' mod='globkuriermodule'}',
                    lang10: '{l s='City' mod='globkuriermodule'}',
                    lang11: '{l s='Country' mod='globkuriermodule'}',
                    lang12: '{l s='change' mod='globkuriermodule'}',
                    lang13: '{l s='Phone' mod='globkuriermodule'}',
                    lang14: '{l s='E-mail' mod='globkuriermodule'}',
                    lang15: '{l s='Cancel' mod='globkuriermodule'}',
                    lang16: '{l s='Save' mod='globkuriermodule'}',
                    lang17: '{l s='Complete the recipients address before quoting' mod='globkuriermodule'}',
                };
            }
        })();
        $(document).ready(function() {

            console.log('npp')

            $(document).on('click', '.searchTerminals', function() {
                console.log('search 1')
                setTimeout(function() {
                    console.log('search 2');

                    $('.select2').select2();
                }, 2500)

                $('.select2').select2();
            });
            $('.select2').select2();
        });
    </script>
    {/if}

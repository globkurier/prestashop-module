/**
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
 */
$(function(){
    
    var self = this;
    // var baseApiUrl = 'http://test.api.globkurier.pl/v1/';
    var baseApiUrl = 'https://api.globkurier.pl/v1/';

    $('img.ajax-loader').hide();

    /** @type {Boolean} flaga, czy paczkomat został zapisany */
    this.inpost_point_saved = false;

    if ($('#opc_payment_methods').length) {
        $('.no_pickup_point_selected').appendTo('#opc_payment_methods');

        var opcCheck = function () {
            var selected_point = $('select[name="pickup_point"]').val();

            if ((!selected_point || selected_point == '0') && isAnyCarrierSelected() ) {
                $('#opc_payment_methods-content').hide();
                $('.no_pickup_point_selected').show();
            } else {
                $('#opc_payment_methods-content').show();
                $('.no_pickup_point_selected').hide();
            }
        };

        $(document).on('click', 'input.delivery_option_radio', function(){
            opcCheck();
            return true;
        });

        $(document).on('change', 'select[name="pickup_point"]', function () {
            opcCheck();
            return true;
        });

        opcCheck();
    }
    
    /**
     * Pokazuje/ukrywa okno z wyborem paczkomatow
     * usuwa ew. informacje o wybranym paczkomacie, kiedy np. klient
     * zmieni zdanie i po wyborze paczkomatu wybierze spowrotem jakiego innego
     */
    // $('input.delivery_option_radio').change(function() {
    $(document).on('click', 'input.delivery_option_radio', function(){
        $('#pickup-terminal-container').hide();
        // $('select[name="pickup_point"]').val(0);
        deletePickupPoint();

        if ($(this).val() == (inpost_carrier_id + ',') || $(this).val() == (inpost_cod_carrier_id + ',')) {
            $('#pickup-terminal-container').show();
            $('input[name="pickup_town"]').data("service-code", "PACZKOMAT");
        } else if ($(this).val() == (paczkaruch_carrier_id + ',')) {
            $('#pickup-terminal-container').show();
            $('input[name="pickup_town"]').data("service-code", "PACZKA_W_RUCHU");
        }

        return true;
    });

    function deletePickupPoint() {
        var postData = {
            id_cart: window.cart_id,
            ajax: 1,
            action: 'deletePickupPoint',
            token: window.gk_token,
        };

        var url = rest_endpoint;
        $.getJSON(url, postData);
    }


    /**
     * Pobiera z serwera globkurier.pl liste paczkomatow
     */
    $(document).on('click','button.search-button',function (e) {
        e.preventDefault();
        // var url = 'https://www.webservices.globkurier.pl/services/terminal/';
        var url = baseApiUrl + 'points';
        var town = $('input[name="pickup_town"]').val();
        var productCode = $('input[name="pickup_town"]').data("service-code");

        $('img.ajax-loader').show();

        getProductId(productCode, function(err, productId) {

            if (err) { console.warn(err);}

            $.getJSON(url, {productId: productId, city: town, isCashOnDeliveryAddonSelected: isInpostCODCarrierSelected()})
            .done(function (r) {
                $('select[name="pickup_point"]').find('option').remove();

                if (r.length) {
                    $('select[name="pickup_point"]').show();
                    $('div.no_pickup_point').hide();

                    var optionHtml = '<option value="0" selected>Proszę wybrać</option>';
                    $('select[name="pickup_point"]').append(optionHtml);

                    $.each(r, function (index, v) {
                        var optionHtml = '<option value="' + v.id + '">';
                        optionHtml += v.city + ' - ' + v.address;
                        optionHtml += ' [' + v.id + ']';
                        optionHtml += '</option>';
                        $('select[name="pickup_point"]').append(optionHtml);
                    });

                    $('select[name="pickup_point"]').select2();

                    $('select[name="pickup_point"]').val("0");
                } else {
                    $('select[name="pickup_point"]').hide();
                    $('div.no_pickup_point').show();
                }

                $('img.ajax-loader').hide();

            });
        });

    });

    /**
     * Nasłuchuje, czy wybrano jakis punkt odbioru - jesli tak, to go zapisuje
     */
    $(document).on('change', 'select[name="pickup_point"]', function () {
        var selected_point = $('select[name="pickup_point"]').val();
        var productCode = $('input[name="pickup_town"]').data("service-code");
        var url = rest_endpoint;
        var a = (productCode == "PACZKOMAT" ? 'saveInPostPoint' : 'savePaczkaRuchPoint');
        var postData = {
            id_cart: cart_id,
            ajax: 1,
            action: a,
            token: gk_token,
            point: selected_point
        };

        if (selected_point === 0 || selected_point == '0') { return true; }

        $('img.ajax-loader').show();

        $.getJSON(url, postData)
        .done(function (r) {
            
            $('img.ajax-loader').hide();

            if (!r.success) {
                alert(r.message);
                return false;
            } else {
                self.inpost_point_saved = true;
            }
        });

        return true;
    });


    /**
     * Zapisuje wybrany paczkomat przed przejsciem do kolejnego kroku
     */
    $(document).on('submit','form[name="carrier_area"]',function(){

        var selected_point = $('select[name="pickup_point"]').val();

        if ((!selected_point || selected_point == '0') && isAnyCarrierSelected()) {
            if (!!$.prototype.fancybox)
                $.fancybox.open([
                {
                    type: 'inline',
                    autoScale: true,
                    minHeight: 30,
                    content: $('.no_pickup_point_selected').html(),
                }]);
            else {
                alert($('.no_pickup_point_selected').text());
            }

            return false;
        }

        return true;
    });

    function getProductId(carrierType, callback) {
        if (['PACZKOMAT', 'PACZKA_W_RUCHU'].indexOf(carrierType) == -1) return callback("Invalid carrier type: " + carrierType);
        var url = baseApiUrl + 'products';
        var dummyParams = {
          length: 10,
          width: 10,
          height: 10,
          weight: 2,
          quantity: 1,
          senderCountryId: 1,
          receiverCountryId: 1,
        };

        $.getJSON(url, dummyParams).done(function (r) {
            for (var i = r.standard.length - 1; i >= 0; i--) {
                var product = r.standard[i];
                if (product.labels.indexOf(carrierType) != -1) return callback(null, product.id);
            }
        }).fail(function (r) {
            return callback("error");
        });
    }

    function isAnyCarrierSelected()
    {
        return (isInpostCODCarrierSelected() || isInpostCarrierSelected() || isRuchCarrierSelected());
    }

    function isInpostCODCarrierSelected() {
        if (window.inpost_cod_carrier_id === undefined) return false;
        return ($('input[value="' + inpost_cod_carrier_id + ',"]').length > 0 && $('input[value="' + inpost_cod_carrier_id + ',"]').is(':checked')) ? true : false;
    }

    function isInpostCarrierSelected() {
        if (window.inpost_carrier_id === undefined) return false;
        return ($('input[value="' + inpost_carrier_id + ',"]').length > 0 && $('input[value="' + inpost_carrier_id + ',"]').is(':checked')) ? true : false;
    }

    function isRuchCarrierSelected() {
        if (window.inpost_carrier_id === undefined) return false;
        return ($('input[value="' + paczkaruch_carrier_id + ',"]').length > 0 && $('input[value="' + paczkaruch_carrier_id + ',"]').is(':checked')) ? true : false;
    }
    
});

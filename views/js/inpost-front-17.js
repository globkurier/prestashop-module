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
$(function () {
    // var baseApiUrl = 'http://test.api.globkurier.pl/v1/';
    var baseApiUrl = 'https://api.globkurier.pl/v1/';
    var mainContainer = $('#pickup-terminal-container');
    var searchTownInput = $('input[name="pickup_town"]');
    var mapOfTerminalPoints;
    var cachedPoints = [];
    if (mainContainer.length === 0 || searchTownInput.length === 0) {
        return;
    }
    mainContainer.appendTo('.delivery-options');
    var _self = this;
    $('img.ajax-loader').hide();
    if (isAnyCarrierSelected()) {
        mainContainer.show();
        var serviceCode = (isRuchCarrierSelected() ? "ORLEN PACZKA" : (isPocztex48owpCarrierSelected() ? "POCZTA POLSKA" : (isDhlParcelCarrierSelected() ? "DHL ParcelShop" : (isDpdPickupCarrierSelected() ? "DPD" : "PACZKOMAT"))));
        searchTownInput.data("service-code", serviceCode);
        loadCachedPoints(serviceCode);
    } else {
        mainContainer.hide();
    }

    /**
     * Pokazuje/ukrywa okno z wyborem paczkomatow
     * usuwa ew. informacje o wybranym paczkomacie, kiedy np. klient
     * zmieni zdanie i po wyborze paczkomatu wybierze spowrotem jakiego innego
     */
    // $('input.delivery_option_radio').change(function() {
    $(document).on('click', '.delivery-option input[type=radio]', function () {
        mainContainer.hide();
        $('.pickup-result').hide();
        deletePickupPoint();
        _self.inpostCarrierSelected = false;
        let carrierName = '',
            all_text = '';

        if ($(this).val() == (inpost_carrier_id + ',')) {
            mainContainer.show();
            searchTownInput.data("service-code", "PACZKOMAT");
            loadCachedPoints("PACZKOMAT");
            carrierName = 'Paczkomatów InPost';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
        } else if ($(this).val() == (paczkaruch_carrier_id + ',')) {
            mainContainer.show();
            searchTownInput.data("service-code", "ORLEN PACZKA");
            loadCachedPoints("ORLEN PACZKA");
            carrierName = 'ORLEN Paczki';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
        } else if ($(this).val() == (pocztex48owp_carrier_id + ',')) {
            mainContainer.show();
            searchTownInput.data("service-code", "POCZTA POLSKA");
            loadCachedPoints("POCZTA POLSKA");
            carrierName = 'Pocztex48';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
        } else if ($(this).val() == (dhlparcel_carrier_id + ',')) {
            mainContainer.show();
            searchTownInput.data("service-code", "DHL PARCEL");
            loadCachedPoints("DHL ParcelShop");
            carrierName = 'DHL ParcelShop';
            // all_text = mainTextLang.replace('miasta', 'miasta i kod pocztowy po przecinku')+' '+mainTextLang2+' '+carrierName;
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
        } else if ($(this).val() == (dpdpickup_carrier_id + ',')) {
            mainContainer.show();
            searchTownInput.data("service-code", "DPD PICKUP");
            loadCachedPoints("DPD Pickup");
            carrierName = 'DPD Pickup';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
        }
        $('.pickup-search span').text(all_text);
        return true;
    });

    function deletePickupPoint()
    {
        var postData = {
            id_cart: cart_id,
            ajax: 1,
            action: 'deletePickupPoint',
            token: gk_token,
        };
        var url = rest_endpoint.replaceAll("&amp;", "&");
        $.getJSON(url, postData);
    }

    $(document).on('click', '#containerForMapOfTerminals .marker-info .marker-info-link', function (e) {
        e.preventDefault();
        var terminalId = $(this).attr("data-terminalId");
        var options = $('select[name="pickup_point"]').find('option');
        for (var i = 0; i < options.length; i++) {
            if (options[i].value == terminalId) {
                options[i].selected = true;
                $('select[name="pickup_point"]').trigger("change");
                break;
            }
        }
        $(this).closest('.gm-style-iw-t').remove();
        $(this).closest('.gm-style-iw-t').find('.gm-style-iw').remove();
        $(this).closest('.gm-style-iw-t').find('.gm-style-iw-tc').remove();
    });

    $(document).on('click', 'button.gm-ui-hover-effect', function(e) {
        e.preventDefault();
        $(this).closest('.gm-style-iw-t').remove();
        $(this).closest('.gm-style-iw-t').find('.gm-style-iw').remove();
        $(this).closest('.gm-style-iw-t').find('.gm-style-iw-tc').remove();
        $('#checkout-delivery-step .content').show();
        return false;
    })

    /**
     * Pobiera z serwera globkurier.pl liste paczkomatow
     */
    $(document).on('click', 'button.search-button', function (e) {
        e.preventDefault();
        // var url = 'https://www.webservices.globkurier.pl/services/terminal/';

        let value = searchTownInput.val();
        if( value.indexOf(',') != -1 ){
            let x = value.split(',');
            console.log(x);
            value = x.join(', ');
            console.log(value)
        }
        let url = baseApiUrl + 'points',
            town = value,
            productCode = searchTownInput.data("service-code"),
            postcode = '';

        $('div.no_results').hide();
        // $('img.ajax-loader').show();
        $('.pickup-result').hide();
        $('.pickup-loader .lds-ripple').show();
        /*if (productCode == 'DHL PARCEL' || productCode == 'DHL ParcelShop') {
            let town_ex = town.split(',');
            town = town_ex[0];
            postcode = town_ex[1];
            getProductId(productCode, function (err, productId) {
                $.getJSON(url, {
                    productId: productId,
                    city: town,
                    postCode: postcode,
                    isCashOnDeliveryAddonSelected: isInpostCODCarrierSelected()
                }).done(function (r) {
                    updateTerminalPoints(r, town);
                    $('img.ajax-loader').hide();
                    $('.pickup-loader .lds-ripple').hide();
                    $('.pickup-result').show();
                });
            });
        } else {*/
        getProductId(productCode, function (err, productId) {
            $.getJSON(url, {
                productId: productId,
                filter: town,
                isCashOnDeliveryAddonSelected: isInpostCODCarrierSelected()
            }).done(function (r) {
                updateTerminalPoints(r, town);
                $('img.ajax-loader').hide();
                $('.pickup-loader .lds-ripple').hide();
                $('.pickup-result').show();
            });
        });
        // }
    });

    $(document).on('change', 'select[name="pickup_point"]', function () {
        var selected_point = $('select[name="pickup_point"]').val();
        if (selected_point === 0 || selected_point == '0') {
            return true;
        }
        var productCode = searchTownInput.data("service-code");
        var url = rest_endpoint.replaceAll("&amp;", "&");
        let a = '';
        switch (productCode) {
            case 'PACZKOMAT':a = 'saveInPostPoint';break;
            case 'ORLEN Paczka':a = 'savePaczkaRuchPoint';break;
            case 'ORLEN PACZKA':a = 'savePaczkaRuchPoint';break;
            case 'DHL PARCEL':a = 'saveDhlParcelPoint';break;
            case 'DHL ParcelShop':a = 'saveDhlParcelPoint';break;
            case 'DPD PICKUP':a = 'saveDpdPickupPoint';break;
            case 'DPD':a = 'saveDpdPickupPoint';break;
            case 'POCZTA POLSKA':a = 'savePocztex48owpPoint';break;
        }

        // var a = (productCode == "PACZKOMAT" ? 'saveInPostPoint' : (productCode == "ORLEN Paczka" ? 'savePaczkaRuchPoint' : (productCode == "DHL PARCEL" ? "saveDhlParcelPoint" : ((productCode == "DPD Pickup" || productCode == 'DPD') ? "saveDpdPickupPoint" : 'savePocztex48owpPoint'))));
        var postData = {
            id_cart: cart_id,
            ajax: 1,
            action: a,
            token: gk_token,
            point: selected_point
        };
        $('.pickup-point-selected').empty()
        let point_name = $('select[name="pickup_point"] option:selected').text();
        // $('img.ajax-loader').show();
        $('.pickup-loader .lds-ripple').show();

        $.getJSON(url, postData)
            .done(function (r) {
                // $('img.ajax-loader').hide();
                $('.pickup-loader .lds-ripple').hide();
                if (!r.success) {
                    alert(r.message);
                    return false;
                }
                $('.pickup-point-selected').append('<p>Wybrany punkt: <b>'+selected_point+'</b><br />'+point_name+'</p>');
            });
        return true;
    });


    /**
     * Zapisuje wybrany paczkomat przed przejsciem do kolejnego kroku
     */
    $(document).on('submit', '#js-delivery', function () {
        var selected_point = $('select[name="pickup_point"]').val();
        if ((!selected_point || selected_point == '0')
            && isAnyCarrierSelected()) {
            if (!!$.prototype.fancybox)
                $.fancybox.open([
                    {
                        type: 'inline',
                        autoScale: true,
                        minHeight: 30,
                        content: $('.no_inpost_point_selected').html(),
                    }]);
            else {
                alert($('.no_inpost_point_selected').text());
            }
            return false;
        }
        return true;
    });

    function getProductId(carrierType, callback)
    {
        if (carrierType == 'DPD') {
            carrierType = 'DPD PICKUP';
        }
        if (carrierType == 'DHL ParcelShop') {
            carrierType = 'DHL PARCEL';
        }
        if (['PACZKOMAT', 'ORLEN PACZKA', 'POCZTA POLSKA', 'DHL PARCEL', 'DPD PICKUP'].indexOf(carrierType) == -1) {
            return callback("Invalid carrier type");
        }
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
                let product = r.standard[i],
                    carrierName = product.carrierName.toUpperCase();

                if (carrierType == 'POCZTA POLSKA') {
                    if (carrierName.indexOf(carrierType) != -1) {
                        let productName = product.name;
                        if (productName.indexOf('Dostawa do Punktu') != -1) {
                            return callback(null, product.id);
                        }
                    }
                } else if (carrierType == 'DPD PICKUP') {
                    carrierType = 'DPD';
                    if (carrierName.indexOf(carrierType) != -1) {
                        let productName = product.name;
                        if (productName.indexOf('DPD PICKUP') != -1) {
                            return callback(null, product.id);
                        }
                    }
                } else {
                    if (carrierName.indexOf(carrierType) != -1) {
                        return callback(null, product.id);
                    }
                }
            }
        }).fail(function (r) {
            return callback("error");
        });
    }

    /**
     * check carrier selected
     * @returns {boolean|boolean}
     */
    function isAnyCarrierSelected()
    {
        return (isInpostCODCarrierSelected() || isInpostCarrierSelected() || isRuchCarrierSelected() || isPocztex48owpCarrierSelected() || isDhlParcelCarrierSelected() || isDpdPickupCarrierSelected());
    }

    function isInpostCODCarrierSelected()
    {
        if (window.inpost_cod_carrier_id === undefined) {
            return false;
        }
        return ($('input[value="' + inpost_cod_carrier_id + ',"]').length > 0 && $('input[value="' + inpost_cod_carrier_id + ',"]').is(':checked')) ? true : false;
    }

    function isInpostCarrierSelected()
    {
        if (window.inpost_carrier_id === undefined) {
            return false;
        }
        return ($('input[value="' + inpost_carrier_id + ',"]').length > 0 && $('input[value="' + inpost_carrier_id + ',"]').is(':checked')) ? true : false;
    }

    function isRuchCarrierSelected()
    {
        if (window.paczkaruch_carrier_id === undefined) {
            return false;
        }
        return ($('input[value="' + paczkaruch_carrier_id + ',"]').length > 0 && $('input[value="' + paczkaruch_carrier_id + ',"]').is(':checked')) ? true : false;
    }

    function isPocztex48owpCarrierSelected()
    {
        if (window.pocztex48owp_carrier_id === undefined) {
            return false;
        }
        return ($('input[value="' + pocztex48owp_carrier_id + ',"]').length > 0 && $('input[value="' + pocztex48owp_carrier_id + ',"]').is(':checked')) ? true : false;
    }

    function isDhlParcelCarrierSelected()
    {
        if (window.dhlparcel_carrier_id === undefined) {
            return false;
        }
        return ($('input[value="' + dhlparcel_carrier_id + ',"]').length > 0 && $('input[value="' + dhlparcel_carrier_id + ',"]').is(':checked')) ? true : false;
    }

    function isDpdPickupCarrierSelected()
    {
        if (window.dpdpickup_carrier_id === undefined) {
            return false;
        }
        return ($('input[value="' + dpdpickup_carrier_id + ',"]').length > 0 && $('input[value="' + dpdpickup_carrier_id + ',"]').is(':checked')) ? true : false;
    }

    function loadCachedPoints(serviceCode)
    {
        if (typeof (google) === "undefined") {
            return;
        }
        var url = rest_endpoint.replaceAll("&amp;", "&");
        var postData = {
            id_cart: cart_id,
            ajax: 1,
            action: 'cachedTerminalPoints',
            serviceCode: serviceCode,
            token: gk_token,
        };
        // $('img.ajax-loader').show();
        $('.pickup-loader .lds-ripple').show();
        $.getJSON(url, postData).done(function (r) {
            if (!r.success) {
                console.log(r);
            }
            cachedPoints = r.data;
            fillDropdownWithTerminals();
            $('img.ajax-loader').hide();
            $('.pickup-loader .lds-ripple').hide();
            drawMap();
        }).fail(function (r) {
            $('img.ajax-loader').hide();
            $('.pickup-loader .lds-ripple').hide();
            console.log(r);
        });
    }

    function updateTerminalPoints(r, town)
    {
        if (typeof (google) === "undefined") {
            cachedPoints = r;
            fillDropdownWithTerminals();
            return;
        }
        var ids = new Set(cachedPoints.map(d => d.id));
        var newResult = [...r.filter(d => !ids.has(d.id))];
        if (newResult.length > 0) {
            console.warn("ADMIN: Please refresh terminal points");
            cachedPoints = [...cachedPoints, ...newResult.filter(d => !ids.has(d.ID))];
            fillDropdownWithTerminals();
            drawMap();
        }
        if (r.length > 0) {
            centerMapToTown(town);
        } else {
            $('div.no_results b').text(town);
            $('div.no_results').show();
        }
    }

    function centerMapToTown(town)
    {
        if (typeof (google) === "undefined") {
            return;
        }
        let geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            'address': town
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                mapOfTerminalPoints.setCenter(results[0].geometry.location);
                mapOfTerminalPoints.setZoom(12);
            }
        });
    }

    function drawMap()
    {
        if (typeof (google) === "undefined") {
            return;
        }
        var myOptions = {
            zoom: 6,
            center: new google.maps.LatLng(51.9194, 19.1451), // center of poland  results[0].geometry.location,
            disableDefaultUI: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        var mapContainer = $("#containerForMapOfTerminals");
        mapContainer.show();
        mapOfTerminalPoints = new google.maps.Map(document.getElementById("containerForMapOfTerminals"), myOptions);
        markers = cachedPoints.map((item, i) => {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(item.latitude, item.longitude),
                title: item.name + ' ' + item.address
            });
            attachClickCallbackEvent(marker, item);
            return marker;
        });
        new MarkerClusterer(mapOfTerminalPoints, markers, {
            imagePath:
                "https://unpkg.com/@googlemaps/markerclustererplus@1.0.3/images/m",
        });
    }

    function attachClickCallbackEvent(marker, terminalItem)
    {
        const infowindow = new google.maps.InfoWindow({
            content: `<div class="marker-info">
            <p>${terminalItem.name}</p>
            <p>${terminalItem.address}</p>
            <p>${terminalItem.city} ${terminalItem.postCode} </p>
            <p><a data-terminalId="${terminalItem.id}" class="marker-info-link btn btn-primary">Wybierz</a></p>
            </div>`,
        });
        marker.addListener("click", () => {
            infowindow.open(marker.getMap(), marker);
        });
    }

    function fillDropdownWithTerminals()
    {
        var selectElement = $('select[name="pickup_point"]');
        selectElement.find('option').remove();
        if (cachedPoints && cachedPoints.length) {
            $('div.no_inpost_point').hide();
            var options = cachedPoints.map((v, i) => { return `<option value="${v.id}">${v.city} - ${v.address} [${v.id} -  ${v.name}]</option>` });
            options.unshift('<option value="0" selected>Proszę wybrać</option>');
            selectElement.append(options);
            selectElement.show();
            selectElement.val("0");
            selectElement.select2();
        } else {
            selectElement.hide();
            $('div.no_inpost_point').show();
        }
    }
});

$(document).on('ready', function () {
    let delivery_select = 0,
        carrierName = '',
        mainContainer = $('#pickup-terminal-container'),
        searchTownInput = $('input[name="pickup_town"]'),
        all_text = '';
    $('.delivery-option input[type=radio]').each(function() {
        if ($(this).is(':checked')) {
            delivery_select = parseInt($(this).val());
        }
    });
    if (delivery_select > 0) {
        if (delivery_select == (inpost_carrier_id)) {
            mainContainer.show();
            searchTownInput.data("service-code", "PACZKOMAT");
            // loadCachedPoints("PACZKOMAT");
            carrierName = 'Paczkomatów InPost';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
        } else if (delivery_select == (paczkaruch_carrier_id)) {
            mainContainer.show();
            searchTownInput.data("service-code", "ORLEN PACZKA");
            // loadCachedPoints("ORLEN PACZKA");
            carrierName = 'ORLEN Paczki';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
        } else if (delivery_select == (pocztex48owp_carrier_id)) {
            mainContainer.show();
            searchTownInput.data("service-code", "POCZTA POLSKA");
            // loadCachedPoints("POCZTA POLSKA");
            carrierName = 'Pocztex48';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
        } else if (delivery_select == (dhlparcel_carrier_id)) {
            mainContainer.show();
            searchTownInput.data("service-code", "DHL PARCEL");
            // loadCachedPoints("DHL ParcelShop");
            carrierName = 'DHL ParcelShop';
            // all_text = mainTextLang.replace('miasta', 'miasta i kod pocztowy po przecinku')+' '+mainTextLang2+' '+carrierName;
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
        } else if (delivery_select == (dpdpickup_carrier_id)) {
            mainContainer.show();
            searchTownInput.data("service-code", "DPD PICKUP");
            // loadCachedPoints("DPD Pickup");
            carrierName = 'DPD Pickup';
            all_text = mainTextLang+' '+mainTextLang2+' '+carrierName;
        }
        // $('.pickup-search span').text(mainTextLang+' '+mainTextLang2+' '+carrierName);
        $('.pickup-search span').text(all_text);
        // if (carrierName == 'DHL ParcelShop') {
        //     let search_val = $('.pickup_town').val();
        //     $('.pickup_town').val(search_val)
        // }
    }
});

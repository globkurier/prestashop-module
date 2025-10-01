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

(function() {
	'use strict';

	function buildServiceCard(product) {
		var logo = product.carrierLogoLink ? '<img src="' + product.carrierLogoLink + '" alt="' + (product.carrierName || '') + '" />' : '';
		var price = (product.netPrice != null) ? (product.netPrice + ' zł netto') : '';
		return (
			'<div class="col-lg-4 glob-product-block">' +
				logo + '<br/>' +
				'<strong>' + (product.carrierName || '') + '</strong><br/>' +
				'<span>' + (product.name || '') + '</span><br/><br/>' +
				'<strong>' + price + '</strong><br/><br/>' +
				'<button class="btn btn-sm btn-success pick-service" ' +
				'	data-id="' + product.id + '" ' +
				'	data-name="' + (product.carrierName || '') + '">Wybierz</button>' +
			'</div>'
		);
	}

	function fetchServices() {
		var params = {
			length: $('input[name=config_defaultDepth]').val(),
			width: $('input[name=config_defaultWidth]').val(),
			height: $('input[name=config_defaultHeight]').val(),
			weight: $('input[name=config_defaultWeight]').val(),
			quantity: 1,
			senderCountryId: 1,
			receiverCountryId: 1
		};
		var headers = {};
		if (typeof window.tokenAPI !== 'undefined' && window.tokenAPI) {
			headers['x-auth-token'] = window.tokenAPI;
		}
		var url = 'https://api.globkurier.pl/v1/products?' + new URLSearchParams(params).toString();
		return fetch(url, { headers: headers })
			.then(function(r) { return r.json(); })
			.then(function(data) {
				var list = [];
				if (data && Array.isArray(data.standard)) {
					list = data.standard;
				}
				var html = list.map(buildServiceCard).join('');
				$('#servicesList').html(html || '<div class="col-lg-12 text-center">Brak usług</div>');
				$('#servicesModal').modal('show');
			});
	}

	function bindEvents() {
		$(document).on('click', '#openServicesModal', function() {
			fetchServices().catch(function() {
				$('#servicesList').html('<div class="col-lg-12 text-center">Błąd podczas pobierania usług</div>');
				$('#servicesModal').modal('show');
			});
		});

		$(document).on('click', '.pick-service', function() {
			var id = $(this).data('id');
			var name = $(this).data('name');
			$('input[name=config_defaultServiceCode]').val(id);
			$('input[name=config_defaultServiceName]').val(name);
			$('#selectedServiceName').text(name || '');
			$('#servicesModal').modal('hide');
		});

		$(document).on('click', '#updateCacheBtn', function() {
			var $btn = $(this);
			var url = $btn.data('url');
			$btn.prop('disabled', true);
			$('#cacheLoading').show();
			fetch(url)
				.finally(function() {
					$btn.prop('disabled', false);
					$('#cacheLoading').hide();
				});
		});
	}

	$(bindEvents);
})();



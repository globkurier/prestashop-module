/**
 * New Parcel page (BO) – minimal jQuery MVP replacing Angular
 * Note: This provides the skeleton and basic interactions. Extend feature parity as needed.
 */

(function() {
	'use strict';

	const GK = window.GK || (window.GK = {});
	GK.state = {
		isProcessing: false,
		orderPlaced: null,
		sender: {},
		receiver: {},
		pickedService: null,
		serviceOptions: [],
		additionalInfo: { paymentType: null },
		discountCode: '',
		priceError: null,
		orderSummary: null,
		packageInfo: null,
		availablePayments: [],
		forModal: false,
		forceShowAll: false
	};


function setProcessing(on) {
		GK.state.isProcessing = !!on;
		$('#processingBox').toggle(!!on);
		$('#sendIcon').toggle(!on);
		$('#processingIcon').toggle(!!on);
	}

	function updateEnabledOptionsUI() {
		const s = GK.state;
		// derive active addon categories
		const activeCategories = (s.serviceOptions || []).map(function(v){ return v && v.category ? v.category : (v.category || ''); });
		// NKO → force COD and disable payment select
		if (activeCategories.indexOf('NKO') !== -1) {
			$('#paymentSelect').val('COD').prop('disabled', true);
			if (!s.additionalInfo) s.additionalInfo = {};
			s.additionalInfo.paymentType = 'COD';
		} else {
			$('#paymentSelect').prop('disabled', false);
			if (s.additionalInfo && s.additionalInfo.paymentType === 'COD' && activeCategories.indexOf('NKO') === -1) {
				// keep as chosen by user; do nothing
			}
		}
		// CASH_ON_DELIVERY → show COD fields
		const hasCOD = activeCategories.indexOf('CASH_ON_DELIVERY') !== -1;
		$('#codAmountGroup, #codAccountGroup, #codAccountHolderGroup, #codAccountAddr1Group, #codAccountAddr2Group').toggle(hasCOD);
		if (hasCOD) {
			// Fill all COD fields with defaults like Angular does
			if (window.InitialValues && window.InitialValues.defaultCodAccount) {
				$('#codAccountInput').val(window.InitialValues.defaultCodAccount);
				if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
				GK.state.additionalInfo.codAccount = window.InitialValues.defaultCodAccount;
			}
			if (window.InitialValues && window.InitialValues.defaultCodAccountHolderName) {
				$('#codAccountHolderInput').val(window.InitialValues.defaultCodAccountHolderName);
				if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
				GK.state.additionalInfo.codAccountHolder = window.InitialValues.defaultCodAccountHolderName;
			}
			if (window.InitialValues && window.InitialValues.defaultCodAccountHolderAddr1) {
				$('#codAccountAddr1Input').val(window.InitialValues.defaultCodAccountHolderAddr1);
				if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
				GK.state.additionalInfo.codAccountAddr1 = window.InitialValues.defaultCodAccountHolderAddr1;
			}
			if (window.InitialValues && window.InitialValues.defaultCodAccountHolderAddr2) {
				$('#codAccountAddr2Input').val(window.InitialValues.defaultCodAccountHolderAddr2);
				if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
				GK.state.additionalInfo.codAccountAddr2 = window.InitialValues.defaultCodAccountHolderAddr2;
			}
		} else {
			$('#codAmountInput, #codAccountInput, #codAccountHolderInput, #codAccountAddr1Input, #codAccountAddr2Input').val('');
		}
		// INSURANCE → show insurance amount
		const hasInsurance = activeCategories.indexOf('INSURANCE') !== -1;
		$('#insuranceAmountGroup').toggle(hasInsurance);
		if (!hasInsurance) { $('#insuranceAmountInput').val(''); }
		// International → declared value + purpose when receiver ISO != PL
		const receiverIso = (s.receiver && s.receiver.country && (s.receiver.country.isoCode || s.receiver.country.code || s.receiver.country.iso)) || (window.InitialValues && window.InitialValues.receiver && window.InitialValues.receiver.countryCode) || null;
		const isInternational = receiverIso && (receiverIso.toUpperCase() !== 'PL');
		$('#declaredValueGroup, #purposeGroup').toggle(!!isInternational);
		if (!isInternational) { $('#declaredValueInput').val(''); $('#purposeSelect').val(''); }
	}

function showOrderPlaced(order) {
		GK.state.orderPlaced = order;
		$('#mainFormBox').hide();
		$('#orderPlacedBox').show();

		// Display the shipment number
		if (order && order.gkId) {
			$('#orderPlacedNumber').text(order.gkId);
		} else {
			$('#orderPlacedNumber').text('Brak numeru');
		}
	}

	function clearErrors() {
		$('#orderErrorList').empty();
		$('#orderErrorBox').hide();
		$('#validationErrorBox').hide();
		$('#valErrSenderPhone').hide();
		$('#valErrReceiverPhone').hide();
	}

	function showValidationErrors(err) {
		if (err.noSenderPhone) $('#valErrSenderPhone').show();
		if (err.noReceiverPhone) $('#valErrReceiverPhone').show();
		$('#validationErrorBox').show();
	}

function showOrderErrors(obj) {
    const $ul = $('#orderErrorList');
		Object.keys(obj || {}).forEach(function(k) {
			$ul.append('<li>' + k + ': ' + obj[k] + '</li>');
		});
		$('#orderErrorBox').show();
	}

	function validate() {
		const r = {};
		if (!GK.state.sender.phone) r.noSenderPhone = true;
		if (!GK.state.receiver.phone) r.noReceiverPhone = true;
		return Object.keys(r).length ? r : null;
	}

	function buildOrderData() {
		const s = GK.state;
		// Determine collection type like Angular does
		let collectionType = 'PICKUP';
		if (s.pickedService && s.pickedService.collectionTypes) {
			if (s.pickedService.collectionTypes.length > 1) {
				// Multiple options available, use user selection
				collectionType = $('input[name=pickup_type]:checked').val() || 'PICKUP';
			} else {
				// Only one option available, use it
				collectionType = s.pickedService.collectionTypes[0];
			}
		}
		const addons = generateAdditionalServices(s.serviceOptions || [], s.additionalInfo || {});

		const data = {
			shipment: {
				length: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.length : null,
				width: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.width : null,
				height: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.height : null,
				weight: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.weight : null,
				productId: s.pickedService ? s.pickedService.id : null,
				quantity: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.count : 1
			},
			senderAddress: {},
			receiverAddress: {},
			content: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.content : '',
			paymentId: s.additionalInfo.paymentType,
			addons: addons,
			collectionType: collectionType,
			agreements: {},
			originId: "PRESTASHOP_API"
		};

		// Add pickup data for PICKUP collection type
		if (collectionType === 'PICKUP') {
			data.pickup = generatePickup(s.additionalInfo || {});
		}


		// map sender/receiver
		['sender','receiver'].forEach(function(role){
			const src = s[role] || {};
			const dst = (role === 'sender') ? data.senderAddress : data.receiverAddress;
			dst.name = src.name;
			dst.city = src.city;

			dst.street = src.street;
			dst.houseNumber = src.houseNumber;

			dst.postCode = src.postalCode;
			dst.countryId = src.country && src.country.id;

			dst.phone = src.phone;

			dst.email = src.email;
			dst.contactPerson = src.contactPerson;

			// Add apartment number if exists
			if (src.apartmentNumber) {
				dst.apartmentNumber = src.apartmentNumber;
			}

			// Add pointId for specific carrier terminal points (like Angular does in generateAddress)
			// For POINT collection type OR when delivery is to POINT (like InPost Paczkomat)
			const isPointDelivery = collectionType === 'POINT' || (s.pickedService && s.pickedService.deliveryTypes && s.pickedService.deliveryTypes.includes('POINT'));
			if (s.pickedService && isPointDelivery) {
				const carrierName = (s.pickedService.carrierName || '').toLowerCase();
				const serviceName = (s.pickedService.name || '').toLowerCase();
				const collectionTypes = s.pickedService.collectionTypes || [];

				// InPost - receiver and sender points
				if (carrierName.indexOf('inpost') > -1 && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'inPostReceiverPoint' : 'inPostSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
				// DHL - receiver and sender points
				else if (carrierName.indexOf('dhl') > -1 && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'dhlparcelReceiverPoint' : 'dhlparcelSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
				// Orlen/Ruch - receiver and sender points
				else if ((carrierName.indexOf('orlen') > -1 || carrierName.indexOf('ruch') > -1) && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'paczkaRuchReceiverPoint' : 'paczkaRuchSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
				// Poczta Polska - receiver and sender points
				else if (carrierName.indexOf('poczta') > -1 && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'pocztex48owpReceiverPoint' : 'pocztex48owpSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
				// DPD - receiver and sender points
				else if (carrierName.indexOf('dpd') > -1 && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'dpdpickupReceiverPoint' : 'dpdpickupSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
				// FedEx - receiver and sender points
				else if (carrierName.indexOf('fedex') > -1 && s.additionalInfo) {
					const pointKey = role === 'receiver' ? 'fedexReceiverPoint' : 'fedexSenderPoint';
					if (s.additionalInfo[pointKey] && s.additionalInfo[pointKey].id) {
						dst.pointId = s.additionalInfo[pointKey].id;
					}
				}
			}

			// Also add terminal/point ID for POINT collection type (fallback)
			const isPointDeliveryFallback = collectionType === 'POINT' || (s.pickedService && s.pickedService.deliveryTypes && s.pickedService.deliveryTypes.includes('POINT'));
			if (isPointDeliveryFallback && src.terminal) {
				dst.pointId = src.terminal;
			}

			// Add state ID if exists (for international shipments) - only if > 0 like Angular
			// Use separate stateType for sender and receiver like Angular
			if (role === 'sender' && s.additionalInfo && s.additionalInfo.senderStateType && s.additionalInfo.senderStateType > 0) {
				dst.stateId = s.additionalInfo.senderStateType;
			} else if (role === 'receiver' && s.additionalInfo && s.additionalInfo.stateType && s.additionalInfo.stateType > 0) {
				dst.stateId = s.additionalInfo.stateType;
			}
		});

		// Add international shipment fields (like Angular)
		if (data.senderAddress.countryId !== data.receiverAddress.countryId) {
			if (s.additionalInfo && s.additionalInfo.declaredValue) {
				data.declaredValue = s.additionalInfo.declaredValue;
			}
			if (s.additionalInfo && s.additionalInfo.purpose) {
				data.purpose = s.additionalInfo.purpose;
			}
		}

		// Add customs section for international shipments (like in the API example)
		if (data.senderAddress.countryId !== data.receiverAddress.countryId) {
			data.customs = {
				currency: (GK.state.orderSummary && GK.state.orderSummary.currency) || 'EUR',
				total: s.additionalInfo && s.additionalInfo.declaredValue ? parseFloat(s.additionalInfo.declaredValue) : 0,
				totalWeight: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.weight : 0,
				sender: {
					eori: 'PL812350554600000' // Default EORI for testing
				},
				receiver: {
					eori: 'PL107194088600000' // Default EORI for testing
				},
				commodities: [{
					description: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.content : 'Goods',
					hsCode: '96081099', // Default HS code from API example
					countryOfOrigin: 'PL', // Use country code instead of ID
					quantity: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.count : 1,
					unitValue: s.additionalInfo && s.additionalInfo.declaredValue ? parseFloat(s.additionalInfo.declaredValue) : 0,
					subTotalValue: s.additionalInfo && s.additionalInfo.declaredValue ? parseFloat(s.additionalInfo.declaredValue) : 0,
					unitWeight: s.pickedService && s.pickedService.packageInfo ? s.pickedService.packageInfo.weight : 0
				}],
				exportReasonType: 'SALE', // Default export reason
				invoiceNumber: 'INV-' + new Date().getTime(), // Generate invoice number
				invoiceDate: new Date().toISOString().split('T')[0] // Today's date
			};
		}

		// Add declared value if exists (regardless of international)
		if (s.additionalInfo && s.additionalInfo.declaredValue) {
			data.declaredValue = s.additionalInfo.declaredValue;
		}

		return data;
	}

	function generatePickup(additionalInfo) {
		const pickup = {
			date: additionalInfo.sendDate || (window.InitialValues && window.InitialValues.todayDate) || new Date().toISOString().split('T')[0]
		};

		if (additionalInfo.timeRange && additionalInfo.timeRange.timeFrom) {
			pickup.timeFrom = additionalInfo.timeRange.timeFrom;
		}
		if (additionalInfo.timeRange && additionalInfo.timeRange.timeTo) {
			pickup.timeTo = additionalInfo.timeRange.timeTo;
		}

		return pickup;
	}

	function generateAdditionalServices(serviceOptions, additionalInfo) {
		if (!Array.isArray(serviceOptions)) return [];

		const addons = [];
		serviceOptions.forEach(function(option) {
			const addon = { id: option.id };

			// Only add value field for specific categories (like Angular does)
			if (option.category === 'CASH_ON_DELIVERY') {
				addon.value = additionalInfo.codAmount || '';
				if (additionalInfo.codAccount) addon.bankAccountNumber = additionalInfo.codAccount.replace(/\s/g, '');
				if (additionalInfo.codAccountHolder) addon.name = additionalInfo.codAccountHolder;
				if (additionalInfo.codAccountAddr1) addon.addressLine1 = additionalInfo.codAccountAddr1;
				if (additionalInfo.codAccountAddr2) addon.addressLine2 = additionalInfo.codAccountAddr2;
			} else if (option.category === 'INSURANCE') {
				addon.value = additionalInfo.insuranceAmount || '';
			}
			// For other addons, don't add value field unless explicitly provided

			addons.push(addon);
		});

		return addons;
	}

	function placeOrder() {
		clearErrors();
		const err = validate();
		if (err) { showValidationErrors(err); return; }
		if (!GK.state.pickedService) return;

		// Validate pickup date and time
		const collectionType = $('input[name=pickup_type]:checked').val() || 'PICKUP';
		if (collectionType === 'PICKUP') {
			const sendDate = $('#sendDateInput').val();
			const timeRange = $('#pickupTimeSelect').val();
			if (!sendDate) {
				showOrderErrors({ pickup: 'Please select pickup date' });
				return;
			}
			if (!timeRange) {
				showOrderErrors({ pickup: 'Please select pickup time range' });
				return;
			}
			// Validate that the date is not in the past
			const today = new Date().toISOString().split('T')[0];
			if (sendDate < today) {
				showOrderErrors({ pickup: 'Pickup date cannot be in the past' });
				return;
			}
		// Check if date is in available dates
		if (GK.state.availablePickupDates && GK.state.availablePickupDates.length > 0) {
			if (!GK.state.availablePickupDates.includes(sendDate)) {
				showOrderErrors({ pickup: 'Pickup date is not available, please select another date' });
				return;
			}
		} else {
			// If no available dates fetched, use today or tomorrow as fallback
			const today = new Date().toISOString().split('T')[0];
			const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
			if (sendDate < today) {
				sendDate = today; // Use today if date is in the past
			}
		}
		}

		// Validate international shipment fields
		if (GK.state.sender && GK.state.sender.country && GK.state.receiver && GK.state.receiver.country &&
			GK.state.sender.country.id !== GK.state.receiver.country.id) {
			if (!GK.state.additionalInfo || !GK.state.additionalInfo.purpose) {
				showOrderErrors({ purpose: 'Purpose is required for international shipments' });
				return;
			}
			if (!GK.state.additionalInfo || !GK.state.additionalInfo.declaredValue) {
				showOrderErrors({ declaredValue: 'Declared value is required for international shipments' });
				return;
			}
		}

		// Validate required addons
		if (GK.state.customRequired && GK.state.customRequired.requiredAddons) {
			const requiredAddons = GK.state.customRequired.requiredAddons;
			const selectedAddonIds = (GK.state.serviceOptions || []).map(function(opt) { return opt.id; });
			const missingAddons = requiredAddons.filter(function(reqId) {
				return !selectedAddonIds.some(function(selId) { return (selId + '') === (reqId + ''); });
			});
			if (missingAddons.length > 0) {
				showOrderErrors({ addons: 'Required addons are missing: ' + missingAddons.join(', ') });
				return;
			}
		}

		setProcessing(true);
		const orderData = buildOrderData();
		const token = window.InitialValues && window.InitialValues.token;
		fetch('https://api.globkurier.pl/v1/order', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'accept-language': (window.InitialValues && window.InitialValues.isoCode === 'pl') ? 'pl' : 'en',
				'x-auth-token': token || ''
			},
			body: JSON.stringify(orderData)
		}).then(function(r){ return r.json(); })
		.then(function(resp){
			if (!resp || !resp.number) throw resp || {};
			// Save in shop
			const moduleApiUrl = (window.InitialValues && window.InitialValues.moduleApiUrl) || '';
			const dataToSend = {
				gkId: resp.number,
				hash: resp.hash || '',
				orderId: (window.InitialValues && window.InitialValues.prestaOrderId) || null,
				crateDate: null,
				receiver: GK.state.receiver && GK.state.receiver.name,
				content: orderData.content,
				weight: orderData.shipment.weight,
				carrier: GK.state.pickedService ? (GK.state.pickedService.carrierName + ' - ' + GK.state.pickedService.name) : '',
				comments: '',
				cod: GK.state.additionalInfo && GK.state.additionalInfo.codAmount ? GK.state.additionalInfo.codAmount : 0,
				payment: GK.state.additionalInfo && GK.state.additionalInfo.paymentType
			};
			const url = moduleApiUrl + '&ajax=1&action=addNewGlobOrder&data=' + encodeURIComponent(JSON.stringify(dataToSend));
			return fetch(url).then(function(r){ return r.json(); }).then(function(){
				showOrderPlaced({ gkId: resp.number });
			});
		})
		.catch(function(e){
			showOrderErrors(e && e.fields ? e.fields : { common: 'Błąd podczas składania zamówienia' });
		})
		.finally(function(){ setProcessing(false); });
	}

	function bind() {
		$(document).on('click', '#orderErrorClose', function(){ $('#orderErrorBox').hide(); });
		$(document).on('click', '#validationErrorClose', function(){ $('#validationErrorBox').hide(); });
		$(document).on('click', '#sendOrderBtn', placeOrder);
	}

function initStateFromInitialValues() {
    const iv = window.InitialValues || {};
		GK.state.sender = {
			name: (iv.sender && iv.sender.name) || '',
			street: (iv.sender && iv.sender.street) || '',
			houseNumber: (iv.sender && iv.sender.houseNumber) || '',
			apartmentNumber: (iv.sender && iv.sender.apartmentNumber) || '',
			postalCode: (iv.sender && iv.sender.postCode) || '',
			city: (iv.sender && iv.sender.city) || '',
			country: iv.sender && iv.sender.countryId ? { id: iv.sender.countryId } : null,
			contactPerson: (iv.sender && iv.sender.personName) || '',
			phone: (iv.sender && iv.sender.phone) || '',
			email: (iv.sender && iv.sender.email) || ''
		};
        const rv = iv.receiver || {};
		GK.state.receiver = {
			name: rv.personName || rv.name || '',
			street: rv.street || '',
			houseNumber: rv.houseNumber || '',
			apartmentNumber: rv.apartmentNumber || '',
			postalCode: rv.postCode || rv.postalCode || '',
			city: rv.city || '',
			country: rv.countryId ? { id: rv.countryId, isoCode: (rv.countryCode || rv.countryIso || rv.isoCode || null) } : (rv.countryCode ? { id: null, isoCode: rv.countryCode } : null),
			contactPerson: rv.personName || '',
			phone: rv.phone || '',
			email: rv.email || ''
		};
		if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
		// Initialize stateType from InitialValues if available
		// Only set stateType if stateId > 0 (like Angular logic)
		// NOTE: stateId from PrestaShop needs to be mapped to Globkurier state IDs
		if (iv.receiver && iv.receiver.stateId && iv.receiver.stateId > 0) {
			// For now, don't auto-set stateType from PrestaShop stateId
			// User should select state from Globkurier API list
			// GK.state.additionalInfo.stateType = iv.receiver.stateId;
		}
		// Initialize receiver points from InitialValues (like Angular)
		if (iv.terminalCode && iv.terminalType) {
			switch (iv.terminalType) {
				case 'inpost':
					GK.state.additionalInfo.inPostReceiverPoint = { id: iv.terminalCode };
					break;
				case 'ruch':
					GK.state.additionalInfo.paczkaRuchReceiverPoint = { id: iv.terminalCode };
					break;
				case 'pocztex48owp':
					GK.state.additionalInfo.pocztex48owpReceiverPoint = { id: iv.terminalCode };
					break;
				case 'dhlparcel':
					GK.state.additionalInfo.dhlparcelReceiverPoint = { id: iv.terminalCode };
					break;
				case 'dpdpickup':
					GK.state.additionalInfo.dpdpickupReceiverPoint = { id: iv.terminalCode };
					break;
			}
		}

		// Also set default sender point if available (like Angular)
		if (iv.defaultInPostPoint) {
			GK.state.additionalInfo.inPostSenderPoint = { id: iv.defaultInPostPoint };
		}

		// make sure UI reflects current international rules immediately
        try { updateEnabledOptionsUI(); } catch(e) {}
        try { preloadCountriesMap().then(ensureCountryIdsFromIso); } catch(e) { ensureCountryIdsFromIso(); }
	}

// Mapuje country.id po isoCode na podstawie listy z /countries (bez twardych wyjątków)
// Maps country.id by isoCode using /countries list (no hardcoded exceptions)
function ensureCountryIdsFromIso() {
    const s = GK.state;
    if (!s) return;
    const map = (window.GK && window.GK.countriesMap) ? window.GK.countriesMap : null;
    function normalizeCountry(country, fallbackId) {
        if (!country) return null;
        const iso = (country.isoCode || country.code || country.iso || '').toUpperCase();
        // Special handling for USA like Angular (countryId = 30)
        if (iso === 'US') {
            country.id = 30;
            return country;
        }
        // if we have a countries map, override id based on ISO
        if (map && map[iso]) { country.id = map[iso]; return country; }
        // fallback: use id from InitialValues (if provided)
        if (fallbackId) { country.id = fallbackId; return country; }
        // if id already set and no map/fallback, keep as is
        if (country.id) return country;
        // no reliable source → leave unchanged
        return country;
    }
    if (s.sender && s.sender.country) s.sender.country = normalizeCountry(s.sender.country, (window.InitialValues && window.InitialValues.senderCountryIdNew));
    if (s.receiver && s.receiver.country) s.receiver.country = normalizeCountry(s.receiver.country, (window.InitialValues && window.InitialValues.receiverCountryIdNew));
}

// Fetch countries once and build ISO -> ID map
function preloadCountriesMap() {
    if (!window.GK) window.GK = {};
    if (window.GK.countriesMapLoaded) return Promise.resolve(window.GK.countriesMap || {});
    const url = 'https://api.globkurier.pl/v1/countries';
    return fetch(url, { headers: buildHeaders() })
        .then(function(r){ return r.json(); })
        .then(function(list){
            const map = {};
            if (Array.isArray(list)) {
                list.forEach(function(c){ if (c && c.isoCode) { map[(c.isoCode + '').toUpperCase()] = c.id; } });
            }
            window.GK.countriesMap = map;
            window.GK.countriesMapLoaded = true;
            return map;
        })
        .catch(function(){ window.GK.countriesMapLoaded = true; return {}; });
}

function renderAddressBoxes() {
    // populate sender
    $('#sender_name').val(GK.state.sender.name);
    $('#sender_street').val(GK.state.sender.street);
    $('#sender_houseNumber').val(GK.state.sender.houseNumber);
    $('#sender_apartmentNumber').val(GK.state.sender.apartmentNumber);
    $('#sender_postalCode').val(GK.state.sender.postalCode);
    $('#sender_city').val(GK.state.sender.city);
    $('#sender_phone').val(GK.state.sender.phone);
    $('#sender_email').val(GK.state.sender.email);
    // populate receiver
    $('#receiver_name').val(GK.state.receiver.name);
    $('#receiver_street').val(GK.state.receiver.street);
    $('#receiver_houseNumber').val(GK.state.receiver.houseNumber);
    $('#receiver_apartmentNumber').val(GK.state.receiver.apartmentNumber);
    $('#receiver_postalCode').val(GK.state.receiver.postalCode);
    $('#receiver_city').val(GK.state.receiver.city);
    $('#receiver_phone').val(GK.state.receiver.phone);
    $('#receiver_email').val(GK.state.receiver.email);

    // bind
    $(document).on('input change', '#sender_name,#sender_street,#sender_houseNumber,#sender_apartmentNumber,#sender_postalCode,#sender_city,#sender_phone,#sender_email', function(){
        const id = this.id.replace('sender_','');
        GK.state.sender[id] = $(this).val();
        if (GK.state.sender.phone && GK.state.receiver.phone) { $('#validationErrorBox').hide(); }
    });
    $(document).on('input change', '#receiver_name,#receiver_street,#receiver_houseNumber,#receiver_apartmentNumber,#receiver_postalCode,#receiver_city,#receiver_phone,#receiver_email', function(){
        const id = this.id.replace('receiver_','');
        GK.state.receiver[id] = $(this).val();
        if (GK.state.sender.phone && GK.state.receiver.phone) { $('#validationErrorBox').hide(); }
    });
}

function populateDisplayPanels() {
    // Sender display
    if ($('#sender_display_name').length) {
        $('#sender_display_name').text(GK.state.sender.name || '');
        $('#sender_display_street').text(GK.state.sender.street || '');
        $('#sender_display_houseNumber').text(GK.state.sender.houseNumber || '');
        $('#sender_display_postalCode').text(GK.state.sender.postalCode || '');
        $('#sender_display_city').text(GK.state.sender.city || '');
        $('#sender_display_countryIso').text((window.InitialValues && window.InitialValues.sender && window.InitialValues.sender.countryCode) || '');
        $('#sender_display_contact').text(GK.state.sender.contactPerson || '');
        $('#sender_display_phone').text(GK.state.sender.phone || '');
        $('#sender_display_email').text(GK.state.sender.email || '');
    }
    // Receiver display
    if ($('#receiver_display_name').length) {
        $('#receiver_display_name').text(GK.state.receiver.name || '');
        $('#receiver_display_street').text(GK.state.receiver.street || '');
        $('#receiver_display_houseNumber').text(GK.state.receiver.houseNumber || '');
        $('#receiver_display_postalCode').text(GK.state.receiver.postalCode || '');
        $('#receiver_display_city').text(GK.state.receiver.city || '');
        $('#receiver_display_countryIso').text((window.InitialValues && window.InitialValues.receiver && window.InitialValues.receiver.countryCode) || '');
        $('#receiver_display_contact').text(GK.state.receiver.contactPerson || '');
        $('#receiver_display_phone').text(GK.state.receiver.phone || '');
        $('#receiver_display_email').text(GK.state.receiver.email || '');
    }
}

function populateReceiverPoints() {
    // Display receiver points in UI if they exist in state
    if (GK.state.additionalInfo) {
        if (GK.state.additionalInfo.inPostReceiverPoint && GK.state.additionalInfo.inPostReceiverPoint.id) {
            $('#inpostReceiverLabel').text('[' + GK.state.additionalInfo.inPostReceiverPoint.id + ']');
        }
        if (GK.state.additionalInfo.paczkaRuchReceiverPoint && GK.state.additionalInfo.paczkaRuchReceiverPoint.id) {
            $('#orlenReceiverLabel').text('[' + GK.state.additionalInfo.paczkaRuchReceiverPoint.id + ']');
        }
        if (GK.state.additionalInfo.pocztex48owpReceiverPoint && GK.state.additionalInfo.pocztex48owpReceiverPoint.id) {
            $('#pocztexReceiverLabel').text('[' + GK.state.additionalInfo.pocztex48owpReceiverPoint.id + ']');
        }
        if (GK.state.additionalInfo.dhlparcelReceiverPoint && GK.state.additionalInfo.dhlparcelReceiverPoint.id) {
            $('#dhlReceiverLabel').text('[' + GK.state.additionalInfo.dhlparcelReceiverPoint.id + ']');
        }
        if (GK.state.additionalInfo.dhlparcelSenderPoint && GK.state.additionalInfo.dhlparcelSenderPoint.id) {
            $('#dhlSenderLabel').text('[' + GK.state.additionalInfo.dhlparcelSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.dpdpickupReceiverPoint && GK.state.additionalInfo.dpdpickupReceiverPoint.id) {
            $('#dpdReceiverLabel').text('[' + GK.state.additionalInfo.dpdpickupReceiverPoint.id + ']');
        }

        // Also display sender points
        if (GK.state.additionalInfo.inPostSenderPoint && GK.state.additionalInfo.inPostSenderPoint.id) {
            $('#inpostSenderLabel').text('[' + GK.state.additionalInfo.inPostSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.dhlparcelSenderPoint && GK.state.additionalInfo.dhlparcelSenderPoint.id) {
            $('#dhlSenderLabel').text('[' + GK.state.additionalInfo.dhlparcelSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.paczkaRuchSenderPoint && GK.state.additionalInfo.paczkaRuchSenderPoint.id) {
            $('#orlenSenderLabel').text('[' + GK.state.additionalInfo.paczkaRuchSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.pocztex48owpSenderPoint && GK.state.additionalInfo.pocztex48owpSenderPoint.id) {
            $('#pocztexSenderLabel').text('[' + GK.state.additionalInfo.pocztex48owpSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.dpdpickupSenderPoint && GK.state.additionalInfo.dpdpickupSenderPoint.id) {
            $('#dpdSenderLabel').text('[' + GK.state.additionalInfo.dpdpickupSenderPoint.id + ']');
        }
        if (GK.state.additionalInfo.fedexReceiverPoint && GK.state.additionalInfo.fedexReceiverPoint.id) {
            $('#fedexReceiverLabel').text('[' + GK.state.additionalInfo.fedexReceiverPoint.id + ']');
        }
        if (GK.state.additionalInfo.fedexSenderPoint && GK.state.additionalInfo.fedexSenderPoint.id) {
            $('#fedexSenderLabel').text('[' + GK.state.additionalInfo.fedexSenderPoint.id + ']');
        }
    }
}

function bindEditModals() {
    // Open Sender edit
    $(document).off('click', '#senderChangeLink').on('click', '#senderChangeLink', function(e){
        e.preventDefault();
        if (!$('#senderEditModal').length) return;
        $('#sender_edit_name').val(GK.state.sender.name || '');
        $('#sender_edit_street').val(GK.state.sender.street || '');
        $('#sender_edit_houseNumber').val(GK.state.sender.houseNumber || '');
        $('#sender_edit_apartmentNumber').val(GK.state.sender.apartmentNumber || '');
        $('#sender_edit_postalCode').val(GK.state.sender.postalCode || '');
        $('#sender_edit_city').val(GK.state.sender.city || '');
        $('#sender_edit_contact').val(GK.state.sender.contactPerson || '');
        $('#sender_edit_phone').val(GK.state.sender.phone || '');
        $('#sender_edit_email').val(GK.state.sender.email || '');
        $('#senderEditModal').modal('show');
    });
    // Save Sender edit
    $(document).off('click', '#saveSenderEdit').on('click', '#saveSenderEdit', function(){
        GK.state.sender.name = $('#sender_edit_name').val();
        GK.state.sender.street = $('#sender_edit_street').val();
        GK.state.sender.houseNumber = $('#sender_edit_houseNumber').val();
        GK.state.sender.apartmentNumber = $('#sender_edit_apartmentNumber').val();
        GK.state.sender.postalCode = $('#sender_edit_postalCode').val();
        GK.state.sender.city = $('#sender_edit_city').val();
        GK.state.sender.contactPerson = $('#sender_edit_contact').val();
        GK.state.sender.phone = $('#sender_edit_phone').val();
        GK.state.sender.email = $('#sender_edit_email').val();
        populateDisplayPanels();
        if (GK.state.sender.phone && GK.state.receiver.phone) { $('#validationErrorBox').hide(); }
    });

    // Open Receiver edit
    $(document).off('click', '#receiverChangeLink').on('click', '#receiverChangeLink', function(e){
        e.preventDefault();
        if (!$('#receiverEditModal').length) return;
        $('#receiver_edit_name').val(GK.state.receiver.name || '');
        $('#receiver_edit_street').val(GK.state.receiver.street || '');
        $('#receiver_edit_houseNumber').val(GK.state.receiver.houseNumber || '');
        $('#receiver_edit_apartmentNumber').val(GK.state.receiver.apartmentNumber || '');
        $('#receiver_edit_postalCode').val(GK.state.receiver.postalCode || '');
        $('#receiver_edit_city').val(GK.state.receiver.city || '');
        $('#receiver_edit_contact').val(GK.state.receiver.contactPerson || '');
        $('#receiver_edit_phone').val(GK.state.receiver.phone || '');
        $('#receiver_edit_email').val(GK.state.receiver.email || '');
        $('#receiverEditModal').modal('show');
    });
    // Save Receiver edit
    $(document).off('click', '#saveReceiverEdit').on('click', '#saveReceiverEdit', function(){
        GK.state.receiver.name = $('#receiver_edit_name').val();
        GK.state.receiver.street = $('#receiver_edit_street').val();
        GK.state.receiver.houseNumber = $('#receiver_edit_houseNumber').val();
        GK.state.receiver.apartmentNumber = $('#receiver_edit_apartmentNumber').val();
        GK.state.receiver.postalCode = $('#receiver_edit_postalCode').val();
        GK.state.receiver.city = $('#receiver_edit_city').val();
        GK.state.receiver.contactPerson = $('#receiver_edit_contact').val();
        GK.state.receiver.phone = $('#receiver_edit_phone').val();
        GK.state.receiver.email = $('#receiver_edit_email').val();
        populateDisplayPanels();
        if (GK.state.sender.phone && GK.state.receiver.phone) { $('#validationErrorBox').hide(); }
    });
}
	// ============ Services and Options (MVP) ============

function templateServicesPanel() { return ''; }

	function setPackageInfoFromInputs() {
		GK.state.packageInfo = {
			content: $('#pkg-content').val() || '',
			length: parseFloat($('#pkg-length').val()) || null,
			width: parseFloat($('#pkg-width').val()) || null,
			height: parseFloat($('#pkg-height').val()) || null,
			weight: parseFloat($('#pkg-weight').val()) || null,
			count: parseInt($('#pkg-count').val(), 10) || 1
		};
	}

function populatePackageInputs() {
    const pi = GK.state.packageInfo || (window.InitialValues && window.InitialValues.defaultPackageInfo) || {};
    if ($('#pkg-content').length) {
        if (pi.content != null) $('#pkg-content').val(pi.content);
        if (pi.length != null) $('#pkg-length').val(pi.length);
        if (pi.width != null) $('#pkg-width').val(pi.width);
        if (pi.height != null) $('#pkg-height').val(pi.height);
        if (pi.weight != null) $('#pkg-weight').val(pi.weight);
        if (pi.count != null) $('#pkg-count').val(pi.count);
    }
}

function buildProductsParams() {
    const s = GK.state;
    try { ensureCountryIdsFromIso(); } catch(e) {}
    const p = s.packageInfo || {};
    const params = {
			length: p.length,
			width: p.width,
			height: p.height,
			weight: p.weight,
			quantity: p.count || 1
		};
		if (s.sender && s.sender.postalCode) params.senderPostCode = s.sender.postalCode;
		if (s.receiver && s.receiver.postalCode) params.receiverPostCode = s.receiver.postalCode;
		if (s.sender && s.sender.country && s.sender.country.id) params.senderCountryId = s.sender.country.id;
		if (s.receiver && s.receiver.country && s.receiver.country.id) params.receiverCountryId = s.receiver.country.id;
		return params;
	}

function buildHeaders() {
    const headers = {};
	if (window.InitialValues && window.InitialValues.token) headers['x-auth-token'] = window.InitialValues.token;
	headers['accept-language'] = (window.InitialValues && window.InitialValues.isoCode === 'pl') ? 'pl' : 'en';
		return headers;
	}

function cardForProduct(product) {
    const logo = product.carrierLogoLink ? '<img src="' + product.carrierLogoLink + '" alt="' + (product.carrierName || '') + '" />' : '';
    const price = (product.netPrice != null) ? (product.netPrice + " " + product.currency) : '';
		return (
			'<div class="col-lg-4 col-md-6 col-sm-6 glob-product-block text-center">' +
				'<div class="glob-product-wrapper">' +
				'<div class="glob-product-logo">' + logo + '</div>' +
				'<strong>' + (product.carrierName || '') + '</strong><br/>' +
				'<span>' + (product.name || '') + '</span><br/><br/>' +
				'<strong>' + price + '</strong><br/><br/>' +
				'<button class="btn btn-sm btn-success btn-gk-success pick-product" data-id="' + product.id + '">Wybierz</button>' +
				'</div>' +
			'</div>'
		);
	}

function fetchProducts() {
		setPackageInfoFromInputs();
		const params = buildProductsParams();
		// Filter by terminal type if showAllCarriers is false
    // determine current filter state
    const showAllFromDom = $('#service_filters_on').is(':checked');
    GK.state.showAllCarriers = !!showAllFromDom;
    const terminalType = GK.state.terminalType || (window.InitialValues && window.InitialValues.terminalType) || null;
		const url = 'https://api.globkurier.pl/v1/products?' + new URLSearchParams(params).toString();
		$('#servicesModalList').html('<div class="col-lg-12 text-center"><i class="icon-cog icon-spin"></i></div>');
		$('#servicesContainer').addClass('loading');
		const $btn = $('#getServicesBtn');
		$btn.prop('disabled', true);
		$btn.find('i.icon-cog').show();
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				let list = [];
				if (data) {
					['standard','fast','superfast','noon','morning'].forEach(function(bucket){
						if (Array.isArray(data[bucket])) list = list.concat(data[bucket]);
					});
				}
                GK.state.products = list;

                if (!GK.state.showAllCarriers && terminalType) {
					let map = {
						inpost: function(p){ return (p.carrierName || '').toLowerCase().indexOf('inpost') > -1; },
						ruch: function(p){ return (p.carrierName || '').toLowerCase().indexOf('orlen') > -1 || (p.carrierName || '').toLowerCase().indexOf('ruch') > -1; },
						pocztex48owp: function(p){ return (p.carrierName || '').toLowerCase().indexOf('poczta') > -1; },
						dhlparcel: function(p){ return (p.carrierName || '').toLowerCase().indexOf('dhl') > -1; },
						dpdpickup: function(p){ return (p.carrierName || '').toLowerCase().indexOf('dpd') > -1; },
						fedex: function(p){ return (p.carrierName || '').toLowerCase().indexOf('fedex') > -1; }
					};
					let fn = map[(terminalType + '').toLowerCase()];
					if (fn) list = list.filter(fn);
				}
               const html = list.map(cardForProduct).join('');
               if (GK.state.forModal) {
                   $('#servicesModalList').html(html);
                   if (!html) {
                       $('#servicesModalEmpty').show();
                   } else {
                       $('#servicesModalEmpty').hide();
                   }
               }
                // no-op
			})
			.finally(function(){
				$('#servicesContainer').removeClass('loading');
				const $btn = $('#getServicesBtn');
				$btn.prop('disabled', false);
				$btn.find('i.icon-cog').hide();
			});
	}

function renderServiceOptionsContainer() {
    // Use existing markup in TPL; just initialize widgets and bind events
    $('#serviceOptionsContainer').show();

    // Initialize datepicker with available dates restriction
    initializeDatepickerWithAvailability();

    if (window.InitialValues && window.InitialValues.todayDate) {
        $('#sendDateInput').val(window.InitialValues.todayDate);
    }
    $('#sendDateInput').off('change').on('change', function(){
      if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
      GK.state.additionalInfo.sendDate = $(this).val();
      fetchTimeRanges();
    });
    // bind new inputs to state
    $(document)
      .off('input change', '#codAmountInput')
      .on('input change', '#codAmountInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codAmount = $(this).val(); recalcOrderPrice(); });
    $(document)
      .off('input change', '#codAccountInput')
      .on('input change', '#codAccountInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codAccount = $(this).val(); });
    $(document)
      .off('input change', '#codAccountHolderInput')
      .on('input change', '#codAccountHolderInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codAccountHolder = $(this).val(); });
    $(document)
      .off('input change', '#codAccountAddr1Input')
      .on('input change', '#codAccountAddr1Input', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codAccountAddr1 = $(this).val(); });
    $(document)
      .off('input change', '#codAccountAddr2Input')
      .on('input change', '#codAccountAddr2Input', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.codAccountAddr2 = $(this).val(); });
    $(document)
      .off('input change', '#insuranceAmountInput')
      .on('input change', '#insuranceAmountInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.insuranceAmount = $(this).val(); recalcOrderPrice(); });
    $(document)
      .off('change', '#purposeSelect')
      .on('change', '#purposeSelect', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.purpose = $(this).val(); });
    $(document)
      .off('input change', '#declaredValueInput')
      .on('input change', '#declaredValueInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.declaredValue = $(this).val(); });
    $(document)
      .off('input change', '#commentsInput')
      .on('input change', '#commentsInput', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.notes = $(this).val(); });
    $(document)
      .off('change', '#statesSelect')
      .on('change', '#statesSelect', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.stateType = $(this).val(); });
    $(document)
      .off('change', '#senderStatesSelect')
      .on('change', '#senderStatesSelect', function(){ if (!GK.state.additionalInfo) GK.state.additionalInfo = {}; GK.state.additionalInfo.senderStateType = $(this).val(); });
    $(document)
      .off('change', '#pickupTimeSelect')
      .on('change', '#pickupTimeSelect', function(){
        if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
        const selectedValue = $(this).val();
        if (selectedValue) {
          try {
            GK.state.additionalInfo.timeRange = JSON.parse(decodeURIComponent(selectedValue));
          } catch(e) {
            GK.state.additionalInfo.timeRange = null;
          }
        } else {
          GK.state.additionalInfo.timeRange = null;
        }
      });
    $('input[name=pickup_type]').off('change').on('change', function(){
        fetchTimeRanges();
        refreshAddons();
        refreshPayments();
        recalcOrderPrice();
        updateCarrierDependentUI();
        updateEnabledOptionsUI();
        fetchCustomRequiredFields();
    });
}

	function fetchAddonsAndPayments() {
		const s = GK.state;
		if (!s.pickedService) return;
		renderServiceOptionsContainer();
		// Addons
		$('#addonsList').empty();
		$('#addonsListContainer').hide();
		const params = buildProductsParams();
		params.productId = s.pickedService.id;
		const addonsUrl = 'https://api.globkurier.pl/v1/product/addons?' + new URLSearchParams(params).toString();
		fetch(addonsUrl, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				const list = (data && Array.isArray(data.addons)) ? data.addons : (Array.isArray(data) ? data : []);
				const html = list.map(function(opt){
					const p = (opt.priceGross != null ? opt.priceGross : opt.price);
					const curr = (opt.currency || '').trim();
					const priceTxt = (p != null) ? (' <span class="text-muted">(+' + p + (curr ? (' ' + curr) : '') + ')</span>') : '';
					const label = opt.addonName || opt.name || opt.symbol || ('#' + opt.id);
					return '<div class="col-lg-12"><label><input type="checkbox" class="addon-checkbox" data-id="' + opt.id + '" data-category="' + (opt.category || '') + '" data-price="' + (p != null ? p : '') + '"> ' + label + priceTxt + '</label></div>';
				}).join('');
				$('#addonsList').html(html);
				if (html) { $('#addonsListContainer').show(); } else { $('#addonsListContainer').hide(); }
				refreshPayments();
			});
		// Payments (requires grossOrderPrice in some cases)
		refreshPayments();
		// Prefill UI for picked service summary
		$('#pickedServiceName').text((s.pickedService.carrierName || '') + (s.pickedService.name ? (' – ' + s.pickedService.name) : ''));
		$('#pickedServicePanel').show();
        $('#summaryServiceName').text((s.pickedService.carrierName || '') + (s.pickedService.name ? (' – ' + s.pickedService.name) : ''));
        $('#changeServiceBtn').off('click').on('click', function(){ GK.state.forceShowAll = true; GK.state.forModal = true; fetchProducts().then(function(){ $('#servicesPickModal').modal('show'); }); });
        // Always show terminal info block; fill defaults if available
        $('#terminalInfo').show();
        if (window.InitialValues && window.InitialValues.terminalCode) {
            $('#terminalCode').text(window.InitialValues.terminalCode);
            // Also set the terminal in state for proper data handling
            if (!GK.state.receiver) GK.state.receiver = {};
            GK.state.receiver.terminal = window.InitialValues.terminalCode;
        }
        $('.terminalLabel').hide();
        if (window.InitialValues && window.InitialValues.terminalType) {
            $('.terminalLabel[data-type="' + (window.InitialValues.terminalType || '') + '"]').show();
        }
		// Initial dependent UI and requirements
		updateCarrierDependentUI();
		enforceCollectionTypeRadios();
		setTimeout(function(){
			fetchTimeRanges();
			fetchCustomRequiredFields();
			// Refresh available dates when service changes
			fetchAvailablePickupDates().then(function(availableDates) {
				GK.state.availablePickupDates = availableDates;
				$('#sendDateInput').datepicker('refresh');
			});
		}, 0);
	}

function updateCarrierDependentUI() {
    const s = GK.state;
    if (!s.pickedService) return;
    const name = (s.pickedService.carrierName || '').toLowerCase();
    const sendingType = $('input[name=pickup_type]:checked').val();

    // hide all
    $('.receiverAddressPointId').hide();
    $('.senderAddressPointId').hide();
    // Toggle pickup meta only for courier pickup
    if (sendingType === 'PICKUP') { $('#pickupMeta').show(); } else { $('#pickupMeta').hide(); }
    // Receiver point selection ONLY when deliveryTypes contains POINT (dostawa do paczkomatu)
    // This is independent of how we send it (courier pickup vs point drop-off)
    const hasPointDelivery = s.pickedService.deliveryTypes && s.pickedService.deliveryTypes.includes('POINT');
    const showReceiver = hasPointDelivery;
    if (showReceiver && name.indexOf('inpost') > -1) {
        $('.receiverAddressPointIdinpost').show();
    } else if (showReceiver && (name.indexOf('orlen') > -1 || name.indexOf('ruch') > -1)) {
        $('.receiverAddressPointIdorlen').show();
    } else if (showReceiver && name.indexOf('poczta') > -1) {
        $('.receiverAddressPointIdpocztex48').show();
    } else if (showReceiver && name.indexOf('dhl') > -1) {
        $('.receiverAddressPointIddhl').show();
    } else if (showReceiver && name.indexOf('dpd') > -1) {
        $('.receiverAddressPointIddpd').show();
    } else if (showReceiver && name.indexOf('fedex') > -1) {
        $('.receiverAddressPointIdfedex').show();
    }

    // Sender point selection logic - only show when POINT collection type
    if (sendingType === 'POINT') {
        if (name.indexOf('inpost') > -1) {
            $('.senderAddressPointIdinpost').show();
        } else if (name.indexOf('dhl') > -1) {
            $('.senderAddressPointIddhl').show();
        } else if (name.indexOf('orlen') > -1 || name.indexOf('ruch') > -1) {
            $('.senderAddressPointIdorlen').show();
        } else if (name.indexOf('poczta') > -1) {
            $('.senderAddressPointIdpocztex48').show();
        } else if (name.indexOf('dpd') > -1) {
            $('.senderAddressPointIddpd').show();
        } else if (name.indexOf('fedex') > -1) {
            $('.senderAddressPointIdfedex').show();
        }
    }

    // Don't modify terminalCode - it shows client's original choice

    updateEnabledOptionsUI();
}

function enforceCollectionTypeRadios() {
    const ps = GK.state.pickedService || {};
    const allowed = Array.isArray(ps.collectionTypes) ? ps.collectionTypes : [];
    const allowPickup = allowed.indexOf('PICKUP') > -1;
    const allowPoint = allowed.indexOf('POINT') > -1;

    // Enable/disable and show/hide radios
    const $pickupLabel = $('#pickup').closest('.radio');
    const $pointLabel = $('#point').closest('.radio');

    $('#pickup').prop('disabled', !allowPickup);
    $pickupLabel[allowPickup ? 'removeClass' : 'addClass']('disabled');
    $pickupLabel.css('opacity', allowPickup ? '1' : '0.5');

    $('#point').prop('disabled', !allowPoint);
    $pointLabel[allowPoint ? 'removeClass' : 'addClass']('disabled');
    $pointLabel.css('opacity', allowPoint ? '1' : '0.5');

    // Determine which option should be selected
    const current = $('input[name=pickup_type]:checked').val();
    let selected = null;

    if (allowed.length === 0) {
        // No collection types specified - default to PICKUP
        selected = 'PICKUP';
    } else if (allowed.length === 1) {
        // Only one option available, auto-select it
        selected = allowed[0];
    } else {
        // Multiple options available
        // Keep current selection if it's valid, otherwise pick first available
        if (current === 'PICKUP' && allowPickup) {
            selected = 'PICKUP';
        } else if (current === 'POINT' && allowPoint) {
            selected = 'POINT';
        } else {
            // Current selection is not valid, pick first available
            selected = allowPickup ? 'PICKUP' : (allowPoint ? 'POINT' : null);
        }
    }

    // Apply selection if valid and different from current
    if (selected && selected !== current) {
        $('input[name=pickup_type][value="' + selected + '"]').prop('checked', true).trigger('change');
    }
}

function updateChosenServiceUI() {
    const ps = GK.state.pickedService;
    if (!ps) return;
    if (ps.carrierLogoLink) {
        $('#chosenServiceLogo').attr('src', ps.carrierLogoLink).show();
    }
    $('#chosenServiceCarrier').text(ps.carrierName || '');
    $('#chosenServiceName').text(ps.name || '');
    // render labels (if any)
    try {
        const labels = Array.isArray(ps.labels) ? ps.labels : [];
        const html = labels.length ? ('<ul style="margin:0 0 10px 18px;">' + labels.map(function(l){ return '<li>' + l + '</li>'; }).join('') + '</ul>') : '';
        $('#summaryServiceLabels').html(html);
        if (html) { $('#summaryServiceLabels').show(); } else { $('#summaryServiceLabels').hide(); }
    } catch(e) { $('#summaryServiceLabels').hide(); }
}

	function refreshAddons() {
		const s = GK.state;
		if (!s.pickedService) return Promise.resolve();
		const params = buildProductsParams();
		params.productId = s.pickedService.id;
		const addonsUrl = 'https://api.globkurier.pl/v1/product/addons?' + new URLSearchParams(params).toString();
		$('#addonsList').empty();
		$('#addonsListContainer').hide();
		return fetch(addonsUrl, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				const list = (data && Array.isArray(data.addons)) ? data.addons : (Array.isArray(data) ? data : []);
				const html = list.map(function(opt){
					const price = (opt.price != null) ? (' <span class="text-muted">(+' + opt.price + ')</span>') : '';
					const label = opt.addonName || opt.name || opt.symbol || ('#' + opt.id);
					return '<div class="col-lg-12"><label><input type="checkbox" class="addon-checkbox" data-id="' + opt.id + '" data-category="' + (opt.category || '') + '" data-price="' + (opt.price != null ? opt.price : '') + '"> ' + label + price + '</label></div>';
				}).join('');
				$('#addonsList').html(html);
				if (html) { $('#addonsListContainer').show(); } else { $('#addonsListContainer').hide(); }
			});
	}

	function computeGrossPrice() {
		const s = GK.state;
		let base = 0;
		if (s.pickedService) {
			base = parseFloat(
				s.pickedService.grossPrice != null ? s.pickedService.grossPrice :
				s.pickedService.totalGrossPrice != null ? s.pickedService.totalGrossPrice :
				s.pickedService.price_gross != null ? s.pickedService.price_gross :
				s.pickedService.netPrice != null ? s.pickedService.netPrice : 0
			);
			if (isNaN(base)) base = 0;
		}
		let addons = 0;
		if (Array.isArray(s.serviceOptions)) {
			addons = s.serviceOptions.reduce(function(sum, o){
				const p = o && o.price != null ? parseFloat(o.price) : 0;
				return sum + (isNaN(p) ? 0 : p);
			}, 0);
		}
		const total = base + addons;
		return isNaN(total) ? undefined : total;
	}

	function refreshPayments() {
		const s = GK.state;
        try { ensureCountryIdsFromIso(); } catch(e) {}
		if (!s.pickedService) return Promise.resolve();
		const payParams = { productId: s.pickedService.id, isFreightForwardAddonSelected: false };
		const gross = computeGrossPrice();
		if (gross != null) payParams.grossOrderPrice = gross.toFixed(2);
		const paymentsUrl = 'https://api.globkurier.pl/v1/order/payments?' + new URLSearchParams(payParams).toString();
		const prev = s.additionalInfo && s.additionalInfo.paymentType ? (s.additionalInfo.paymentType + '') : '';
		return fetch(paymentsUrl, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				const list = Array.isArray(data) ? data : (data && Array.isArray(data.payments) ? data.payments : []);
				GK.state.availablePayments = list.filter(function(p){ return p.enabled !== false; });
				const html = '<option value="">-- wybierz --</option>' + GK.state.availablePayments.map(function(p){
					return '<option value="' + p.id + '">' + (p.name || ('ID ' + p.id)) + '</option>';
				}).join('');
				$('#paymentSelect').html(html);
				if (prev && GK.state.availablePayments.some(function(p){ return (p.id + '') === prev; })) {
					$('#paymentSelect').val(prev);
					if (!s.additionalInfo) s.additionalInfo = {};
					s.additionalInfo.paymentType = prev;
				}
				$('#paymentSelect').off('change').on('change', function(){
					GK.state.additionalInfo.paymentType = $(this).val();
					recalcOrderPrice();
			updateEnabledOptionsUI();
				});
				recalcOrderPrice();
			});
	}

	// Initialize datepicker with available dates restriction
	function initializeDatepickerWithAvailability() {
		const today = new Date();
		const maxDate = new Date();
		maxDate.setDate(today.getDate() + 30); // maksymalnie 30 dni do przodu

		// Store available dates in state for datepicker
		GK.state.availablePickupDates = [];

		// Initialize basic datepicker first
		try {
			$('#sendDateInput').datepicker({
				dateFormat: 'yy-mm-dd',
				minDate: today,
				maxDate: maxDate,
				beforeShowDay: function(date) {
					const dateStr = $.datepicker.formatDate('yy-mm-dd', date);
					const isAvailable = GK.state.availablePickupDates.includes(dateStr);
					return [isAvailable, isAvailable ? '' : 'unavailable'];
				}
			});
		} catch(e) {
			// Datepicker initialization failed
		}

		// Fetch available dates and update datepicker
		fetchAvailablePickupDates().then(function(availableDates) {
			GK.state.availablePickupDates = availableDates;
			// Refresh datepicker to apply new restrictions
			$('#sendDateInput').datepicker('refresh');
		});
	}

	// Fetch available pickup dates and initialize datepicker with restrictions
	function fetchAvailablePickupDates() {
		const s = GK.state;
		try { ensureCountryIdsFromIso(); } catch(e) {}
		if (!s.pickedService) return Promise.resolve([]);

		const params = {
			productId: s.pickedService.id,
			date: new Date().toISOString().split('T')[0] // today's date
		};
		const p = s.packageInfo || {};
		if (p.weight != null) params.weight = p.weight;
		params.quantity = p.count || 1;
		if (s.sender && s.sender.country && s.sender.country.id) params.senderCountryId = s.sender.country.id;
		if (s.receiver && s.receiver.country && s.receiver.country.id) params.receiverCountryId = s.receiver.country.id;
		if (s.sender && s.sender.postalCode) params.senderPostCode = s.sender.postalCode;
		if (s.receiver && s.receiver.postalCode) params.receiverPostCode = s.receiver.postalCode;

		const url = 'https://api.globkurier.pl/v1/order/pickupTimeRanges?' + new URLSearchParams(params).toString();
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				const list = Array.isArray(data) ? data : (data && Array.isArray(data.timeRanges) ? data.timeRanges : []);
				// Extract unique dates from the response
				const availableDates = [...new Set(list.map(item => item.date))];
				return availableDates;
			})
			.catch(function(e){
				return [];
			});
	}

	function fetchTimeRanges() {
		const s = GK.state;
    try { ensureCountryIdsFromIso(); } catch(e) {}
		if (!s.pickedService) return;
		const date = $('#sendDateInput').val();
		if (!date) return; // wait until date is chosen
	// Only required parameters for this endpoint
	const params = {
		productId: s.pickedService.id,
		date: date
	};
	const p = s.packageInfo || {};
	if (p.weight != null) params.weight = p.weight;
	params.quantity = p.count || 1;
	if (s.sender && s.sender.country && s.sender.country.id) params.senderCountryId = s.sender.country.id;
	if (s.receiver && s.receiver.country && s.receiver.country.id) params.receiverCountryId = s.receiver.country.id;
	if (s.sender && s.sender.postalCode) params.senderPostCode = s.sender.postalCode;
	if (s.receiver && s.receiver.postalCode) params.receiverPostCode = s.receiver.postalCode;
		const url = 'https://api.globkurier.pl/v1/order/pickupTimeRanges?' + new URLSearchParams(params).toString();
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(data){
				const list = Array.isArray(data) ? data : (data && Array.isArray(data.timeRanges) ? data.timeRanges : []);

				// Group time ranges by date and merge overlapping ranges
				const timeRangesByDate = {};
				list.forEach(function(item) {
					if (!timeRangesByDate[item.date]) {
						timeRangesByDate[item.date] = [];
					}
					timeRangesByDate[item.date].push({
						timeFrom: item.timeFrom,
						timeTo: item.timeTo
					});
				});

				// For the selected date, show all available time ranges
				const selectedDateRanges = timeRangesByDate[date] || [];
				const html = '<option value="">-- wybierz --</option>' + selectedDateRanges.map(function(t){
					const label = (t.timeFrom && t.timeTo) ? (t.timeFrom + ' - ' + t.timeTo) : '';
					const value = JSON.stringify({ timeFrom: t.timeFrom, timeTo: t.timeTo });
					return '<option value="' + encodeURIComponent(value) + '">' + label + '</option>';
				}).join('');
				$('#pickupTimeSelect').html(html);
			});
	}

function fetchStates(countryId, opts) {
    opts = opts || {}; // { targetGroup: '#statesGroup', targetSelect: '#statesSelect' }
    const targetGroup = opts.targetGroup || '#statesGroup';
    const targetSelect = opts.targetSelect || '#statesSelect';
    if (!countryId) { $(targetGroup).hide(); return Promise.resolve([]); }
    const url = 'https://api.globkurier.pl/v1/states?countryId=' + encodeURIComponent(countryId);
    return fetch(url, { headers: buildHeaders() })
        .then(function(r){ return r.json(); })
        .then(function(list){
            if (!Array.isArray(list) || !list.length) {
                $(targetGroup).hide();
                return [];
            }
            const html = '<option value="">-- wybierz --</option>' + list.map(function(s){ return '<option value="' + s.id + '">' + (s.name || ('ID ' + s.id)) + '</option>'; }).join('');
            $(targetSelect).html(html);
            $(targetGroup).show();
            return list;
        });
}

	function fetchCustomRequiredFields() {
		const s = GK.state;
    try { ensureCountryIdsFromIso(); } catch(e) {}
		if (!s.pickedService) return;
		const collectionType = $('input[name=pickup_type]:checked').val() || 'PICKUP';
		const receiverCountryId = s.receiver && s.receiver.country && s.receiver.country.id;
		const senderCountryId = s.sender && s.sender.country && s.sender.country.id;
		if (!receiverCountryId || !senderCountryId) return;
		const url = 'https://api.globkurier.pl/v1/order/customRequiredFields?' + new URLSearchParams({
			productId: s.pickedService.id,
			senderCountryId: senderCountryId,
			receiverCountryId: receiverCountryId,
			collectionType: collectionType
		}).toString();
		// UI loading state could be added if needed
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(json){
				GK.state.customRequired = json || {};
				// declared value and purpose
				if (json.declaredValue) {
					$('#declaredValueGroup').show();
					// Initialize declaredValue with default value if not set
					if (!GK.state.additionalInfo || !GK.state.additionalInfo.declaredValue) {
						GK.state.additionalInfo = GK.state.additionalInfo || {};
						GK.state.additionalInfo.declaredValue = '0'; // Default value
						$('#declaredValueInput').val('0');
					}
				} else {
					$('#declaredValueGroup').hide();
				}
				if (json.purpose) {
					$('#purposeGroup').show();
					// Initialize purpose with default value if not set
					if (!GK.state.additionalInfo || !GK.state.additionalInfo.purpose) {
						GK.state.additionalInfo = GK.state.additionalInfo || {};
						GK.state.additionalInfo.purpose = 'SOLD'; // Default value
					}
				} else {
					$('#purposeGroup').hide();
				}
				// pickup date/time
				const showPickupMeta = !!(json.pickupDate || json.pickupTimeFrom || json.pickupTimeTo);
				$('#pickupMeta').toggle(showPickupMeta);
				// receiver/sender point blocks
				if (json.receiverAddressPointId === true) {
					// ensure only the matching receiver block is visible; updateCarrierDependentUI already bases on carrier
					// we just make sure at least one group is visible if POINT
					if ($('input[name=pickup_type]:checked').val() === 'POINT') {
						// show/hide handled in updateCarrierDependentUI
					}
				} else {
					$('.receiverAddressPointId').hide();
				}
				if (json.senderAddressPointId === true) {
					// we currently only have InPost sender block; let carrier UI handle it when applicable
				} else {
					$('.senderAddressPointId').hide();
				}
				// states
                if (json.receiverStateId === true) {
                    fetchStates(receiverCountryId, { targetGroup: '#statesGroup', targetSelect: '#statesSelect' });
                } else {
                    $('#statesGroup').hide();
                }
                if (json.senderStateId === true) {
                    fetchStates(senderCountryId, { targetGroup: '#senderStatesGroup', targetSelect: '#senderStatesSelect' });
                } else {
                    $('#senderStatesGroup').hide();
                }

                // Handle required addons
                if (json.requiredAddons && Array.isArray(json.requiredAddons)) {
                    GK.state.customRequired.requiredAddons = json.requiredAddons;
                    // Auto-select required addons
                    json.requiredAddons.forEach(function(requiredId) {
                        const addonCheckbox = $('.addon-checkbox[data-id="' + requiredId + '"]');
                        if (addonCheckbox.length && !addonCheckbox.is(':checked')) {
                            addonCheckbox.prop('checked', true).trigger('change');
                        }
                    });
                } else {
                    // Clear required addons if not present
                    GK.state.customRequired.requiredAddons = null;
                }

				// Handle orderCustoms fields (customs section requirements)
				if (json.orderCustoms && typeof json.orderCustoms === 'object') {
					// Filter out 'fields' key as it's not needed in the request
					const filteredCustoms = {};
					Object.keys(json.orderCustoms).forEach(function(key) {
						if (key !== 'fields') {
							filteredCustoms[key] = json.orderCustoms[key];
						}
					});
					GK.state.customRequired.orderCustoms = filteredCustoms;
				} else {
					GK.state.customRequired.orderCustoms = null;
				}

				updateCarrierDependentUI();
			});
	}

function renderSummaryContainer() {
    $('#summaryContainer').show();
    const $box = $('#discountAndSummary');
    $(document).off('click', '#applyDiscountBtn').on('click', '#applyDiscountBtn', function(){
        GK.state.discountCode = ($('#discountCodeInput').val() || '').trim();
        recalcOrderPrice();
    });
    $(document).off('click', '#clearDiscountBtn').on('click', '#clearDiscountBtn', function(){
        GK.state.discountCode = '';
        $('#discountCodeInput').val('');
        recalcOrderPrice();
    });
}

	function updateSendButtonDisabled() {
		const disabled = (!GK.state.pickedService) || (!GK.state.additionalInfo || !GK.state.additionalInfo.paymentType) || !!GK.state.priceError;
		$('#sendOrderBtn').prop('disabled', disabled);
	}

	function recalcOrderPrice() {
		updateSendButtonDisabled();
		const s = GK.state;
		try { ensureCountryIdsFromIso(); } catch(e) {}
		if (!s.pickedService || !s.additionalInfo || !s.additionalInfo.paymentType) return;
		const p = s.packageInfo || {};
		const usp = new URLSearchParams();
		usp.append('productId', s.pickedService.id);
		usp.append('length', p.length || 0);
		usp.append('width', p.width || 0);
		usp.append('height', p.height || 0);
		usp.append('weight', p.weight || 0);
		usp.append('quantity', p.count || 1);
		usp.append('senderCountryId', (s.sender && s.sender.country && s.sender.country.id) || (window.InitialValues && window.InitialValues.senderCountryIdNew) || 1);
		usp.append('receiverCountryId', (s.receiver && s.receiver.country && s.receiver.country.id) || (window.InitialValues && window.InitialValues.receiverCountryIdNew) || 1);
		usp.append('senderPostCode', (s.sender && s.sender.postalCode) || (window.InitialValues && window.InitialValues.sender && window.InitialValues.sender.postCode) || '');
		usp.append('receiverPostCode', (s.receiver && s.receiver.postalCode) || (window.InitialValues && window.InitialValues.receiver && window.InitialValues.receiver.postCode) || '');
		usp.append('paymentId', parseInt(s.additionalInfo.paymentType, 10) || s.additionalInfo.paymentType);
		if (Array.isArray(s.serviceOptions) && s.serviceOptions.length) {
			s.serviceOptions.forEach(function(opt){
				const id = parseInt(opt.id, 10) || opt.id;
				usp.append('addonIds[]', id);
			});
		}
		if (s.additionalInfo && s.additionalInfo.insuranceAmount) usp.append('insuranceValue', s.additionalInfo.insuranceAmount);
		if (s.additionalInfo && s.additionalInfo.codAmount) usp.append('cashOnDeliveryValue', s.additionalInfo.codAmount);
		if (s.discountCode) usp.append('discountCode', s.discountCode);

		const url = 'https://api.globkurier.pl/v1/order/price?' + usp.toString();
		$('#priceErrorBox').hide().text('');
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(resp){
                if (resp && resp.totalNetPrice != null) {
					GK.state.orderSummary = resp;
					GK.state.priceError = null;
					const cur = resp.currency ? (' ' + resp.currency) : ' PLN';
                    const fuel = (resp.fuelSurchargeGrossPrice != null ? resp.fuelSurchargeGrossPrice : resp.fuelSurcharge);
                    const baseNet = (resp.totalNetPrice != null ? resp.totalNetPrice : null);
                    const addonsNet = (resp.addonsNetPrice != null ? resp.addonsNetPrice : 0);
                    const netWithFuel = (resp.productsGrossPrice != null ? resp.productsGrossPrice : null);
                    const gross = (resp.totalGrossPrice != null ? resp.totalGrossPrice : null);
                    const discount = (resp.discountNetPrice != null ? resp.discountNetPrice : 0);

					$('#summaryBaseNet').text(baseNet != null ? (baseNet + cur) : '-');
                    $('#summaryRowBaseNet').toggle(baseNet != null);

                    $('#summaryAddonsNet').text(addonsNet ? (addonsNet + cur) : ('0' + cur));
                    $('#summaryRowAddons').toggle(!!addonsNet);
                    $('#summaryDiscount').text(discount ? ('-' + discount + cur) : ('0' + cur));
                    $('#summaryRowDiscount').toggle(!!discount);

					$('#summaryNetWithFuel').text(netWithFuel != null ? (netWithFuel + cur) : '-');
                    $('#summaryRowNetWithFuel').toggle(netWithFuel != null);

					$('#summaryGross').text(gross != null ? (gross + cur) : '-');
                    $('#summaryRowGross').toggle(gross != null);

                    $('#summaryFuel').text(fuel != null ? (fuel + cur) : '-');
                    $('#summaryRowFuel').toggle(fuel != null);
                    // VAT: prefer explicit vatPercent; fall back to taxType like "VAT23"
                    let parsedVat = null;
                    if (resp && !resp.vatPercent && resp.taxType && /^VAT(\d+)/.test(resp.taxType)) {
                        parsedVat = parseInt(RegExp.$1, 10);
                    }
                    const effectiveVatPercent = (resp && resp.vatPercent != null) ? resp.vatPercent : parsedVat;
                    const vatVal = (resp.totalGrossPrice != null && resp.totalNetPrice != null)
                        ? (resp.totalGrossPrice - resp.totalNetPrice)
                        : null;
                    if (effectiveVatPercent != null || (vatVal != null && !isNaN(vatVal))) {
                        if (effectiveVatPercent != null) {
                            $('#summaryVatLabel').text('(' + effectiveVatPercent + '%)');
                        } else {
                            $('#summaryVatLabel').text('');
                        }
                        const vatText = (vatVal != null && !isNaN(vatVal)) ? vatVal.toFixed(2) + cur : ('0' + cur);
                        $('#summaryVat').text(vatText);
                        $('#summaryRowVat').show();
                    } else {
                        $('#summaryVatLabel').text('');
                        $('#summaryVat').text('-');
                        $('#summaryRowVat').hide();
                    }
				} else {
					let msg = 'Błąd kalkulacji ceny';
					if (resp && resp.fields && typeof resp.fields === 'object') {
						try {
							msg = Object.keys(resp.fields).map(function(k){ return k + ': ' + resp.fields[k]; }).join('\n');
						} catch(e) {}
					} else if (resp && resp.message) {
						msg = resp.message;
					}
					GK.state.priceError = msg;
					$('#priceErrorBox').text(msg).show();
					// If the error concerns discountCode, recalc without code to zero the discount in summary
					if (resp && resp.fields && resp.fields.discountCode) {
						try {
							const usp2 = new URLSearchParams(usp.toString());
							usp2.delete('discountCode');
							const url2 = 'https://api.globkurier.pl/v1/order/price?' + usp2.toString();
							return fetch(url2, { headers: buildHeaders() })
								.then(function(r){ return r.json(); })
								.then(function(r2){
									if (!r2 || r2.totalNetPrice == null) { return; }
									GK.state.orderSummary = r2;
									const cur2 = r2.currency ? (' ' + r2.currency) : ' PLN';
									const fuel2 = (r2.fuelSurchargeGrossPrice != null ? r2.fuelSurchargeGrossPrice : r2.fuelSurcharge);
									const baseNet2 = (r2.totalNetPrice != null ? r2.totalNetPrice : null);
									const addonsNet2 = (r2.addonsNetPrice != null ? r2.addonsNetPrice : 0);
									const netWithFuel2 = (r2.productsGrossPrice != null ? r2.productsGrossPrice : null);
									const gross2 = (r2.totalGrossPrice != null ? r2.totalGrossPrice : null);
									const discount2 = 0; // wyzerowany rabat
									$('#summaryBaseNet').text(baseNet2 != null ? (baseNet2 + cur2) : '-');
									$('#summaryRowBaseNet').toggle(baseNet2 != null);
									$('#summaryAddonsNet').text(addonsNet2 ? (addonsNet2 + cur2) : ('0' + cur2));
									$('#summaryRowAddons').toggle(!!addonsNet2);
									$('#summaryDiscount').text('0' + cur2);
									$('#summaryRowDiscount').toggle(false);
									$('#summaryNetWithFuel').text(netWithFuel2 != null ? (netWithFuel2 + cur2) : '-');
									$('#summaryRowNetWithFuel').toggle(netWithFuel2 != null);
									$('#summaryGross').text(gross2 != null ? (gross2 + cur2) : '-');
									$('#summaryRowGross').toggle(gross2 != null);
									$('#summaryFuel').text(fuel2 != null ? (fuel2 + cur2) : '-');
									$('#summaryRowFuel').toggle(fuel2 != null);
									let parsedVat2 = null;
									if (r2 && !r2.vatPercent && r2.taxType && /^VAT(\d+)/.test(r2.taxType)) { parsedVat2 = parseInt(RegExp.$1, 10); }
									const effVat2 = (r2 && r2.vatPercent != null) ? r2.vatPercent : parsedVat2;
									const vatVal2 = (r2.totalGrossPrice != null && r2.totalNetPrice != null) ? (r2.totalGrossPrice - r2.totalNetPrice) : null;
									if (effVat2 != null || (vatVal2 != null && !isNaN(vatVal2))) {
										$('#summaryVatLabel').text(effVat2 != null ? ('(' + effVat2 + '%)') : '');
										$('#summaryVat').text(vatVal2 != null ? vatVal2.toFixed(2) + cur2 : ('0' + cur2));
										$('#summaryRowVat').show();
									} else {
										$('#summaryVatLabel').text('');
										$('#summaryVat').text('-');
										$('#summaryRowVat').hide();
									}
									updateSendButtonDisabled();
								});
						} catch(e) {}
					}
				}
				updateSendButtonDisabled();
			});
	}

function renderServicesAndBind() {
    // Keep TPL markup; only bind events here
    populatePackageInputs();
    populateReceiverPoints(); // Display receiver points in UI
    $('#getServicesBtn').off('click').on('click', function(){
            const $btn = $(this);
            $btn.prop('disabled', true);
            $btn.find('i.icon-cog').show();
            GK.state.forceShowAll = true;
            GK.state.forModal = true;
            fetchProducts().then(function(){ $('#servicesPickModal').modal('show'); })
            .finally(function(){ $btn.prop('disabled', false); $btn.find('i.icon-cog').hide(); });
        });
    // Also handle top Change button
    $(document).off('click', '#openServicesModal').on('click', '#openServicesModal', function(){
        GK.state.forceShowAll = $('#service_filters_on').is(':checked');
        GK.state.forModal = true;
        fetchProducts().then(function(){ $('#servicesPickModal').modal('show'); });
    });
		$(document).off('click', '.pick-product').on('click', '.pick-product', function(){
			const productId = $(this).data('id');
			// find selected product in last list
			const found = (GK.state.products || []).find(function(p){ return (p.id + '') === (productId + ''); });
			if (found) {
				GK.state.pickedService = Object.assign({}, found);
				GK.state.pickedService.packageInfo = GK.state.packageInfo;
			} else {
				const $card = $(this).closest('.glob-product-block');
				const name = $card.find('strong').first().text();
				GK.state.pickedService = { id: productId, carrierName: name, name: $card.find('span').first().text(), packageInfo: GK.state.packageInfo };
			}
			// reset previously selected addons/options when changing service
			GK.state.serviceOptions = [];
			fetchAddonsAndPayments();
			renderSummaryContainer();
			updateSendButtonDisabled();
            $('#servicesPickModal').modal('hide');
            GK.state.forModal = false;
            // show top service card and options sections
            updateChosenServiceUI();
			$('#openServicesModal').show();
            $('#servicesContainer').show();
            $('#servicesListContainer').show();
            $('#serviceOptionsContainer').show();
			$('#getServicesBtn').hide();
            updateCarrierDependentUI();
            // preload time ranges if courier pickup selected
            if ($('input[name=pickup_type]:checked').val() === 'PICKUP') { fetchTimeRanges(); }
		fetchCustomRequiredFields();
		});
		$(document).on('change', '.addon-checkbox', function(){
			const id = $(this).data('id');
			const price = $(this).data('price');
			const category = $(this).data('category');
			const addonName = $(this).closest('label').text().trim();
			if ($(this).is(':checked')) {
				if (!Array.isArray(GK.state.serviceOptions)) GK.state.serviceOptions = [];
				if (!GK.state.serviceOptions.some(function(o){ return (o.id + '') === (id + ''); })) {
					GK.state.serviceOptions.push({
						id: id,
						price: price,
						category: category,
						name: addonName
					});
				}
			} else {
				GK.state.serviceOptions = (GK.state.serviceOptions || []).filter(function(o){ return (o.id + '') !== (id + ''); });
			}
			updateEnabledOptionsUI();
			refreshPayments();
			recalcOrderPrice();
		});
		// show all carriers toggle
	GK.state.showAllCarriers = false;
	$('#disableServiceFilters').off('click').on('click', function(){
		GK.state.showAllCarriers = true;
		GK.state.forceShowAll = true;
		fetchProducts().then(function(){ $('#servicesPickModal').modal('show'); });
	});
	$('#enableServiceFilters').off('click').on('click', function(){
		GK.state.showAllCarriers = false;
		GK.state.forceShowAll = false;
		fetchProducts().then(function(){ $('#servicesPickModal').modal('show'); });
	});
	}

	// ============ Terminal picker (jQuery rebuild of Angular globTerminalPicker) ============
	function fetchTerminals(query) {
		const s = GK.state;
		if (!s.pickedService) return Promise.resolve();
		const params = { productId: s.pickedService.id };
		if (query) params.filter = query;
		params.isCashOnDeliveryAddonSelected = !!(s.additionalInfo && s.additionalInfo.codAmount);
		const url = 'https://api.globkurier.pl/v1/points?' + new URLSearchParams(params).toString();
		return fetch(url, { headers: buildHeaders() })
			.then(function(r){ return r.json(); })
			.then(function(resp){
				// Hide error box first
				$('#terminalErrorBox').hide();

				// Check if response contains error fields
				if (resp && resp.fields && typeof resp.fields === 'object') {
					const errorMessages = Object.keys(resp.fields).map(function(k) {
						return k + ': ' + resp.fields[k];
					}).join('\n');
					$('#terminalErrorBox').text(errorMessages).show();
					$('#terminalSelect').html('');
					$('#terminalHint').hide();
					return;
				}

				// Handle normal list response
				let list = resp;
				if (!Array.isArray(list)) list = [];
				if (!list.length) {
					$('#terminalSelect').html('');
					$('#terminalHint').show();
					return;
				}
				const html = list.map(function(t, i){
					const label = (t.city ? t.city + ', ' : '') + (t.address || '');
					const id = t.id || t.code || ('pt_' + i);
					return '<option value="' + id + '" data-json="' + encodeURIComponent(JSON.stringify({ id: id, city: t.city, address: t.address })) + '">' + label + '</option>';
				}).join('');
				$('#terminalSelect').html(html);
				$('#terminalHint').hide();
			})
			.catch(function(e){
				// Handle network/parsing errors
				const errorMsg = e && e.message ? e.message : 'Error fetching terminals';
				$('#terminalErrorBox').text(errorMsg).show();
				$('#terminalSelect').html('');
				$('#terminalHint').hide();
			});
	}

	// open picker
	$(document).on('click', '.open-terminal-picker', function(){
		GK.state.terminalTarget = $(this).data('target') || 'inPostReceiverPoint';
		$('#terminalQuery').val('');
		$('#terminalSelect').html('');
		$('#terminalHint').show();
		$('#terminalErrorBox').hide(); // Clear error on modal open
		$('#terminalPickerModal').modal('show');
	});

	// search points
	$(document).on('click', '#terminalSearchBtn', function(){
		const q = $('#terminalQuery').val();
		fetchTerminals(q);
	});

	// save selected point
	$(document).on('click', '#terminalSaveBtn', function(){
		const opt = $('#terminalSelect option:selected');
		if (!opt.length) return;
		let data = opt.attr('data-json');
		try { data = JSON.parse(decodeURIComponent(data)); } catch(e) { data = {}; }
		const code = data.id || '';
		const label = (data.city ? data.city + ', ' : '') + (data.address || '');
		if (!GK.state.additionalInfo) GK.state.additionalInfo = {};
		const target = GK.state.terminalTarget || 'inPostReceiverPoint';
		if (target === 'inPostReceiverPoint') {
			GK.state.additionalInfo.inPostReceiverPoint = { id: code };
			GK.state.receiver = GK.state.receiver || {};
			GK.state.receiver.terminal = code;
			$('#inpostReceiverLabel').text('[' + code + '] ' + label);
			// Don't update terminalCode or terminalLabel - they show client's original choice
		} else if (target === 'inPostSenderPoint') {
			GK.state.additionalInfo.inPostSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#inpostSenderLabel').text('[' + code + '] ' + label);
		} else if (target === 'paczkaRuchReceiverPoint') {
			GK.state.additionalInfo.paczkaRuchReceiverPoint = { id: code };
			GK.state.receiver.terminal = code;
			$('#orlenReceiverLabel').text('[' + code + '] ' + label);
			// Don't update terminalCode or terminalLabel - they show client's original choice
		} else if (target === 'pocztex48owpReceiverPoint') {
			GK.state.additionalInfo.pocztex48owpReceiverPoint = { id: code };
			GK.state.receiver.terminal = code;
			$('#pocztexReceiverLabel').text('[' + code + '] ' + label);
			// Don't update terminalCode or terminalLabel - they show client's original choice
		} else if (target === 'dhlparcelReceiverPoint') {
			GK.state.additionalInfo.dhlparcelReceiverPoint = { id: code };
			GK.state.receiver.terminal = code;
			$('#dhlReceiverLabel').text('[' + code + '] ' + label);
			// Don't update terminalCode or terminalLabel - they show client's original choice
		} else if (target === 'dhlparcelSenderPoint') {
			GK.state.additionalInfo.dhlparcelSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#dhlSenderLabel').text('[' + code + '] ' + label);
		} else if (target === 'paczkaRuchSenderPoint') {
			GK.state.additionalInfo.paczkaRuchSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#orlenSenderLabel').text('[' + code + '] ' + label);
		} else if (target === 'pocztex48owpSenderPoint') {
			GK.state.additionalInfo.pocztex48owpSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#pocztexSenderLabel').text('[' + code + '] ' + label);
		} else if (target === 'dpdpickupReceiverPoint') {
			GK.state.additionalInfo.dpdpickupReceiverPoint = { id: code };
			GK.state.receiver.terminal = code;
			$('#dpdReceiverLabel').text('[' + code + '] ' + label);
			// Don't update terminalCode or terminalLabel - they show client's original choice
		} else if (target === 'dpdpickupSenderPoint') {
			GK.state.additionalInfo.dpdpickupSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#dpdSenderLabel').text('[' + code + '] ' + label);
		} else if (target === 'fedexReceiverPoint') {
			GK.state.additionalInfo.fedexReceiverPoint = { id: code };
			GK.state.receiver.terminal = code;
			$('#fedexReceiverLabel').text('[' + code + '] ' + label);
		} else if (target === 'fedexSenderPoint') {
			GK.state.additionalInfo.fedexSenderPoint = { id: code };
			GK.state.sender = GK.state.sender || {};
			GK.state.sender.terminal = code;
			$('#fedexSenderLabel').text('[' + code + '] ' + label);
		}
		recalcOrderPrice();
	});

	$(function(){
		initStateFromInitialValues();
		GK.state.packageInfo = (window.InitialValues && window.InitialValues.defaultPackageInfo) ? window.InitialValues.defaultPackageInfo : { count: 1 };
		renderAddressBoxes();
        populateDisplayPanels();
        bindEditModals();
		renderServicesAndBind();
		bind();

		// Initialize terminal info if available from InitialValues
		if (window.InitialValues && window.InitialValues.terminalCode) {
			$('#terminalCode').text(window.InitialValues.terminalCode);
			if (!GK.state.receiver) GK.state.receiver = {};
			GK.state.receiver.terminal = window.InitialValues.terminalCode;
		}

		if (window.InitialValues && window.InitialValues.terminalType) {
			$('.terminalLabel').hide();
			$('.terminalLabel[data-type="' + (window.InitialValues.terminalType || '') + '"]').show();
		}
	});

})();



/**
 * Globkurier App
 *
 * @author  Wiktor Koźmiński
 * @license mit
 * @extends Rafał Przybylski - tebim.pl
 */

let clik_c = 0;

function clik()
{
    clik_c = 1;
}

! function() {
    "use strict";

    function mainGlobController($scope, InitialValues, Address, XmlGenerator, XmlOrderModel, GlobApi, GlobCountriesManager, ModuleApi, OrderDataTranslator, CollectionTypeService)
    {
        function toggleServiceFilters(enable)
        {
            let x = enable ? void("ruch" == $scope.terminalType ? $scope.filterServices.push("Orlen Paczka") :
                (void("pocztex48owp" == $scope.terminalType ? $scope.filterServices.push("Poczta Polska") :
                    (void("dhlparcel" == $scope.terminalType ? $scope.filterServices.push("DHL ParcelShop") :
                        (void("dpdpickup" == $scope.terminalType ? $scope.filterServices.push("DPD Pickup") : $scope.filterServices.push("inPost-Paczkomaty")))))))) : void($scope.filterServices.length = 0);

            return x;
        }

        function sendOrder()
        {
            if ($scope.additionalInfo.getInPostReceiverCode() && ($scope.receiver.terminal = $scope.additionalInfo.getInPostReceiverCode()), $scope.additionalInfo.getRuchTerminalCode() && ($scope.receiver.terminal = $scope.additionalInfo.getRuchTerminalCode()), $scope.additionalInfo.getInPostSenderCode() && ($scope.sender.terminal = $scope.additionalInfo.getInPostSenderCode()), $scope.validationError = getValidationErrors(), null == $scope.validationError) {
                var order = XmlOrderModel.getNew();
                order.receiver = $scope.receiver, order.sender = $scope.sender, order.serviceSymbol = $scope.pickedService.symbol, order.service = $scope.pickedService, order.packageInfo = $scope.pickedService.packageInfo, order.serviceOptions = $scope.serviceOptions, order.additionalInfo = $scope.additionalInfo;
                var selectedCollectionType = order.service.collectionTypes.length > 1 ? CollectionTypeService.getCollectionType() : order.service.collectionTypes[0];
                var orderData = OrderDataTranslator.generate(order, selectedCollectionType);
                $scope.isProcessing = !0, $scope.orderError = null, GlobApi.placeOrder(orderData, function(err, orderNumber, hash) {
                    return $scope.isProcessing = !1, err ? ($scope.orderError = angular.isObject(err) ? err : {
                        commonMsg: err
                    }, void translateOrderErrors()) : (order.gkId = orderNumber, order.hash = hash, $scope.orderPlaced = order, void saveOrderInShop(order))
                })
            }
        }

        function saveOrderInShop(order)
        {
            order && ModuleApi.saveOrder(order, InitialValues.prestaOrderId, function(err, v) {})
        }

        function translateOrderErrors()
        {
            if (angular.isObject($scope.orderError)) {
                var translateMap = {
                    "senderAddress[name]": "Nazwa nadawcy",
                    "senderAddress[city]": "Miasto nadawcy",
                    "senderAddress[street]": "Ulica nadawcy",
                    "senderAddress[houseNumber]": "Numer domu nadawcy",
                    "senderAddress[apartmentNumber]": "Numer mieszkania nadawcy",
                    "senderAddress[postCode]": "Kod pocztowy nadawcy",
                    "senderAddress[countryId]": "Kraj nadawcy",
                    "senderAddress[phone]": "Numer telefonu nadawcy",
                    "senderAddress[email]": "Adres email nadawcy",
                    "senderAddress[contactPerson]": "Osoba kontaktowa nadawcy",
                    "senderAddress[pointId]": "Punkt nadania",
                    "receiverAddress[name]": "Nazwa odbiorcy",
                    "receiverAddress[city]": "Miasto odbiorcy",
                    "receiverAddress[street]": "Ulica odbiorcy",
                    "receiverAddress[houseNumber]": "Numer domu odbiorcy",
                    "receiverAddress[apartmentNumber]": "Numer mieszkania odbiorcy",
                    "receiverAddress[postCode]": "Kod pocztowy odbiorcy",
                    "receiverAddress[countryId]": "Kraj odbiorcy",
                    "receiverAddress[phone]": "Numer telefonu odbiorcy",
                    "receiverAddress[email]": "Adres email odbiorcy",
                    "receiverAddress[stateId]": "Stan/Województwo odbiorcy",
                    "receiverAddress[contactPerson]": "Osoba kontaktowa odbiorcy",
                    "receiverAddress[pointId]": "Punkt odbioru",
                    "pickup[date]": "Data nadania",
                    "pickup[timeFrom]": "Przedział pickup od",
                    "pickup[timeTo]": "Przedział pickup do",
                    "declaredValue": "Deklarowana wartość",
                    "purpose": "Cel przesyłki",
                    "addons": "Opcje dodatkowe",
                    paymentId: "Płatność",
                    "regex:addons\\[\\d\\]\\[name\\]": "Nazwa właściciela rachunku",
                    "regex:addons\\[\\d\\]\\[bankAccountNumber\\]": "Numer rachunku bankowego",
                    "regex:addons\\[\\d\\]\\[addressLine1\\]": "Adres właściciela rachunku",
                    "regex:addons\\[\\d\\]\\[addressLine2\\]": "Druga linia adresu właściciela rachunku",
                    "regex:addons\\[\\d\\]\\[value\\]": "Wartość kwoty pobrania lub ubezpieczenia",
                    "regex:addons\\[\\d\\]\\[id\\]": "Błąd opcji dodatkowej"
                };

                $scope.orderError.paymentId && ($scope.orderError.paymentId = "Nie wybrano formy płatności"), Object.keys(translateMap).forEach(function(key) {
                    var isRegex = "regex" == key.split(":")[0];
                    if (!isRegex && $scope.orderError[key]) {
                        if (key == 'addons') {
                            $scope.orderError['addons'] = $scope.orderError['addons']+' Proszę wybrać typ odbiorcy: Doręczenie do firmy lub doręczenie do osoby prywatnej.';
                        }
                        return $scope.orderError[translateMap[key]] = $scope.orderError[key], void delete $scope.orderError[key];
                    }
                    if (isRegex) {
                        var r = new RegExp(key.split(":")[1]),
                            matches = Object.keys($scope.orderError).filter(function(k) {
                                return k.match(r)
                            });
                        if (!matches.length) {
                            return;
                        }
                        for (var i = 0; i < matches.length; i++) {
                            $scope.orderError[translateMap[key] + (i > 0 ? " (" + i + ")" : "")] = $scope.orderError[matches[i]], delete $scope.orderError[matches[i]]
                        }
                    }
                })
            }
        }

        function getValidationErrors()
        {
            var r = {};
            return $scope.sender.phone || (r.noSenderPhone = !0), $scope.receiver.phone || (r.noReceiverPhone = !0), Object.keys(r).length > 0 ? r : null
        }

        $scope.sender = Address.getNew(), $scope.receiver = Address.getNew(), $scope.additionalInfo = null, $scope.service = {}, $scope.pickedService = null, $scope.serviceOptions = null, $scope.isProcessing = !1, $scope.send = sendOrder, $scope.orderError = null, $scope.validationError = null, $scope.terminalCode = null, $scope.terminalType = null, $scope.filterServices = [], $scope.orderPlaced = null, $scope.disableServiceFilters = function() {
            toggleServiceFilters(!1)
        }, $scope.enableServiceFilters = function() {
            toggleServiceFilters(!0)
        },
            function() {
                InitialValues.receiver && ($scope.receiver.name = InitialValues.receiver.personName, $scope.receiver.street = InitialValues.receiver.street, $scope.receiver.houseNumber = InitialValues.receiver.houseNumber, $scope.receiver.apartmentNumber = InitialValues.receiver.apartmentNumber, $scope.receiver.postalCode = InitialValues.receiver.postCode, $scope.receiver.city = InitialValues.receiver.city, $scope.receiver.country = InitialValues.receiver.countryCode, $scope.receiver.contactPerson = InitialValues.receiver.personName, $scope.receiver.phone = InitialValues.receiver.phone, $scope.receiver.email = InitialValues.receiver.email), $scope.sender.name = InitialValues.sender.name, $scope.sender.street = InitialValues.sender.street, $scope.sender.houseNumber = InitialValues.sender.houseNumber, $scope.sender.apartmentNumber = InitialValues.sender.apartmentNumber, $scope.sender.postalCode = InitialValues.sender.postCode, $scope.sender.city = InitialValues.sender.city, $scope.sender.contactPerson = InitialValues.sender.personName, $scope.sender.phone = InitialValues.sender.phone, $scope.sender.email = InitialValues.sender.email, InitialValues.terminalCode && ($scope.terminalCode = InitialValues.terminalCode, $scope.terminalType = InitialValues.terminalType, "ruch" == $scope.terminalType ? $scope.filterServices.push("Orlen Paczka") : ("pocztex48owp" == $scope.terminalType ? $scope.filterServices.push("Poczta Polska") : ("dpdpickup" == $scope.terminalType ? $scope.filterServices.push("DPD") : ("dhlparcel" == $scope.terminalType ? $scope.filterServices.push("DHL ParcelShop") : $scope.filterServices.push("inPost-Paczkomaty"))))), GlobCountriesManager.setOnFinishLoading(function() {
                    $scope.sender.country = GlobCountriesManager.getCountryByIsoCode(InitialValues.sender.countryCode), InitialValues.receiver && ($scope.receiver.country = GlobCountriesManager.getCountryByIsoCode(InitialValues.receiver.countryCode))
                })
            }()
    }
    angular.module("newParcelApp", []), angular.module("newParcelApp").controller("mainController", ["$scope", "InitialValues", "Address", "XmlGenerator", "XmlOrderModel", "GlobApi", "GlobCountriesManager", "ModuleApi", "OrderDataTranslator", "CollectionTypeService", mainGlobController])
}(),
    function() {
        "use strict";
        function globAdditionalInformation(InitialValues)
        {
            function globAdditionalInformationController($scope, InitialValues, AdditionalInformation, GlobApi)
            {
                function onSendDateChange(newValue, oldValue)
                {
                    reloadTimeRanges()
                }

                function onServiceModelChange(newValue, oldValue)
                {
                    $scope.serviceModel && $scope.serviceModel.id && (reloadAvailablePayments(), reloadStates(), resetFormValues(), $scope.serviceModel.labels && $scope.serviceModel.carrierName.indexOf("inPost-Paczkomaty") != -1 ? ($scope.enabledFields.inpost = !0, InitialValues.terminalCode && "inpost" == InitialValues.terminalType && ($scope.ngModel.inPostReceiverPoint = {
                        id: InitialValues.terminalCode
                    }), InitialValues.defaultInPostPoint && ($scope.ngModel.inPostSenderPoint = {
                        id: InitialValues.defaultInPostPoint
                    })) : $scope.serviceModel.labels && $scope.serviceModel.carrierName.indexOf("Orlen Paczka") != -1 ? ($scope.enabledFields.ruch = !0, InitialValues.terminalCode && "ruch" == InitialValues.terminalType && ($scope.ngModel.paczkaRuchReceiverPoint = {
                        id: InitialValues.terminalCode
                    })) : $scope.serviceModel.labels && $scope.serviceModel.carrierName.indexOf("Poczta Polska") != -1 ? ($scope.enabledFields.pocztex48owp = !0, InitialValues.terminalCode && "pocztex48owp" == InitialValues.terminalType && ($scope.ngModel.pocztex48owpReceiverPoint = {
                        id: InitialValues.terminalCode
                    })) : $scope.serviceModel.labels && $scope.serviceModel.carrierName.indexOf("DHL Parcel") != -1 ? ($scope.enabledFields.dhlparcel = !0, InitialValues.terminalCode && "dhlparcel" == InitialValues.terminalType && ($scope.ngModel.dhlparcelReceiverPoint = {
                        id: InitialValues.terminalCode
                    })) : $scope.serviceModel.labels && $scope.serviceModel.carrierName.indexOf("DPD Pickup") != -1 ? ($scope.enabledFields.dpdpickup = !0, InitialValues.terminalCode && "dpdpickup" == InitialValues.terminalType && ($scope.ngModel.dpdpickupReceiverPoint = {
                        id: InitialValues.terminalCode
                    }))  : $scope.serviceModel.labels && $scope.serviceModel.carrierName.indexOf("DPD") != -1 ? ($scope.enabledFields.dpdpickup = !0, InitialValues.terminalCode && "dpdpickup" == InitialValues.terminalType && ($scope.ngModel.dpdpickupReceiverPoint = {
                        id: InitialValues.terminalCode
                    })) : ($scope.enabledFields.sendDate = !0, $scope.ngModel.sendDate = InitialValues.todayDate), checkInternational())
                }

                function resetFormValues()
                {
                    var enFields = $scope.enabledFields;
                    for (var field in enFields) {
                        "boolean" == typeof enFields[field] && (enFields[field] = !1);
                    }
                    $scope.ngModel.inPostSenderPoint = null, $scope.ngModel.inPostReceiverPoint = null, $scope.ngModel.paczkaRuchReceiverPoint = null, $scope.ngModel.dpdpickupReceiverPoint = null, $scope.ngModel.dhlparcelReceiverPoint = null, $scope.ngModel.pocztex48owpReceiverPoint = null, $scope.ngModel.pocztex48owpReceiverPoint = null, $scope.ngModel.sendDate = null, $scope.enabledFields.paymentType = !0, $scope.enabledFields.stateType = !0
                }

                function onServiceOptionsChange(newValue, oldValue)
                {
                    var activeCategories;
                    activeCategories = $scope.serviceOptions && $scope.serviceOptions.length ? $scope.serviceOptions.map(function(v) {
                        return v.category
                    }) : [], reloadAvailablePayments(), activeCategories.indexOf("NKO") != -1 ? ($scope.enabledFields.paymentType = !1, $scope.ngModel.paymentType = "COD") : ($scope.enabledFields.paymentType = !0, "COD" == $scope.ngModel.paymentType && ($scope.ngModel.paymentType = null)), activeCategories.indexOf("CASH_ON_DELIVERY") != -1 ? ($scope.enabledFields.codAmount = !0, $scope.enabledFields.codAccount = !0, $scope.ngModel.codAccount = InitialValues.defaultCodAccount) : ($scope.enabledFields.codAmount = !1, $scope.enabledFields.codAccount = !1, $scope.ngModel.codAmount = null, $scope.ngModel.codAccount = null), activeCategories.indexOf("INSURANCE") != -1 ? $scope.enabledFields.insuranceAmount = !0 : ($scope.enabledFields.insuranceAmount = !1, $scope.ngModel.insuranceAmount = null)
                }

                function onRecevicerAddressChange(newValue, oldValue)
                {
                    checkInternational()
                }

                function checkInternational()
                {
                    return $scope.recevicerAddress.country && $scope.recevicerAddress.country.isoCode ? void("PL" != $scope.recevicerAddress.country.isoCode ? $scope.enabledFields.declaredValue = !0 : $scope.enabledFields.declaredValue = !1) : void($scope.enabledFields.declaredValue = !1)
                }

                function reloadTimeRanges()
                {
                    if ($scope.serviceModel) {
                        $scope.availableTimeRanges.length = 0;
                        var d = $scope.ngModel.sendDate;
                        $scope.loaders.timeRanges = !0, GlobApi.getPickupTimeRanges($scope.serviceModel.id, d, $scope.serviceModel.lastParameters, function(err, timeRanges) {
                            $scope.loaders.timeRanges = !1, err || ($scope.availableTimeRanges = timeRanges, $scope.availableTimeRanges.length && ($scope.ngModel.timeRange = $scope.availablePayments[0]))
                        })
                    }
                }

                function reloadAvailablePayments()
                {
                    if ($scope.serviceModel) {
                        var grossPrice = $scope.serviceModel.grossPrice;
                        if ($scope.serviceOptions && $scope.serviceOptions.length)
                            for (var i = $scope.serviceOptions.length - 1; i >= 0; i--) grossPrice += $scope.serviceOptions[i].price;
                        $scope.loaders.payments = !0, GlobApi.getPayments($scope.serviceModel.id, grossPrice, function(err, payments) {
                            $scope.loaders.payments = !1, err || ($scope.availablePayments = payments.filter(function(p) {
                                return p.enabled
                            }))
                        })
                    }
                }

                function reloadStates()
                {
                    if ($scope.serviceModel) {
                        return GlobApi.getStates($scope.recevicerAddress.country.id, function(err, states) {
                            $scope.loaders.states = states;
                            $scope.states = states;
                            $scope.availableStates = states;
                        });
                    }
                }

                $scope.enabledFields = {
                    codAmount: !1,
                    codAccount: !1,
                    insuranceAmount: !1,
                    declaredValue: !1,
                    paymentType: !0,
                    stateType: !0,
                    inpost: !1,
                    ruch: !1,
                    sendDate: !1
                }, $scope.loaders = {
                    payments: !1,
                    timeRanges: !1,
                    states: !1
                }, $scope.ngModel = AdditionalInformation.getNew(), $scope.availablePayments = [], $scope.availableTimeRanges = [], $scope.ngModel.codAccount = InitialValues.defaultCodAccount, $scope.ngModel.codAccountHolder = InitialValues.defaultCodAccountHolderName, $scope.ngModel.codAccountAddr1 = InitialValues.defaultCodAccountHolderAddr1, $scope.ngModel.codAccountAddr2 = InitialValues.defaultCodAccountHolderAddr2,
                    function() {
                        $(".send-date").datepicker(), $(".send-date").datepicker("option", "dateFormat", "yy-mm-dd")
                    }(), $scope.$watch("ngModel.sendDate", onSendDateChange), $scope.$watch("recevicerAddress.country", onRecevicerAddressChange), $scope.$watchCollection("serviceOptions", onServiceOptionsChange), $scope.$watchCollection("serviceModel", onServiceModelChange)
            }

            function link(scope, element, attrs) {}
            var directive = {
                restrict: "A",
                templateUrl: InitialValues.partialsPath + "globAdditionalInformation_"+InitialValues.isoCode+".html",
                scope: {
                    ngModel: "=",
                    serviceModel: "=",
                    serviceOptions: "=",
                    recevicerAddress: "=",
                },
                controller: ["$scope", "InitialValues", "AdditionalInformation", "GlobApi", globAdditionalInformationController],
                link: link
            };
            return directive
        }
        angular.module("newParcelApp").directive("globAdditionalInformation", ["InitialValues", globAdditionalInformation])
    }(),
    function() {
        "use strict";

        function additionalInformationModel()
        {
            var AdditionalInformation = function() {
                function getInPostPointCode(type)
                {
                    var point = null;
                    return point = type && "receiver" == type ? _self.inPostReceiverPoint : _self.inPostSenderPoint, point && point.id ? point.id : null
                }
                var _self = this;
                this.codAmount = null, this.codAccount = null, this.codAccountHolder = null, this.codAccountAddr1 = null, this.codAccountAddr2 = null, this.insuranceAmount = null, this.declaredValue = null, this.sendDate = null, this.timeRange = null, this.paymentType = "T", this.stateType = null, this.inPostSenderPoint = null, this.inPostReceiverPoint = null, this.paczkaRuchReceiverPoint = null, this.pocztex48owpReceiverPoint = null, this.dhlparcelReceiverPoint = null, this.dpdpickupReceiverPoint = null, this.getInPostReceiverCode = function() {
                    return getInPostPointCode("receiver")
                }, this.getInPostSenderCode = function() {
                    return getInPostPointCode("sender")
                }, this.getRuchTerminalCode = function() {
                    return _self.paczkaRuchReceiverPoint && _self.paczkaRuchReceiverPoint.id ? _self.paczkaRuchReceiverPoint.id : null
                }, this.getPocztex48owpTerminalCode = function() {
                    return _self.pocztex48owpReceiverPoint && _self.pocztex48owpReceiverPoint.id ? _self.pocztex48owpReceiverPoint.id : null
                }, this.getDhlParcelTerminalCode = function() {
                    return _self.dhlparcelReceiverPoint && _self.dhlparcelReceiverPoint.id ? _self.dhlparcelReceiverPoint.id : null
                }, this.getDpdPickupTerminalCode = function() {
                    return _self.dpdpickupReceiverPoint && _self.dpdpickupReceiverPoint.id ? _self.dpdpickupReceiverPoint.id : null
                }
            };
            return {
                getNew: function() {
                    return new AdditionalInformation
                }
            }
        }
        angular.module("newParcelApp").factory("AdditionalInformation", [additionalInformationModel])
    }(),
    function() {
        "use strict";

        function globapi($http, InitialValues, ModuleApi)
        {
            function getProducts(parameters, callback)
            {
                angular.isFunction(callback) || (callback = function() {});
                for (var requiredParameters = ["length", "width", "height", "weight", "quantity", "senderCountryId", "receiverCountryId"], i = requiredParameters.length - 1; i >= 0; i--) {
                    var p = requiredParameters[i];
                    if (void 0 === parameters[p]) return callback(InitialValues.lang1+" " + p + " "+InitialValues.lang2)
                }
                $http({
                    method: "GET",
                    params: parameters,
                    url: baseApiUrl + "products",
                    headers: {
                        "x-auth-token": token
                    }
                }).then(function(r) {
                    return callback(null, r.data)
                }, function(r) {
                    if (r.data.fields) {
                        var err = "";
                        return angular.forEach(r.data.fields, function(value, key) {
                            err += key + ": " + value + ", "
                        }), callback(err)
                    }
                    return callback("Something wrong")
                })
            }

            function getProductAddons(productId, parameters, callback)
            {
                angular.isFunction(callback) || (callback = function() {});
                for (var requiredParameters = ["length", "width", "height", "weight", "quantity", "senderCountryId", "receiverCountryId", "senderPostCode", "receiverPostCode"], i = requiredParameters.length - 1; i >= 0; i--) {
                    var p = requiredParameters[i];
                    if (void 0 === parameters[p]) return callback(InitialValues.lang1+" " + p + " "+InitialValues.lang2)
                }
                $http({
                    method: "GET",
                    params: angular.extend({
                        productId: productId
                    }, parameters),
                    url: baseApiUrl + "product/addons",
                    headers: {
                        "x-auth-token": token
                    }
                }).then(function(r) {
                    return callback(null, r.data.addons)
                }, function(r) {
                    if (r.data.fields) {
                        var err = "";
                        return angular.forEach(r.data.fields, function(value, key) {
                            err += key + ": " + value + ", "
                        }), callback(err)
                    }
                    return callback("Something wrong")
                })
            }

            function getPickupTimeRanges(productId, date, parameters, callback)
            {
                angular.isFunction(callback) || (callback = function() {});
                for (var requiredParameters = ["weight", "quantity", "senderCountryId", "receiverCountryId", "senderPostCode", "receiverPostCode"], paramsToSend = {}, i = requiredParameters.length - 1; i >= 0; i--) {
                    var p = requiredParameters[i];
                    if (void 0 === parameters[p]) return callback(InitialValues.lang1+" " + p + " "+InitialValues.lang2);
                    paramsToSend[p] = parameters[p]
                }
                $http({
                    method: "GET",
                    params: angular.extend({
                        productId: productId,
                        date: date
                    }, paramsToSend),
                    url: baseApiUrl + "order/pickupTimeRanges",
                    headers: {
                        "accept-language": "pl"
                    }
                }).then(function(r) {
                    return callback(null, r.data)
                }, function(r) {
                    if (r.data.fields) {
                        var err = "";
                        return angular.forEach(r.data.fields, function(value, key) {
                            err += key + ": " + value + ", "
                        }), callback(err)
                    }
                    return callback(commonErrorMsg)
                })
                // let collectionType = 'PICKUP';
                // customRequiredFields(productId, collectionType, parameters.senderCountryId, parameters.receiverCountryId, parameters.terminalType2);
            }

            function getPayments(productId, grossOrderPrice, callback)
            {
                angular.isFunction(callback) || (callback = function() {});
                var parameters = {
                    productId: productId,
                    isFreightForwardAddonSelected: !1
                };
                return grossOrderPrice && (parameters.grossOrderPrice = parseFloat(grossOrderPrice).toFixed(2)), $http({
                    method: "GET",
                    url: baseApiUrl + "order/payments",
                    params: parameters,
                    headers: {
                        "x-auth-token": token
                    }
                }).then(function(r) {
                    callback(null, r.data)
                }, function(r) {
                    callback(commonErrorMsg)
                }), service
            }

            function getCountries(callback)
            {
                return angular.isFunction(callback) || (callback = function() {}), $http({
                    method: "GET",
                    url: baseApiUrl + "countries"
                }).then(function(r) {
                    callback(null, r.data)
                }, function(r) {
                    callback(commonErrorMsg)
                }), service
            }

            function getStates(idCountry, callback)
            {
                return angular.isFunction(callback) || (callback = function() {}), $http({
                    method: "GET",
                    url: baseApiUrl + "states?countryId="+idCountry,
                }).then(function(r) {
                    callback(null, r.data)
                }, function(r) {
                    callback(commonErrorMsg)
                }), service
            }

            function getTerminals(options, callback)
            {
                return angular.isFunction(callback) || (callback = function() {}), options || (options = {}), $http({
                    method: "GET",
                    url: baseApiUrl + "points",
                    params: options
                }).then(function(r) {
                    callback(null, r.data)
                    $('.select2').select2();
                }, function(r) {
                    callback(commonErrorMsg)
                }), service
            }

            function placeOrder(orderData, callback)
            {
                angular.isFunction(callback) || (callback = function() {}), $http({
                    method: "POST",
                    url: baseApiUrl + "order",
                    data: JSON.stringify(orderData),
                    headers: {
                        "Content-Type": "application/json",
                        "accept-language": "pl",
                        "x-auth-token": token
                    }
                }).then(function(r) {
                    callback(null, r.data.number, r.data.hash)
                }, function(r) {
                    return callback(r.data.fields ? r.data.fields : commonErrorMsg)
                })
            }

            function sendOrder(xmlData, callback)
            {
                return angular.isFunction(callback) || (callback = function() {}), ModuleApi.logOrderXml(xmlData), $http({
                    method: "POST",
                    url: baseApiUrl + "services/order/",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data: "DATA=" + xmlData
                }).then(function(r) {
                    if (ModuleApi.logServerResponse(r.data), !r.data.status) {
                        var errMsg = r.data.error ? r.data.error : commonErrorMsg;
                        return void callback(errMsg)
                    }
                    callback(null, r.data.params.nrgk)
                }, function(r) {
                    callback(commonErrorMsg)
                }), service
            }
            var commonErrorMsg = "Wystapil błąd połączenia z serwerem globkurier",
                baseApiUrl = "https://api.globkurier.pl/v1/",
                token = InitialValues.token,
                service = {
                    sendOrder: sendOrder,
                    placeOrder: placeOrder,
                    getCountries: getCountries,
                    getTerminals: getTerminals,
                    getProducts: getProducts,
                    getProductAddons: getProductAddons,
                    getPickupTimeRanges: getPickupTimeRanges,
                    getPayments: getPayments,
                    getStates: getStates
                };
            return service
        }
        angular.module("newParcelApp").factory("GlobApi", ["$http", "InitialValues", "ModuleApi", globapi])
    }(),
    function() {
        "use strict";

        function globTerminalPicker(InitialValues)
        {
            function globTerminalPickerController($scope, GlobApi)
            {
                function searchTerminals()
                {
                    var opt = {
                        productId: $scope.product.id,
                        filter: $scope.query,
                        isCashOnDeliveryAddonSelected: !!$scope.isCod
                    };
                    $scope.terminalsList.length = 0, $scope.error = null, $scope.processing = !0, GlobApi.getTerminals(opt, function(err, list) {
                        return $scope.processing = !1, err ? void($scope.error = err) : list.length ? void($scope.terminalsList = list) : void($scope.error = "Nie znaleziono żadnych punktów odbioru/nadania dla podanych kryteriów")
                    });
                }

                function assingTerminalToModel() {
                    return $scope.ngModel = $scope.selectedTerminal, !0
                }
                $scope.modalId = "terminalPickerModal" + Math.floor(100 * Math.random() + 1), $scope.selectedTerminal = null, $scope.query = null, $scope.terminalsList = [], $scope.processing = !1, $scope.error = null, $scope.saveTerminal = assingTerminalToModel, $scope.searchTerminals = searchTerminals
            }

            function link(scope, element, attrs) {}
            var directive = {
                restrict: "A",
                templateUrl: InitialValues.partialsPath + "globTerminalPicker_"+InitialValues.isoCode+".html",
                scope: {
                    ngModel: "=",
                    product: "=",
                    isCod: "="
                },
                controller: ["$scope", "GlobApi", globTerminalPickerController],
                link: link
            };
            return directive
        }
        angular.module("newParcelApp").directive("globTerminalPicker", ["InitialValues", globTerminalPicker])
    }(),
    function() {
        "use strict";

        function moduleapi($http, InitialValues)
        {
            function saveOrder(xmlOrder, prestaOrderNumber, callback)
            {
                angular.isFunction(callback) || (callback = function() {}), xmlOrder && xmlOrder.gkId || callback("Brak wymaganych danych"), prestaOrderNumber || (prestaOrderNumber = null);
                var dataToSend = {
                    gkId: xmlOrder.gkId,
                    hash: xmlOrder.hash,
                    orderId: prestaOrderNumber,
                    crateDate: null,
                    receiver: xmlOrder.receiver.name,
                    content: xmlOrder.packageInfo.content,
                    weight: xmlOrder.packageInfo.weight,
                    carrier: xmlOrder.service.carrierName + " - " + xmlOrder.service.name,
                    comments: "",
                    cod: xmlOrder.additionalInfo.codAmount ? xmlOrder.additionalInfo.codAmount : 0,
                    payment: xmlOrder.additionalInfo.paymentType,
                    states: xmlOrder.additionalInfo.states ? xmlOrder.additionalInfo.states : 0,
                };
                $http({
                    method: "GET",
                    url: baseApiUrl + "&ajax=1&action=addNewGlobOrder",
                    params: {
                        data: JSON.stringify(dataToSend)
                    }
                }).then(function(r) {
                    if (r.data.success) {
                        setTimeout(function() {
                            window.location.replace(urlRedirect+'#nadajGK');
                            console.log('redirect: '+urlRedirect);
                        }, 2000);
                    }

                    console.log('1');
                    console.log(r.data);
                    console.log(callback);
                    return r.data.success ? void callback(null, r.data) : void callback(commonErrorMsg)
                }, function(r) {
                    console.log('2');
                    console.log(callback);
                    callback(commonErrorMsg)
                })
            }

            function logServerResponse(responseData, callback)
            {
                angular.isFunction(callback) || (callback = function() {}), logData(responseData, "logServerResponse", callback)
            }

            function logOrderXml(xmlData, callback)
            {
                angular.isFunction(callback) || (callback = function() {}), logData(xmlData, "logXml", callback)
            }

            function logData(data, logType, callback)
            {
                logType || (logType = "logXml");
                var dataToSend = {};
                "logXml" == logType ? dataToSend.xmlRequest = data : "logServerResponse" == logType && (dataToSend.serverResponse = data), $http({
                    method: "GET",
                    url: baseApiUrl + "&ajax=1&action=" + logType,
                    params: dataToSend
                }).then(function(r) {
                    return r.data.success ? void callback(null, r.data) : void callback(commonErrorMsg)
                }, function(r) {
                    callback(commonErrorMsg)
                })
            }
            var commonErrorMsg = "Wystapil błąd połączenia",
                baseApiUrl = InitialValues.moduleApiUrl,
                service = {
                    logOrderXml: logOrderXml,
                    logServerResponse: logServerResponse,
                    saveOrder: saveOrder
                };
            return service
        }
        angular.module("newParcelApp").factory("ModuleApi", ["$http", "InitialValues", moduleapi])
    }(),
    function() {
        "use strict";

        function OrderDataTranslator(InitialValues)
        {
            function generate(order, collectionTypeSelected)
            {
                $('input[name=pickup_type]').each(function () {
                    if ($(this).is(':checked')) {
                        collectionTypeSelected = $(this).val();
                    }
                });
                console.log('ORDER');
                var data = {
                    shipment: generateShipment(order.service.id, order.packageInfo),
                    senderAddress: generateAddress(order.sender, order.additionalInfo, order.service, 'senderAddress'),
                    receiverAddress: generateAddress(order.receiver, order.additionalInfo, order.service, 'receiverAddress'),
                    content: order.packageInfo.content,
                    paymentId: order.additionalInfo.paymentType,
                    agreements: {},
                    originId: "PRESTASHOP_API",
                    addons: generateAdditionalServices(order.serviceOptions, order.additionalInfo),
                    collectionType: collectionTypeSelected
                };
                return "PICKUP" == collectionTypeSelected ? data.pickup = generatePickup(order.additionalInfo) : "POINT" == collectionTypeSelected && (order.sender.terminal && (data.senderAddress.pointId = order.sender.terminal), order.receiver.terminal && (data.receiverAddress.pointId = order.receiver.terminal)), data.senderAddress.countryId != data.receiverAddress.countryId && (data.declaredValue = order.additionalInfo.declaredValue, data.purpose = order.additionalInfo.purpose), order.additionalInfo.declaredValue && (data.declaredValue = order.additionalInfo.declaredValue), data
            }

            function generatePickup(additionalInfo)
            {
                var s = {
                    date: additionalInfo.sendDate ? additionalInfo.sendDate : InitialValues.todayDate
                };
                return additionalInfo.timeRange && additionalInfo.timeRange.timeFrom && (s.timeFrom = additionalInfo.timeRange.timeFrom), additionalInfo.timeRange && additionalInfo.timeRange.timeTo && (s.timeTo = additionalInfo.timeRange.timeTo), s
            }

            function generateShipment(productId, packageInfo)
            {
                var s = {
                    length: packageInfo.length,
                    width: packageInfo.width,
                    height: packageInfo.height,
                    weight: packageInfo.weight,
                    productId: productId,
                    quantity: packageInfo.count
                };
                return s
            }

            function generateAdditionalServices(serviceOptions, additionalInfo)
            {
                serviceOptions || (serviceOptions = []);
                for (var addons = [], i = serviceOptions.length - 1; i >= 0; i--) {
                    var a = {
                        id: serviceOptions[i].id
                    };
                    "CASH_ON_DELIVERY" == serviceOptions[i].category && (a.value = additionalInfo.codAmount, a.bankAccountNumber = additionalInfo.codAccount.replace(/\s/g, ""), a.name = additionalInfo.codAccountHolder, a.addressLine1 = additionalInfo.codAccountAddr1, a.addressLine2 = additionalInfo.codAccountAddr2), "INSURANCE" == serviceOptions[i].category && (a.value = additionalInfo.insuranceAmount), addons.push(a)
                }
                return addons
            }

            function generateAddress(address, additional, service, type)
            {
                var addr = {
                    name: address.name,
                    city: address.city,
                    street: address.street,
                    houseNumber: address.houseNumber,
                    postCode: address.postalCode,
                    // countryId: address.countryId,
                    countryId: address.country.id,
                    phone: address.phone,
                    email: address.email,
                    contactPerson: address.contactPerson,
                    countryIds: address.countryId
                };

                if (type == 'receiverAddress') {
                    if (service.carrierName == 'Poczta Polska') {
                        if (additional.pocztex48owpReceiverPoint !== null) {
                            if (service.collectionTypes.length == 1 && service.collectionTypes.indexOf('POINT') > -1 && service.name.indexOf(' do Punktu') > -1) {
                                addr.pointId = additional.pocztex48owpReceiverPoint.id;
                            }
                        } else {
                            // addr.pointId = null;
                        }
                    }
                    if (service.carrierName == 'Orlen Polska') {
                        if (additional.paczkaRuchReceiverPoint !== null) {
                            addr.pointId = additional.paczkaRuchReceiverPoint.id;
                        } else {
                            addr.pointId = null;
                        }
                    }
                    if (service.carrierName == 'DHL ParcelShop') {
                        if (additional.dhlparcelReceiverPoint !== null) {
                            addr.pointId = additional.dhlparcelReceiverPoint.id;
                        } else {
                            addr.pointId = null;
                        }
                    }
                    if (service.carrierName == 'DPD') {
                        if (additional.dpdpickupReceiverPoint !== null) {
                            addr.pointId = additional.dpdpickupReceiverPoint.id;
                        } else {
                            // addr.pointId = null;
                        }
                    }
                    if (service.carrierName == 'inPost-Paczkomaty') {
                        if (additional.inPostReceiverPoint !== null) {
                            addr.pointId = additional.inPostReceiverPoint.id;
                        } else {
                            addr.pointId = null;
                        }
                    }
                    if (typeof additional.stateType != 'undefined' && additional.stateType > 0) {
                        addr.stateId = additional.stateType;
                    }
                }

                return address.apartmentNumber && (addr.apartmentNumber = address.apartmentNumber), addr
            }
            var service = {
                generate: generate
            };
            return service
        }
        angular.module("newParcelApp").factory("OrderDataTranslator", ["InitialValues", OrderDataTranslator])
    }(),
    function() {
        "use strict";

        function collectionTypeService()
        {
            // default PICKUP
            var collectionType = "PICKUP";
            function setCollectionType(collectionTypeInput)
            {
                collectionType = collectionTypeInput;
            }

            function getCollectionType()
            {
                return collectionType;
            }

            var service = {
                setCollectionType: setCollectionType,
                getCollectionType: getCollectionType
            };
            return service
        }
        angular.module("newParcelApp").factory("CollectionTypeService", [collectionTypeService])
    }(),
    function() {
        "use strict";

        function globAddress(InitialValues)
        {
            function globAddressController($scope, GlobCountriesManager, Address)
            {
                function submitForm()
                {
                    $("#" + $scope.modalId).modal("hide")
                }

                function loadCountries()
                {
                    $scope.countries = GlobCountriesManager.getAll()
                }
                Address.getNew();
                $scope.modalId = "addresModal" + Math.floor(100 * Math.random() + 1), $scope.countries = [], $scope.loadCountries = loadCountries, $scope.submitForm = submitForm
            }

            function link(scope, element, attrs) {}
            // console.log(InitialValues);
            var htmlTpl = '<p><strong ng-bind="addressTitle"></strong> <a href data-toggle="modal" data-backdrop="static" data-keyboard="false" data-target="#{{ modalId }}" ng-click="loadCountries();">'+InitialValues.lang12+'</a><br/><span ng-bind="ngModel.name"></span><br/><span ng-bind="ngModel.street"></span> <span ng-bind="ngModel.houseNumber"></span> / <span ng-bind="ngModel.apartmentNumber"></span><br/><span ng-bind="ngModel.postalCode"></span> <span ng-bind="ngModel.city"></span><br/><span ng-bind="ngModel.country.country"></span> (<span ng-bind="ngModel.country.isoCode"></span>)<br/><br/><u>'+InitialValues.lang3+'</u><br/><span ng-bind="ngModel.contactPerson"></span><br/><span ng-bind="ngModel.phone"></span><br/><span ng-bind="ngModel.email"></span><div class="modal fade" id="{{ modalId }}" tabindex="-1" role="dialog"><div class="modal-dialog"><form class="modal-content" name="addressForm" ng-submit="submitForm()"><div class="modal-header"><h4 class="modal-title">'+InitialValues.lang4+'</h4></div>' +
                    '<div class="modal-body form-horizontal"><div class="form-group"><label class="col-lg-4 control-label">'+InitialValues.lang5+'</label><div class="col-lg-6"><input type="text" ng-model="ngModel.name" required/></div></div><div class="form-group"><label class="col-lg-4 control-label">'+InitialValues.lang6+'</label><div class="col-lg-6"><input type="text" ng-model="ngModel.street" required/></div></div><div class="form-group"><label class="col-lg-4 control-label">'+InitialValues.lang7+'</label><div class="col-lg-6"><input type="text" ng-model="ngModel.houseNumber" required/></div></div>' +
                    '<div class="form-group"><label class="col-lg-4 control-label">'+InitialValues.lang8+'</label><div class="col-lg-6"><input type="text" ng-model="ngModel.apartmentNumber"/></div></div><div class="form-group"><label class="col-lg-4 control-label">'+InitialValues.lang9+'</label><div class="col-lg-6"><input type="text" ng-model="ngModel.postalCode" required/></div></div><div class="form-group"><label class="col-lg-4 control-label">'+InitialValues.lang10+'</label><div class="col-lg-6"><input type="text" ng-model="ngModel.city" required/></div></div><div class="form-group"><label class="col-lg-4 control-label">'+InitialValues.lang11+'</label><div class="col-lg-6"><select type="text" ng-model="ngModel.country" ng-options="c as (c.isoCode+\': \'+c.name) for c in countries"></select></div></div><div class="form-group"><label class="col-lg-4 control-label">'+InitialValues.lang1+'</label><div class="col-lg-6"><input type="text" ng-model="ngModel.contactPerson" required/></div></div><div class="form-group"><label class="col-lg-4 control-label">'+InitialValues.lang13+'</label><div class="col-lg-6"><input type="text" ng-model="ngModel.phone" required/></div></div><div class="form-group"><label class="col-lg-4 control-label">'+InitialValues.lang14+'</label><div class="col-lg-6"><input type="email" class="form-control" ng-model="ngModel.email" required/></div></div></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">'+InitialValues.lang15+'</button><button type="submit" class="btn btn-primary">'+InitialValues.lang16+'</button></div></form></div></div></p>',
                directive = {
                    restrict: "A",
                    template: htmlTpl,
                    require: "ngModel",
                    scope: {
                        ngModel: "=",
                        addressTitle: "@"
                    },
                    controller: ["$scope", "GlobCountriesManager", "Address", "InitialValues", globAddressController],
                    link: link
                };
            return directive
        }
        angular.module("newParcelApp").directive("globAddress", globAddress)
    }(),
    function() {
        "use strict";

        function addressModel()
        {
            var Address = function() {
                this.name = null, this.street = null, this.houseNumber = null, this.apartmentNumber = "", this.postalCode = null, this.city = null, this.country = null, this.contactPerson = null, this.phone = null, this.email = null, this.terminal = null
            };
            return {
                getNew: function() {
                    return new Address
                }
            }
        }
        angular.module("newParcelApp").factory("Address", [addressModel])
    }(),
    function() {
        "use strict";

        function CountriesManager(GlobApi, InitialValues)
        {
            function setOnFinishLoading(callback)
            {
                return angular.isFunction(callback) || (callback = function() {}), loading ? void(onFinishLoading = callback) : (callback(), service)
            }

            function getCountryByIsoCode(isoCode)
            {
                for (var i = countries.length - 1; i >= 0; i--)
                    if (countries[i].isoCode && countries[i].isoCode == isoCode) return countries[i];
                return null
            }
            var service = {
                    getCountryByIsoCode: getCountryByIsoCode,
                    setOnFinishLoading: setOnFinishLoading,
                    getAll: function() {
                        return countries
                    }
                },
                countries = [],
                onFinishLoading = function() {},
                loading = !1;
            return function() {
                loading = !0, GlobApi.getCountries(function(err, list) {
                    err || (countries = list), loading = !1, onFinishLoading()
                })
            }(), service
        }
        angular.module("newParcelApp").factory("GlobCountriesManager", ["GlobApi", "InitialValues", CountriesManager])
    }(),
    function() {
        "use strict";

        function globServiceOptions(InitialValues, GlobApi, CollectionTypeService)
        {
            function globServiceOptionsController($scope, $http, InitialValues)
            {
                function onCollectionTypeChanged()
                {
                    CollectionTypeService.setCollectionType($scope.pickedCollectionType);
                    if ($scope.pickedCollectionType == 'POINT') {
                        $('div[ng-show="enabledFields.sendDate"]').addClass('ng-hide');
                    } else if ($scope.pickedCollectionType == 'PICKUP') {
                        $('div[ng-show="enabledFields.sendDate"]').removeClass('ng-hide');
                    }

                    let isoCode = $('.receiverAddressBox span[ng-bind="ngModel.country.isoCode"]').text(),
                        isoCodeId = 1;
                    $('.receiverAddressBox .modal .modal-body select[ng-model="ngModel.country"] option').each(function() {
                        let label = $(this).attr('label');
                        if (typeof label !== 'undefined') {
                            if (label.indexOf(isoCode) > -1) {
                                let value = $(this).attr('value').split(':');
                                isoCodeId = value[1];
                            }
                        }
                    });

                    if (isoCode == 'US') {
                        isoCodeId = 30;
                    }

                    // customRequiredFields($scope.serviceModel.id, $scope.pickedCollectionType, InitialValues.receiverCountryIdNew, InitialValues.senderCountryIdNew, $scope.serviceModel.carrierName);
                    customRequiredFields($scope.serviceModel.id, $scope.pickedCollectionType, isoCodeId, InitialValues.senderCountryIdNew, $scope.serviceModel.carrierName);
                }

                function onOptionChanged(option)
                {
                    option.picked ? addOption(option) : removeOption(option), console.log($scope.ngModel)
                }

                function removeOption(option)
                {
                    var i = $scope.ngModel.map(function(v) {
                        return v.id + ""
                    }).indexOf(option.id + "");
                    i != -1 && $scope.ngModel.splice(i, 1)
                }

                function addOption(option)
                {
                    getOptionById(option.id) || $scope.ngModel.push(option)
                }

                function getOptionById(id)
                {
                    for (var i = $scope.ngModel.length - 1; i >= 0; i--)
                        if ($scope.ngModel[i].id && $scope.ngModel[i].id == id) return $scope.ngModel[i];
                    return null
                }

                function loadOptionsForService(service)
                {
                    $scope.collectionTypes = service.collectionTypes, // this for checking number of collectionTypes options (> 1)
                        $scope.isAjax = !0, $scope.options.length = 0, GlobApi.getProductAddons(service.id, service.lastParameters, function(err, addons) {
                        return $scope.isAjax = !1, err ? console.log(err) : void($scope.options = addons)
                    })
                }

                CollectionTypeService.setCollectionType("PICKUP");
                CollectionTypeService.setCollectionType("POINT");
                CollectionTypeService.setCollectionType("PARCEL");
                $scope.isAjax = !1, $scope.ngModel = [], $scope.options = [], $scope.pickedCollectionType = "PICKUP", $scope.collectionTypeChanged = onCollectionTypeChanged, $scope.optionChanged = onOptionChanged, $scope.$watch("serviceModel", function(newValue, oldValue) {
                    return $scope.ngModel.length = 0, $scope.serviceModel && $scope.serviceModel.id ? void loadOptionsForService($scope.serviceModel) : void($scope.options.length = 0)
                })
            }

            function link(scope, element, attrs) {}
            var directive = {
                restrict: "A",
                templateUrl: InitialValues.partialsPath + "globServiceOptions_"+InitialValues.isoCode+".html",
                scope: {
                    ngModel: "=",
                    serviceModel: "="
                },
                controller: ["$scope", "$http", "InitialValues", globServiceOptionsController],
                link: link
            };
            return directive
        }
        angular.module("newParcelApp").directive("globServiceOptions", ["InitialValues", "GlobApi", "CollectionTypeService", globServiceOptions])
    }(),
    function() {
        "use strict";

        function globServices(InitialValues, GlobApi)
        {
            function globServicesController($scope, $timeout, InitialValues, $http)
            {
                function tryToLoadDefaultProduct()
                {
                    getServices(!0, function(err, products)
                    {
                        let service_filters_on = $('#service_filters_on'),
                            filter = false;

                        if (service_filters_on.is(':checked')) {
                            filter = true;
                        } else {
                            $scope.filterServices = [];
                        }

                        if (filter) {
                            for (var i = $scope.products.length - 1; i >= 0; i--) {
                                if ($scope.products[i].id == $scope.initialProductSymbol) {
                                    pickProduct($scope.products[i]);
                                    break
                                }
                            }
                        } else {
                            for (var i = $scope.products.length - 1; i >= 0; i--) {
                                pickProduct($scope.products[i]);
                            }
                        }
                    })
                }

                function pickProduct(p)
                {
                    $scope.pickedProduct = p, $scope.pickedProduct.packageInfo = $scope.packageInfo, $scope.pickedProduct.lastParameters = $scope.lastParameters

                    checkPickedServiceType($scope.pickedProduct, $scope);
                }

                function cancelProduct()
                {
                    $scope.pickedProduct = null
                }

                function getServices(noValidate, callback)
                {
                    if (angular.isFunction(callback) || (callback = function() {}), !(noValidate || $scope.recevicerAddress.postalCode && $scope.recevicerAddress.country)) {
                        return void($scope.error = InitialValues.lang17);
                    }
                    if (!noValidate && !$scope.packageInfo.content) {
                        return void($scope.error = "Pole 'Zawartość' jest obowiązkowe");
                    }
                    var parameters = {
                        length: $scope.packageInfo.length,
                        width: $scope.packageInfo.width,
                        height: $scope.packageInfo.height,
                        weight: $scope.packageInfo.weight,
                        quantity: $scope.packageInfo.count
                    };

                    // $scope.senderAddress.postalCode && (parameters.senderPostCode = $scope.senderAddress.postalCode), $scope.recevicerAddress.postalCode && (parameters.receiverPostCode = $scope.recevicerAddress.postalCode), $scope.recevicerAddress.country && (parameters.receiverCountryId = InitialValues.receiverCountryIdNew), $scope.senderAddress.country && (parameters.senderCountryId = InitialValues.senderCountryIdNew), $scope.isAjax = !0, $scope.error = null, $scope.products.length = 0, $scope.lastParameters = parameters,
                    $scope.senderAddress.postalCode && (parameters.senderPostCode = $scope.senderAddress.postalCode), $scope.recevicerAddress.postalCode && (parameters.receiverPostCode = $scope.recevicerAddress.postalCode), $scope.recevicerAddress.country && (parameters.receiverCountryId = $scope.recevicerAddress.country.id), $scope.senderAddress.country && (parameters.senderCountryId = InitialValues.senderCountryIdNew), $scope.isAjax = !0, $scope.error = null, $scope.products.length = 0, $scope.lastParameters = parameters,
                        GlobApi.getProducts(parameters, function(err, products) {
                            return $scope.isAjax = !1, err ? $scope.error = err :
                                products ? (assignServices(products), callback(null, $scope.products), $scope.products.length ? void 0 :
                                    $scope.error = "Nie znaleziono usług spełniających dane kryteria") : $scope.error = "Wystapił bład podczas pobierania dostępnych usług"
                        });
                }

                function assignServices(services)
                {
                    $scope.terminalType = InitialValues.terminalType;
                    let service_filters_on = $('#service_filters_on');
                    $scope.products.length = 0, angular.forEach(services, function(serviceType, key) {
                        if (angular.isArray(serviceType)) {
                            if ($scope.filterServices.length == 0) {
                                for (var i = serviceType.length - 1; i >= 0; i--) {
                                    var product = serviceType[i];
                                    if (service_filters_on.is(':checked')) {
                                        // isServiceAvailable(product, [], $scope.initialProductSymbol) && $scope.products.push(product)
                                        isServiceAvailable(product, [], 0, $scope) && $scope.products.push(product)
                                    } else {
                                        isServiceAvailable(product, $scope.filterServices, $scope.initialProductSymbol, $scope) && $scope.products.push(product)
                                    }
                                }
                            } else {
                                for (var i = serviceType.length - 1; i >= 0; i--) {
                                    var product = serviceType[i];
                                    if (service_filters_on.is(':checked')) {
                                        isServiceAvailable(product, [], 0, $scope) && $scope.products.push(product)
                                    } else {
                                        isServiceAvailable(product, $scope.filterServices, 0, $scope) && $scope.products.push(product)
                                    }
                                }
                            }
                        }
                    })

                    let collectionType = 'PICKUP';
                    $('#pickup').each(function() {
                        if ($(this).is(':checked')) {
                            collectionType = $(this).val();
                        }
                    });

                    setTimeout(function() {
                        if ($scope.pickedProduct !== null) {
                            customRequiredFields($scope.pickedProduct.id, collectionType, $scope.recevicerAddress.country.id, $scope.senderAddress.country.id, $scope.pickedProduct.carrierName);
                        }
                    }, 1000);


                    $('input[name=pickup_type]').each(function(index, value) {
                        if ($(this).is(':checked')) {
                            if ($(this).val() === 'PICKUP') {
                                $('div[ng-show="enabledFields.sendDate"]').removeClass('ng-hide');
                            } else {
                                $('div[ng-show="enabledFields.sendDate"]').addClass('ng-hide');
                            }
                        }
                    });
                }
                $scope.getServices = getServices, $scope.pickProduct = pickProduct, $scope.cancelProduct = cancelProduct, $scope.isAjax = !1, $scope.packageInfo = InitialValues.defaultPackageInfo, $scope.lastParameters = {}, $scope.error = null, $scope.products = [], $scope.pickedProduct = null, $scope.availableWeights = [{
                    v: 1,
                    name: "1kg"
                }, {
                    v: 2,
                    name: "2kg"
                }, {
                    v: 3,
                    name: "3kg"
                }, {
                    v: 5,
                    name: "5kg"
                }, {
                    v: 10,
                    name: "10kg"
                }, {
                    v: 15,
                    name: "15kg"
                }, {
                    v: 20,
                    name: "20kg"
                }, {
                    v: 25,
                    name: "25kg"
                }, {
                    v: 30,
                    name: "30kg"
                }, {
                    v: 40,
                    name: "40kg"
                }, {
                    v: 50,
                    name: "50kg"
                }, {
                    v: 100,
                    name: "100kg"
                }],
                    function() {
                        $scope.initialProductSymbol && $timeout(tryToLoadDefaultProduct, 1e3)
                    }()
            }

            function isServiceAvailable(product, filters, initialProductSymbol = 0, scope = '')
            {
                if (initialProductSymbol == 0) {
                    if (!filters || !filters.length) {
                        return !0;
                    }
                    if (!product.carrierName || !product.carrierName.length) {
                        return !1;
                    }
                    let label = product.carrierName,
                        service_filters_on = $('#service_filters_on');

                    if (!service_filters_on.is(':checked')) {
                        if (label == 'DHL') {
                            let collType = product.collectionTypes,
                                label2 = 'DHL ParcelShop';
                            if (label == 'DHL' && label.length == 3 && product.package.type == 'PARCEL' && filters.indexOf(label2) != -1 && collType.indexOf('POINT') != -1) {
                                return !0;
                            }
                        } else if (label == 'DPD') {
                            if (label == 'DPD' && label.length == 3 && product.serviceCode == 'PICKUP' && filters.indexOf(label) != -1) {
                                return !0;
                            }
                        } else if (label == 'Poczta Polska') {
                            if (scope.terminalType == 'pocztex48owp' && product.name.indexOf('do Punktu') > -1) {
                                return !0
                            }
                        } else {
                            let collType = product.collectionTypes;
                            if (filters.indexOf(label) != -1 && collType.indexOf('POINT') != -1) {
                                return !0
                            } else {
                                if (filters.indexOf(label) != -1) {
                                    return !0;
                                }
                            }
                        }
                    }
                    return !1
                } else {
                    if (InitialValues.terminalType2 === 'none') {
                        if (typeof InitialValues.receiver != 'null' && InitialValues.receiver.stateId == 0) {
                            // Non USA
                            if (clik_c == 0) {
                                if (product.id == initialProductSymbol) {
                                    return !0;
                                } else {
                                    return  !1;
                                }
                            } else {
                                if (product.carrierName != '') {
                                    return !0;
                                } else {
                                    return !1;
                                }
                            }
                        } else {
                            if (product.carrierName != 'inPost') {
                                return !0;
                            } else {
                                return !1;
                            }
                        }
                    } else {
                        let col = '',
                            tt2 = (InitialValues.terminalType2.toString());

                        if (InitialValues.terminalType2 == 'inpost') {
                            col = "inPost-Paczkomaty";
                        }
                        if (InitialValues.terminalType2 == 'pocztex48owp') {
                            col = "Poczta Polska";
                        }
                        if (InitialValues.terminalType2 == 'pocztex48owp') {
                            col = "Poczta Polska";
                        }
                        if (InitialValues.terminalType2 == 'dpdpickup') {
                            col = "DPD";
                        }
                        if (col == product.carrierName) {
                            return !0;
                        }

                        if (product.id == initialProductSymbol) {
                            return !0;
                        } else {
                            return !1;
                        }
                    }
                }
            }
            function link(scope, element, attrs) {}
            var directive = {
                restrict: "A",
                templateUrl: InitialValues.partialsPath + "globServices_"+InitialValues.isoCode+".html",
                scope: {
                    pickedProduct: "=",
                    recevicerAddress: "=",
                    senderAddress: "=",
                    filterServices: "=",
                    initialProductSymbol: "@"
                },
                controller: ["$scope", "$timeout", "InitialValues", "$http", globServicesController],
                link: link
            };
            return directive
        }
        angular.module("newParcelApp").directive("globServices", ["InitialValues", "GlobApi", globServices])
    }(),
    function() {
        "use strict";

        function xmlGenerator(InitialValues)
        {
            function generate(order)
            {
                var sender = generateAddress(order.sender),
                    receiver = generateAddress(order.receiver),
                    addServices = generateAdditionalServices(order.serviceOptions),
                    xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><globkurier><login>' + InitialValues.login + "</login><password>" + InitialValues.password + "</password><apikey>" + InitialValues.apiKey + "</apikey><order_method>SAVE</order_method><order_source>PS</order_source><orders><order><sent_date>" + (order.additionalInfo.sendDate ? order.additionalInfo.sendDate : InitialValues.todayDate) + "</sent_date><base_service>" + order.serviceSymbol + "</base_service><additional_services>" + addServices + "</additional_services>" + (order.additionalInfo.codAmount ? "<cod_amount>" + order.additionalInfo.codAmount + "</cod_amount>" : "") + (order.additionalInfo.codAccount ? "<cod_account>" + order.additionalInfo.codAccount + "</cod_account>" : "") + (order.additionalInfo.insuranceAmount ? "<insurance_amount>" + order.additionalInfo.insuranceAmount + "</insurance_amount>" : "") + (order.additionalInfo.declaredValue ? "<declared_value>" + order.additionalInfo.declaredValue + "</declared_value>" : "") + "<payment_type>" + order.additionalInfo.paymentType + "</payment_type><content>" + order.packageInfo.content + "</content><length>" + order.packageInfo.length + "</length><width>" + order.packageInfo.width + "</width><height>" + order.packageInfo.height + "</height><weight>" + order.packageInfo.weight + "</weight><number_of_parcels>" + order.packageInfo.count + "</number_of_parcels><comments></comments><sender>" + sender + "</sender><receiver>" + receiver + "</receiver></order></orders></globkurier>";
                return xml
            }

            function generateAdditionalServices(serviceOptions)
            {
                serviceOptions || (serviceOptions = []);
                for (var xml = "", i = serviceOptions.length - 1; i >= 0; i--) xml += "<additional_service>" + serviceOptions[i].symbol + "</additional_service>";
                return xml
            }

            function generateAddress(address)
            {
                if (!address) return "";
                var xml = "<name>" + address.name + "</name><street>" + address.street + "</street><house_number>" + (address.houseNumber ? address.houseNumber : "") + "</house_number><apartment_number>" + (address.apartmentNumber ? address.apartmentNumber : "") + "</apartment_number><postal_code>" + address.postalCode + "</postal_code><city>" + address.city + "</city>" + (address.country ? "<country>" + address.country.isoCode + "</country>" : "") + "<contact_person>" + address.contactPerson + "</contact_person><phone>" + address.phone + "</phone>" + (address.email ? "<email>" + address.email + "</email>" : "") + (address.terminal ? "<terminal>" + address.terminal + "</terminal>" : "") + (address.stateId ? "<stateId>" + address.stateId + "</stateId>" : "");
                return xml
            }
            var service = {
                generate: generate
            };
            return service
        }
        angular.module("newParcelApp").factory("XmlGenerator", ["InitialValues", xmlGenerator])
    }(),
    function() {
        "use strict";

        function xmlOrderModel(InitialValues)
        {
            var service = {
                    getNew: function() {
                        return new Order
                    }
                },
                Order = function() {
                    this.gkId = null, this.serviceSymbol = null, this.sender = null, this.receiver = null, this.packageInfo = null, this.serviceOptions = null, this.additionalInfo = {}
                };
            return service
        }
        angular.module("newParcelApp").factory("XmlOrderModel", ["InitialValues", xmlOrderModel])
    }();


function customRequiredFields(productId, collectionType, r_id, s_id, type = '')
{
    $('.additionalInfo').addClass('loading');
    setTimeout(function() {
        let x = 'none';
        if (type == 'dpdpickup' || type == 'DPD') {
            x = 'dpd';
        }
        if (type == 'inPost-Paczkomaty' || type == 'InPost') {
            x = 'inpost';
        }
        if (type == 'Poczta Polska' || type == 'Poczta') {
            x = 'pocztex48';
        }
        if (type == 'Orlen Paczka' || type == 'Orlen') {
            x = 'orlen';
        }

        $.ajax({
            url: 'https://api.globkurier.pl/v1/order/customRequiredFields',
            data: 'productId='+productId+'&senderCountryId='+s_id+'&receiverCountryId='+r_id+'&collectionType='+collectionType,
            dataType: 'json',
            method: 'get',
            success: function (json) {
                if (json.declaredValue) {
                    $('.form-group.declaredValue').removeClass('ng-hide').show();
                } else {
                    $('.form-group.declaredValue').addClass('ng-hide').hide();
                }
                if (json.pickupDate) {
                    $('.form-group.pickupDate').removeClass('ng-hide').show();
                }  else {
                    $('.form-group.pickupDate').addClass('ng-hide').hide();
                }
                if (json.pickupTimeFrom) {
                    $('.form-group.pickupTimeFrom').removeClass('ng-hide').show();
                } else {
                    $('.form-group.pickupTimeFrom').addClass('ng-hide').hide();
                }
                if (json.pickupTimeTo) { // ??

                } else {

                }
                if (json.purpose) {
                    $('.form-group.purpose').removeClass('ng-hide').show();
                } else {
                    $('.form-group.purpose').addClass('ng-hide').hide();
                }

                if (json.receiverAddressPointId) {
                    $('.form-group.receiverAddressPointId').addClass('ng-hide').hide();
                    $('.form-group.receiverAddressPointId'+x).removeClass('ng-hide').show();
                    $('.form-group.receiverAddressPointId').each(function() {
                        let cls2 = $(this).attr('class');
                        if (cls2.indexOf('receiverAddressPointId'+x) == -1) {
                            $(this).addClass('ng-hide').hide();
                        }
                    });
                } else {
                    $('.form-group.receiverAddressPointId').addClass('ng-hide').hide();
                }

                if (json.senderAddressPointId) {
                    $('.form-group.senderAddressPointId').each(function() {
                        let cls2 = $(this).attr('class');
                        if (cls2.indexOf('senderAddressPointId'+x) == -1) {
                            $(this).addClass('ng-hide').hide();
                        } else {
                            $(this).removeClass('ng-hide').show();
                        }
                    });
                } else {
                    $('.form-group.senderAddressPointId').addClass('ng-hide').hide();
                }

                if (json.receiverStateId) {
                    $('.form-group.receiverStateId').removeClass('ng-hide').show();
                } else {
                    $('.form-group.receiverStateId').addClass('ng-hide').hide();
                }
                if (json.senderAddressPointId) {
                    $('.form-group.senderAddressPointId').removeClass('ng-hide').show();
                } else {
                    $('.form-group.senderAddressPointId').addClass('ng-hide').hide();
                }
                if (json.senderStateId) {
                    $('.form-group.senderStateId').removeClass('ng-hide').show();
                } else {
                    $('.form-group.senderStateId').addClass('ng-hide').hide();
                }

                $('.additionalInfo').removeClass('loading');
            }
        });
    }, 2000);
}

function checkPickedServiceType(delivery, $scope)
{
    let type = delivery.collectionTypes,
        type_selected = 'PICKUP';
    $('.deliverySending').addClass('loading');
    setTimeout(function () {
        if (type.indexOf('POINT') > -1) {
            $('input#point').removeAttr('disabled', 'disabled').closest('.radio').removeClass('disabled');
            if (type.length == 1) {
                $('.deliverySending input#point').click();
                type_selected = 'POINT';
            }
        } else {
            $('.deliverySending input#point').attr('disabled', 'disabled').closest('.radio').addClass('disabled');
        }
        if (type.indexOf('PICKUP') > -1) {
            $('input#pickup').removeAttr('disabled', 'disabled').closest('.radio').removeClass('disabled');
            if (type.length >= 1) {
                $('.deliverySending input#pickup').click();
                type_selected = 'PICKUP';
            }
        } else {
            $('.deliverySending input#pickup').attr('disabled', 'disabled').closest('.radio').addClass('disabled');
        }
        customRequiredFields($scope.pickedProduct.id, type_selected, $scope.recevicerAddress.country.id, $scope.senderAddress.country.id, $scope.pickedProduct.carrierName);

        $('.deliverySending').removeClass('loading');
    }, 3000);
}


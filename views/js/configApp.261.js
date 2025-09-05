/**
 * Globkurier App
 *
 * @author  Wiktor Koźmiński
 * @license mit
 * @extends Rafał Przybylski - tebim.pl
 */
! function() {
    "use strict";

    function mainGlobController($scope, $http) {
        function onRecevicerAddressChange(newValue, oldValue) {
            $("input[name=config_defaultServiceCode]").val($scope.service ? $scope.service.id : ""), $("input[name=config_defaultServiceName]").val($scope.service ? $scope.service.carrierName : "")
        }
        $scope.service = {}, $scope.$watch("service", onRecevicerAddressChange),

            $scope.updateCacheWithPickupPoints = function(incomingUrl) {
                $scope.isAjaxCacheLoad = !0,
                    $http({
                        method: "GET",
                        url: incomingUrl
                    }).then(function(r) {
                        // console.info(r);
                    }, function(r) {
                        console.error(r);
                    })["finally"](function() {
                        $scope.isAjaxCacheLoad = !1;
                    });
            }
    }

    function defaultServiceSelector() {
        function globServicesController($scope, $http) {
            function getServices() {
                var baseApiUrl = "https://api.globkurier.pl/v1/",
                    url = baseApiUrl + "products",
                    parameters = {
                        length: $("input[name=config_defaultDepth]").val(),
                        width: $("input[name=config_defaultWidth]").val(),
                        height: $("input[name=config_defaultHeight]").val(),
                        weight: $("input[name=config_defaultWeight]").val(),
                        quantity: 1,
                        senderCountryId: 1,
                        receiverCountryId: 1
                    };
                let headersAPI = {};
                if (typeof tokenAPI !== 'undefined') {
                    headersAPI = {'x-auth-token' : tokenAPI};
                }
                $scope.isAjax = !0, $scope.error = null, $scope.products.length = 0, $http({
                    method: "GET",
                    params: parameters,
                    url: url,
                    headers: headersAPI
                }).then(function(r) {
                    return r.data.standard && r.data.standard.length ? void($scope.products = r.data.standard) : ($scope.error = lang_error1, r)
                }, function(r) {
                    if (r.data.errors) {
                        for (var first in r.data.errors) break;
                        return $scope.error = r.data.errors[first], r
                    }
                })["finally"](function() {
                    $scope.isAjax = !1
                })
            }
            $scope.modalId = "servicesModal" + Math.floor(100 * Math.random() + 1), $scope.products = [], $scope.isAjax = !1, $scope.error = null,
                function() {
                    $scope.initId && ($scope.ngModel.id = $scope.initId, $scope.ngModel.carrierName = $scope.initName)
                }(), $scope.showModal = function() {
                $("#" + $scope.modalId).modal("show"), getServices()
            }, $scope.clearProduct = function() {
                $scope.ngModel = null
            }, $scope.pickProduct = function(product) {
                $scope.ngModel = product
            }
        }

        function link(scope, element, attrs) {}
        var htmlTpl = '<a ng-show="!ngModel.id" ng-click="showModal();" href>'+lang_choose+'</a><span ng-show="ngModel.id"><span style="font-weight: bold;" ng-bind="ngModel.carrierName"></span> [{{ ngModel.name }}]<br/><a ng-click="showModal();" href> ( '+lang_change+' )</a> <a ng-click="clearProduct();" href> ('+lang_delete+')</a></span><div class="modal fade" id="{{ modalId }}" tabindex="-1" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">'+lang_choose_delivery+'</h4></div><div ng-show="isAjax" class="modal-body row" style="display: flex;flex-wrap: wrap;"><div class="page-loader" style="text-align: center; font-size: 25px!important; color: #ccc;"><i class="icon-cog icon-spin"></i></div></div><p ng-show="error" style="text-align: center;" ng-bind="error"></p><div ng-show="!isAjax" class="modal-body row" style="display: flex;flex-wrap: wrap;"><div class="col-lg-4 glob-product-block" ng-repeat="product in products | orderBy:price_gross"><img ng-if="product.carrierLogoLink" ng-src="{{ product.carrierLogoLink }}" alt="{{ product.carrierName }}" /><br/><strong ng-bind="product.carrierName"></strong><br/><span ng-bind="product.name"></span><br/><br/><strong>{{ product.netPrice }}zł netto</strong><br/><br/><button class="btn btn-sm btn-success" ng-click="pickProduct(product);" data-dismiss="modal">'+lang_choosen+'</button></div></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">'+lang_cancel+'</button></div></div></div></div>',
            directive = {
                restrict: "A",
                template: htmlTpl,
                scope: {
                    ngModel: "=",
                    initId: "@",
                    initName: "@"
                },
                controller: ["$scope", "$http", globServicesController],
                link: link
            };
        return directive
    }
    angular.module("configApp", []), angular.module("configApp").controller("mainController", ["$scope", "$http", mainGlobController]).directive("defaultServiceSelector", [defaultServiceSelector])
}();

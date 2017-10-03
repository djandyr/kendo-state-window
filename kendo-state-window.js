/**
 * Allow Kendo Window to be accessed from states with ui-router
 */

(function () {
    'use strict';

    angular.module("kendo.stateWindow", ["ui.router"])

    /**
     * stateWindowConfigProvider
     *
     * Allow state window default configuration options to be changed globally.
     */
        .provider("stateWindowConfig", function () {
            this.options = {
                modal: true
            };

            this.$get = function () {
                var options = this.options;
                return {
                    getOptions: function () {
                        return options;
                    }
                }
            };

            this.setOptions = function (options) {
                this.options = options;
            };
        })

        /**
         * stateProvider
         *
         * Evaluate window parameter on state definition and generate
         * template to include state-window directive ie:
         *
         * .state('window1', {
         *  window: {
         *   name: 'window1',
         *   options: {
         *    title: 'Example Window'
         *   }
         *  }
         * }
         *
         * Window name is required, and used to reference the kendo window.
         * @see http://docs.telerik.com/kendo-ui/AngularJS/introduction#widget-references
         *
         * Window options can be provided, as documented in Kendo Window configuration
         * @see http://docs.telerik.com/kendo-ui/api/javascript/ui/window#configuration
         */
        .config(["$stateProvider", function ($stateProvider) {
            var stateProviderState = $stateProvider.state;
            $stateProvider["state"] = state;

            function state(name, config) {
                var stateName, windowName, closeState, options = {};

                if (angular.isObject(name)) {
                    options = name;
                    stateName = options.name;
                } else {
                    options = config;
                    stateName = name;
                }

                if (options.data && options.data.window) {
                    options.window = options.data.window;
                }

                //options.cache = false;

                if (options.window) {

                    if (!options.window.name) {
                        options.window.name = stateName.replace(".", "_");
                    }

                    if (angular.isDefined(options.template)) {
                        throw new Error('Template content is not supported.')
                    }

                    options.template = '<div state-window="' + options.window.name + '"';

                    if (options.window.closeState) {
                        closeState = options.window.closeState;
                        options.template += ' close-state="' + closeState + '"';
                    }

                    if (options.templateUrl) {
                        options.template += ' template-url="' + options.templateUrl + '"';
                    }

                    if (options.window.append) {
                        options.template += ' append="' + options.window.append + '"';
                    }

                    if (options.window.options) {
                        options.template += " options='" + JSON.stringify(options.window.options) + "'";
                    }

                    options.template += '></div>';
                }

                return stateProviderState.call($stateProvider, stateName, options);
            }
        }])

        /**
         * stateWindow
         *
         * Directive to configure and open Kendo Window widget
         */
        .directive('stateWindow', ['$state', 'stateWindowConfig', '$timeout', '$compile', '$window', 'stateWindowMap', function ($state, stateWindowConfig, $timeout, $compile, $window, stateWindowMap) {

            var openWindow = function (window, url) {

                // Preload window content using refresh
                if (angular.isDefined(url)) {
                    window.content("Loading...");
                    window.refresh(url);
                }

                if (angular.isDefined(window.options.center)) {
                    if (angular.isObject(window.options.center)) {
                        centerAlignment(window, window.options.center);
                        return window.open();
                    }

                    if (window.options.center === false) {
                        return window.open();
                    }
                }

                window.center();
                window.open();
            }

            /**
             * Center Alignment
             *
             * Allow fixed position adjustments to top and left while centering window
             *
             * @param window
             * @returns {*}
             */
            var centerAlignment = function (window) {
                var position = window.options.position, wrapper = window.wrapper,
                    documentWindow = angular.element($window), scrollTop = 0, scrollLeft = 0, newTop, newLeft;
                if (window.options.isMaximized) {
                    return window;
                }
                if (!window.options.pinned) {
                    scrollTop = documentWindow.scrollTop();
                    scrollLeft = documentWindow.scrollLeft();
                }

                var alignment = alignment || {};

                newLeft = (scrollLeft + Math.max(0, (documentWindow.width() - wrapper.width()) / 2));
                newTop = scrollTop + Math.max(0, (documentWindow.height() - wrapper.height() - parseInt(wrapper.css("paddingTop"), 10)) / 2);

                if (window.options.center.top) {
                    newTop = scrollTop + window.options.center.top;
                }

                if (window.options.center.left) {
                    newLeft = scrollLeft + window.options.center.left;
                }

                wrapper.css({
                    left: newLeft,
                    top: newTop
                });
                position.top = newTop;
                position.left = newLeft;
                return window;
            }

            return {
                restrict: 'AE',
                template: '<div id="{{windowName}}" kendo-window="{{windowName}}"  k-options="stateWindowOptions" k-visible="false"><ui-view /></div>',
                replace: false,
                controller: function ($scope, $element, $attrs) {
                    var windowName = $attrs.stateWindow,
                        options = {};

                    $scope.windowName = windowName;

                    if ($attrs.options) {
                        options = JSON.parse($attrs.options);
                    }

                    $timeout(function () {

                        var window = $scope[windowName];

                        if (angular.isUndefined(window)) {
                            throw new Error('Cannot find reference to window ' + windowName);
                        }

                        window.bind("close", function (e) {
                            stateWindowMap.remove(windowName);
                        });

                        if (window && (false === stateWindowMap.has(windowName))) {
                            stateWindowMap.add(windowName, window);
                            openWindow(window, $attrs.templateUrl);
                            console.debug('Opened Window:' + windowName);
                        } else {
                            console.debug('Could not open window', windowName);
                        }
                    });


                    if ($attrs.append && options.appendTo) {
                        var appendTo = options.appendTo.replace("#", "");
                        $element.append(angular.element('<div id="' + appendTo + '"></div>'));
                    }

                    $scope.stateWindowOptions = angular.extend(angular.copy(stateWindowConfig.getOptions()), options);

                    if ($attrs.closeState) {
                        $scope.stateWindowOptions.close = function () {
                            $timeout(function () {
                                $scope[windowName].close();
                                $state.go($attrs.closeState);
                            });
                        }
                    }
                }
            }
        }])

        /**
         * Map open state windows by name, and kendo window instance
         */
        .factory('stateWindowMap', ['$q', '$rootScope', function ($q, $rootScope) {
            var map = [];

            var factory = {};

            factory.add = function (key, value) {
                if (false === factory.has(key)) {
                    map.push({
                        key: key,
                        value: value
                    });
                    $rootScope.$broadcast(key+'_created');
                }
            };

            factory.get = function (key) {
                for (var i = 0; i < map.length; i++) {
                    if (key === map[i].key) {
                        return map[i];
                    }
                }
            };

            factory.getWindow = function(key){
                var deferred = $q.defer();
                var deregister = $rootScope.$on(key+'_created', function(){
                    var found = false;
                    for (var i = 0; i < map.length; i++) {
                        if (key === map[i].key) {
                            found = true;
                            deferred.resolve(map[i].value);
                        }
                    }
                    if(!found){
                        deferred.reject();
                    }
                    deregister();
                })
                return deferred.promise;
            }

            factory.has = function (key) {
                if (angular.isDefined(factory.get(key))) {
                    return true;
                }
                return false;
            };

            factory.keys = function () {
                var keys = [];
                for (var i = 0; i < map.length; i++) {
                    keys.push(map[i].key);
                }
                return keys;
            };

            factory.remove = function (key) {
                for (var i = 0; i < map.length; i++) {
                    if (key === map[i].key) {
                        return map.splice(i, 1);
                    }
                }
            };

            factory.length = function () {
                return map.length;
            };

            return factory;
        }]);
})();
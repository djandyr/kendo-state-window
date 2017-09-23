# kendo-state-window
AngularJS module that allows kendo-window states when using ui-router

Demo
--------------------

https://plnkr.co/edit/xVtfAHXOjd7luwIbV98s?p=preview


Installing the Module
---------------------
Installation can be done through bower or npm:

``` shell
bower install kendo-state-window
```

In your page add:
```html
  <script src="bower_components/kendo-state-window/kendo-state-window.js"></script>
```

Loading the Module
------------------

This module declares itself as `kendo.stateWindow`

```javascript
var app = angular.module('myApp', ['ui.router', 'kendo.directives', 'kendo.stateWindow']);
```

Window states
-----------------------

Adding `window` parameter to a state definition causes its template to be generated with a `state-window` directive which will open kendo-window once rendered.

```javascript
$stateProvider
    .state('home', {
       url: '/home',
       templateUrl: 'home.html'
     })
     .state('home.window', {
        parent: 'home',          
        url: '/window1',
        templateUrl: 'window1.html',
        window: {
            name: 'window1',
            options: {
              title: 'Window 1'
            }
          }
      })
      .state('home.window2', {
         parent: 'home.window',
         templateUrl: 'window2.html',
         controller: 'Window2Controller',
         url: '/window2',
         window: {
            name: 'window2'
         }
      })
```

Window name is optional, if not provided the state name is used (dots inflected to underscores). This allows [reference](http://docs.telerik.com/kendo-ui/AngularJS/introduction#widget-references) to the kendo window widget in controller scope.

Kendo window [configuration options](http://docs.telerik.com/kendo-ui/api/javascript/ui/window#configuration) can be provided on state definition, as documented in Kendo Window configuration

FAQ
-------

**How to dynamically change the window title**

Your state definition must be assigned a controller, where kendo-window can be [referenced](http://docs.telerik.com/kendo-ui/AngularJS/introduction#widget-references) by window name once available in scope (unfortunate use of timeout). The kendo-window method [setOptions](http://docs.telerik.com/kendo-ui/api/javascript/ui/window#methods-setOptions) can be used to configure a new window title.

```javascript
app.controller('Window2Controller', function($scope, $timeout) {
  $timeout(function() {
    $scope.window.setOptions({
      title: 'Window 2'
    });
  });
});
```
**How to change the window default configuration options**

The `state-window` directive is assigned a default set of configuration options by `stateWindowConfigProvider`. You can change these options globally for all kendo windows opened from state definitions, as below:

```javascript
app.config(['stateWindowConfigProvider', function (stateWindowConfigProvider) {
   stateWindowConfigProvider.setOptions({
     autoFocus: false,
     resizable: false,
     draggable: false,
     scrollable: true,
     pinned: true,
     modal: true,
     width: '80%',
     actions: ["Maximize", "Close"],
     height: '80%'
    });
}]);
```

**How to customize window centering**

Window centering is automatically enabled, however it can can disabled by specifying a custom ``center`` option on state definition or by `stateWindowConfigProvider`.

```javascript
window: {
    name: 'window1',
    options: {
      title: 'Window 1'
      center: false
    }
}
```

Additionally the window center inital top or left position can be adjusted, by specifying a object containing top and left as numeric values which are treated as pixels. String values can specify pixels, percentages, ems or other valid values.

```javascript
window: {
    name: 'window1',
    options: {
      title: 'Window 1'
      center: {
          top: 50,
          left: 200
      }
    }
}
```

**Which state to use when closing window**

The close state can be specified by ``closeState`` on state definition, this will ensure the correct state and URL is loaded when closing the window.

```javascript
window: {
    name: 'window1',
    closeState: 'home'
    options: {
      title: 'Window 1'
      center: {
          top: 50,
          left: 200
      }
    }
}
```

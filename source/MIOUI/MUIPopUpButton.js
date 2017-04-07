/**
 * Created by godshadow on 12/3/16.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/// <reference path="MUIButton.ts" />
/// <reference path="MUIWebApplication.ts" />
/// <reference path="MUIMenu.ts" />
var MUIPopUpButton = (function (_super) {
    __extends(MUIPopUpButton, _super);
    function MUIPopUpButton() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._menu = null;
        _this._isVisible = false;
        return _this;
    }
    MUIPopUpButton.prototype.initWithLayer = function (layer, options) {
        _super.prototype.initWithLayer.call(this, layer, options);
        // Check if we have a menu
        /*if (this.layer.childNodes.length > 0)
         {
         // Get the first div element. We don't support more than one element
         var index = 0;
         var menuLayer = this.layer.childNodes[index];
         while(menuLayer.tagName != "DIV")
         {
         index++;
         if (index >= this.layer.childNodes.length) {
         menuLayer = null;
         break;
         }

         menuLayer = this.layer.childNodes[index];
         }

         if (menuLayer != null) {
         var layerID = menuLayer.getAttribute("id");
         this._menu = new MIOMenu(layerID);
         this._menu.initWithLayer(menuLayer);

         var x = 10;
         var y = this.getHeight();
         this._menu.setX(x);
         this._menu.setY(y);

         this._linkViewToSubview(this._menu);
         }*/
        // Set action
        this.setAction(this, function () {
            if (this._menu == null)
                return;
            if (this._menu.isVisible == false) {
                this._menu.showFromControl(this);
            }
            else {
                this._menu.hide();
            }
        });
    };
    MUIPopUpButton.prototype.setMenuAction = function (target, action) {
        if (this._menu != null) {
            this._menu.target = target;
            this._menu.action = action;
        }
    };
    MUIPopUpButton.prototype.addMenuItemWithTitle = function (title) {
        if (this._menu == null) {
            this._menu = new MUIMenu();
            this._menu.init();
        }
        this._menu.addMenuItem(MUIMenuItem.itemWithTitle(title));
    };
    return MUIPopUpButton;
}(MUIButton));

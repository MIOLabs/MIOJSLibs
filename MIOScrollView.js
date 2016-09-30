/**
 * Created by godshadow on 01/09/16.
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="MIOView.ts" />
var MIOScrollView = (function (_super) {
    __extends(MIOScrollView, _super);
    function MIOScrollView() {
        _super.apply(this, arguments);
        this.pagingEnabled = false;
        this.delegate = null;
        this._lastOffsetX = 0;
    }
    MIOScrollView.prototype.initWithLayer = function (layer, options) {
        _super.prototype.initWithLayer.call(this, layer, options);
        this._setupLayer();
    };
    MIOScrollView.prototype._setupLayer = function () {
        var instance = this;
        this.layer.onscroll = function () {
            instance._layerDidScroll.call(instance);
        };
        this.layer.onwheel = function () {
            instance._layerDidMouseUp.call(instance);
        };
    };
    MIOScrollView.prototype._layerDidMouseUp = function () {
        // if (this.pagingEnabled)
        // {
        //     var width = this.getWidth();
        //     var offset = this.layer.scrollLeft;
        //     if (this._lastOffsetX < offset)
        //     {
        //         // to the right
        //         if (offset >= width)
        //         {
        //             this.layer.classList.add("scroll_left_animation");
        //             this.layer.style.transform = "translate(" + width + "px)";
        //         }
        //     }
        //     else
        //     {
        //         // to the left
        //     }
        // }
    };
    MIOScrollView.prototype._layerDidScroll = function () {
        if (this.delegate != null && typeof this.delegate.scrollViewDidScroll === "function")
            this.delegate.scrollViewDidScroll.call(this.delegate, this);
    };
    return MIOScrollView;
}(MIOView));
//# sourceMappingURL=MIOScrollView.js.map
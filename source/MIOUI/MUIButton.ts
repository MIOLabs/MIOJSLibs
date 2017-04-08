/**
 * Created by godshadow on 12/3/16.
 */

/// <reference path="MUIControl.ts" />

enum MUIButtonType
{
    MomentaryPushIn,
    PushOnPushOff,
    PushIn
}

class MUIButton extends MUIControl
{
    private _statusStyle = null;

    private _titleStatusStyle = null;
    private _titleLayer = null;

    private _imageStatusStyle = null;
    private _imageLayer = null;

    target = null;
    action = null;

    private _selected = false;
    type = MUIButtonType.MomentaryPushIn;

    initWithLayer(layer, options?)
    {
        super.initWithLayer(layer, options);

        var type = this.layer.getAttribute("data-type");
        if (type == "MomentaryPushIn")
            this.type = MUIButtonType.MomentaryPushIn;
        else if (type == "PushOnPushOff")
            this.type = MUIButtonType.PushOnPushOff;

        this._statusStyle = this.layer.getAttribute("data-status-style-prefix");
        if (this._statusStyle == null && options != null)
            this._statusStyle = options["status-style-prefix"] + "_status";

        // Check for title layer
        this._titleLayer = MUILayerGetFirstElementWithTag(this.layer, "SPAN");
        if (this._titleLayer == null) {
            this._titleLayer = document.createElement("span");
            this.layer.appendChild(this._titleLayer);
        }

        if (this._titleLayer != null) {
            this._titleStatusStyle = this._titleLayer.getAttribute("data-status-style");
            if (this._titleStatusStyle == null && options != null)
                this._titleStatusStyle = options["status-style-prefix"] + "_title_status";
        }

         var key = this.layer.getAttribute("data-title");
         if (key != null)
             this.setTitle(MIOLocalizeString(key, key));

        // Check for img layer
        this._imageLayer = MUILayerGetFirstElementWithTag(this.layer, "DIV");

        if (this._imageLayer != null) {
            this._imageStatusStyle = this._imageLayer.getAttribute("data-status-style");
            if (this._imageStatusStyle == null && options != null)
                this._imageStatusStyle = options["status-style-prefix"] + "_image_status";
        }

        // Check for status
        var status = this.layer.getAttribute("data-status");
        if (status == "selected")
            this.setSelected(true);

        // Prevent click
        this.layer.addEventListener("click", function(e) {

            e.stopPropagation();
        });

        var instance = this;
        this.layer.addEventListener("mousedown", function(e) {

            e.stopPropagation();
            if (instance.enabled) {
                if (instance.type == MUIButtonType.PushOnPushOff)
                    instance.setSelected(!instance._selected);
                else
                    instance.setSelected(true);
            }
        });

        this.layer.addEventListener("mouseup", function(e) {

            e.stopPropagation();
            if (instance.enabled) {
                if (instance.type == MUIButtonType.MomentaryPushIn)
                    instance.setSelected(false);

                if (instance.action != null && instance.target != null)
                    instance.action.call(instance.target, instance);
            }
        });
    }

    initWithAction(target, action)
    {
        super.init();

        this.setAction(target, action);
    }

    setAction(target, action)
    {
        this.target = target;
        this.action = action;
    }

    setTitle(title)
    {
        this._titleLayer.innerHTML = title;
    }

    set title(title)
    {
        this.setTitle(title);
    }

    get title()
    {
        return this._titleLayer.innerHTML;
    }

    get selected()
    {
        return this._selected;
    }
    
    setSelected(value)
    {
        if (this._selected == value)
            return;

        if (value == true) {
            if (this._statusStyle != null)
            {
                this.layer.classList.remove(this._statusStyle + "_off");
                this.layer.classList.add(this._statusStyle + "_on");
            }

            if (this._imageLayer != null && this._imageStatusStyle != null)
            {
                this._imageLayer.classList.remove(this._imageStatusStyle + "_off");
                this._imageLayer.classList.add(this._imageStatusStyle + "_on");
            }

            if (this._titleLayer != null && this._titleStatusStyle != null)
            {
                this._titleLayer.classList.remove(this._titleStatusStyle + "_off");
                this._titleLayer.classList.add(this._titleStatusStyle + "_on");
            }

            if (this._statusStyle == null && this._titleStatusStyle == null && this._imageStatusStyle == null)
                this.setAlpha(0.35);
        }
        else
        {
            if (this._statusStyle != null)
            {
                this.layer.classList.remove(this._statusStyle + "_on");
                this.layer.classList.add(this._statusStyle + "_off");
            }

            if (this._imageLayer != null && this._imageStatusStyle != null)
            {
                this._imageLayer.classList.remove(this._imageStatusStyle + "_on");
                this._imageLayer.classList.add(this._imageStatusStyle + "_off");
            }

            if (this._titleLayer != null && this._titleStatusStyle != null)
            {
                this._titleLayer.classList.remove(this._titleStatusStyle + "_on");
                this._titleLayer.classList.add(this._titleStatusStyle + "_off");
            }

            if (this._statusStyle == null && this._titleStatusStyle == null && this._imageStatusStyle == null)
                this.setAlpha(1);
        }

        this._selected = value;
    }
}



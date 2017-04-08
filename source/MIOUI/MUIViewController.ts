/**
 * Created by godshadow on 11/3/16.
 */

/// <reference path="../MIOFoundation/MIOFoundation.ts" />

/// <reference path="MIOUI_Core.ts" />
/// <reference path="MIOUI_CoreLayer.ts" />
/// <reference path="MUIViewController_PresentationController.ts" />
/// <reference path="MUIViewController_PopoverPresentationController.ts" />

/// <reference path="MUIWindow.ts" />
//declare var MIOHTMLParser;

class MUIViewController extends MIOObject
{
    layerID:string = null;    

    view:MUIView = null;

    private _htmlResourcePath = null;

    private _onViewLoadedTarget = null;
    private _onViewLoadedAction = null;

    private _onLoadLayerTarget = null;
    private _onLoadLayerAction = null;

    private _viewIsLoaded = false;
    private _layerIsReady = false;

    private _childViewControllers = [];
    parentViewController = null;

    presentingViewController = null;
    presentedViewController = null;
    navigationController:MUINavigationController = null;
    splitViewController = null;
    tabBarController = null;

    private _presentationController:MUIPresentationController = null;
    private _popoverPresentationController:MUIPopoverPresentationController = null;

    modalPresentationStyle = MUIModalPresentationStyle.CurrentContext;
    modalTransitionStyle = MUIModalTransitionStyle.CoverVertical;
    transitioningDelegate = null;

    protected _contentSize = new MIOSize(320, 200);
    protected _preferredContentSize = null;

    constructor(layerID?)
    {
        super();
        this.layerID = layerID ? layerID : MUICoreLayerIDFromObject(this);
    }

    init()
    {
        super.init();

        this.view = new MUIView(this.layerID);
        this.view.init();
        this._layerIsReady = true;
    }

    initWithLayer(layer, options?)
    {
        super.init();

        this.view = new MUIView(this.layerID);
        this.view.initWithLayer(layer, options);
        this._layerIsReady = true;
    }

    initWithView(view)
    {
        super.init();

        this.view = view;
        this._layerIsReady = true;
    }

    initWithResource(path)
    {
        if (path == null) throw ("MIOViewController:initWithResource can't be null");

        super.init();        

        this._htmlResourcePath = path;
        this.loadView();
    }

    localizeSubLayers(layers)
    {
        if (layers.length == 0)
            return;

        for (var index = 0; index < layers.length; index++)
        {
            var layer = layers[index];

            if (layer.tagName != "DIV") continue;

            var key = layer.getAttribute("data-localize-key");
            if (key != null)
                layer.innerHTML = MIOLocalizeString(key, key);

            this.localizeSubLayers(layer.childNodes);
        }
    }

    localizeLayerIDWithKey(layerID, key)
    {
        var layer = MUILayerSearchElementByID(this.view.layer, layerID);
        layer.innerHTML = MIOLocalizeString(key, key);
    }

    loadView()
    {
        this.view = new MUIView(this.layerID);
        //this.view.init();

        var mainBundle = MIOBundle.mainBundle();
        mainBundle.loadHTMLNamed(this._htmlResourcePath, this.layerID, this, function (layerData) {

            //var result = MIOHTMLParser(data, this.layerID);
            // var result = data;
            // var cssFiles = result.styles;
            // var baseURL = url.substring(0, url.lastIndexOf('/')) + "/";
            // for (var index = 0; index < cssFiles.length; index++) {

            //     var cssurl  = baseURL + cssFiles[index];
            //     console.log("Adding CSS: " + cssurl);
            //     MIOCoreLoadStyle(cssurl);
            // }

            var domParser = new DOMParser();
            var items = domParser.parseFromString(layerData, "text/html");
            var layer = items.getElementById(this.layerID);

            this.localizeSubLayers(layer.childNodes);

            //this.view.addSubLayer(layer);
            this.view.initWithLayer(layer);
            this.view.awakeFromHTML();
            this._didLayerDownloaded();
        });        
    }

    _didLayerDownloaded()
    {
        this._layerIsReady = true;

        if (this._onLoadLayerTarget != null && this._onViewLoadedAction != null)
        {
            this._onLoadLayerAction.call(this._onLoadLayerTarget);
            this._onLoadLayerTarget = null;
            this._onLoadLayerAction = null;
        }

        if (this._onViewLoadedAction != null && this._onViewLoadedTarget != null)
        {
            //this.loadView();
            this.viewDidLoad();
            this._loadChildControllers();
        }
    }

    protected _loadChildControllers()
    {
        var count = this._childViewControllers.length;

        if (count > 0)
            this._loadChildViewController(0, count);
        else
            this._setViewLoaded(true);
    }

    protected _loadChildViewController(index, max)
    {
        if (index < max) {
            var vc = this._childViewControllers[index];
            vc.onLoadView(this, function () {

                var newIndex = index + 1;
                this._loadChildViewController(newIndex, max);
            });
        }
        else
        {
            this._setViewLoaded(true);
        }
    }

    protected _setViewLoaded(value)
    {
        this.willChangeValue("viewLoaded");
        this._viewIsLoaded = value;
        this.didChangeValue("viewLoaded");

        if (value == true && this._onViewLoadedAction != null) {
            this._onViewLoadedAction.call(this._onViewLoadedTarget);
        }

        this._onViewLoadedTarget = null;
        this._onViewLoadedAction = null;
    }

    onLoadView(target, action)
    {
        this._onViewLoadedTarget = target;
        this._onViewLoadedAction = action;

        if (this._viewIsLoaded == true) {
            action.call(target);
        }
        else if (this._layerIsReady == true)
        {
            //this.loadView();
            this.viewDidLoad();
            this._loadChildControllers();
        }
    }

    onLoadLayer(target, action)
    {
        if (this._layerIsReady == true)
        {
            action.call(target);
        }
        else
        {
            this._onLoadLayerTarget = action;
            this._onLoadLayerAction= target;
        }
    }

    get viewIsLoaded()
    {
        return this._viewIsLoaded;
    }

    get childViewControllers()
    {
        return this._childViewControllers;
    }

    addChildViewController(vc)
    {
        vc.parentViewController = this;
        this._childViewControllers.push(vc);
        //vc.willMoveToParentViewController(this);
    }

    removeChildViewController(vc)
    {
        var index = this._childViewControllers.indexOf(vc);
        if (index != -1) {
            this._childViewControllers.splice(index, 1);
            vc.parentViewController = null;
        }
    }

    // removeFromParentViewController()
    // {
    //     this.parent.removeChildViewController(this);
    //     this.parent = null;
    //     this.view.removeFromSuperview();
    //     //this.didMoveToParentViewController(null);
    // }

    get isPresented()
    {
        if (this._presentationController != null)
            return this._presentationController.isPresented;
    }

    get presentationController()
    {
        if (this._presentationController == null && this.parentViewController != null)
            return this.parentViewController.presentationController;

        return this._presentationController;
    }   

    get popoverPresentationController()
    {
        if (this._popoverPresentationController == null)
        {
            this._popoverPresentationController = new MUIPopoverPresentationController();
            this._popoverPresentationController.init();
            this._popoverPresentationController.presentedViewController = this;
        }
        
        this._presentationController = this._popoverPresentationController;

        return this._popoverPresentationController;
    }

    showViewController(vc, animate)
    {
        vc.onLoadView(this, function () {

            this.view.addSubview(vc.view);
            this.addChildViewController(vc);

            _MIUShowViewController(this, vc, this, false);
        });
    }

    presentViewController(vc:MUIViewController, animate:boolean)
    {           
        var pc:MUIPresentationController = vc.presentationController;
        if (pc == null) {
            pc = new MUIPresentationController();
            pc.init();
            pc.presentedViewController = vc;
            pc.presentingViewController = this;
            vc._presentationController = pc;
        }
        else if (pc.isPresented == true)
        {
            // You try to presented a presetnation controller that is already presented
            return;
        }

        if (vc.modalPresentationStyle != MUIModalPresentationStyle.FullScreen 
            && vc.modalPresentationStyle != MUIModalPresentationStyle.FormSheet
            && vc.modalPresentationStyle != MUIModalPresentationStyle.PageSheet)            
            vc.modalPresentationStyle = MUIModalPresentationStyle.PageSheet;

        vc.onLoadView(this, function () {

            if (vc.modalPresentationStyle == MUIModalPresentationStyle.CurrentContext)
            {
                this.view.addSubview(vc.presentationController.presentedView);
                this.addChildViewController(vc);
            }
            else
            {
                // It's a window instead of a view
                var w:MUIWindow = pc.window;
                if (w == null)
                {
                    w = new MUIWindow();
                    w.init();
                    w.layer.style.background = "";
                    w.rootViewController = vc;
                    w.addSubview(pc.presentedView);
                    pc.window = w;
                }
                w.setHidden(false);
            }

            _MIUShowViewController(this, vc, null, this, function () {

                w.makeKey();
            });
        });
    }

    dismissViewController(animate)
    {
        var pc = this.presentationController;
        var toVC = pc.presentingViewController;
        var fromVC = pc.presentedViewController;
        var fromView = pc.presentedView;

        _MUIHideViewController(fromVC, toVC, null, this, function () {

            if (fromVC.modalPresentationStyle == MUIModalPresentationStyle.CurrentContext)
            {
                toVC.removeChildViewController(fromVC);
                var pc = fromVC.presentationController;
                var view = pc.presentedView;
                view.removeFromSuperview();
            }
            else
            {
                // It's a window instead of a view
                var pc = fromVC.presentationController;
                var w:MUIWindow = pc.window;
                w.setHidden(true);
            }

        });
    }

    transitionFromViewControllerToViewController(fromVC, toVC, duration, animationType, target?, completion?)
    {
        //TODO
    }

    viewDidLoad(){}

    viewWillAppear(animate?)
    {
        for (var index = 0; index < this._childViewControllers.length; index++)
        {
            var vc = this._childViewControllers[index];
            vc.viewWillAppear(animate);
        }
    }

    viewDidAppear(animate?)
    {
        for (var index = 0; index < this._childViewControllers.length; index++)
        {
            var vc = this._childViewControllers[index];
            vc.viewDidAppear(animate);
        }
    }

    viewWillDisappear(animate?)
    {
        for (var index = 0; index < this._childViewControllers.length; index++)
        {
            var vc = this._childViewControllers[index];
            vc.viewWillDisappear();
        }
    }

    viewDidDisappear(animate?)
    {
        for (var index = 0; index < this._childViewControllers.length; index++)
        {
            var vc = this._childViewControllers[index];
            vc.viewDidDisappear();
        }
    }

    contentHeight()
    {
        return this.view.getHeight();
    }

    setContentSize(size)
    {
        this.willChangeValue("contentSize");
        this._contentSize = size;
        this.didChangeValue("contentSize");
    }

    public set contentSize(size)
    {
        this.setContentSize(size);
    }

    public get contentSize()
    {
        return this._contentSize;
    }

    public set preferredContentSize(size)
    {
        this.willChangeValue("preferredContentSize");
        this._preferredContentSize = size;
        this.didChangeValue("preferredContentSize");
    }

    public get preferredContentSize()
    {
        return this._preferredContentSize;
    }

}

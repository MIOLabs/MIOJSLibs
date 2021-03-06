import { MUIViewController } from "./MUIViewController";
import { MIOObject } from "../MIOFoundation";
import { _MUIHideViewController, _MIUShowViewController } from "./MIOUI_Core";
import { MUIClassListForAnimationType, MUIAnimationType } from "./MIOUI_CoreAnimation";
import { MUIView } from "./MUIView";
import { MUIModalPresentationStyle } from "./MUIViewController_PresentationController";
import { MUICoreLayerAddStyle, MUICoreLayerRemoveStyle } from "./MIOUI_CoreLayer";

/**
 * Created by godshadow on 9/4/16.
 */

export class MUINavigationController extends MUIViewController
{
    rootViewController = null;
    viewControllersStack = [];
    currentViewControllerIndex = -1;

    init(){
        super.init();
        // this.view.layer.style.overflow = "hidden";        
        MUICoreLayerAddStyle( this.view.layer, "ui-navigation-controller" ) ;
    }

    initWithRootViewController(vc:MUIViewController){
        this.init();
        this.setRootViewController(vc);
    }

    setRootViewController(vc:MUIViewController){
        //this.transitioningDelegate = this;
        
        this.rootViewController = vc;
        this.view.addSubview(vc.view);

        this.viewControllersStack.push(vc);
        this.currentViewControllerIndex = 0;

        this.rootViewController.navigationController = this;

        this.addChildViewController(vc);
        // if (this.presentationController != null) {
        //     var size = vc.preferredContentSize;
        //     this.contentSize = size;
        // }
    }


    updateHeight = ( howMany:number = 1 ) => {
        // if (this.view.layer && this.viewControllersStack.length>0){
        //     const heights = [ ] ;

        //     for ( let i = howMany ; i -- > 0 ; ) {
        //         const lastController = this.viewControllersStack[ this.viewControllersStack.length - i - 1 ]
        //             , layer = lastController.view.layer ;

        //         if (layer){ 
        //             const children = layer.children ;
        //             let height = 0 ;

        //             for ( let i = children.length ; i -- > 0 ; )
        //                 height += children[ i ].offsetHeight ;

        //             heights.push( height ) ;
        //         }
        //     }

        //     this.view.layer.style.height = Math.max( ...heights ) + "px" ;
        // }
    }

    viewWillAppear(animated?:boolean){
        if (this.currentViewControllerIndex < 0) return;
        let vc = this.viewControllersStack[this.currentViewControllerIndex];
        vc.viewWillAppear(animated);
    }

    viewDidAppear(animated?){
        if (this.currentViewControllerIndex < 0) return;
        let vc = this.viewControllersStack[this.currentViewControllerIndex];
        vc.viewDidAppear(animated);
        this.updateHeight( ) ;
    }

    viewWillDisappear(animated?){
        if (this.currentViewControllerIndex < 0) return;
        let vc = this.viewControllersStack[this.currentViewControllerIndex];
        vc.viewWillDisappear(animated);
    }

    viewDidDisappear(animated?){
        if (this.currentViewControllerIndex < 0) return;
        let vc = this.viewControllersStack[this.currentViewControllerIndex];
        vc.viewDidDisappear(animated);
    }

    pushViewController(vc:MUIViewController, animated?:boolean){
        let lastVC = this.viewControllersStack[this.currentViewControllerIndex];

        this.viewControllersStack.push(vc);
        this.currentViewControllerIndex++;

        vc.navigationController = this;
        vc.modalPresentationStyle = MUIModalPresentationStyle.FullScreen;

        vc.onLoadView(this, function () {

            if (vc.navigationItem != null && vc.navigationItem.backBarButtonItem != null) {
                vc.navigationItem.backBarButtonItem.setAction(this, function(){
                    vc.navigationController.popViewController();
                });
            }

            this.view.addSubview(vc.view);
            this.addChildViewController(vc);

            if (vc.preferredContentSize != null)
                this.preferredContentSize = vc.preferredContentSize;

            _MIUShowViewController(lastVC, vc, this, animated,this,this.hidePreviousViewControllers);
        });
    }

    hidePreviousViewControllers( howMany: number = 1 ){
        const stack = this.viewControllersStack ;
        
        for ( let i = stack.length - howMany ; i -- > 0 ; )
            MUICoreLayerAddStyle( stack[ i ].view.layer, "hidden" );

        for ( let i = howMany ; i -- > 0 ; )
            MUICoreLayerRemoveStyle( stack[ stack.length - i - 1 ].view.layer, "hidden" );

        this.updateHeight( howMany ) ;
    }

    popViewController(animated?:boolean){
        if (this.currentViewControllerIndex == 0)
            return;

        this.hidePreviousViewControllers( 2 ) ;

        let fromVC = this.viewControllersStack[this.currentViewControllerIndex];

        this.currentViewControllerIndex--;
        this.viewControllersStack.pop();

        let toVC = this.viewControllersStack[this.currentViewControllerIndex];

        // if (toVC.transitioningDelegate == null)
        //     toVC.transitioningDelegate = this;

        if (toVC.preferredContentSize != null)
            this.contentSize = toVC.preferredContentSize;

        _MUIHideViewController(fromVC, toVC, this, this, function () {
            fromVC.removeChildViewController(this);
            fromVC.view.removeFromSuperview();
        });
    }

    popToRootViewController(animated?:boolean){
        if(this.viewControllersStack.length == 1) return;
        
        let currentVC = this.viewControllersStack.pop();

        for(let index = this.currentViewControllerIndex - 1; index > 0; index--){
            let vc = this.viewControllersStack.pop();
            vc.view.removeFromSuperview();
            this.removeChildViewController(vc);
        }

        this.currentViewControllerIndex = 0;
        let rootVC = this.viewControllersStack[0];

        this.contentSize = rootVC.preferredContentSize;

        _MUIHideViewController(currentVC, rootVC, this, this, function () {
            currentVC.view.removeFromSuperview();
            this.removeChildViewController(currentVC);
        });
    }

    public set preferredContentSize(size) {
        this.setPreferredContentSize(size);
    }

    public get preferredContentSize(){
        if (this.currentViewControllerIndex < 0) return this._preferredContentSize;
        let vc = this.viewControllersStack[this.currentViewControllerIndex];
        return vc.preferredContentSize;
    }

    // Transitioning delegate
    private _pushAnimationController = null;
    private _popAnimationController = null;

    animationControllerForPresentedController(presentedViewController, presentingViewController, sourceController){
        if (this._pushAnimationController == null) {

            this._pushAnimationController = new MUIPushAnimationController();
            this._pushAnimationController.init();
        }

        return this._pushAnimationController;
    }

    animationControllerForDismissedController(dismissedController)
    {
        if (this._popAnimationController == null) {

            this._popAnimationController = new MUIPopAnimationController();
            this._popAnimationController.init();
        }

        return this._popAnimationController;
    }
}

/*
    ANIMATIONS
 */

export class MUIPushAnimationController extends MIOObject
{
    transitionDuration(transitionContext){
        return 0.25;
    }

    animateTransition(transitionContext){
        // make view configurations before transitions       
    }

    animationEnded(transitionCompleted){
        // make view configurations after transitions
    }

    // TODO: Not iOS like transitions. For now we use css animations
    animations(transitionContext){
        let animations = MUIClassListForAnimationType(MUIAnimationType.Push);
        return animations;
    }

}

export class MUIPopAnimationController extends MIOObject
{
    transitionDuration(transitionContext){
        return 0.25;
    }

    animateTransition(transitionContext){
        // make view configurations after transitions
    }

    animationEnded(transitionCompleted){
        // make view configurations before transitions
    }

    // TODO: Not iOS like transitions. For now we use css animations
    animations(transitionContext){
        let animations = MUIClassListForAnimationType(MUIAnimationType.Pop);
        return animations;
    }

}
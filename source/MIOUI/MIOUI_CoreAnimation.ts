
/*
    ANIMATIONS
 */

export enum MUIAnimationType
{
    None,
    BeginSheet,
    EndSheet,
    Push,
    Pop,
    FlipLeft,
    FlipRight,
    FadeIn,
    FadeOut,
    LightSpeedIn,
    LightSpeedOut,
    Hinge,
    SlideInUp,
    SlideOutDown,
    SlideInRight,
    SlideOutRight,
    SlideInLeft,
    SlideOutLeft,
    HorizontalOutFlip,
    HorizontalInFlip,   
    ZoomIn,
    ZoomOut 
}

// ANIMATION TYPES
export function MUIClassListForAnimationType(type)
{
    var array = [];
    array.push("animated");

    switch (type)
    {
        case MUIAnimationType.BeginSheet:
            array.push("slideInDown");
            break;

        case MUIAnimationType.EndSheet:
            array.push("slideOutUp");
            break;

        case MUIAnimationType.Push:
            array.push("slideInRight");
            break;

        case MUIAnimationType.Pop:
            array.push("slideOutRight");
            break;

        case MUIAnimationType.FadeIn:
            array.push("fadeIn");
            break;

        case MUIAnimationType.FadeOut:
            array.push("fadeOut");
            break;

        case MUIAnimationType.LightSpeedOut:
            array.push("lightSpeedOut");
            break;

        case MUIAnimationType.Hinge:
            array.push("hinge");
            break;

        case MUIAnimationType.SlideInUp:
            array.push("slideInUp");
            break;

        case MUIAnimationType.SlideOutDown:
            array.push("slideOutDown");            
            break;

        case MUIAnimationType.SlideInRight:
            array.push("slideInRight");
            break;

        case MUIAnimationType.SlideOutRight:
            array.push("slideOutRight");
            break;

        case MUIAnimationType.SlideInLeft:
            array.push("slideInLeft");
            break;

        case MUIAnimationType.SlideOutLeft:
            array.push("slideOutLeft");
            break;

        case MUIAnimationType.HorizontalOutFlip:
            array.push("flipOutY");
            break;            

        case MUIAnimationType.HorizontalInFlip:
            array.push("flipInY");
            break;    
            
        case MUIAnimationType.ZoomIn:
            array.push("zoomIn");
            break;

        case MUIAnimationType.ZoomOut:
            array.push("zoomOut");
            break;
    }

    return array;
}

export function _MUIAddAnimations(layer, animations)
{
    for (var index = 0; index < animations.length; index++)
        layer.classList.add(animations[index]);
}

export function _MUIRemoveAnimations(layer, animations)
{
    for (var index = 0; index < animations.length; index++)
        layer.classList.remove(animations[index]);
}

export function _MUIAnimationStart(layer, animationController, animationContext, target?, completion?)
{
    if (animationController == null)
    {
        if (target != null && completion != null)
                completion.call(target);        
        return;
    }

    var duration = animationController.transitionDuration(animationContext);
    var animations = animationController.animations(animationContext);

    animationController.animateTransition(animationContext);

    if (duration == 0 || animations == null)
    {
        // NO animation
        animationController.animationEnded(true);

        if (target != null && completion != null)
            completion.call(target);

        return;
    }

    layer.style.animationDuration = duration + "s";
    _MUIAddAnimations(layer, animations);

    layer.animationParams = {};
    layer.animationParams["animationController"] = animationController;
    layer.animationParams["animations"] = animations;

    if (target != null)
        layer.animationParams["target"] = target;
    if (completion != null)
        layer.animationParams["completion"] = completion;

    layer.addEventListener("animationend", _MUIAnimationDidFinish);
}

export function _MUIAnimationDidFinish(event)
{
    var animationController = event.target.animationParams["animationController"];
    var animations = event.target.animationParams["animations"];
    var target = event.target.animationParams["target"];
    var completion = event.target.animationParams["completion"];
    var layer = event.target;

    _MUIRemoveAnimations(layer, animations);
    layer.removeEventListener("animationend", _MUIAnimationDidFinish);
    animationController.animationEnded(true);

    if (target != null && completion != null)
        completion.call(target);
}
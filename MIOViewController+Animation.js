/**
 * Created by godshadow on 17/08/16.
 */
/// <reference path="MIOCore.ts" />
/// <reference path="MIOCoreTypes.ts" />
var MIOPresentationStyle;
(function (MIOPresentationStyle) {
    MIOPresentationStyle[MIOPresentationStyle["CurrentContext"] = 0] = "CurrentContext";
    MIOPresentationStyle[MIOPresentationStyle["PageSheet"] = 1] = "PageSheet";
    MIOPresentationStyle[MIOPresentationStyle["FormSheet"] = 2] = "FormSheet";
    MIOPresentationStyle[MIOPresentationStyle["FullScreen"] = 3] = "FullScreen";
})(MIOPresentationStyle || (MIOPresentationStyle = {}));
var MIOPresentationType;
(function (MIOPresentationType) {
    MIOPresentationType[MIOPresentationType["Sheet"] = 0] = "Sheet";
    MIOPresentationType[MIOPresentationType["Modal"] = 1] = "Modal";
    MIOPresentationType[MIOPresentationType["Navigation"] = 2] = "Navigation";
})(MIOPresentationType || (MIOPresentationType = {}));
var MIOAnimationType;
(function (MIOAnimationType) {
    MIOAnimationType[MIOAnimationType["None"] = 0] = "None";
    MIOAnimationType[MIOAnimationType["BeginSheet"] = 1] = "BeginSheet";
    MIOAnimationType[MIOAnimationType["EndSheet"] = 2] = "EndSheet";
    MIOAnimationType[MIOAnimationType["Push"] = 3] = "Push";
    MIOAnimationType[MIOAnimationType["Pop"] = 4] = "Pop";
    MIOAnimationType[MIOAnimationType["FlipLeft"] = 5] = "FlipLeft";
    MIOAnimationType[MIOAnimationType["FlipRight"] = 6] = "FlipRight";
    MIOAnimationType[MIOAnimationType["FadeIn"] = 7] = "FadeIn";
    MIOAnimationType[MIOAnimationType["FadeOut"] = 8] = "FadeOut";
    MIOAnimationType[MIOAnimationType["LightSpeedIn"] = 9] = "LightSpeedIn";
    MIOAnimationType[MIOAnimationType["LightSpeedOut"] = 10] = "LightSpeedOut";
    MIOAnimationType[MIOAnimationType["Hinge"] = 11] = "Hinge";
    MIOAnimationType[MIOAnimationType["SlideInUp"] = 12] = "SlideInUp";
    MIOAnimationType[MIOAnimationType["SlideOutDown"] = 13] = "SlideOutDown";
})(MIOAnimationType || (MIOAnimationType = {}));
// ANIMATION TYPES
function ClassListForAnimationType(type) {
    var array = [];
    array.push("animated");
    switch (type) {
        case MIOAnimationType.BeginSheet:
            array.push("slideInDown");
            break;
        case MIOAnimationType.EndSheet:
            array.push("slideOutUp");
            break;
        case MIOAnimationType.Push:
            array.push("slideInRight");
            break;
        case MIOAnimationType.Pop:
            array.push("slideOutRight");
            break;
        case MIOAnimationType.FadeIn:
            array.push("fadeIn");
            break;
        case MIOAnimationType.FadeOut:
            array.push("fadeOut");
            break;
        case MIOAnimationType.LightSpeedOut:
            array.push("lightSpeedOut");
            break;
        case MIOAnimationType.Hinge:
            array.push("hinge");
            break;
        case MIOAnimationType.SlideInUp:
            array.push("slideInUp");
            break;
        case MIOAnimationType.SlideOutDown:
            array.push("slideOutDown");
            break;
    }
    return array;
}
function AnimationClassesForPresentationType(type, reverse) {
    var clasess = null;
    switch (type) {
        case MIOPresentationType.Sheet:
            clasess = ClassListForAnimationType(reverse == false ? MIOAnimationType.BeginSheet : MIOAnimationType.EndSheet);
            break;
        case MIOPresentationType.Modal:
            if (MIOCoreIsMobile())
                clasess = ClassListForAnimationType(reverse == false ? MIOAnimationType.SlideInUp : MIOAnimationType.SlideOutDown);
            else
                clasess = ClassListForAnimationType(reverse == false ? MIOAnimationType.BeginSheet : MIOAnimationType.EndSheet);
            break;
        case MIOPresentationType.Navigation:
            clasess = ClassListForAnimationType(reverse == false ? MIOAnimationType.Push : MIOAnimationType.Pop);
            break;
    }
    return clasess;
}
function AddAnimationClassesForType(vc, reverse) {
    var classes = AnimationClassesForPresentationType(vc.presentationType, reverse);
    AddAnimationClasses(vc, classes);
}
function RemoveAnimationClassesForType(vc, reverse) {
    var classes = AnimationClassesForPresentationType(vc.presentationType, reverse);
    RemoveAnimationClasses(vc, classes);
}
function AddAnimationClasses(vc, classes) {
    for (var index = 0; index < classes.length; index++)
        vc.view.layer.classList.add(classes[index]);
}
function RemoveAnimationClasses(vc, classes) {
    for (var index = 0; index < classes.length; index++)
        vc.view.layer.classList.remove(classes[index]);
}
function FrameWithStyleForViewControllerInView(view, vc) {
    var w = 0;
    var h = 0;
    var x = 0;
    var y = 0;
    if (vc.presentationStyle == MIOPresentationStyle.PageSheet) {
        w = vc.contentSize.width;
        h = vc.contentSize.height;
        x = (view.getWidth() - w) / 2;
        y = 0;
    }
    else if (vc.presentationStyle == MIOPresentationStyle.FormSheet) {
        w = view.getWidth() * 0.75; // 75% of the view
        h = view.getHeight() * 0.90; // 90% of the view
        x = (view.getWidth() - w) / 2;
        y = (view.getHeight() - h) / 2;
    }
    else {
        w = view.getWidth();
        h = view.getHeight();
    }
    return MIOFrame.frameWithRect(x, y, w, h);
}
//# sourceMappingURL=MIOViewController+Animation.js.map
class TaskType {
    constructor(...args)
    {
        this._args = args;
    }
    get args() { return this._args; };
}

/* Navigation */
export class Visit extends TaskType { }
export class ClickSelector extends TaskType { }
export class SetElementValue extends TaskType { }
export class WaitForSelector extends TaskType { }
export class FocusSelector extends TaskType { }
export class KeyboardPress extends TaskType { }
export class WaitUntilLoaded extends TaskType { }
export class IfStoredDataValueAtIndexIsEqualToThenReload extends TaskType { }
export class IfSelectorElementInnerEqualToThenReload extends TaskType { }
/* Getting outputs */
export class GetSelectorElementInnerAndAddToStoredData extends TaskType { }
export class GetSelectorElementInnerAndAddToStoredKeywordData extends TaskType { }
export class GetSelectorElementAndAddItsAttributeToStoredData extends TaskType { }
export class GetSelectorElementAndAddItsAttributeToStoredKeywordData extends TaskType { }
export class WaitForSelectorAndAddItsElementInnerToStoredData extends TaskType { }
export class WaitForSelectorAndAddItsAttributeToStoredData extends TaskType { }
export class EvaluateAndAddToStoredData extends TaskType { }
export class EvaluateAndAddToStoredKeywordData extends TaskType { }
/* Data storage */
export class AddToStoredData extends TaskType { }
export class RemoveFromStoredDataByIndex extends TaskType { }
export class ClearStoredData extends TaskType { }
export class SendStoredDataToBrain extends TaskType { } // !TO-DO(mishashto): add after brain implementation
/* Misc */
export class SelfDestruct extends TaskType { }
export class UseProxy extends TaskType { } // ?TO-DO(mishashto): probably should be on head level
export class ClearProxy extends TaskType { } // ?TO-DO(mishashto): ^
export class DebugLogStoredData extends TaskType { }
export class Sleep extends TaskType { }
export class StartOver extends TaskType { }
export class StartOverOnce extends TaskType { }
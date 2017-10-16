export interface IConfimPopup {
    title: string,
    message: string,
    object?: any,
    action?: string,
    abort?: string
}

export class ConfirmPopup implements IConfimPopup {
    title: string;
    message: string;
    object?: any;
    action?: string = "Yes";
    abort?: string = "Cancel";
}

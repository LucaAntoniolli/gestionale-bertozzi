export class TfaSetup{
    email?: string;
    code?: string;
    isTfaEnabled?: boolean;
    authenticatorKey?: string;
    formattedKey?: string;
}

export class TfaLogin{
    email?: string;
    code?: string;
}
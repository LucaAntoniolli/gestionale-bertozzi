export class LoginResponse {
    token?: string;
    refreshToken?: string;
    isAuthSuccessful?: boolean;
    isTfaEnabled?: boolean;
    role?: string;

    static map(loginResponse: any): LoginResponse {
        return Object.assign(new LoginResponse(), loginResponse) as LoginResponse;
    }
}

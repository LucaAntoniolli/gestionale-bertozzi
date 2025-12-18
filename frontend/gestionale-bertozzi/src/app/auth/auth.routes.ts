import { NotfoundComponent } from '../gestionale-bertozzi/components/notfound/notfound.component';
import { OtpVerificationComponent } from './otp-verification/otp-verification.component';
import { PasswordLostComponent } from './password-lost/password-lost.component';
import { LoginComponent } from './login/login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ErrorComponent } from './error/error.component';
import { AccessComponent } from './access/access.component';

export default [
    { path: 'notfound', component: NotfoundComponent },
    { path: 'error', component: ErrorComponent, },
    { path: 'access', component: AccessComponent, },
    { path: 'login', component: LoginComponent, },
    { path: 'otp-verification', component: OtpVerificationComponent, },
    { path: 'password-lost', component: PasswordLostComponent, },
    { path: 'reset-password/:resetToken', component: ResetPasswordComponent, },
    { path: '**', redirectTo: '/notfound' }
]
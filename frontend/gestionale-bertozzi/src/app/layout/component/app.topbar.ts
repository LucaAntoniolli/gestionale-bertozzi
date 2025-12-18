import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '../service/layout.service';
import { first, forkJoin } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { SplitButton } from 'primeng/splitbutton';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        SplitButton,
        RouterModule, 
        CommonModule, 
        ButtonModule,
        ChipModule,
        StyleClassModule, ],
    templateUrl: './app.topbar.component.html'
})
export class AppTopbar {
    topbarMenuItems: MenuItem[] = [];

    user: any;
    role?: string = undefined;

    @ViewChild('menubutton') menuButton!: ElementRef;
    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(
        public layoutService: LayoutService, 
        private auth: AuthService, 
        private router: Router,
        private cdr: ChangeDetectorRef,
    ) { 

        this.topbarMenuItems = [
            {
                icon: 'pi pi-fw pi-user',
                label: 'Profilo utente',
                routerLink: ['/user/user-profile']
            },
            { separator: true },
            { 
                icon: 'pi pi-fw pi-info',
                label: 'About',
                routerLink: ['/framework/app-info'] }
        ];

    }

    ngOnInit(): void {
        this.auth.getUser().pipe(first()).subscribe(
            user => {
                this.user = user;
                this.role = user.roles ? user.roles[0] : undefined;
                this.cdr.detectChanges();
            }
        );
    }

    logout(): void {
        this.auth.logout().subscribe({
            next: () => {
                this.router.navigateByUrl('/auth/login');
            }
        });
    }
}

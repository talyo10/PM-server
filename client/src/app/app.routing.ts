import { ModuleWithProviders, NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './shared/services/auth.guard';
import { SystemHooksComponent } from './admin-panel/system-hooks/system-hooks.component';
import { LoginComponent } from './login/login.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { MapsRootComponent } from './maps-root/maps-root.component';
import { MapManagmentComponent } from './map-managment/map-managment.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { CalendarComponent } from './admin-panel/calendar/calendar.component';
import { DedicatedAgentsComponent } from './admin-panel/dedicated-agents/dedicated-agents.component';
import { ServersComponent } from './admin-panel/servers/servers.component';
import { TriggersComponent } from './admin-panel/triggers/triggers.component';
import { RegisterComponent } from './register/register.component';

const appRoutes: Routes = [
    { path: '', redirectTo: '/app/map', pathMatch: 'full' },
    { path: 'app/admin', redirectTo: '/app/admin/agents', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'app', component: MapsRootComponent, canActivate: [AuthGuard],
        children: [
            {
                path: '',
                canActivateChild: [AuthGuard],
                children: [
                    { path: 'map', component: MapManagmentComponent },
                    { path: 'map/:id', component: MapManagmentComponent },
                ]
            },            
            {
                path: 'admin',
                component: AdminPanelComponent,
                children: [
                    { path: 'calendar', component: CalendarComponent },
                    { path: 'plugins', component: DedicatedAgentsComponent },
                    { path: 'agents', component: ServersComponent },
                    { path: 'triggers', component: TriggersComponent },
                    { path: 'SystemHooks', component: SystemHooksComponent}
                ]
            },
        ]
    },
    { path: '**', component: PageNotFoundComponent }
];

@NgModule({
    imports:[
        RouterModule.forRoot(appRoutes)
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule {}

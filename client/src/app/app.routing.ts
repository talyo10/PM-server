import { SystemHooksComponent } from './admin-panel/system-hooks/system-hooks.component';
import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

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
    { path: 'app/admin', redirectTo: '/app/admin/servers', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'app', component: MapsRootComponent,
        children: [
            { path: 'map', component: MapManagmentComponent },
            {
                path: 'admin',
                component: AdminPanelComponent,
                children: [
                    { path: 'calendar', component: CalendarComponent },
                    { path: 'dedicatedAgents', component: DedicatedAgentsComponent },
                    { path: 'servers', component: ServersComponent },
                    { path: 'triggers', component: TriggersComponent },
                    { path: 'SystemHooks', component: SystemHooksComponent}
                ]
            },
        ]
    },
    { path: '**', component: PageNotFoundComponent }
];

export const appRoutingProviders: any[] = [

];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// map components
import { MapDetailComponent } from './maps/map-detail/map-detail.component';
import { MapPropertiesComponent } from './maps/map-detail/map-properties/map-properties.component';
import { MapCodeComponent } from './maps/map-detail/map-edit/map-code/map-code.component';
import { MapDesignComponent } from './maps/map-detail/map-edit/map-design/map-design.component';
import { MapResultsComponent } from './maps/map-detail/map-results/map-results.component';
import { MapEditComponent } from './maps/map-detail/map-edit/map-edit.component';
import { MapsListComponent } from './maps/maps-list/maps-list.component';
import { MapCreateComponent } from './maps/map-create/map-create.component';

//plugin component
import { PluginsListComponent } from './plugins/plugins-list/plugins-list.component';
import { ProjectsListComponent } from './projects/projects-list/projects-list.component';
import { ProjectDetailsComponent } from './projects/project-details/project-details.component';
import { ProjectCreateComponent } from './projects/project-create/project-create.component';
import { AdminComponent } from './admin/admin.component';
import { AgentsListComponent } from './agents/agents-list/agents-list.component';
import { MapSettingComponent } from './maps/map-detail/map-setting/map-setting.component';
import { CalendarContainerComponent } from './calendar/calendar-container/calendar-container.component';
import { UnsavedGuard } from './shared/guards/unsaved.guard';

const appRoutes: Routes = [
  // maps
  {
    path: 'maps',
    loadChildren: './maps/maps.module#MapsModule'
  },

//  plugins
  {
    path: 'plugins',
    component: PluginsListComponent
  },

//  projects
  {
    path: 'projects',
    loadChildren: './projects/projects.module#ProjectsModule'
  },

//  admin
  {
    path: 'admin',
    redirectTo: 'admin/plugins'
  },
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      {
        path: 'plugins',
        component: PluginsListComponent
      },
      {
        path: 'agents',
        component: AgentsListComponent
      },
      {
        path: 'calendar',
        component: CalendarContainerComponent
      }
    ]
  }
];


@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {
}

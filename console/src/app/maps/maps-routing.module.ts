import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapEditComponent } from './map-detail/map-edit/map-edit.component';
import { MapDesignComponent } from './map-detail/map-edit/map-design/map-design.component';
import { MapDetailComponent } from './map-detail/map-detail.component';
import { MapCodeComponent } from './map-detail/map-edit/map-code/map-code.component';
import { MapsListComponent } from './maps-list/maps-list.component';
import { MapSettingComponent } from './map-detail/map-setting/map-setting.component';
import { MapPropertiesComponent } from './map-detail/map-properties/map-properties.component';
import { UnsavedGuard } from '../shared/guards/unsaved.guard';
import { MapResultsComponent } from './map-detail/map-results/map-results.component';
import { MapCreateComponent } from './map-create/map-create.component';

const routes: Routes = [
  {
    path: '',
    component: MapsListComponent,
    pathMatch: 'full'
  },
  {
    path: 'create',
    component: MapCreateComponent
  },
  {
    path: 'update',
    component: MapCreateComponent
  },
  {
    path: ':id',
    redirectTo: ':id/edit/design',
  },
  {
    path: ':id',
    component: MapDetailComponent,
    canDeactivate: [UnsavedGuard],
    children: [
      {
        path: 'properties',
        component: MapPropertiesComponent
      },
      {
        path: 'settings',
        component: MapSettingComponent
      },
      {
        path: 'edit',
        component: MapEditComponent,
        children: [
          {
            path: 'code',
            component: MapCodeComponent
          },
          {
            path: 'design',
            component: MapDesignComponent
          },
        ]
      },
      {
        path: 'results',
        component: MapResultsComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MapsRoutingModule { }

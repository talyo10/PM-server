import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { AppComponent } from './app.component';
import { AppRoutingModule } from "./app-routing.module";

// shared
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TreeTableModule, SharedModule } from 'primeng/primeng';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { FilterPipe } from './shared/filter.pipe';


// map components etc.
import { MapsService } from "./maps/maps.service";
import { SocketService } from "./maps/socket.service";
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { MapDetailComponent } from './maps/map-detail/map-detail.component';
import { MapPropertiesComponent } from './maps/map-detail/map-properties/map-properties.component';
import { MapDesignComponent } from './maps/map-detail/map-edit/map-design/map-design.component';
import { MapResultsComponent } from './maps/map-detail/map-results/map-results.component';
import { MapCodeComponent } from './maps/map-detail/map-edit/map-code/map-code.component';
import { MapEditComponent } from './maps/map-detail/map-edit/map-edit.component';
import { MapsListComponent } from './maps/maps-list/maps-list.component';
import { MapCreateComponent } from './maps/map-create/map-create.component';
import { MapEnvironmentPaneComponent } from './maps/map-detail/map-edit/map-enviroment-pane/map-environment-pane.component';
import { MapAgentsComponent } from './maps/map-detail/map-edit/map-enviroment-pane/map-agents/map-agents.component';
import { ProcessFormComponent } from './maps/map-detail/map-edit/map-design/process-form/process-form.component';
import { PluginToolboxComponent } from './maps/map-detail/map-edit/map-enviroment-pane/plugin-toolbox/plugin-toolbox.component'; // being used in maps to
import { SelectAgentComponent } from './maps/map-detail/map-edit/map-enviroment-pane/map-agents/select-agent/select-agent.component';
import { MapAttributesComponent } from './maps/map-detail/map-edit/map-enviroment-pane/map-attributes/map-attributes.component';
import { AddAttributeComponent } from './maps/map-detail/map-edit/map-enviroment-pane/map-attributes/add-attribute/add-attribute.component';
import { MapTriggersComponent } from './maps/map-detail/map-edit/map-enviroment-pane/map-triggers/map-triggers.component';
import { TriggerFormComponent } from './maps/map-detail/map-edit/map-enviroment-pane/map-triggers/trigger-form/trigger-form.component';
import { ProcessResultComponent } from './maps/map-detail/map-results/process-result/process-result.component';
import { NgxChartsModule } from "@swimlane/ngx-charts";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MapSettingComponent } from './maps/map-detail/map-setting/map-setting.component';

// calendar
import { CalendarContainerComponent } from './calendar/calendar-container/calendar-container.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { CalendarModule } from 'angular-calendar';


// plugins components etc.
import { PluginsService } from './plugins/plugins.service';
import { PluginUploadComponent } from './plugins/plugin-upload/plugin-upload.component';
import { PluginsListComponent } from './plugins/plugins-list/plugins-list.component';

// agents etc
import { AgentsService } from "./agents/agents.service";
import { AgentsListComponent } from './agents/agents-list/agents-list.component';
import { DataTableModule } from 'primeng/primeng';

//projects tex
import { ProjectsListComponent } from './projects/projects-list/projects-list.component';
import { ProjectDetailsComponent } from './projects/project-details/project-details.component';
import { ProjectsService } from "./projects/projects.service";
import { ProjectCreateComponent } from './projects/project-create/project-create.component';
import { ActionResultComponent } from './maps/map-detail/map-results/action-result/action-result.component';
import { AdminComponent } from './admin/admin.component';
import { AddFolderComponent } from './agents/agents-list/add-folder/add-folder.component';
import { SearchComponent } from './search/search.component';
import { AddJobComponent } from './calendar/add-job/add-job.component';
import { CalendarComponent } from './calendar/calendar/calendar.component';


@NgModule({
  declarations: [
    AppComponent,
    MapDetailComponent,
    MapPropertiesComponent,
    MapDesignComponent,
    MapResultsComponent,
    MapCodeComponent,
    MapEditComponent,
    MapsListComponent,
    MapCreateComponent,
    MapEnvironmentPaneComponent,
    MapAgentsComponent,
    MapSettingComponent,
    SelectAgentComponent,
    MapAttributesComponent,
    AddAttributeComponent,
    MapTriggersComponent,
    ProcessResultComponent,
    TriggerFormComponent,
    ProcessFormComponent,
    PluginToolboxComponent,
    PluginUploadComponent,
    PluginsListComponent,
    ProjectsListComponent,
    ProjectDetailsComponent,
    ProjectCreateComponent,
    ActionResultComponent,
    AdminComponent,
    AgentsListComponent,
    AddFolderComponent,
    FilterPipe,
    SearchComponent,
    CalendarContainerComponent,
    AddJobComponent,
    CalendarComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    BrowserAnimationsModule,

    MonacoEditorModule,
    // primeng
    TreeTableModule,
    SharedModule,
    DataTableModule,
    // ngx-bootstrap
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    AccordionModule.forRoot(),
    BsDatepickerModule.forRoot(),
    TimepickerModule.forRoot(),
    NgxChartsModule,

    // angular-calendar
    CalendarModule.forRoot(),

    AppRoutingModule
  ],
  entryComponents: [SelectAgentComponent, AddAttributeComponent, TriggerFormComponent, PluginUploadComponent, AddFolderComponent, MapSettingComponent],
  providers: [MapsService, PluginsService, AgentsService, ProjectsService, SocketService],
  bootstrap: [AppComponent]
})
export class AppModule {
}

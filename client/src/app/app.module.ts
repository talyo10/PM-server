import { AddSystemHookComponentWindow } from './admin-panel/system-hooks/add-system-hook/add-system-hook.component';
import { SystemHooksComponent } from './admin-panel/system-hooks/system-hooks.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {HashLocationStrategy, Location, LocationStrategy} from '@angular/common';


import { ModalModule } from 'angular2-modal';
import { BootstrapModalModule } from 'angular2-modal/plugins/bootstrap';
import { LocalStorageModule, LocalStorageService } from 'angular-2-local-storage';
import { TreeModule } from 'angular-tree-component';
import { ContextMenuModule } from 'ngx-contextmenu';
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { FileUploadModule } from 'ng2-file-upload';
import { ResizableModule } from 'angular2-resizable';
import { NgPipesModule } from 'ngx-pipes';
import {OverlayPanelModule, ScheduleModule} from 'primeng/primeng';
import { CalendarModule } from 'angular-calendar';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AuthenticationService } from './shared/services/authentication.service';
import { AppRoutingModule } from './app.routing';
import { ConstsService } from './shared/services/consts.service';
import { ServersService } from './shared/services/servers.service';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { LoginComponent } from './login/login.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { MapsRootComponent } from './maps-root/maps-root.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { MapManagmentComponent } from './map-managment/map-managment.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { CalendarComponent } from './admin-panel/calendar/calendar.component';
import { LeftPanelComponent } from './map-managment/left-panel/left-panel.component';
import { MapEditorComponent } from './map-managment/map-editor/map-editor.component';
import { MapSettingsComponent } from './map-managment/map-settings/map-settings.component';
import { MessagesComponent } from './map-managment/messages/messages.component';
import { MapExplorerComponent } from './map-managment/left-panel/map-explorer/map-explorer.component';
import { MapToolboxComponent } from './map-managment/left-panel/map-toolbox/map-toolbox.component';
import { ExecutionReportComponent } from './map-managment/left-panel/map-explorer/execution-report/execution-report.component';
import { ItemExecutionResultComponent } from './map-managment/left-panel/map-explorer/execution-report/item-execution-result/item-execution-result.component';
import { MapAttributesComponent } from './map-managment/map-settings/map-attributes/map-attributes.component';
import { MapDesignerComponent } from './map-managment/map-editor/map-designer/map-designer.component';
import { MapCodeEditorComponent } from './map-managment/map-editor/map-code-editor/map-code-editor.component';
import { MapServersComponent } from './map-managment/map-settings/map-servers/map-servers.component';
import { MapAttributeComponent } from './map-managment/map-settings/map-attributes/map-attribute/map-attribute.component';
import { ProcessesComponentWindow } from './map-managment/map-editor/map-designer/processes/processes.component';
import { NewProcessComponentWindow } from './map-managment/map-editor/map-designer/new-process/new-process.component';
import { ActionsComponentWindow } from './map-managment/map-editor/map-designer/action/action.component';
import { ExecutionChartComponent } from './map-managment/left-panel/map-explorer/execution-report/item-execution-result/execution-chart/execution-chart.component';
import { DedicatedAgentsComponent } from './admin-panel/dedicated-agents/dedicated-agents.component';
import { AddDedicatedAgentComponentWindow } from './admin-panel/dedicated-agents/add-dedicated-agent/add-dedicated-agent.component';
import { ShowDedicatedAgentComponent } from './admin-panel/dedicated-agents/show-dedicated-agent/show-dedicated-agent.component';
import { ServersComponent } from './admin-panel/servers/servers.component';
import { EventsSchedulerComponent } from './admin-panel/calendar/events-scheduler/events-scheduler.component';
import { RegisterComponent } from './register/register.component';
import { NewMapComponentWindow } from "./map-managment/left-panel/map-explorer/popups/new-map/new-map.component";
import { NewProjectComponentWindow } from "./map-managment/left-panel/map-explorer/popups/new-project/new-project.component";
import { NewFolderComponentWindow } from "./map-managment/left-panel/map-explorer/popups/new-folder/new-folder.component";
import { NewGroupComponentWindow } from "./admin-panel/servers/new-group/new-group.component";
import { MessagePopupComponent } from './map-managment/messages/message-popup/message-popup.component';
import { DraggableDirective } from './directives/draggable.directive';
import { EditAgentComponentWindow } from './admin-panel/servers/edit-agent/edit-agent.component';
import { UpdateMapComponentWindow } from './map-managment/left-panel/map-explorer/popups/update-map/update-map.component';
import { RenameFolderComponentWindow } from './map-managment/left-panel/map-explorer/popups/rename-folder/rename-folder.component';
import { AttributeWindow } from './shared/popups/attribute-window/attribute-window.component';
import { ServersPopupComponent } from './shared/popups/servers-popup/servers-popup.component';
import { ServerFilterPipe } from './admin-panel/servers/server-filter.pipe';
import { MapVersionsComponent } from './map-managment/left-panel/map-explorer/popups/map-versions/map-versions.component';
import { MapExecutionsComponent } from './map-managment/left-panel/map-explorer/popups/map-executions/map-executions.component';
import { TriggersComponent } from './admin-panel/triggers/triggers.component';
import { AddTriggerComponentWindow } from './admin-panel/triggers/add-trigger/add-trigger.component';
import { InstallAgentComponentWindow } from './admin-panel/servers/install-agent/install-agent.component';
import { RenameNodeComponentWindow } from './map-managment/map-editor/map-designer/rename-node/rename-node.component';
import { DeleteNodeComponentWindow } from './map-managment/map-editor/map-designer/delete-node/delete-node.component';
import { ConnectionCheckerComponent } from './connection-checker/connection-checker.component';
import { DateTimePickerComponent } from './admin-panel/calendar/utils/date-picker.component';
import { CombinedPopupComponent } from './map-managment/map-editor/map-designer/combined-popup/combined-popup.component';
import {DatePickerModule} from "ng2-datepicker";
import { ConfirmPopupComponent } from './shared/popups/confirm-popup/confirm-popup.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginComponent,
    PageNotFoundComponent,
    MapsRootComponent,
    SideBarComponent,
    MapManagmentComponent,
    AdminPanelComponent,
    CalendarComponent,
    LeftPanelComponent,
    MapEditorComponent,
    MapSettingsComponent,
    MessagesComponent,
    MapExplorerComponent,
    MapToolboxComponent,
    ExecutionReportComponent,
    ProcessesComponentWindow,
    ActionsComponentWindow,
    NewProcessComponentWindow,
    ItemExecutionResultComponent,
    MapAttributesComponent,
    MapDesignerComponent,
    MapCodeEditorComponent,
    MapServersComponent,
    MapAttributeComponent,
    ExecutionChartComponent,
    DedicatedAgentsComponent,
    AddDedicatedAgentComponentWindow,
    ShowDedicatedAgentComponent,
    ServersComponent,
    EventsSchedulerComponent,
    RegisterComponent,
    NewProjectComponentWindow,
    NewMapComponentWindow,
    MessagePopupComponent,
    DraggableDirective,
    EditAgentComponentWindow,
    UpdateMapComponentWindow,
    AttributeWindow,
    ServerFilterPipe,
    MapVersionsComponent,
    MapExecutionsComponent,
    TriggersComponent,
    AddTriggerComponentWindow,
    InstallAgentComponentWindow,
    RenameNodeComponentWindow,
    ConnectionCheckerComponent,
    ServersPopupComponent,
    DateTimePickerComponent,
    DeleteNodeComponentWindow,
    NewFolderComponentWindow,
    NewGroupComponentWindow,
    RenameFolderComponentWindow,
    CombinedPopupComponent,
    SystemHooksComponent,
    AddSystemHookComponentWindow,
    ConfirmPopupComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpModule,
    BrowserAnimationsModule,

    AppRoutingModule,
    
    NgbModule.forRoot(),
    CalendarModule.forRoot(),
    ModalModule.forRoot(),
    BootstrapModalModule,
    TreeModule,
    ChartsModule,
    ContextMenuModule,
    FileUploadModule,
    ResizableModule,
    NgPipesModule,
    LocalStorageModule.withConfig({
            prefix: 'pm-app',
            storageType: 'localStorage'
        }),
    DatePickerModule
  ],
  providers: [
    AuthenticationService,
    LocalStorageService,
    ConstsService,
    ServersService,
    ScheduleModule,
    Location,
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    }

  ],
  entryComponents: [
    NewProjectComponentWindow,
    NewMapComponentWindow,
    ExecutionReportComponent,
    ProcessesComponentWindow,
    NewProcessComponentWindow,
    ActionsComponentWindow,
    AddDedicatedAgentComponentWindow,
    MessagePopupComponent,
    EditAgentComponentWindow,
    UpdateMapComponentWindow,
    AttributeWindow,
    MapVersionsComponent,
    MapExecutionsComponent,
    AddTriggerComponentWindow,
    InstallAgentComponentWindow,
    RenameNodeComponentWindow,
    ServersPopupComponent,
    DeleteNodeComponentWindow,
    NewFolderComponentWindow,
    NewGroupComponentWindow,
    RenameFolderComponentWindow,
    CombinedPopupComponent,
    AddSystemHookComponentWindow,
    ConfirmPopupComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

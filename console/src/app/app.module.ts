import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// shared

import { UnsavedGuard } from './shared/guards/unsaved.guard';
import { ConfirmComponent } from './shared/confirm/confirm.component';
import { SharedModule } from './shared/shared.module';

// map components etc.
import { MapsService } from './maps/maps.service';
import { SocketService } from './shared/socket.service';


import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


// plugins components etc.
import { PluginsService } from './plugins/plugins.service';
import { PluginUploadComponent } from './plugins/plugin-upload/plugin-upload.component';
import { PluginsListComponent } from './plugins/plugins-list/plugins-list.component';

// agents etc
import { AgentsService } from './agents/agents.service';
import { AgentsListComponent } from './agents/agents-list/agents-list.component';

// projects tex
import { ProjectsService } from './projects/projects.service';
import { AdminComponent } from './admin/admin.component';
import { AddFolderComponent } from './agents/agents-list/add-folder/add-folder.component';
import { SearchComponent } from './search/search.component';

// calendar
import { CalendarModule } from './calendar/calendar.module';
import { CalendarService } from './calendar/calendar.service';
import { ToastyModule } from 'ng2-toasty';


@NgModule({
  declarations: [
    AppComponent,

    SearchComponent,
    ConfirmComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule,
    BrowserAnimationsModule,
    SharedModule,
    ToastyModule.forRoot(),


    AppRoutingModule,
    CalendarModule
  ],
  entryComponents: [ConfirmComponent],
  providers: [MapsService, PluginsService, AgentsService, ProjectsService, SocketService, CalendarService, UnsavedGuard],
  bootstrap: [AppComponent]
})
export class AppModule {
}

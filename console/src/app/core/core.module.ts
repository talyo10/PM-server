import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { ToastyModule } from 'ng2-toasty';
import { AppComponent } from './app.component';
import { SearchComponent } from '../search/search.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    ToastyModule.forRoot(),

    SharedModule,
  ],
  declarations: [
    AppComponent,
    SearchComponent
  ]
})
export class CoreModule { }

import { Component, ViewChild, ElementRef, OnInit, Input, OnDestroy, OnChanges, SimpleChange } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import { LibPMService } from '../../../shared/services/libpm.service';
import { MapService } from '../../../shared/services/map.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-map-code-editor',
  templateUrl: './map-code-editor.component.html',
  styleUrls: ['./map-code-editor.component.css']
})
export class MapCodeEditorComponent implements OnInit, OnDestroy, OnChanges {

  @ViewChild('editor') editorContent: ElementRef;
  map: any;
  public editor: any;
  private monaco: any;

  currentMapSubscription: Subscription;

  constructor(private libpmService: LibPMService, private mapService: MapService) {
    this.monaco = this.libpmService.getMonacoObject();
    this.currentMapSubscription = this.mapService.getCurrentMapObservable()
      .subscribe(
        (map) => {
          this.map = map;
        }
      );
  }

  // Will be called once monaco library is available
  ngOnInit() {
    let myDiv: HTMLDivElement = this.editorContent.nativeElement;


    this.libpmService.getLibPM().subscribe((result) => {
      try {
        /* add libproduction map, load it only once */
        this.monaco.languages.typescript.javascriptDefaults.addExtraLib(result, 'productionMap/pm-lib.d.ts');
      } catch (ex) {
        console.log(ex);
      }

    });

    /* load the mapView */
    try {
      this.libpmService.addMap(this.map.mapView);
    } catch (ex) {
      console.log(ex);
    }

    this.editor = this.monaco.editor.create(myDiv, {
      value: this.map.mapView.code,
      theme: 'vs-dark',
      language: 'javascript',
      allowNonTsExtensions: true
    });
    this.editor.onDidChangeModelContent(($event) => {
      this.map.mapView.code = this.editor.getValue();
    });
  }

  ngOnDestroy() {
    this.currentMapSubscription.unsubscribe();
    try {
      this.libpmService.removeAllLibs();
    } catch (ex) {
      console.log(ex);
    }
  }

  ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
    if (changes['map'].currentValue != null && this.editor) {
      this.editor.setValue(this.map.mapView.code);
    }
  }

}

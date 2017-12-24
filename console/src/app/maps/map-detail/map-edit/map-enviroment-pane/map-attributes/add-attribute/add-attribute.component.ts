import { AfterContentInit, Component, OnInit } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap";
import { Subject } from "rxjs/Subject";
import { Attribute } from "../../../../../models/attribute.model";
import { FormControl, FormGroup, Validators } from "@angular/forms";

@Component({
  selector: 'app-add-attribute',
  templateUrl: './add-attribute.component.html',
  styleUrls: ['./add-attribute.component.scss']
})
export class AddAttributeComponent implements AfterContentInit {
  attributeForm: FormGroup;
  public result: Subject<any> = new Subject();

  constructor(public bsModalRef: BsModalRef) {
  }

  ngAfterContentInit() {
    this.attributeForm = new FormGroup({
      name: new FormControl(null, Validators.required),
      value: new FormControl(null, Validators.required),
      type: new FormControl('string', Validators.required)
    })
  }

  onConfirm(form: Attribute): void {
    // TODO: add custom validator to check the json while user type it
    // TODO: add custom validator to check if name is already used
    if (form.type === 'object') {
      try {
        form.value = JSON.parse(form.value);
      } catch (e) {

      }
    }
    this.result.next(form);
    this.bsModalRef.hide();
  }


  onClose(): void {
    this.bsModalRef.hide();
  }



}

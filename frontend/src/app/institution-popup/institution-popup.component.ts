import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';

@Component({
  selector: 'app-institution-popup',
  templateUrl: './institution-popup.component.html',
  styleUrls: ['./institution-popup.component.scss'],
})
export class InstitutionPopupComponent implements OnInit{
  title = 'template-driven-form';
  formStatus: string = '';
  formdata: any = {};
  reactiveForm: FormGroup;

  ngOnInit(){
    this.reactiveForm = new FormGroup({
      name_de: new FormControl(null, [Validators.required]),
      shortName: new FormControl(null, [Validators.required, 
        Validators.pattern(/^(\S*)$/)]),
      uuid: new FormControl(null, [Validators.required, 
        Validators.pattern('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')]),
      sector: new FormControl(null, Validators.required),
      ts: new FormControl(null),
      orgs: new FormArray([]),
    })

    this.reactiveForm.statusChanges.subscribe((status) => {
      console.log(status)
      this.formStatus = status;
    });

  }

  OnFormSubmitted(){
    console.log(this.reactiveForm.value);
    this.formdata = this.reactiveForm.value;
    this.reactiveForm.reset({
      name_de: null,
      shortName: null,
      uuid: null,
      sector: null,
      ts: null,
      orgs: [],
    });
  }

  AddOrg(){
    (<FormArray>this.reactiveForm.get('orgs'))
      .push(new FormControl(null, Validators.required));
  }

  DeleteOrg(index: number){
    const controls = <FormArray>this.reactiveForm.get('orgs');
    controls.removeAt(index);
  }


}



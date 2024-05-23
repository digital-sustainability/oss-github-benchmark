import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { DataService } from '../data.service';

@Component({
  selector: 'app-add-institution',
  templateUrl: './add-institution.component.html',
  styleUrls: ['./add-institution.component.scss'],
})
export class AddInstitutionComponent implements OnInit {
  title = 'template-driven-form';
  formStatus: string = '';
  formdata: any = {};
  reactiveForm: FormGroup;
  dataSource: any;
  displayedColumns: string[] = ['name_de','uuid', 'sector', 'shortname',  'ts','orgs', 'edit'];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.LoadTodoInstitutions().then(data => {
      this.dataSource = data;
    });

    this.reactiveForm = new FormGroup({
      name_de: new FormControl(null, [Validators.required]),
      shortname: new FormControl(null, [
        Validators.required,
        Validators.pattern(/^(\S*)$/),
      ]),
      uuid: new FormControl(null, [
        Validators.required,
        Validators.pattern(
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        ),
      ]),
      sector: new FormControl(null, Validators.required),
      ts: new FormControl(null),
      orgs: new FormArray([
        new FormGroup({
          name: new FormControl(null, [Validators.required]),
          ts_org: new FormControl(null),
        }),
      ]),
    });

    this.reactiveForm.statusChanges.subscribe((status) => {
      this.formStatus = status;
    });
  }

  async OnFormSubmitted() {
    this.formdata = this.reactiveForm.value;
    await this.dataService.createNewTodoInstitution(
      this.formdata,
    );
    this.reactiveForm.reset({
      name_de: null,
      shortNnme: null,
      uuid: null,
      sector: null,
      ts: null,
      orgs: [
        {
          name: null,
          ts_org: null,
        },
      ],
    });
  }

  AddOrg() {
    (<FormArray>this.reactiveForm.get('orgs')).push(
      new FormGroup({
        name: new FormControl(null, [Validators.required]),
        ts_org: new FormControl(null),
      }),
    );
  }

  DeleteOrg(index: number) {
    const controls = <FormArray>this.reactiveForm.get('orgs');
    controls.removeAt(index);
  }
  editTodoInstitution(institution) {

  
    // Add additional FormGroups for the organizations if there are more in the institution than in the form
    const orgsControl = <FormArray>this.reactiveForm.get('orgs');
    while (orgsControl.length < institution.orgs.length) {
      this.AddOrg();
    }
  
    // Remove additional FormGroups for the organizations if there are more in the form than in the institution
    while (orgsControl.length > institution.orgs.length) {
      this.DeleteOrg(orgsControl.length - 1);
    }
// write values from chosen institution to the form
    this.reactiveForm.patchValue({
      name_de: institution.name_de,
      shortname: institution.shortname,
      uuid: institution.uuid,
      sector: institution.sector,
      ts: institution.ts,
      orgs: institution.orgs.map(org => ({
        name: org.name,
        ts_org: org.ts
      }))
    });
  }



}

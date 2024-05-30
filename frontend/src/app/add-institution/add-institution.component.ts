import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { DataService } from '../data.service';
import { v4 as uuidv4 } from 'uuid';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-add-institution',
  templateUrl: './add-institution.component.html',
  styleUrls: ['./add-institution.component.scss'],
})
export class AddInstitutionComponent implements OnInit {
  // Flag to indicate if an existing institution is in edit mode
  isEditMode: boolean = false;
  title = 'template-driven-form';
  formStatus: string = '';
  formdata: any = {};
  reactiveForm: FormGroup;
  dataSource: any;
  displayedColumns: string[] = [
    'edit',
    'name_de',
    'uuid',
    'sector',
    'shortname',
    'ts',
    'orgs',
  ];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    // Load todo TodoInstitutions for the table
    this.dataService.LoadTodoInstitutions().then((data) => {
      this.dataSource = data;
    });

    // Initialize reactive form, add validators for input fields
    this.reactiveForm = new FormGroup({
      name_de: new FormControl(null, [Validators.required]),
      shortname: new FormControl(null, [Validators.required, Validators.pattern(/^(\S*)$/)]),
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
          name: new FormControl(null, [Validators.required, Validators.pattern(/^(\S*)$/)]),
          ts_org: new FormControl(null),
        }),
      ]),
    });
    // Subscribe to form status changes, when the form is valid or invalid
    this.reactiveForm.statusChanges.subscribe((status) => {
      this.formStatus = status;
    });
  }

  // Method called when form is submitted (save/update institution button)
  async OnFormSubmitted() {
    this.formdata = this.reactiveForm.value;
    // Create new todo institution using data service based on what is in the form
    await this.dataService.createNewTodoInstitution(this.formdata);
    // Reset form values after adding a new institution
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
    // Reload data after adding a new institution
    this.dataService.LoadTodoInstitutions().then((data) => {
      this.dataSource = data;
    });
  }

  // Add organization field to form
  AddOrg() {
    (<FormArray>this.reactiveForm.get('orgs')).push(
      new FormGroup({
        name: new FormControl(null, [Validators.required]),
        ts_org: new FormControl(null),
      }),
    );
  }

  // Delete organization field from form
  DeleteOrg(index: number) {
    const controls = <FormArray>this.reactiveForm.get('orgs');
    controls.removeAt(index);
  }

  // Edit existing todoinstitution from the table
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

    // Write values from chosen institution to the form
    this.reactiveForm.patchValue({
      name_de: institution.name_de,
      shortname: institution.shortname,
      uuid: institution.uuid,
      sector: institution.sector,
      ts: institution.ts,
      orgs: institution.orgs.map((org) => ({
        name: org.name,
        ts_org: org.ts,
      })),
    });
  }

  async DeleteInst() {
    // Get form data
    this.formdata = this.reactiveForm.value;
    // Delete todo institution currently in input mask 
    await this.dataService.DeleteTodoInstitution(this.formdata);
    // Reset form values
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

    // Reload all todointitution data after deleting an institution
    this.dataService.LoadTodoInstitutions().then((data) => {
      this.dataSource = data;
    });
  }
  generateUUID(): void {
    if (!this.isEditMode) {
      const newUUID = uuidv4();
      this.reactiveForm.patchValue({ uuid: newUUID });
    }
  }

  // Activate edit mode if edit button is clicked for an existing institution
  activateEditMode(): void {
    this.isEditMode = true;
  }

  // set timestamp for institution and organizations to null
  resetTimestamp() {
    this.reactiveForm.get('ts').setValue(null);
    const orgsControl = <FormArray>this.reactiveForm.get('orgs');
    for (let i = 0; i < orgsControl.length; i++) {
      const orgFormGroup = <FormGroup>orgsControl.at(i);
      orgFormGroup.get('ts_org').setValue(null);
    }
  }
}

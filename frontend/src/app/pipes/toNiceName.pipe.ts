import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'toNiceName' })
export class ToNiceNamePipe implements PipeTransform {
  sectors: { original: string; nice: string }[] = [
    { original: 'ResearchAndEducation', nice: 'Research and education' },
    { original: 'NGOs', nice: 'NGOs' },
    { original: 'Media', nice: 'Media' },
    { original: 'Insurances', nice: 'Insurances' },
    { original: 'IT', nice: 'IT' },
    { original: 'Gov_Federal', nice: 'Federal government' },
    { original: 'Gov_Companies', nice: 'Governmental companies' },
    { original: 'Gov_Cities', nice: 'Cities' },
    { original: 'Gov_Cantons', nice: 'Cantons' },
    { original: 'Communities', nice: 'Communities' },
    { original: 'Banking', nice: 'Banking' },
    { original: 'Others', nice: 'Others' },
    { original: 'true', nice: 'Yes' },
    { original: 'false', nice: 'No' },
  ];

  transform(value: any): string {
    let niceName: any = this.sectors.find(
      (sector) => sector.original == value.toString()
    );
    if (niceName) {
      return niceName.nice;
    }
    return value;
  }
}

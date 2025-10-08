export interface University { code: string; name: string; city: string; type: 'devlet' | 'vakif'; }
export interface Department { code: string; name: string; field: 'sayisal' | 'esitagirlik' | 'sozel' | 'dil'; universityCode: string; }
export interface HighSchool { code: string; name: string; city: string; kind: 'Anadolu' | 'Fen' | 'Meslek' | 'Anadolu Imam Hatip'; }

export const UNIVERSITIES: University[] = [
  { code: 'HAC', name: 'Hacettepe Üniversitesi', city: 'Ankara', type: 'devlet' },
  { code: 'ITU', name: 'İstanbul Teknik Üniversitesi', city: 'İstanbul', type: 'devlet' },
  { code: 'BIL', name: 'Bilkent Üniversitesi', city: 'Ankara', type: 'vakif' },
  { code: 'BOG', name: 'Boğaziçi Üniversitesi', city: 'İstanbul', type: 'devlet' },
  { code: 'EGE', name: 'Ege Üniversitesi', city: 'İzmir', type: 'devlet' },
];

export const DEPARTMENTS: Department[] = [
  { code: 'CS', name: 'Bilgisayar Mühendisliği', field: 'sayisal', universityCode: 'HAC' },
  { code: 'MED', name: 'Tıp', field: 'sayisal', universityCode: 'HAC' },
  { code: 'EE', name: 'Elektrik-Elektronik Müh.', field: 'sayisal', universityCode: 'ITU' },
  { code: 'IE', name: 'Endüstri Mühendisliği', field: 'sayisal', universityCode: 'BOG' },
  { code: 'LAW', name: 'Hukuk', field: 'esitagirlik', universityCode: 'BIL' },
  { code: 'PSY', name: 'Psikoloji', field: 'esitagirlik', universityCode: 'BIL' },
  { code: 'TRH', name: 'Tarih', field: 'sozel', universityCode: 'EGE' },
  { code: 'ELT', name: 'İngilizce Öğretmenliği', field: 'dil', universityCode: 'EGE' },
];

export const HIGH_SCHOOLS: HighSchool[] = [
  { code: 'ANKFEN', name: 'Ankara Fen Lisesi', city: 'Ankara', kind: 'Fen' },
  { code: 'ISTKAB', name: 'Kabataş Erkek Lisesi', city: 'İstanbul', kind: 'Anadolu' },
  { code: 'BORNOVA', name: 'Bornova Anadolu Lisesi', city: 'İzmir', kind: 'Anadolu' },
  { code: 'ANKIMH', name: 'Ankara Anadolu İmam Hatip', city: 'Ankara', kind: 'Anadolu Imam Hatip' },
];



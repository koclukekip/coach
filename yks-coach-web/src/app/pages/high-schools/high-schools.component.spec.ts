import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HighSchoolsComponent } from './high-schools.component';

describe('HighSchoolsComponent', () => {
  let component: HighSchoolsComponent;
  let fixture: ComponentFixture<HighSchoolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HighSchoolsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HighSchoolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

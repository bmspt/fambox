import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpachaMapComponent } from './spacha-map.component';

describe('SpachaMapComponent', () => {
  let component: SpachaMapComponent;
  let fixture: ComponentFixture<SpachaMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpachaMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpachaMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

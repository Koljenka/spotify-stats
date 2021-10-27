import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatSliderComponent } from './stat-slider.component';

describe('StatSliderComponent', () => {
  let component: StatSliderComponent;
  let fixture: ComponentFixture<StatSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatSliderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

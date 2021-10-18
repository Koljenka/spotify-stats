import {MenuComponent} from './menu.component';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MenuComponent ],
      imports: [MatIconModule, MatMenuModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should changeTheme', () => {
    expect(component.changeTheme(null)).toBeUndefined();
  });
});

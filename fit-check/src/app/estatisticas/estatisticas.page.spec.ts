import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EstatisticasPage } from './estatisticas.page';

describe('EstatisticasPage', () => {
  let component: EstatisticasPage;
  let fixture: ComponentFixture<EstatisticasPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EstatisticasPage],
      imports: [IonicModule.forRoot(),]
    }).compileComponents();

    fixture = TestBed.createComponent(EstatisticasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

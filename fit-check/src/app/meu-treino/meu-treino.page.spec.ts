import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { MeuTreinoPage } from './meu-treino.page';

describe('MeuTreinoPage', () => {
  let component: MeuTreinoPage;
  let fixture: ComponentFixture<MeuTreinoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MeuTreinoPage],
      imports: [IonicModule.forRoot(), ExploreContainerComponentModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MeuTreinoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

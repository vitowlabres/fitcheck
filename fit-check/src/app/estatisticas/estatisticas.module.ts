import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstatisticasPage } from './estatisticas.page';

import { EstatisticasPageRoutingModule } from './estatisticas-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    EstatisticasPageRoutingModule
  ],
  declarations: [EstatisticasPage]
})
export class EstatisticasPageModule {}

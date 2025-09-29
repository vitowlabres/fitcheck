import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeuTreinoPage } from './meu-treino.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { MeuTreinoPageRoutingModule } from './meu-treino-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    MeuTreinoPageRoutingModule
  ],
  declarations: [MeuTreinoPage]
})
export class MeuTreinoPageModule {}

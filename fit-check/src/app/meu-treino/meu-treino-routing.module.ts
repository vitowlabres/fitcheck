import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MeuTreinoPage } from './meu-treino.page';

const routes: Routes = [
  {
    path: '',
    component: MeuTreinoPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MeuTreinoPageRoutingModule {}

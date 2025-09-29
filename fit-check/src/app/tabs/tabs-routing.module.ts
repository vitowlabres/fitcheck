import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'meu-treino',
        loadChildren: () => import('../meu-treino/meu-treino.module').then(m => m.MeuTreinoPageModule)
      },
      {
        path: 'estatisticas',
        loadChildren: () => import('../estatisticas/estatisticas.module').then(m => m.EstatisticasPageModule)
      },
      {
        path: 'perfil',
        loadChildren: () => import('../perfil/perfil.module').then(m => m.PerfilPageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/meu-treino',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/meu-treino',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}

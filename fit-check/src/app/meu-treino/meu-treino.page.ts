import { Component } from '@angular/core';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-meu-treino',
  templateUrl: 'meu-treino.page.html',
  styleUrls: ['meu-treino.page.scss'],
  standalone: false,
})
export class MeuTreinoPage {

  treinos: string[] = [];

  constructor(private dbService: DatabaseService) {}

  async ngOnInit() {
    await this.dbService.ready();
    await this.carregarTreinos();
  }

  async carregarTreinos() {
    try {
      this.treinos = await this.dbService.getTreinos();
      console.log('[DB] Treinos carregados:', this.treinos);
      // aqui você pode passar `this.treinos` para o popup/modal
    } catch (err) {
      console.error('[DB] Erro ao buscar treinos:', err);
    }
  }

}

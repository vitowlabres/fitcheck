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
  exercicios: any[] = [];

  constructor(private dbService: DatabaseService) {}

  async ngOnInit() {
    // Espera o serviço de banco de dados estar pronto
    await this.dbService.ready();

    // Carrega os treinos do banco de dados
    await this.carregarTreinos();
  }

  async carregarTreinos() {
    try {
      console.log('[DB] Carregando treinos...');
      this.treinos = await this.dbService.getTreinos();
      console.log('[DB] Treinos carregados:', this.treinos);
      // aqui você pode passar `this.treinos` para o popup/modal
    } catch (err) {
      console.error('[DB] Erro ao buscar treinos:', err);
    }
  }
  

  async selecionarTreino(nome_treino: string): Promise<void> {
    try {
      const id_treino = await this.dbService.getIdTreinoByNome(nome_treino);
      if (!id_treino) {
        console.warn('[DB] Nenhum treino encontrado para:', nome_treino);
        this.exercicios = [];
        return;
      }

      this.exercicios = await this.dbService.getExerciciosPorTreino(id_treino);

      console.log(`[DB] Exercícios do treino "${nome_treino}":`, this.exercicios);
    } catch (err) {
      console.error('[DB] Erro ao carregar exercícios:', err);
    }
  }

  async deletarTreino(nome_treino: string): Promise<void> {
    try {
      const id_treino = await this.dbService.getIdTreinoByNome(nome_treino);
      if (!id_treino) {
        console.warn('[DB] Nenhum treino encontrado para:', nome_treino);
        return;
      }

      await this.dbService.deletarTreino(id_treino);
      await this.carregarTreinos();
      
      console.log(`[DB] Treino "${nome_treino}" deletado.`);
    } catch (err) {
      console.error('[DB] Erro ao deletar treino:', err);
    }
  }
}

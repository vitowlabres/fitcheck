import { Component, ChangeDetectorRef } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ModalController } from '@ionic/angular';
import { PopUpTreinosComponent } from '../pop-up-treinos/pop-up-treinos.component';

@Component({
  selector: 'app-meu-treino',
  templateUrl: 'meu-treino.page.html',
  styleUrls: ['meu-treino.page.scss'],
  standalone: false,
})
export class MeuTreinoPage {

  treinos: string[] = [];
  exercicios: any[] = [];
  treinoSelecionado: string | null = null; 

  constructor(
    private dbService: DatabaseService,
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef) { }

  async ngOnInit() {
    await this.dbService.ready();
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

  async selecionarTreino(nome_treino: string, id_treino?: number): Promise<void> {
  console.log('[DEBUG] selecionarTreino chamado com:', { nome_treino, id_treino });

  try {
    if (!id_treino) {
      id_treino = await this.dbService.getIdTreinoByNome(nome_treino) ?? undefined;
      console.log('[DEBUG] id_treino obtido do DB:', id_treino);

      if (!id_treino) {
        console.warn('[DB] Nenhum treino encontrado para:', nome_treino);
        this.exercicios = [];
        this.treinoSelecionado = null;
        this.cdr.detectChanges();
        return;
      }
    }

    this.treinoSelecionado = nome_treino;
    this.exercicios = await this.dbService.getExerciciosPorTreino(id_treino);
    console.log('[DEBUG] Exercícios carregados:', this.exercicios);

    this.cdr.detectChanges();
  } catch (err) {
    console.error('[DB] Erro ao carregar exercícios:', err);
    this.exercicios = [];
    this.treinoSelecionado = null;
    this.cdr.detectChanges();
  }
}


  async desabilitarTreino(nome_treino: string) {
  await this.dbService.ready();
  try {
    const id_treino = await this.dbService.getIdTreinoByNome(nome_treino);
    if (!id_treino) {
      console.warn('[DB] Nenhum treino encontrado para:', nome_treino);
      return;
    }

    await this.dbService.desabilitarTreino(id_treino);
    this.treinos = this.treinos.filter(t => t !== nome_treino);

  } catch (err) {
    console.error('[DB] Erro ao desabilitar treino:', err);
  }
}

  async abrirModal() {
    const modal = await this.modalCtrl.create({
      component: PopUpTreinosComponent,
      componentProps: { treinos: this.treinos },
      cssClass: 'pop-up-treinos-modal',
    });

    await modal.present();

    // espera o usuario fechar o modal; captura o dado enviado no dismiss()
    const { data } = await modal.onDidDismiss();
    console.log('[DEBUG MODAL] Dados retornados do modal:', data);
    if (data?.nome_treino) {
      // se o pop-up já devolveu o id, evita busca extra
      await this.selecionarTreino(data.nome_treino, data.id_treino);
    }

    // sincronia: recarrega lista de treinos (caso tenham sido desabilitados dentro do popup)
    await this.carregarTreinos();
  }


}

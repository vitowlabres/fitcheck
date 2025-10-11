import { Component, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
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
  criandoTreino: boolean = false;
  novoTreinoNome: string = '';
  idTreinoAtual: number | null = null;

    // Campos do formulário de adição de exercício
  novoExercicio: any = {
    exercicio: null,
    series: null,
    repeticoes: null,
    carga: null
  };
  listaExercicios: any[] = [];

   @ViewChild('inputNovoTreino', { static: false }) inputNovoTreino!: ElementRef;

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
      this.treinos = await this.dbService.getTreinos();
    } catch (err) {
      console.error('[DB] Erro ao buscar treinos:', err);
    }
  }

  async buscarIdTreinoPorNome(nome: string): Promise<number | null> {
    try {
      const id = await this.dbService.getIdTreinoByNome(nome);
      this.idTreinoAtual = id ?? null;
      console.log('[DEBUG] ID do treino encontrado:', this.idTreinoAtual);
      return this.idTreinoAtual;
    } catch (err) {
      console.error('[DB] Erro ao buscar ID do treino:', err);
      return null;
    }
  }

  async selecionarTreino(nome_treino: string, id_treino?: number): Promise<void> {
    try {
      if (!id_treino) {
        id_treino = await this.dbService.getIdTreinoByNome(nome_treino) ?? undefined;
        if (!id_treino) return;
      }
      this.treinoSelecionado = nome_treino;
      this.exercicios = await this.dbService.getExerciciosPorTreino(id_treino);
      this.cdr.detectChanges();
    } catch (err) {
      console.error('[DB] Erro ao carregar exercícios:', err);
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

  async adicionarExercicioAoTreino() {
    try {
      if (!this.idTreinoAtual) {
        console.warn('[APP] Nenhum treino selecionado.');
        return;
      }

      const { exercicio, series, repeticoes, carga } = this.novoExercicio;

      if (!exercicio || !series || !repeticoes || carga === null || carga === undefined) {
        console.warn('[APP] Campos incompletos para adicionar exercício.');
        return;
      }

      const idExercicio = exercicio;

      await this.dbService.addTreino_exercicios(
        this.idTreinoAtual,
        idExercicio,
        series,
        repeticoes,
        carga
      );

      // recarrega lista de exercícios do treino
      this.exercicios = await this.dbService.getExerciciosPorTreino(this.idTreinoAtual);

      // limpa campos
      this.novoExercicio = { exercicio: null, series: null, repeticoes: null, carga: null };

      console.log('[APP] Exercício adicionado com sucesso!');
    } catch (err) {
      console.error('[DB] Erro ao adicionar exercício ao treino:', err);
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

  // Criar novo treino
  criarTreino() {
    this.criandoTreino = true;
    this.novoTreinoNome = '';
    this.exercicios = [];

    setTimeout(() => {
      this.inputNovoTreino?.nativeElement?.focus();
    }, 300);
  }

  async salvarNomeTreino() {
    const nome = this.novoTreinoNome.trim();
    if (!nome) return;

    try {
      await this.dbService.ready();
      const id_treino = await this.dbService.addTreino(nome);
      this.treinoSelecionado = nome;
      this.criandoTreino = false;
      await this.carregarTreinos();
      await this.buscarIdTreinoPorNome(nome);

      // carrega exercícios possíveis para o dropdown
      this.listaExercicios = await this.dbService.getExercicios();
      console.log('[DEBUG] Lista de exercícios para seleção:', this.listaExercicios);
    } catch (err) {
      console.error('[DB] Erro ao criar novo treino:', err);
    }
  }

  finalizarCriacaoTreino() {
    // Quando o treino for finalizado, o formulário de novo exercício é ocultado
    this.idTreinoAtual = null;
    console.log('[APP] Criação do treino finalizada.');
  }

}
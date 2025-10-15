import { Component, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ModalController, ToastController} from '@ionic/angular';
import { PopUpTreinosComponent } from '../pop-up-treinos/pop-up-treinos.component';
import { NotificacaoService } from '../services/notificacao.service';

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
  treinoEmCriacao: boolean = false; 
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
    private cdr: ChangeDetectorRef,
    private toastCtrl: ToastController,
    private nfService: NotificacaoService
  ) { }

  async ngOnInit() {
    await this.dbService.ready();
    await this.carregarTreinos();
  }

  async carregarTreinos() {
    try {
      this.treinos = await this.dbService.getTreinos();
    } catch (err) {
      console.error('[MT] Erro ao buscar treinos:', err);
    }
  }

  async buscarIdTreinoPorNome(nome: string): Promise<number | null> {
    try {
      const id = await this.dbService.getIdTreinoByNome(nome);
      this.idTreinoAtual = id ?? null;
      console.log('[MT] ID do treino encontrado:', this.idTreinoAtual);
      return this.idTreinoAtual;
    } catch (err) {
      console.error('[MT] Erro ao buscar ID do treino:', err);
      return null;
    }
  }

  async selecionarTreino(nome_treino: string, id_treino?: number): Promise<void> {
    try {
      if (!id_treino) {
        id_treino = await this.dbService.getIdTreinoByNome(nome_treino) ?? undefined;
        if (!id_treino) return;
      }
      this.idTreinoAtual = id_treino;
      this.treinoSelecionado = nome_treino;
      this.exercicios = await this.dbService.getExerciciosPorTreino(id_treino);

      // Inicializa campos 'Feitos' com os valores de meta
      this.exercicios.forEach(ex => {
        ex.series_feito = ex.series_feito ?? ex.series_meta;
        ex.repeticao_feita = ex.repeticao_feita ?? ex.repeticao_meta;
        ex.carga_feita = ex.carga_feita ?? ex.carga_meta;
      });
      this.cdr.detectChanges();

    } catch (err) {
      console.error('[MT] Erro ao carregar exercícios:', err);
    }
  }

  async desabilitarTreino(nome_treino: string) {
    await this.dbService.ready();
    try {
      const id_treino = await this.dbService.getIdTreinoByNome(nome_treino);
      if (!id_treino) {
        console.warn('[MT] Nenhum treino encontrado para:', nome_treino);
        return;
      }

      await this.dbService.desabilitarTreino(id_treino);
      this.treinos = this.treinos.filter(t => t !== nome_treino);

    } catch (err) {
      console.error('[MT] Erro ao desabilitar treino:', err);
    }
  }

  async adicionarExercicioAoTreino() {
    try {
      if (!this.idTreinoAtual) {
        console.warn('[MT] Nenhum treino selecionado.');
        return;
      }

      const { exercicio, series, repeticoes, carga } = this.novoExercicio;

      if (!exercicio || !series || !repeticoes || carga === null || carga === undefined) {
        console.warn('[MT] Campos incompletos para adicionar exercício.');
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

      console.log('[MT] Exercício adicionado com sucesso!');
    } catch (err) {
      console.error('[MT] Erro ao adicionar exercício ao treino:', err);
    }
  }

  // Abre o modal de seleção de treinos
  async abrirModal() {
    const modal = await this.modalCtrl.create({
      component: PopUpTreinosComponent,
      componentProps: { treinos: this.treinos },
      cssClass: 'pop-up-treinos-modal',
    });

    await modal.present();

    // espera o usuario fechar o modal; captura o dado enviado no dismiss()
    const { data } = await modal.onDidDismiss();
    console.log('[MT] Dados retornados do modal:', data);
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
    this.treinoEmCriacao = true;
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
      this.criandoTreino = true;
      this.treinoEmCriacao = false;
      await this.carregarTreinos();
      await this.buscarIdTreinoPorNome(nome);
      this.idTreinoAtual = await this.buscarIdTreinoPorNome(nome);

      // carrega exercícios possíveis para o dropdown
      this.listaExercicios = await this.dbService.getExercicios();
      console.log('[MT] Lista de exercícios para seleção:', this.listaExercicios);
    } catch (err) {
      console.error('[MT] Erro ao criar novo treino:', err);
    }
  }

  async finalizarCriacaoTreino() {
    try {
      if (!this.idTreinoAtual || !this.treinoSelecionado) {
        console.warn('[MT] Nenhum treino ativo para finalizar.');
        return;
      }

      const toast = await this.toastCtrl.create({
        message: 'Treino criado com sucesso!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
            
      // Carrega os exercícios do treino recém-criado
      this.exercicios = await this.dbService.getExerciciosPorTreino(this.idTreinoAtual);

      // Oculta o formulário de adição de novo exercício
      this.criandoTreino = false;

      // Preenche campos 'Feitos' com os valores de meta
      this.exercicios.forEach(ex => {
        ex.series_feito = ex.series_feito ?? ex.series_meta;
        ex.repeticao_feita = ex.repeticao_feita ?? ex.repeticao_meta;
        ex.carga_feita = ex.carga_feita ?? ex.carga_meta;
      });

      // Atualiza tela (força detecção manual por segurança)
      this.cdr.detectChanges();
      
      console.log('[MT] Criação do treino finalizada e exercícios carregados.');

    } catch (err) {
      console.error('[MT] Erro ao finalizar criação do treino:', err);
    }
  }

  // Registra o treino feito na tabela histórico
  async registrarTreinoFeito() {
    if (!this.idTreinoAtual || !this.exercicios?.length) {
      console.warn('[MT] Não há treino ativo ou lista de exercícios vazia.');
      return;
    }

    for (const ex of this.exercicios) {
      // validação leve: garante que temos id_exercicio antes de gravar
      if (!ex.id_exercicio) {
        console.warn('[MT] Exercício sem id_exercicio — pulando:', ex);
        continue;
      }

      await this.dbService.addHistorico(
        this.idTreinoAtual,
        ex.id_exercicio,
        ex.carga_feita || 0,
        ex.repeticao_feita || 0,
        ex.series_feito || 0,
        ex.carga_meta || 0,
        ex.repeticao_meta || 0,
        ex.series_meta || 0
      );
    }

    //Envia notificação de push de treino concluído
    this.nfService.notificarTreinoConcluido();

    const toast = await this.toastCtrl.create({
      message: 'O seu treino foi registrado!',
      duration: 1500,
      color: 'success'
    });
    await toast.present();
    

    console.log('[MT] Histórico registrado com sucesso!');
  }
 
}
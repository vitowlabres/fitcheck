import { Component, OnInit  } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip, registerables  } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip, ...registerables);

@Component({
  selector: 'app-estatisticas',
  templateUrl: 'estatisticas.page.html',
  styleUrls: ['estatisticas.page.scss'],
  standalone: false,
})
export class EstatisticasPage implements OnInit {
  diasSemana: string[] = [
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado',
    'domingo'
  ];

  coresDias: { [dia: string]: string } = {}; // guarda cor dinâmica por dia
  treinoSelecionado: any = null;
  exercicios: any[] = [];
  progressoGeral: number = 0;
  grafico: Chart | null = null;
  diaSelecionado: string = '';
  nomeTreino: string = ''
  ultimaData: string = '';
  progressValue: number = 0; // valor de progresso entre 0 e 1
  graficoEvolucao: any = null;


  constructor(private dbService: DatabaseService) {}

  async ngOnInit() {
    console.log('Página carregada');
    await this.atualizarCoresDias();
  }
  
  async atualizarCoresDias() {
    console.log('[UI] Atualizando cores dos dias...');
    this.coresDias = {}; // reinicia o mapa de cores

    for (const dia of this.diasSemana) {
      const treino = await this.dbService.getUltimoTreinoPorDiaSemana(dia);

      if (!treino || !treino.exercicios || treino.exercicios.length === 0) {
        // sem treino nesse dia
        this.coresDias[dia] = 'medium'; // cinza
        continue;
      }

      const metaTotal = treino.exercicios.reduce(
        (acc, e) => acc + (e.carga_meta ?? 0) * (e.series_meta ?? 1),
        0
      );
      const feitoTotal = treino.exercicios.reduce(
        (acc, e) => acc + (e.carga_feita ?? 0) * (e.series_feito ?? 1),
        0
      );

      const perc = metaTotal > 0 ? (feitoTotal / metaTotal) * 100 : 0;

      if (perc >= 90) this.coresDias[dia] = 'success'; // verde
      else if (perc >= 60) this.coresDias[dia] = 'warning'; // amarelo
      else this.coresDias[dia] = 'danger'; // vermelho
    }

    console.log('[UI] Cores dos dias atualizadas:', this.coresDias);
  }


  // Cor dinâmica para cada botão
  getCorDoDia(dia: string): string {
    return this.coresDias[dia] || 'medium';
  }

  async selecionarDia(dia: string) {
    console.log('[UI] Dia selecionado:', dia);
    this.diaSelecionado = dia;

    const treino = await this.dbService.getUltimoTreinoPorDiaSemana(dia);
    const cor = this.getCorDoDia(dia);
    this.treinoSelecionado = treino;
    
    if (!treino || cor === 'medium') {
      console.warn('[UI] Nenhum treino encontrado para o dia:', dia);
      this.nomeTreino = '';
      this.ultimaData = '';
      this.exercicios = [];
      this.progressoGeral = 0;
      this.criarGraficoTreino([]);
      return;
    }

    this.nomeTreino = treino.nome_treino;
    this.ultimaData = treino.ultima_data;
    this.exercicios = treino.exercicios;

    const metaTotal = this.exercicios.reduce((acc, e) => acc + (e.carga_meta || 0), 0);
    const feitoTotal = this.exercicios.reduce((acc, e) => acc + (e.carga_feita || 0), 0);
    this.progressoGeral = metaTotal > 0 ? (feitoTotal / metaTotal) * 100 : 0;

    console.log('[UI] Progresso atualizado:', this.progressoGeral);

    this.criarGraficoTreino(this.exercicios);
  }


  // Exemplo: exibir gráfico ao escolher exercício
  async selecionarExercicio(exercicio: any) {
    console.log('[TS] Exercício selecionado:', exercicio);
    await this.criarGraficoEvolucaoCarga(exercicio);
  }

  destruirGrafico() {
    if (this.grafico) {
      this.grafico.destroy();
      this.grafico = null;
    }
  }

  criarGraficoTreino(exercicios: any[] = this.exercicios) {
    if (!exercicios || exercicios.length === 0) {
      if (this.grafico) {
        this.grafico.destroy();
        this.grafico = null;
      }
      return;
    }

    const labels = exercicios.map(e => e.nome);
    const feitos = exercicios.map(e => e.repeticao_feita ?? 0);
    const metas = exercicios.map(e => e.repeticao_meta ?? 0);

    const data = {
      labels,
      datasets: [
        {
          label: 'Feito (rep)',
          data: feitos,
          backgroundColor: 'rgba(54,162,235,0.8)',
        },
        {
          label: 'Meta (rep)',
          data: metas,
          backgroundColor: 'rgba(255,99,132,0.6)',
        },
      ],
    };

    // Destroi gráfico anterior se já existir
    if (this.grafico) {
      this.grafico.destroy();
    }

    const canvas = document.getElementById('graficoTreino') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.grafico = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            position: 'top',
          },
        },
      },
    });
  }

  async criarGraficoEvolucaoCarga(exercicio: any) {
    if (!this.treinoSelecionado || !exercicio) return;
    
    // Obtém os dados de evolução da carga
    const dados = await this.dbService.getEvolucaoCargaPorTreino(this.treinoSelecionado.id_treino);

    // Filtra apenas os registros do exercício selecionado
    const dadosFiltrados = dados.filter((d: any) => d.nome_exercicio === exercicio.nome);

    if (dadosFiltrados.length === 0) {
      console.warn('[TS] Sem dados de evolução para este exercício.');
      if (this.graficoEvolucao) {
        this.graficoEvolucao.destroy();
        this.graficoEvolucao = null;
      }
      return;
    }

    const labels = dadosFiltrados.map((d: any) => d.data);
    const valores = dadosFiltrados.map((d: any) => d.carga_media);

    // Destroi gráfico antigo se existir
    if (this.graficoEvolucao) {
      this.graficoEvolucao.destroy();
    }

    const canvas = document.getElementById('graficoEvolucaoCarga') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.graficoEvolucao = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `Evolução de carga - ${exercicio.nome}`,
            data: valores,
            borderColor: 'rgba(54,162,235,0.9)',
            backgroundColor: 'rgba(54,162,235,0.3)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }


}

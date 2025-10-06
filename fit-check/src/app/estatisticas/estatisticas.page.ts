import { Component, OnInit  } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

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

  constructor(private dbService: DatabaseService) {}

  async ngOnInit() {
    console.log('Página carregada');
    await this.atualizarCoresDias();
  }
  
  // Atualiza cor dos botões de acordo com o desempenho
  async atualizarCoresDias() {
    for (const dia of this.diasSemana) {
      const treino = await this.dbService.getUltimoTreinoPorDiaSemana(dia);
      if (treino) {
        const exercicios = await this.dbService.getExerciciosPorTreinoHistorico(treino.id_treino);
        const metaTotal = exercicios.reduce((acc, e) => acc + (e.carga_meta || 0), 0);
        const feitoTotal = exercicios.reduce((acc, e) => acc + (e.carga_feita || 0), 0);
        const perc = metaTotal > 0 ? (feitoTotal / metaTotal) * 100 : 0;

        // define a cor conforme desempenho
        if (perc >= 90) this.coresDias[dia] = 'success';   // verde
        else if (perc >= 60) this.coresDias[dia] = 'warning'; // amarelo
        else this.coresDias[dia] = 'danger';                 // vermelho
      } else {
        this.coresDias[dia] = 'medium'; // cinza (sem treino)
      }
    }
  }

  // Cor dinâmica para cada botão
  getCorDoDia(dia: string): string {
    return this.coresDias[dia] || 'medium';
  }

  // Seleciona um dia e carrega dados correspondentes
  async selecionarDia(dia: string) {
    const treino = await this.dbService.getUltimoTreinoPorDiaSemana(dia);
    if (!treino) {
      console.warn(`[DB] Nenhum treino encontrado para ${dia}`);
      this.treinoSelecionado = null;
      this.exercicios = [];
      this.progressoGeral = 0;
      this.destruirGrafico();
      return;
    }

    this.treinoSelecionado = treino;
    this.exercicios = await this.dbService.getExerciciosPorTreinoHistorico(treino.id_treino);

    const metaTotal = this.exercicios.reduce((acc, e) => acc + (e.carga_meta || 0), 0);
    const feitoTotal = this.exercicios.reduce((acc, e) => acc + (e.carga_feita || 0), 0);
    this.progressoGeral = metaTotal > 0 ? (feitoTotal / metaTotal) * 100 : 0;

    setTimeout(() => {
      this.criarGraficoTreino();
    }, 100);
  }

  // Exemplo: exibir gráfico ao escolher exercício
  selecionarExercicio(exercicio: any) {
    console.log('Exercício selecionado:', exercicio);
    // aqui entra o Chart.js futuramente
  }

  destruirGrafico() {
    if (this.grafico) {
      this.grafico.destroy();
      this.grafico = null;
    }
  }

  criarGraficoTreino() {
    
    this.destruirGrafico();
    if (!this.exercicios.length) return;

    const nomes = this.exercicios.map(e => e.nome_exercicio);
    const feitos = this.exercicios.map(e => e.carga_feita);
    const metas = this.exercicios.map(e => e.carga_meta);

    const ctx = document.getElementById('graficoTreino') as HTMLCanvasElement;

    this.grafico = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: nomes,
        datasets: [
          {
            label: 'Feito (kg)',
            data: feitos,
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
          },
          {
            label: 'Meta (kg)',
            data: metas,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: { enabled: true }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { beginAtZero: true }
        }
      }
    });
  }
}

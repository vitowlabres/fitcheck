import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.scss'],
  standalone: false,
})
export class PerfilPage implements OnInit {

  treinadores: any[] = [];
  nomeFiltro: string = '';
  cidadeFiltro: string = '';
  ufFiltro: string = '';
  treinadoresFiltrados: any[] = [];
  cidades: string[] = [];
  ufs: string[] = [];

  constructor(private dbService: DatabaseService) {}

  async ngOnInit() {
    await this.dbService.ready();
    this.treinadores = await this.dbService.getTreinadores();

    // popula os filtros de cidade e UF automaticamente com base nos dados do banco
    this.cidades = [...new Set(this.treinadores.map(t => t.cidade))];
    this.ufs = [...new Set(this.treinadores.map(t => t.UF))];

    // exibe todos inicialmente
    this.treinadoresFiltrados = [...this.treinadores];
  }

  aplicarFiltros() {
    const nome = this.nomeFiltro.toLowerCase();
    const cidade = this.cidadeFiltro;
    const uf = this.ufFiltro;

    this.treinadoresFiltrados = this.treinadores.filter(t => {
      const matchNome = !nome || t.nome.toLowerCase().includes(nome);
      const matchCidade = !cidade || t.cidade === cidade;
      const matchUf = !uf || t.UF === uf;
      return matchNome && matchCidade && matchUf;
    });
  }
}
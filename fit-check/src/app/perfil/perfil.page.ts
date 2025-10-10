import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheetController } from '@ionic/angular';																		   

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
  fotoPerfil: string | null = null;								   

  constructor(private dbService: DatabaseService, private actionSheetCtrl: ActionSheetController) {}

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

  temFiltro(): boolean {
    const nome = (this.nomeFiltro || '').toString().trim();
    return !!nome || !!this.cidadeFiltro || !!this.ufFiltro;
  }

  async selecionarFoto() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Selecionar Foto',
      buttons: [
        {
          text: 'Tirar Foto',
          icon: 'camera-outline',
          handler: () => this.tirarFoto(),
        },
        {
          text: 'Escolher da Galeria',
          icon: 'image-outline',
          handler: () => this.escolherFoto(),
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close',
        },
      ],
    });

    await actionSheet.present();
  }

  async escolherFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos, // 📁 abre a galeria
      });

      this.fotoPerfil = image.dataUrl ?? null;
    } catch (error) {
      console.log('Erro ao escolher foto:', error);
    }
  }

  async tirarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera, // 📸 abre a câmera
      });

      this.fotoPerfil = image.dataUrl ?? null;
    } catch (error) {
      console.log('Erro ao tirar foto:', error);
    }
  }

}
import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-pop-up-treinos',
  templateUrl: './pop-up-treinos.component.html',
  styleUrls: ['./pop-up-treinos.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule] // importa tudo que o HTML usa
})
export class PopUpTreinosComponent {

  @Input() treinos: string[] = [];

  constructor(
    private modalCtrl: ModalController,
    private dbService: DatabaseService
  ) {}

  fechar() {
    this.modalCtrl.dismiss();
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
}

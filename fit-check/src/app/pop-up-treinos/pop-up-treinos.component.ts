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

  async deletarTreino(nome_treino: string) {
    try {
      const id_treino = await this.dbService.getIdTreinoByNome(nome_treino);
      if (!id_treino) return;

      await this.dbService.deletarTreino(id_treino);
      this.treinos = this.treinos.filter(t => t !== nome_treino);

    } catch (err) {
      console.error('[DB] Erro ao deletar treino:', err);
    }
  }
}

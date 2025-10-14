import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { DatabaseService } from './services/database.service';
import { NotificacaoService } from './services/notificacao.service';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements AfterViewInit, OnDestroy {
  constructor(private dbService: DatabaseService, private nfService: NotificacaoService) {}

  async ngAfterViewInit() {
    await this.dbService.deleteDatabase();
    await this.dbService.initializeDatabase();
    await this.nfService.solicitarPermissao();
    await this.configurarCanalNotificacoes();
  }

  async ngOnDestroy() {
    await this.dbService.closeDatabase();
  }

  async configurarCanalNotificacoes() {
    await LocalNotifications.createChannel({
      id: 'treino_channel',
      name: 'Notificações de Treino',
      description: 'Alertas e mensagens de treino',
      importance: 5, // IMPORTANCE_HIGH = 5
      visibility: 1, // VISIBILITY_PUBLIC
      sound: 'default',
      vibration: true,
    });
    console.log('Canal de notificação configurado');
  }
}

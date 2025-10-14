import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root',
})
export class NotificacaoService {
    async solicitarPermissao() {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') {
        console.log('Permissão concedida para notificações locais');
        } else {
        console.warn('Permissão negada');
        }
    }

    async agendarNotificacao() {
        // Define o horário alvo: 10h da manhã
        const agora = new Date();
        const proximaExecucao = new Date();
        proximaExecucao.setHours(10, 0, 0, 0); // 10:00:00

        // Se já passou das 10h hoje, agenda para amanhã
        if (proximaExecucao <= agora) {
        proximaExecucao.setDate(proximaExecucao.getDate() + 1);
        }

        await LocalNotifications.schedule({
        notifications: [
            {
            id: 1,
            title: 'Já treinou hoje?',
            body: 'Não se esqueça de registrar seu treino de hoje!',
            schedule: {
                at: proximaExecucao,
                repeats: true,
                every: 'day',
            },
            sound: 'default',
            smallIcon: 'ic_launcher',
            },
        ],
        });

        console.log('Notificação diária agendada para as 10h');
    }

    async notificarTreinoConcluido() {
        // Gera um id seguro (entre 1 e 1.000.000)
        const notificationId = Math.floor(Math.random() * 1000000) + 1;
        await LocalNotifications.schedule({
        notifications: [
            {
                id: notificationId,
                title: 'Ótimo treino!',
                body: 'Confira a sua evolução!',
                schedule: { at: new Date(Date.now() + 500) },
                sound: 'default',
                smallIcon: 'ic_launcher',
                channelId: 'treino_channel',
                ongoing: false,
                autoCancel: true,
            },
        ],
        });

    console.log('Notificação de treino concluído enviada');
  }
}
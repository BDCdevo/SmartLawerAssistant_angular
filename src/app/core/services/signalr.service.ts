import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private toastr = inject(ToastrService);
  private authService = inject(AuthService);

  private hubConnection?: signalR.HubConnection;

  startConnection(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRHub, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR Connected');
        this.registerNotificationHandler();
      })
      .catch(err => console.error('SignalR Connection Error:', err));
  }

  private registerNotificationHandler(): void {
    this.hubConnection?.on('ReceiveNotification', (notification: any) => {
      this.toastr.info(notification.message, notification.title, {
        timeOut: 5000,
        progressBar: true
      });
    });
  }

  stopConnection(): void {
    this.hubConnection?.stop().then(() => console.log('SignalR Disconnected'));
  }
}

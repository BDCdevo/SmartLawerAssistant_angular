import { Injectable, inject, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  private toastr = inject(ToastrService);
  private authService = inject(AuthService);

  private hubConnection?: signalR.HubConnection;
  private isConnected = false;

  startConnection(): void {
    const token = this.authService.getToken();
    if (!token) {
      // Silently skip - no token available
      return;
    }

    // Don't start if already connected
    if (this.isConnected) {
      return;
    }

    // Build SignalR connection with better error handling
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}${environment.signalRHub}`, {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        withCredentials: true
      })
      .configureLogging(signalR.LogLevel.Error) // Only log errors
      .withAutomaticReconnect([1000, 2000, 5000, 10000]) // Retry with delays
      .build();

    this.hubConnection
      .start()
      .then(() => {
        this.isConnected = true;
        console.log('✅ SignalR Connected - Real-time notifications enabled');
        this.registerNotificationHandler();
      })
      .catch(() => {
        // Silently fail - SignalR notifications are optional
        this.isConnected = false;
        // Don't show any errors to user - notifications are optional feature
      });
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
    if (this.hubConnection && this.isConnected) {
      this.hubConnection.stop().then(() => {
        this.isConnected = false;
        console.log('🔌 SignalR Disconnected');
      }).catch(err => {
        console.error('Error disconnecting SignalR:', err);
      });
    }
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }

  // Check if SignalR is connected
  get connected(): boolean {
    return this.isConnected;
  }
}

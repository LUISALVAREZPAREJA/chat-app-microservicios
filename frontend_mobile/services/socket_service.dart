// flutter_app/services/socket_service.dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

class SocketService {
  IO.Socket? socket;

  SocketService() {
    if (kIsWeb) {
      socket = IO.io('http://localhost:52208/api/..', IO.OptionBuilder().setTransports(['websocket']).build());
    } else {
      socket = IO.io('http://localhost:52208/api/..', <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
      });
    }

    socket?.connect();

    socket?.onConnect((_) {
      print('Socket conectado');
    });

    socket?.onDisconnect((_) {
      print('Socket desconectado');
    });

    socket?.onError((err) => print(err));
  }

  void joinChat(String userEmail) {
    socket?.emit('join', userEmail);
  }

  void listenForNewMessages(Function(dynamic) onNewMessage) {
    socket?.on('nueva_notificacion', (data) => onNewMessage(data));
  }

  void disconnect() {
    socket?.disconnect();
  }
}
// flutter_app/services/message_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';

const String baseUrl = 'http://localhost:52208/api/mensajes';

Future<List<dynamic>> getMessagesBetween(String correo1, String correo2) async {
  final response = await http.get(
    Uri.parse('$baseUrl/messages/between?correo1=$correo1&correo2=$correo2'),
    headers: {'Content-Type': 'application/json'},
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body)['mensajes']; // Asume que el backend devuelve {'mensajes': []}
  } else {
    throw Exception('Error al obtener mensajes');
  }
}

Future<void> sendMessage(String texto, List<String> destinatarios, String remitente, String? urlArchivo) async {
  final response = await http.post(
    Uri.parse('$baseUrl/messages'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'texto': texto,
      'destinatarios': destinatarios,
      'remitente': remitente,
      'urlArchivo': urlArchivo,
    }),
  );

  if (response.statusCode != 201) {
    throw Exception('Error al enviar mensaje');
  }
}
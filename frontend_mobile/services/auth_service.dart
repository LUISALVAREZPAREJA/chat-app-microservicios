// flutter_app/services/auth_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';

const String baseUrl = 'http://localhost:52208/api/login';

Future<Map<String, dynamic>> login(String correo, String contrasena) async {
  final response = await http.post(
    Uri.parse('$baseUrl/users/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'correo': correo, 'contraseña': contrasena}),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body); // Asume que el backend devuelve datos del usuario
  } else {
    throw Exception('Error al iniciar sesión');
  }
}

Future<Map<String, dynamic>> register(String nombre, String correo, String contrasena) async {
  final response = await http.post(
    Uri.parse('$baseUrl/users/register'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'nombre': nombre, 'correo': correo, 'contraseña': contrasena}),
  );

  if (response.statusCode == 201) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Error al registrar usuario');
  }
}
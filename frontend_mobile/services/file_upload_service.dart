// flutter_app/services/file_upload_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

Future<String> uploadFile(File file) async {
  final uri = Uri.parse('http://localhost:52208/api/files/upload'); // Endpoint de subida
  final request = http.MultipartRequest('POST', uri);
  request.files.add(await http.MultipartFile.fromPath('file', file.path)); // 'file' debe coincidir con el nombre esperado por el backend

  final response = await request.send();

  if (response.statusCode == 200) {
    final respStr = await response.stream.bytesToString();
    return jsonDecode(respStr)['url']; // Asume que el backend devuelve un JSON con la URL
  } else {
    throw Exception('Error al subir el archivo');
  }
}
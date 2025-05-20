// Flutter Chat App (main.dart)

// Requiere:
// flutter pub add http file_picker

import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:file_picker/file_picker.dart';

void main() => runApp(ChatApp());

class ChatApp extends StatelessWidget {
  const ChatApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chat con Archivos',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: ChatPage(),
    );
  }
}

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  _ChatPageState createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final TextEditingController _messageController = TextEditingController();
  File? _selectedFile;
  String? _uploadedFileUrl;
  final String backendUrl = 'http://10.0.2.2:5000'; // Cambia por IP real si es necesario

  Future<void> pickFile() async {
    final result = await FilePicker.platform.pickFiles();
    if (result != null && result.files.single.path != null) {
      setState(() => _selectedFile = File(result.files.single.path!));
    }
  }

  Future<void> uploadFile() async {
    if (_selectedFile == null) return;
    final uri = Uri.parse('$backendUrl/api/file/upload');
    final request = http.MultipartRequest('POST', uri)
      ..files.add(await http.MultipartFile.fromPath('archivo', _selectedFile!.path));

    final response = await request.send();
    final responseData = await response.stream.bytesToString();

    if (response.statusCode == 200) {
      final data = jsonDecode(responseData);
      setState(() => _uploadedFileUrl = data['archivoUrl']);
    } else {
      print('Error subiendo archivo');
    }
  }

  Future<void> sendMessage() async {
    if (_messageController.text.isEmpty) return;
    if (_selectedFile != null && _uploadedFileUrl == null) {
      await uploadFile();
    }

    final uri = Uri.parse('$backendUrl/api/message');
    final body = jsonEncode({
      'mensaje': _messageController.text,
      'destinatarios': 'user1,user2', // Simulado
      'archivoUrl': _uploadedFileUrl ?? ''
    });

    final response = await http.post(uri,
      headers: {'Content-Type': 'application/json'},
      body: body
    );

    if (response.statusCode == 201) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Mensaje enviado')));
      _messageController.clear();
      setState(() {
        _selectedFile = null;
        _uploadedFileUrl = null;
      });
    } else {
      print('Error enviando mensaje');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Chat con Archivos')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _messageController,
              decoration: InputDecoration(labelText: 'Mensaje'),
            ),
            SizedBox(height: 10),
            Row(
              children: [
                ElevatedButton(
                  onPressed: pickFile,
                  child: Text(_selectedFile == null ? 'Seleccionar archivo' : 'Cambiar archivo')
                ),
                SizedBox(width: 10),
                if (_selectedFile != null) Text(_selectedFile!.path.split('/').last),
              ],
            ),
            Spacer(),
            ElevatedButton(
              onPressed: sendMessage,
              child: Text('Enviar mensaje'),
            ),
          ],
        ),
      ),
    );
  }
}

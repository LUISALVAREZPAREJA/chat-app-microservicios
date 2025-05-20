import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

// Modelos
class Usuario {
  final String nombre;
  final String correo;
  Usuario({required this.nombre, required this.correo});
  factory Usuario.fromJson(Map<String, dynamic> json) => Usuario(nombre: json['nombre'], correo: json['correo']);
}

class Mensaje {
  final String texto;
  final String remitente;
  final String destinatario;
  final String? urlArchivo;
  final String fecha;
  Mensaje({required this.texto, required this.remitente, required this.destinatario, this.urlArchivo, required this.fecha});
  factory Mensaje.fromJson(Map<String, dynamic> json) => Mensaje(texto: json['texto'], remitente: json['remitente'], destinatario: json['destinatario'], urlArchivo: json['urlArchivo'], fecha: json['fecha']);
}

// Providers
class UserProvider with ChangeNotifier {
  Usuario? _usuario;
  final String _baseUrl;
  UserProvider(this._baseUrl);
  Usuario? get usuario => _usuario;

  Future<void> login(String correo, String contrasena) async {
    final response = await http.post(Uri.parse('$_baseUrl/users/login'), headers: {'Content-Type': 'application/json'}, body: jsonEncode({'correo': correo, 'contraseña': contrasena}));
    if (response.statusCode == 200) {
      _usuario = Usuario.fromJson(jsonDecode(response.body));
      notifyListeners();
    } else {
      throw Exception('Error al iniciar sesión');
    }
  }

  Future<void> register(String nombre, String correo, String contrasena) async {
    final response = await http.post(Uri.parse('$_baseUrl/users/register'), headers: {'Content-Type': 'application/json'}, body: jsonEncode({'nombre': nombre, 'correo': correo, 'contraseña': contrasena}));
    if (response.statusCode == 201) {
      _usuario = Usuario.fromJson(jsonDecode(response.body));
      notifyListeners();
    } else {
      throw Exception('Error al registrarse');
    }
  }

  void logout() {
    _usuario = null;
    notifyListeners();
  }
}

// Servicios
class MessageService {
  final String _baseUrl;
  MessageService(this._baseUrl);

  Future<List<Mensaje>> getMessagesBetween(String correo1, String correo2) async {
    final response = await http.get(Uri.parse('$_baseUrl/messages/between?correo1=$correo1&correo2=$correo2'), headers: {'Content-Type': 'application/json'});
    if (response.statusCode == 200) {
      return (jsonDecode(response.body)['mensajes'] as List).map((json) => Mensaje.fromJson(json)).toList();
    } else {
      throw Exception('Error al obtener mensajes');
    }
  }

  Future<void> sendMessage(String texto, List<String> destinatarios, String remitente, String? urlArchivo) async {
    final response = await http.post(Uri.parse('$_baseUrl/messages'), headers: {'Content-Type': 'application/json'}, body: jsonEncode({'texto': texto, 'destinatarios': destinatarios, 'remitente': remitente, 'urlArchivo': urlArchivo}));
    if (response.statusCode != 201) {
      throw Exception('Error al enviar mensaje');
    }
  }

  Future<void> markMessagesAsRead(String destinatario, String remitente) async {
    final response = await http.post(Uri.parse('$_baseUrl/messages/read'), headers: {'Content-Type': 'application/json'}, body: jsonEncode({'destinatario': destinatario, 'remitente': remitente}));
    if (response.statusCode != 200) {
      throw Exception('Error al marcar como leídos');
    }
  }
}

class UserService {
  final String _baseUrl;
  UserService(this._baseUrl);

  Future<List<Usuario>> getUsers() async {
    final response = await http.get(Uri.parse('$_baseUrl/users'), headers: {'Content-Type': 'application/json'});
    if (response.statusCode == 200) {
      return (jsonDecode(response.body)['usuarios'] as List).map((json) => Usuario.fromJson(json)).toList();
    } else {
      throw Exception('Error al obtener usuarios');
    }
  }
}

class FileUploadService {
  final String _baseUrl;
  FileUploadService(this._baseUrl);

  Future<String> uploadFile(File file) async {
    final uri = Uri.parse('$_baseUrl/files/upload');
    final request = http.MultipartRequest('POST', uri)..files.add(await http.MultipartFile.fromPath('file', file.path));
    final response = await request.send();
    if (response.statusCode == 200) {
      return jsonDecode(await response.stream.bytesToString())['url'];
    } else {
      throw Exception('Error al subir archivo');
    }
  }
}

class SocketService {
  IO.Socket? socket;
  final String _baseUrl;
  SocketService(this._baseUrl) {
    socket = IO.io(_baseUrl, IO.OptionBuilder().setTransports(['websocket']).build());
    socket?.connect();
    socket?.onConnect((_) => print('Socket conectado'));
    socket?.onDisconnect((_) => print('Socket desconectado'));
    socket?.onError((err) => print(err));
  }

  void joinChat(String userEmail) => socket?.emit('join', userEmail);
  void listenForNewMessages(Function(dynamic) onNewMessage) => socket?.on('nueva_notificacion', (data) => onNewMessage(data));
  void disconnect() => socket?.disconnect();
}

// Páginas
class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    return Scaffold(
      appBar: AppBar(title: Text('Iniciar Sesión')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextFormField(controller: _emailController, decoration: InputDecoration(labelText: 'Correo'), validator: (value) => value == null || value.isEmpty ? 'Ingresa tu correo' : null),
              TextFormField(controller: _passwordController, decoration: InputDecoration(labelText: 'Contraseña'), obscureText: true, validator: (value) => value == null || value.isEmpty ? 'Ingresa tu contraseña' : null),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  if (_formKey.currentState!.validate()) {
                    try {
                      await userProvider.login(_emailController.text, _passwordController.text);
                      Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => ChatPage()));
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al iniciar sesión: $e')));
                    }
                  }
                },
                child: Text('Iniciar Sesión'),
              ),
              TextButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => RegisterPage())), child: Text('Registrarse')),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}

class RegisterPage extends StatefulWidget {
  @override
  _RegisterPageState createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nombreController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    return Scaffold(
      appBar: AppBar(title: Text('Registrarse')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextFormField(controller: _nombreController, decoration: InputDecoration(labelText: 'Nombre'), validator: (value) => value == null || value.isEmpty ? 'Ingresa tu nombre' : null),
              TextFormField(controller: _emailController, decoration: InputDecoration(labelText: 'Correo'), validator: (value) => value == null || value.isEmpty ? 'Ingresa tu correo' : null),
              TextFormField(controller: _passwordController, decoration: InputDecoration(labelText: 'Contraseña'), obscureText: true, validator: (value) => value == null || value.isEmpty ? 'Ingresa tu contraseña' : null),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  if (_formKey.currentState!.validate()) {
                    try {
                      await userProvider.register(_nombreController.text, _emailController.text, _passwordController.text);
                      Navigator.pop(context);
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al registrarse: $e')));
                    }
                  }
                },
                child: Text('Registrarse'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}

class ChatPage extends StatefulWidget {
  @override
  _ChatPageState createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _messageController = TextEditingController();
  late MessageService _messageService;
  late SocketService _socketService;
  late FileUploadService _fileUploadService;
  List<Mensaje> _messages = [];

  @override
  void initState() {
    super.initState();
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final baseUrl = 'YOUR_BACKEND_URL'; // Reemplaza
    _messageService = MessageService(baseUrl);
    _socketService = SocketService(baseUrl);
    _fileUploadService = FileUploadService(baseUrl);
    _socketService.joinChat(userProvider.usuario!.correo);
    _socketService.listenForNewMessages(_handleNewMessage);
    _loadInitialMessages();
  }

  @override
  void dispose() {
    _socketService.disconnect();
    _messageController.dispose();
    super.dispose();
  }

  void _handleNewMessage(dynamic data) {
    setState(() => _messages.add(Mensaje.fromJson(data)));
  }

  Future<void> _loadInitialMessages() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    try {
      _messages = await _messageService.getMessagesBetween(userProvider.usuario!.correo, 'otro_usuario@example.com'); // Reemplaza
      setState(() {});
    } catch (e) {
      print('Error al cargar mensajes: $e');
    }
  }

  Future<void> _sendMessage() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    if (_messageController.text.isNotEmpty) {
      try {
        await _messageService.sendMessage(_messageController.text, ['otro_usuario@example.com'], userProvider.usuario!.correo, null); // Reemplaza
        _messageController.clear();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al enviar: $e')));
      }
    }
  }

  Future<void> _uploadAndSendMessage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      try {
        final url = await _fileUploadService.uploadFile(File(pickedFile.path));
        await _messageService.sendMessage('Archivo adjunto', ['otro_usuario@example.com'], Provider.of<UserProvider>(context, listen: false).usuario!.correo, url); // Reemplaza
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al subir/enviar: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Chat con ${userProvider.usuario!.nombre}'),
        actions: [
          IconButton(
            icon: Icon(Icons.exit_to_app),
            onPressed: () {
              userProvider.logout();
              Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => LoginPage()));
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _messages.length,
              itemBuilder: (context, index) => ListTile(title: Text(_messages[index].texto), subtitle: Text('De: ${_messages[index].remitente}')),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(child: TextField(controller: _messageController, decoration: InputDecoration(hintText: 'Escribe...'))),
                IconButton(icon: Icon(Icons.send), onPressed: _sendMessage),
                IconButton(icon: Icon(Icons.attach_file), onPressed: _uploadAndSendMessage),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class UsersPage extends StatefulWidget {
  @override
  _UsersPageState createState() => _UsersPageState();
}

class _UsersPageState extends State<UsersPage> {
  late UserService _userService;
  List<Usuario> _users = [];

  @override
  void initState() {
    super.initState();
    final baseUrl = 'YOUR_BACKEND_URL'; // Reemplaza
    _userService = UserService(baseUrl);
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    try {
      _users = await _userService.getUsers();
      setState(() {});
    } catch (e) {
      print('Error al cargar usuarios: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Usuarios')),
      body: ListView.builder(
        itemCount: _users.length,
        itemBuilder: (context, index) => ListTile(title: Text(_users[index].nombre), subtitle: Text(_users[index].correo)),
      ),
    );
  }
}

void main() {
  final baseUrl = 'http://localhost:52208/api/..'; // Reemplaza con la URL de tu backend
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => UserProvider(baseUrl)),
        Provider(create: (context) => MessageService(baseUrl)),
        Provider(create: (context) => UserService(baseUrl)),
        Provider(create: (context) => FileUploadService(baseUrl)),
        Provider(create: (context) => SocketService(baseUrl)),
      ],
      child: MaterialApp(
        title: 'Chat App',
        theme: ThemeData(primarySwatch: Colors.blue),
        home: LoginPage(),
        routes: {
          '/chat': (context) => ChatPage(),
          '/users': (context) => UsersPage(),
        },
      ),
    ),
  );
}
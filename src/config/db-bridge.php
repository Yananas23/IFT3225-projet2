<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes OPTIONS (pour CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Connexion à la base de données locale
$conn = new mysqli('localhost', 'root', '', 'p2');

// Vérifier la connexion
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(['error' => 'Erreur de connexion à la BDD: ' . $conn->connect_error]);
  exit();
}

// Récupérer la requête et les données
$request = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Action de test pour vérifier la connexion
if ($action === 'test') {
  echo json_encode(['success' => true, 'message' => 'Connexion réussie à la base de données']);
  exit();
}

// Traiter la requête
switch($action) {
  case 'query':
    if (isset($request['sql']) && isset($request['params'])) {
      // Afficher la requête pour débogage
      error_log("SQL: " . $request['sql']);
      error_log("Params: " . json_encode($request['params']));
      
      $stmt = $conn->prepare($request['sql']);
      
      // Lier les paramètres dynamiquement s'il y en a
      if (!empty($request['params'])) {
        $types = str_repeat('s', count($request['params'])); // Tous les params en string
        $stmt->bind_param($types, ...$request['params']);
      }
      
      $stmt->execute();
      $result = $stmt->get_result();
      
      $data = [];
      if ($result) {
        while ($row = $result->fetch_assoc()) {
          $data[] = $row;
        }
      }
      
      echo json_encode(['success' => true, 'data' => $data]);
    } else {
      http_response_code(400);
      echo json_encode(['error' => 'Requête mal formée', 'info' => $request]);
    }
    break;
    
  case 'lastInsertId':
    echo json_encode(['success' => true, 'insertId' => $conn->insert_id]);
    break;
    
  default:
    http_response_code(404);
    echo json_encode(['error' => 'Action non reconnue']);
}

$conn->close();
?>
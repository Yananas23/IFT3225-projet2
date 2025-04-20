<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');


// Charger les variables d'environnement depuis le fichier .env
function loadEnv() {
  $envFile = __DIR__ . '/../../.env';
  $envVars = [];
  
  if (file_exists($envFile)) {
      $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
      foreach ($lines as $line) {
          if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
              list($key, $value) = explode('=', $line, 2);
              $key = trim($key);
              $value = trim($value);
              $envVars[$key] = $value;
          }
      }
  }
  
  return $envVars;
}

// Utilisation
$config = loadEnv();

// Gérer les requêtes OPTIONS (pour CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Récupérer les variables d'environnement
$db_host = $config['DB_HOST'] ?? 'localhost';
$db_user = $config['DB_USER'] ?? 'root';
$db_password = $config['DB_PASSWORD'] ?? '';
$db_name = $config['DB_NAME'] ?? '';
$error_msg = "";

try {
    $pdo = new PDO("mysql:host=$db_host; dbname=$db_name; charset=utf8", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à la BDD: ' . $e->getMessage()]);
    exit();
}

$request = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Test de connexion
if ($action === 'test') {
    echo json_encode(['success' => true, 'message' => 'Connexion réussie à la base de données']);
    exit();
}

switch ($action) {
    case 'query':
        if (isset($request['sql']) && isset($request['params'])) {
            try {
                $stmt = $pdo->prepare($request['sql']);
                $stmt->execute($request['params']);

                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $insertId = null;

                // Si c'est une insertion, on génère dynamiquement la requête pour retrouver l'ID
                if (
                    stripos($request['sql'], 'INSERT INTO') === 0 
                ) {
                    // Extraction du nom de la table et des colonnes
                    if (preg_match('/INSERT INTO\s+(\w+)\s*\(([^)]+)\)/i', $request['sql'], $matches)) {
                        $table = $matches[1];
                        if ($table != "word_definition") {
                            $columns = array_map('trim', explode(',', $matches[2]));

                            // Création d'une requête SELECT dynamique
                            $conditions = implode(' AND ', array_map(fn($col) => "$col = ?", $columns));
                            $idQuery = "SELECT id FROM $table WHERE $conditions ORDER BY id DESC LIMIT 1";

                            $idStmt = $pdo->prepare($idQuery);
                            $idStmt->execute($request['params']);
                            $idResult = $idStmt->fetch(PDO::FETCH_ASSOC);

                            if ($idResult && isset($idResult['id'])) {
                                $insertId = $idResult['id'];
                            }
                        }
                    }
                }

                echo json_encode([
                    'success' => true,
                    'data' => $data,
                    'insertId' => $insertId
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur lors de l’exécution de la requête', 'details' => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Requête mal formée', 'info' => $request]);
        }
        break;

    case 'lastInsertId':
        echo json_encode(['success' => true, 'insertId' => $pdo->lastInsertId()]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Action non reconnue']);
}
?>

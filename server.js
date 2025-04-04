const express = require("express");

const sequelize = require("./src/config/database"); // Connexion à la DB
const initModels = require("./src/models/init-models"); // Initialisation des modèles

// Initialiser les modèles Sequelize
const models = initModels(sequelize);

const joueurRoutes = require("./src/routes/joueurRoutes");
const gameRoutes = require("./src/routes/gameRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const wordRoutes = require("./src/routes/wordRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware pour JSON
app.use(express.json());

// Enregistrer les routes
app.use("/gamers", joueurRoutes);
app.use("/game", gameRoutes);
app.use("/admin", adminRoutes);
app.use("/word", wordRoutes);

// Attendre la synchronisation avant de démarrer le serveur
sequelize.sync()
  .then(() => {
    console.log("✅ Base de données synchronisée");
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Erreur de synchronisation :", err);
  });

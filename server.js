const express = require("express");

const sequelize = require("./src/config/database"); // Connexion à la DB
const initModels = require("./src/models/init-models"); // Initialisation des modèles
const expressLayouts = require('express-ejs-layouts'); //Layouts EJS
const path = require('path');

// Initialiser les modèles Sequelize
const models = initModels(sequelize);

const joueurRoutes = require("./src/routes/joueurRoutes");
const gameRoutes = require("./src/routes/gameRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const wordRoutes = require("./src/routes/wordRoutes");
const dumpRoute = require("./src/routes/dumpRoute");

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration EJS
app.set('view engine', 'ejs');
app.use(expressLayouts);

// Définir le layout par défaut
app.set('views', path.join(__dirname, 'src', 'views')); // Emplacement des views
app.set('layout', 'layout');

// Middleware pour JSON
app.use(express.json());

// Enregistrer les routes
app.use("/gamers", joueurRoutes);
app.use("/jeu", gameRoutes);
app.use("/admin", adminRoutes);
app.use("/word", wordRoutes);
app.use("/dump", dumpRoute);

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

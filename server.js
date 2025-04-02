const express = require("express");
const bodyParser = require("express");

const sequelize = require("./src/config/database");

const joueurRoutes = require("./src/routes/joueurRoutes");
const gameRoutes = require("./src/routes/gameRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

sequelize.sync() // Synchroniser les modèles avec MySQL
  .then(() => console.log("✅ Base de données synchronisée"))
  .catch(err => console.error("❌ Erreur de synchronisation :", err));


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // Important pour lire le JSON dans les requêtes POST

// Enregistrer les routes
app.use("/gamers", joueurRoutes);
app.use("/game", gameRoutes);
app.use("/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

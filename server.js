const express = require("express");
const fs = require("fs");
const sequelize = require("./src/config/database"); // Connexion à la DB
const initModels = require("./src/models/init-models"); // Initialisation des modèles
const expressLayouts = require('express-ejs-layouts'); //Layouts EJS
const path = require('path');
const session = require("express-session");


const joueurRoutes = require("./src/routes/joueurRoutes");
const gameRoutes = require("./src/routes/gameRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const wordRoutes = require("./src/routes/wordRoutes");
const dumpRoute = require("./src/routes/dumpRoute");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(session({
  secret: 'dev-secret', // OK pour dev ou localhost
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // OK pour localhost
}));

// Configuration EJS
app.set('view engine', 'ejs');
app.use(expressLayouts);

// Définir le layout par défaut
app.set('views', path.join(__dirname, 'src', 'views')); // Emplacement des views
app.set('layout', 'layout');

// Middleware pour JSON
app.use(express.json());

// Middleware pour que Express puisse lire les données d’un formulaire POST
app.use(express.urlencoded({ extended: true }));

// Pour servir le dossier '/pagescripts'
app.use("/pagescripts", express.static(path.join(__dirname, 'src', 'pagescripts')));

// Pour servir le dossier '/style'
app.use("/style", express.static(path.join(__dirname, 'src', 'style')));

// Enregistrer les routes
app.use("/gamers", joueurRoutes);
app.use("/jeu", gameRoutes);
app.use("/admin", adminRoutes);
app.use("/word", wordRoutes);
app.use("/dump", dumpRoute);

// Route pour afficher le contenu du fichier help.html
app.get("/doc", (req, res) => {
  res.render("doc", {
    title: "Documentation :",
  });
});


// Attendre la synchronisation avant de démarrer le serveur
sequelize.sync()
  .then(() => {
    console.log("✅ Connexion à la base de données vérifiée");
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Erreur de connexion :", err);
  });
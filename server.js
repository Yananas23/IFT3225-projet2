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

// Enregistrer les routes
app.use("/gamers", joueurRoutes);
app.use("/jeu", gameRoutes);
app.use("/admin", adminRoutes);
app.use("/word", wordRoutes);
app.use("/dump", dumpRoute);


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

/*
async function importWordsFromLocalFile() {
  const localFilePath = path.join(__dirname, "src", "def.txt");

  return new Promise((resolve, reject) => {
    fs.readFile(localFilePath, "utf-8", async (err, data) => {
      if (err) {
        return reject(new Error("Erreur lors de la lecture du fichier local : " + err.message));
      }

      try {
        const lines = data.split("\n").filter(line => line.trim());
        const BATCH_SIZE = 250;

        console.log(`🔁 Importation de ${lines.length} lignes par batchs de ${BATCH_SIZE}...`);

        for (let i = 0; i < lines.length; i += BATCH_SIZE) {
          const batch = lines.slice(i, i + BATCH_SIZE);

          const batchPromises = batch.map(async (line) => {
            let [lang, source, word, ...descriptionArray] = line.trim().split(/\s+/);
            let definition = descriptionArray.join(" ");
            if (!word || !definition) return;

            const [wordEntry] = await Word.findOrCreate({ where: { word, lang } });
            const [definitionEntry] = await Definition.findOrCreate({ where: { definition, source } });

            await WordDefinition.findOrCreate({
              where: { 'w-id': wordEntry.id, 'd-id': definitionEntry.id },
            });
          });

          await Promise.all(batchPromises);
          console.log(`✅ Batch ${i + 1} à ${i + batch.length} traitée`);
        }

        resolve("✅ Données insérées avec succès à partir du fichier local !");
      } catch (localError) {
        reject(new Error("❌ Erreur d'importation : " + localError.message));
      }
    });
  });
}

async function startServer() {
  try {
    await sequelize.sync();
    console.log("✅ Connexion à la base de données vérifiée!");

    app.listen(PORT, async () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);

      // Importer les données depuis le fichier local
      try {
        //console.log("Importation des données depuis le fichier local...");
        //const message = await importWordsFromLocalFile();
        //console.log("Importation réussie :", message);
      } catch (error) {
        console.error("Erreur d'importation :", error.message);
      }
    });
  } catch (err) {
    console.error("❌ Erreur de démarrage :", err);
  }
}

startServer();
*/
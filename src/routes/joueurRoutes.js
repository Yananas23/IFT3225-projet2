// - joueurRoutes.js : Gère les routes liées aux joueurs comme l'inscription, connexion, déconnexion et récupération d'informations.
const bcrypt = require("bcrypt");
const express = require("express");
const Joueur = require("../models/joueur");
const sequelize = require("../config/database");

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    // Utiliser la méthode findAll de notre émulation
    const joueurs = await sequelize.query("SELECT * FROM joueur", []);
    res.json(joueurs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:joueur", async (req, res) => {
  try {
    const joueur = await Joueur.findOne({ where: { pseudo: req.params.joueur } });

    if (!joueur) return res.status(404).json({ error: "Joueur non trouvé" });

    res.json(joueur);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/add/:pseudo/:pwd", async (req, res) => {
  try {
    const { pseudo, pwd } = req.params;

    // Vérifier si le pseudo existe déjà
    const joueurExiste = await Joueur.findOne({ where: { pseudo } });
    if (joueurExiste) {
      return res.status(400).json({ error: "Ce pseudo est déjà pris !" });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(pwd, 10);

    // Créer le joueur avec notre méthode personnalisée
    const newJoueur = await Joueur.create({
      pseudo,
      password: hashedPassword,
      game: 0,
      win: 0,
      score: 0,
      admin: 0
    });

    // Déconnecter l'ancien joueur au besoin, puis connecter le nouveau
    if (req.session.joueur) {
      console.log(`Déconnexion de ${req.session.joueur.pseudo} pour nouveau joueur.`);
      req.session.destroy(err => {
        if (err) {
          console.error("Erreur lors de la déconnexion de l'ancien joueur :", err);
          return res.status(500).json({ error: "Erreur lors de la déconnexion de l'ancien joueur." });
        }
        login(newJoueur, req, res, () => {
          res.json({ id: newJoueur.id, message: "Joueur ajouté et connecté!" });
        });
      });
    }
    else {
      login(newJoueur, req, res, () => {
        res.json({ id: newJoueur.id, message: "Joueur ajouté et connecté!" });
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/login/:pseudo/:pwd", async (req, res) => {
  try {
    const { pseudo, pwd } = req.params;

    const joueur = await Joueur.findOne({ where: { pseudo } });

    if (!joueur) return res.status(404).json({ error: "Joueur non trouvé" });

    const match = await bcrypt.compare(pwd, joueur.password);

    if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });
      
    // Déconnecter joueur actif s'il y a lieu, puis effectuer login
    if (req.session.joueur) {
    console.log(`Déconnexion de ${req.session.joueur.pseudo}.`);
    req.session.destroy(err => {
      if (err) {
        console.error(`Erreur lors de la déconnexion du joueur ${req.session.joueur.pseudo} :`, err);
        return res.status(500).json({ error: "Erreur lors de la déconnexion." });
      }
      login(newJoueur, req, res, () => {
        res.json({ id: newJoueur.id, message: "Connexion réussie!" });
      });
    });
    }
    else {
      login(newJoueur, req, res, () => {
        res.json({ id: newJoueur.id, message: "Connexion réussie!" });
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/logout/:pseudo/:pwd", async (req, res) => {
  try {
    const { pseudo, pwd } = req.params;

    const joueur = await Joueur.findOne({ where: { pseudo } });

    if (!joueur) return res.status(404).json({ error: "Joueur non trouvé" });

    const match = await bcrypt.compare(pwd, joueur.password);

    if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

    // Utiliser la méthode update du modèle pour mettre à jour la date de déconnexion
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await Joueur.update({ loged: currentDate }, { where: { pseudo } });

      // Détruire la session express
      if (!req.session.joueur) {
        res.json({ message: "Pas de session active... Déconnexion réussie?" });
      }
      else {
        req.session.destroy(err => {
          if (err) {
            return res.status(500).json({ error: "Erreur lors de la déconnexion!" });
          }
          res.json({ message: "Déconnexion réussie!" });
        });
      }      
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fonction de connexion avec express session
function login(joueur, req, res, next) {
  req.session.regenerate(err => {
    if (err) {
      console.error("Erreur lors de l'opération \"regenerate\" de la session :", err);
      return res.status(500).json({ error: "Erreur lors de la création de session." });
    }

    req.session.joueur = {
      id: joueur.id,
      pseudo: joueur.pseudo,
      score: joueur.score,
      admin: joueur.admin
    };

    next(); // Continue le traitement
  });
}

module.exports = router;
const bcrypt = require("bcrypt");
const express = require("express");
const Joueur = require("../models/joueur");

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
      const joueurs = await Joueur.findAll();
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

      // Créer le joueur
      const newJoueur = await Joueur.create({
        pseudo,
        password: hashedPassword,
      });

      // Retourner l'ID du joueur
      res.json({ id: newJoueur.id, message: "Joueur ajouté et connecté !" });

  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


router.get("/login/:pseudo/:pwd", async (req, res) => {
  try {
      const { pseudo, pwd } = req.params;

      const joueur = await Joueur.findOne({ where: { pseudo: pseudo }});

      if (!joueur) return res.status(404).json({ error: "Joueur non trouvé" });

      const match = await bcrypt.compare(pwd, joueur.password);

      if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

      req.session.joueur = {
        id: joueur.id,
        pseudo: joueur.pseudo,
        score: joueur.score,
        admin: joueur.admin
      };

      res.json({ message: "Connexion réussie !" });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


router.get("/logout/:pseudo/:pwd", async (req, res) => {
  try {
      const { pseudo, pwd } = req.params;

      const joueur = await Joueur.findOne({ where: { pseudo: pseudo }});

      if (!joueur) return res.status(404).json({ error: "Joueur non trouvé" });

      const match = await bcrypt.compare(pwd, joueur.password);

      if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

      await joueur.update({ loged: new Date() });

      req.session.destroy(err => {
        if (err) {
          return res.status(500).json({ error: "Erreur lors de la déconnexion!" });
        }
        res.json({ message: "Déconnexion réussie!" });
      });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require("express");
const Joueur = require("../models/joueur");
const sequelize = require("../config/database");

const router = express.Router();

router.get("/play/:pseudo", async (req, res) => {
    try {
        const { pseudo } = req.params;

        // Vérifier si le joueur existe
        const joueur = await Joueur.findOne({ where: { pseudo } });

        if (!joueur) {
            return res.status(404).json({ error: "Joueur non trouvé" });
        }

        // Incrémenter le nombre de parties jouées
        const newGameCount = joueur.game + 1;
        await sequelize.query(
            `UPDATE joueur SET game = ? WHERE pseudo = ?`,
            [newGameCount, pseudo]
        );

        res.json({ message: "Partie enregistrée avec succès", games: newGameCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.put("/win/:pseudo", async (req, res) => {
    try {
        const { pseudo } = req.params;

        // Vérifier si le joueur existe
        const joueur = await Joueur.findOne({ where: { pseudo } });

        if (!joueur) {
            return res.status(404).json({ error: "Joueur non trouvé" });
        }

        // Incrémenter le nombre de victoires
        const newWinCount = joueur.win + 1;
        await sequelize.query(
            `UPDATE joueur SET win = ? WHERE pseudo = ?`,
            [newWinCount, pseudo]
        );

        res.json({ message: "Victoire enregistrée avec succès", wins: newWinCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.put("/score/:pseudo/:pts", async (req, res) => {
    try {
        const { pseudo, pts } = req.params;
        const points = parseInt(pts, 10);

        // Vérifier si le joueur existe
        const joueur = await Joueur.findOne({ where: { pseudo } });

        if (!joueur) {
            return res.status(404).json({ error: "Joueur non trouvé" });
        }

        // Mettre à jour le score
        const newScore = joueur.score + points;
        await sequelize.query(
            `UPDATE joueur SET score = ? WHERE pseudo = ?`,
            [newScore, pseudo]
        );

        res.json({ message: "Score mis à jour avec succès", score: newScore });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
const express = require("express");
const Joueur = require("../models/joueur");

const router = express.Router();

router.get("/play/:pseudo", async (req, res) => {
    try {
        const { pseudo, pwd } = req.params;

        const joueur = await Joueur.findOne({ where: { pseudo: pseudo }});

        if (!joueur) return res.status(404).json({ error: "Joueur non trouvé" });

        await joueur.update({ game: joueur.game + 1 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/win/:pseudo", async (req, res) => {
    try {
        const joueur = await Joueur.findOne({ where: { pseudo: req.params.pseudo }});

        if (!joueur) return res.status(404).json({ error: "Joueur non trouvé" });

        await joueur.update({ win: joueur.win + 1 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/score/:pseudo/:pts", async (req, res) => {
    try {
        const { pseudo, pts } = req.params;

        const joueur = await Joueur.findOne({ where: { pseudo: pseudo }});

        if (!joueur) return res.status(404).json({ error: "Joueur non trouvé" });

        await joueur.update({ score: joueur.score + pts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
const express = require("express");
const Joueur = require("../models/joueur");
const Word = require("../models/word");
const Word_Definition = require("../models/word_definition");
const Definition = require("../models/definition");

const router = express.Router();

// Route sans paramètre
router.get("/top", async (req, res) => {
    req.params.nb = 10; // Top10 par défaut
    await handleTopRequest(req, res);
});

// Route avec paramètre
router.get("/top/:nb", async (req, res) => {
await handleTopRequest(req, res);
});

async function handleTopRequest(req, res) {
try {
    let nb = parseInt(req.params.nb, 10);
    const joueurs = await Joueur.findAll();

    // Trier les joueurs par score décroissant et prendre les `nb` premiers
    const topJoueurs = joueurs
    .sort((a, b) => b.score - a.score) // Tri du plus grand au plus petit score
    .slice(0, nb); // Sélection des `nb` premiers

    res.json({
        joueurs: topJoueurs.map(j => ({ pseudo: j.pseudo, score: j.score }))
    });
} catch (error) {
    res.status(500).json({ error: error.message });
}
};

router.get("/delete/joueur/:joueur", async (req, res) => {
    try {
        const deleted = await Joueur.destroy({ where: { pseudo: req.params.joueur } });

        if (deleted) {
        return res.json({ message: 'Élément supprimé avec succès' });
        } else {
        return res.status(404).json({ message: 'Élément non trouvé' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/delete/def/:id", async (req, res) => {
    try {
        const deleted = await Definition.destroy({ where: { id: req.params.id } });

        if (deleted) {
        return res.json({ message: 'Élément supprimé avec succès' });
        } else {
        return res.status(404).json({ message: 'Élément non trouvé' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
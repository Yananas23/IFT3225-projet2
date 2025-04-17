const express = require("express");
const Joueur = require("../models/joueur");
const Word = require("../models/word");
const Word_Definition = require("../models/word_definition");
const Definition = require("../models/definition");

const router = express.Router();

router.get("/ping", async (req, res) => {
    try {
        return res.json({ message: 'Pong' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
        .slice(0, nb + 1); // Sélection des `nb` premiers

        res.json({
            joueurs: topJoueurs.map(j => ({ pseudo: j.pseudo, score: j.score }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

router.delete("/delete/joueur/:joueur", async (req, res) => {
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

router.delete("/delete/def/:id", async (req, res) => {
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

router.post("/add/:word/:lang", async (req, res) => {
    try {
        const { word, lang } = req.params;
  
        // Vérifier si le mot existe déjà
        const wordExiste = await Word.findOne({ where: { word, lang } });
        if (wordExiste) {
          return res.status(400).json({ error: "Ce mot existe déjà !" });
        }
    
        // Créer le mot
        const newWord = await Word.create({
          word,
          lang,
        });
  
        res.json({ id: newWord.id, word: newWord.word, message: "Mot ajouté !" });
  
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/add/:word/:lang/:def", async (req, res) => {
    try {
        const { word, lang, def } = req.params;
  
        // Vérifier si le mot existe déjà
        const wordExiste = await Word.findOne({ where: { word, lang } });
        if (!wordExiste) {
          return res.status(400).json({ error: "Ce mot n'existe pas !" });
        }
    
        // Vérifier si la définition existe déjà
        const [newDef, createdDef] = await Definition.findOrCreate({
            where: { def },
            defaults: { def }  // Permet de créer la définition si elle n'existe pas
        });

        // Vérifier si l'association existe déjà
        const [association, createdAssoc] = await WordDefinition.findOrCreate({
            where: {
                wordId: wordExiste.id,
                definitionId: newDef.id
            }
        });

        // Message de retour
        let message = createdDef 
            ? `Nouvelle définition ajoutée et liée à ${word} !` 
            : `Définition déjà existante, lien mis à jour avec ${word} !`;

        res.json({ 
            id: newDef.id, 
            definition: newDef.def, 
            message 
        });
  
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
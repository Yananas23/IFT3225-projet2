const express = require("express");
const Joueur = require("../models/joueur");
const Word = require("../models/word");
const WordDefinition = require("../models/word_definition");
const Definition = require("../models/definition");
const sequelize = require("../config/database");

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
        
        // Récupérer tous les joueurs triés par score décroissant avec limite
        const joueurs = await sequelize.query(
            `SELECT pseudo, score FROM joueur ORDER BY score DESC LIMIT ?`,
            [nb]
        );

        res.json({
            joueurs: joueurs.map(j => ({ pseudo: j.pseudo, score: j.score }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

router.delete("/delete/joueur/:joueur", async (req, res) => {
    try {
        // Vérifier si le joueur existe
        const joueur = await Joueur.findOne({ where: { pseudo: req.params.joueur } });
        
        if (!joueur) {
            return res.status(404).json({ message: 'Élément non trouvé' });
        }
        
        // Supprimer le joueur
        await sequelize.query(
            `DELETE FROM joueur WHERE pseudo = ?`,
            [req.params.joueur]
        );

        return res.json({ message: 'Élément supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.delete("/delete/def/:id", async (req, res) => {
    try {
        // Vérifier si la définition existe
        const definitionId = parseInt(req.params.id, 10);
        const definition = await sequelize.query(
            `SELECT id FROM definition WHERE id = ?`,
            [definitionId]
        );
        
        if (definition.length === 0) {
            return res.status(404).json({ message: 'Élément non trouvé' });
        }
        
        // Supprimer d'abord les liens dans word_definition
        await sequelize.query(
            `DELETE FROM word_definition WHERE \`d-id\` = ?`,
            [definitionId]
        );
        
        // Puis supprimer la définition
        await sequelize.query(
            `DELETE FROM definition WHERE id = ?`,
            [definitionId]
        );

        return res.json({ message: 'Élément supprimé avec succès' });
    } catch (error) {
        console.error(error);
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
        console.error(error);
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
        let existingDef = await sequelize.query(
            `SELECT id FROM definition WHERE definition = ?`,
            [def]
        );
        
        let defId;
        let createdDef = false;
        
        if (existingDef.length === 0) {
            // Créer la définition
            await sequelize.query(
                `INSERT INTO definition (definition, source) VALUES (?, 'user')`,
                [def]
            );
            defId = await sequelize.getInsertId();
            createdDef = true;
        } else {
            defId = existingDef[0].id;
        }
        
        // Vérifier si l'association existe déjà
        const existingAssoc = await sequelize.query(
            `SELECT * FROM word_definition WHERE \`w-id\` = ? AND \`d-id\` = ?`,
            [wordExiste.id, defId]
        );
        
        if (existingAssoc.length === 0) {
            // Créer l'association
            await sequelize.query(
                `INSERT INTO word_definition (\`w-id\`, \`d-id\`) VALUES (?, ?)`,
                [wordExiste.id, defId]
            );
        }

        // Message de retour
        let message = createdDef 
            ? `Nouvelle définition ajoutée et liée à ${word} !` 
            : `Définition déjà existante, lien mis à jour avec ${word} !`;

        res.json({ 
            id: defId, 
            definition: def, 
            message 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
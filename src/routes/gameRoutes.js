const express = require("express");
const Joueur = require("../models/joueur");
const Word = require("../models/word");
const Definition = require("../models/definition");
const WordDefinition = require("../models/word_definition");

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

router.put("/win/:pseudo", async (req, res) => {
    try {
        const joueur = await Joueur.findOne({ where: { pseudo: req.params.pseudo }});

        if (!joueur) return res.status(404).json({ error: "Joueur non trouvé" });

        await joueur.update({ win: joueur.win + 1 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/score/:pseudo/:pts", async (req, res) => {
    try {
        const { pseudo, pts } = req.params;

        const joueur = await Joueur.findOne({ where: { pseudo: pseudo }});

        if (!joueur) return res.status(404).json({ error: "Joueur non trouvé" });

        await joueur.update({ score: joueur.score + pts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/word/:lg?/:time?/:hint?", authRequired, async (req, res) => {
    try {
        const lang = req.params.lg || 'en';
        const time = parseInt(req.params.time) || 60;
        const hintFreq = parseInt(req.params.hint) || 10;

        // Récupération aléatoire d’un mot et d'une définition
        const wordData = await getRandomWord(lang);

        if (!wordData) {
            return res.status(404).send("Aucun mot trouvé pour cette langue.");
        }
        
        const score = 10 * wordData.word.length;

        // Render, devrait envoyer le HTML à curl
        res.render("game", {
            layout: "layout",
            title: "Projet 2",
            word: wordData.word,
            wordLength: wordData.word.length,
            definition: wordData.definition,
            initialScore: score,
            time,
            hintFreq,
            language: lang
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la génération de la partie.");
    }
});

router.get("/def/:lg?/:time?", authRequired, async (req, res) => {
    try {
        const lang = req.params.lg || 'en'; // Langue par défaut : 'en'
        const time = parseInt(req.params.time) || 60; // Temps par défaut : 60 secondes

        // Récupérer un mot aléatoire pour cette langue
        const wordData = await getRandomWord(lang);
        if (!wordData) {
            return res.status(404).send("Aucun mot trouvé pour cette langue.");
        }

        // Récupérer les informations du joueur
        const joueur = req.session.joueur;
        if (!joueur) {
            return res.status(401).send("Aucun utilisateur connecté!");
        }

        // Affichage du mot et de la définition sur la page
        res.render("defGame", {
            layout: "layout",
            word: wordData.word,
            time,
            language: lang,
            pseudo: joueur.pseudo
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la génération de la partie.");
    }
});

router.post("/def/:lg?", authRequired, async (req, res) => {
    try {
        const { word, definition, pseudo } = req.body;
        const lang = req.params.lg || 'en';

        // Vérifier que le mot existe dans la base de données pour cette langue
        const wordRecord = await Word.findOne({ where: { word, lang } });
        if (!wordRecord) {
            return res.status(400).json({ error: "Ce mot n'existe pas dans la langue spécifiée." });
        }

        // Vérifier si la définition est valide (entre 5 et 200 caractères)
        if (definition.length < 5 || definition.length > 200) {
            return res.status(400).json({ error: "La définition doit avoir entre 5 et 200 caractères." });
        }

        // Vérifier si la définition existe déjà pour ce mot
        const existingDefinition = await Definition.findOne({
            where: { def: definition }
        });

        if (existingDefinition) {
            // Vérifier si la définition est déjà liée au mot
            const existingAssociation = await Word_Definition.findOne({
                where: { wordId: wordRecord.id, definitionId: existingDefinition.id }
            });

            if (existingAssociation) {
                return res.status(400).json({ error: "Cette définition est déjà associée à ce mot." });
            }
        }

        // Ajouter la définition et l'associer au mot
        const [newDefinition, created] = await Definition.findOrCreate({
            where: { def: definition },
            defaults: { def: definition }
        });

        await Word_Definition.create({
            wordId: wordRecord.id,
            definitionId: newDefinition.id
        });

        // Mettre à jour le score (5 points pour chaque définition valide)
        res.json({ message: `Définition ajoutée avec succès ! Score : ${5}` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

function authRequired(req, res, next) {
    if (!req.session.joueur) {
      return res.status(401).send("Connexion requise!");
    }
    next();
}

async function getRandomWord(lang = "en") {
    try {
        const words = await Word.findAll({
            where: { lang },
            include: {
                model: Definition,
                through: { attributes: [] } // évite les colonnes de jointure
            }
        });

        if (!words || words.length === 0) return null;

        const validWords = words.filter(w => w.Definitions && w.Definitions.length > 0);
        if (validWords.length === 0) return null;

        const randomWord = validWords[Math.floor(Math.random() * validWords.length)];
        const randomDef = randomWord.Definitions[Math.floor(Math.random() * randomWord.Definitions.length)]; // Choisir une définition du mot au hasard

        return {
            word: randomWord.word,
            wordId: randomWord.id,
            definition: randomDef.definition,
            definitionId: randomDef.id
        };
    } catch (err) {
        console.error("Erreur dans getRandomWord :", err);
        return null;
    }
}


module.exports = router;
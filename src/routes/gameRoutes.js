const express = require("express");
const Joueur = require("../models/joueur");
const sequelize = require("../config/database");
const Word = require("../models/word");
const Definition = require("../models/definition");
const WordDefinition = require("../models/word_definition");

const router = express.Router();

// Routes temporaires

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

// Routes finales

router.get("/def/:lg?/:time?", async (req, res) => {
    try {
        const lang = req.params.lg || "en";
        const time = parseInt(req.params.time, 10) || 60;

        const wordData = await getRandomWord(lang);
        if (!wordData) {
            return res.status(404).send("Aucun mot trouvé.");
        }

        const pseudo = req.session.joueur?.pseudo || null;
        let score = null;

        if (pseudo) {
            const joueur = await Joueur.findOne({ where: { pseudo } });
            score = joueur?.score ?? null;
        }

        res.render("def", {
            layout: "layout",
            title: "Jeu des définitions",
            word: wordData.word,
            wordId: wordData.wordId,
            language: lang,
            time,
            isConnected: !!pseudo,
            pseudo,
            globalScore: score
        });

    } catch (err) {
        console.error("Erreur dans /def :", err);
        res.status(500).send("Erreur lors de la génération de la partie.");
    }
});

router.post("/def/:wordId", async (req, res) => {
    try {
        const { wordId } = req.params;
        const defs = Array.isArray(req.body.definition)
            ? req.body.definition
            : [req.body.definition];

        console.log("Données reçues dans le POST /def/:wordId:");
        console.log("Params:", req.params);
        console.log("Body:", req.body);
        console.log("Définitions soumises:", defs);

        const pseudo = req.session.joueur?.pseudo || "anonyme";
        const word = await Word.findByPk(wordId);
        if (!word) return res.status(404).send("Mot non trouvé.");

        const existingDefs = await Definition.findAll({
            include: {
                model: Word,
                where: { id: wordId }
            }
        });
        const existingTexts = new Set(existingDefs.map(def => def.definition.toLowerCase()));

        let validDefs = 0;
        for (let def of defs) {
            if (!def || typeof def !== 'string' || def.trim().length === 0) {
                // Si la définition est invalide (null, undefined ou vide), on la saute
                continue;
            }
            
            const text = def.trim();
            if (text.length < 5 || text.length > 200) continue;
            if (existingTexts.has(text.toLowerCase())) continue;

            const newDef = await Definition.create({ definition: text, source: pseudo });
            await WordDefinition.create({ 'w-id': word.id, 'd-id': newDef.id });
            validDefs++;
        }

        let updatedScore = null;
        if (req.session.joueur && validDefs > 0) {
            const joueur = await Joueur.findOne({ where: { pseudo } });
            updatedScore = joueur.score + validDefs * 5;
            await Joueur.update({ score: updatedScore }, { where: { pseudo } });
            req.session.joueur.score = updatedScore;
        }

        res.render("def_result", {
            layout: "layout",
            title: "Résultat du jeu des définitions",
            pseudo,
            gainedPoints: validDefs * 5,
            updatedScore,
            isConnected: !!req.session.joueur
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de la soumission.");
    }
});

// FONCTIONS

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
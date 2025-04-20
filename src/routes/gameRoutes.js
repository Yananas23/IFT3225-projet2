const express = require("express");
const sequelize = require("../config/database");
const Joueur = require("../models/joueur");
const Word = require("../models/word");
const Definition = require("../models/definition");
const WordDefinition = require("../models/word_definition");

const router = express.Router();

// Routes finales
router.get("/word/:lg?/:time?/:hint?", async (req, res) => {
    try {
        const { lg = "en", time = 60 } = req.params;  // Langue et temps par défaut
        const hintIntervalTime = req.params.hint || 10;  // Par défaut, 10 secondes

        // Récupérer un mot aléatoire de la langue spécifiée
        const wordData = await getRandomWord(lg);
        if (!wordData) {
            return res.status(404).send("Aucun mot trouvé.");
        }

        const { word, wordId, definition } = wordData;

        // Initialiser le score du joueur
        const initialScore = 10 * word.length;
        let score = initialScore;

        // Si le joueur est connecté, on récupère son pseudo
        const pseudo = req.session.joueur?.pseudo || "anonyme";

        // Afficher la page de jeu avec les informations nécessaires
        res.render("game", {
            layout: "layout",
            title: "Jeu de mots",
            word,
            wordId,
            definition,
            timeLimit: time,
            score,
            pseudo,
            isConnected: pseudo !== "anonyme",
            hintIntervalTime,
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de la création du jeu.");
    }
});


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
            // Par une requête SQL manuelle :
            const joueurResponse = await sequelize.query(
                `SELECT * FROM joueur WHERE pseudo = ?`,
                [pseudo]
              );
            
            const joueur = joueurResponse[0]; // Le premier élément du tableau retourné (si un joueur existe)
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
            globalScore: score,
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

        // Requête SQL manuelle pour récupérer le mot avec son ID
        const wordData = await sequelize.query(
            `SELECT * FROM word WHERE id = ?`, 
            [wordId]
        );

        if (!wordData || wordData.length === 0) {
            return res.status(404).send("Mot non trouvé.");
        }        

        // Requête SQL manuelle pour récupérer les définitions existantes
        const existingDefsResponse = await sequelize.query(
            `SELECT * FROM definition d 
             JOIN word_definition wd ON d.id = wd.\`d-id\` 
             WHERE wd.\`w-id\` = ?`, [wordId]
        );

        const existingDefs = existingDefsResponse.data;

        // Créer un ensemble des définitions déjà existantes (pour éviter les doublons)
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

            // Si la définition est valide, on l'ajoute à la base de données
            const newDefResponse = await sequelize.query(
                `INSERT INTO definition (definition, source) VALUES (?, ?)`,
                [text, pseudo]
            );

            const newDefId = newDefResponse.insertId;
            console.log("Def response! ", newDefId)

            // Création de l'association entre le mot et la définition
            await sequelize.query(
                `INSERT INTO word_definition (\`w-id\`, \`d-id\`) VALUES (?, ?)`,
                [wordId, newDefId],
            );

            validDefs++;
        }

        let updatedScore = null;
        if (req.session.joueur && validDefs > 0) {
            // Par une requête SQL manuelle :
            const joueurResponse = await sequelize.query(
                `SELECT * FROM joueur WHERE pseudo = ?`,
                [pseudo]
            );
            
            const joueur = joueurResponse[0];
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


/*
// getRandomWord pour sequelize seulement
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
*/

async function getRandomWord(lang = "en") {
    try {
        // Récupérer tous les mots de la langue
        const words = await Word.findAll({ where: { lang } });
        if (!words || words.length === 0) return null;

        // On prend l’id des mots trouvés
        const wordIds = words.data.map(w => w.id);

        // Aller chercher les définitions pour ces mots
        const definitionsRaw = await sequelize.query(
            `SELECT w.id as wordId, w.word, d.id as definitionId, d.definition
             FROM word w
             JOIN word_definition wd ON w.id = wd.\`w-id\`
             JOIN definition d ON d.id = wd.\`d-id\`
             WHERE w.lang = ?`,
            [lang]
        );

        const defs = definitionsRaw.data;

        if (defs.length === 0) return null;

        // Choisir un mot/définition aléatoire
        const random = defs[Math.floor(Math.random() * defs.length)];

        return {
            word: random.word,
            wordId: random.wordId,
            definition: random.definition,
            definitionId: random.definitionId
        };

    } catch (err) {
        console.error("Erreur dans getRandomWord :", err);
        return null;
    }
}



module.exports = router;
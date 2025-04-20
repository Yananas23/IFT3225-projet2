const express = require("express");
const https = require("https");
const Joueur = require("../models/joueur");
const Word = require("../models/word");
const WordDefinition = require("../models/word_definition");
const Definition = require("../models/definition");
const sequelize = require("../config/database");

const router = express.Router();

// <path>#/word/add?lien=[lien vers le fichier en ligne]
router.get("/add", async (req, res) => {
    try {
        const url = req.query.lien;
        if (!url || !url.startsWith("http")) {
            return res.status(400).json({ error: "URL invalide ou absente" });
        }

        https.get(url, (response) => {
            let data = "";

            response.on("data", (chunk) => {
                data += chunk;
            });

            response.on("end", async () => {
                try {
                    const lines = data.split("\n");

                    for (let line of lines) {
                        if (!line.trim()) continue; // Ignorer les lignes vides

                        let [lang, source, word, ...descriptionArray] = line.trim().split(/\s+/);
                        let definition = descriptionArray.join(" ");

                        if (!word || !definition) {
                            console.warn("Ligne ignorée (format incorrect) :", line);
                            continue;
                        }

                        let [wordEntry] = await Word.findOrCreate({ where: { word, lang } });
                        
                        let [definitionEntry] = await Definition.findOrCreate({ where: { definition, source } });

                        await WordDefinition.findOrCreate({
                            where: { 'w-id': wordEntry.id, 'd-id': definitionEntry.id }
                        });
                    }

                    res.json({ message: "Données insérées avec succès !" });
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ error: "Erreur lors de l'insertion des données" });
                }
            });
        }).on("error", (err) => {
            console.error(err);
            res.status(500).json({ error: "Erreur lors de la récupération des données" });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Route sans paramètre
router.get("", async (req, res) => {
    req.params.nb = 10; // 10 1er par défaut
    req.params.from = 1; // Id 1 par défaut
    await handleDefRequest(req, res);
});

// Route avec paramètre
router.get("/:nb", async (req, res) => {
    req.params.from = 1; // Id 1 par défaut
    await handleDefRequest(req, res);
});

router.get("/:nb/:from", async (req, res) => {
    await handleDefRequest(req, res);
});

async function handleDefRequest(req, res) {
    try {
        let nb = parseInt(req.params.nb, 10);
        let from = parseInt(req.params.from, 10);

        // Requête pour récupérer les mots avec pagination
        const results = await sequelize.query(
            `SELECT * FROM word LIMIT ${nb} OFFSET ${from - 1}`, 
            []
        );
	    const words = results.data;
        const result = [];

        // Pour chaque mot, récupérer ses définitions
        for (const word of words) {
            // Récupérer les définitions associées au mot
            const definitionsResult = await sequelize.query(
                `SELECT d.definition 
                 FROM definition d
                 JOIN word_definition wd ON d.id = wd.\`d-id\`
                 WHERE wd.\`w-id\` = ?`,
                [word.id]
            );

	const definitions = definitionsResult.data;

            result.push({
                word: word.word,
                id: word.id,
                def: definitions.map(d => d.definition)
            });
        }

        res.json({ words: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = router;
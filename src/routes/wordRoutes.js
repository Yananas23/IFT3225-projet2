const express = require("express");
const https = require("https");
const Joueur = require("../models/joueur");
const Word = require("../models/word");
const WordDefinition = require("../models/word_definition");
const Definition = require("../models/definition");

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

                        let [lang, provenance, word, ...descriptionArray] = line.trim().split(/\s+/);
                        let definition = descriptionArray.join(" ");

                        if (!word || !definition) {
                            console.warn("Ligne ignorée (format incorrect) :", line);
                            continue;
                        }

                        let [wordEntry] = await Word.findOrCreate({ where: { word, lang } });
                        
                        let [definitionEntry] = await Definition.findOrCreate({ where: { definition }  });

                        await WordDefinition.findOrCreate({
                            where: { 'w-id': wordEntry.id, 'd-id': definitionEntry.id },
                        });
                    }

                    res.json({ message: "Données insérées avec succès !"});
                } catch (error) {
                    res.status(500).json({ error: "Erreur lors de l'insertion des données" });
                }
            });
        }).on("error", () => {
            res.status(500).json({ error: "Erreur lors de la récupération des données" });
        });

    } catch (error) {
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

        // Requête avec jointures
        const wordsWithDefinitions = await Word.findAll({
            attributes: ['id', 'word'],
            include: [
                {
                    model: WordDefinition,
                    include: [
                        {
                            model: Definition,
                            attributes: ['id', 'definition']
                        }
                    ]
                }
            ],
            limit: nb,
            offset: from - 1
        });
        // console.log(wordsWithDefinitions);

        // Structuration du JSON
        const result = wordsWithDefinitions.map(word => ({
            word: word.word,
            id: word.id,
            def: word.Word_Definitions ? word.Word_Definitions.map(wd => wd.Definition?.definition) : []
        }));

        res.json({ words: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




module.exports = router;
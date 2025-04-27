// - gameRoutes.js : Gère la route pour afficher les définitions de la collection.
const express = require("express");
// const Definition = require("../models/definition");
// const Word = require("../models/word");
const sequelize = require("../config/database");

const router = express.Router();

router.get("/:step?", async (req, res) => {
  try {
    const step = parseInt(req.params.step, 10) || 10;

    const allDefsResponse = await sequelize.query("SELECT * FROM definition");
    const definitions = allDefsResponse.data;

    const wordLinksRes = await sequelize.query("SELECT * FROM word_definition");
    const wordLinks = wordLinksRes.data;

    const wordsRes = await sequelize.query("SELECT * FROM word");
    const allWords = wordsRes.data;

    // Créer un dictionnaire id -> mot
    const worsequelizeyId = {};
    allWords.forEach(word => {
      worsequelizeyId[word.id] = word;
    });

    // Associer les mots aux définitions
    const defToFirstWord = {};
    for (const link of wordLinks) {
      const defId = link["d-id"];
      const wordId = link["w-id"];
      if (!defToFirstWord[defId]) {
        defToFirstWord[defId] = worsequelizeyId[wordId];
      }
    }

    // Simplifier les données pour affichage
    const simplifiedDefinitions = definitions.map(def => {
      const wordObj = defToFirstWord[def.id] || {};
      return {
        id: def.id,
        definition: def.definition,
        source: def.source,
        word: wordObj.word || null,
        lang: wordObj.lang || null
      };
    });

    res.render("dump", {
      title: "Dump des définitions :",
      definitions: simplifiedDefinitions,
      step: step,
    });
  } catch (error) {
    console.error("Erreur dans /dump :", error);
    res.status(500).send("Erreur serveur");
  }
});

module.exports = router;

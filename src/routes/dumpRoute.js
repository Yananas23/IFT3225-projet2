const express = require("express");
const Definition = require("../models/definition");
const Word = require("../models/word");

const router = express.Router();

router.get("/:step?", async (req, res) => {
  try {
    const step = parseInt(req.params.step, 10) || 10;

    const definitions = await Definition.findAll({
      include: [{
        model: Word,
        through: { attributes: [] }
      }]
    });
    
    const simplifiedDefinitions = definitions.map(def => {
      const firstWord = def.Words?.[0] || null;
      return {
        id: def.id,
        definition: def.definition,
        source: def.source,
        word: firstWord?.word || null,
        lang: firstWord?.lang || null
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

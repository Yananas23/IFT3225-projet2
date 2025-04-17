const express = require("express");
const Definition = require("../models/definition");
const Word = require("../models/word");

const router = express.Router();

router.get("/:step?", async (req, res) => {
  try {
    const step = parseInt(req.params.step) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * step;

    const { count, rows: definitions } = await Definition.findAndCountAll({
      include: [
        {
          model: Word,
          through: { attributes: [] },
        }
      ],
      limit: step,
      offset: offset
    });

    const totalPages = Math.ceil(count / step);

    res.render("dump", {
      title: "Dump des définitions",
      definitions,
      step,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error("Erreur dans /dump :", error);
    res.status(500).send("Erreur serveur");
  }
});

module.exports = router;

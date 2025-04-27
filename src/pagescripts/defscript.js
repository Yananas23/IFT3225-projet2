// - defscript.js : script pour le modèle def.ejs
let playerGlobalScore = globalScoreFromServer; // Score total du joueur
let gameWordID = wordIdFromServer; // ID du mot pour lequel on ajoute des descriptions
let tempsRestant = tempsInitial; // Durée d'une partie

document.addEventListener("DOMContentLoaded", () => {
  let compteur = 1;     

  function ajouterChamp() {
    compteur++;
    const div = document.getElementById("definition-list");
    const input = document.createElement("input");
    input.type = "text";
    input.name = "definition";
    input.placeholder = "Définition " + compteur;
    div.appendChild(document.createElement("br"));
    div.appendChild(input);
  }

  window.ajouterChamp = ajouterChamp; // rendre accessible au bouton

  // Création et insertion du timer
  const timerDisplay = document.createElement("p");
  timerDisplay.id = "timer";
  timerDisplay.innerHTML = `⏳ Temps restant : <b>${tempsRestant}</b> secondes`;

  const container = document.getElementById("timer-container");
  container.appendChild(timerDisplay);

  const interval = setInterval(() => {
    tempsRestant--;
    timerDisplay.innerHTML = `⏳ Temps restant : <b>${tempsRestant}</b> secondes`;      

    if (tempsRestant <= 0) {
      clearInterval(interval);
      timerDisplay.innerHTML = "⏰ Temps écoulé !";
      timerDisplay.style.color = "gray";

      const form = document.querySelector("form");
      if (form) {
        form.querySelector("button[type='submit']").disabled = true;

        const inputs = form.querySelectorAll("input[name='definition']");
        inputs.forEach(input => input.disabled = true);
      }
    }
  }, 1000);

  // Modifier le submi du formulaire
  const form = document.getElementById("defForm");

  if (form) {
    form.addEventListener("submit", function (e) {
      clearInterval(interval);

      e.preventDefault(); // Empêcher la soumission normale

      const inputs = form.querySelectorAll("input[name='definition']");
      const definitions = Array.from(inputs)
        .map(input => input.value.trim())
        .filter(val => val.length > 0);

      fetch(`/jeu/def/${gameWordID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ definitions, gameWordID })
      })
      .then(response => response.json())
      .then(data => {
        const resultContainer = document.createElement("div");
        resultContainer.className = "mt-4 p-3 border rounded bg-light";
    
        if (data.success) {
            const points = data.gainedPoints || 0;
            const scoreText = data.isConnected
                ? `Vous avez gagné <strong>${points}</strong> points. Score total : <b>${data.updatedScore}</b> pts.`
                : `<b>${points}</b> points potentiels (non enregistrés car non connecté).`;    
            resultContainer.innerHTML = `
                <p>${scoreText}</p>
            `;    
            // Si joueur connecté, mettre à jour l'affichage du score
            if (data.isConnected && data.updatedScore !== undefined) {
                document.getElementById("scoreGlobalDisplay").innerText = `Score global : ${data.updatedScore} pts`;
            }
        } else {
            resultContainer.innerHTML = `<p class="text-danger">Une erreur s'est produite lors de l'envoi.</p>`;
        }
    
        // Insérer dans la page sous le formulaire
        form.parentNode.appendChild(resultContainer);
    
        // Désactiver tous les champs et boutons du formulaire
        const inputs = form.querySelectorAll("input[name='definition']");
        inputs.forEach(input => input.disabled = true);
    
        form.querySelector("button[type='submit']").disabled = true;
        const addBtn = form.querySelector("button[type='button']");
        if (addBtn) addBtn.disabled = true;
    
    })
      .catch(error => {
        console.error("Erreur :", error);
        alert("Erreur lors de l'envoi des définitions.");
      });
    });
  }
});
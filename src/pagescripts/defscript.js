document.addEventListener("DOMContentLoaded", () => {
    let compteur = 1;
    
    let tempsRestant = tempsInitial;

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
    timerDisplay.innerHTML = `⏳ Temps restant : <strong>${tempsRestant}</strong> secondes`;

    const container = document.getElementById("timer-container");
    container.appendChild(timerDisplay);

    const interval = setInterval(() => {
      tempsRestant--;
      timerDisplay.innerHTML = `⏳ Temps restant : <strong>${tempsRestant}</strong> secondes`;      

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
});
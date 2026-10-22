# The Albedo Renegades: Shadow of Elanthria ⚔️🐉

Un RPG Roguelike 3D avanzato ispirato a **Dungeons & Dragons**, sviluppato con **Vite**, **TypeScript**, **Three.js** e **Web Audio API procedurali**, ottimizzato per browser sia su **PC** che su **Mobile (smartphone e tablet)**.

---

## 🗺️ Ambientazione: L'Isola di Okkarn

Il gioco è ambientato nei quattro territori chiave della campagna D&D:

1. **Azren · Le Macerie della Milizia (Atto 1)**:
   - Antica grande città distrutta, dove la popolazione sopravvive nei ruderi ed è sottomessa a una spietata milizia di orchi. La periferia è un campo di battaglia pieno di barricate e macerie.
   - *Nemici*: Orco Soldato, Orco Berserker, Sciamano delle Macerie.
   - *Boss*: **Capitano Grummak il Frantumatore**.

2. **Elshiff · La Città Elfica Abbandonata (Atto 2)**:
   - Maestose rovine di marmo bianco e colonne intarsiate di rampicanti luminescenti, ora infestate da spettri e costrutti arcani impazziti.
   - *Nemici*: Ombra di Elshiff, Costrutto Elfico Corrotto, Arciere Spettrale.
   - *Boss*: **Regina Spettrale Vaeloria**.

3. **Foresta di Morgen & Isargard (Atto 3)**:
   - Fitta e tossica foresta che circonda Isargard, l'antica capitale rasa al suolo dal drago, ora territorio di caccia di troll titanici e aberrazioni.
   - *Nemici*: Troll della Palude, Bestia Crudele, Sputa-Spore Carnivoro.
   - *Boss*: **Vorrash, Signore di Isargard**.

4. **Grotte della Montagna Vazark (Atto 4 & Scontro Finale)**:
   - Caverne vulcaniche sature di magma, tesori accumulati e templi presidiati da fanatici koboldi verdi devoti al drago.
   - *Nemici*: Koboldo Verde con Lancia, Koboldo Bombarolo Suicida, Sciamano della Fiamma Draconica.
   - *Boss Finale*: **Vermithrax, Terrore di Elanthria** (Drago Antico a più fasi con soffio infuocato, telegrafi a terra e pioggia di meteore).

---

## 🛡️ Classi e Sottoclassi D&D 5e

| Classe | Sottoclassi | Stile di Gioco | Abilità 1 | Abilità 2 / Scatto |
| :--- | :--- | :--- | :--- | :--- |
| **Paladino** | *Giuramento di Devozione* / *Vendetta* | Spada & Scudo, Corazza pesante | **Punizione Divina (Smite)**: Colpo radioso devastante con boato e knockback | **Carica della Fede**: Scatto con scudo di luce |
| **Mago** | *Scuola di Evocazione* / *Abiurazione* | Bastone magico, Dardi a distanza | **Palla di Fuoco (Fireball)**: Esplosione a terra con bruciatura DoT | **Passo Velato (Misty Step)**: Teletrasporto arcano |
| **Guerriero** | *Campione* / *Maestro di Battaglia* | Spadone a due mani, Fendente d'urto | **Vortice d’Acciaio (Action Surge)**: Giro rotante a 360° | **Recupero delle Forze (Second Wind)**: Ripristina PV |
| **Ladro** | *Assassino* / *Mistificatore Arcano* | Doppi pugnali, Critici elevati | **Attacco Furtivo (Sneak Attack)**: Ventaglio di lame perforanti | **Azione Scaltra (Shadow Roll)**: Capriola con I-frames |
| **Chierico** | *Dominio della Vita* / *della Tempesta* | Mazza sacra & Scudo solare | **Colonna di Fuoco Sacro (Guiding Bolt)**: Raggio celeste ad area | **Parola Guaritrice**: Risana PV ed emette onda d'urto |

---

## 🎮 Controlli

### Su PC (Mouse & Tastiera)
- **WASD / Frecce**: Movimento del personaggio
- **Mouse**: Mira a terra 360° (con reticolo e raycasting)
- **Clic Sinistro / Spazio**: Attacco primario
- **Tasto Destro / Q**: Abilità 1 (es. Smite, Fireball, Vortice)
- **E / Shift**: Abilità 2 / Scatto (es. Passo Velato, Second Wind, Carica)
- **I / Tab**: Scheda Personaggio D&D e Zaino Inventario
- **P / Esc**: Pausa

### Su Mobile (Smartphone & Tablet)
- **Joystick Virtuale (in basso a sinistra)**: Movimento fluido omnidirezionale
- **Pulsanti Azione (in basso a destra)**: Attacco, Abilità 1, Abilità 2, Scatto
- **Smart Auto-Aim**: Quando si attacca su mobile, il personaggio aggancia e mira automaticamente al nemico più vicino!
- **Feedback Aptico**: Vibrazione leggera al fendente e vibrazione all'impatto subito.

---

## 🚀 Come Avviare il Gioco

Il server di sviluppo locale è già attivo. Puoi aprire il gioco nel tuo browser:

```bash
# Apri nel browser del PC:
http://127.0.0.1:5173/

# Per condividere e giocare su smartphone connesso allo stesso Wi-Fi:
http://<INDIRIZZO_IP_LOCALE>:5173/
```

Per compilare la versione di produzione:
```bash
npm run build
```
I file compilati autosufficienti si troveranno nella cartella `dist/`.

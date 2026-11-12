// Démo autonome d'Ascendia : l'application React est servie telle quelle et
// ses appels à l'API sont traités dans le navigateur par un faux backend
// (backend.js), avec des données de démonstration.
import axios from "axios";
import { adapter, installDemo } from "./backend.js";

axios.defaults.adapter = adapter;
installDemo();
// Pas de await de premier niveau : le module principal importe du code partagé
// avec ce point d'entrée, qui doit donc avoir fini de s'évaluer.
import("../src/main.jsx");

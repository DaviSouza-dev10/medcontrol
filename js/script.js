import { db, auth } from "./firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

let remediosMonitorados = [];
let horarioIntervalId = null;

window.salvarRemedio = async function () {
    const nome = document.getElementById("nome").value;
    const dose = document.getElementById("dose").value;
    const horario = document.getElementById("horario").value;

    if (nome === "" || dose === "" || horario === "") {
        alert("Preencha todos os campos!");
        return;
    }

    if (!auth.currentUser) {
        alert("Voce precisa estar logado para salvar um remedio.");
        window.location.href = "login.html";
        return;
    }

    try {
        await addDoc(collection(db, "medicamentos"), {
            nome,
            dose,
            horario,
            userId: auth.currentUser.uid,
            tomado: false
        });

        alert("Remedio salvo!");
        carregarRemedios();
    } catch (e) {
        alert("Erro: " + e.message);
    }
};

async function carregarRemedios() {
    const lista = document.getElementById("lista-remedios");
    if (!lista) return;

    lista.innerHTML = "";

    const usuarioAtual = auth.currentUser;
    if (!usuarioAtual) {
        return;
    }

    const listaRemedios = [];
    const querySnapshot = await getDocs(collection(db, "medicamentos"));

    querySnapshot.forEach((docItem) => {
        const data = docItem.data();

        if (data.userId === usuarioAtual.uid && data.tomado !== true) {
            const div = document.createElement("div");
            div.classList.add("remedio");

            div.innerHTML = `
                <p><strong>${data.nome}</strong></p>
                <p>Dose: ${data.dose}</p>
                <p>Horario: ${data.horario}</p>
                <button onclick="marcarTomado('${docItem.id}', this)">
                    Marcar como tomado
                </button>
            `;

            lista.appendChild(div);

            listaRemedios.push({
                id: docItem.id,
                nome: data.nome,
                horario: data.horario,
                notificado: false
            });
        }
    });

    remediosMonitorados = listaRemedios;
    iniciarVerificacaoHorario();
}

window.marcarTomado = async function (id, botao) {
    if (!auth.currentUser) {
        alert("Sua sessao expirou. Entre novamente.");
        window.location.href = "login.html";
        return;
    }

    try {
        const ref = doc(db, "medicamentos", id);

        await updateDoc(ref, {
            tomado: true,
            dataTomado: new Date().toLocaleString()
        });

        botao.innerText = "Tomado";
        botao.style.backgroundColor = "green";

        alert("Remedio marcado como tomado!");

        carregarRemedios();
        carregarHistorico();
    } catch (e) {
        alert("Erro: " + e.message);
    }
};

async function carregarHistorico() {
    const lista = document.getElementById("lista-registros");
    if (!lista) return;

    lista.innerHTML = "";

    const usuarioAtual = auth.currentUser;
    if (!usuarioAtual) {
        return;
    }

    const querySnapshot = await getDocs(collection(db, "medicamentos"));

    querySnapshot.forEach((docItem) => {
        const data = docItem.data();

        if (data.userId === usuarioAtual.uid && data.tomado === true) {
            const item = document.createElement("li");

            item.innerHTML = `
                <strong>${data.nome}</strong> -
                ${data.dataTomado || data.horario}
                <span style="color: green;">(Tomado)</span>
            `;

            lista.appendChild(item);
        }
    });
}

if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
}

function mostrarNotificacao(remedio) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Hora do seu remedio!", {
            body: remedio.nome + " - " + remedio.horario
        });
    }
}

function verificarHorario(remedios) {
    const agora = new Date();
    const horaAtual =
        agora.getHours().toString().padStart(2, "0") +
        ":" +
        agora.getMinutes().toString().padStart(2, "0");

    remedios.forEach((remedio) => {
        if (remedio.horario === horaAtual && !remedio.notificado) {
            mostrarNotificacao(remedio);
            tocarSom();
            remedio.notificado = true;
        }
    });
}

function iniciarVerificacaoHorario() {
    if (horarioIntervalId) {
        clearInterval(horarioIntervalId);
    }

    verificarHorario(remediosMonitorados);
    horarioIntervalId = setInterval(() => {
        verificarHorario(remediosMonitorados);
    }, 60000);
}

function tocarSom() {
    const audio = new Audio("assets/alerta.mp3.mp3");
    audio.play();
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        carregarRemedios();
        carregarHistorico();
        return;
    }

    remediosMonitorados = [];

    if (horarioIntervalId) {
        clearInterval(horarioIntervalId);
        horarioIntervalId = null;
    }

    if (window.location.pathname.endsWith("dashboard.html")) {
        window.location.href = "login.html";
    }
});

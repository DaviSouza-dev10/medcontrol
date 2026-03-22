import { db, auth } from "./firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

let remediosMonitorados = [];
let horarioIntervalId = null;

function criarConsultaUsuario(userId) {
    return query(
        collection(db, "medicamentos"),
        where("userId", "==", userId)
    );
}

window.salvarRemedio = async function () {
    const nome = document.getElementById("nome").value;
    const dose = document.getElementById("dose").value;
    const horario = document.getElementById("horario").value;

    if(nome.trim() === "" || dose.trim() === "" || horario === ""){
    alert("Preencha todos os campos!");
    return;
}

if(nome.length < 2){
    alert("Nome do remédio muito curto!");
    return;
}

if(isNaN(dose)){
    alert("Dose deve ser um número (ex: 500)");
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

        document.getElementById("nome").value = "";
        document.getElementById("dose").value = "";
        document.getElementById("horario").value = "";

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

    try {
        const listaRemedios = [];
        const querySnapshot = await getDocs(criarConsultaUsuario(usuarioAtual.uid));

        querySnapshot.forEach((docItem) => {
            const data = docItem.data();

            if (data.tomado !== true) {
                const div = document.createElement("div");
                div.classList.add("remedio");

                div.innerHTML = `
    <p><strong>${data.nome}</strong></p>
    <p>Dose: ${data.dose}</p>
    <p>Horario: ${data.horario}</p>

    <button class="btn-tomado">Tomado</button>
    <button class="btn-editar">Editar</button>
    <button class="btn-excluir">Excluir</button>
`;

                const botaoTomado = div.querySelector(".btn-tomado");
                const botaoEditar = div.querySelector(".btn-editar");
                const botaoExcluir = div.querySelector(".btn-excluir");

                botaoTomado.addEventListener("click", () => {
                    window.marcarTomado(docItem.id, botaoTomado);
                });

                botaoEditar.addEventListener("click", () => {
                    window.editarRemedio(docItem.id, data.nome, data.dose, data.horario);
                });

                botaoExcluir.addEventListener("click", () => {
                    window.excluirRemedio(docItem.id);
                });

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
    } catch (e) {
        console.error("Erro ao carregar remedios:", e);
        alert("Erro ao carregar os remedios: " + e.message);
    }
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

    try {
        const querySnapshot = await getDocs(criarConsultaUsuario(usuarioAtual.uid));

        querySnapshot.forEach((docItem) => {
            const data = docItem.data();

            if (data.tomado === true) {
                const item = document.createElement("li");

                item.innerHTML = `
                <strong>${data.nome}</strong> -
                ${data.dataTomado || data.horario}
                <span style="color: green;">(Tomado)</span>
            `;

                lista.appendChild(item);
            }
        });
    } catch (e) {
        console.error("Erro ao carregar historico:", e);
        alert("Erro ao carregar o historico: " + e.message);
    }
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

window.excluirRemedio = async function (id) {
    const confirmar = confirm("Tem certeza que deseja excluir?");

    if (!confirmar) return;

    try {
        const ref = doc(db, "medicamentos", id);
        await deleteDoc(ref);

        alert("Remedio excluido!");
        carregarRemedios();
        carregarHistorico();
    } catch (e) {
        alert("Erro: " + e.message);
    }
};

window.editarRemedio = async function (id, nomeAtual, doseAtual, horarioAtual) {
    const novoNome = prompt("Novo nome:", nomeAtual);
    const novaDose = prompt("Nova dose:", doseAtual);
    const novoHorario = prompt("Novo horario:", horarioAtual);

    if (!novoNome || !novaDose || !novoHorario) {
        alert("Edicao cancelada!");
        return;
    }

    try {
        const ref = doc(db, "medicamentos", id);

        await updateDoc(ref, {
            nome: novoNome,
            dose: novaDose,
            horario: novoHorario
        });

        alert("Remedio atualizado!");
        carregarRemedios();
        carregarHistorico();
    } catch (e) {
        alert("Erro: " + e.message);
    }
};

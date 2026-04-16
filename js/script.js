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

function normalizarRemedio(nome, dose, horario) {
    return {
        nome: nome.trim(),
        dose: dose.trim(),
        horario
    };
}

function validarRemedio(nome, dose, horario) {
    if (nome === "" || dose === "" || horario === "") {
        return "Preencha todos os campos!";
    }

    if (nome.length < 2) {
        return "Nome do remedio muito curto!";
    }

    return null;
}

function atualizarStatusNotificacao() {
    const status = document.getElementById("notification-status");
    const botao = document.getElementById("btn-notificacoes");

    if (!status || !botao) return;

    if (!("Notification" in window)) {
        status.textContent = "Este navegador nao suporta notificacoes.";
        status.className = "notification-state blocked";
        botao.disabled = true;
        botao.textContent = "Indisponivel";
        return;
    }

    if (Notification.permission === "granted") {
        status.textContent = "Permissao liberada para notificacoes.";
        status.className = "notification-state active";
        botao.textContent = "Notificacoes ativas";
        botao.disabled = true;
        return;
    }

    if (Notification.permission === "denied") {
        status.textContent = "Permissao bloqueada. Ative manualmente nas configuracoes do navegador.";
        status.className = "notification-state blocked";
        botao.textContent = "Permissao bloqueada";
        botao.disabled = true;
        return;
    }

    status.textContent = "Permissao ainda nao concedida.";
    status.className = "notification-state pending";
    botao.textContent = "Ativar notificacoes";
    botao.disabled = false;
}

async function solicitarPermissaoNotificacao() {
    if (!("Notification" in window)) {
        alert("Este navegador nao suporta notificacoes.");
        return;
    }

    const permissao = await Notification.requestPermission();
    atualizarStatusNotificacao();

    if (permissao === "granted") {
        new Notification("Notificacoes ativadas", {
            body: "Voce recebera lembretes quando houver remedios no horario cadastrado."
        });
    }
}

function atualizarResumo(ativos, historico) {
    const contadorAtivos = document.getElementById("contador-ativos");
    const contadorHistorico = document.getElementById("contador-historico");

    if (contadorAtivos && typeof ativos === "number") {
        contadorAtivos.textContent = String(ativos);
    }

    if (contadorHistorico && typeof historico === "number") {
        contadorHistorico.textContent = String(historico);
    }
}

window.salvarRemedio = async function () {
    const remedio = normalizarRemedio(
        document.getElementById("nome").value,
        document.getElementById("dose").value,
        document.getElementById("horario").value
    );

    const erroValidacao = validarRemedio(
        remedio.nome,
        remedio.dose,
        remedio.horario
    );

    if (erroValidacao) {
        alert(erroValidacao);
        return;
    }

    if (!auth.currentUser) {
        alert("Voce precisa estar logado para salvar um remedio.");
        window.location.href = "login.html";
        return;
    }

    try {
        await addDoc(collection(db, "medicamentos"), {
            nome: remedio.nome,
            dose: remedio.dose,
            horario: remedio.horario,
            userId: auth.currentUser.uid,
            tomado: false
        });

        document.getElementById("nome").value = "";
        document.getElementById("dose").value = "";
        document.getElementById("horario").value = "";

        alert("Remedio salvo!");
        carregarRemedios();
        carregarHistorico();
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
        const documentos = querySnapshot.docs.sort((a, b) => {
            const horarioA = a.data().horario || "";
            const horarioB = b.data().horario || "";
            return horarioA.localeCompare(horarioB);
        });

        documentos.forEach((docItem) => {
            const data = docItem.data();

            if (data.tomado !== true) {
                const card = document.createElement("article");
                card.className = "med-card";

                card.innerHTML = `
                    <div class="med-card-head">
                        <div>
                            <h3>${data.nome}</h3>
                            <p class="muted">Lembrete ativo para acompanhar sua rotina.</p>
                        </div>
                        <span class="tag">${data.horario}</span>
                    </div>
                    <div class="med-meta">
                        <span class="tag">Dose: ${data.dose}</span>
                        <span class="tag">Horario: ${data.horario}</span>
                    </div>
                    <div class="med-actions">
                        <button class="primary-btn btn-tomado action-success" type="button">Tomado</button>
                        <button class="secondary-btn btn-editar action-soft" type="button">Editar</button>
                        <button class="ghost-btn btn-excluir action-danger" type="button">Excluir</button>
                    </div>
                `;

                const botaoTomado = card.querySelector(".btn-tomado");
                const botaoEditar = card.querySelector(".btn-editar");
                const botaoExcluir = card.querySelector(".btn-excluir");

                botaoTomado.addEventListener("click", () => {
                    window.marcarTomado(docItem.id, botaoTomado);
                });

                botaoEditar.addEventListener("click", () => {
                    window.editarRemedio(docItem.id, data.nome, data.dose, data.horario);
                });

                botaoExcluir.addEventListener("click", () => {
                    window.excluirRemedio(docItem.id);
                });

                lista.appendChild(card);

                listaRemedios.push({
                    id: docItem.id,
                    nome: data.nome,
                    horario: data.horario,
                    notificado: false
                });
            }
        });

        if (listaRemedios.length === 0) {
            lista.innerHTML = `
                <div class="empty-state">
                    Nenhum remedio ativo por enquanto. Adicione o primeiro horario para montar sua rotina.
                </div>
            `;
        }

        remediosMonitorados = listaRemedios;
        atualizarResumo(listaRemedios.length, null);
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
            dataTomado: new Date().toLocaleString("pt-BR")
        });

        botao.textContent = "Tomado";
        botao.disabled = true;

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
        const documentos = querySnapshot.docs.sort((a, b) => {
            const valorA = a.data().dataTomado || a.data().horario || "";
            const valorB = b.data().dataTomado || b.data().horario || "";
            return valorB.localeCompare(valorA);
        });

        let totalHistorico = 0;

        documentos.forEach((docItem) => {
            const data = docItem.data();

            if (data.tomado === true) {
                totalHistorico += 1;

                const item = document.createElement("article");
                item.className = "history-card";
                item.innerHTML = `
                    <div class="history-item">
                        <div>
                            <strong>${data.nome}</strong>
                            <p class="muted">Dose: ${data.dose}</p>
                        </div>
                        <div class="tag">${data.dataTomado || data.horario}</div>
                    </div>
                `;

                lista.appendChild(item);
            }
        });

        if (totalHistorico === 0) {
            lista.innerHTML = `
                <div class="empty-state">
                    O historico ainda esta vazio. Assim que voce marcar um remedio como tomado, ele aparece aqui.
                </div>
            `;
        }

        atualizarResumo(remediosMonitorados.length, totalHistorico);
    } catch (e) {
        console.error("Erro ao carregar historico:", e);
        alert("Erro ao carregar o historico: " + e.message);
    }
}

function mostrarNotificacao(remedio) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Hora do seu remedio", {
            body: `${remedio.nome} - ${remedio.horario}`,
            icon: "assets/icon-192.svg",
            badge: "assets/icon-192.svg"
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
    audio.play().catch(() => {
        console.warn("Nao foi possivel tocar o audio de notificacao.");
    });
}

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

    if (novoNome === null || novaDose === null || novoHorario === null) {
        alert("Edicao cancelada!");
        return;
    }

    const remedioAtualizado = normalizarRemedio(
        novoNome,
        novaDose,
        novoHorario
    );

    const erroValidacao = validarRemedio(
        remedioAtualizado.nome,
        remedioAtualizado.dose,
        remedioAtualizado.horario
    );

    if (erroValidacao) {
        alert(erroValidacao);
        return;
    }

    try {
        const ref = doc(db, "medicamentos", id);

        await updateDoc(ref, {
            nome: remedioAtualizado.nome,
            dose: remedioAtualizado.dose,
            horario: remedioAtualizado.horario
        });

        alert("Remedio atualizado!");
        carregarRemedios();
        carregarHistorico();
    } catch (e) {
        alert("Erro: " + e.message);
    }
};

document.getElementById("btn-notificacoes")?.addEventListener("click", () => {
    solicitarPermissaoNotificacao();
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        atualizarStatusNotificacao();
        carregarRemedios();
        carregarHistorico();
        return;
    }

    remediosMonitorados = [];
    atualizarStatusNotificacao();
    atualizarResumo(0, 0);

    if (horarioIntervalId) {
        clearInterval(horarioIntervalId);
        horarioIntervalId = null;
    }

    if (window.location.pathname.endsWith("dashboard.html")) {
        window.location.href = "login.html";
    }
});

atualizarStatusNotificacao();

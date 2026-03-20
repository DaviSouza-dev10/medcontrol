import { db, auth } from "./firebase.js";
import { 
    collection, 
    addDoc, 
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// =============================
// SALVAR REMÉDIO
// =============================
window.salvarRemedio = async function() {

    let nome = document.getElementById("nome").value;
    let dose = document.getElementById("dose").value;
    let horario = document.getElementById("horario").value;

    if(nome === "" || dose === "" || horario === ""){
        alert("Preencha todos os campos!");
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

        alert("Remédio salvo!");

        carregarRemedios(); // atualiza lista

    } catch (e) {
        alert("Erro: " + e.message);
    }
}

// =============================
// LISTAR REMÉDIOS (PRINCIPAL)
// =============================
async function carregarRemedios() {

    let lista = document.getElementById("lista-remedios");
    lista.innerHTML = "";

    let listaRemedios = [];

    const querySnapshot = await getDocs(collection(db, "medicamentos"));

    querySnapshot.forEach((docItem) => {

        let data = docItem.data();

       if(data.userId === auth.currentUser.uid && data.tomado !== true){

            let div = document.createElement("div");
            div.classList.add("remedio");

            div.innerHTML = `
                <p><strong>${data.nome}</strong></p>
                <p>Dose: ${data.dose}</p>
                <p>Horário: ${data.horario}</p>
                <button onclick="marcarTomado('${docItem.id}', this)">
                    ${data.tomado ? "Tomado ✔" : "Marcar como tomado"}
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

    verificarHorario(listaRemedios);
}

// =============================
// MARCAR COMO TOMADO
// =============================
window.marcarTomado = async function(id, botao){

    try {
        const ref = doc(db, "medicamentos", id);

        await updateDoc(ref, {
            tomado: true,
            dataTomado: new Date().toLocaleString()
        });

        botao.innerText = "Tomado ✔";
        botao.style.backgroundColor = "green";

        alert("Remédio marcado como tomado!");

        carregarHistorico(); // 🔥 atualiza histórico

    } catch (e) {
        alert("Erro: " + e.message);
    }
}

// =============================
// HISTÓRICO (SÓ TOMADOS)
// =============================
async function carregarHistorico() {

    const lista = document.getElementById("lista-registros");

    if(!lista) return; // evita erro se não existir no HTML

    lista.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "medicamentos"));

    querySnapshot.forEach((docItem) => {
        const data = docItem.data();

        if(data.userId === auth.currentUser.uid && data.tomado === true){

            const item = document.createElement("li");

            item.innerHTML = `
                <strong>${data.nome}</strong> - 
                ${data.dataTomado || data.horario}
                <span style="color: green;">(Tomado ✔)</span>
            `;

            lista.appendChild(item);
        }
    });
}

// =============================
// NOTIFICAÇÕES
// =============================
Notification.requestPermission();

function mostrarNotificacao(remedio) {
    if(Notification.permission === "granted"){
        new Notification("Hora do seu remédio!", {
            body: remedio.nome + " - " + remedio.horario
        });
    }
}

function verificarHorario(remedios) {

    setInterval(() => {

        let agora = new Date();

        let horaAtual = agora.getHours().toString().padStart(2, '0') + ":" + 
                        agora.getMinutes().toString().padStart(2, '0');

        remedios.forEach(remedio => {

            if(remedio.horario === horaAtual && !remedio.notificado){

                mostrarNotificacao(remedio);
                tocarSom();
                remedio.notificado = true;
            }

        });

    }, 60000);
}

// =============================
// SOM
// =============================
function tocarSom() {
    let audio = new Audio("../assets/alerta.mp3.mp3");
    audio.play();
}

// =============================
// INICIAR QUANDO USUÁRIO LOGAR
// =============================
auth.onAuthStateChanged(user => {
    if(user){
        carregarRemedios();
        carregarHistorico();
    }
});
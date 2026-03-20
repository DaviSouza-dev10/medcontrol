import { db, auth } from "./firebase.js";
import { 
    collection, 
    addDoc, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

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
            userId: auth.currentUser.uid
        });

        alert("Remédio salvo!");

        carregarRemedios(); // atualiza lista

    } catch (e) {
        alert("Erro: " + e.message);
    }
}

// 🔥 FUNÇÃO PARA MOSTRAR OS DADOS
async function carregarRemedios() {

    let lista = document.getElementById("lista-remedios");
    lista.innerHTML = "";

    // 🔥 LISTA PARA NOTIFICAÇÃO
    let listaRemedios = [];

    const querySnapshot = await getDocs(collection(db, "medicamentos"));

    querySnapshot.forEach((doc) => {

        let data = doc.data();

        if(data.userId === auth.currentUser.uid){

            let div = document.createElement("div");
            div.classList.add("remedio");

            div.innerHTML = `
                <p><strong>${data.nome}</strong></p>
                <p>Dose: ${data.dose}</p>
                <p>Horário: ${data.horario}</p>
                <button onclick="marcarTomado(this)">Marcar como tomado</button>
            `;

            lista.appendChild(div);

            // 🔔 AQUI É A PARTE QUE FALTAVA
            listaRemedios.push({
                nome: data.nome,
                horario: data.horario,
                notificado: false
            });
        }
    });

    // 🔔 INICIA VERIFICAÇÃO DE HORÁRIO
    verificarHorario(listaRemedios);
}

// carregar ao abrir a página
window.onload = carregarRemedios;

function marcarTomado(botao){
    botao.innerText = "Tomado ✔";
    botao.style.backgroundColor = "green";
}

// 🔔 pedir permissão
Notification.requestPermission().then(permission => {
    console.log("Permissão:", permission);
});

// 🔔 mostrar notificação
function mostrarNotificacao(remedio) {

    if(Notification.permission === "granted"){
        new Notification("Hora do seu remédio!", {
            body: remedio.nome + " - " + remedio.horario
        });
    }
}

// 🔔 verificar horário
function verificarHorario(remedios) {

    setInterval(() => {

        let agora = new Date();

        let horaAtual = agora.getHours().toString().padStart(2, '0') + ":" + 
                        agora.getMinutes().toString().padStart(2, '0');

        remedios.forEach(remedio => {

            if(remedio.horario === horaAtual && !remedio.notificado){

                mostrarNotificacao(remedio);
                remedio.notificado = true;

            }

        });

    }, 60000);
}
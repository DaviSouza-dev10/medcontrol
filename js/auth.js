import { auth } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

window.cadastrar = function () {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const confirmarSenhaInput = document.getElementById("confirmarSenha");

    if (confirmarSenhaInput && senha !== confirmarSenhaInput.value) {
        alert("As senhas nao coincidem.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, senha)
        .then(() => {
            alert("Conta criada com sucesso!");
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert("Erro: " + error.message);
        });
};

window.login = function () {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    signInWithEmailAndPassword(auth, email, senha)
        .then(() => {
            alert("Login realizado!");
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            alert("Erro: " + error.message);
        });
};

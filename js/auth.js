alert("auth conectado!");
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// CADASTRO
window.cadastrar = function() {
    let email = document.getElementById("email").value;
    let senha = document.getElementById("senha").value;

    createUserWithEmailAndPassword(auth, email, senha)
        .then((userCredential) => {
            alert("Conta criada com sucesso!");
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert("Erro: " + error.message);
        });
}

// LOGIN
window.login = function() {
    let email = document.getElementById("email").value;
    let senha = document.getElementById("senha").value;

    signInWithEmailAndPassword(auth, email, senha)
        .then((userCredential) => {
            alert("Login realizado!");
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            alert("Erro: " + error.message);
        });
}
import { auth } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

window.cadastrar = function() {

    let email = document.getElementById("email").value.trim();
    let senha = document.getElementById("senha").value.trim();
    let confirmarSenha = document.getElementById("confirmarSenha").value.trim();

    // 🔴 VALIDAÇÕES

    if(email === "" || senha === "" || confirmarSenha === ""){
        alert("Preencha todos os campos!");
        return;
    }

    if(!email.includes("@") || !email.includes(".")){
        alert("Digite um email válido!");
        return;
    }

    if(senha.length < 6){
        alert("A senha deve ter pelo menos 6 caracteres!");
        return;
    }

    if(senha !== confirmarSenha){
        alert("As senhas não coincidem!");
        return;
    }

    // ✅ SE PASSAR, CADASTRA
    createUserWithEmailAndPassword(auth, email, senha)
        .then(() => {
            alert("Conta criada com sucesso!");
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert("Erro: " + error.message);
        });
}

window.login = function() {

    let email = document.getElementById("email").value.trim();
    let senha = document.getElementById("senha").value.trim();

    if(email === "" || senha === ""){
        alert("Preencha todos os campos!");
        return;
    }

    signInWithEmailAndPassword(auth, email, senha)
        .then(() => {
            alert("Login realizado!");
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            alert("Email ou senha inválidos!");
        });
}

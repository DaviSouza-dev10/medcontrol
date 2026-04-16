let deferredInstallPrompt = null;

async function registrarServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    try {
        await navigator.serviceWorker.register("./sw.js");
    } catch (error) {
        console.error("Falha ao registrar service worker:", error);
    }
}

function atualizarInstallTip(texto) {
    const tip = document.getElementById("install-tip");
    if (tip) {
        tip.textContent = texto;
    }
}

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    atualizarInstallTip("O app pode ser instalado no celular pelo navegador para ficar mais facil de acessar.");
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    atualizarInstallTip("App instalado com sucesso. Isso ajuda na experiencia, mas as notificacoes com o app fechado ainda dependem de push.");
});

window.instalarApp = async function () {
    if (!deferredInstallPrompt) {
        atualizarInstallTip("Se o navegador nao mostrou a instalacao, abra o menu e procure por 'Instalar app' ou 'Adicionar a tela inicial'.");
        return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
};

document.getElementById("btn-instalar")?.addEventListener("click", () => {
    window.instalarApp();
});

registrarServiceWorker();

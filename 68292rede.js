// @ts-check

class PetSnapApp {
    constructor() {
        this.authScreen = document.getElementById('auth-screen');
        this.welcomeHeader = document.getElementById('welcome-header');
        this.usernameInput = /** @type {HTMLInputElement} */ (document.getElementById('username'));
        
        // Elementos de Navegacao
        this.tabMapa = document.getElementById('tab-mapa');
        this.tabChat = document.getElementById('tab-chat');
        this.panelMapa = document.getElementById('panel-mapa');
        this.panelChat = document.getElementById('panel-chat');
        
        // Bloqueio/Desbloqueio do Chat
        this.chatLocked = document.getElementById('chat-locked');
        this.chatUnlocked = document.getElementById('chat-unlocked');
        this.friendStatusText = document.getElementById('friend-status-text');
        this.playersList = document.getElementById('players-list');

        // Busca por Nickname
        this.searchNicknameInput = /** @type {HTMLInputElement} */ (document.getElementById('search-nickname'));
        this.btnBuscarNick = document.getElementById('btn-buscar-nick');
        this.searchResultDiv = document.getElementById('search-result');
        
        // Chat
        this.btnEnviar = document.getElementById('btn-enviar');
        this.msgInput = /** @type {HTMLInputElement} */ (document.getElementById('msg-input'));
        this.chatMessages = document.getElementById('chat-messages');

        /** @type {any} Instancia do mapa */
        this.map = null;
        this.hasFriend = false;
        this.activeFriendName = "";

        this.init();
    }

    init() {
        this.bindNavigation();
        this.bindAuth();
        this.bindChat();
        this.bindNicknameSearch();
    }

    bindNavigation() {
        this.tabMapa?.addEventListener('click', () => {
            this.tabMapa?.classList.add('active');
            this.tabChat?.classList.remove('active');
            this.panelMapa?.classList.add('active');
            this.panelChat?.classList.remove('active');
            if (this.map) setTimeout(() => this.map.invalidateSize(), 100);
        });

        this.tabChat?.addEventListener('click', () => {
            this.tabChat?.classList.add('active');
            this.tabMapa?.classList.remove('active');
            this.panelChat?.classList.add('active');
            this.panelMapa?.classList.remove('active');
        });
    }

    bindAuth() {
        const btnLogin = document.getElementById('btn-login-local');
        btnLogin?.addEventListener('click', () => {
            if (this.usernameInput) {
                const user = this.usernameInput.value.trim();
                if (user === "") {
                    alert("Digite seu nome de usuario");
                    return;
                }
                if (this.authScreen) this.authScreen.style.display = 'none';
                if (this.welcomeHeader) this.welcomeHeader.innerText = `PetSnap - Ola, ${user}`;
                
                this.carregarMapaReal();
            }
        });
    }

    carregarMapaReal() {
        let lat = -25.516;
        let lng = -54.580;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                lat = position.coords.latitude;
                lng = position.coords.longitude;
                this.renderizarMapa(lat, lng);
            }, () => {
                this.renderizarMapa(lat, lng);
            });
        } else {
            this.renderizarMapa(lat, lng);
        }
    }

    /**
     * @param {number} lat
     * @param {number} lng
     */
    renderizarMapa(lat, lng) {
        // @ts-ignore Inicializa o Leaflet Map
        this.map = L.map('map').setView([lat, lng], 15);

        // @ts-ignore
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(this.map);

        // @ts-ignore
        L.marker([lat, lng]).addTo(this.map).bindPopup('Sua Localizacao').openPopup();

        this.gerarJogadoresNoRadar(lat, lng);
    }

    /**
     * @param {number} myLat
     * @param {number} myLng
     */
    gerarJogadoresNoRadar(myLat, myLng) {
        const nomesFalsos = ["Gabriel_99", "Ana_Dev", "Lucas_Hunter"];
        if (!this.playersList) return;
        this.playersList.innerHTML = "";

        nomesFalsos.forEach((nome, index) => {
            const offsetLat = (index + 1) * 0.003 * (index % 2 === 0 ? 1 : -1);
            const offsetLng = (index + 1) * 0.004 * (index % 2 === 0 ? -1 : 1);
            const pLat = myLat + offsetLat;
            const pLng = myLng + offsetLng;

            // @ts-ignore
            L.marker([pLat, pLng]).addTo(this.map).bindPopup(`Jogador: ${nome}`);

            const row = document.createElement('div');
            row.className = 'player-row';
            row.innerHTML = `
                <span>${nome} (perto de voce)</span>
                <button class="btn-action" id="add-${index}">Adicionar</button>
            `;
            this.playersList?.appendChild(row);

            const btnAdd = document.getElementById(`add-${index}`);
            btnAdd?.addEventListener('click', () => {
                if (btnAdd.classList.contains('disabled')) return;
                
                btnAdd.innerText = "Aguardando...";
                btnAdd.classList.add('disabled');

                setTimeout(() => {
                    this.aceitarSolicitacaoAmizade(nome);
                    btnAdd.innerText = "Amigos";
                }, 3000);
            });
        });
    }

    bindNicknameSearch() {
        this.btnBuscarNick?.addEventListener('click', () => {
            if (!this.searchNicknameInput || !this.searchResultDiv) return;

            const nickDigitado = this.searchNicknameInput.value.trim();

            if (nickDigitado === "") {
                alert("Por favor, digite um nickname para buscar");
                return;
            }

            this.searchResultDiv.style.display = "block";
            this.searchResultDiv.innerHTML = `
                <div class="player-row" style="margin-top: 5px; background: #2f2f42; border: 1px dashed #fffc00;">
                    <span>🔍 Encontrado: <strong>${nickDigitado}</strong></span>
                    <button class="btn-action" id="btn-enviar-convite-nick">Convidar</button>
                </div>
            `;

            const btnConvidar = document.getElementById('btn-enviar-convite-nick');
            btnConvidar?.addEventListener('click', () => {
                if (btnConvidar.classList.contains('disabled')) return;

                btnConvidar.innerText = "Pendente...";
                btnConvidar.classList.add('disabled');

                // Simula o amigo aceitando a solicitação em outro dispositivo após 4 segundos
                setTimeout(() => {
                    this.aceitarSolicitacaoAmizade(nickDigitado);
                    if (this.searchResultDiv) this.searchResultDiv.style.display = "none";
                    this.searchNicknameInput.value = "";
                }, 4000);
            });
        });
    }

    /**
     * @param {string} nomeAmigo
     */
    aceitarSolicitacaoAmizade(nomeAmigo) {
        alert(`${nomeAmigo} aceitou sua solicitacao! O pet compartilhado e o chat foram liberados na outra aba.`);
        
        this.hasFriend = true;
        this.activeFriendName = nomeAmigo;

        // CORREÇÃO: Propriedade duplicada removida!
        if (this.chatLocked) this.chatLocked.style.display = 'none';
        if (this.chatUnlocked) this.chatUnlocked.style.display = 'flex';
        if (this.friendStatusText) this.friendStatusText.innerText = `Voce e ${nomeAmigo} estao cuidando desta criatura virtual.`;
    }

    bindChat() {
        this.btnEnviar?.addEventListener('click', () => this.sendChatMessage());
        this.msgInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
    }

    sendChatMessage() {
        if (!this.msgInput) return;
        const text = this.msgInput.value.trim();
        if (text === "") return;

        const newMsg = document.createElement('div');
        newMsg.style.margin = "8px 0";
        newMsg.style.textAlign = "right";
        newMsg.innerHTML = `<span style="background: #fffc00; color: black; padding: 6px 12px; border-radius: 12px 12px 0 12px; display: inline-block; max-width: 80%; font-size: 14px;">${text}</span>`;
        
        this.chatMessages?.appendChild(newMsg);
        this.msgInput.value = "";
        
        if (this.chatMessages) this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        setTimeout(() => {
            const newMsgFriend = document.createElement('div');
            newMsgFriend.style.margin = "8px 0";
            newMsgFriend.style.textAlign = "left";
            newMsgFriend.innerHTML = `<span style="background: #3d3d5c; color: white; padding: 6px 12px; border-radius: 12px 12px 12px 0; display: inline-block; max-width: 80%; font-size: 14px;"><strong style="color: #fffc00; display: block; font-size: 11px; margin-bottom: 2px;">${this.activeFriendName}</strong>Consegui ver a sua mensagem no nosso painel</span>`;
            
            this.chatMessages?.appendChild(newMsgFriend);
            if (this.chatMessages) this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 1500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PetSnapApp();
});

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://dgjwxlugbrdwvwnlznff.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnand4bHVnYnJkd3Z3bmx6bmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDU4NjQsImV4cCI6MjA4OTAyMTg2NH0.3BaOPr0QDW72moXv5aZeJh1rzq2hn0AqIR2CEZSS2sE";
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const currentUserId = Number(localStorage.getItem("userId"));
const userName = localStorage.getItem("userName");

if (!currentUserId) window.location.href = "login.html";

document.getElementById("welcome").textContent = `Olá, ${userName}`;
document.getElementById("logout").onclick = () => {
    localStorage.removeItem("profile");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
};

function criarSeparador() {
    const divider = document.createElement("div");
    divider.classList.add("section-divider");
    document.body.appendChild(divider);
}

const video = document.getElementById("bg-video");
const source = document.getElementById("bg-source");
const root = document.documentElement;

if (currentUserId == 1) {
    source.src = "../assets/video/wallpaper1.mp4";

    root.style.setProperty('--cor-borda', '#00aaff');
    root.style.setProperty('--cor-fundo', 'rgba(0, 170, 255, 0.1)');
    root.style.setProperty('--cor-glow', 'rgba(0, 170, 255, 0.6)');
} else {
    source.src = "../assets/video/wallpaper2.mp4";

    root.style.setProperty('--cor-borda', '#a855f7');
    root.style.setProperty('--cor-fundo', 'rgba(168, 85, 247, 0.1)');
    root.style.setProperty('--cor-glow', 'rgba(168, 85, 247, 0.6)');
}

video.load();
video.play();

const inicio = new Date(2024, 4, 19, 21, 0, 0);

const anosEl = document.getElementById("anos");
const mesesEl = document.getElementById("meses");
const diasEl = document.getElementById("dias");
const relogioEl = document.getElementById("relogio");

[anosEl, mesesEl, diasEl, relogioEl].forEach(el => {
    el.classList.add("tempo-animado");
});

function atualizarTempo() {
    const agora = new Date();

    let anos = agora.getFullYear() - inicio.getFullYear();
    let meses = agora.getMonth() - inicio.getMonth();
    let dias = agora.getDate() - inicio.getDate();
    let horas = agora.getHours() - inicio.getHours();
    let minutos = agora.getMinutes() - inicio.getMinutes();
    let segundos = agora.getSeconds() - inicio.getSeconds();

    if (segundos < 0) { segundos += 60; minutos--; }
    if (minutos < 0) { minutos += 60; horas--; }
    if (horas < 0) { horas += 24; dias--; }

    if (dias < 0) {
        const mesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0);
        dias += mesAnterior.getDate();
        meses--;
    }

    if (meses < 0) { meses += 12; anos--; }

    anosEl.textContent = anos;
    mesesEl.textContent = meses;
    diasEl.textContent = dias;

    relogioEl.textContent =
        `${horas.toString().padStart(2, '0')}:` +
        `${minutos.toString().padStart(2, '0')}:` +
        `${segundos.toString().padStart(2, '0')}`;
}

setInterval(atualizarTempo, 1000);
atualizarTempo();

criarSeparador();

const dedicacoesDiv = document.createElement("div");
dedicacoesDiv.id = "dedicacoes";
document.body.appendChild(dedicacoesDiv);

async function carregarDedicatorias() {
    try {
        const { data, error } = await supabaseClient
            .from("dedications")
            .select(`
                *,
                from_user:profiles!from_user_id(id, name)
            `)
            .eq("to_user_id", currentUserId)
            .order("id", { ascending: false });

        if (error) throw error;

        const container = document.createElement("div");
        container.classList.add("dedicacoes-box");

        let html = `<h2>Músicas dedicadas para você:</h2>`;

        if (!data || data.length === 0) {
            html += `<p class="empty">Nenhuma música dedicada ainda.</p>`;
        } else {
            html += `<div class="dedications-list">`;

            data.forEach(d => {
                html += `
                    <div class="dedication-card">
                        <iframe src="https://open.spotify.com/embed/track/${d.song_id}?theme=1" 
                            width="300" height="80" frameborder="0" 
                            allow="autoplay; clipboard-write; encrypted-media">
                        </iframe>

                        <div class="dedication-info">
                            <span class="dedication-from">
                                De: ${d.from_user ? d.from_user.name : 'Desconhecido'}
                            </span>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        container.innerHTML = html;

        dedicacoesDiv.innerHTML = "";
        dedicacoesDiv.appendChild(container);

        container.querySelectorAll(".dedication-card").forEach(el => {
            el.classList.add("fade-in");
        });

        setTimeout(() => {
            aplicarAnimacaoScroll();
        }, 50);

    } catch (err) {
        console.error("Erro ao carregar dedicatórias:", err);
        dedicacoesDiv.innerHTML = `
            <div class="dedicacoes-box">
                <p class="empty">Erro ao carregar dedicatórias.</p>
            </div>
        `;
    }
}

carregarDedicatorias();
criarSeparador();

const momentosDiv = document.createElement("div");
momentosDiv.id = "momentos";
document.body.appendChild(momentosDiv);

async function carregarMomentos() {
    try {
        const { data, error } = await supabaseClient
            .from("user_posts")
            .select(`
                posts (
                    image_url,
                    caption,
                    created_at
                )
            `)
            .eq("user_id", currentUserId);

        if (error) throw error;

        const sortedData = data.sort((a, b) => {
            return new Date(b.posts.created_at) - new Date(a.posts.created_at);
        });

        momentosDiv.innerHTML = "<h2>Melhores momentos:</h2>";

        if (!sortedData || sortedData.length === 0) {
            momentosDiv.innerHTML += "<p>Nenhum momento ainda.</p>";
            return;
        }

        let currentDate = null;

        sortedData.forEach(item => {
            const post = item.posts;
            const dateObj = new Date(post.created_at);

            const postDate = dateObj.toLocaleDateString("pt-BR");

            const postTime = dateObj.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
            });

            if (postDate !== currentDate) {
                currentDate = postDate;

                const separator = document.createElement("div");
                separator.classList.add("date-separator");
                separator.textContent = postDate;

                momentosDiv.appendChild(separator);
            }

            const card = document.createElement("div");
            card.classList.add("momento-card");

            card.innerHTML = `
                <p>${post.caption}</p>
                <img src="${post.image_url}" width="250">
                <small>${postTime}</small>
            `;

            momentosDiv.appendChild(card);
        });

        momentosDiv.querySelectorAll(".momento-card, .date-separator")
            .forEach(el => {
                el.classList.add("fade-in");
            });

        setTimeout(() => {
            aplicarAnimacaoScroll();
        }, 50);

        if (sortedData.length > 0) {
            momentosDiv.classList.add("has-content");
        } else {
            momentosDiv.classList.remove("has-content");
        }

    } catch (err) {
        console.error(err);
        momentosDiv.innerHTML = "<p>Erro ao carregar momentos.</p>";
    }
}

carregarMomentos();
criarSeparador();

const messagesDiv = document.createElement("div");
messagesDiv.id = "messages";
document.body.appendChild(messagesDiv);

async function carregarMensagensRecebidas() {
    try {
        const { data, error } = await supabaseClient
            .from("messages")
            .select("*")
            .eq("to_user_id", currentUserId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        messagesDiv.innerHTML = "<h2>Mensagens recebidas:</h2>";

        if (!data || data.length === 0) {
            messagesDiv.innerHTML += "<p>Nenhuma mensagem recebida ainda.</p>";
            return;
        }

        data.forEach(msg => {
            const card = document.createElement("div");
            card.classList.add("message-card");

            card.innerHTML = `
                <strong>${msg.user_name}:</strong> ${msg.content}
                <span class="timestamp">${new Date(msg.created_at).toLocaleString()}</span>
            `;

            messagesDiv.appendChild(card);
        });

        messagesDiv.querySelectorAll(".message-card").forEach(el => {
            el.classList.add("fade-in");
        });

        setTimeout(() => {
            aplicarAnimacaoScroll();
        }, 50);

    } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
        messagesDiv.innerHTML = "<p>Erro ao carregar mensagens.</p>";
    }
}

carregarMensagensRecebidas();

function aplicarAnimacaoScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll(".fade-in").forEach(el => {
        observer.observe(el);
    });
}
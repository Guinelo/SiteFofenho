const supabaseurl = "https://dgjwxlugbrdwvwnlznff.supabase.co";
const supabasekey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnand4bHVnYnJkd3Z3bmx6bmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDU4NjQsImV4cCI6MjA4OTAyMTg2NH0.3BaOPr0QDW72moXv5aZeJh1rzq2hn0AqIR2CEZSS2sE";

const client = supabase.createClient(supabaseurl, supabasekey);
const profileId = Number(localStorage.getItem("editProfileId"));
let avatarFile = null;

async function carregarPerfilAtual() {

    const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    document.getElementById("nameInput").value = data.name;
    document.getElementById("avatarPreview").src = data.avatar_url;

}

carregarPerfilAtual();

document.getElementById("avatarInput").addEventListener("change", function () {

    avatarFile = this.files[0];

    if (avatarFile) {
        document.getElementById("avatarPreview").src =
            URL.createObjectURL(avatarFile);
    }

});


document.getElementById("saveProfile").onclick = async () => {

    const newName = document.getElementById("nameInput").value;

    console.log("Atualizando:", profileId, newName);

    let avatarUrl = null;

    if (avatarFile) {

        const fileName = `avatar-${profileId}.png`;

        const { error: uploadError } = await client
            .storage
            .from("avatars")
            .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
            console.error(uploadError);
            alert("Erro ao enviar imagem");
            return;
        }

        const { data } = client
            .storage
            .from("avatars")
            .getPublicUrl(fileName);

        avatarUrl = data.publicUrl;
    }

    const updateData = {
        name: newName
    };

    if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
    }

    const { data, error } = await client
        .from("profiles")
        .update(updateData)
        .eq("id", profileId)
        .select();

    console.log("resultado:", data, error);

    if (error) {
        alert("Erro ao atualizar");
        console.error(error);
        return;
    }

    alert("Perfil atualizado!");

    window.location.href = "login.html";

};
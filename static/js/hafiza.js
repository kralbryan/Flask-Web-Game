const emojiler = ["🐶", "🐱", "🦊", "🐼", "🐸", "🦁", "🐵", "🐰"];

const tahta = document.getElementById("tahta");
const hamleYazi = document.getElementById("hamle");
const mesaj = document.getElementById("hafiza-mesaj");
const yenidenButon = document.getElementById("yeniden-baslat");

let acikKartlar = [];   // şu an çevrilmiş (eşleşmemiş) kartlar
let kilit = false;      // iki kart açıkken yeni tıklamayı engeller
let hamle = 0;
let eslesenCift = 0;

// Diziyi rastgele karıştırır (Fisher-Yates)
function karistir(dizi) {
    for (let i = dizi.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dizi[i], dizi[j]] = [dizi[j], dizi[i]];
    }
    return dizi;
}

function oyunuBaslat() {
    tahta.innerHTML = "";
    acikKartlar = [];
    kilit = false;
    hamle = 0;
    eslesenCift = 0;
    hamleYazi.textContent = "Hamle: 0";
    mesaj.textContent = "";

    // Her emojiden 2 tane koy ve karıştır
    const desteler = karistir([...emojiler, ...emojiler]);

    desteler.forEach(function (emoji) {
        const kart = document.createElement("button");
        kart.className = "hafiza-kart";
        kart.dataset.emoji = emoji;
        kart.textContent = "?";
        kart.addEventListener("click", function () {
            kartTikla(kart);
        });
        tahta.appendChild(kart);
    });
}

function kartTikla(kart) {
    // Kilitliyse, zaten açıksa ya da eşleşmişse işlem yapma
    if (kilit) return;
    if (kart.classList.contains("acik")) return;
    if (kart.classList.contains("eslesti")) return;

    kart.classList.add("acik");
    kart.textContent = kart.dataset.emoji;
    acikKartlar.push(kart);

    if (acikKartlar.length === 2) {
        hamle++;
        hamleYazi.textContent = "Hamle: " + hamle;
        eslesmeKontrol();
    }
}

function eslesmeKontrol() {
    const [k1, k2] = acikKartlar;

    if (k1.dataset.emoji === k2.dataset.emoji) {
        k1.classList.add("eslesti");
        k2.classList.add("eslesti");
        acikKartlar = [];
        eslesenCift++;

        if (eslesenCift === emojiler.length) {
            mesaj.textContent = "🎉 Tebrikler! " + hamle + " hamlede bitirdin.";
        }
    } else {
        // Eşleşmedi: 0.8 saniye göster, sonra kapat
        kilit = true;
        setTimeout(function () {
            k1.classList.remove("acik");
            k2.classList.remove("acik");
            k1.textContent = "?";
            k2.textContent = "?";
            acikKartlar = [];
            kilit = false;
        }, 800);
    }
}

yenidenButon.addEventListener("click", oyunuBaslat);
oyunuBaslat();
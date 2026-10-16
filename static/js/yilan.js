const canvas = document.getElementById("yilan-canvas");
const ctx = canvas.getContext("2d");
const skorYazi = document.getElementById("yilan-skor");
const enYuksekYazi = document.getElementById("yilan-en-yuksek");
const baslatButon = document.getElementById("yilan-baslat");
const modSecim = document.getElementById("yilan-mod");

const HUCRE = 20;
const SUTUN = canvas.width / HUCRE;
const BASLANGIC_HIZ = 120;   // ms
const EN_HIZLI = 60;         // bundan hızlı olmaz
const HIZLANMA = 1;          // her 5 yemde kaç ms hızlanır
const KUYRUK_LIMIT = 3;      // en fazla kaç tuş sıraya alınır

let yilan, yon, yonKuyrugu, yem, skor, dongu, hiz;
let oyunAktif = false;
let duraklatildi = false;
let enYuksek = 0;

function mod() {
    return modSecim.value;   // "duvarli" veya "duvarsiz"
}

function enYuksekYukle() {
    enYuksek = Number(localStorage.getItem("yilanEnYuksek_" + mod())) || 0;
    enYuksekYazi.textContent = "En yüksek: " + enYuksek;
}

function yemUret() {
    let yeni;
    do {
        yeni = {
            x: Math.floor(Math.random() * SUTUN),
            y: Math.floor(Math.random() * SUTUN),
        };
    } while (yilan.some(function (p) { return p.x === yeni.x && p.y === yeni.y; }));
    return yeni;
}

function dongüyüBaslat() {
    clearInterval(dongu);
    dongu = setInterval(adim, hiz);
}

function baslat() {
    yilan = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    yon = { x: 1, y: 0 };
    yonKuyrugu = [];
    skor = 0;
    hiz = BASLANGIC_HIZ;
    oyunAktif = true;
    duraklatildi = false;
    skorYazi.textContent = "Skor: 0";
    yem = yemUret();
    baslatButon.textContent = "Yeniden Başlat";
    dongüyüBaslat();
    ciz();
}

function adim() {
    // Sıradaki yön varsa uygula
    if (yonKuyrugu.length > 0) {
        yon = yonKuyrugu.shift();
    }

    let bas = { x: yilan[0].x + yon.x, y: yilan[0].y + yon.y };
    let duvaraCarpti = false;

    if (mod() === "duvarsiz") {
        // Bir uçtan çıkıp karşı uçtan gir
        bas.x = (bas.x + SUTUN) % SUTUN;
        bas.y = (bas.y + SUTUN) % SUTUN;
    } else {
        duvaraCarpti = bas.x < 0 || bas.y < 0 || bas.x >= SUTUN || bas.y >= SUTUN;
    }

    const yemYedi = bas.x === yem.x && bas.y === yem.y;
    const govde = yemYedi ? yilan : yilan.slice(0, -1);
    const kendineCarpti = govde.some(function (p) { return p.x === bas.x && p.y === bas.y; });

    if (duvaraCarpti || kendineCarpti) {
        oyunBitti();
        return;
    }

    yilan.unshift(bas);

    if (yemYedi) {
        skor++;
        skorYazi.textContent = "Skor: " + skor;
        yem = yemUret();

        // Her 5 yemde hızlan
        if (skor % 5 === 0 && hiz > EN_HIZLI) {
            hiz -= HIZLANMA;
            dongüyüBaslat();
        }
    } else {
        yilan.pop();
    }

    ciz();
}

function oyunBitti() {
    clearInterval(dongu);
    oyunAktif = false;

    if (skor > enYuksek) {
        enYuksek = skor;
        localStorage.setItem("yilanEnYuksek_" + mod(), enYuksek);
        enYuksekYazi.textContent = "En yüksek: " + enYuksek;
    }

    ciz();
    katman("Oyun Bitti", "Skor: " + skor);
}

function katman(baslik, altYazi) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 28px Arial";
    ctx.fillText(baslik, canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "18px Arial";
    ctx.fillText(altYazi, canvas.width / 2, canvas.height / 2 + 24);
}

function ciz() {
    ctx.fillStyle = "#181825";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Duvarsız modda kenarlar belli olsun diye çerçeve çizmiyoruz,
    // duvarlı modda kırmızımsı çerçeve ekliyoruz
    if (mod() === "duvarli") {
        ctx.strokeStyle = "#f38ba8";
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
    }

    // Yem
    ctx.fillStyle = "#f38ba8";
    ctx.beginPath();
    ctx.arc(yem.x * HUCRE + HUCRE / 2, yem.y * HUCRE + HUCRE / 2, HUCRE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Yılan
    yilan.forEach(function (p, i) {
        ctx.fillStyle = i === 0 ? "#a6e3a1" : "#74c481";
        ctx.fillRect(p.x * HUCRE + 1, p.y * HUCRE + 1, HUCRE - 2, HUCRE - 2);
    });
}

function bosEkran() {
    ctx.fillStyle = "#181825";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Başlamak için butona bas", canvas.width / 2, canvas.height / 2);
}

function duraklatDegistir() {
    if (!oyunAktif) return;
    duraklatildi = !duraklatildi;
    if (duraklatildi) {
        clearInterval(dongu);
        katman("Duraklatıldı", "Devam için Space");
    } else {
        dongüyüBaslat();
        ciz();
    }
}

document.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
        if (oyunAktif) {
            e.preventDefault();
            duraklatDegistir();
        }
        return;
    }

    const tusler = {
        ArrowUp: { x: 0, y: -1 },    w: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },   s: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },  a: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },  d: { x: 1, y: 0 },
    };

    const yeniYon = tusler[e.key];
    if (!yeniYon || !oyunAktif) return;

    e.preventDefault();
    if (duraklatildi) return;

    // Karşılaştırma, sıradaki son yöne göre yapılır (yoksa mevcut yöne göre)
    const son = yonKuyrugu.length > 0 ? yonKuyrugu[yonKuyrugu.length - 1] : yon;

    const ayniYon = yeniYon.x === son.x && yeniYon.y === son.y;
    const tersYon = yeniYon.x === -son.x && yeniYon.y === -son.y;
    if (ayniYon || tersYon) return;

    if (yonKuyrugu.length < KUYRUK_LIMIT) {
        yonKuyrugu.push(yeniYon);
    }
});

// Mod değişince oyunu durdur, o moda ait rekoru göster
modSecim.addEventListener("change", function () {
    clearInterval(dongu);
    oyunAktif = false;
    duraklatildi = false;
    baslatButon.textContent = "Başlat";
    skorYazi.textContent = "Skor: 0";
    enYuksekYukle();
    bosEkran();
    modSecim.blur();
});

baslatButon.addEventListener("click", function () {
    baslat();
    baslatButon.blur();
});

enYuksekYukle();
bosEkran();
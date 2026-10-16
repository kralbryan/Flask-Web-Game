const SURE = 150; // saniye

const daire = document.getElementById("parolla-daire");
const sureYazi = document.getElementById("parolla-sure");
const skorYazi = document.getElementById("parolla-skor");
const soruKutu = document.getElementById("parolla-soru");
const girdi = document.getElementById("parolla-girdi");
const cevaplaBtn = document.getElementById("parolla-cevapla");
const pasBtn = document.getElementById("parolla-pas");
const baslatBtn = document.getElementById("parolla-baslat");
const mesaj = document.getElementById("parolla-mesaj");
const sonucKutu = document.getElementById("parolla-sonuc");

let harfler = [];        // {id, harf, soru, durum, cevap}
let harfEl = [];         // ekrandaki harf daireleri
let aktif = 0;           // şu anki harfin sırası
let kalan = SURE;
let zamanlayici = null;
let oyunSuruyor = false;
let bekliyor = false;    // sunucudan cevap beklerken çift tıklamayı engeller

function kontrolleriAyarla(acik) {
    girdi.disabled = !acik;
    cevaplaBtn.disabled = !acik;
    pasBtn.disabled = !acik;
}

function daireyiCiz() {
    daire.querySelectorAll(".p-harf").forEach(function (e) { e.remove(); });

    harfEl = harfler.map(function (h, i) {
        // Harfleri çember üzerine yerleştir (en üstten başlayarak)
        const aci = (i / harfler.length) * 2 * Math.PI - Math.PI / 2;
        const el = document.createElement("div");
        el.className = "p-harf";
        el.textContent = h.harf;
        el.style.left = (50 + 43 * Math.cos(aci)) + "%";
        el.style.top = (50 + 43 * Math.sin(aci)) + "%";
        daire.appendChild(el);
        return el;
    });
}

function skorGuncelle() {
    const dogru = harfler.filter(function (h) { return h.durum === "dogru"; }).length;
    skorYazi.textContent = "Doğru: " + dogru;
}

function soruGoster() {
    harfEl.forEach(function (e) { e.classList.remove("aktif"); });
    harfEl[aktif].classList.add("aktif");
    soruKutu.textContent = harfler[aktif].soru;
    girdi.value = "";
    girdi.focus();
}

function durumVer(durum) {
    harfler[aktif].durum = durum;
    harfEl[aktif].className = "p-harf " + durum;
    skorGuncelle();
}

function sonrakiHarf() {
    // Sıradaki "bekliyor" veya "pas" harfi bul (başa dönerek)
    for (let k = 1; k <= harfler.length; k++) {
        const j = (aktif + k) % harfler.length;
        const d = harfler[j].durum;
        if (d === "bekliyor" || d === "pas") {
            aktif = j;
            soruGoster();
            return;
        }
    }
    bitir("Tüm harfler tamamlandı!");
}

async function cevapla() {
    if (!oyunSuruyor || bekliyor) return;
    const tahmin = girdi.value.trim();
    if (!tahmin) return;

    bekliyor = true;
    try {
        const yanit = await fetch("/api/parolla/kontrol", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: harfler[aktif].id, tahmin: tahmin }),
        });
        const sonuc = await yanit.json();
        if (!oyunSuruyor) return; // beklerken süre bittiyse

        if (sonuc.dogru) {
            durumVer("dogru");
            mesaj.textContent = "✅ Doğru!";
        } else {
            harfler[aktif].cevap = sonuc.cevap;
            durumVer("yanlis");
            mesaj.textContent = "❌ Yanlış. Doğru cevap: " + sonuc.cevap;
        }
        sonrakiHarf();
    } catch (hata) {
        mesaj.textContent = "Sunucuya ulaşılamadı, tekrar dene.";
    } finally {
        bekliyor = false;
    }
}

function pas() {
    if (!oyunSuruyor || bekliyor) return;
    durumVer("pas");
    mesaj.textContent = "";
    sonrakiHarf();
}

async function bitir(baslik) {
    if (!oyunSuruyor) return;
    oyunSuruyor = false;
    clearInterval(zamanlayici);
    kontrolleriAyarla(false);
    harfEl.forEach(function (e) { e.classList.remove("aktif"); });

    // Cevaplanmamış harflerin cevaplarını sunucudan al
    const acik = harfler.filter(function (h) {
        return h.durum === "bekliyor" || h.durum === "pas";
    });
    if (acik.length > 0) {
        try {
            const yanit = await fetch("/api/parolla/bitir", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idler: acik.map(function (h) { return h.id; }) }),
            });
            const cevaplar = await yanit.json();
            acik.forEach(function (h) {
                const bulunan = cevaplar.find(function (c) { return c.id === h.id; });
                if (bulunan) h.cevap = bulunan.cevap;
            });
        } catch (hata) {
            // Cevaplar alınamazsa sonuç ekranı cevapsız gösterilir
        }
    }
    sonucGoster(baslik);
}

function sonucGoster(baslik) {
    const dogru = harfler.filter(function (h) { return h.durum === "dogru"; }).length;
    const yanlis = harfler.filter(function (h) { return h.durum === "yanlis"; }).length;
    const bos = harfler.length - dogru - yanlis;

    mesaj.textContent = "";
    soruKutu.textContent = baslik;

    sonucKutu.innerHTML = "";
    const ozet = document.createElement("h2");
    ozet.textContent = "Sonuç: " + dogru + " doğru, " + yanlis + " yanlış, " + bos + " boş";
    sonucKutu.appendChild(ozet);

    const kacirilan = harfler.filter(function (h) { return h.durum !== "dogru"; });
    if (kacirilan.length > 0) {
        const baslikEl = document.createElement("p");
        baslikEl.textContent = "Bilemediklerin:";
        sonucKutu.appendChild(baslikEl);

        const liste = document.createElement("ul");
        kacirilan.forEach(function (h) {
            const li = document.createElement("li");
            li.textContent = h.harf + " → " + (h.cevap || "?") + "  (" + h.soru + ")";
            liste.appendChild(li);
        });
        sonucKutu.appendChild(liste);
    }
}

async function baslat() {
    clearInterval(zamanlayici);
    oyunSuruyor = false;
    baslatBtn.disabled = true;
    kontrolleriAyarla(false);
    sonucKutu.innerHTML = "";
    mesaj.textContent = "Sorular yükleniyor...";

    try {
        const yanit = await fetch("/api/parolla/yeni");
        const veri = await yanit.json();
        if (!veri.length) {
            mesaj.textContent = "Hiç soru bulunamadı. data/sorular.json dosyasını kontrol et.";
            baslatBtn.disabled = false;
            return;
        }
        harfler = veri.map(function (h) {
            return { id: h.id, harf: h.harf, soru: h.soru, durum: "bekliyor", cevap: null };
        });
    } catch (hata) {
        mesaj.textContent = "Sorular yüklenemedi. Sunucu çalışıyor mu?";
        baslatBtn.disabled = false;
        return;
    }

    mesaj.textContent = "";
    kalan = SURE;
    aktif = 0;
    oyunSuruyor = true;
    sureYazi.textContent = kalan;

    daireyiCiz();
    skorGuncelle();
    kontrolleriAyarla(true);
    soruGoster();

    zamanlayici = setInterval(function () {
        kalan--;
        sureYazi.textContent = kalan;
        if (kalan <= 0) bitir("Süre doldu!");
    }, 1000);

    baslatBtn.textContent = "Yeniden Başlat";
    baslatBtn.disabled = false;
    baslatBtn.blur();
}

cevaplaBtn.addEventListener("click", cevapla);
pasBtn.addEventListener("click", pas);
baslatBtn.addEventListener("click", baslat);
girdi.addEventListener("keydown", function (e) {
    if (e.key === "Enter") cevapla();
});
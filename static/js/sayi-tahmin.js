const hedef = Math.floor(Math.random() * 100) + 1;
let deneme = 0;

const girdi = document.getElementById("tahmin");
const buton = document.getElementById("tahmin-buton");
const mesaj = document.getElementById("mesaj");
const sayac = document.getElementById("sayac");
const yeniden = document.getElementById("yeniden");

function tahminEt() {
    
    const sayi = parseInt(girdi.value);

    if (isNaN(sayi) || sayi < 1 || sayi > 100) {
        mesaj.textContent = "1 ile 100 arasında bir sayı gir.";
        return;
    }

    deneme++;
    sayac.textContent = "Deneme: " + deneme;

    if (sayi === hedef) {
        mesaj.textContent = "🎉 Doğru! " + deneme + " denemede buldun.";
        buton.disabled = true;
        girdi.disabled = true;
        yeniden.style.display = "inline-block";
    } else if (sayi < hedef) {
        mesaj.textContent = "⬆️ Daha büyük bir sayı dene.";
    } else {
        mesaj.textContent = "⬇️ Daha küçük bir sayı dene.";
    }

    girdi.value = "";
    girdi.focus();
}

buton.addEventListener("click", tahminEt);
girdi.addEventListener("keydown", function (e) {
    if (e.key === "Enter") tahminEt();
});
yeniden.addEventListener("click", function () {
    location.reload();
});
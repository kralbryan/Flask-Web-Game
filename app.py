import json
import os
import random

from flask import Flask, render_template, abort, jsonify, request

app = Flask(__name__)

BASE_DIZIN = os.path.dirname(os.path.abspath(__file__))
SORU_DOSYASI = os.path.join(BASE_DIZIN, "data", "sorular.json")

# Türkçe alfabe sırası (Ğ ile başlayan kelime olmadığı için yok)
ALFABE = list("abcçdefghıijklmnoöprsştuüvyz")

OYUNLAR = [
    {"slug": "sayi-tahmin", "ad": "Sayı Tahmin", "aciklama": "1-100 arası sayıyı bul!"},
    {"slug": "hafiza", "ad": "Hafıza Kartları", "aciklama": "Eşleşen kartları bul."},
    {"slug": "yilan", "ad": "Yılan", "aciklama": "Klasik yılan oyunu."},
    {"slug": "kelime", "ad": "Kelime Oyunu", "aciklama": "Parolla tarzı kelime bulmaca."},
]


# ---------- Yardımcı fonksiyonlar ----------

def tr_kucuk(metin):
    """Türkçe'ye uygun küçük harfe çevirir (İ -> i, I -> ı)."""
    return metin.replace("İ", "i").replace("I", "ı").lower()


def tr_buyuk(metin):
    """Türkçe'ye uygun büyük harfe çevirir (i -> İ, ı -> I)."""
    return metin.replace("i", "İ").replace("ı", "I").upper()


def normalize(metin):
    """Cevapları karşılaştırmak için sadeleştirir."""
    metin = tr_kucuk(str(metin).strip())
    for eski, yeni in (("â", "a"), ("î", "i"), ("û", "u")):
        metin = metin.replace(eski, yeni)
    return metin


def sorulari_yukle():
    # Her istekte okuyoruz: JSON'a soru ekleyince sunucuyu yeniden başlatmana gerek kalmaz
    with open(SORU_DOSYASI, encoding="utf-8") as f:
        sorular = json.load(f)
    for i, s in enumerate(sorular):
        s["id"] = i
    return sorular


def soru_bul(id_degeri):
    sorular = sorulari_yukle()
    try:
        i = int(id_degeri)
    except (TypeError, ValueError):
        abort(400)
    if i < 0 or i >= len(sorular):
        abort(400)
    return sorular[i]


# ---------- Sayfalar ----------

@app.route("/")
def anasayfa():
    return render_template("index.html", oyunlar=OYUNLAR)


@app.route("/oyun/<slug>")
def oyun(slug):
    secilen = next((o for o in OYUNLAR if o["slug"] == slug), None)
    if secilen is None:
        abort(404)
    return render_template("oyun.html", oyun=secilen)


# ---------- Parolla API ----------

@app.route("/api/parolla/yeni")
def parolla_yeni():
    gruplar = {}
    for s in sorulari_yukle():
        gruplar.setdefault(tr_kucuk(s["harf"]), []).append(s)

    secilen = []
    for harf in ALFABE:
        if harf in gruplar:
            s = random.choice(gruplar[harf])
            # Dikkat: "cevap" bilerek gönderilmiyor
            secilen.append({"id": s["id"], "harf": tr_buyuk(harf), "soru": s["soru"]})
    return jsonify(secilen)


@app.route("/api/parolla/kontrol", methods=["POST"])
def parolla_kontrol():
    veri = request.get_json(silent=True) or {}
    s = soru_bul(veri.get("id"))
    dogru = normalize(veri.get("tahmin", "")) == normalize(s["cevap"])
    # Yanlışsa o harf kapandığı için doğru cevabı da gösteriyoruz
    return jsonify({"dogru": dogru, "cevap": None if dogru else s["cevap"]})


@app.route("/api/parolla/bitir", methods=["POST"])
def parolla_bitir():
    veri = request.get_json(silent=True) or {}
    idler = veri.get("idler", [])
    if not isinstance(idler, list):
        abort(400)
    cevaplar = [{"id": i, "cevap": soru_bul(i)["cevap"]} for i in idler]
    return jsonify(cevaplar)


if __name__ == "__main__":
    app.run(debug=True)
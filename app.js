// =======================================================================
// 1. DATABASE UTAMA: TARIF DASAR & DETAIL TRANSIT RUTE
// =======================================================================
const DATABASE_RUTE = {
    "SQG-PNK": { nama: "Sintang ke Pontianak",tipe: "Langsung", durasi: "55 Menit" },
    "PNK-SQG": { nama: "Pontianak ke Sintang",tipe: "Langsung", durasi: "55 Menit" },
    "PNK-SKL": { nama: "Pontianak ke Singkawang",tipe: "Langsung", durasi: "35 Menit" },
    "SKL-PNK": { nama: "Singkawang ke Pontianak",tipe: "Langsung", durasi: "35 Menit" },
    "PNK-KTG": { nama: "Pontianak ke Ketapang",tipe: "Langsung", durasi: "40 Menit" },
    "KTG-PNK": { nama: "Ketapang ke Pontianak",tipe: "Langsung", durasi: "40 Menit" },
    "PNK-PSU": { nama: "Pontianak ke Kapuas Hulu",tipe: "Langsung", durasi: "1 Jam" },
    "PSU-PNK": { nama: "Kapuas Hulu ke Pontianak",tipe: "Langsung", durasi: "1 Jam" },
    "KTG-PKN": { nama: "Ketapang ke Pangkalan Bun",tipe: "Langsung", durasi: "45 Menit" },
    
    // RUTE TRANSIT
    "KTG-PSU": { nama: "Ketapang ke Kapuas Hulu (Via PNK)",tipe: "Transit PNK", durasi: "2 Jam 40 Menit" },
    "PSU-KTG": { nama: "Kapuas Hulu ke Ketapang (Via PNK)",tipe: "Transit PNK", durasi: "2 Jam 40 Menit" }
};

// =======================================================================
// 2. INITIALIZATION: SETTING ELEMENT & EVENT LISTENERS
// =======================================================================
document.addEventListener("DOMContentLoaded", function() {
    const inputTanggalPergi = document.getElementById("tanggalPergi");
    if (inputTanggalPergi) {
        const hariIni = new Date();
        const formatHariIni = `${hariIni.getFullYear()}-${String(hariIni.getMonth() + 1).padStart(2, '0')}-${String(hariIni.getDate()).padStart(2, '0')}`;
        inputTanggalPergi.min = formatHariIni;
        inputTanggalPergi.value = formatHariIni;
    }

    const elemenPemicu = ["kotaAsal", "kotaTujuan", "tanggalPergi", "kategoriPenumpang", "jumlahTiket"];
    elemenPemicu.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", function() {
                perbaruiTabelJadwal();
                hitungTotalBiaya();
            });
        }
    });

    perbaruiTabelJadwal();
    hitungTotalBiaya();

    // MENJALANKAN FUNGSI PENGECEKAN REAL-TIME SETIAP 1 DETIK
    setInterval(perbaruiTabelJadwal, 1000);
});

// =======================================================================
// 3. LOGIKA VALIDASI OPERASIONAL HARI (SABTU & MINGGU)
// =======================================================================
function cekHariOperasional(kodeRute, namaHari) {
    if (kodeRute.includes("PSU") || kodeRute === "PNK-KTG" || kodeRute === "KTG-PNK") {
        if (namaHari === "Sabtu" || namaHari === "Minggu") {
            return {
                tersedia: false,
                pesan: `⚠️ Penerbangan rute perintis ${DATABASE_RUTE[kodeRute] ? DATABASE_RUTE[kodeRute].nama : kodeRute} tidak beroperasi pada hari Sabtu & Minggu.`
            };
        }
    }
    return { tersedia: true, pesan: "" };
}

// =======================================================================
// 4. LOGIKA PENCARIAN & DETAIL RUTE
// =======================================================================
function cekDetailRute() {
    const inputAsal = document.getElementById("kotaAsal");
    const inputTujuan = document.getElementById("kotaTujuan");
    const infoRute = document.getElementById("infoRuteDetail");

    if (!inputAsal || !inputTujuan || !infoRute) return null;

    const asal = inputAsal.value.toUpperCase();
    const tujuan = inputTujuan.value.toUpperCase();
    const kodeRute = `${asal}-${tujuan}`;

    if (asal === tujuan) {
        infoRute.innerHTML = `<span style="color:#ef4444;">Kota asal dan tujuan tidak boleh sama!</span>`;
        return null;
    }

    const dataRute = DATABASE_RUTE[kodeRute];
    if (dataRute) {
        infoRute.innerHTML = `<strong>${dataRute.nama}</strong> (${dataRute.tipe} | Durasi: ${dataRute.durasi})`;
        return { kode: kodeRute, data: dataRute };
    } else {
        infoRute.innerHTML = `<span style="color:#ef4444;">Rute penerbangan belum terdaftar.</span>`;
        return null;
    }
}

// =======================================================================
// 5. LOGIKA TARIF DINAMIS & HITUNG TOTAL BIAYA
// =======================================================================
function hitungTotalBiaya() {
    const ruteTerdeteksi = cekDetailRute();
    const inputTanggal = document.getElementById("tanggalPergi");
    const inputKategori = document.getElementById("kategoriPenumpang");
    const inputJumlah = document.getElementById("jumlahTiket");
    const ringkasanBiaya = document.getElementById("ringkasanBiaya");

    if (!ruteTerdeteksi || !inputTanggal || !inputKategori || !inputJumlah || !ringkasanBiaya) {
        if (ringkasanBiaya) ringkasanBiaya.innerHTML = "-";
        return;
    }

    const namaHari = dapatkanNamaHari(inputTanggal.value);
    const validasiHari = cekHariOperasional(ruteTerdeteksi.kode, namaHari);

    if (!validasiHari.tersedia) {
        ringkasanBiaya.innerHTML = `<span style="color:#ef4444; font-weight:bold;">${validasiHari.pesan}</span>`;
        return;
    }

    let tarifDasar = ruteTerdeteksi.data.tarif;
    let catatanSurcharge = "";

    if ((namaHari === "Sabtu" || namaHari === "Minggu") && !ruteTerdeteksi.kode.includes("PSU")) {
        tarifDasar = tarifDasar * 1.10;
        catatanSurcharge = " (Termasuk Surcharge Weekend 10%)";
    }

    const kategori = inputKategori.value;
    let faktorPengali = 1.0;
    if (kategori === "bisnis") faktorPengali = 1.60;
    if (kategori === "first") faktorPengali = 2.20;

    const tarifPerTiket = tarifDasar * faktorPengali;
    const jumlahTiket = parseInt(inputJumlah.value) || 1;
    const totalBiaya = tarifPerTiket * jumlahTiket;

    const formatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

    ringkasanBiaya.innerHTML = `
        <div style="background-color: #f8fafc; padding: 12px; border-left: 4px solid #3b82f6; border-radius: 4px;">
            Hari Penerbangan: <strong>${namaHari}</strong>${catatanSurcharge}<br>
            Harga Per Tiket: <strong>${formatter.format(tarifPerTiket)}</strong> (${kategori.toUpperCase()})<br>
            Jumlah Pax: <strong>${jumlahTiket} Orang</strong><br>
            <hr style="margin: 8px 0; border: 0; border-top: 1px dashed #cbd5e1;">
            <span style="font-size: 1.1em; color: #1e3a8a;">Total Bayar: <strong style="color:#10b981;">${formatter.format(totalBiaya)}</strong></span>
        </div>
    `;
}

// =======================================================================
// 6. LOGIKA REAL-TIME: PENGECEKAN JAM DINAMIS & VALIDASI JADWAL
// =======================================================================
function dapatkanNamaHari(tanggalString) {
    const daftarHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const objekTanggal = new Date(tanggalString);
    return daftarHari[objekTanggal.getDay()];
}

function perbaruiTabelJadwal() {
    const tabelBody = document.getElementById("tabelJadwal");
    const inputTanggal = document.getElementById("tanggalPergi");
    const inputAsal = document.getElementById("kotaAsal");
    const inputTujuan = document.getElementById("kotaTujuan");

    if (!tabelBody || !inputTanggal || !inputAsal || !inputTujuan) return;

    const tanggalPergi = inputTanggal.value;
    const asal = inputAsal.value.toUpperCase();
    const tujuan = inputTujuan.value.toUpperCase();

    const sekarang = new Date();
    const tanggalHariIniString = `${sekarang.getFullYear()}-${String(sekarang.getMonth() + 1).padStart(2, '0')}-${String(sekarang.getDate()).padStart(2, '0')}`;

    let htmlJadwal = "";

    if (asal === tujuan) {
        tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ef4444; font-weight:bold;">⚠️ Kota asal dan tujuan tidak boleh sama!</td></tr>`;
        return;
    }

    if (asal === "CGK" || asal.includes("JAKARTA")) {
        tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ef4444; font-weight:bold;">⚠️ Keberangkatan Penerbangan Pergi dari Jakarta tidak tersedia.</td></tr>`;
        return;
    }

    let listPenerbangan = [];

    // PENCOCOKAN DATASET BERDASARKAN KOTA ASAL & TUJUAN
    if (asal === "SQG") { 
        if (tujuan === "PNK") {
            listPenerbangan = [
                { maskapai: "Wings Air IW-1382", tipe: "Langsung", berangkat: "07:30", tiba: "08:25" },
                { maskapai: "Wings Air IW-1384", tipe: "Langsung", berangkat: "11:45", tiba: "12:40" },
                { maskapai: "Susi Air SI-221", tipe: "Sore", berangkat: "15:45", tiba: "16:40" }
            ];
        } else if (tujuan === "CGK") {
            listPenerbangan = [
                { maskapai: "Citilink QG-421", tipe: "Transit PNK", berangkat: "09:15", tiba: "12:30" },
                { maskapai: "Batik Air ID-6831", tipe: "Transit PNK", berangkat: "14:20", tiba: "17:35" }
            ];
        }
    } 
    else if (asal === "PNK") { 
        if (tujuan === "SQG") {
            listPenerbangan = [
                { maskapai: "Wings Air IW-1381", tipe: "Langsung", berangkat: "06:00", tiba: "06:55" },
                { maskapai: "Wings Air IW-1383", tipe: "Langsung", berangkat: "10:15", tiba: "11:10" }
            ];
        } else if (tujuan === "CGK") {
            listPenerbangan = [
                { maskapai: "Garuda Indonesia GA-501", tipe: "Langsung", berangkat: "10:00", tiba: "11:30" },
                { maskapai: "Lion Air JT-711", tipe: "Langsung", berangkat: "13:15", tiba: "14:45" }
            ];
        } else if (tujuan === "KTG") {
            listPenerbangan = [
                { maskapai: "Wings Air IW-1240", tipe: "Langsung", berangkat: "09:00", tiba: "09:40" }
            ];
        } else if (tujuan === "PSU") {
            listPenerbangan = [
                { maskapai: "Garuda Indonesia", tipe: "Langsung", berangkat: "10:00", tiba: "11:30" },
                { maskapai: "Lion Air", tipe: "Langsung", berangkat: "17:15", tiba: "18:45" }
            ];
        }
    }
    else if (asal === "KTG") { 
        if (tujuan === "PKN") {
            listPenerbangan = [
                { maskapai: "Nam Air IN-192", tipe: "Pagi", berangkat: "07:45", tiba: "08:30" }
            ];
        } else if (tujuan === "PNK") {
            listPenerbangan = [
                { maskapai: "Wings Air IW-1241", tipe: "Langsung", berangkat: "10:05", tiba: "10:45" }
            ];
        } else if (tujuan === "PSU") { 
            listPenerbangan = [
                { maskapai: "Garuda Indonesia", tipe: "Transit PNK", berangkat: "10:00", tiba: "11:30" },
                { maskapai: "Lion Air", tipe: "Transit PNK", berangkat: "17:15", tiba: "18:45" }
            ];
        }
    }
    else if (asal === "SKL") { 
        if (tujuan === "PNK") {
            listPenerbangan = [
                { maskapai: "Wings Air IW-1103", tipe: "Pagi", berangkat: "09:00", tiba: "09:35" }
            ];
        }
    }
    else if (asal === "PSU") { 
        if (tujuan === "PNK") {
            listPenerbangan = [
                { maskapai: "Wings Air IW-1365", tipe: "Siang", berangkat: "12:25", tiba: "13:25" }
            ];
        }
    }

    if (listPenerbangan.length === 0) {
        tabelBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ef4444; font-weight:bold;">⚠️ Maaf, jadwal rute ini belum tersedia.</td></tr>`;
        return;
    }

    let adaPenerbanganAktif = false;

    listPenerbangan.forEach((pesawat) => {
        let statusTeks = "";
        let atributDisabled = "";

        // MODIFIKASI: PROSES PENGECEKAN COCOK JAM REAL-TIME LAPTOP
        if (tanggalPergi === tanggalHariIniString) {
            const [jamB] = pesawat.berangkat.split(':').map(Number);
            const jamLaptopSekarang = sekarang.getHours();

            // Jika jam di laptop tidak sama dengan jam keberangkatan pesawat, maka dikunci
            if (jamLaptopSekarang !== jamB) {
                statusTeks = `<span style="color: #ef4444; font-weight: bold;">❌ Bukan Waktunya</span>`;
                atributDisabled = "disabled"; 
            } else {
                statusTeks = `<span style="color: #10b981; font-weight: bold;">🟢 Tersedia</span>`;
            }
        } else {
            statusTeks = `<span style="color: #10b981; font-weight: bold;">🟢 Tersedia</span>`;
        }

        let atributChecked = "";
        if (atributDisabled === "" && !adaPenerbanganAktif) {
            atributChecked = "checked";
            adaPenerbanganAktif = true;
        }

        htmlJadwal += `
            <tr>
                <td>
                    <strong>${pesawat.maskapai}</strong><br>
                    <small style="color: #64748b;">${pesawat.tipe}</small><br>
                    <small>${statusTeks}</small>
                </td>
                <td>${pesawat.berangkat} WIB</td>
                <td>${pesawat.tiba} WIB</td>
                <td class="radio-td">
                    <input type="radio" name="pilihanJadwal" value="${pesawat.maskapai} [${pesawat.berangkat} WIB]" ${atributDisabled} ${atributChecked}>
                </td>
            </tr>
        `;
    });

    tabelBody.innerHTML = htmlJadwal;
}
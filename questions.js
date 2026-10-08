/* =====================================================================
   QUEST OF SYNTAX - Bank Soal (Zona 1 - Zona 4)
   Sumber materi: Tugas Pertemuan 6 Kelompok 6
   "Literasi TIK & Media Pembelajaran"
   ---------------------------------------------------------------------
   Setiap zona berisi 5 soal (tantangan boss fight).
   Setiap soal memiliki: text, options, answer (index), hint, explanation.
   ===================================================================== */

const ZONES = [
  /* ================= ZONA 1 : HUTAN LOGIKA ================= */
  {
    key: "hutan-logika",
    name: "Hutan Logika",
    topic: "Logika Proposisional / Boolean (AND, OR, NOT)",
    icon: "\u{1F332}",
    color: "#46e07a",
    bg: "assets/bg-zone1.png",
    minionEmoji: "\u{1F9A0}",
    minionName: "Amoeba Glitch",
    wallEmoji: "\u{1F332}",
    theme: { floor: "#243b22", floorAlt: "#1e331c", wall: "#0f2210" },
    map: [
      "###############",
      "#P...........1#",
      "#.##..#...##..#",
      "#..#..#.#..#..#",
      "#..#....#..#.2#",
      "#..#.##.#..#..#",
      "#....##....#..#",
      "#.3.#..#.##.#.#",
      "#...##.#....#.#",
      "#4.....5....X.#",
      "###############"
    ],
    boss: {
      name: "Glitch Slime",
      emoji: "\u{1F47E}",
      intro: "Lendir kode rusak menyala-nyala menghadang jalanmu! Jawab teka-teki logika untuk melumpuhkannya."
    },
    questions: [
      {
        text: "Jika sebuah sistem mendeteksi \"Kunci Valid\" (True) DAN \"Pintu Tidak Terkunci\" (False), apa hasil dari operasi logika True AND False?",
        options: ["True", "False", "Error", "Not True"],
        answer: 1,
        hint: "Ingat aturan AND: hasilnya True hanya jika SEMUA input bernilai True.",
        explanation: "Operasi logika AND mensyaratkan kedua nilai (input) harus True agar hasilnya True. Jika salah satu atau keduanya False, maka hasilnya pasti False."
      },
      {
        text: "Gerbang logika yang akan menghasilkan nilai True jika salah satu saja input-nya bernilai True adalah...",
        options: ["AND", "NOT", "OR", "NAND"],
        answer: 2,
        hint: "Gerbang ini cukup puas dengan SATU kondisi True saja.",
        explanation: "Logika OR cukup membutuhkan satu kondisi True untuk membuat hasil akhirnya menjadi True. Hasil False hanya terjadi jika semua inputnya False."
      },
      {
        text: "Sebuah switch ajaib di Hutan Logika mengubah kondisi siang menjadi malam. Jika siang direpresentasikan sebagai True, operasi logika apa yang mengubahnya menjadi False?",
        options: ["OR", "AND", "IF", "NOT"],
        answer: 3,
        hint: "Operasi ini adalah kebalikan (negasi) dari nilai input.",
        explanation: "NOT adalah operasi negasi atau kebalikan. Jika inputnya True, NOT akan menjadikannya False, dan sebaliknya."
      },
      {
        text: "Jika variabel X bernilai False dan Y bernilai False, apa hasil dari operasi X OR Y?",
        options: ["True", "False", "Keduanya benar", "Tidak dapat ditentukan"],
        answer: 1,
        hint: "OR butuh minimal satu nilai True untuk menghasilkan True. Sekarang cek nilai keduanya.",
        explanation: "Pada logika OR, karena tidak ada satu pun nilai yang True (keduanya False), maka hasil akhirnya akan False."
      },
      {
        text: "Kombinasi gerbang logika: Apa hasil dari NOT (True AND False)?",
        options: ["True", "False", "Null", "Error"],
        answer: 0,
        hint: "Selesaikan dulu isi tanda kurung (True AND False), lalu balik hasilnya dengan NOT.",
        explanation: "Selesaikan dalam kurung dulu: True AND False menghasilkan False. Kemudian hasil tersebut di-negasi dengan NOT. NOT False hasilnya adalah True."
      }
    ]
  },

  /* ================= ZONA 2 : KASTIL ALGORITMA ================= */
  {
    key: "kastil-algoritma",
    name: "Kastil Algoritma",
    topic: "Menyusun Urutan Langkah Kerja / Flowchart",
    icon: "\u{1F3F0}",
    color: "#ffab4a",
    bg: "assets/bg-zone2.png",
    minionEmoji: "\u{1F916}",
    minionName: "Robot Penjaga",
    wallEmoji: "\u{1F9F1}",
    theme: { floor: "#3b3730", floorAlt: "#332f29", wall: "#1d1a15" },
    map: [
      "###############",
      "#P....#......2#",
      "#.##..#.###...#",
      "#.#...#...#.#.#",
      "#.#.1.#.#.#.#.#",
      "#.#...#.#...#.#",
      "#.###.#.###.#.#",
      "#.#...#...#.#.#",
      "#.#.###.#.#.#.#",
      "#4....5..3.X..#",
      "###############"
    ],
    boss: {
      name: "Golem Algoritma",
      emoji: "\u{1F5FF}",
      intro: "Raksasa batu penjaga kastil bangkit! Susun langkah logismu berurutan untuk menjatuhkannya."
    },
    questions: [
      {
        text: "Dalam Zona 2, pemain harus menyusun urutan penyelesaian masalah secara sistematis. Urutan langkah-langkah logis ini dikenal dengan istilah...",
        options: ["Debugging", "Variabel", "Algoritma", "Sintaks"],
        answer: 2,
        hint: "Istilah ini berarti rangkaian langkah logis dan berurutan untuk menyelesaikan masalah.",
        explanation: "Algoritma adalah serangkaian langkah atau instruksi logis yang disusun secara sistematis dan berurutan untuk menyelesaikan suatu masalah tertentu."
      },
      {
        text: "Saat pemain dihadapkan pada persimpangan jalan di dalam kastil dan harus memilih jalur berdasarkan syarat tertentu, simbol flowchart apa yang paling tepat untuk menggambarkan kondisi tersebut?",
        options: ["Persegi panjang", "Belah ketupat (Diamond)", "Oval", "Jajar genjang"],
        answer: 1,
        hint: "Simbol keputusan memiliki dua jalur keluar, biasanya Ya / Tidak.",
        explanation: "Simbol belah ketupat digunakan untuk decision atau pengambilan keputusan, di mana program harus memilih jalur (biasanya Ya/Tidak) berdasarkan kondisi tertentu."
      },
      {
        text: "Simbol persegi panjang di dalam sebuah diagram alir (flowchart) berfungsi untuk menunjukkan...",
        options: ["Awal dan akhir program", "Input data dari pengguna", "Proses atau tindakan/perhitungan", "Pilihan keputusan"],
        answer: 2,
        hint: "Persegi panjang melambangkan langkah pemrosesan, bukan keputusan atau terminal.",
        explanation: "Persegi panjang melambangkan langkah pemrosesan, seperti perhitungan matematika, penugasan variabel, atau eksekusi perintah spesifik."
      },
      {
        text: "Mengapa langkah-langkah dalam sebuah algoritma harus terstruktur dan tidak boleh sembarangan?",
        options: ["Agar tampilan kode lebih menarik", "Untuk memperbesar ukuran program", "Agar komputer bisa membaca kode dengan cepat", "Agar program berjalan benar dan tujuan tercapai tanpa error"],
        answer: 3,
        hint: "Komputer mengeksekusi perintah secara berurutan dari awal hingga akhir.",
        explanation: "Komputer mengeksekusi perintah secara berurutan. Jika algoritmanya berantakan atau urutannya salah, hasil dari program akan salah atau program akan gagal berjalan."
      },
      {
        text: "Setiap diagram alir (flowchart) yang baik selalu memiliki titik mulai dan titik selesai. Simbol yang merepresentasikan terminal (Start/End) ini adalah...",
        options: ["Oval (Terminator)", "Tanda Panah", "Jajar Genjang", "Lingkaran kecil"],
        answer: 0,
        hint: "Cari bentuk yang menandai batas awal dan akhir sebuah flowchart.",
        explanation: "Simbol berbentuk oval atau kapsul selalu digunakan di awal dan di akhir sebuah flowchart untuk menandai batas dimulainya dan berakhirnya sebuah algoritma."
      }
    ]
  },

  /* ================= ZONA 3 : GUA VARIABEL ================= */
  {
    key: "gua-variabel",
    name: "Gua Variabel",
    topic: "Klasifikasi Tipe Data dan Variabel",
    icon: "\u{1F48E}",
    color: "#5ce1e6",
    bg: "assets/bg-zone3.png",
    minionEmoji: "\u{1F987}",
    minionName: "Kelelawar Kristal",
    wallEmoji: "\u{1FAA8}",
    theme: { floor: "#1e2b4d", floorAlt: "#1a2644", wall: "#0d1730" },
    map: [
      "###############",
      "#P....#......1#",
      "#.###.#.####..#",
      "#.....#.#...#.#",
      "#.###.#.#.#.#.#",
      "#...#...#.#...#",
      "#.#.#.###.#.#.#",
      "#.3.#...#.#.#.#",
      "#...#.###.#.#.#",
      "#4..5...2...X.#",
      "###############"
    ],
    boss: {
      name: "Naga Variabel",
      emoji: "\u{1F409}",
      intro: "Naga penjaga kristal data terbangun! Tebak tipe data dengan tepat untuk merebut kristalnya."
    },
    questions: [
      {
        text: "Apa fungsi utama dari \"Variabel\" di dalam dunia pemrograman?",
        options: ["Menghapus data secara otomatis", "Menyimpan nilai atau data sementara di memori", "Membuat tampilan grafis menjadi lebih bagus", "Menghentikan program yang error"],
        answer: 1,
        hint: "Bayangkan variabel sebagai 'kotak' bernama di memori komputer yang nilainya bisa berubah-ubah.",
        explanation: "Variabel ibarat sebuah wadah atau kotak di dalam memori komputer yang diberi nama untuk menyimpan data yang nilainya bisa berubah-ubah."
      },
      {
        text: "Pada game Quest of Syntax, nama penjelajah disimpan oleh sistem. Tipe data apa yang digunakan untuk menyimpan karakter teks seperti nama?",
        options: ["Integer", "Boolean", "String", "Float"],
        answer: 2,
        hint: "Teks, kata, atau kalimat disimpan dalam tipe data ini.",
        explanation: "String adalah tipe data yang khusus dirancang untuk menyimpan kumpulan karakter (teks, kata, atau kalimat)."
      },
      {
        text: "Untuk menyimpan sisa nyawa (health points) karakter yang berupa bilangan bulat tak terpecah, seperti 3 nyawa, tipe data yang paling tepat adalah...",
        options: ["Float", "String", "Boolean", "Integer"],
        answer: 3,
        hint: "Bilangan bulat tanpa koma atau desimal.",
        explanation: "Integer digunakan khusus untuk menyimpan nilai angka berupa bilangan bulat (tidak mengandung koma atau desimal)."
      },
      {
        text: "Tipe data apakah yang paling sesuai untuk menyimpan status \"Tamat\" atau \"Belum Tamat\" (hanya ada dua kemungkinan)?",
        options: ["Boolean", "Integer", "Float", "Double"],
        answer: 0,
        hint: "Tipe data ini hanya memiliki dua nilai: True atau False.",
        explanation: "Boolean adalah tipe data yang hanya dapat menampung dua nilai, yaitu True (Benar) atau False (Salah)."
      },
      {
        text: "Jika Anda perlu membuat variabel yang merepresentasikan nilai gravitasi bumi (9.8), tipe data apa yang harus digunakan?",
        options: ["String", "Integer", "Float", "Char"],
        answer: 2,
        hint: "Angka 9.8 memiliki koma desimal di belakangnya.",
        explanation: "Float (atau floating-point) adalah tipe data yang digunakan untuk menyimpan nilai angka pecahan atau desimal."
      }
    ]
  },

  /* ================= ZONA 4 : MENARA DEBUGGING ================= */
  {
    key: "menara-debugging",
    name: "Menara Debugging",
    topic: "Analisis Kesalahan dan Perbaikan Kode",
    icon: "\u{1F5FC}",
    color: "#b06cff",
    bg: "assets/bg-zone4.png",
    minionEmoji: "\u{1F41C}",
    minionName: "Bug Kecil",
    wallEmoji: "\u2699\uFE0F",
    theme: { floor: "#2a2038", floorAlt: "#241b31", wall: "#130c1f" },
    map: [
      "###############",
      "#P...#.......1#",
      "#.#..#.####...#",
      "#.#..#....#.#.#",
      "#.#..#.##.#.#.#",
      "#....#.#..#.#.#",
      "#.##.#.#.##.#.#",
      "#.#..#.#....#.#",
      "#.#.##.#.####.#",
      "#4..2..5..3.X.#",
      "###############"
    ],
    boss: {
      name: "Lord Bug",
      emoji: "\u{1F577}",
      intro: "Sarang kesalahan bersembunyi di puncak menara! Basmi setiap bug dengan analisis yang tajam."
    },
    questions: [
      {
        text: "Di Zona terakhir, pemain harus mencari cacat dalam sistem. Istilah umum untuk cacat atau kesalahan pada program komputer adalah...",
        options: ["Syntax", "Bug", "Logic", "Loop"],
        answer: 1,
        hint: "Istilah ini diambil dari dunia serangga dan merujuk pada kecacatan sebuah program.",
        explanation: "Bug adalah kecacatan, kesalahan, atau kegagalan pada perangkat lunak komputer yang membuatnya tidak bekerja sebagaimana mestinya."
      },
      {
        text: "Proses menganalisis, mencari, dan memperbaiki bug di dalam kode program disebut...",
        options: ["Compiling", "Executing", "Debugging", "Coding"],
        answer: 2,
        hint: "Proses 'membasmi' bug dari kode program.",
        explanation: "Debugging adalah rutinitas yang dilakukan oleh pemrogram (atau pemain di game ini) untuk mengidentifikasi dan membasmi kesalahan pada sistem (menghilangkan bug)."
      },
      {
        text: "Jika Anda mengetik perintah \"prit\" yang seharusnya \"print\", sehingga program menolak berjalan dan menampilkan layar merah, ini termasuk jenis kesalahan apa?",
        options: ["Logical error", "Syntax error", "Runtime error", "User error"],
        answer: 1,
        hint: "Kesalahan terjadi pada penulisan (typo) yang melanggar tata bahasa pemrograman.",
        explanation: "Syntax error terjadi saat ada kesalahan penulisan (typo) atau pelanggaran aturan tata bahasa pada bahasa pemrograman, sehingga komputer tidak bisa memahami perintahnya."
      },
      {
        text: "Sebuah program dapat berjalan lancar tanpa crash. Namun, ketika pemain mengalahkan musuh, poinnya malah berkurang alih-alih bertambah. Ini merupakan contoh dari...",
        options: ["Syntax error", "Logical error", "Compile error", "System error"],
        answer: 1,
        hint: "Program berjalan tanpa peringatan sistem, tetapi hasil keluarannya salah.",
        explanation: "Logical error (kesalahan logika) terjadi ketika program berjalan tanpa peringatan sistem, namun hasil keluarannya salah karena algoritma atau rumus yang diketik oleh pemrogram keliru."
      },
      {
        text: "Apa langkah pertama yang paling tepat dilakukan saat melakukan aktivitas debugging karena program tiba-tiba berhenti (crash)?",
        options: ["Menghapus semua kode dan mengulang dari awal", "Mematikan komputer paksa", "Membaca pesan kesalahan (error message) yang diberikan oleh sistem", "Menekan tombol keyboard sembarangan"],
        answer: 2,
        hint: "Sistem biasanya memberikan laporan tentang letak masalah terjadi.",
        explanation: "Sistem komputer biasanya memberikan laporan atau error message yang menunjukkan pada baris ke berapa masalah terjadi. Membaca pesan ini adalah langkah kunci agar debugging bisa terarah."
      }
    ]
  }
];

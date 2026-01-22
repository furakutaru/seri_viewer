import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split("://")[1]?.split("@")[1]?.split(":")[0] || "localhost",
  user: process.env.DATABASE_URL?.split("://")[1]?.split(":")[0] || "root",
  password: process.env.DATABASE_URL?.split(":")[2]?.split("@")[0] || "",
  database: process.env.DATABASE_URL?.split("/").pop() || "test",
});

// サンプルセリデータを挿入
const saleId = 1;
const saleName = "2025 Summer Sale";
const saleCode = "20250801_summer";

// セリ情報を挿入
await connection.execute(
  "INSERT INTO sales (saleCode, saleName, saleDate, catalogUrl) VALUES (?, ?, ?, ?)",
  [saleCode, saleName, new Date("2025-08-01"), "https://example.com/catalog"]
);

// サンプル馬データを挿入（10頭）
const sampleHorses = [
  {
    lotNumber: 1,
    horseName: "ノーザンダンサー",
    sex: "牡",
    color: "栗毛",
    birthDate: new Date("2023-04-15"),
    sireName: "キングカメハメハ",
    damName: "ダンスインザムード",
    consignor: "ABC牧場",
    breeder: "XYZ牧場",
    height: 160.5,
    girth: 185.2,
    cannon: 20.1,
    priceEstimate: 5000,
    photoUrl: "https://example.com/photos/1.jpg",
    videoUrl: "https://example.com/videos/1.mp4",
    pedigreePdfUrl: "https://example.com/pedigree/1.pdf",
  },
  {
    lotNumber: 2,
    horseName: "ビューティフルデイ",
    sex: "牝",
    color: "黒鹿毛",
    birthDate: new Date("2023-05-20"),
    sireName: "ディープインパクト",
    damName: "ビューティフルストーリー",
    consignor: "DEF牧場",
    breeder: "GHI牧場",
    height: 158.2,
    girth: 182.5,
    cannon: 19.8,
    priceEstimate: 4500,
    photoUrl: "https://example.com/photos/2.jpg",
    videoUrl: "https://example.com/videos/2.mp4",
    pedigreePdfUrl: "https://example.com/pedigree/2.pdf",
  },
  {
    lotNumber: 3,
    horseName: "パワフルスピード",
    sex: "牡",
    color: "鹿毛",
    birthDate: new Date("2023-03-10"),
    sireName: "ハーツクライ",
    damName: "スピードクイーン",
    consignor: "JKL牧場",
    breeder: "MNO牧場",
    height: 162.0,
    girth: 187.0,
    cannon: 20.5,
    priceEstimate: 6000,
    photoUrl: "https://example.com/photos/3.jpg",
    videoUrl: "https://example.com/videos/3.mp4",
    pedigreePdfUrl: "https://example.com/pedigree/3.pdf",
  },
  {
    lotNumber: 4,
    horseName: "グレースフルレディ",
    sex: "牝",
    color: "栗毛",
    birthDate: new Date("2023-06-05"),
    sireName: "ルーラーシップ",
    damName: "グレースフルモーメント",
    consignor: "PQR牧場",
    breeder: "STU牧場",
    height: 157.5,
    girth: 180.0,
    cannon: 19.2,
    priceEstimate: 3800,
    photoUrl: "https://example.com/photos/4.jpg",
    videoUrl: "https://example.com/videos/4.mp4",
    pedigreePdfUrl: "https://example.com/pedigree/4.pdf",
  },
  {
    lotNumber: 5,
    horseName: "チャンピオンスピリット",
    sex: "牡",
    color: "黒鹿毛",
    birthDate: new Date("2023-02-28"),
    sireName: "ゼンノロブロイ",
    damName: "チャンピオンズドリーム",
    consignor: "VWX牧場",
    breeder: "YZA牧場",
    height: 163.5,
    girth: 189.0,
    cannon: 21.0,
    priceEstimate: 7000,
    photoUrl: "https://example.com/photos/5.jpg",
    videoUrl: "https://example.com/videos/5.mp4",
    pedigreePdfUrl: "https://example.com/pedigree/5.pdf",
  },
];

for (const horse of sampleHorses) {
  await connection.execute(
    `INSERT INTO horses (saleId, lotNumber, horseName, sex, color, birthDate, sireName, damName, consignor, breeder, height, girth, cannon, priceEstimate, photoUrl, videoUrl, pedigreePdfUrl)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      saleId,
      horse.lotNumber,
      horse.horseName,
      horse.sex,
      horse.color,
      horse.birthDate,
      horse.sireName,
      horse.damName,
      horse.consignor,
      horse.breeder,
      horse.height,
      horse.girth,
      horse.cannon,
      horse.priceEstimate,
      horse.photoUrl,
      horse.videoUrl,
      horse.pedigreePdfUrl,
    ]
  );
}

console.log("Sample data seeded successfully!");
await connection.end();

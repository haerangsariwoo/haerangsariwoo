/**
 * brand/ 원본 이미지에서 두 앱의 아이콘·로고를 생성한다.
 * 실행: cd apps/main && node ../../scripts/gen-icons.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const apps = [
  { dir: "apps/main", icon: "icon-main.png" },
  { dir: "apps/recruit", icon: "icon-recruit.png" },
];

(async () => {
  for (const a of apps) {
    const app = path.join(ROOT, a.dir);
    const icon = path.join(ROOT, "brand", a.icon);
    const logo = path.join(ROOT, "brand", "logo.png");

    // Next.js 규칙: app/ 안에 두면 <head> 태그가 자동 생성된다
    await sharp(icon).resize(512, 512).png().toFile(path.join(app, "src/app/icon.png"));
    await sharp(icon).resize(32, 32).png().toFile(path.join(app, "src/app/icon1.png"));
    await sharp(icon).resize(180, 180).png().toFile(path.join(app, "src/app/apple-icon.png"));

    // PWA manifest에서 참조
    fs.mkdirSync(path.join(app, "public/icons"), { recursive: true });
    await sharp(icon).resize(192, 192).png().toFile(path.join(app, "public/icons/icon-192.png"));
    await sharp(icon).resize(512, 512).png().toFile(path.join(app, "public/icons/icon-512.png"));

    // 앱 내 로고 (투명 배경)
    await sharp(logo).resize(256, 256).png().toFile(path.join(app, "public/logo.png"));

    console.log(a.dir, "생성 완료");
  }
})();

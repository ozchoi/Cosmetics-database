import type { MetadataRoute } from "next";
import { appConfig } from "@cosmetic-lens/shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appConfig.productName} | ${appConfig.productEnglishName}`,
    short_name: appConfig.productName,
    description:
      "搜尋化妝品及成分、上載產品標籤相片、核對 OCR 結果，並從健康、致敏、環境、法規及證據可信度等角度理解成分資料。",
    lang: appConfig.locale,
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
  };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Camera,
  CheckCircle2,
  FileImage,
  RotateCcw,
  ScanText,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { ingredientFixtures, concernDimensionLabels } from "@cosmetic-lens/shared";
import {
  createFormulaHash,
  matchIngredientList,
  parseIngredientList,
  type IngredientMatchResult,
} from "@cosmetic-lens/ingredient-parser";
import {
  BrowserTesseractOcrProvider,
  DeterministicOcrProvider,
  type OcrResult,
} from "@cosmetic-lens/ocr";
import { buttonClass, ConcernRangeCard, OcrConfidenceBadge, secondaryButtonClass } from "./ui";

type ImageType = "product_front" | "product_back" | "ingredient_label" | "barcode" | "other";
type ContributionMode = "instant_only" | "text_only" | "processed_image_and_text";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  imageType: ImageType;
  rotation: number;
  cropPercent: number;
  greyscale: boolean;
  contrast: number;
  validation: string;
  processedSha256?: string;
}

interface FormFields {
  productName: string;
  brandName: string;
  marketCode: string;
  barcode: string;
  category: string;
  productForm: "cream" | "liquid" | "gel" | "powder" | "spray" | "aerosol" | "stick" | "unknown";
  usageType: "leave_on" | "rinse_off" | "mixed" | "unknown";
  bodyArea: string;
  notes: string;
  contributionMode: ContributionMode;
  consentConfirmed: boolean;
}

const imageTypeLabels: Record<ImageType, string> = {
  product_front: "產品正面",
  product_back: "產品背面",
  ingredient_label: "成分標籤",
  barcode: "條碼",
  other: "其他",
};

const sniffClientImageMime = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  const header = new TextDecoder("ascii").decode(bytes);
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") return "image/webp";
  return "unsupported";
};

const sha256Hex = async (blob: Blob): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const loadImage = async (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("未能讀取圖片。"));
    image.src = URL.createObjectURL(file);
  });

const canvasToBlob = async (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("未能重新編碼圖片。"));
      else resolve(blob);
    }, "image/png");
  });

const reencodeImage = async (item: ImageItem): Promise<Blob> => {
  const image = await loadImage(item.file);
  const crop = Math.max(0, Math.min(25, item.cropPercent)) / 100;
  const sx = image.naturalWidth * crop;
  const sy = image.naturalHeight * crop;
  const sw = image.naturalWidth * (1 - crop * 2);
  const sh = image.naturalHeight * (1 - crop * 2);
  const rotated = item.rotation % 180 !== 0;
  const canvas = document.createElement("canvas");
  canvas.width = rotated ? sh : sw;
  canvas.height = rotated ? sw : sh;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("瀏覽器不支援圖片處理。");
  context.filter = `${item.greyscale ? "grayscale(1)" : "grayscale(0)"} contrast(${item.contrast}%)`;
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((item.rotation * Math.PI) / 180);
  context.drawImage(image, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  return canvasToBlob(canvas);
};

export function SubmitWorkflow() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [rawOcrText, setRawOcrText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [ocrResult, setOcrResult] = useState<OcrResult | undefined>();
  const [matches, setMatches] = useState<IngredientMatchResult[]>([]);
  const [formulaHash, setFormulaHash] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);
  const [includeTraditionalChineseOcr, setIncludeTraditionalChineseOcr] = useState(false);

  const { register, handleSubmit, watch, formState } = useForm<FormFields>({
    defaultValues: {
      productName: "",
      brandName: "",
      marketCode: "HK",
      barcode: "",
      category: "面部護理",
      productForm: "liquid",
      usageType: "leave_on",
      bodyArea: "面部",
      notes: "",
      contributionMode: "instant_only",
      consentConfirmed: false,
    },
  });

  const contributionMode = watch("contributionMode");
  const consentConfirmed = watch("consentConfirmed");

  useEffect(() => {
    const tokens = parseIngredientList(correctedText);
    setMatches(matchIngredientList(correctedText, ingredientFixtures));
    createFormulaHash(tokens)
      .then(setFormulaHash)
      .catch(() => setFormulaHash(""));
  }, [correctedText]);

  const unresolvedCount = useMemo(
    () => matches.filter((match) => match.status !== "confirmed").length,
    [matches],
  );

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const maxFiles = Number(process.env["NEXT_PUBLIC_UPLOAD_MAX_FILES"] ?? 5);
    const maxBytes = Number(process.env["NEXT_PUBLIC_UPLOAD_MAX_FILE_MB"] ?? 8) * 1024 * 1024;
    const nextImages: ImageItem[] = [];

    for (const file of [...files].slice(0, maxFiles - images.length)) {
      const mime = await sniffClientImageMime(file);
      const validation =
        mime === "unsupported"
          ? "只支援 JPEG、PNG 或 WebP。"
          : file.size > maxBytes
            ? "檔案超出大小限制。"
            : "格式已按檔案內容確認。";
      nextImages.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        imageType: "ingredient_label",
        rotation: 0,
        cropPercent: 0,
        greyscale: false,
        contrast: 110,
        validation,
      });
    }

    setImages((current) => [...current, ...nextImages]);
  };

  const updateImage = (id: string, patch: Partial<ImageItem>) => {
    setImages((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const runOcr = async () => {
    const target = images.find((item) => item.imageType === "ingredient_label") ?? images[0];
    if (!target) {
      setStatus("請先加入成分標籤圖片。");
      return;
    }

    setIsBusy(true);
    setStatus("正在重新編碼圖片並執行本地 OCR...");
    try {
      const processed = await reencodeImage(target);
      const processedSha256 = await sha256Hex(processed);
      updateImage(target.id, { processedSha256 });
      const languages = includeTraditionalChineseOcr ? ["eng", "chi_tra"] : ["eng"];
      const provider =
        process.env["NEXT_PUBLIC_USE_TEST_OCR"] === "true"
          ? new DeterministicOcrProvider()
          : new BrowserTesseractOcrProvider();
      const result = await provider.recognize({
        data: processed,
        mimeType: processed.type,
        languageCodes: languages,
      });
      setOcrResult(result);
      setRawOcrText(result.rawText);
      setCorrectedText(result.rawText);
      setStatus("OCR 完成，請逐行核對及修正。");
    } catch {
      const fallback = await new DeterministicOcrProvider().recognize({
        data: new Uint8Array(),
        languageCodes: ["eng"],
      });
      setOcrResult(fallback);
      setRawOcrText(fallback.rawText);
      setCorrectedText(fallback.rawText);
      setStatus("本地 OCR 未能完成，已載入測試供應商文字以示範流程。");
    } finally {
      setIsBusy(false);
    }
  };

  const submitContribution = handleSubmit(async (values) => {
    if (values.contributionMode !== "instant_only" && !values.consentConfirmed) {
      setStatus("請先確認提交同意。");
      return;
    }
    setIsBusy(true);
    setStatus("正在提交待審核資料...");
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        correctedText,
        rawOcrText,
        bodyArea: values.bodyArea
          .split(/[,\s，、]+/u)
          .map((item) => item.trim())
          .filter(Boolean),
        formulaHash,
        imageSha256: images.find((item) => item.processedSha256)?.processedSha256,
      }),
    });
    const result = (await response.json()) as { id?: string; error?: string };
    setIsBusy(false);
    setStatus(response.ok ? `已建立待審核提交：${result.id}` : (result.error ?? "提交失敗。"));
  });

  return (
    <div className="grid gap-8">
      <section className="rounded-lg border border-[var(--line)] bg-white p-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
          <FileImage aria-hidden="true" size={22} />
          1. 加入及處理圖片
        </h2>
        <label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-6 text-center">
          <Camera aria-hidden="true" className="text-[var(--accent)]" size={32} />
          <span className="mt-3 font-semibold text-slate-900">選擇產品相片</span>
          <span className="mt-1 text-sm text-[var(--muted)]">
            JPEG、PNG、WebP；按檔案內容驗證格式。
          </span>
          <input
            className="sr-only"
            aria-label="選擇產品相片"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => {
              void addFiles(event.currentTarget.files);
            }}
          />
        </label>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {images.map((item) => (
            <article key={item.id} className="rounded-lg border border-[var(--line)] p-4">
              <img
                src={item.previewUrl}
                alt="已上載產品標籤預覽"
                className="aspect-[4/3] w-full rounded-md object-contain bg-slate-50"
              />
              <div className="mt-3 grid gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-slate-800">圖片類型</span>
                  <select
                    value={item.imageType}
                    onChange={(event) =>
                      updateImage(item.id, { imageType: event.currentTarget.value as ImageType })
                    }
                    className="min-h-10 rounded-md border border-[var(--line)] px-3"
                  >
                    {Object.entries(imageTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    className={secondaryButtonClass}
                    type="button"
                    onClick={() => updateImage(item.id, { rotation: (item.rotation + 90) % 360 })}
                  >
                    <RotateCcw aria-hidden="true" size={16} />
                    旋轉
                  </button>
                  <label className="grid gap-1 text-sm sm:col-span-2">
                    <span className="font-semibold text-slate-800">
                      裁切邊緣 {item.cropPercent}%
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={25}
                      value={item.cropPercent}
                      onChange={(event) =>
                        updateImage(item.id, { cropPercent: Number(event.currentTarget.value) })
                      }
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.greyscale}
                      onChange={(event) =>
                        updateImage(item.id, { greyscale: event.currentTarget.checked })
                      }
                    />
                    灰階
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-800">對比 {item.contrast}%</span>
                    <input
                      type="range"
                      min={80}
                      max={180}
                      value={item.contrast}
                      onChange={(event) =>
                        updateImage(item.id, { contrast: Number(event.currentTarget.value) })
                      }
                    />
                  </label>
                </div>
                <p className="text-xs text-[var(--muted)]">{item.validation}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className={buttonClass}
            type="button"
            onClick={() => void runOcr()}
            disabled={isBusy || images.length === 0}
          >
            <ScanText aria-hidden="true" size={18} />
            執行本地 OCR
          </button>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeTraditionalChineseOcr}
              onChange={(event) => setIncludeTraditionalChineseOcr(event.currentTarget.checked)}
            />
            嘗試繁體中文 OCR
          </label>
          {ocrResult ? <OcrConfidenceBadge confidence={ocrResult.averageConfidence} /> : null}
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-[var(--line)] bg-white p-5 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">2. OCR 文字</h2>
          <pre className="mt-4 min-h-48 overflow-auto rounded-md bg-slate-950 p-4 text-sm leading-7 text-slate-100">
            {rawOcrText || "尚未執行 OCR。"}
          </pre>
        </div>
        <label className="grid gap-3">
          <span className="text-xl font-semibold text-slate-950">3. 人手修正成分表</span>
          <textarea
            className="min-h-48 rounded-md border border-[var(--line)] p-4 text-sm leading-7"
            value={correctedText}
            onChange={(event) => setCorrectedText(event.currentTarget.value)}
            placeholder="請貼上或修正成分表，例如：Ingredients: Aqua, Glycerin..."
          />
        </label>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5">
        <h2 className="text-xl font-semibold text-slate-950">4. 解析及配對</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">配方 Hash：{formulaHash || "等待文字"}</p>
        <div className="mt-4 grid gap-3">
          {matches.map((match) => (
            <article
              key={`${match.token.position}-${match.token.raw}`}
              className={`rounded-lg border p-4 ${
                match.status === "confirmed"
                  ? "border-[var(--line)] bg-white"
                  : "border-amber-300 bg-amber-50"
              }`}
            >
              <div className="grid gap-3 md:grid-cols-[56px_1fr_auto] md:items-center">
                <span className="text-sm font-semibold text-[var(--muted)]">
                  #{match.token.position}
                </span>
                <div>
                  <p className="font-semibold text-slate-950">{match.token.raw}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {match.ingredient
                      ? `${match.ingredient.preferredZhHantHkName} / ${match.ingredient.preferredEnglishName}`
                      : match.candidates[0]
                        ? `候選：${match.candidates[0].ingredient.preferredZhHantHkName}`
                        : "未解析，需進入審核隊列"}
                  </p>
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                  {match.status === "confirmed"
                    ? "已確認"
                    : match.status === "uncertain"
                      ? "不確定"
                      : "未解析"}{" "}
                  · {Math.round(match.confidence * 100)}%
                </span>
              </div>
            </article>
          ))}
        </div>
        {matches.length > 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            不確定或未解析成分：{unresolvedCount}。系統不會自動確認低信心 fuzzy match。
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-white p-5">
        <h2 className="text-xl font-semibold text-slate-950">5. 即時分析</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(concernDimensionLabels).map(([dimension, label]) => (
            <ConcernRangeCard
              key={dimension}
              title={label}
              status="資料不足"
              confidence="U"
              completeness={0}
              explanation="未有足夠已審核危害、暴露及來源資料；資料不足不等同零潛在關注。"
            />
          ))}
        </div>
      </section>

      <form
        className="rounded-lg border border-[var(--line)] bg-white p-5"
        onSubmit={(event) => void submitContribution(event)}
      >
        <h2 className="text-xl font-semibold text-slate-950">6. 產品情境及提交選擇</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">產品名稱</span>
            <input
              className="min-h-10 rounded-md border border-[var(--line)] px-3"
              {...register("productName", { required: true })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">品牌</span>
            <input
              className="min-h-10 rounded-md border border-[var(--line)] px-3"
              {...register("brandName", { required: true })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">市場</span>
            <input
              className="min-h-10 rounded-md border border-[var(--line)] px-3"
              {...register("marketCode", { required: true })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">條碼</span>
            <input
              className="min-h-10 rounded-md border border-[var(--line)] px-3"
              {...register("barcode")}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">類別</span>
            <input
              className="min-h-10 rounded-md border border-[var(--line)] px-3"
              {...register("category", { required: true })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">使用部位</span>
            <input
              className="min-h-10 rounded-md border border-[var(--line)] px-3"
              {...register("bodyArea", { required: true })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">形態</span>
            <select
              className="min-h-10 rounded-md border border-[var(--line)] px-3"
              {...register("productForm")}
            >
              <option value="cream">膏霜</option>
              <option value="liquid">液體</option>
              <option value="gel">凝膠</option>
              <option value="powder">粉末</option>
              <option value="spray">噴霧</option>
              <option value="aerosol">氣霧</option>
              <option value="stick">棒狀</option>
              <option value="unknown">未知</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">使用方式</span>
            <select
              className="min-h-10 rounded-md border border-[var(--line)] px-3"
              {...register("usageType")}
            >
              <option value="leave_on">免沖洗</option>
              <option value="rinse_off">沖洗型</option>
              <option value="mixed">混合</option>
              <option value="unknown">未知</option>
            </select>
          </label>
        </div>

        <fieldset className="mt-5 grid gap-3">
          <legend className="font-semibold text-slate-800">保存及提交選擇</legend>
          <label className="flex gap-3 rounded-md border border-[var(--line)] p-3 text-sm">
            <input type="radio" value="instant_only" {...register("contributionMode")} />
            <span>只作即時分析，不保存原圖</span>
          </label>
          <label className="flex gap-3 rounded-md border border-[var(--line)] p-3 text-sm">
            <input type="radio" value="text_only" {...register("contributionMode")} />
            <span>提交成分文字，但不保存原圖</span>
          </label>
          <label className="flex gap-3 rounded-md border border-[var(--line)] p-3 text-sm">
            <input
              type="radio"
              value="processed_image_and_text"
              {...register("contributionMode")}
            />
            <span>同意提交已移除相片 metadata 的圖片及成分資料</span>
          </label>
        </fieldset>

        {contributionMode !== "instant_only" ? (
          <label className="mt-5 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
            <input type="checkbox" {...register("consentConfirmed")} />
            <span>
              我確認相片由我拍攝或我有權提交，並同意平台保存已處理的相片及資料，用作建立和核實產品成分資料庫。
            </span>
          </label>
        ) : null}

        <label className="mt-5 grid gap-1 text-sm">
          <span className="font-semibold text-slate-800">審核備註</span>
          <textarea
            className="min-h-24 rounded-md border border-[var(--line)] p-3"
            {...register("notes")}
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className={buttonClass}
            type="submit"
            disabled={
              isBusy || !formulaHash || contributionMode === "instant_only" || !consentConfirmed
            }
          >
            <Send aria-hidden="true" size={18} />
            提交待審核
          </button>
          <span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
            <CheckCircle2 aria-hidden="true" size={16} />
            即時分析不會自動發布
          </span>
        </div>
        {Object.keys(formState.errors).length > 0 ? (
          <p className="mt-3 text-sm text-[var(--rose)]">請補充必填欄位。</p>
        ) : null}
      </form>

      {status ? (
        <div
          className="rounded-lg border border-[var(--line)] bg-white p-4 text-sm font-semibold text-slate-800"
          role="status"
        >
          <SlidersHorizontal aria-hidden="true" className="mr-2 inline" size={16} />
          {status}
        </div>
      ) : null}
    </div>
  );
}

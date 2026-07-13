import { SectionHeader } from "../../components/ui";

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="私隱政策（草稿，需法律審閱）"
      body="平台採取最少資料收集原則。即時分析可不保存原圖；若使用者同意提交圖片，系統應移除 metadata 並以受控方式保存。"
      points={[
        "原始上載圖片預設不公開。",
        "管理員操作需要審計紀錄。",
        "不得在日誌記錄個人識別資料。",
        "外部連結需安全處理並保留來源脈絡。",
      ]}
    />
  );
}

function PolicyPage({
  title,
  body,
  points,
}: Readonly<{ title: string; body: string; points: string[] }>) {
  return (
    <div className="container-shell py-10">
      <SectionHeader eyebrow="法律文件" title={title} body={body} />
      <ul className="mt-8 grid gap-3 rounded-lg border border-[var(--line)] bg-white p-6 text-sm leading-7 text-[var(--muted)]">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}

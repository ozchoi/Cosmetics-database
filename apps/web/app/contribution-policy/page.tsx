import { SectionHeader } from "../../components/ui";

export default function ContributionPolicyPage() {
  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="提交政策"
        title="社群提交政策（草稿，需法律審閱）"
        body="所有社群提交會先進入待審核狀態。OCR 結果不得自動公開；審核員需要確認成分、來源、產品版本及配方 hash。"
      />
      <ul className="mt-8 grid gap-3 rounded-lg border border-[var(--line)] bg-white p-6 text-sm leading-7 text-[var(--muted)]">
        <li>提交者需確認相片由自己拍攝或有權提交。</li>
        <li>可只提交成分文字而不保存原圖。</li>
        <li>若保存圖片，應使用移除 metadata 的處理版本。</li>
        <li>不會因 OCR 產生未知字詞而自動建立新 canonical ingredient。</li>
      </ul>
    </div>
  );
}

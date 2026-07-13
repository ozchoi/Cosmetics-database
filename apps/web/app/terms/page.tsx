import { SectionHeader } from "../../components/ui";

export default function TermsPage() {
  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="法律文件"
        title="使用條款（草稿，需法律審閱）"
        body="使用者不得提交未獲授權圖片、垃圾資料、侵犯私隱內容或誤導性科學聲明。平台可拒絕或移除未能核實的提交。"
      />
      <div className="mt-8 rounded-lg border border-[var(--line)] bg-white p-6 text-sm leading-7 text-[var(--muted)]">
        <p>平台資料只供一般資訊及資料核對用途，不構成醫療、法律或專業建議。</p>
      </div>
    </div>
  );
}

import { SubmitWorkflow } from "../../components/submit-workflow";
import { RegulatoryNotice, SectionHeader } from "../../components/ui";

export default function SubmitPage() {
  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="上載產品相片"
        title="OCR、核對、解析及分析"
        body="可先在瀏覽器內分析，不需同意保存原圖。只有在你選擇提交並確認同意後，資料才會進入待審核流程。"
      />
      <div className="mt-6">
        <RegulatoryNotice>
          OCR 可能出錯。請逐行核對原始文字及修正後成分表；不確定配對會清楚標示，並不會自動公開。
        </RegulatoryNotice>
      </div>
      <div className="mt-8">
        <SubmitWorkflow />
      </div>
    </div>
  );
}

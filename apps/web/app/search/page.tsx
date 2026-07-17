import Link from "next/link";
import { Search } from "lucide-react";
import { searchIngredients, searchProducts, searchProductsFor } from "../../lib/data";
import { tryListDatabaseProducts } from "../../lib/db-data";
import {
  EmptyDataState,
  IngredientName,
  SectionHeader,
  VerificationStatusBadge,
  buttonClass,
} from "../../components/ui";

const matchTypeLabel = {
  exact: "精確相符",
  prefix: "前綴相符",
  fuzzy: "近似相符",
} as const;

export default async function SearchPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ q?: string; tab?: string }> }>) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const ingredientResults = query ? searchIngredients(query) : [];
  const productRecords = await tryListDatabaseProducts();
  const productResults = query
    ? productRecords
      ? searchProductsFor(query, productRecords)
      : searchProducts(query)
    : [];

  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="搜尋"
        title="產品與成分搜尋"
        body="可用繁體中文、英文、INCI、別名、CAS、CI 編號、品牌、產品名稱或條碼搜尋。近似相符只作候選，不會自動合併。"
      />

      <form className="mt-8 flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-white p-4 sm:flex-row">
        <label htmlFor="q" className="sr-only">
          搜尋字詞
        </label>
        <input
          id="q"
          name="q"
          defaultValue={query}
          className="min-h-12 flex-1 rounded-md border border-[var(--line)] px-4"
          placeholder="例如：甘油、Glycerin、56-81-5、CI77491"
        />
        <button className={buttonClass} type="submit">
          <Search aria-hidden="true" size={18} />
          搜尋
        </button>
      </form>

      {!query ? (
        <div className="mt-8">
          <EmptyDataState
            title="請輸入搜尋字詞"
            body="搜尋結果會分為產品及成分兩組，並標示精確或近似相符。"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="ingredient-results">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 id="ingredient-results" className="text-xl font-semibold text-slate-950">
                成分
              </h2>
              <span className="text-sm text-[var(--muted)]">{ingredientResults.length} 項</span>
            </div>
            <div className="grid gap-3">
              {ingredientResults.length > 0 ? (
                ingredientResults.map((result) => (
                  <Link
                    key={result.item.id}
                    href={`/ingredients/${result.item.slug}`}
                    className="rounded-lg border border-[var(--line)] bg-white p-4 hover:border-[var(--accent)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <IngredientName ingredient={result.item} compact />
                      <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-xs text-slate-700">
                        {matchTypeLabel[result.matchType]}：{result.matchLabel}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyDataState
                  title="沒有成分結果"
                  body="未能找到相符成分。請嘗試 INCI、英文別名、CAS 或中文別名。"
                />
              )}
            </div>
          </section>

          <section aria-labelledby="product-results">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 id="product-results" className="text-xl font-semibold text-slate-950">
                產品
              </h2>
              <span className="text-sm text-[var(--muted)]">{productResults.length} 項</span>
            </div>
            <div className="grid gap-3">
              {productResults.length > 0 ? (
                productResults.map((result) => {
                  const version = result.item.versions[0]!;
                  return (
                    <Link
                      key={result.item.id}
                      href={`/products/${result.item.slug}`}
                      className="rounded-lg border border-[var(--line)] bg-white p-4 hover:border-[var(--accent)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-[var(--muted)]">{result.item.brand}</p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-950">
                            {result.item.preferredName}
                          </h3>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            {version.marketCode} · {version.category}
                          </p>
                        </div>
                        <VerificationStatusBadge status={version.verificationStatus} />
                      </div>
                      <p className="mt-3 text-xs text-slate-600">
                        {matchTypeLabel[result.matchType]}：{result.matchLabel}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <EmptyDataState
                  title="沒有產品結果"
                  body="未能找到相符產品。請嘗試品牌、條碼或產品名稱。"
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

import { FormEvent, useState } from "react";
import { ProductSearchItem, searchProducts } from "../api/products.api";
import { generateLink } from "../api/links.api";

export function ProductSearchPage() {
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<ProductSearchItem[]>([]);
  const [linkByItem, setLinkByItem] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { items: results } = await searchProducts(keyword);
      setItems(results);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleGenerateLink(item: ProductSearchItem) {
    try {
      const link = await generateLink(item.itemId, item.shopId);
      setLinkByItem((prev) => ({ ...prev, [item.itemId]: link.shortLink }));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div>
      <h1>Search Products</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          required
        />
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {items.map((item) => (
          <li key={item.itemId}>
            <strong>{item.name}</strong>
            {item.priceMin != null && <span> — ${item.priceMin}</span>}
            <button onClick={() => handleGenerateLink(item)}>Generate My Link</button>
            {linkByItem[item.itemId] && (
              <p>
                <a href={linkByItem[item.itemId]} target="_blank" rel="noreferrer">
                  {linkByItem[item.itemId]}
                </a>
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

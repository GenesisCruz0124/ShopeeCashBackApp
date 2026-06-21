import { AffiliateLinkDTO } from "@shopee-cashback/shared";
import { useEffect, useState } from "react";
import { listLinks } from "../api/links.api";

export function MyLinksPage() {
  const [links, setLinks] = useState<AffiliateLinkDTO[]>([]);

  useEffect(() => {
    listLinks().then((res) => setLinks(res.items));
  }, []);

  return (
    <div>
      <h1>My Links</h1>
      <ul>
        {links.map((link) => (
          <li key={link.id}>
            <a href={link.shortLink} target="_blank" rel="noreferrer">
              {link.shortLink}
            </a>
            <span> — created {new Date(link.createdAt).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

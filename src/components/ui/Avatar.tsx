"use client";

import { useEffect, useState } from "react";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { getInitials } from "@/lib/utils";

const AVATAR_COLORS = [
  { bg: "var(--color-acc-bg)", text: "var(--color-acc-txt)" },
  { bg: "var(--color-ok-bg)", text: "var(--color-ok)" },
  { bg: "var(--color-warn-bg)", text: "var(--color-warn)" },
  { bg: "var(--color-err-bg)", text: "var(--color-err)" },
];

function colorForName(name: string) {
  let hash = 0;
  for (const ch of name ?? "") hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const urlCache: Record<string, string | null> = {};

interface AvatarProps {
  userId: string;
  name: string;
  size?: number;
}

export function Avatar({ userId, name, size = 22 }: AvatarProps) {
  const [url, setUrl] = useState<string | null>(urlCache[userId] ?? null);

  useEffect(() => {
    if (urlCache[userId] !== undefined) return;
    const folder = ref(storage, `users/${userId}/profile/files`);
    listAll(folder)
      .then(({ items }) => {
        if (items.length === 0) {
          urlCache[userId] = null;
          return;
        }
        return getDownloadURL(items[0]).then((u) => {
          urlCache[userId] = u;
          setUrl(u);
        });
      })
      .catch(() => {
        urlCache[userId] = null;
      });
  }, [userId]);

  const fontSize = Math.max(8, Math.floor(size * 0.42));
  const colors = colorForName(name);

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-medium"
      style={{
        width: size,
        height: size,
        fontSize,
        background: colors.bg,
        color: colors.text,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

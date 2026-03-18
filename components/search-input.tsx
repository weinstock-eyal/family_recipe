"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (newValue) {
          router.push(`/?q=${encodeURIComponent(newValue)}`);
        } else {
          router.push("/");
        }
      }, 300);
    },
    [router]
  );

  return (
    <div className="relative">
      <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="חיפוש לפי שם, מרכיב, תגית או הערה..."
        value={value}
        onChange={handleChange}
        className="ps-9"
      />
    </div>
  );
}

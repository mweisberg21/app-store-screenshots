"use client";
import { createContext } from "react";
import type { ProjectAsset } from "@/lib/types";
export const AssetContext = createContext<{
  assets: ProjectAsset[];
  add: (asset: ProjectAsset) => void;
  remove: (id: string) => void;
  isUsed: (src: string) => boolean;
}>({ assets: [], add: () => {}, remove: () => {}, isUsed: () => false });

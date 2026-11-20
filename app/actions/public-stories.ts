"use server";

import { getPB, getAllRecords } from "@/lib/pocketbase";
import { toAdminStory, toPublicStory, type PublicStory } from "@/lib/stories";

export async function getPublicStories(): Promise<PublicStory[]> {
  try {
    const pb = getPB();
    const list = await getAllRecords(pb, "stories", {
      filter: "active = true",
      sort: "sort,created",
    });
    return list.map((r) => toPublicStory(toAdminStory(r as Record<string, any>)));
  } catch {
    return [];
  }
}

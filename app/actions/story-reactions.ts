"use server";

import { getAdminPB, getTokenPB, sanitize, buildOrFilter } from "@/lib/pocketbase";
import { verifySession, isInvalidSession, isUnavailableSession } from "@/lib/verify-session";
import type { StoryReaction } from "@/lib/stories";

const ALLOWED_REACTIONS: StoryReaction[] = ["like", "love", "whatever", "dislike"];

function isStoryReaction(value: string): value is StoryReaction {
  return (ALLOWED_REACTIONS as string[]).includes(value);
}

async function getPb(token: string) {
  try {
    return await getAdminPB();
  } catch {
    return getTokenPB(token);
  }
}

export async function getMyStoryReactionsAction(
  token: string,
  storyIds: string[]
): Promise<Record<string, StoryReaction | null>> {
  const result: Record<string, StoryReaction | null> = {};
  for (const id of storyIds) result[id] = null;
  if (!token || !Array.isArray(storyIds) || storyIds.length === 0) return result;

  let userId: string;
  try {
    const session = await verifySession(token);
    userId = session.userId;
  } catch {
    return result;
  }

  try {
    const pb = await getPb(token);
    const storyFilter = buildOrFilter("story", storyIds.map((s) => String(s)));
    const filter = storyFilter
      ? `user = "${sanitize(userId)}" && (${storyFilter})`
      : `user = "${sanitize(userId)}"`;
    const rows = await pb.collection("story_reactions").getFullList({
      filter,
    });
    for (const row of rows as any[]) {
      const storyId = String(row.story || "");
      const reaction = String(row.reaction || "");
      if (storyId in result && isStoryReaction(reaction)) {
        result[storyId] = reaction;
      }
    }
  } catch {
    // Missing collection or query error: degrade gracefully.
  }

  return result;
}

export async function setStoryReactionAction(
  token: string,
  storyId: string,
  reaction: StoryReaction
): Promise<{ storyId: string; reaction: StoryReaction }> {
  if (!token) throw new Error("Debes iniciar sesión para reaccionar");
  if (!storyId) throw new Error("Historia no válida");
  if (!isStoryReaction(reaction)) throw new Error("Reacción no válida");

  let userId: string;
  try {
    const session = await verifySession(token);
    userId = session.userId;
  } catch (error) {
    if (isInvalidSession(error)) {
      throw new Error("Debes iniciar sesión para reaccionar");
    }
    if (isUnavailableSession(error)) {
      throw new Error("No se pudo validar tu sesión. Intenta de nuevo.");
    }
    throw new Error("Debes iniciar sesión para reaccionar");
  }

  let pb;
  try {
    pb = await getPb(token);
  } catch (error) {
    throw new Error("No se pudo guardar la reacción");
  }

  try {
    const filter = `user = "${sanitize(userId)}" && story = "${sanitize(String(storyId))}"`;
    let existing: any = null;
    try {
      existing = await pb.collection("story_reactions").getFirstListItem(filter);
    } catch {
      existing = null;
    }

    if (existing?.id) {
      await pb.collection("story_reactions").update(existing.id, { reaction });
    } else {
      await pb.collection("story_reactions").create({
        story: String(storyId),
        user: userId,
        reaction,
      });
    }

    return { storyId: String(storyId), reaction };
  } catch (error: any) {
    const status = error?.status ?? error?.response?.status;
    if (status === 404) {
      throw new Error("Las reacciones no están disponibles todavía");
    }
    throw new Error("No se pudo guardar la reacción");
  }
}

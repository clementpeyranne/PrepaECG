"use client";

import { startTransition, useEffect, useRef, useState } from "react";

import { assistantChatAction } from "@/app/actions/assistant";

const STORAGE_KEY = "prepa-ecg-assistant-conversations";

type AssistantConsoleProps = {
  initialSummary: string;
  resources: Array<{
    id: string;
    title: string;
    subject: string;
  }>;
  essays: Array<{
    id: string;
    title: string;
    subject: string;
  }>;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: string[];
  citations?: string[];
};

type Conversation = {
  id: string;
  title: string;
  resourceId: string;
  essayId: string;
  updatedAt: string;
  messages: Message[];
};

function createClientId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildConversationTitle(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Nouvelle conversation";
  }

  return normalized.length > 42 ? `${normalized.slice(0, 39)}...` : normalized;
}

function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function createConversation(initialSummary: string): Conversation {
  return {
    id: createClientId("conversation"),
    title: "Nouvelle conversation",
    resourceId: "",
    essayId: "",
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: createClientId("assistant"),
        role: "assistant",
        content: initialSummary
      }
    ]
  };
}

function normalizeStoredConversations(value: unknown, initialSummary: string) {
  if (!Array.isArray(value)) {
    return [createConversation(initialSummary)];
  }

  const conversations = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const maybeConversation = item as Partial<Conversation>;
      const messages = Array.isArray(maybeConversation.messages)
        ? maybeConversation.messages.filter(
            (message): message is Message =>
              Boolean(
                message &&
                  typeof message === "object" &&
                  typeof message.id === "string" &&
                  (message.role === "user" || message.role === "assistant") &&
                  typeof message.content === "string"
              )
          )
        : [];

      if (!messages.length) {
        return null;
      }

      return {
        id: typeof maybeConversation.id === "string" ? maybeConversation.id : createClientId("conversation"),
        title:
          typeof maybeConversation.title === "string" && maybeConversation.title.trim()
            ? maybeConversation.title
            : "Nouvelle conversation",
        resourceId: typeof maybeConversation.resourceId === "string" ? maybeConversation.resourceId : "",
        essayId: typeof maybeConversation.essayId === "string" ? maybeConversation.essayId : "",
        updatedAt:
          typeof maybeConversation.updatedAt === "string"
            ? maybeConversation.updatedAt
            : new Date().toISOString(),
        messages
      };
    })
    .filter((conversation): conversation is Conversation => Boolean(conversation));

  return conversations.length ? sortConversations(conversations) : [createConversation(initialSummary)];
}

function formatConversationDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function AssistantConsole({
  initialSummary,
  resources,
  essays
}: AssistantConsoleProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0] ?? null;

  useEffect(() => {
    const fallback = [createConversation(initialSummary)];

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const nextConversations = raw ? normalizeStoredConversations(parsed, initialSummary) : fallback;

      setConversations(nextConversations);
      setActiveConversationId(nextConversations[0]?.id ?? "");
    } catch {
      setConversations(fallback);
      setActiveConversationId(fallback[0]?.id ?? "");
    }
  }, [initialSummary]);

  useEffect(() => {
    if (!conversations.length) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversation, conversations]);

  useEffect(() => {
    if (!threadRef.current) {
      return;
    }

    threadRef.current.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [activeConversationId, activeConversation?.messages.length, pendingConversationId]);

  function updateConversation(
    conversationId: string,
    updater: (conversation: Conversation) => Conversation
  ) {
    setConversations((current) =>
      sortConversations(
        current.map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          return updater(conversation);
        })
      )
    );
  }

  function handleCreateConversation() {
    const nextConversation = createConversation(initialSummary);

    setConversations((current) => [nextConversation, ...current]);
    setActiveConversationId(nextConversation.id);
    setPrompt("");
  }

  function updateActiveContext(field: "resourceId" | "essayId", value: string) {
    if (!activeConversation) {
      return;
    }

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  }

  async function handleSubmit() {
    const trimmed = prompt.trim();

    if (!trimmed || !activeConversation || pendingConversationId) {
      return;
    }

    const userMessage: Message = {
      id: createClientId("user"),
      role: "user",
      content: trimmed
    };
    const conversationId = activeConversation.id;
    const resourceId = activeConversation.resourceId;
    const essayId = activeConversation.essayId;
    const now = new Date().toISOString();

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title:
        conversation.messages.some((message) => message.role === "user")
          ? conversation.title
          : buildConversationTitle(trimmed),
      updatedAt: now,
      messages: [...conversation.messages, userMessage]
    }));

    setPrompt("");
    setPendingConversationId(conversationId);

    const formData = new FormData();
    formData.set("prompt", trimmed);
    formData.set(
      "history",
      JSON.stringify(
        [...activeConversation.messages.slice(-5), userMessage].map((message) => ({
          role: message.role,
          content: message.content
        }))
      )
    );
    if (resourceId) {
      formData.set("resourceId", resourceId);
    }
    if (essayId) {
      formData.set("essayId", essayId);
    }

    startTransition(async () => {
      try {
        const reply = await assistantChatAction(formData);

        updateConversation(conversationId, (conversation) => ({
          ...conversation,
          updatedAt: new Date().toISOString(),
          messages: [
            ...conversation.messages,
            {
              id: createClientId("assistant"),
              role: "assistant",
              content: reply.answer,
              actions: reply.actions,
              citations: reply.citations
            }
          ]
        }));
      } catch {
        updateConversation(conversationId, (conversation) => ({
          ...conversation,
          updatedAt: new Date().toISOString(),
          messages: [
            ...conversation.messages,
            {
              id: createClientId("assistant"),
              role: "assistant",
              content:
                "Une erreur est survenue pendant la reponse. Reessaie avec la meme demande ou relie un document pour que je reparte sur une base plus concrete."
            }
          ]
        }));
      } finally {
        setPendingConversationId(null);
      }
    });
  }

  if (!activeConversation) {
    return (
      <div className="rounded-[28px] border border-white/80 bg-white p-6 shadow-panel">
        <p className="text-sm text-pine/75">Chargement du chat...</p>
      </div>
    );
  }

  const canSubmit = prompt.trim().length > 0 && !pendingConversationId;

  return (
    <div className="space-y-5">
      <section className="min-w-0">
        <div className="mx-auto flex h-[74vh] max-w-6xl flex-col overflow-hidden rounded-[34px] border border-white/80 bg-white shadow-panel">
          <div className="border-b border-ink/8 px-6 py-3">
            <div className="mx-auto max-w-4xl">
              <p className="text-xs uppercase tracking-[0.25em] text-pine/55">Conversation</p>
              <h2 className="mt-2 font-display text-2xl text-ink">{activeConversation.title}</h2>
            </div>
          </div>

          <div ref={threadRef} className="flex-1 overflow-y-auto bg-sand/35 px-6 py-6">
            <div className="mx-auto max-w-3xl space-y-5">
              {activeConversation.messages.map((message) => {
                const isAssistant = message.role === "assistant";

                return (
                  <div key={message.id} className={isAssistant ? "mr-auto max-w-2xl" : "ml-auto max-w-2xl"}>
                    <div
                      className={`rounded-[26px] px-5 py-4 text-sm leading-7 shadow-sm ${
                        isAssistant ? "border border-white/80 bg-white text-ink" : "bg-ink text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                );
              })}

              {pendingConversationId === activeConversation.id ? (
                <div className="mr-auto max-w-2xl">
                  <div className="rounded-[26px] border border-white/80 bg-white px-5 py-4 text-sm text-pine/72 shadow-sm">
                    L'assistant ecrit sa reponse...
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-ink/8 bg-white px-6 py-4">
            <div className="mx-auto max-w-3xl">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                placeholder="Pose ta question ici."
                className="w-full rounded-[22px] border border-ink/10 bg-sand px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-pine/45 focus:border-pine"
              />

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="min-w-[140px] rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingConversationId ? "L'assistant reflechit..." : "Envoyer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-panel">
          <div className="border-b border-ink/8 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.25em] text-pine/55">Conversations</p>
              <button
                type="button"
                onClick={handleCreateConversation}
                className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/92"
              >
                Nouvelle conversation
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-2">
            {conversations.map((conversation) => {
              const resource = resources.find((item) => item.id === conversation.resourceId);
              const essay = essays.find((item) => item.id === conversation.essayId);
              const isActive = conversation.id === activeConversation.id;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setActiveConversationId(conversation.id);
                    setPrompt("");
                  }}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-pine/20 bg-mist text-ink"
                      : "border-transparent bg-sand/55 text-pine/82 hover:bg-sand"
                  }`}
                >
                  <p className="line-clamp-2 text-sm font-semibold">{conversation.title}</p>
                  <p className="mt-2 text-xs text-current/65">{formatConversationDate(conversation.updatedAt)}</p>
                  {resource ? (
                    <p className="mt-2 line-clamp-1 text-xs text-current/70">
                      Cours : {resource.subject} - {resource.title}
                    </p>
                  ) : null}
                  {essay ? (
                    <p className="mt-1 line-clamp-1 text-xs text-current/70">
                      Copie : {essay.subject} - {essay.title}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-panel">
          <div className="border-b border-ink/8 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-pine/55">Contexte lie</p>
          </div>
          <div className="grid gap-3 p-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine/80">Cours ou ressource</span>
              <select
                value={activeConversation.resourceId}
                onChange={(event) => updateActiveContext("resourceId", event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                <option value="">Aucune ressource reliee</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.subject} - {resource.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine/80">Copie ou correction</span>
              <select
                value={activeConversation.essayId}
                onChange={(event) => updateActiveContext("essayId", event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                <option value="">Aucune copie reliee</option>
                {essays.map((essay) => (
                  <option key={essay.id} value={essay.id}>
                    {essay.subject} - {essay.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}

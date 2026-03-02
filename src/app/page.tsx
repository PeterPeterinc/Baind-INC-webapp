"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { MessageContent } from "./components/MessageContent";
import { FilesModal } from "./components/FilesModal";

interface Colleague {
  id: string;
  name: string;
  title: string;
  assistantId: string;
  avatar: string;
}

interface Annotation {
  index: number;
  text: string;
  fileId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  authorId: "user" | string;
  content: string;
  pending?: boolean;
  targets?: string[];
  annotations?: Annotation[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  participants: string[];
  threadIds: Record<string, string | undefined>;
  isRunning: boolean;
  lastUpdated: number;
  ownerId: string;
}

interface MentionState {
  start: number;
  query: string;
}

const colleagues: Colleague[] = [
  {
    id: "dennis",
    name: "Dennis",
    title: "Merk specialist",
    assistantId: "local-ui-dennis",
    avatar: "/dennis.png",
  },
  {
    id: "niels",
    name: "Niels",
    title: "Design Expert",
    assistantId: "local-ui-niels",
    avatar: "/niels.png",
  },
];

const colleagueMap = colleagues.reduce(
  (acc, colleague) => {
    acc[colleague.id] = colleague;
    return acc;
  },
  {} as Record<string, Colleague>,
);

const mentionPattern = /@([A-Za-zÀ-ÖØ-öø-ÿ]+)/g;

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const DEFAULT_SESSION_TITLE = "Nieuw gesprek";
const MAX_TITLE_LENGTH = 42;

const formatSessionTitle = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return DEFAULT_SESSION_TITLE;
  return trimmed.length > MAX_TITLE_LENGTH
    ? `${trimmed.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`
    : trimmed;
};

const createSession = (
  colleague: Colleague,
  title: string = DEFAULT_SESSION_TITLE,
): ChatSession => ({
  id: `${colleague.id}-${makeId()}`,
  title,
  messages: [],
  participants: [colleague.id],
  threadIds: {},
  isRunning: false,
  lastUpdated: Date.now(),
  ownerId: colleague.id,
});

const buildInitialData = () => {
  const sessionMap: Record<string, ChatSession> = {};
  const colleagueSessionIndex: Record<string, string[]> = {};
  let firstSessionId: string | null = null;

  colleagues.forEach((colleague) => {
    const session = createSession(colleague);
    sessionMap[session.id] = session;
    colleagueSessionIndex[colleague.id] = [session.id];
    if (!firstSessionId) {
      firstSessionId = session.id;
    }
  });

  return {
    sessionMap,
    colleagueSessionIndex,
    firstSessionId: firstSessionId ?? "",
  };
};

export default function Home() {
  const initialData = useMemo(buildInitialData, []);

  const [selectedColleagueId, setSelectedColleagueId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selected-colleague-id');
      if (saved) return saved;
    }
    return colleagues[0].id;
  });

  const [sessions, setSessions] = useState<Record<string, ChatSession>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-sessions');
      if (saved) {
        try {
          return JSON.parse(saved) as Record<string, ChatSession>;
        } catch (e) {
          console.error('Error loading sessions:', e);
        }
      }
    }
    return initialData.sessionMap;
  });

  const [colleagueSessionIds, setColleagueSessionIds] = useState<Record<string, string[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-session-ids');
      if (saved) {
        try {
          return JSON.parse(saved) as Record<string, string[]>;
        } catch (e) {
          console.error('Error loading session IDs:', e);
        }
      }
    }
    return initialData.colleagueSessionIndex;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('active-session-id');
      if (saved) return saved;
    }
    return initialData.firstSessionId;
  });

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [activeMentions, setActiveMentions] = useState<Colleague[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [filesModalColleague, setFilesModalColleague] = useState<{ id: string; name: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (colleagueMap[selectedColleagueId]) return;

    // Reset persisted state when old colleague ids are still in localStorage.
    setSelectedColleagueId(colleagues[0].id);
    setSessions(initialData.sessionMap);
    setColleagueSessionIds(initialData.colleagueSessionIndex);
    setActiveSessionId(initialData.firstSessionId);
  }, [initialData, selectedColleagueId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const autoResize = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  useEffect(() => {
    requestAnimationFrame(autoResize);
  }, []);

  // Sla chat state op in localStorage wanneer deze verandert
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(sessions).length > 0) {
      localStorage.setItem('chat-sessions', JSON.stringify(sessions));
      localStorage.setItem('chat-session-ids', JSON.stringify(colleagueSessionIds));
      localStorage.setItem('active-session-id', activeSessionId);
      localStorage.setItem('selected-colleague-id', selectedColleagueId);
    }
  }, [sessions, colleagueSessionIds, activeSessionId, selectedColleagueId]);

  const selectedColleague = useMemo(
    () => colleagueMap[selectedColleagueId] ?? colleagues[0],
    [selectedColleagueId],
  );

  const sessionIdsForSelected = colleagueSessionIds[selectedColleague.id] ?? [];
  const sessionsForSelected = useMemo(
    () =>
      sessionIdsForSelected
        .map((sessionId) => sessions[sessionId])
        .filter((session): session is ChatSession => Boolean(session)),
    [sessionIdsForSelected, sessions],
  );

  useEffect(() => {
    if (!sessions[activeSessionId]) {
      const fallbackId =
        sessionIdsForSelected[0] ?? Object.keys(sessions)[0];
      if (fallbackId) {
        setActiveSessionId(fallbackId);
      }
    }
  }, [activeSessionId, sessions, sessionIdsForSelected]);

  const activeSession = sessions[activeSessionId] ?? sessionsForSelected[0];

  // Scroll automatisch naar beneden wanneer messages veranderen
  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  // Clear activeMentions wanneer je van chat of collega wisselt
  useEffect(() => {
    setActiveMentions([]);
  }, [activeSessionId, selectedColleagueId]);

  const mentionOptions = useMemo(() => {
    if (!mentionState) return [];
    const query = mentionState.query.trim().toLowerCase();
    return colleagues.filter((colleague) => {
      if (!query) return true;
      return colleague.name.toLowerCase().startsWith(query);
    });
  }, [mentionState]);

  const isSendDisabled =
    !activeSession || activeSession.isRunning || input.trim().length === 0;

  function updateMentionState(value: string, caretPosition: number | null) {
    const caret = caretPosition ?? value.length;
    const upToCaret = value.slice(0, caret);
    const match = /(?:^|\s)@([A-Za-zÀ-ÖØ-öø-ÿ]*)$/.exec(upToCaret);

    if (match) {
      setMentionState({
        start: caret - match[1].length - 1,
        query: match[1],
      });
      setMentionIndex(0);
    } else {
      setMentionState(null);
    }
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    const { value, selectionStart } = event.target;
    setInput(value);
    updateMentionState(value, selectionStart ?? value.length);
    requestAnimationFrame(autoResize);
  }

  function applyMention(colleague: Colleague) {
    if (!textareaRef.current || !mentionState) return;

    // Voeg collega toe aan active mentions (pills) als deze er nog niet is
    if (!activeMentions.find(c => c.id === colleague.id)) {
      setActiveMentions(prev => [...prev, colleague]);
    }

    // Verwijder de @mention uit de textarea (blijft alleen in pill)
    const caret = textareaRef.current.selectionStart ?? input.length;
    const before = input.slice(0, mentionState.start);
    const after = input.slice(caret);
    const nextValue = `${before}${after}`.trim();

    setInput(nextValue);
    setMentionState(null);
    setMentionIndex(0);

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      const nextCaret = before.length;
      textareaRef.current.setSelectionRange(nextCaret, nextCaret);
      autoResize();
    });
  }

  function removeMention(colleague: Colleague) {
    setActiveMentions(prev => prev.filter(c => c.id !== colleague.id));
    // @naam staat niet meer in textarea, dus hoeven we niets te verwijderen
  }

  function handleTextareaKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (mentionState && mentionOptions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionIndex((prev) => (prev + 1) % mentionOptions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionIndex((prev) =>
          (prev - 1 + mentionOptions.length) % mentionOptions.length,
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        applyMention(mentionOptions[mentionIndex]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMentionState(null);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  function handleTextareaSelect(
    event: React.SyntheticEvent<HTMLTextAreaElement>,
  ) {
    const target = event.currentTarget;
    updateMentionState(target.value, target.selectionStart ?? target.value.length);
  }

  function createNewSessionForColleague(colleagueId: string): ChatSession | null {
    const colleague = colleagueMap[colleagueId];
    if (!colleague) return null;
    const count = (colleagueSessionIds[colleagueId]?.length ?? 0) + 1;
    const title = `Chat ${count}`;
    const newSession = createSession(colleague, title);

    setSessions((prev) => ({
      ...prev,
      [newSession.id]: newSession,
    }));

    setColleagueSessionIds((prev) => {
      const existing = prev[colleagueId] ?? [];
      return {
        ...prev,
        [colleagueId]: [newSession.id, ...existing],
      };
    });

    return newSession;
  }

  function handleColleagueChange(colleagueId: string) {
    setSelectedColleagueId(colleagueId);

    const existingSessions = colleagueSessionIds[colleagueId] ?? [];
    if (existingSessions.length > 0) {
      setActiveSessionId(existingSessions[0]);
    } else {
      const newSession = createNewSessionForColleague(colleagueId);
      if (newSession) {
        setActiveSessionId(newSession.id);
      }
    }

    setInput("");
    setMentionState(null);
    setMentionIndex(0);
    setError(null);
    requestAnimationFrame(autoResize);
  }

  function handleSessionSelect(sessionId: string) {
    setActiveSessionId(sessionId);
    setInput("");
    setMentionState(null);
    setMentionIndex(0);
    setError(null);
    requestAnimationFrame(autoResize);
  }

  function handleSessionClose(sessionId: string) {
    const session = sessions[sessionId];
    if (!session) return;

    const ownerId = session.ownerId;
    const owner = colleagueMap[ownerId];
    const existingList = (colleagueSessionIds[ownerId] ?? []).filter(
      (id) => id !== sessionId,
    );

    const needsReplacement = existingList.length === 0 && Boolean(owner);
    const newSession = needsReplacement && owner ? createSession(owner) : null;

    setSessions((prev) => {
      if (!prev[sessionId] && !newSession) return prev;
      const { [sessionId]: _removed, ...rest } = prev;
      void _removed;
      if (newSession) {
        rest[newSession.id] = newSession;
      }
      return rest;
    });

    setColleagueSessionIds((prev) => ({
      ...prev,
      [ownerId]: newSession
        ? [newSession.id, ...existingList]
        : existingList,
    }));

    if (sessionId === activeSessionId) {
      const nextActiveId =
        newSession?.id ?? (existingList.length > 0 ? existingList[0] : undefined);
      if (nextActiveId) {
        setActiveSessionId(nextActiveId);
      }
    }

    if (ownerId === selectedColleagueId) {
      setInput("");
      setActiveMentions([]);
      setMentionState(null);
      setMentionIndex(0);
      setError(null);
      requestAnimationFrame(autoResize);
    }
  }

  function handleNewChat() {
    const newSession = createNewSessionForColleague(selectedColleague.id);
    if (newSession) {
      setActiveSessionId(newSession.id);
    }
    setInput("");
    setActiveMentions([]);
    setMentionState(null);
    setMentionIndex(0);
    setError(null);
    requestAnimationFrame(autoResize);
  }


  async function submitMessage() {
    if (!activeSession) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    
    // Check EERST of er active mentions (pills) zijn
    let targetIds: string[];
    
    if (activeMentions.length > 0) {
      // Gebruik de active mentions (pills) als target
      targetIds = activeMentions.map(c => c.id);
    } else {
      // Anders, check voor @mentions in de tekst (fallback)
      const mentionMatches = Array.from(trimmed.matchAll(mentionPattern));
      const mentionNames = mentionMatches.map((match) => match[1].toLowerCase());

      const mentionedColleagues = colleagues.filter((colleague) =>
        mentionNames.includes(colleague.name.toLowerCase()),
      );

      const hasMentions = mentionedColleagues.length > 0;

      targetIds = hasMentions
        ? Array.from(new Set(mentionedColleagues.map((colleague) => colleague.id)))
        : [selectedColleague.id];
    }

    const sessionId = activeSession.id;
    const conversationHistory = activeSession.messages
      .filter((message) => !message.pending)
      .slice(-12)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    const userMessage: Message = {
      id: makeId(),
      role: "user",
      authorId: "user",
      content: trimmed,
      targets: targetIds,
    };

    const pendingEntries = targetIds
      .map((targetId) => colleagueMap[targetId])
      .filter((colleague): colleague is Colleague => Boolean(colleague))
      .map((colleague) => ({
        colleague,
        pendingId: `pending-${colleague.id}-${makeId()}`,
      }));

    const updatedParticipants = Array.from(
      new Set([...activeSession.participants, ...targetIds]),
    );

    setSessions((prev) => {
      const current = prev[sessionId] ?? activeSession;
      const title =
        current.messages.length === 0 ? formatSessionTitle(trimmed) : current.title;

      return {
        ...prev,
        [sessionId]: {
          ...current,
          title,
          participants: updatedParticipants,
          isRunning: pendingEntries.length > 0,
          lastUpdated: Date.now(),
          messages: [
            ...current.messages,
            userMessage,
            ...pendingEntries.map(({ colleague, pendingId }) => ({
              id: pendingId,
              role: "assistant" as const,
              authorId: colleague.id,
              pending: true,
              content: `${colleague.name} is aan het nadenken...`,
            })),
          ],
        },
      };
    });

    setColleagueSessionIds((prev) => {
      const next = { ...prev };
      const existing = next[selectedColleague.id] ?? [];
      const filtered = existing.filter((id) => id !== sessionId);
      next[selectedColleague.id] = [sessionId, ...filtered];
      return next;
    });

    setInput("");
    setMentionState(null);
    setMentionIndex(0);
    setError(null);
    requestAnimationFrame(autoResize);

    await Promise.all(
      pendingEntries.map(async ({ colleague, pendingId }) => {
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              colleagueId: colleague.id,
              message: trimmed,
              conversationHistory,
            }),
          });

          const data = (await response.json()) as {
            answer?: string;
            error?: string;
          };

          if (!response.ok || !data.answer) {
            throw new Error(data.error ?? "Geen antwoord ontvangen van Mistral.");
          }

          setSessions((prev) => {
            const current = prev[sessionId];
            if (!current) return prev;

            const updatedMessages = current.messages.map((message) =>
              message.id === pendingId
                ? {
                    id: makeId(),
                    role: "assistant" as const,
                    authorId: colleague.id,
                    content: data.answer ?? "",
                  }
                : message,
            );

            const stillPending = updatedMessages.some((message) => message.pending);

            return {
              ...prev,
              [sessionId]: {
                ...current,
                messages: updatedMessages,
                isRunning: stillPending,
                lastUpdated: Date.now(),
              },
            };
          });
        } catch (requestError) {
          setSessions((prev) => {
            const current = prev[sessionId];
            if (!current) return prev;

            const updatedMessages = current.messages.map((message) =>
              message.id === pendingId
                ? {
                    id: makeId(),
                    role: "assistant" as const,
                    authorId: colleague.id,
                    content:
                      `${colleague.name} kon niet antwoorden via Mistral. ` +
                      "Controleer API-toegang en probeer opnieuw.",
                  }
                : message,
            );

            const stillPending = updatedMessages.some((message) => message.pending);

            return {
              ...prev,
              [sessionId]: {
                ...current,
                messages: updatedMessages,
                isRunning: stillPending,
                lastUpdated: Date.now(),
              },
            };
          });

          const message =
            requestError instanceof Error
              ? requestError.message
              : "Onbekende fout tijdens chat.";
          setError(message);
        }
      }),
    );
  }

  async function handleLogout() {
    // In UI-only mode, "uitloggen" reset alleen lokale UI-state.
    localStorage.removeItem("chat-sessions");
    localStorage.removeItem("chat-session-ids");
    localStorage.removeItem("active-session-id");
    localStorage.removeItem("selected-colleague-id");
    window.location.href = "/";
  }

  function handleOpenFilesModal(colleagueId: string, colleagueName: string) {
    setFilesModalColleague({ id: colleagueId, name: colleagueName });
    setFilesModalOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage();
  }

  async function handleCopyMessage(
    messageId: string,
    content: string,
  ) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <div className="flex h-screen bg-[--background] text-[--foreground]">
      <aside className="hidden h-screen w-80 shrink-0 flex-col border-r border-[#e4d8c7] bg-white/80 px-6 py-8 backdrop-blur xl:flex overflow-y-auto">
        <div className="space-y-6">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#f9c646] px-4 py-3 text-sm font-semibold text-[#1f1a12] shadow-sm transition hover:bg-[#f8b820]"
          >
            <span className="text-lg">＋</span>
            Nieuwe chat
          </button>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#a3927a]">
              Collega&apos;s
            </p>
            <ul className="space-y-2">
              {colleagues.map((colleague) => {
                const isSelected = colleague.id === selectedColleague.id;
                return (
                  <li key={colleague.id}>
                    <button
                      type="button"
                      onClick={() => handleColleagueChange(colleague.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-[#f3d89f] bg-[#fff8e9]"
                          : "border-transparent hover:border-[#f0e3cf] hover:bg-white"
                      }`}
                    >
                      <Image
                        src={colleague.avatar}
                        alt={colleague.name}
                        width={48}
                        height={48}
                        className={`h-12 w-12 rounded-full ${
                          colleague.id === "hnab"
                            ? "object-contain bg-white p-2"
                            : "object-cover"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#1f1a12]">
                          {colleague.name}
                        </p>
                        <p className="text-xs text-[#8a7b64]">{colleague.title}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <Link
            href="/storage"
            className="flex items-center justify-center rounded-2xl border border-[#e4d8c7] bg-white px-4 py-3 text-sm font-medium text-[#1f1a12] transition hover:border-[#dabb7b] hover:bg-[#fff4db]"
          >
            <Image
              src="/hn-ab-logo.svg"
              alt="HN-AB logo"
              width={120}
              height={30}
              className="h-8"
              priority
            />
          </Link>
          
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e4d8c7] bg-white px-4 py-3 text-sm font-medium text-[#1f1a12] transition hover:border-[#dabb7b] hover:bg-[#fff4db]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Uitloggen
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col h-screen overflow-hidden">
        <header className="border-b border-[#e4d8c7] bg-white/70 px-6 py-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#a3927a]">
                Digitale collega
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[#1f1a12]">
                {selectedColleague.name}
              </h1>
              <p className="text-sm text-[#8a7b64]">{selectedColleague.title}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Image
                src={selectedColleague.avatar}
                alt={selectedColleague.name}
                width={72}
                height={72}
                className={`hidden h-[72px] w-[72px] rounded-full border-4 border-white shadow-md md:block ${
                  selectedColleague.id === "hnab"
                    ? "object-contain bg-white p-2"
                    : "object-cover"
                }`}
              />
              <button
                type="button"
                onClick={() => handleOpenFilesModal(selectedColleague.id, selectedColleague.name)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4d8c7] bg-white text-[#ffbf02] transition hover:border-[#dabb7b] hover:bg-[#fff4db]"
                title={`View files for ${selectedColleague.name}`}
              >
                <FontAwesomeIcon icon={faFolder} className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="mt-6 flex flex-wrap gap-3">
            {sessionsForSelected.map((session) => {
              const isActive = session.id === activeSession?.id;
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => handleSessionSelect(session.id)}
                    className={`flex flex-1 items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-sm transition ${
                      isActive
                        ? "border-[#f3d89f] bg-[#fff4db] text-[#1f1a12]"
                        : "border-transparent bg-white text-[#8a7b64] hover:border-[#f0e3cf]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-semibold">{session.title}</span>
                      <div className="flex -space-x-2">
                        {session.participants.slice(0, 3).map((participantId) => {
                          const participant = colleagueMap[participantId];
                          if (!participant) return null;
                          return (
                            <Image
                              key={`${session.id}-${participant.id}`}
                              src={participant.avatar}
                              alt={participant.name}
                              width={28}
                              height={28}
                              className={`h-7 w-7 rounded-full border-2 border-white ${
                                participant.id === "hnab"
                                  ? "object-contain bg-white p-1"
                                  : "object-cover"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSessionClose(session.id);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-base font-semibold transition ${
                      isActive
                        ? "border-[#f3d89f] bg-[#fff4db] text-[#b57c14] hover:bg-[#ffe7b0]"
                        : "border-transparent bg-white text-[#b6a58a] hover:border-[#e4d8c7] hover:text-[#6b5b46]"
                    }`}
                  >
                    <span aria-hidden>×</span>
                    <span className="sr-only">
                      Sluit {session.title}
                    </span>
                  </button>
                </div>
              );
            })}
          </nav>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          {activeSession && activeSession.messages.length ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-10">
                {activeSession.messages.map((message) => {
                  const isUser = message.role === "user";
                  const author =
                    message.authorId !== "user"
                      ? colleagueMap[message.authorId]
                      : undefined;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && author ? (
                        <Image
                          src={author.avatar}
                          alt={author.name}
                          width={40}
                          height={40}
                          className={`h-10 w-10 shrink-0 rounded-full border-2 border-white shadow ${
                            author.id === "hnab"
                              ? "object-contain bg-white p-1.5"
                              : "object-cover"
                          }`}
                        />
                      ) : null}
                      <div className="flex flex-col gap-2">
                        <div
                          className={`max-w-xl rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
                            isUser
                              ? "bg-[#1f1a12] text-white"
                              : "border border-[#efe5d5] bg-white text-[#1f1a12]"
                          } ${message.pending ? "opacity-70" : ""}`}
                        >
                          {author ? (
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b79b6b]">
                              {author.name}
                            </p>
                          ) : null}
                          <MessageContent
                            content={message.content}
                            isUser={isUser}
                          />
                        {isUser && message.targets && message.targets.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.targets.map((targetId) => {
                              const target = colleagueMap[targetId];
                              if (!target || target.id === selectedColleague.id) {
                                return null;
                              }
                              return (
                                <span
                                  key={`${message.id}-${target.id}`}
                                  className="flex items-center gap-2 rounded-full bg-[#f2e7d4] px-3 py-1 text-xs font-medium text-[#6b5b46]"
                                >
                                  <Image
                                    src={target.avatar}
                                    alt={target.name}
                                    width={20}
                                    height={20}
                                    className={`h-5 w-5 rounded-full ${
                                      target.id === "hnab"
                                        ? "object-contain bg-white p-0.5"
                                        : "object-cover"
                                    }`}
                                  />
                                  @{target.name}
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                        </div>

                        {/* Copy button */}
                        <div className="flex items-center gap-4">
                          {!isUser ? (
                            <button
                              type="button"
                              onClick={() => void handleCopyMessage(message.id, message.content)}
                              className="flex items-center gap-1.5 self-start text-xs text-[#a3927a] transition hover:text-[#6b5b46]"
                              title={copiedMessageId === message.id ? "Gekopieerd!" : "Kopieer tekst"}
                            >
                              {copiedMessageId === message.id ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-3.5 w-3.5 text-green-600"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-3.5 w-3.5"
                                >
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              )}
                              <span className="font-medium">
                                {copiedMessageId === message.id ? "Gekopieerd!" : "Kopieer"}
                              </span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {isUser ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1a12] text-xs font-semibold uppercase text-white">
                          Jij
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
              <Image
                src="/baindlogo.svg"
                alt="HN-AB glimlach"
                width={80}
                height={80}
                className="h-20 w-20"
                priority
              />
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold text-[#1f1a12]">
                  Waar kan ik je mee helpen?
                </h2>
                <p className="mx-auto max-w-lg text-sm text-[#8a7b64]">
                  Start een gesprek met {selectedColleague.name}.
                </p>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative border-t border-[#e4d8c7] bg-white/90 px-6 py-6 backdrop-blur"
        >
          {activeMentions.length > 0 ? (
            <div className="mb-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#a3927a]">
                Actieve collega&apos;s:
              </p>
              <div className="flex flex-wrap gap-2">
                {activeMentions.map((colleague) => (
                  <button
                    key={colleague.id}
                    type="button"
                    onClick={() => removeMention(colleague)}
                    className="group flex items-center gap-2 rounded-full bg-[#f2e7d4] px-3 py-1.5 text-xs font-medium text-[#6b5b46] transition hover:bg-[#e8d7bd] hover:text-[#4a3d2e]"
                    title={`Klik om ${colleague.name} te verwijderen`}
                  >
                    <Image
                      src={colleague.avatar}
                      alt={colleague.name}
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full border border-[#dabb7b]"
                    />
                    <span>@{colleague.name}</span>
                    <span className="text-sm opacity-0 transition-opacity group-hover:opacity-100">
                      ×
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {error ? (
            <p className="mb-3 text-xs font-medium text-[#a83b2d]">{error}</p>
          ) : null}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleTextareaKeyDown}
                onSelect={handleTextareaSelect}
                placeholder={`Typ je bericht voor ${selectedColleague.name}... (gebruik @ om collega's te betrekken)`}
                rows={1}
                className="w-full resize-none rounded-2xl border border-[#e4d8c7] bg-white px-5 py-4 text-sm text-[#1f1a12] shadow-sm outline-none transition focus:border-[#dabb7b] focus:ring-2 focus:ring-[#f9c646]/40"
              />

              {mentionState && mentionOptions.length > 0 ? (
                <div className="absolute bottom-[110%] left-0 z-10 w-64 rounded-2xl border border-[#e4d8c7] bg-white/95 shadow-xl backdrop-blur">
                  <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-[#a3927a]">
                    Collega&apos;s
                  </p>
                  <ul className="py-2">
                    {mentionOptions.map((option, index) => {
                      const isActive = index === mentionIndex;
                      return (
                        <li key={option.id}>
                          <button
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              applyMention(option);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition ${
                              isActive ? "bg-[#fff3d4]" : "hover:bg-[#fff8e9]"
                            }`}
                          >
                            <Image
                              src={option.avatar}
                              alt={option.name}
                              width={32}
                              height={32}
                              className={`h-8 w-8 rounded-full ${
                                option.id === "hnab"
                                  ? "object-contain bg-white p-1"
                                  : "object-cover"
                              }`}
                            />
                            <div>
                              <p className="font-semibold text-[#1f1a12]">
                                {option.name}
                              </p>
                              <p className="text-xs text-[#8a7b64]">
                                {option.title}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSendDisabled}
              className="flex h-12 min-w-[120px] items-center justify-center gap-2 rounded-2xl bg-[#1f1a12] px-5 text-sm font-semibold text-white transition hover:bg-[#433b31] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Verstuur
              <span aria-hidden className="text-lg">
                ↗
              </span>
            </button>
          </div>
        </form>
      </main>

      {filesModalOpen && filesModalColleague && (
        <FilesModal
          isOpen={filesModalOpen}
          colleagueId={filesModalColleague.id}
          colleagueName={filesModalColleague.name}
          onClose={() => setFilesModalOpen(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

interface Collaborator {
  id: string;
  user_id: string;
  role: "viewer" | "editor";
  invited_at: string;
  email: string;
}

interface CollaboratorsListProps {
  deckId: string;
  isOwner: boolean;
  onUpdate?: () => void;
}

export function CollaboratorsList({ deckId, isOwner, onUpdate }: CollaboratorsListProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"viewer" | "editor">("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCollaborators = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/decks/${deckId}/collaborators`);
      if (!response.ok) {
        throw new Error("無法獲取合作者列表");
      }
      const data = await response.json();
      setCollaborators(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, [deckId]);

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "添加失敗");
      }

      setNewEmail("");
      setNewRole("viewer");
      setShowAddForm(false);
      fetchCollaborators();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("確定要移除此合作者嗎？")) return;

    try {
      const response = await fetch(`/api/decks/${deckId}/collaborators?userId=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("移除失敗");
      }

      fetchCollaborators();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">合作者</h3>
        {isOwner && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1 text-sm font-bold rounded-full bg-mint text-white hover:opacity-80"
          >
            {showAddForm ? "取消" : "+ 添加合作者"}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-coral-bg text-coral rounded text-sm font-bold">
          ❌ {error}
        </div>
      )}

      {showAddForm && isOwner && (
        <form onSubmit={handleAddCollaborator} className="p-3 border-2 border-ink rounded-lg space-y-3">
          <input
            type="email"
            placeholder="輸入電郵地址"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-3 py-2 border-2 border-ink rounded font-bold"
            disabled={isSubmitting}
          />

          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "viewer" | "editor")}
            className="w-full px-3 py-2 border-2 border-ink rounded font-bold"
            disabled={isSubmitting}
          >
            <option value="viewer">檢視者（只讀）</option>
            <option value="editor">編輯者（可編輯）</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting || !newEmail.trim()}
            className="w-full px-3 py-2 bg-ink text-white font-bold rounded-full disabled:opacity-50"
          >
            {isSubmitting ? "添加中..." : "添加"}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-center text-sm text-ink-soft">加載中...</div>
      ) : collaborators.length === 0 ? (
        <div className="text-center text-sm text-ink-soft">還沒有其他合作者</div>
      ) : (
        <ul className="space-y-2">
          {collaborators.map((collab) => (
            <li
              key={collab.id}
              className="flex items-center justify-between p-3 border-2 border-paper-line rounded-lg bg-paper"
            >
              <div className="flex-1">
                <div className="font-bold text-sm">{collab.email}</div>
                <div className="text-xs text-ink-soft">
                  {collab.role === "viewer" ? "檢視者" : "編輯者"}
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRemove(collab.user_id)}
                  className="px-2 py-1 text-xs font-bold text-coral hover:bg-coral-bg rounded"
                >
                  移除
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

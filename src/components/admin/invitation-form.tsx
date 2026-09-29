"use client";

import { useActionState } from "react";

import {
  createTeacherInvitationAction,
  type InvitationActionState
} from "@/app/(admin)/admin/actions";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";

const initialState: InvitationActionState = { ok: false, message: "", link: "" };

export function AdminInvitationForm({ classes }: { classes: Array<{ id: string; name: string }> }) {
  const [state, action] = useActionState(createTeacherInvitationAction, initialState);

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
      <label>
        <span className="mb-2 block text-sm font-medium text-pine">Email du professeur</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none focus:border-pine"
        />
      </label>
      <label>
        <span className="mb-2 block text-sm font-medium text-pine">Etablissement</span>
        <select name="classId" required className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm">
          {classes.map((prepClass) => <option key={prepClass.id} value={prepClass.id}>{prepClass.name}</option>)}
        </select>
      </label>
      <PendingSubmitButton
        label="Creer l'invitation"
        pendingLabel="Creation..."
        disabled={classes.length === 0}
        className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand disabled:opacity-50"
      />
      {state.message ? (
        <div className={`lg:col-span-3 rounded-2xl p-4 text-sm ${state.ok ? "bg-moss/10 text-pine" : "bg-clay/10 text-clay"}`}>
          <p>{state.message}</p>
          {state.link ? (
            <div className="mt-3 break-all rounded-xl bg-white/70 p-3 font-mono text-xs text-ink">
              {state.link}
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

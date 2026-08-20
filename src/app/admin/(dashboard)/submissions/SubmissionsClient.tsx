"use client";

import { ActionError, useAdminAction } from "@/lib/useAdminAction";
import type { Database } from "@/types/database.types";

type Submission = Database["public"]["Tables"]["music_submissions"]["Row"] & {
  bookings: { artists: { artist_name: string } | null } | null;
};

const STATUSES = ["pending", "submitted", "reviewed", "approved", "needs_revision"];

export default function SubmissionsClient({ submissions }: { submissions: Submission[] }) {
  const { run, json, error } = useAdminAction();

  const updateStatus = (id: string, submission_status: string) =>
    run(`/api/admin/submissions/${id}`, json({ submission_status }));

  return (
    <div className="space-y-3">
      <ActionError message={error} />
      {submissions.map((s) => (
        <div key={s.id} className="card p-4 text-sm space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{s.song_title}</p>
              <p className="text-neutral-500">{s.bookings?.artists?.artist_name} · {s.artist_name}</p>
            </div>
            <select
              value={s.submission_status}
              onChange={(e) => updateStatus(s.id, e.target.value)}
              className="input w-auto"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          {s.audio_file_url && <audio controls src={s.audio_file_url} className="w-full" />}
          {s.lyrics && <p className="text-neutral-400 whitespace-pre-wrap text-xs mt-2">{s.lyrics}</p>}
          {s.explicit_content && <span className="text-xs text-red-400">Explicit</span>}
        </div>
      ))}
      {!submissions.length && <p className="text-neutral-500 text-sm">No submissions yet.</p>}
    </div>
  );
}

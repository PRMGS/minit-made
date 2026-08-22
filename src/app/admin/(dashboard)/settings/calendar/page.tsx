import { requireAdmin } from "@/lib/auth";
import { getIntegration } from "@/lib/googleCalendar";
import CalendarSettingsClient from "./CalendarSettingsClient";

// calendar_integrations has RLS enabled with zero policies (service-role
// only), so its connection status is read via the admin client here rather
// than ctx.supabase — the admin session client can't reach this table at all.
export default async function AdminCalendarSettingsPage() {
  await requireAdmin();
  const integration = await getIntegration();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>
      <CalendarSettingsClient
        connected={!!integration}
        connectedBy={integration?.connected_by ?? null}
        connectedAt={integration?.connected_at ?? null}
        calendarId={integration?.calendar_id ?? null}
      />
    </div>
  );
}

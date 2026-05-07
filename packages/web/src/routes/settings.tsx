/**
 * Settings page — read-only display of user data.
 *
 * Source: 07_parallel_build_plans.md §1.14, 05_design_proposal.md §4.7
 *
 * Displays: PROFILE / DIETARY / FOOD PREFERENCES / TRAINING SCHEDULE
 * All read-only. "Edit in app" links for each section.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CarbTierBadge } from "@/components/shared/carb-tier-badge";
import dayjs from "dayjs";
import type { SettingsData } from "@/lib/queries/settings-data";

export const Route = createFileRoute("/settings")({
  loader: async () => {
    try {
      const { fetchSettingsData } = await import("@/lib/queries/settings-data");
      return await fetchSettingsData();
    } catch {
      return null;
    }
  },
  component: SettingsPage,
});

function SettingsPage() {
  const data = Route.useLoaderData() as SettingsData | null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <h1 className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] font-bold uppercase tracking-wider">
        Settings
      </h1>

      {/* PROFILE */}
      <SettingsSection title="Profile" data={data} editLabel="Edit in app">
        {data?.profile ? (
          <dl className="space-y-2 font-[var(--font-apercu)] text-[var(--font-size-body)]">
            <DataRow label="Email" value={data.profile.email ?? "—"} />
            <DataRow
              label="Height"
              value={
                data.profile.height_feet && data.profile.height_inches
                  ? `${data.profile.height_feet}'${data.profile.height_inches}"`
                  : "—"
              }
            />
            <DataRow
              label="Weight"
              value={
                data.profile.weight_pounds ? `${data.profile.weight_pounds} lbs` : "—"
              }
            />
            <DataRow
              label="Cycling FTP"
              value={
                data.profile.cycling_ftp_watts
                  ? `${data.profile.cycling_ftp_watts}W`
                  : "—"
              }
            />
            <DataRow
              label="Swim CSS"
              value={
                data.profile.swimming_css_seconds_per_100m
                  ? formatCss(data.profile.swimming_css_seconds_per_100m)
                  : "—"
              }
            />
          </dl>
        ) : (
          <NotConfigured message="No profile data. Sign in with your Mealvana email." />
        )}
      </SettingsSection>

      {/* DIETARY */}
      <SettingsSection title="Dietary" data={data} editLabel="Edit in app">
        {data?.dietary ? (
          <dl className="space-y-2 font-[var(--font-apercu)] text-[var(--font-size-body)]">
            <DataRow
              label="Diet"
              value={data.dietary.dietary_preference ?? "Not set"}
            />
            <div>
              <dt className="text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground mb-1">
                Allergies
              </dt>
              <dd className="flex flex-wrap gap-1">
                {data.dietary.allergies.length > 0
                  ? data.dietary.allergies.map((a) => (
                      <Badge key={a} variant="destructive">
                        {a}
                      </Badge>
                    ))
                  : <span className="text-muted-foreground">None</span>}
              </dd>
            </div>
            <DataRow
              label="Gut training"
              value={data.dietary.gut_training_level ?? "—"}
            />
            <DataRow
              label="GI sensitivity"
              value={data.dietary.gi_sensitivity ?? "—"}
            />
          </dl>
        ) : (
          <NotConfigured message="No dietary data loaded." />
        )}
      </SettingsSection>

      {/* FOOD PREFERENCES */}
      <SettingsSection title="Food Preferences" data={data} editLabel="Edit in app">
        <div className="space-y-4">
          <div>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground mb-2">
              Liked ({data?.food_preferences.liked.length ?? 0})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data?.food_preferences.liked.slice(0, 12).map((f) => (
                <Badge key={f.food_name} variant="accent">
                  {f.food_name} ({f.preference_level}/4)
                </Badge>
              ))}
              {!data?.food_preferences.liked.length && (
                <span className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
                  None set
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground mb-2">
              Disliked ({data?.food_preferences.disliked.length ?? 0})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data?.food_preferences.disliked.slice(0, 8).map((f) => (
                <Badge key={f.food_name} variant="secondary">
                  {f.food_name} ({f.preference_level}/4)
                </Badge>
              ))}
              {!data?.food_preferences.disliked.length && (
                <span className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
                  None set
                </span>
              )}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* TRAINING SCHEDULE — next 7 days */}
      <SettingsSection title="Upcoming Training" data={data} editLabel="Edit in app">
        {data?.upcoming_activities && data.upcoming_activities.length > 0 ? (
          <ul className="space-y-2">
            {data.upcoming_activities.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground w-20 shrink-0">
                  {dayjs(a.scheduled_date_time).format("ddd MMM D")}
                </span>
                <div className="min-w-0">
                  <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] truncate">
                    {a.title ?? a.activity_type}
                    {a.distance_miles ? ` · ${a.distance_miles}mi` : ""}
                    {a.duration_minutes ? ` · ${a.duration_minutes}min` : ""}
                  </p>
                  {a.intensity_level && (
                    <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground capitalize">
                      {a.intensity_level}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
            No activities scheduled for the next 7 days.
          </p>
        )}
      </SettingsSection>

      {/* MACRO TARGETS — next 7 days */}
      <SettingsSection title="Macro Targets (Next 7 Days)" data={data} editLabel={null}>
        {data?.current_week_targets && data.current_week_targets.length > 0 ? (
          <div className="space-y-2">
            {data.current_week_targets.map((t) => (
              <div key={t.target_date} className="flex items-center gap-3">
                <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground w-20 shrink-0">
                  {dayjs(t.target_date).format("ddd MMM D")}
                </span>
                <CarbTierBadge carbG={t.carb_g} />
                <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground">
                  {t.prot_g}g P · {t.fat_g}g F
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
            No macro targets computed for this period. Open the mobile app to generate them.
          </p>
        )}
      </SettingsSection>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SettingsSection({
  title,
  data: _data,
  editLabel,
  children,
}: {
  title: string;
  data: SettingsData | null;
  editLabel: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-[var(--font-compadre)] text-[var(--font-size-body)] uppercase tracking-wider">
          {title}
        </h2>
        {editLabel && (
          <Button variant="ghost" size="sm">
            {editLabel}
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-5 pb-5">{children}</CardContent>
      </Card>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-28 shrink-0 font-[var(--font-apercu)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="font-[var(--font-apercu)] text-[var(--font-size-body)]">{value}</dd>
    </div>
  );
}

function NotConfigured({ message }: { message: string }) {
  return (
    <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
      {message}
    </p>
  );
}

function formatCss(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}/100m`;
}

// React import for JSX
import type React from "react";

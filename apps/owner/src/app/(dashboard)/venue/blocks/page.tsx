"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { ResourcePills } from "@/components/page-header";
import { useVenue } from "@/components/venue-provider";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { AvailabilityException, ownerApi } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";

const typeLabel: Record<string, string> = {
  BLOCKED: "Blocked",
  CLOSED: "Closed",
  SPECIAL_HOURS: "Special hours",
};

export default function BlocksPage() {
  const { venue } = useVenue();
  const [resourceId, setResourceId] = useState("");
  const [items, setItems] = useState<AvailabilityException[]>([]);
  const [form, setForm] = useState({
    type: "BLOCKED",
    startsAt: "",
    endsAt: "",
    reason: "",
    opensAt: "08:00",
    closesAt: "23:00",
  });

  async function load(id: string) {
    setItems(await ownerApi.exceptions(id));
  }

  useEffect(() => {
    if (!venue?.resources[0]) return;
    setResourceId(venue.resources[0].id);
    void load(venue.resources[0].id);
  }, [venue?.id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await ownerApi.createException(resourceId, {
      type: form.type,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      reason: form.reason || null,
      opensAt: form.type === "SPECIAL_HOURS" ? form.opensAt : null,
      closesAt: form.type === "SPECIAL_HOURS" ? form.closesAt : null,
    });
    setForm({ type: "BLOCKED", startsAt: "", endsAt: "", reason: "", opensAt: "08:00", closesAt: "23:00" });
    await load(resourceId);
    toast.success("Saved");
  }

  if (!venue) return null;
  if (venue.resources.length === 0) {
    return (
      <EmptyState
        title="Add your first field/court"
        body="Blocked time, holidays, and special hours are set per resource."
        href="/venue/resources"
        action="Add a resource"
      />
    );
  }

  return (
    <div className="space-y-4">
      <ResourcePills
        items={venue.resources}
        value={resourceId}
        onChange={(id) => {
          setResourceId(id);
          void load(id);
        }}
      />
      {venue.resources.length === 1 && (
        <div className="text-sm font-black text-slate-700">{venue.resources[0].name}</div>
      )}
      {items.length === 0 && (
        <Card>
          <p className="text-sm font-medium text-slate-500">No blocked periods yet. Add maintenance, holidays, or special hours below.</p>
        </Card>
      )}
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={`rounded-lg px-2.5 py-1 text-[11px] font-black uppercase ${
                item.type === "BLOCKED"
                  ? "bg-red-50 text-red-700"
                  : item.type === "CLOSED"
                    ? "bg-slate-100 text-slate-600"
                    : "bg-brand-light text-brand-700"
              }`}
            >
              {typeLabel[item.type] ?? item.type}
            </span>
            <div>
              <div className="text-lg font-black text-slate-900">
                {formatDate(item.startsAt)} {formatTime(item.startsAt)} – {formatTime(item.endsAt)}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {item.reason || "No reason"}
                {item.opensAt && item.closesAt ? ` · Opens ${item.opensAt}–${item.closesAt}` : ""}
              </div>
            </div>
          </div>
          <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={async () => { await ownerApi.deleteException(item.id); await load(resourceId); }}>
            Remove
          </Button>
        </Card>
      ))}
      <Card>
        <h2 className="text-lg font-black text-slate-900">Block time</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">Maintenance, holidays, or one-off hours. These hide slots from customers.</p>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="BLOCKED">Block time / maintenance</option>
              <option value="CLOSED">Closed / holiday</option>
              <option value="SPECIAL_HOURS">Special hours</option>
            </Select>
          </Field>
          <Field label="Reason"><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Maintenance" /></Field>
          <Field label="Starts"><Input type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></Field>
          <Field label="Ends"><Input type="datetime-local" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
          {form.type === "SPECIAL_HOURS" && (
            <>
              <Field label="Opens at"><Input value={form.opensAt} onChange={(e) => setForm({ ...form, opensAt: e.target.value })} /></Field>
              <Field label="Closes at"><Input value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} /></Field>
            </>
          )}
          <div className="sm:col-span-2">
            <Button>Add block</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

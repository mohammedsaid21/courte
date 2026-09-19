"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { ResourcePills } from "@/components/page-header";
import { useVenue } from "@/components/venue-provider";
import { Button, Card, Field, Input } from "@/components/ui";
import { PricingRule, ownerApi } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

export default function PricingPage() {
  const { venue } = useVenue();
  const [resourceId, setResourceId] = useState("");
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [form, setForm] = useState({ name: "Evening", startsAt: "16:00", endsAt: "23:00", priceAmount: 40, isDefault: false });

  async function load(id: string) {
    setRules(await ownerApi.pricing(id));
  }

  useEffect(() => {
    if (!venue?.resources[0]) return;
    setResourceId(venue.resources[0].id);
    void load(venue.resources[0].id);
  }, [venue?.id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await ownerApi.createPricing(resourceId, form);
    setForm({ name: "", startsAt: "08:00", endsAt: "16:00", priceAmount: 30, isDefault: false });
    await load(resourceId);
    toast.success("Price added");
  }

  if (!venue) return null;
  if (venue.resources.length === 0) {
    return (
      <EmptyState
        title="Add your first field/court"
        body="Set a default price and evening price for each resource."
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule) => (
          <Card key={rule.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">{rule.name}</div>
                {rule.isDefault && <span className="rounded-lg bg-brand px-2 py-1 text-[10px] font-black text-slate-900">DEFAULT</span>}
              </div>
              <div className="mt-3 text-4xl font-black text-slate-900">{formatMoney(rule.priceAmount)}</div>
              <div className="mt-1 text-sm font-bold text-slate-500">{rule.startsAt} – {rule.endsAt}</div>
            </div>
            <Button
              variant="ghost"
              className="mt-4 self-start px-0 text-red-600 hover:bg-transparent hover:text-red-700"
              onClick={async () => { await ownerApi.deletePricing(rule.id); await load(resourceId); }}
            >
              Remove
            </Button>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="text-lg font-black text-slate-900">Add a price</h2>
        <p className="mb-5 mt-1 text-sm font-medium text-slate-500">Day, evening, or a default rate for this space.</p>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={onSubmit}>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="From"><Input value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></Field>
          <Field label="To"><Input value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
          <Field label="Price (JOD)"><Input type="number" value={form.priceAmount} onChange={(e) => setForm({ ...form, priceAmount: Number(e.target.value) })} /></Field>
          <div className="flex items-end gap-3">
            <label className="flex h-11 items-center gap-2 text-sm font-bold text-slate-600">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              Default
            </label>
            <Button>Add</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

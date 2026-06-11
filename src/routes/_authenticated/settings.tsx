import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PanelCard } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — TooliVerse" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
      if (data.user) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).single();
        setName(p?.full_name ?? "");
      }
    })();
  }, []);

  const save = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (u.user) await supabase.from("profiles").update({ full_name: name }).eq("id", u.user.id);
    setLoading(false);
    toast.success("Saved");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile and session." icon={SettingsIcon} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Profile">
          <div className="space-y-3">
            <div><Label>Email</Label><Input value={email} disabled /></div>
            <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <Button onClick={save} disabled={loading} className="bg-gradient-primary text-primary-foreground">{loading ? "Saving…" : "Save"}</Button>
          </div>
        </PanelCard>
        <PanelCard title="Session">
          <Button onClick={signOut} variant="outline">Sign out</Button>
        </PanelCard>
      </div>
    </div>
  );
}

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useSyncSettings } from "./sync.settings";

// Only offered once the library is linked to the logged in account, which
// happens when the user answers the sync dialog.
export default function AutoSyncSetting() {
  const { linked, setSettings } = useSyncSettings();

  if (!linked) return null;

  return (
    <Field orientation="horizontal">
      <FieldLabel htmlFor="auto-sync">Auto sync</FieldLabel>
      <Switch
        id="auto-sync"
        checked={linked.auto}
        onCheckedChange={(auto) => setSettings({ ...linked, auto })}
      />
      <FieldDescription>
        Uploads your changes as private while you are logged in.
      </FieldDescription>
    </Field>
  );
}

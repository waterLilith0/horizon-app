import { useAppForm } from "@/components/form";
import { changePasswordSchema } from "../auth/auth.schema";

// TODO: implement
function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  console.log(currentPassword, newPassword);
  return Promise.resolve(true);
}

export default function PasswordChange() {
  const form = useAppForm({
    defaultValues: { currentPassword: "", newPassword: "" },
    validators: {
      onChangeAsync: changePasswordSchema,
      onChangeAsyncDebounceMs: 400,
      onSubmit: changePasswordSchema,
      onSubmitAsync: async ({ value }) => {
        const ok = await changePassword(
          value.currentPassword,
          value.newPassword,
        );
        if (!ok) {
          return {
            fields: {
              currentPassword: { message: "Current password is incorrect" },
            },
          };
        }
        return undefined;
      },
    },
    onSubmit: ({ formApi }) => formApi.reset(),
  });

  return (
    <form.AppForm>
      <form.AuthForm submit="Change Password" pending="Saving...">
        <form.AppField name="currentPassword">
          {(field) => (
            <field.TextField
              label="Current Password"
              type="password"
              placeholder="*********"
              autoComplete="current-password"
            />
          )}
        </form.AppField>
        <form.AppField name="newPassword">
          {(field) => (
            <field.TextField
              label="New Password"
              type="password"
              placeholder="*********"
              autoComplete="new-password"
            />
          )}
        </form.AppField>
      </form.AuthForm>
    </form.AppForm>
  );
}

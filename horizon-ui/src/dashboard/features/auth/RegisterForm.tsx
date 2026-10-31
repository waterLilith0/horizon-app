import {
  getApiAuth,
  postApiAuthRegister,
  type ValidationProblemDetails,
} from "@/api/generated/internal/horizonInternal";
import { useAppForm } from "@/components/form";
import { registerSchema, usernameSchema } from "./auth.schema";

export default function RegisterForm({
  onRegistered,
}: {
  onRegistered: (email: string) => void;
}) {
  const form = useAppForm({
    defaultValues: { userName: "", email: "", password: "" },
    validators: {
      onChange: registerSchema,
      onSubmit: registerSchema,
      onSubmitAsync: async ({ value }) => {
        const { userName, email, password } = registerSchema.parse(value);
        const res = await postApiAuthRegister({
          userName,
          email,
          password,
        });
        if (res.status === 201) return undefined;
        const { errors } = res.data as ValidationProblemDetails;
        return {
          fields: Object.fromEntries(
            Object.entries(errors ?? {}).map(([key, [message]]) => [
              key.toLowerCase(),
              { message },
            ]),
          ),
        };
      },
    },
    onSubmit: ({ value }) => onRegistered(value.email),
  });

  return (
    <form.AppForm>
      <form.AuthForm submit="Create account" pending="Creating account…">
        <form.AppField
          name="userName"
          validators={{
            onChangeAsyncDebounceMs: 400,
            onChangeAsync: async ({ value, signal }) => {
              if (!usernameSchema.safeParse(value).success) return undefined;
              const res = await getApiAuth({ userName: value }, { signal });
              return res.status === 409
                ? { message: "That username is taken" }
                : undefined;
            },
          }}
        >
          {(field) => (
            <field.TextField
              label="Username"
              pendingText="Checking…"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          )}
        </form.AppField>
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.PasswordField
              label="Password"
              autoComplete="new-password"
              strengthHints={[
                form.getFieldValue("userName"),
                form.getFieldValue("email"),
              ]}
            />
          )}
        </form.AppField>
      </form.AuthForm>
    </form.AppForm>
  );
}

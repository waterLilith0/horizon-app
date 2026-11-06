import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./context";
import { AuthForm, PasswordField, TextField } from "./fields";

// Forms built with this declare their fields and nothing else: the look of
// the fields, the submit button and the errors come with it.
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, PasswordField },
  formComponents: { AuthForm },
});

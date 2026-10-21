import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
} from "@/components/ui/field";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export default function ApiAccess() {
  return (
    <FieldGroup>
      <FieldLegend>API Access</FieldLegend>
      <Field orientation={"horizontal"}>
        <FieldLabel>Active API Keys</FieldLabel>
        <FieldContent>{1}</FieldContent>
      </Field>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>ab89...</TableCell>
            <TableCell>
              <Button>Deactivate</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell rowSpan={2}>
              <Button>Generate New API Key</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </FieldGroup>
  );
}

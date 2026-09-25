import { FIELD_HINTS, FIELD_SCHEMAS } from "@/lib/sandbox/fieldSchemas";
import { getRequirementLabel, type Dimension, type Requirement } from "@/lib/sandbox/dimensions";
import { getDict, type Locale } from "@/lib/i18n/dictionary";
import { deleteFieldAttachment, saveSectionField, uploadFieldAttachment } from "./sectionActions";

const REQUIREMENT_STYLE: Record<Requirement, string> = {
  required: "bg-rose-wash text-rose",
  optional: "bg-ochre-wash text-ochre",
  view_only: "border border-line bg-field text-ink-soft",
  not_applicable: "border border-line bg-field text-ink-faint",
};

const EXTRA_BLANK_ROWS = 3;

export function SectionFieldEditor({
  documentId,
  dimension,
  fieldKey,
  fieldLabel,
  requirement,
  locale,
  value,
  inherited,
  attachments,
  locked,
}: {
  documentId: string;
  dimension: Dimension;
  fieldKey: string;
  fieldLabel: string;
  requirement: Requirement;
  locale: Locale;
  value: unknown;
  inherited?: { value: unknown; ownerName: string } | null;
  attachments?: { id: string; fileName: string; url: string | null }[];
  locked?: boolean;
}) {
  const t = getDict(locale).sandboxForm;
  const schema = FIELD_SCHEMAS[fieldKey];
  const hint = FIELD_HINTS[fieldKey]?.[locale];

  return (
    <div className="mb-5">
      <div className="mb-0.5 flex items-center justify-between gap-3">
        <span className="text-[15px] font-bold text-ink">{fieldLabel}</span>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${REQUIREMENT_STYLE[requirement]}`}>
          {getRequirementLabel(locale, requirement)}
        </span>
      </div>
      {hint && <p className="mb-1.5 text-[13px] text-ink-soft">{hint}</p>}

      {requirement === "view_only" ? (
        <ViewOnlyValue schema={schema} value={inherited?.value} ownerName={inherited?.ownerName} t={t} />
      ) : locked ? (
        <LockedValue schema={schema} value={value} attachments={attachments} t={t} />
      ) : (
        <>
          {schema?.widget === "richtext" && (
            <RichtextForm documentId={documentId} dimension={dimension} fieldKey={fieldKey} value={value} saveLabel={t.save} />
          )}
          {schema?.widget === "richtext_attachment" && (
            <>
              <RichtextForm documentId={documentId} dimension={dimension} fieldKey={fieldKey} value={value} saveLabel={t.save} />
              <AttachmentUploader documentId={documentId} fieldKey={fieldKey} attachments={attachments} t={t} />
            </>
          )}
          {schema?.widget === "list_string" && (
            <ListStringForm documentId={documentId} dimension={dimension} fieldKey={fieldKey} value={value} t={t} />
          )}
          {(schema?.widget === "list_object" || schema?.widget === "table") && schema.objectFields && (
            <ObjectListForm
              documentId={documentId}
              dimension={dimension}
              fieldKey={fieldKey}
              value={value}
              fields={schema.objectFields}
              locale={locale}
              t={t}
            />
          )}
          {schema?.widget === "attachment_list" && schema.objectFields && (
            <>
              <ObjectListForm
                documentId={documentId}
                dimension={dimension}
                fieldKey={fieldKey}
                value={value}
                fields={schema.objectFields}
                locale={locale}
                t={t}
              />
              <AttachmentUploader documentId={documentId} fieldKey={fieldKey} attachments={attachments} t={t} />
            </>
          )}
          {schema?.widget === "attachment" && (
            <AttachmentUploader documentId={documentId} fieldKey={fieldKey} attachments={attachments} t={t} />
          )}
        </>
      )}
    </div>
  );
}

function ViewOnlyValue({
  schema,
  value,
  ownerName,
  t,
}: {
  schema: (typeof FIELD_SCHEMAS)[string] | undefined;
  value: unknown;
  ownerName?: string;
  t: ReturnType<typeof getDict>["sandboxForm"];
}) {
  if (!ownerName || value === undefined || value === null || value === "") {
    return <p className="rounded-md border border-line bg-field px-3 py-2 text-sm text-ink-faint">{t.notFilledByManager}</p>;
  }

  return (
    <div className="rounded-md border border-line bg-field px-3 py-2 text-sm text-ink-soft">
      <p className="mb-1 text-xs text-ink-faint">{t.inheritedFrom.replace("{name}", ownerName)}</p>
      {schema?.widget === "list_string" && Array.isArray(value) && (
        <ul className="list-disc pl-4">
          {(value as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
      {(schema?.widget === "list_object" || schema?.widget === "table") &&
        Array.isArray(value) &&
        schema.objectFields && (
          <ul className="flex flex-col gap-1">
            {(value as Record<string, string>[]).map((row, i) => (
              <li key={i} className="rounded bg-paper-raised px-2 py-1">
                {schema.objectFields!.map((f) => row[f.key]).filter(Boolean).join(" · ")}
              </li>
            ))}
          </ul>
        )}
      {(schema?.widget === "richtext" || schema?.widget === "richtext_attachment") &&
        typeof value === "string" && <p className="whitespace-pre-wrap">{value}</p>}
    </div>
  );
}

function LockedValue({
  schema,
  value,
  attachments,
  t,
}: {
  schema: (typeof FIELD_SCHEMAS)[string] | undefined;
  value: unknown;
  attachments?: { id: string; fileName: string; url: string | null }[];
  t: ReturnType<typeof getDict>["sandboxForm"];
}) {
  const isEmpty =
    (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) &&
    (!attachments || attachments.length === 0);

  return (
    <div className="rounded-md border border-line bg-field px-3 py-2 text-sm text-ink-soft">
      <p className="mb-1 text-xs text-ink-faint">{t.lockedNote}</p>
      {isEmpty ? (
        <p className="text-ink-faint">{t.notFilled}</p>
      ) : (
        <>
          {schema?.widget === "list_string" && Array.isArray(value) && (
            <ul className="list-disc pl-4">
              {(value as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
          {(schema?.widget === "list_object" || schema?.widget === "table" || schema?.widget === "attachment_list") &&
            Array.isArray(value) &&
            schema.objectFields && (
              <ul className="flex flex-col gap-1">
                {(value as Record<string, string>[]).map((row, i) => (
                  <li key={i} className="rounded bg-paper-raised px-2 py-1">
                    {schema
                      .objectFields!.map((f) => row[f.key])
                      .filter(Boolean)
                      .join(" · ")}
                  </li>
                ))}
              </ul>
            )}
          {(schema?.widget === "richtext" || schema?.widget === "richtext_attachment") &&
            typeof value === "string" && <p className="whitespace-pre-wrap">{value}</p>}
          {attachments && attachments.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5">
              {attachments.map((a) => (
                <li key={a.id}>
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noreferrer" className="text-seal underline decoration-line underline-offset-2 hover:text-seal-strong">
                      {a.fileName}
                    </a>
                  ) : (
                    a.fileName
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function RichtextForm({
  documentId,
  dimension,
  fieldKey,
  value,
  saveLabel,
}: {
  documentId: string;
  dimension: Dimension;
  fieldKey: string;
  value: unknown;
  saveLabel: string;
}) {
  return (
    <form action={saveSectionField} className="flex flex-col gap-2">
      <input type="hidden" name="document_id" value={documentId} />
      <input type="hidden" name="dimension" value={dimension} />
      <input type="hidden" name="field_key" value={fieldKey} />
      <textarea
        name="value"
        defaultValue={typeof value === "string" ? value : ""}
        rows={3}
        className="min-h-[92px] rounded-md border border-line bg-field px-3 py-2 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
      />
      <button type="submit" className="w-fit rounded-md bg-seal px-3.5 py-1.5 text-xs font-bold text-paper-raised hover:bg-seal-strong">
        {saveLabel}
      </button>
    </form>
  );
}

function ListStringForm({
  documentId,
  dimension,
  fieldKey,
  value,
  t,
}: {
  documentId: string;
  dimension: Dimension;
  fieldKey: string;
  value: unknown;
  t: ReturnType<typeof getDict>["sandboxForm"];
}) {
  const existing = Array.isArray(value) ? (value as string[]) : [];
  const rows = [...existing, ...Array(EXTRA_BLANK_ROWS).fill("")];

  return (
    <form action={saveSectionField} className="flex flex-col gap-2">
      <input type="hidden" name="document_id" value={documentId} />
      <input type="hidden" name="dimension" value={dimension} />
      <input type="hidden" name="field_key" value={fieldKey} />
      <p className="text-xs text-ink-faint">{t.addBlankRowsHint}</p>
      {rows.map((item, i) => (
        <input
          key={i}
          type="text"
          name="item"
          defaultValue={item}
          className="rounded-md border border-line bg-field px-3 py-2 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
        />
      ))}
      <button type="submit" className="w-fit rounded-md bg-seal px-3.5 py-1.5 text-xs font-bold text-paper-raised hover:bg-seal-strong">
        {t.save}
      </button>
    </form>
  );
}

function ObjectListForm({
  documentId,
  dimension,
  fieldKey,
  value,
  fields,
  locale,
  t,
}: {
  documentId: string;
  dimension: Dimension;
  fieldKey: string;
  value: unknown;
  fields: { key: string; label: { zh: string; en: string }; type: string }[];
  locale: Locale;
  t: ReturnType<typeof getDict>["sandboxForm"];
}) {
  const existing = Array.isArray(value) ? (value as Record<string, string>[]) : [];
  const rowCount = existing.length + EXTRA_BLANK_ROWS;

  return (
    <form action={saveSectionField} className="flex flex-col gap-2">
      <input type="hidden" name="document_id" value={documentId} />
      <input type="hidden" name="dimension" value={dimension} />
      <input type="hidden" name="field_key" value={fieldKey} />
      <input type="hidden" name="row_count" value={rowCount} />
      <p className="text-xs text-ink-faint">{t.addBlankRowsHint}</p>
      <div className="flex flex-col gap-2">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="flex flex-wrap gap-2 rounded-md border border-line bg-field p-2">
            {fields.map((f) => (
              <label key={f.key} className="flex flex-col text-xs text-ink-soft">
                {f.label[locale]}
                {f.type === "textarea" ? (
                  <textarea
                    name={`row_${i}_${f.key}`}
                    defaultValue={existing[i]?.[f.key] ?? ""}
                    rows={2}
                    className="w-48 rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
                  />
                ) : (
                  <input
                    type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                    name={`row_${i}_${f.key}`}
                    defaultValue={existing[i]?.[f.key] ?? ""}
                    className="w-40 rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
                  />
                )}
              </label>
            ))}
          </div>
        ))}
      </div>
      <button type="submit" className="w-fit rounded-md bg-seal px-3.5 py-1.5 text-xs font-bold text-paper-raised hover:bg-seal-strong">
        {t.save}
      </button>
    </form>
  );
}

function AttachmentUploader({
  documentId,
  fieldKey,
  attachments,
  t,
}: {
  documentId: string;
  fieldKey: string;
  attachments?: { id: string; fileName: string; url: string | null }[];
  t: ReturnType<typeof getDict>["sandboxForm"];
}) {
  return (
    <div className="mt-2">
      <p className="mb-1 text-xs text-ink-soft">{t.existingFiles}</p>
      {attachments && attachments.length > 0 ? (
        <ul className="mb-2 flex flex-col gap-1">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              {a.url ? (
                <a href={a.url} target="_blank" rel="noreferrer" className="text-seal underline decoration-line underline-offset-2 hover:text-seal-strong">
                  {a.fileName}
                </a>
              ) : (
                <span>{a.fileName}</span>
              )}
              <form action={deleteFieldAttachment}>
                <input type="hidden" name="document_id" value={documentId} />
                <input type="hidden" name="attachment_id" value={a.id} />
                <button type="submit" className="text-xs text-ink-faint underline decoration-line underline-offset-2 hover:text-rose">
                  {t.removeFile}
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-xs text-ink-faint">{t.noFilesYet}</p>
      )}
      <form action={uploadFieldAttachment} className="flex items-center gap-2">
        <input type="hidden" name="document_id" value={documentId} />
        <input type="hidden" name="field_key" value={fieldKey} />
        <input type="file" name="file" required className="text-xs text-ink-soft" />
        <button type="submit" className="rounded-md border border-line px-3 py-1 text-xs text-ink-soft hover:bg-field">
          {t.uploadLabel}
        </button>
      </form>
    </div>
  );
}

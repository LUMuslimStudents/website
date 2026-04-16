import type { ReactNode } from "react";
import { Trash2, Type, CircleDot, ListChecks, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type DynamicFormFieldType = "short_text" | "checkbox_multi" | "radio_single";

export type DynamicFormFieldDraft = {
  id: string;
  question: string;
  help_text: string;
  field_type: DynamicFormFieldType;
  is_required: boolean;
  options_text: string;
};

type DynamicQuestionCardProps = {
  field: DynamicFormFieldDraft;
  index: number;
  onUpdate: (fieldId: string, updates: Partial<DynamicFormFieldDraft>) => void;
  onRemove: (fieldId: string) => void;
};

type SharedQuestionLayoutProps = DynamicQuestionCardProps & {
  optionsSection?: ReactNode;
};

export const normalizeDynamicFieldOptions = (value: string) => {
  const options = value
    .split(/[\n,]/)
    .map((option) => option.trim())
    .filter(Boolean);

  return [...new Set(options)];
};

/** Parse options_text into an array, keeping empty trailing slot for editing. */
const parseOptionsForEditor = (optionsText: string): string[] => {
  const lines = optionsText.split("\n");
  // Keep all lines (including empty ones the user is actively typing in)
  return lines.length === 0 ? [""] : lines;
};

/** Join option values back to newline-separated string. */
const serializeOptions = (options: string[]): string => {
  return options.join("\n");
};

type OptionsEditorProps = {
  fieldId: string;
  optionsText: string;
  onUpdate: (fieldId: string, updates: Partial<DynamicFormFieldDraft>) => void;
  indicatorType: "radio" | "checkbox";
};

const OptionsEditor = ({ fieldId, optionsText, onUpdate, indicatorType }: OptionsEditorProps) => {
  const options = parseOptionsForEditor(optionsText);

  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    onUpdate(fieldId, { options_text: serializeOptions(next) });
  };

  const removeOption = (index: number) => {
    const next = options.filter((_, i) => i !== index);
    onUpdate(fieldId, { options_text: serializeOptions(next.length === 0 ? [""] : next) });
  };

  const addOption = () => {
    onUpdate(fieldId, { options_text: serializeOptions([...options, ""]) });
  };

  return (
    <div className="md:col-span-6 space-y-2">
      <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Options</span>

      <div className="space-y-1.5">
        {options.map((option, index) => (
          <div
            key={`${fieldId}-opt-${index}`}
            className="group flex items-center gap-2"
          >
            {/* Radio / Checkbox indicator */}
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
              {indicatorType === "radio" ? (
                <span className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
              ) : (
                <span className="h-4 w-4 rounded border-2 border-slate-300 dark:border-slate-600" />
              )}
            </span>

            {/* Option input */}
            <Input
              value={option}
              onChange={(event) => updateOption(index, event.target.value)}
              placeholder={`Option ${index + 1}`}
              className="h-9 rounded-lg border-slate-200 bg-slate-50/60 text-sm transition-colors duration-150 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:focus-visible:bg-slate-800 dark:focus-visible:ring-slate-600"
            />

            {/* Remove button */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0 rounded-full text-slate-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              onClick={() => removeOption(index)}
              aria-label={`Remove option ${index + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add option button */}
      <button
        type="button"
        onClick={addOption}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <Plus className="h-3.5 w-3.5" />
        Add option
      </button>
    </div>
  );
};

const SharedQuestionLayout = ({
  field,
  index,
  onUpdate,
  onRemove,
  optionsSection,
}: SharedQuestionLayoutProps) => {
  const questionTypeMeta = {
    short_text: {
      label: "Short text",
      icon: Type,
      iconClassName: "bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300",
    },
    radio_single: {
      label: "Single choice",
      icon: CircleDot,
      iconClassName: "bg-amber-50 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300",
    },
    checkbox_multi: {
      label: "Multiple choice",
      icon: ListChecks,
      iconClassName: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300",
    },
  }[field.field_type];

  const QuestionTypeIcon = questionTypeMeta.icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold ${questionTypeMeta.iconClassName}`}>
            <QuestionTypeIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {questionTypeMeta.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900/60">
            <span className="text-xs text-slate-600 dark:text-slate-300">Required</span>
            <Switch
              checked={field.is_required}
              onCheckedChange={(checked) => onUpdate(field.id, { is_required: checked })}
              aria-label={`Mark question ${index + 1} as required`}
            />
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
            onClick={() => onRemove(field.id)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Remove
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        <div className="md:col-span-6">
          <Input
            value={field.question}
            onChange={(event) => onUpdate(field.id, { question: event.target.value })}
            placeholder="Question"
            className="hero-clean-input h-14 border-none bg-transparent px-0 md:text-2xl font-semibold leading-none tracking-tight shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-4xl md:placeholder:text-2xl placeholder:font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="md:col-span-6">
          <Input
            value={field.help_text}
            onChange={(event) => onUpdate(field.id, { help_text: event.target.value })}
            placeholder="Describe the question in more detail (optional)"
            className="hero-help-text-input h-12 w-full bg-transparent px-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {optionsSection}
      </div>
    </div>
  );
};

const ShortTextQuestionCard = (props: DynamicQuestionCardProps) => {
  return <SharedQuestionLayout {...props} />;
};

const RadioSingleQuestionCard = ({ field, ...props }: DynamicQuestionCardProps) => {
  return (
    <SharedQuestionLayout
      field={field}
      {...props}
      optionsSection={(
        <OptionsEditor
          fieldId={field.id}
          optionsText={field.options_text}
          onUpdate={props.onUpdate}
          indicatorType="radio"
        />
      )}
    />
  );
};

const CheckboxMultiQuestionCard = ({ field, ...props }: DynamicQuestionCardProps) => {
  return (
    <SharedQuestionLayout
      field={field}
      {...props}
      optionsSection={(
        <OptionsEditor
          fieldId={field.id}
          optionsText={field.options_text}
          onUpdate={props.onUpdate}
          indicatorType="checkbox"
        />
      )}
    />
  );
};

export const DynamicQuestionCard = (props: DynamicQuestionCardProps) => {
  switch (props.field.field_type) {
    case "radio_single":
      return <RadioSingleQuestionCard {...props} />;
    case "checkbox_multi":
      return <CheckboxMultiQuestionCard {...props} />;
    default:
      return <ShortTextQuestionCard {...props} />;
  }
};


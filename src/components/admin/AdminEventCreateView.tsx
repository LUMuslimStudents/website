import { ChangeEvent, FormEvent, forwardRef, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps, InputHTMLAttributes } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, parse, isValid } from "date-fns";
import { ArrowLeft, Clock3, HelpCircle, Eye, Code, MapPin, Clock, Calendar, Users, User, GraduationCap, Mail, VenusAndMars, Plus, Type, CircleDot, ListChecks } from "lucide-react";
import MDEditor, { type ICommand } from "@uiw/react-md-editor";
import DatePicker from "react-datepicker";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EventMarkdown } from "@/components/events/EventMarkdown";
import { PosterUploader } from "@/components/admin/PosterUploader";
import {
  DynamicQuestionCard,
  type DynamicFormFieldDraft,
  type DynamicFormFieldType,
  normalizeDynamicFieldOptions,
} from "@/components/admin/DynamicQuestionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import InputMask from "react-input-mask";
import "@uiw/react-md-editor/markdown-editor.css";
import "react-datepicker/dist/react-datepicker.css";
import "./AdminEventCreateView.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type PublishMode = "draft" | "publish";

type FormState = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  deadline: string;
  address: string;
  invitation: string;
  siblings: string;
  price_member: string;
  price_nonmember: string;
  price_alumnus: string;
  description: string;
};

const INITIAL_FORM: FormState = {
  title: "",
  date: "",
  start_time: "",
  end_time: "",
  deadline: "",
  address: "",
  invitation: "members",
  siblings: "all",
  price_member: "0",
  price_nonmember: "0",
  price_alumnus: "0",
  description: "",
};

const DATE_FORMAT = "yyyy-MM-dd";
const TIME_FORMAT = "HH:mm";
const DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm";

const createDynamicFormFieldDraft = (fieldType: DynamicFormFieldType = "short_text"): DynamicFormFieldDraft => ({
  id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  question: "",
  help_text: "",
  field_type: fieldType,
  is_required: true,
  options_text: "",
});

const parseDateValue = (value: string) => {
  if (!value) return null;

  const parsed = parse(value, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
};

const parseTimeValue = (value: string) => {
  if (!value) return null;

  const parsed = parse(value, TIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
};

const formatDateValue = (value: Date | null) => {
  return value ? format(value, DATE_FORMAT) : "";
};

const formatTimeValue = (value: Date | null) => {
  return value ? format(value, TIME_FORMAT) : "";
};

const formatDateTimeValue = (value: Date | null) => {
  return value ? format(value, DATE_TIME_FORMAT) : "";
};

const toDigits = (value: string) => value.replace(/\D/g, "");

const maskDateValue = (value: string) => {
  const digits = toDigits(value).slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const maskTimeValue = (value: string) => {
  const digits = toDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

const parseDateTimeValue = (value: string) => {
  if (!value) return null;

  const normalized = value.includes("T") ? value.replace("T", " ") : value;
  const parsed = parse(normalized, DATE_TIME_FORMAT, new Date());
  if (isValid(parsed)) return parsed;

  const isoParsed = new Date(value);
  return isValid(isoParsed) ? isoParsed : null;
};

const validateDynamicFormFields = (fields: DynamicFormFieldDraft[]) => {
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const question = field.question.trim();
    if (!question) {
      return `Question text is required for field #${index + 1}.`;
    }

    if (field.field_type !== "short_text") {
      const options = normalizeDynamicFieldOptions(field.options_text);
      if (options.length === 0) {
        return `At least one option is required for field #${index + 1}.`;
      }
    }
  }

  return null;
};

const filterMarkdownEditorCommands = (command: ICommand): false | ICommand => {
  return command.keyCommand === "fullscreen" ? false : command;
};

type PickerInputProps = ComponentProps<typeof Input>;

const DateMaskedInput = forwardRef<HTMLInputElement, PickerInputProps>((props, ref) => {
  const { className, value, onChange, onClick, onFocus, onBlur, onKeyDown, disabled, readOnly, ...rest } = props;

  return (
    <InputMask
      {...rest}
      mask="9999-99-99"
      maskChar={null}
      value={typeof value === "string" ? value : ""}
      onChange={onChange}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      disabled={disabled}
      readOnly={readOnly}
      inputRef={ref}
    >
      {(inputProps: InputHTMLAttributes<HTMLInputElement>) => (
        <Input
          {...inputProps}
          ref={ref}
          className={className}
          inputMode="numeric"
          autoComplete="off"
        />
      )}
    </InputMask>
  );
});

DateMaskedInput.displayName = "DateMaskedInput";

const DateTimeMaskedInput = forwardRef<HTMLInputElement, PickerInputProps>((props, ref) => {
  const { className, value, onChange, onClick, onFocus, onBlur, onKeyDown, disabled, readOnly, ...rest } = props;

  return (
    <InputMask
      {...rest}
      mask="9999-99-99 99:99"
      maskChar={null}
      value={typeof value === "string" ? value : ""}
      onChange={onChange}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      disabled={disabled}
      readOnly={readOnly}
      inputRef={ref}
    >
      {(inputProps: InputHTMLAttributes<HTMLInputElement>) => (
        <Input
          {...inputProps}
          ref={ref}
          className={className}
          inputMode="numeric"
          autoComplete="off"
        />
      )}
    </InputMask>
  );
});

DateTimeMaskedInput.displayName = "DateTimeMaskedInput";

export const AdminEventCreateView = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [dynamicFormFields, setDynamicFormFields] = useState<DynamicFormFieldDraft[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [submittingMode, setSubmittingMode] = useState<PublishMode | null>(null);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [questionTypePickerOpen, setQuestionTypePickerOpen] = useState(false);
  const questionTypePickerCloseTimeoutRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  const isSubmitting = submittingMode !== null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const colorMode = mounted && resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    const portalId = "admin-datepicker-portal";
    let portal = document.getElementById(portalId);

    if (!portal) {
      portal = document.createElement("div");
      portal.id = portalId;
      document.body.appendChild(portal);
    }

    return () => {
      if (portal && portal.childElementCount === 0 && portal.parentElement) {
        portal.parentElement.removeChild(portal);
      }
    };
  }, []);

  const showNonMemberPrice = useMemo(() => {
    return form.invitation !== "members";
  }, [form.invitation]);

  const showAlumnusPrice = useMemo(() => {
    return ["alumni", "all_students", "non_students"].includes(form.invitation);
  }, [form.invitation]);

  const minimumRequiredMissing = useMemo(() => {
    return !form.title || !form.date || !form.start_time || !form.end_time || !form.deadline || !form.address;
  }, [form]);

  const dynamicFieldsInvalid = useMemo(() => {
    return validateDynamicFormFields(dynamicFormFields) !== null;
  }, [dynamicFormFields]);

  const onInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onTimeRawChange = (field: "start_time" | "end_time") => (event: SyntheticEvent<HTMLElement>) => {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;

    const value = maskTimeValue(input.value);
    input.value = value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onDateChange = (value: Date | null) => {
    setForm((current) => ({
      ...current,
      date: formatDateValue(value),
    }));
  };

  const onStartTimeChange = (value: Date | null) => {
    setForm((current) => ({
      ...current,
      start_time: formatTimeValue(value),
    }));
  };

  const onEndTimeChange = (value: Date | null) => {
    setForm((current) => ({
      ...current,
      end_time: formatTimeValue(value),
    }));
  };

  const onDeadlineChange = (value: Date | null) => {
    setForm((current) => ({
      ...current,
      deadline: formatDateTimeValue(value),
    }));
  };

  const addDynamicField = (fieldType: DynamicFormFieldType = "short_text") => {
    setDynamicFormFields((current) => [...current, createDynamicFormFieldDraft(fieldType)]);
    setQuestionTypePickerOpen(false);
  };

  const cancelQuestionTypePickerClose = () => {
    if (questionTypePickerCloseTimeoutRef.current !== null) {
      window.clearTimeout(questionTypePickerCloseTimeoutRef.current);
      questionTypePickerCloseTimeoutRef.current = null;
    }
  };

  const openQuestionTypePicker = () => {
    cancelQuestionTypePickerClose();
    setQuestionTypePickerOpen(true);
  };

  const closeQuestionTypePickerWithDelay = () => {
    cancelQuestionTypePickerClose();
    questionTypePickerCloseTimeoutRef.current = window.setTimeout(() => {
      setQuestionTypePickerOpen(false);
      questionTypePickerCloseTimeoutRef.current = null;
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (questionTypePickerCloseTimeoutRef.current !== null) {
        window.clearTimeout(questionTypePickerCloseTimeoutRef.current);
      }
    };
  }, []);

  const questionTypeOptions = [
    {
      type: "short_text" as const,
      label: "Short text answer",
      icon: Type,
    },
    {
      type: "radio_single" as const,
      label: "Single choice answer",
      icon: CircleDot,
    },
    {
      type: "checkbox_multi" as const,
      label: "Multiple choice answer",
      icon: ListChecks,
    },
  ];

  const updateDynamicField = (
    fieldId: string,
    updates: Partial<DynamicFormFieldDraft>,
  ) => {
    setDynamicFormFields((current) =>
      current.map((field) => {
        if (field.id !== fieldId) {
          return field;
        }

        if (updates.field_type === "short_text") {
          return {
            ...field,
            ...updates,
            options_text: "",
          };
        }

        return {
          ...field,
          ...updates,
        };
      }),
    );
  };

  const removeDynamicField = (fieldId: string) => {
    setDynamicFormFields((current) => current.filter((field) => field.id !== fieldId));
  };

  const submit = async (submitMode: PublishMode) => {
    if (minimumRequiredMissing) {
      toast.error('Please complete all required fields.');
      return;
    }

    if (images.length === 0) {
      toast.warning('No poster uploaded. You can still continue.');
    }

    const formFieldValidationError = validateDynamicFormFields(dynamicFormFields);
    if (formFieldValidationError) {
      toast.error(formFieldValidationError);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in as admin.');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    const normalizedDeadline = form.deadline.includes(" ")
      ? form.deadline.replace(" ", "T")
      : form.deadline;

    formData.append('title', form.title);
    formData.append('date', form.date);
    formData.append('start_time', form.start_time);
    formData.append('end_time', form.end_time);
    formData.append('deadline', normalizedDeadline);
    formData.append('address', form.address);
    formData.append('invitation', form.invitation);
    formData.append('siblings', form.siblings);
    formData.append('price_member', form.price_member);
    formData.append('price_nonmember', form.price_nonmember);
    formData.append('price_alumnus', form.price_alumnus);
    formData.append('description', form.description);
    formData.append('publish_mode', submitMode);
    formData.append('form_fields', JSON.stringify(
      dynamicFormFields.map((field, index) => {
        const question = field.question.trim();
        const helpText = field.help_text.trim();
        const options = normalizeDynamicFieldOptions(field.options_text);

        return {
          question,
          help_text: helpText || undefined,
          field_type: field.field_type,
          is_required: field.is_required,
          sort_order: index,
          options: field.field_type === "short_text" ? undefined : options,
        };
      }),
    ));

    images.forEach((image, displayOrder) => {
      // Include display order in multipart filename so backend can persist exact UI order.
      formData.append('image', image, `${displayOrder}__${image.name}`);
    });

    setSubmittingMode(submitMode);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/create-event`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create event');
      }

      const createdEventId = data?.event?.id;
      toast.success(submitMode === 'draft' ? 'Draft saved.' : 'Event created successfully.');

      if (createdEventId) {
        navigate(`/admin/events/${createdEventId}`);
      } else {
        navigate('/admin/events');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setSubmittingMode(null);
    }
  };

  return (
    <div className="admin-event-create-view mx-auto max-w-5xl space-y-3 pb-8">
      <Card className="overflow-hidden border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-slate-100/60 shadow-[0_18px_45px_-25px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80 dark:shadow-[0_18px_45px_-25px_rgba(0,0,0,0.75)] animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-200/70 bg-white/65 pb-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
          <CardTitle className="text-xl font-semibold tracking-tight">Create event</CardTitle>
          <Button type="button" variant="outline" className="rounded-full bg-white/85 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800" onClick={() => navigate('/admin/events')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </CardHeader>
      </Card>

      <form
        className="space-y-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void submit('publish');
        }}
      >
        {/* Title + Poster Hero Section */}
        <Card className="overflow-visible border border-slate-200/80 bg-white/95 shadow-sm animate-fade-in-delay-100 dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-[0_12px_30px_-22px_rgba(0,0,0,0.75)]">
          <CardContent className="p-0">
            <div className="grid gap-6 md:grid-cols-[1fr_2fr] lg:grid-cols-[460px_1fr]">
              {/* Poster Carousel */}
              <div className="rounded-t-3xl border-b border-slate-200/70 p-4 md:rounded-l-3xl md:rounded-r-none md:border-b-0 md:border-r dark:border-slate-800/80">
                <PosterUploader files={images} onChange={setImages} />
              </div>

              {/* Title + Details Input */}
              <div className="flex flex-col gap-4 p-6">
                <div>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={onInputChange}
                    maxLength={100}
                    required
                    placeholder="Event title"
                    className="hero-clean-input h-14 border-none bg-transparent px-0 text-2xl font-bold tracking-tight shadow-none md:text-3xl focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-300 dark:placeholder:text-slate-500 animate-text-scale-in"
                    aria-label="Event title"
                  />
                </div>

                {/* Location with Icon */}
                <div className="hero-datepicker-shell flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/70">
                  <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <Input
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={onInputChange}
                    maxLength={100}
                    required
                    placeholder="Event location"
                    className="hero-clean-input border-none bg-transparent px-0 text-sm shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label="Event location"
                  />
                </div>

                {/* Date + Time Fields */}
                <div className="space-y-2.5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      Event schedule
                    </div>
                    <div className="grid gap-2 lg:grid-cols-3">
                      <div className="hero-datepicker-shell rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950/70">
                        <label htmlFor="date" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Date
                        </label>
                        <DatePicker
                          id="date"
                          selected={parseDateValue(form.date)}
                          onChange={onDateChange}
                          customInput={(
                            <DateMaskedInput
                              name="date"
                              required
                              placeholder="YYYY-MM-DD"
                              className="hero-picker-input h-8 border-0 bg-transparent px-0 text-sm shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                              aria-label="Event date"
                            />
                          )}
                          dateFormat="yyyy-MM-dd"
                          portalId="admin-datepicker-portal"
                          popperClassName="hero-datepicker-popper"
                          calendarClassName="hero-datepicker-calendar"
                          placeholderText="YYYY-MM-DD"
                        />
                      </div>

                      <div className="hero-datepicker-shell rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950/70">
                        <label htmlFor="start_time" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Start time
                        </label>
                        <DatePicker
                          id="start_time"
                          selected={parseTimeValue(form.start_time)}
                          onChange={onStartTimeChange}
                          customInput={(
                            <Input
                              name="start_time"
                              required
                              placeholder="HH:mm"
                              className="hero-picker-input h-8 border-0 bg-transparent px-0 text-sm shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                              aria-label="Start time"
                            />
                          )}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeFormat="HH:mm"
                          timeCaption="Time"
                          dateFormat="HH:mm"
                          onChangeRaw={onTimeRawChange("start_time")}
                          portalId="admin-datepicker-portal"
                          popperClassName="hero-datepicker-popper"
                          calendarClassName="hero-datepicker-calendar"
                          placeholderText="HH:mm"
                        />
                      </div>

                      <div className="hero-datepicker-shell rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950/70">
                        <label htmlFor="end_time" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          End time
                        </label>
                        <DatePicker
                          id="end_time"
                          selected={parseTimeValue(form.end_time)}
                          onChange={onEndTimeChange}
                          customInput={(
                            <Input
                              name="end_time"
                              required
                              placeholder="HH:mm"
                              className="hero-picker-input h-8 border-0 bg-transparent px-0 text-sm shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                              aria-label="End time"
                            />
                          )}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeFormat="HH:mm"
                          timeCaption="Time"
                          dateFormat="HH:mm"
                          onChangeRaw={onTimeRawChange("end_time")}
                          portalId="admin-datepicker-portal"
                          popperClassName="hero-datepicker-popper"
                          calendarClassName="hero-datepicker-calendar"
                          placeholderText="HH:mm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      Registration deadline
                    </div>
                    <div className="hero-datepicker-shell rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950/70">
                      <label htmlFor="deadline" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Registration deadline
                      </label>
                      <DatePicker
                        id="deadline"
                        selected={parseDateTimeValue(form.deadline)}
                        onChange={onDeadlineChange}
                        customInput={(
                          <DateTimeMaskedInput
                            name="deadline"
                            required
                            placeholder="YYYY-MM-DD HH:mm"
                            className="hero-picker-input h-8 border-0 bg-transparent px-0 text-sm shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            aria-label="Registration deadline"
                          />
                        )}
                        showTimeSelect
                        timeIntervals={15}
                        timeFormat="HH:mm"
                        dateFormat="yyyy-MM-dd HH:mm"
                        portalId="admin-datepicker-portal"
                        popperClassName="hero-datepicker-popper"
                        calendarClassName="hero-datepicker-calendar"
                        placeholderText="YYYY-MM-DD HH:mm"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description Section */}
        <Card className="border border-slate-200/80 bg-white/95 shadow-sm animate-fade-in-delay-200 dark:border-slate-800 dark:bg-slate-950/75">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 transition-colors duration-200 dark:text-slate-500 dark:hover:text-slate-300"
                        aria-label="Markdown help"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 text-xs space-y-2 max-h-[400px] overflow-y-auto dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                      <div className="space-y-3">
                        <div>
                          <code className="text-slate-700 font-semibold dark:text-slate-200"># Heading 1</code>
                          <p className="text-slate-600 mt-1 dark:text-slate-400">Use 1-6 hash symbols for headings</p>
                        </div>
                        <div>
                          <code className="text-slate-700 font-semibold dark:text-slate-200">**bold** or __bold__</code>
                          <p className="text-slate-600 mt-1 dark:text-slate-400">For bold text</p>
                        </div>
                        <div>
                          <code className="text-slate-700 font-semibold dark:text-slate-200">*italic* or _italic_</code>
                          <p className="text-slate-600 mt-1 dark:text-slate-400">For italic text</p>
                        </div>
                        <div>
                          <code className="text-slate-700 font-semibold dark:text-slate-200">- Item 1<br />- Item 2</code>
                          <p className="text-slate-600 mt-1 dark:text-slate-400">For bullet lists</p>
                        </div>
                        <div>
                          <code className="text-slate-700 font-semibold dark:text-slate-200">1. Item 1<br />2. Item 2</code>
                          <p className="text-slate-600 mt-1 dark:text-slate-400">For ordered lists</p>
                        </div>
                        <div>
                          <code className="text-slate-700 font-semibold dark:text-slate-200">[Link text](url)</code>
                          <p className="text-slate-600 mt-1 dark:text-slate-400">For links</p>
                        </div>
                        <div>
                          <code className="text-slate-700 font-semibold dark:text-slate-200">&gt; Quote</code>
                          <p className="text-slate-600 mt-1 dark:text-slate-400">For blockquotes</p>
                        </div>
                        <div>
                          <p className="text-slate-600 mt-1 dark:text-slate-400"><strong>More help?</strong> Check the help button in the tool bar</p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="description-mode-toggle" role="tablist" aria-label="Description editor mode">
                  <Button
                    type="button"
                    size="sm"
                    variant={showMarkdownPreview ? "ghost" : "default"}
                    className={`description-mode-toggle-button ${!showMarkdownPreview ? 'is-active' : ''}`}
                    onClick={() => setShowMarkdownPreview(false)}
                    aria-pressed={!showMarkdownPreview}
                  >
                    <Code className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={showMarkdownPreview ? "default" : "ghost"}
                    className={`description-mode-toggle-button ${showMarkdownPreview ? 'is-active' : ''}`}
                    onClick={() => setShowMarkdownPreview(true)}
                    aria-pressed={showMarkdownPreview}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                </div>
              </div>

              <div className={showMarkdownPreview ? "hidden" : ""}>
                <div className="description-editor-shell" data-color-mode={colorMode}>
                  <MDEditor
                    value={form.description}
                    onChange={(value) => setForm((current) => ({ ...current, description: value ?? "" }))}
                    preview="edit"
                    height={320}
                    visibleDragbar={false}
                    commandsFilter={filterMarkdownEditorCommands}
                    textareaProps={{
                      placeholder: "Write the event description...",
                      "aria-label": "Event description",
                    }}
                  />
                </div>
              </div>

              <div className={showMarkdownPreview ? "" : "hidden"}>
                <div className="description-preview-shell">
                  {form.description.trim() ? (
                    <EventMarkdown value={form.description} colorMode={colorMode} />
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500">Your preview will appear here</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:grid-cols-2">
          {/* Invitation & Siblings Section */}
          <Card className="border border-slate-200/80 bg-white/95 shadow-sm animate-fade-in-delay-300 dark:border-slate-800 dark:bg-slate-950/75">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Invitation</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Invitation type</label>
                    </div>
                    <div className="w-40">
                      <Select value={form.invitation} onValueChange={(value) => setForm((current) => ({ ...current, invitation: value }))}>
                        <SelectTrigger aria-label="Invitation type" className="h-9 rounded-lg border-slate-200 focus:ring-blue-200 transition-all duration-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100">
                          <SelectValue placeholder="Invitation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="members">Members</SelectItem>
                          <SelectItem value="non_members">Non-members</SelectItem>
                          <SelectItem value="alumni">Alumni</SelectItem>
                          <SelectItem value="all_students">All students</SelectItem>
                          <SelectItem value="non_students">Non-students</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      <VenusAndMars className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Siblings policy</label>
                    </div>
                    <div className="w-40">
                      <Select value={form.siblings} onValueChange={(value) => setForm((current) => ({ ...current, siblings: value }))}>
                        <SelectTrigger aria-label="Siblings policy" className="h-9 rounded-lg border-slate-200 focus:ring-blue-200 transition-all duration-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100">
                          <SelectValue placeholder="Siblings" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="brothers">Brothers 🧔🏻‍♂️</SelectItem>
                          <SelectItem value="sisters">Sisters 🧕🏻</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <Card className="border border-slate-200/80 bg-white/95 shadow-sm animate-fade-in-delay-400 dark:border-slate-800 dark:bg-slate-950/75">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Pricing</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label htmlFor="price_member" className="block text-xs font-medium text-slate-600 dark:text-slate-300">Member price</label>
                    </div>
                    <div className="relative w-28">
                      <Input
                        id="price_member"
                        name="price_member"
                        type="number"
                        value={form.price_member}
                        onChange={onInputChange}
                        placeholder="0"
                        aria-label="Member price"
                        className="h-9 rounded-lg border-slate-200 pr-11 text-right focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">SEK</span>
                    </div>
                  </div>

                  {showNonMemberPrice && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <label htmlFor="price_nonmember" className="block text-xs font-medium text-slate-600 dark:text-slate-300">Non-member price</label>
                      </div>
                      <div className="relative w-28">
                        <Input
                          id="price_nonmember"
                          name="price_nonmember"
                          type="number"
                          value={form.price_nonmember}
                          onChange={onInputChange}
                          placeholder="0"
                          aria-label="Non-member price"
                          className="h-9 rounded-lg border-slate-200 pr-11 text-right focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">SEK</span>
                      </div>
                    </div>
                  )}

                  {showAlumnusPrice && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <label htmlFor="price_alumnus" className="block text-xs font-medium text-slate-600 dark:text-slate-300">Alumnus price</label>
                      </div>
                      <div className="relative w-28">
                        <Input
                          id="price_alumnus"
                          name="price_alumnus"
                          type="number"
                          value={form.price_alumnus}
                          onChange={onInputChange}
                          placeholder="0"
                          aria-label="Alumnus price"
                          className="h-9 rounded-lg border-slate-200 pr-11 text-right focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">SEK</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border bo erder-slate-200/80 bg-white/95 shadow-sm animate-fade-in-delay-400 dark:border-slate-800 dark:bg-slate-950/75">
          <CardHeader className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900/80 dark:via-slate-950/80 dark:to-slate-900/80">
            <div className="space-y-1">
              <div className="space-y-1">
                <CardTitle className="text-base tracking-tight">Registration Questions</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dynamic, event-specific questions.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {dynamicFormFields.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No custom questions yet</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add one to collect dietary preferences, transport needs, or anything else.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dynamicFormFields.map((field, index) => {
                  return (
                    <DynamicQuestionCard
                      key={field.id}
                      field={field}
                      index={index}
                      onUpdate={updateDynamicField}
                      onRemove={removeDynamicField}
                    />
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex justify-center">
              <div
                className={`question-type-picker ${questionTypePickerOpen ? "is-open" : ""}`}
                onMouseEnter={openQuestionTypePicker}
                onMouseLeave={closeQuestionTypePickerWithDelay}
              >
                <div className="question-type-picker-options" role="menu" aria-label="Add question type">
                  {questionTypeOptions.map((option) => {
                    const OptionIcon = option.icon;

                    return (
                      <button
                        key={option.type}
                        type="button"
                        role="menuitem"
                        className="question-type-picker-option"
                        data-question-type={option.type}
                        onClick={() => addDynamicField(option.type)}
                      >
                        <OptionIcon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  size="icon"
                  onClick={() => setQuestionTypePickerOpen((current) => !current)}
                  className="question-type-picker-trigger"
                  aria-label="Add question"
                  aria-expanded={questionTypePickerOpen}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="sticky bottom-0 border border-slate-200/80 bg-white/95 shadow-[0_-8px_24px_-20px_rgba(15,23,42,0.45)] backdrop-blur animate-fade-in dark:border-slate-800 dark:bg-slate-950/85 dark:shadow-[0_-8px_24px_-20px_rgba(0,0,0,0.8)]">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Clock3 className="h-3.5 w-3.5" />
                {minimumRequiredMissing ? "Complete required fields to publish" : dynamicFieldsInvalid ? "Complete question fields to publish" : "Ready to publish"}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full transition-all duration-200 hover:bg-slate-50 hover:text-black dark:border-slate-700 dark:hover:bg-slate-900"
                  disabled={isSubmitting}
                  onClick={() => {
                    void submit('draft');
                  }}
                >
                  {submittingMode === 'draft' ? 'Saving draft...' : 'Save draft'}
                </Button>
                <Button type="submit" className="rounded-full transition-all duration-200 hover:shadow-lg" disabled={isSubmitting || minimumRequiredMissing || dynamicFieldsInvalid}>
                  {submittingMode === 'publish' ? 'Publishing...' : 'Publish event'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

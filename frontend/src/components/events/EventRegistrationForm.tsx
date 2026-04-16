import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TouchTooltip } from "../ui/tooltip";

const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,14}$/;
const SCHOOL_TEXT_REGEX = /^[A-Za-z0-9À-ÖØ-öø-ÿ .,'()&+\/-]{2,100}$/;

type EventFormFieldOption = {
  id: string;
  value: string;
  label: string;
};

type EventFormField = {
  id: string;
  label: string;
  help_text?: string | null;
  field_type: "short_text" | "checkbox_multi" | "radio_single";
  is_required: boolean;
  options: EventFormFieldOption[];
};

type RegistrationProfile = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: "male" | "female" | "";
  is_student: boolean;
  university_name: string;
  study_program: string;
  is_alumnus: boolean;
};

type UserProfile = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  gender?: string;
  study_program?: string;
};

type EventRegistrationFormProps = {
  event: {
    id: number;
    invitation: string;
    price_member: number;
    price_nonmember: number;
    price_alumnus: number;
    form_fields?: EventFormField[];
    is_registered?: boolean;
  };
  isSignedIn: boolean;
  user: UserProfile | null;
  onRegistered: (eventId: number) => void;
};

const getInvitationType = (invitation?: string) => invitation ?? "non_students";

const allowsAlumni = (invitationType: string) =>
  invitationType === "alumni" || invitationType === "all_students" || invitationType === "non_students";

const getProfileRegexError = (
  profile: RegistrationProfile,
  invitationType: string,
  signedIn: boolean,
): string | null => {
  if (signedIn) {
    return null;
  }

  if (!NAME_REGEX.test(profile.first_name) || !NAME_REGEX.test(profile.last_name)) {
    return "Please enter a valid first and last name.";
  }
  if (!EMAIL_REGEX.test(profile.email)) {
    return "Please enter a valid email address.";
  }
  if (!PHONE_REGEX.test(profile.phone_number)) {
    return "Please enter a valid phone number.";
  }

  if (invitationType === "non_members") {
    if (!profile.is_student || profile.is_alumnus) {
      return "This invitation requires student status and does not allow alumni.";
    }
    if (!SCHOOL_TEXT_REGEX.test(profile.study_program)) {
      return "Please enter a valid study program.";
    }
  }

  if (invitationType === "alumni") {
    if (!profile.is_student && !profile.is_alumnus) {
      return "Please confirm student or alumnus status.";
    }
    if (!profile.is_alumnus && !SCHOOL_TEXT_REGEX.test(profile.study_program)) {
      return "Please enter a valid study program.";
    }
  }

  if (invitationType === "all_students") {
    if (!profile.is_student && !profile.is_alumnus) {
      return "Please confirm student or alumnus status.";
    }
    if (!profile.is_alumnus) {
      if (!SCHOOL_TEXT_REGEX.test(profile.university_name)) {
        return "Please enter a valid university name.";
      }
      if (!SCHOOL_TEXT_REGEX.test(profile.study_program)) {
        return "Please enter a valid study program.";
      }
    }
  }

  if (invitationType === "non_students" && profile.is_student) {
    if (!SCHOOL_TEXT_REGEX.test(profile.university_name)) {
      return "Please enter a valid university name.";
    }
    if (!SCHOOL_TEXT_REGEX.test(profile.study_program)) {
      return "Please enter a valid study program.";
    }
  }

  return null;
};

export const EventRegistrationForm = ({ event, isSignedIn, user, onRegistered }: EventRegistrationFormProps) => {
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(Boolean(event.is_registered));
  const [registrationProfile, setRegistrationProfile] = useState<RegistrationProfile>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    gender: "",
    is_student: false,
    university_name: "",
    study_program: "",
    is_alumnus: false,
  });
  const [fieldAnswers, setFieldAnswers] = useState<Record<string, string | string[]>>({});

  useEffect(() => {
    setIsAlreadyRegistered(Boolean(event.is_registered));
    setRegistrationProfile({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
      gender: user?.gender === "male" || user?.gender === "female" ? user.gender : "",
      is_student: Boolean(user),
      university_name: user ? "Lund University" : "",
      study_program: user?.study_program || "",
      is_alumnus: false,
    });
    setFieldAnswers({});
  }, [event.id, event.is_registered, user]);

  const invitationType = getInvitationType(event.invitation);

  const updateProfileField = (field: keyof RegistrationProfile, value: string | boolean) => {
    setRegistrationProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateAnswer = (fieldId: string, value: string | string[]) => {
    setFieldAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const toggleCheckboxAnswer = (fieldId: string, value: string, checked: boolean) => {
    setFieldAnswers((prev) => {
      const current = Array.isArray(prev[fieldId]) ? (prev[fieldId] as string[]) : [];
      if (checked) {
        return { ...prev, [fieldId]: [...new Set([...current, value])] };
      }
      return { ...prev, [fieldId]: current.filter((item) => item !== value) };
    });
  };

  const getRegistrationPrice = () => {
    if (isSignedIn) {
      return event.price_member;
    }
    if (registrationProfile.is_alumnus) {
      return event.price_alumnus;
    }
    return event.price_nonmember;
  };

  const isFormReadyForSubmission = () => {
    if (isSubmittingRegistration || isAlreadyRegistered) {
      return false;
    }

    for (const field of event.form_fields || []) {
      if (!field.is_required) {
        continue;
      }
      const value = fieldAnswers[field.id];
      if (field.field_type === "short_text") {
        if (typeof value !== "string" || !value.trim()) {
          return false;
        }
      } else if (field.field_type === "radio_single") {
        if (typeof value !== "string" || !value) {
          return false;
        }
      } else if (!Array.isArray(value) || value.length === 0) {
        return false;
      }
    }

    if (isSignedIn) {
      return true;
    }

    if (getProfileRegexError(registrationProfile, invitationType, isSignedIn)) {
      return false;
    }

    if (invitationType === "non_members") {
      return registrationProfile.is_student && !registrationProfile.is_alumnus && Boolean(registrationProfile.study_program.trim());
    }

    if (invitationType === "alumni") {
      if (!registrationProfile.is_student && !registrationProfile.is_alumnus) {
        return false;
      }
      if (registrationProfile.is_alumnus) {
        return true;
      }
      return Boolean(registrationProfile.study_program.trim());
    }

    if (invitationType === "all_students") {
      if (!registrationProfile.is_student && !registrationProfile.is_alumnus) {
        return false;
      }
      if (registrationProfile.is_alumnus) {
        return true;
      }
      return Boolean(registrationProfile.university_name.trim()) && Boolean(registrationProfile.study_program.trim());
    }

    if (invitationType === "non_students") {
      if (!registrationProfile.is_student) {
        return true;
      }
      return Boolean(registrationProfile.university_name.trim()) && Boolean(registrationProfile.study_program.trim());
    }

    return true;
  };

  const handleSubmitRegistration = async () => {
    if (isAlreadyRegistered) {
      return;
    }

    setIsSubmittingRegistration(true);
    try {
      let profilePayload = {
        ...registrationProfile,
        study_program: registrationProfile.study_program || null,
      };

      if (!isSignedIn) {
        const requiresStudent =
          invitationType === "non_members" || invitationType === "alumni" || invitationType === "all_students";
        const shouldLockToLund = invitationType === "non_members" || invitationType === "alumni";

        if (!allowsAlumni(invitationType)) {
          profilePayload.is_alumnus = false;
        }

        if (profilePayload.is_alumnus) {
          profilePayload.is_student = false;
          profilePayload.study_program = null;
          if (shouldLockToLund) {
            profilePayload.university_name = "Lund University";
          }
        } else {
          if (requiresStudent && !profilePayload.is_student) {
            toast.error("Student status is required for this invitation type.");
            setIsSubmittingRegistration(false);
            return;
          }

          if (profilePayload.is_student) {
            if (shouldLockToLund) {
              profilePayload.university_name = "Lund University";
            }
            if (invitationType === "all_students" || invitationType === "non_students") {
              if (!profilePayload.university_name) {
                toast.error("University name is required for students.");
                setIsSubmittingRegistration(false);
                return;
              }
            }
            if (!profilePayload.study_program) {
              toast.error("Study program is required.");
              setIsSubmittingRegistration(false);
              return;
            }
          } else {
            profilePayload.study_program = null;
          }
        }
      }

      const profileRegexError = getProfileRegexError(profilePayload, invitationType, isSignedIn);
      if (profileRegexError) {
        toast.error(profileRegexError);
        setIsSubmittingRegistration(false);
        return;
      }

      const answers = (event.form_fields || [])
        .map((field) => {
          const rawValue = fieldAnswers[field.id];
          if (field.field_type === "short_text") {
            return {
              field_id: field.id,
              short_text_value: typeof rawValue === "string" ? rawValue : "",
            };
          }
          if (field.field_type === "radio_single") {
            return {
              field_id: field.id,
              selected_option_value: typeof rawValue === "string" ? rawValue : "",
            };
          }
          return {
            field_id: field.id,
            selected_options_json: Array.isArray(rawValue) ? rawValue : [],
          };
        })
        .filter((answer) => {
          if ("short_text_value" in answer) {
            return Boolean(answer.short_text_value?.trim());
          }
          if ("selected_option_value" in answer) {
            return Boolean(answer.selected_option_value);
          }
          return Array.isArray(answer.selected_options_json) && answer.selected_options_json.length > 0;
        });

      const { error: regError } = await supabase.from("event_registrations").insert({
        event_id: event.id,
        profile_data: profilePayload,
        answers: answers
      });
      if (regError) throw regError;

      toast.success("Registration submitted successfully");
      setIsAlreadyRegistered(true);
      onRegistered(event.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit registration");
    } finally {
      setIsSubmittingRegistration(false);
    }
  };

  const renderDynamicField = (field: EventFormField) => {
    if (field.field_type === "short_text") {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={`field-${field.id}`}>{field.label}{field.is_required ? " *" : ""}</Label>
          <Input
            id={`field-${field.id}`}
            value={typeof fieldAnswers[field.id] === "string" ? (fieldAnswers[field.id] as string) : ""}
            onChange={(e) => updateAnswer(field.id, e.target.value)}
            placeholder={field.help_text || ""}
          />
        </div>
      );
    }

    if (field.field_type === "radio_single") {
      return (
        <div key={field.id} className="space-y-2">
          <p className="font-medium text-sm">{field.label}{field.is_required ? " *" : ""}</p>
          <div className="space-y-2">
            {field.options.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  checked={fieldAnswers[field.id] === option.value}
                  onChange={() => updateAnswer(field.id, option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-2">
        <p className="font-medium text-sm">{field.label}{field.is_required ? " *" : ""}</p>
        <div className="space-y-2">
          {field.options.map((option) => {
            const selected = Array.isArray(fieldAnswers[field.id])
              ? (fieldAnswers[field.id] as string[])
              : [];
            const isChecked = selected.includes(option.value);
            return (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => toggleCheckboxAnswer(field.id, option.value, Boolean(checked))}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const showAlumni = allowsAlumni(invitationType);
  const requireStudent = invitationType === "non_members" || invitationType === "alumni" || invitationType === "all_students";
  const lockUniversityToLund = invitationType === "non_members" || invitationType === "alumni";
  const showStudentToggle = invitationType === "non_members" || invitationType === "alumni" || invitationType === "all_students" || invitationType === "non_students";
  const showUniversityInput = !registrationProfile.is_alumnus && (
    invitationType === "all_students" ||
    (invitationType === "non_students" && registrationProfile.is_student)
  );
  const showProgramInput = !registrationProfile.is_alumnus && (
    invitationType === "non_members" ||
    invitationType === "alumni" ||
    invitationType === "all_students" ||
    (invitationType === "non_students" && registrationProfile.is_student)
  );

  return (
    <>
      <div className="expanded-form-placeholder mt-8 rounded-lg border border-border p-4 md:p-6 space-y-4">
        <h3 className="text-xl font-semibold">Event Registration</h3>

        {isSignedIn ? (
          <p className="text-sm text-muted-foreground">
            You are signed in. We will use your saved member profile, so only additional event questions are required.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="first_name">First name *</Label>
                <Input id="first_name" value={registrationProfile.first_name} onChange={(e) => updateProfileField("first_name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name">Last name *</Label>
                <Input id="last_name" value={registrationProfile.last_name} onChange={(e) => updateProfileField("last_name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={registrationProfile.email} onChange={(e) => updateProfileField("email", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone_number">Phone number *</Label>
                <Input id="phone_number" value={registrationProfile.phone_number} onChange={(e) => updateProfileField("phone_number", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">Gender *</p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="gender"
                    checked={registrationProfile.gender === "male"}
                    onChange={() => updateProfileField("gender", "male")}
                  />
                  <span>Male 🧔🏻‍♂️</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="gender"
                    checked={registrationProfile.gender === "female"}
                    onChange={() => updateProfileField("gender", "female")}
                  />
                  <span>Female 🧕🏻</span>
                </label>
              </div>
            </div>

              {showStudentToggle && (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={registrationProfile.is_student}
                    onCheckedChange={(checked) => {
                      const next = Boolean(checked);
                      updateProfileField("is_student", next);
                      if (next) {
                        updateProfileField("is_alumnus", false);
                      }
                    }}
                  />
                  <span>I am a student {requireStudent ? "*" : ""}</span>
                </label>
              )}
            <div className="flex flex-wrap gap-5">
              {showAlumni && (
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={registrationProfile.is_alumnus}
                        onCheckedChange={(checked) => {
                        const next = Boolean(checked);
                        updateProfileField("is_alumnus", next);
                        if (next) {
                            updateProfileField("is_student", false);
                            updateProfileField("study_program", "");
                        }
                        }}
                    />
                    <TouchTooltip
                    triggerClassName="inline-flex items-center"
                    contentClassName="text-sm"
                    content="Only LU alumni!"
                    >
                        <span>I am an alumnus</span><sup className="text-xxs text-blue-500">?</sup>
                    </TouchTooltip>
                </label>
              )}
            </div>

            {lockUniversityToLund && !registrationProfile.is_alumnus && (
              <p className="text-sm text-muted-foreground">University: Lund University</p>
            )}

            {(showUniversityInput || showProgramInput) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {showUniversityInput && (
                  <div className="space-y-1">
                    <Label htmlFor="university_name">University *</Label>
                    <Input id="university_name" value={registrationProfile.university_name} onChange={(e) => updateProfileField("university_name", e.target.value)} />
                  </div>
                )}
                {showProgramInput && (
                  <div className="space-y-1">
                    <Label htmlFor="study_program">Study program *</Label>
                    <Input id="study_program" value={registrationProfile.study_program} onChange={(e) => updateProfileField("study_program", e.target.value)} />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {(event.form_fields || []).length > 0 && (
          <div className="space-y-4 pt-2 border-t border-border">
            <h4 className="text-lg font-semibold">Additional Questions</h4>
            {(event.form_fields || []).map((field) => renderDynamicField(field))}
          </div>
        )}
      </div>

      <div className="expanded-card-footer flex items-center justify-between gap-4">
        <div className="text-xl font-semibold">{getRegistrationPrice()} SEK</div>
        <Button
          onClick={handleSubmitRegistration}
          disabled={!isFormReadyForSubmission()}
          variant={isAlreadyRegistered ? "outline" : "default"}
          className={isAlreadyRegistered ? "border-green-600 text-green-600 hover:bg-green-50" : ""}
        >
          {isAlreadyRegistered ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Registered!
            </span>
          ) : isSubmittingRegistration ? (
            "Submitting..."
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </>
  );
};

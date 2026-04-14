import { Express } from 'express';
import { $Enums, PrismaClient } from '@prisma/client';
import { authenticateTokenOptional, AuthRequest } from '../auth';
import {
    boolOrDefault,
    DEFAULT_UNIVERSITY_NAME,
    EMAIL_REGEX,
    EVENT_INVITATION_MEMBERS_ONLY,
    FORBIDDEN_REGISTRATION_BODY_KEYS,
    isGender,
    NAME_REGEX,
    normalizeFieldOptions,
    normalizeTrimmed,
    PHONE_REGEX,
    RegistrationAnswerPayload,
    RegistrationProfilePayload,
    SCHOOL_TEXT_REGEX,
} from './shared';

export function setupEventRegistrationRoutes(app: Express, prisma: PrismaClient) {
    // POST /api/events/:id/register
    app.post('/api/events/:id/register', authenticateTokenOptional, async (req: AuthRequest, res) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: 'Invalid event id' });
            }

            const forbiddenKey = Object.keys(req.body ?? {}).find((key) => FORBIDDEN_REGISTRATION_BODY_KEYS.has(key));
            if (forbiddenKey) {
                return res.status(400).json({ error: `Forbidden registration payload field: ${forbiddenKey}` });
            }

            const bodyProfile = (req.body?.profile ?? {}) as RegistrationProfilePayload;
            const bodyAnswers = Array.isArray(req.body?.answers) ? (req.body.answers as RegistrationAnswerPayload[]) : [];

            if (!bodyAnswers.every((answer) => answer && typeof answer.field_id === 'string' && normalizeTrimmed(answer.field_id))) {
                return res.status(400).json({ error: 'Invalid answers payload. Each answer must include a valid field_id.' });
            }

            const event = await prisma.events_info.findUnique({ where: { id } });
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            if (event.deadline < new Date()) {
                return res.status(400).json({ error: 'Registration deadline has passed.' });
            }
            if (!req.user && event.invitation === EVENT_INVITATION_MEMBERS_ONLY) {
                return res.status(403).json({ error: 'This event is only available to members.' });
            }

            let userRecord: {
                id: bigint;
                first_name: string;
                last_name: string;
                email: string;
                phone_number: string;
                gender: $Enums.Gender;
                study_program: string;
            } | null = null;

            if (req.user?.id) {
                userRecord = await prisma.users.findUnique({
                    where: { id: BigInt(req.user.id) },
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                        gender: true,
                        study_program: true,
                    },
                });

                if (!userRecord) {
                    return res.status(401).json({ error: 'User no longer exists. Please sign in again.' });
                }
            }

            const first_name = userRecord ? userRecord.first_name : normalizeTrimmed(bodyProfile.first_name);
            const last_name = userRecord ? userRecord.last_name : normalizeTrimmed(bodyProfile.last_name);
            const email = userRecord ? userRecord.email : normalizeTrimmed(bodyProfile.email);
            const phone_number = userRecord ? userRecord.phone_number : normalizeTrimmed(bodyProfile.phone_number);
            const genderValue = userRecord ? userRecord.gender : normalizeTrimmed(bodyProfile.gender);
            let university_name = userRecord
                ? DEFAULT_UNIVERSITY_NAME
                : normalizeTrimmed(bodyProfile.university_name);
            let study_program = userRecord
                ? normalizeTrimmed(userRecord.study_program) || null
                : normalizeTrimmed(bodyProfile.study_program) || null;
            let is_student = userRecord ? true : boolOrDefault(bodyProfile.is_student, false);
            let is_alumnus = userRecord ? false : boolOrDefault(bodyProfile.is_alumnus, false);

            if (!first_name || !last_name || !email || !phone_number || !genderValue) {
                return res.status(400).json({ error: 'Missing essential fields in profile.' });
            }
            if (!NAME_REGEX.test(first_name) || !NAME_REGEX.test(last_name)) {
                return res.status(400).json({ error: 'Invalid first or last name format.' });
            }
            if (!EMAIL_REGEX.test(email)) {
                return res.status(400).json({ error: 'Invalid email format.' });
            }
            if (!PHONE_REGEX.test(phone_number)) {
                return res.status(400).json({ error: 'Invalid phone number format.' });
            }
            if (!isGender(genderValue)) {
                return res.status(400).json({ error: 'Invalid gender value.' });
            }

            // Signed-in users are always members; only dynamic fields are needed from UI.
            // We still persist a consistent snapshot for organizers.
            if (userRecord) {
                is_student = true;
                is_alumnus = false;
                university_name = DEFAULT_UNIVERSITY_NAME;
            } else {
                const invite = event.invitation;

                if (is_student && is_alumnus) {
                    return res.status(400).json({ error: 'Choose either student or alumnus status, not both.' });
                }

                if (invite === 'non_members') {
                    if (is_alumnus) {
                        return res.status(400).json({ error: 'Alumni are not allowed for this event.' });
                    }
                    if (!is_student) {
                        return res.status(400).json({ error: 'This event is only for students.' });
                    }
                    university_name = DEFAULT_UNIVERSITY_NAME;
                    if (!study_program) {
                        return res.status(400).json({ error: 'Study program is required for this event.' });
                    }
                    if (!SCHOOL_TEXT_REGEX.test(study_program)) {
                        return res.status(400).json({ error: 'Invalid study program format.' });
                    }
                }

                if (invite === 'alumni') {
                    if (!is_alumnus && !is_student) {
                        return res.status(400).json({ error: 'This event is for students or alumni.' });
                    }
                    university_name = DEFAULT_UNIVERSITY_NAME;
                    if (is_alumnus) {
                        study_program = null;
                    } else if (!study_program) {
                        return res.status(400).json({ error: 'Study program is required for students.' });
                    } else if (!SCHOOL_TEXT_REGEX.test(study_program)) {
                        return res.status(400).json({ error: 'Invalid study program format.' });
                    }
                }

                if (invite === 'all_students') {
                    if (!is_alumnus && !is_student) {
                        return res.status(400).json({ error: 'This event is for students or alumni.' });
                    }
                    if (is_alumnus) {
                        study_program = null;
                    } else {
                        if (!university_name) {
                            return res.status(400).json({ error: 'University name is required for students.' });
                        }
                        if (!SCHOOL_TEXT_REGEX.test(university_name)) {
                            return res.status(400).json({ error: 'Invalid university name format.' });
                        }
                        if (!study_program) {
                            return res.status(400).json({ error: 'Study program is required for students.' });
                        }
                        if (!SCHOOL_TEXT_REGEX.test(study_program)) {
                            return res.status(400).json({ error: 'Invalid study program format.' });
                        }
                    }
                }

                if (invite === 'non_students') {
                    if (is_student) {
                        if (!university_name) {
                            return res.status(400).json({ error: 'University name is required for students.' });
                        }
                        if (!SCHOOL_TEXT_REGEX.test(university_name)) {
                            return res.status(400).json({ error: 'Invalid university name format.' });
                        }
                        if (!study_program) {
                            return res.status(400).json({ error: 'Study program is required for students.' });
                        }
                        if (!SCHOOL_TEXT_REGEX.test(study_program)) {
                            return res.status(400).json({ error: 'Invalid study program format.' });
                        }
                    } else {
                        study_program = null;
                    }
                }

                if (!university_name) {
                    university_name = 'N/A';
                }
            }

            const formFields = await prisma.event_form_fields.findMany({
                where: { event_id: id, active: true },
                orderBy: { sort_order: 'asc' },
            });

            const fieldById = new Map(formFields.map((field) => [field.id, field]));
            const seenAnswerFieldIds = new Set<string>();
            for (const answer of bodyAnswers) {
                const fieldId = normalizeTrimmed(answer.field_id);
                if (seenAnswerFieldIds.has(fieldId)) {
                    return res.status(400).json({ error: `Duplicate answer submitted for field id: ${fieldId}` });
                }
                seenAnswerFieldIds.add(fieldId);

                if (!fieldById.has(fieldId)) {
                    return res.status(400).json({ error: `Unknown form field id submitted: ${fieldId}` });
                }
            }

            const answersByFieldId = new Map(bodyAnswers.map((answer) => [answer.field_id, answer]));

            for (const field of formFields) {
                const answer = answersByFieldId.get(field.id);
                if (!answer) {
                    if (field.is_required) {
                        return res.status(400).json({ error: `Missing required answer for field: ${field.question}` });
                    }
                    continue;
                }

                if (field.field_type === 'short_text') {
                    const text = normalizeTrimmed(typeof answer.value === 'string' ? answer.value : '');
                    if (field.is_required && !text) {
                        return res.status(400).json({ error: `Field requires a text answer: ${field.question}` });
                    }
                }

                if (field.field_type === 'radio_single') {
                    const selected = normalizeTrimmed(typeof answer.value === 'string' ? answer.value : '');
                    const validOptions = new Set(normalizeFieldOptions(field.options));
                    if (!selected && field.is_required) {
                        return res.status(400).json({ error: `Field requires one selected option: ${field.question}` });
                    }
                    if (selected && !validOptions.has(selected)) {
                        return res.status(400).json({ error: `Invalid option selected for field: ${field.question}` });
                    }
                }

                if (field.field_type === 'checkbox_multi') {
                    const selectedOptions = Array.isArray(answer.value)
                        ? answer.value.map((item) => normalizeTrimmed(typeof item === 'string' ? item : '')).filter(Boolean)
                        : [];
                    const validOptions = new Set(normalizeFieldOptions(field.options));
                    if (selectedOptions.length === 0 && field.is_required) {
                        return res.status(400).json({ error: `Field requires at least one option: ${field.question}` });
                    }
                    const hasInvalidOption = selectedOptions.some((value) => !validOptions.has(value));
                    if (hasInvalidOption) {
                        return res.status(400).json({ error: `Invalid option selected for field: ${field.question}` });
                    }
                }
            }

            // Price is always resolved server-side from trusted sources after profile validation.
            const quotedPrice = userRecord
                ? event.price_member
                : is_alumnus
                    ? event.price_alumnus
                    : event.price_nonmember;

            const result = await prisma.$transaction(async (tx) => {
                if (userRecord) {
                    const existingMemberRegistration = await tx.event_registrations.findFirst({
                        where: {
                            event_id: id,
                            user_id: userRecord.id,
                            status: { not: 'cancelled' },
                        },
                    });
                    if (existingMemberRegistration) {
                        throw new Error('You are already registered for this event.');
                    }
                } else {
                    const existingGuestRegistration = await tx.event_registrations.findFirst({
                        where: {
                            event_id: id,
                            status: { not: 'cancelled' },
                            profile: {
                                is: {
                                    email,
                                    phone_number,
                                },
                            },
                        },
                    });
                    if (existingGuestRegistration) {
                        throw new Error('A registration already exists for this email and phone number.');
                    }
                }

                const registration = await tx.event_registrations.create({
                    data: {
                        event_id: id,
                        user_id: userRecord?.id,
                        status: 'pending',
                        invitation_snapshot: event.invitation,
                        siblings_snapshot: event.siblings,
                        quoted_price: quotedPrice,
                        payment_required: false,
                    },
                });

                await tx.event_registration_profiles.create({
                    data: {
                        registration_id: registration.id,
                        first_name,
                        last_name,
                        email,
                        phone_number,
                        gender: genderValue,
                        is_student,
                        university_name,
                        study_program,
                        is_alumnus,
                    },
                });

                const answerRows: {
                    registration_id: string;
                    field_id: string;
                    answer_payload: string | string[];
                    field_type_snapshot: $Enums.EventFormFieldType;
                    field_question_snapshot: string;
                }[] = [];

                for (const answer of bodyAnswers) {
                    const field = fieldById.get(answer.field_id);
                    if (!field) {
                        continue;
                    }

                    const answerPayload = field.field_type === 'checkbox_multi'
                        ? (Array.isArray(answer.value)
                            ? answer.value.map((value) => normalizeTrimmed(typeof value === 'string' ? value : '')).filter(Boolean)
                            : [])
                        : normalizeTrimmed(typeof answer.value === 'string' ? answer.value : '');

                    const answerRow = {
                        registration_id: registration.id,
                        field_id: field.id,
                        answer_payload: answerPayload,
                        field_type_snapshot: field.field_type,
                        field_question_snapshot: field.question,
                    };

                    answerRows.push(answerRow);
                }

                if (answerRows.length > 0) {
                    await tx.event_registration_field_answers.createMany({
                        data: answerRows,
                    });
                }

                return registration;
            });

            res.status(201).json({
                message: 'Registration submitted successfully',
                registration_id: result.id,
                status: result.status,
            });

            console.log('POST: /events/:id/register');
        } catch (error) {
            console.error('Register event error:', error);
            const message = error instanceof Error ? error.message : 'Internal server error';
            if (message === 'You are already registered for this event.' || message === 'A registration already exists for this email and phone number.') {
                return res.status(409).json({ error: message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}

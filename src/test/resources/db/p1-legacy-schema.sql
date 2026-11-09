--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth_provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.auth_provider AS ENUM (
    'LOCAL',
    'GOOGLE',
    'FACEBOOK'
);


--
-- Name: authprovider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.authprovider AS ENUM (
    'FACEBOOK',
    'GOOGLE',
    'LOCAL'
);


--
-- Name: correct_option; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.correct_option AS ENUM (
    'A',
    'B',
    'C',
    'D'
);


--
-- Name: day_of_week; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.day_of_week AS ENUM (
    'THU_2',
    'THU_3',
    'THU_4',
    'THU_5',
    'THU_6',
    'THU_7',
    'CHU_NHAT'
);


--
-- Name: document_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_status AS ENUM (
    'UPLOADED',
    'PROCESSING',
    'EXTRACTED',
    'FAILED'
);


--
-- Name: file_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.file_type AS ENUM (
    'PDF',
    'DOCX',
    'PPTX'
);


--
-- Name: importance_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.importance_level AS ENUM (
    'NORMAL',
    'IMPORTANT',
    'KEY_POINT'
);


--
-- Name: shift_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.shift_type AS ENUM (
    'SANG',
    'CHIEU',
    'TOI'
);


--
-- Name: source_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.source_type AS ENUM (
    'NOTE',
    'DOCUMENT'
);


--
-- Name: subject_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subject_type AS ENUM (
    'SCHOOL',
    'SELF_STUDY',
    'LANGUAGE'
);


--
-- Name: task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_status AS ENUM (
    'TODO',
    'DOING',
    'DONE'
);


--
-- Name: CAST (public.authprovider AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.authprovider AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.authprovider); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.authprovider) WITH INOUT AS IMPLICIT;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_user (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    full_name character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    avatar_url character varying(500),
    provider public.auth_provider DEFAULT 'LOCAL'::public.auth_provider NOT NULL,
    provider_id character varying(255)
);


--
-- Name: app_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_user_id_seq OWNED BY public.app_user.id;


--
-- Name: async_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.async_jobs (
    job_id character varying(64) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    error_message text,
    job_type character varying(50) NOT NULL,
    result_json text,
    status character varying(20) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id bigint,
    CONSTRAINT async_jobs_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying])::text[])))
);


--
-- Name: document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document (
    id bigint NOT NULL,
    subject_id bigint NOT NULL,
    schedule_slot_id bigint,
    file_name character varying(255) NOT NULL,
    file_type public.file_type NOT NULL,
    file_url character varying(500) NOT NULL,
    extracted_text text,
    upload_date timestamp without time zone DEFAULT now() NOT NULL,
    status public.document_status DEFAULT 'UPLOADED'::public.document_status NOT NULL
);


--
-- Name: document_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.document_id_seq OWNED BY public.document.id;


--
-- Name: memo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memo (
    id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    memo_date date,
    subject_id bigint,
    task_id bigint,
    user_id bigint NOT NULL
);


--
-- Name: memo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.memo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mindmap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mindmap (
    id bigint NOT NULL,
    source_type public.source_type NOT NULL,
    source_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    structure jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mindmap_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mindmap_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mindmap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mindmap_id_seq OWNED BY public.mindmap.id;


--
-- Name: note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.note (
    id bigint NOT NULL,
    subject_id bigint NOT NULL,
    schedule_slot_id bigint,
    title character varying(255) NOT NULL,
    content text,
    importance_level public.importance_level DEFAULT 'NORMAL'::public.importance_level NOT NULL,
    ai_summary text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: note_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.note_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: note_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.note_id_seq OWNED BY public.note.id;


--
-- Name: note_image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.note_image (
    id bigint NOT NULL,
    note_id bigint NOT NULL,
    image_url character varying(500) NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: note_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.note_image_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: note_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.note_image_id_seq OWNED BY public.note_image.id;


--
-- Name: quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz (
    id bigint NOT NULL,
    source_type public.source_type NOT NULL,
    source_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_attempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempt (
    id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    user_id bigint NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    attempted_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_attempt_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_attempt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_attempt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_attempt_id_seq OWNED BY public.quiz_attempt.id;


--
-- Name: quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_id_seq OWNED BY public.quiz.id;


--
-- Name: quiz_question; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_question (
    id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    question_text text NOT NULL,
    option_a character varying(500) NOT NULL,
    option_b character varying(500) NOT NULL,
    option_c character varying(500) NOT NULL,
    option_d character varying(500) NOT NULL,
    correct_option public.correct_option NOT NULL,
    explanation text
);


--
-- Name: quiz_question_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_question_id_seq OWNED BY public.quiz_question.id;


--
-- Name: refresh_token; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_token (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token character varying(500) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_token_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_token_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_token_id_seq OWNED BY public.refresh_token.id;


--
-- Name: schedule_slot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_slot (
    id bigint NOT NULL,
    subject_id bigint NOT NULL,
    day_of_week public.day_of_week NOT NULL,
    date date,
    shift public.shift_type NOT NULL,
    periods character varying(50),
    start_time time without time zone,
    end_time time without time zone,
    is_online boolean DEFAULT false NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    teacher_name character varying(255),
    teacher_phone character varying(20),
    department character varying(255),
    room character varying(100)
);


--
-- Name: schedule_slot_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_slot_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_slot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_slot_id_seq OWNED BY public.schedule_slot.id;


--
-- Name: subject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subject (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(20) DEFAULT '#3B82F6'::character varying NOT NULL,
    type public.subject_type DEFAULT 'SCHOOL'::public.subject_type NOT NULL,
    class_code character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: subject_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subject_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subject_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subject_id_seq OWNED BY public.subject.id;


--
-- Name: summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.summary (
    id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    source_id bigint NOT NULL,
    source_type public.source_type NOT NULL,
    title character varying(255) NOT NULL,
    CONSTRAINT summary_source_type_check CHECK ((source_type = ANY (ARRAY['NOTE'::public.source_type, 'DOCUMENT'::public.source_type])))
);


--
-- Name: summary_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.summary_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task (
    id bigint NOT NULL,
    subject_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    deadline timestamp without time zone,
    status character varying(20) DEFAULT 'TODO'::public.task_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp(6) without time zone,
    deleted boolean NOT NULL,
    due_at timestamp(6) without time zone,
    priority character varying(20) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT task_priority_check CHECK (((priority)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying])::text[])))
);


--
-- Name: task_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_id_seq OWNED BY public.task.id;


--
-- Name: app_user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user ALTER COLUMN id SET DEFAULT nextval('public.app_user_id_seq'::regclass);


--
-- Name: document id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document ALTER COLUMN id SET DEFAULT nextval('public.document_id_seq'::regclass);


--
-- Name: mindmap id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mindmap ALTER COLUMN id SET DEFAULT nextval('public.mindmap_id_seq'::regclass);


--
-- Name: note id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note ALTER COLUMN id SET DEFAULT nextval('public.note_id_seq'::regclass);


--
-- Name: note_image id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_image ALTER COLUMN id SET DEFAULT nextval('public.note_image_id_seq'::regclass);


--
-- Name: quiz id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz ALTER COLUMN id SET DEFAULT nextval('public.quiz_id_seq'::regclass);


--
-- Name: quiz_attempt id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempt ALTER COLUMN id SET DEFAULT nextval('public.quiz_attempt_id_seq'::regclass);


--
-- Name: quiz_question id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_question ALTER COLUMN id SET DEFAULT nextval('public.quiz_question_id_seq'::regclass);


--
-- Name: refresh_token id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token ALTER COLUMN id SET DEFAULT nextval('public.refresh_token_id_seq'::regclass);


--
-- Name: schedule_slot id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_slot ALTER COLUMN id SET DEFAULT nextval('public.schedule_slot_id_seq'::regclass);


--
-- Name: subject id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject ALTER COLUMN id SET DEFAULT nextval('public.subject_id_seq'::regclass);


--
-- Name: task id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task ALTER COLUMN id SET DEFAULT nextval('public.task_id_seq'::regclass);


--
-- Name: app_user app_user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_email_key UNIQUE (email);


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);


--
-- Name: async_jobs async_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.async_jobs
    ADD CONSTRAINT async_jobs_pkey PRIMARY KEY (job_id);


--
-- Name: document document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_pkey PRIMARY KEY (id);


--
-- Name: memo memo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memo
    ADD CONSTRAINT memo_pkey PRIMARY KEY (id);


--
-- Name: mindmap mindmap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mindmap
    ADD CONSTRAINT mindmap_pkey PRIMARY KEY (id);


--
-- Name: note_image note_image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_image
    ADD CONSTRAINT note_image_pkey PRIMARY KEY (id);


--
-- Name: note note_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note
    ADD CONSTRAINT note_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempt quiz_attempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempt
    ADD CONSTRAINT quiz_attempt_pkey PRIMARY KEY (id);


--
-- Name: quiz quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_pkey PRIMARY KEY (id);


--
-- Name: quiz_question quiz_question_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_question
    ADD CONSTRAINT quiz_question_pkey PRIMARY KEY (id);


--
-- Name: refresh_token refresh_token_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT refresh_token_pkey PRIMARY KEY (id);


--
-- Name: refresh_token refresh_token_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT refresh_token_token_key UNIQUE (token);


--
-- Name: schedule_slot schedule_slot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_slot
    ADD CONSTRAINT schedule_slot_pkey PRIMARY KEY (id);


--
-- Name: subject subject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject
    ADD CONSTRAINT subject_pkey PRIMARY KEY (id);


--
-- Name: summary summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.summary
    ADD CONSTRAINT summary_pkey PRIMARY KEY (id);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- Name: idx_document_schedule_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_schedule_slot ON public.document USING btree (schedule_slot_id);


--
-- Name: idx_document_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_subject ON public.document USING btree (subject_id);


--
-- Name: idx_mindmap_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mindmap_source ON public.mindmap USING btree (source_type, source_id);


--
-- Name: idx_note_image_note; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_note_image_note ON public.note_image USING btree (note_id);


--
-- Name: idx_note_schedule_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_note_schedule_slot ON public.note USING btree (schedule_slot_id);


--
-- Name: idx_note_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_note_subject ON public.note USING btree (subject_id);


--
-- Name: idx_quiz_attempt_quiz; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_attempt_quiz ON public.quiz_attempt USING btree (quiz_id);


--
-- Name: idx_quiz_attempt_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_attempt_user ON public.quiz_attempt USING btree (user_id);


--
-- Name: idx_quiz_question_quiz; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_question_quiz ON public.quiz_question USING btree (quiz_id);


--
-- Name: idx_quiz_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_source ON public.quiz USING btree (source_type, source_id);


--
-- Name: idx_refresh_token_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_token_user ON public.refresh_token USING btree (user_id);


--
-- Name: idx_schedule_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_date ON public.schedule_slot USING btree (date);


--
-- Name: idx_schedule_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_subject ON public.schedule_slot USING btree (subject_id);


--
-- Name: idx_subject_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subject_user ON public.subject USING btree (user_id);


--
-- Name: idx_task_deadline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_deadline ON public.task USING btree (deadline);


--
-- Name: idx_task_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_status ON public.task USING btree (status);


--
-- Name: idx_task_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_subject ON public.task USING btree (subject_id);


--
-- Name: idx_user_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_provider ON public.app_user USING btree (provider, provider_id) WHERE (provider_id IS NOT NULL);


--
-- Name: note trigger_note_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_note_updated_at BEFORE UPDATE ON public.note FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document document_schedule_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_schedule_slot_id_fkey FOREIGN KEY (schedule_slot_id) REFERENCES public.schedule_slot(id) ON DELETE SET NULL;


--
-- Name: document document_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE;


--
-- Name: memo fk558a8bfptj5q5iq9k308ft3m3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memo
    ADD CONSTRAINT fk558a8bfptj5q5iq9k308ft3m3 FOREIGN KEY (subject_id) REFERENCES public.subject(id);


--
-- Name: memo fk7xi4xoir9dsl77afxek7lln2w; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memo
    ADD CONSTRAINT fk7xi4xoir9dsl77afxek7lln2w FOREIGN KEY (task_id) REFERENCES public.task(id);


--
-- Name: memo fkjgkbioksmn4tpwq2qlxpgeh11; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memo
    ADD CONSTRAINT fkjgkbioksmn4tpwq2qlxpgeh11 FOREIGN KEY (user_id) REFERENCES public.app_user(id);


--
-- Name: task fksh6s1t7gbjr0ja7923du08fi8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT fksh6s1t7gbjr0ja7923du08fi8 FOREIGN KEY (user_id) REFERENCES public.app_user(id);


--
-- Name: note_image note_image_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_image
    ADD CONSTRAINT note_image_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.note(id) ON DELETE CASCADE;


--
-- Name: note note_schedule_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note
    ADD CONSTRAINT note_schedule_slot_id_fkey FOREIGN KEY (schedule_slot_id) REFERENCES public.schedule_slot(id) ON DELETE SET NULL;


--
-- Name: note note_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note
    ADD CONSTRAINT note_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE;


--
-- Name: quiz_attempt quiz_attempt_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempt
    ADD CONSTRAINT quiz_attempt_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE;


--
-- Name: quiz_attempt quiz_attempt_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempt
    ADD CONSTRAINT quiz_attempt_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE;


--
-- Name: quiz_question quiz_question_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_question
    ADD CONSTRAINT quiz_question_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE;


--
-- Name: refresh_token refresh_token_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT refresh_token_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE;


--
-- Name: schedule_slot schedule_slot_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_slot
    ADD CONSTRAINT schedule_slot_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE;


--
-- Name: subject subject_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject
    ADD CONSTRAINT subject_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(id) ON DELETE CASCADE;


--
-- Name: task task_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--



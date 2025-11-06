
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  timetable_image TEXT,
  class_schedule JSONB
);

CREATE TABLE public.subjects (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.study_sessions (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES public.subjects(id),
  user_id UUID REFERENCES public.profiles(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tasks (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES public.subjects(id),
    description TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.blogs (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES public.subjects(id),
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tests (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES public.subjects(id),
    name TEXT NOT NULL,
    date TIMESTAMPTZ,
    score TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.attachments (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES public.subjects(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

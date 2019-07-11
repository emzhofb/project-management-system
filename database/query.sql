-- create database pms.db
CREATE DATABASE "pms.db"
  WITH 
  OWNER = postgres
  ENCODING = 'UTF8'
  CONNECTION LIMIT = -1;

-- create table users
CREATE TABLE public.users
(
  userid serial NOT NULL,
  email character varying(50) NOT NULL,
  password character varying(250) NOT NULL,
  firstname character varying(25),
  lastname character varying(25),
  PRIMARY KEY (userid),
  UNIQUE (email),
  CONSTRAINT roleforeignkey FOREIGN KEY (roleid)
    REFERENCES public.roles (roleid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
)
WITH (
  OIDS = FALSE
);

ALTER TABLE public.users
  OWNER to postgres;

-- create table projects
CREATE TABLE public.projects
(
  projectid serial NOT NULL,
  name character varying(50) NOT NULL,
  PRIMARY KEY (projectid)
)
WITH (
  OIDS = FALSE
);

ALTER TABLE public.projects
  OWNER to postgres;

-- create table members
CREATE TABLE public.members
(
  id serial NOT NULL,
  userid integer,
  roleid integer,
  projectid integer,
  PRIMARY KEY (id),
  CONSTRAINT userforeignkey FOREIGN KEY (userid)
    REFERENCES public.users (userid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION,
  CONSTRAINT roleforeignkey FOREIGN KEY (roleid)
    REFERENCES public.roles (roleid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION,
  CONSTRAINT projectforeignkey FOREIGN KEY (projectid)
    REFERENCES public.projects (projectid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
)
WITH (
  OIDS = FALSE
);

ALTER TABLE public.members
  OWNER to postgres;

-- create table issues
CREATE TABLE public.issues
(
  issueid integer NOT NULL DEFAULT nextval('issues_issueid_seq'::regclass),
  projectid integer,
  tracker character varying(10) COLLATE pg_catalog."default",
  subject character varying(25) COLLATE pg_catalog."default",
  description character varying(250) COLLATE pg_catalog."default",
  status character varying(15) COLLATE pg_catalog."default",
  priority character varying(10) COLLATE pg_catalog."default",
  assignee integer,
  startdate date,
  duedate date,
  estimatedtime integer,
  done boolean,
  files character varying(25) COLLATE pg_catalog."default",
  spenttime integer,
  targetversion numeric,
  author integer,
  createddate date,
  updateddate date,
  closeddate date,
  parenttask integer,
  CONSTRAINT issues_pkey PRIMARY KEY (issueid),
  CONSTRAINT assigneeforeignkey FOREIGN KEY (assignee)
    REFERENCES public.users (userid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION,
  CONSTRAINT authorforeignkey FOREIGN KEY (author)
    REFERENCES public.users (userid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION,
  CONSTRAINT projectforeignkey FOREIGN KEY (projectid)
    REFERENCES public.projects (projectid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION,
  CONSTRAINT parenttaskforeignkey FOREIGN KEY (parenttask)
    REFERENCES public.issues (issueid) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
)
WITH (
  OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.issues
  OWNER to postgres;

-- create table activity
CREATE TABLE public.activity
(
  activityid integer NOT NULL DEFAULT nextval('activity_activityid_seq'::regclass),
  "time" timestamp without time zone,
  title character varying(25) COLLATE pg_catalog."default",
  description character varying(250) COLLATE pg_catalog."default",
  author character varying(25) COLLATE pg_catalog."default",
  CONSTRAINT activity_pkey PRIMARY KEY (activityid)
)
WITH (
  OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.activity
  OWNER to postgres;

-- create table roles
CREATE TABLE public.roles
(
  roleid serial NOT NULL,
  rolename character varying(50),
  PRIMARY KEY (roleid)
)
WITH (
  OIDS = FALSE
);

ALTER TABLE public.roles
  OWNER to postgres;

-- create table queries
CREATE TABLE public.queries
(
  queryid serial NOT NULL,
  columnid character varying(5),
  columnname character varying(5),
  columnmember character varying(5),
  PRIMARY KEY (queryid)
)
WITH (
  OIDS = FALSE
);

ALTER TABLE public.queries
  OWNER to postgres;
